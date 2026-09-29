---
title: "neural-cost: Roofline Analysis Across PyTorch, JAX, and TensorFlow"
description: A framework-neutral Python library that estimates a neural network's FLOPs and tensor traffic, measures its runtime, and uses a roofline model to tell you exactly where performance is being left on the table.
pubDate: 2026-09-28
tags: ['ml', 'performance', 'python', 'pytorch', 'jax', 'tensorflow']
---

When you're tuning a neural network's inference or training loop, there are two
very different questions you can ask. The first is *how fast does this run?* —
and the answer is just a timer. The second is *how fast **should** this run?* —
and that answer requires a model of the hardware itself.

[`neural-cost`](https://github.com/davidgraymi/neural-cost) is a Python library
I've been building to answer that second question, and to do it without
caring which ML framework you happen to be using.

## The core idea: the roofline model

Every kernel your GPU runs is racing against two limits simultaneously:

1. **Compute bound** — the number of floating-point operations divided by the
   chip's peak FLOP/s.
2. **Memory bound** — the number of bytes that have to move between DRAM and the
   chip divided by the chip's peak memory bandwidth.

The *roofline bound* is the maximum of these two, and it represents the fastest
the kernel could possibly run on ideal hardware. The ratio of that lower bound to
the actual observed runtime is *roofline efficiency* — a number from 0 to 100%
that tells you how much headroom is left.

```text
Neural cost gap analysis
  bound: 0.182 ms  (compute 0.012 ms, memory 0.182 ms)
  observed: 1.104 ms
  roofline efficiency: 16.5%  (memory-bound)
  achieved: 94.2 GFLOP/s, 517.4 GB/s
  next: Memory-bound: consider fusion, reduced precision, or fewer materialized tensors.
  next: Large roofline gap: inspect launch overhead, synchronization, shape padding, and data movement.
```

A 16% efficiency score on a memory-bound workload is a clear signal: the
theoretical minimum is being outpaced by factors like kernel launch overhead,
allocator behavior, and unfused intermediate tensors — all concrete things you
can dig into.

## Framework-neutral by design

The library's central abstraction is a [`FrameworkAdapter`](https://github.com/davidgraymi/neural-cost/blob/main/src/neural_cost/adapters/base.py).
It's a small protocol — implement `operations(model, example_inputs)` and return
a list of portable `Operation` records. Everything downstream — FLOPs estimation,
memory analysis, roofline gap analysis — operates on those portable records and
doesn't know or care what produced them.

Three adapters ship out of the box, each as an optional install:

| Adapter | What it captures | Sync strategy |
|---|---|---|
| `TorchAdapter` | `nn.Linear`, `nn.Conv2d` | CUDA synchronization; wraps `torch.profiler` |
| `JaxAdapter` | `dot_general`, common elementwise jaxpr primitives | Waits for async device work |
| `TensorFlowAdapter` | Keras `Dense`, `Conv2D` | TF GPU allocator statistics |

The interface is intentionally easy to extend. If you're running on a custom
accelerator or using a niche framework, you subclass `FrameworkAdapter`, return
your operation records, and the rest of the analysis pipeline just works.

## What you actually measure

There are three distinct quantities the library tracks:

**Cost estimate** — derived statically from operation shapes. For a
`Linear(in=768, out=1000)` with a batch of 32:

- FLOPs: $2 \times 32 \times 768 \times 1000 = 49{,}152{,}000$
- Tensor traffic: input bytes + weight bytes + output bytes
- Arithmetic intensity: FLOPs / bytes (determines which roofline limit applies)

**Measurement** — actual wall-clock samples collected by the adapter, plus any
allocator telemetry the framework exposes (CUDA peak allocation, reserved
memory, etc.).

**Gap analysis** — the comparison of the two, broken down into compute-side and
memory-side bottlenecks with actionable findings.

```python
from neural_cost import HardwareSpec, analyze_gap, estimate_model, benchmark
from neural_cost.adapters import TorchAdapter
import torch

model = torch.nn.Linear(768, 1000, bias=False).eval()
inputs = (torch.randn(32, 768),)
adapter = TorchAdapter()

estimate  = estimate_model(model, inputs, adapter)
measured  = adapter.benchmark(model, *inputs, warmup=10, repeats=30)
hardware  = HardwareSpec("M3 Pro", peak_flops=7.4e12, memory_bandwidth=150e9)
report    = analyze_gap(estimate, measured, hardware)

print(report.render())
```

## Memory profiling for training

Performance isn't only about speed. Training large models means juggling
parameters, gradients, and optimizer state across a fixed VRAM budget.
`profile_model` rolls everything together into a single call:

```python
from neural_cost import profile_model
from neural_cost.adapters import TorchAdapter

profile = profile_model(
    model, inputs, TorchAdapter(),
    training=True,
    optimizer_state_multiplier=2,   # Adam's two moment buffers
)

print(profile.memory.training_minimum_bytes)  # params + grad + optimizer state
```

The static estimate gives you two bounds on activation memory:

- **Minimum peak** — the size of the largest single output tensor (best case,
  assuming perfect liveness analysis).
- **Conservative peak** — the sum of *all* forward output tensors (worst case,
  all outputs live simultaneously).

Real allocator telemetry from an adapter trace sits between these bounds and is
the ground truth for actual VRAM use.

## Cross-framework comparison

One of the motivating use cases is answering *"does PyTorch or JAX run this
workload faster on my machine?"* — without having to wire up timing scaffolding
by hand for each framework.

The included [`compare_frameworks.py`](https://github.com/davidgraymi/neural-cost/blob/main/examples/compare_frameworks.py)
example runs a shared matrix-multiply workload across all installed frameworks
and prints a side-by-side roofline table:

```bash
pip install -e '.[torch,jax,tensorflow]'
python examples/compare_frameworks.py --peak-flops 7.4e12 --memory-bandwidth 150e9
```

```
────────────────────────────────────────────────────────────────────────────────────────
framework    shape           FLOPs   bytes(MB)       AI    ms(med)      ±ms   effic.   roofline               GFLOP/s       GB/s  bound
────────────────────────────────────────────────────────────────────────────────────────
PyTorch      1×1024→1024 2,097,152         8.0      0.3     0.041     0.003    0.7%   [░░░░░░░░░░░░░░░░░░░░]       51.1     171.4  memory
PyTorch      16×1024→1024 33,554,432       12.0      2.8     0.157     0.005   13.2%   [██░░░░░░░░░░░░░░░░░░]      213.7      79.8  memory
PyTorch      64×1024→1024 134,217,728      24.0      5.6     0.284     0.011   29.1%   [█████░░░░░░░░░░░░░░░]      472.6      88.7  memory
PyTorch      256×1024→1024 536,870,912     72.0      7.5     0.978     0.022   33.8%   [██████░░░░░░░░░░░░░░]      548.9      73.9  memory

JAX          1×1024→1024 2,097,152         8.0      0.3     0.038     0.002    0.8%   [░░░░░░░░░░░░░░░░░░░░]       55.2     185.0  memory
JAX          16×1024→1024 33,554,432       12.0      2.8     0.142     0.003   14.6%   [██░░░░░░░░░░░░░░░░░░]      236.3      88.4  memory
...
```

Hardware is auto-detected at startup — Apple Silicon chips are identified via
`system_profiler` and matched against a table of published FP32 TFLOP/s and
bandwidth figures, NVIDIA GPUs via `nvidia-smi`, and everything else falls back
to a conservative CPU estimate from core count and clock speed.

## Scope and what's next

The library is intentionally honest about what it doesn't do yet. It profiles
concrete-shape dense, matrix-multiply, convolution, and common elementwise
graphs. Static training storage models gradients and optimizer state but doesn't
trace a full backward graph. The roadmap includes:

- **Activation checkpointing** — re-materialization trades compute for memory;
  the current conservative bound overstates VRAM when checkpointing is active.
- **Distributed communication** — all-reduce and pipeline-parallel communication
  cost don't appear in per-device FLOPs/traffic counts today.
- **Dynamic shapes** — the static estimator needs concrete shapes at trace time;
  symbolic shape support is on the list.
- **Non-PyTorch kernel traces** — JAX and TensorFlow adapters currently return
  allocator-level telemetry; per-op kernel traces would close that gap.

The package is MIT-licensed and on GitHub at
[github.com/davidgraymi/neural-cost](https://github.com/davidgraymi/neural-cost).
If you're tuning models across frameworks and want a structured way to separate
"how fast is it?" from "how fast could it be?", give it a try.
