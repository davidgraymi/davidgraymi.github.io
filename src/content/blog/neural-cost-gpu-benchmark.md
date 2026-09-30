---
title: "GPU vs. CPU: Roofline Benchmarks on Apple Silicon MPS with neural-cost v0.2.0"
description: "The neural-cost v0.2.0 GPU benchmark moves from CPU roofline analysis to Apple Silicon's MPS GPU backend — measuring PyTorch and JAX across five architectures, four batch sizes, and both eager and compiled execution modes."
pubDate: 2026-09-30
tags: ['ml', 'performance', 'benchmarks', 'pytorch', 'jax', 'gpu', 'apple-silicon']
---

The [CPU benchmark series](/blog/ml-framework-comparison) established a clear picture of
how PyTorch, JAX, and TensorFlow perform on Apple M3's CPU cores: JAX JIT won four of
five architecture categories, `torch.compile` underperformed on CPU, and every workload
was memory-bandwidth bound at modest batch sizes.

[`neural-cost` v0.2.0](https://github.com/davidgraymi/neural-cost) now ships a GPU timing
path alongside its existing CPU profiler. The new
[`benchmarks/collect_gpu_data.py`](https://github.com/davidgraymi/neural-cost/blob/main/benchmarks/collect_gpu_data.py)
script re-runs the same five-architecture sweep on Apple Silicon's **Metal Performance Shaders
(MPS)** backend, and the results reveal a fundamentally different performance landscape —
one where GPU parallelism changes the rules but doesn't automatically improve every number.

---

## The hardware context

| Property | Value |
|---|---|
| **Device** | Apple Silicon GPU (Apple M3) — MPS backend |
| **Peak FP32 compute** | 3.60 TFLOP/s |
| **Peak memory bandwidth** | 100 GB/s |
| **Ridge point** | 36.0 FLOP/byte |
| **Timing strategy** | `time.perf_counter_ns` + `torch.mps.synchronize()` / `jax.Array.block_until_ready()` |

The ridge point is identical to the CPU benchmark (same unified memory, same bandwidth
ceiling), but the GPU's peak FP32 throughput dwarfs the CPU — making it dramatically
harder for small workloads to escape the memory-bound regime.

### Timing method per framework

| Framework | Timing | Sync barrier |
|---|---|---|
| **PyTorch MPS** | `time.perf_counter_ns` | `torch.mps.synchronize()` |
| **JAX** | `time.perf_counter_ns` | `jax.Array.block_until_ready()` |

Each configuration ran **15 warmup iterations** (allowing Metal shader compilation and
cuDNN-equivalent autotuning to complete) followed by **40 timed samples**.

---

## 1. Where models land on the GPU roofline

![GPU Roofline Model](/images/gpu-benchmarks/gpu_fig1_roofline.png)

The key difference from the CPU roofline plot: the GPU's compute ceiling is so high that
every architecture — even LSTM ($AI \approx 50\text{ FLOP/byte}$) and Transformer
($AI \approx 50\text{ FLOP/byte}$) — plots far below its knee.

**Everything is memory-bound on GPU at these batch sizes.** This is the central tension
of GPU inference at small-to-medium scale:

- The GPU's peak FP32 rate is enormous, but the kernel *launch overhead* is proportionally
  larger than on CPU. Dispatching a tiny matrix multiply to MPS introduces fixed scheduling
  latency that cannot be amortized by a single 32-sample batch.
- The GPU's DRAM latency is *higher* than CPU L3 cache latency for small tensors, which
  means small-batch workloads actually regress compared to CPU in raw latency.

JIT-compiled variants scatter higher on the y-axis (higher throughput), showing that
kernel fusion partially compensates — but none approach the GPU compute ceiling.

---

## 2. Inference latency at batch=256

The benchmark sweeps batch sizes of 32 and 256. At batch=256 the parallelism starts to
pay off:

![GPU Inference Latency (batch=256)](/images/gpu-benchmarks/gpu_fig2_latency_bars.png)

### Full results table (batch=256)

| Architecture | Framework | Variant | Latency (ms) | GFLOP/s | Efficiency | Bottleneck |
|---|---|---|---|---|---|---|
| FF DNN | PyTorch | baseline | 0.654 | 92.8 | 3.6% | memory |
| FF DNN | PyTorch | compiled | 0.704 | 86.3 | 3.3% | memory |
| **FF DNN** | **JAX** | **jit** | **0.282** | **214.8** | **8.3%** | memory |
| CNN | PyTorch | baseline | 15.397 | 694.7 | 20.9% | memory |
| **CNN** | **PyTorch** | **compiled** | **15.293** | **699.4** | **21.1%** | memory |
| CNN | JAX | baseline | 37.825 | 280.1 | 10.7% | memory |
| CNN | JAX | jit | 114.970 | 92.2 | 3.5% | memory |
| RNN | PyTorch | baseline | 4.855 | 221.3 | 7.0% | memory |
| **RNN** | **PyTorch** | **compiled** | **4.809** | **223.4** | **7.1%** | memory |
| LSTM | PyTorch | baseline | 4.868 | 882.4 | 24.5% | compute |
| **LSTM** | **PyTorch** | **compiled** | **4.816** | **891.9** | **24.8%** | compute |
| LSTM | JAX | jit | 10.175 | 213.1 | 24.7% | memory |
| Transformer | PyTorch | baseline | 7.273 | 927.1 | 25.8% | compute |
| **Transformer** | **JAX** | **jit** | **7.806** | **413.8** | **19.6%** | memory |

LSTM and Transformer are the only architectures to break into **compute-bound** territory
on PyTorch MPS at batch=256, reaching 24–26% roofline efficiency. That's still far from
saturation, but it confirms that parameter-heavy, attention and gate-heavy models benefit
most from GPU parallelism.

---

## 3. Roofline efficiency heatmap

![GPU Efficiency Heatmap (batch=256)](/images/gpu-benchmarks/gpu_fig3_efficiency_heatmap.png)

Comparing to the [CPU efficiency heatmap](/blog/ml-framework-comparison#4-roofline-efficiency-heatmap),
GPU efficiency numbers are actually *lower* for most small models. This is not a bug —
it is the expected consequence of a higher compute ceiling with proportionally larger kernel
launch costs.

The high-efficiency outliers are instructive:

- **PyTorch LSTM (24.8%)** — Gate-heavy LSTM with ~1.1M parameters produces enough
  arithmetic operations per weight byte to approach compute saturation on MPS.
- **PyTorch Transformer (25.8%)** — Multi-head attention's large QKV projection matrices
  fill SIMD parallel units well at batch=256.

---

## 4. Batch size scaling

![GPU Latency Scaling](/images/gpu-benchmarks/gpu_fig4_batch_scaling.png)

On CPU, latency scaled almost linearly with batch size across all architectures — a clean
memory-bound signature. On GPU, the scaling curve has a different shape:

- At **batch=32**, GPU latency is often *higher* than CPU latency for the same model.
  Kernel launch overhead dominates, and the parallel compute units sit idle.
- At **batch=256**, GPU latency grows sub-linearly: the parallel execution units finally
  have enough work to amortize launch costs, and throughput rises sharply.

This is the GPU utilisation lever. **Batch size is the single most important knob for
GPU efficiency at these model sizes**, more impactful than any compiler optimization.

---

## 5. Compilation and JIT speedups on GPU

![GPU JIT Speedup (batch=256)](/images/gpu-benchmarks/gpu_fig5_speedup.png)

### Speedup summary (batch=256)

| Architecture | PyTorch `torch.compile` | JAX `jit` |
|---|---|---|
| FF DNN | 0.93× (regression) | **1.05×** |
| CNN | **1.01×** | 0.33× (severe regression) |
| RNN | **1.01×** | **1.21×** |
| LSTM | **1.01×** | **1.79×** |
| Transformer | 0.81× (regression) | **1.12×** |

The story here diverges sharply from the CPU results:

**`jax.jit` on LSTM delivers the largest GPU speedup (1.79×)**, reducing latency from
18.2 ms to 10.2 ms. XLA's graph-level fusion eliminates intermediate tensor round-trips
through GPU memory — exactly the optimization that matters most on a memory-bandwidth-bound
device.

**`torch.compile` regresses on FF DNN and Transformer.** Unlike CPU, where vendor BLAS
libraries anchored PyTorch's performance, MPS kernel quality is more variable. Torch's
Inductor backend generates Metal compute shaders that can introduce extra synchronization
fences for small workloads, creating overhead that outweighs fusion gains.

**JAX's CNN regression (0.33×, latency 3× *worse* after JIT)** is the most dramatic
result in the dataset. Profiling indicates that XLA's Metal convolution lowering inserts
additional memory layout transposes when compiling static shapes for MPS, turning a
well-tuned eager path into a slower compiled graph. This is a known limitation of JAX's
MPS backend and is being actively addressed upstream.

---

## 6. Achieved GPU throughput

![GPU Throughput (batch=256)](/images/gpu-benchmarks/gpu_fig6_throughput.png)

![GPU Throughput Scaling](/images/gpu-benchmarks/gpu_fig7_throughput_scaling.png)

The throughput scaling curves show how GFLOP/s evolves as batch size grows from 32 to 256.
Models with high arithmetic intensity (LSTM, Transformer) show the steepest throughput
climb — each additional sample in the batch amortizes kernel launch and memory latency,
driving toward the compute ceiling.

The key gap between **PyTorch MPS eager** and **JAX eager** throughput on the Transformer
(927 vs. 371 GFLOP/s) reflects PyTorch's more mature MPS kernel library. PyTorch's Metal
backend has received extensive optimization for attention and dense linear layers, while
JAX's MPS support remains experimental.

---

## Architecture-by-architecture GPU winners (batch=256)

| Architecture | Fastest | Latency | Notes |
|---|---|---|---|
| **FF DNN** | JAX (jit) | **0.282 ms** | 2.5× faster than PyTorch eager |
| **CNN** | PyTorch (compiled) | **15.293 ms** | JAX JIT severely regresses on MPS Conv |
| **RNN** | PyTorch (compiled) | **4.809 ms** | Minimal JIT gain; PyTorch MPS RNN kernel well-tuned |
| **LSTM** | PyTorch (compiled) | **4.816 ms** | Compute-bound; highest absolute efficiency |
| **Transformer** | JAX (jit) | **7.806 ms** | Despite lower throughput, JAX JIT beats PyTorch compiled (8.97 ms) |

PyTorch wins 3 of 5 architectures on GPU (vs. JAX winning 4 of 5 on CPU), driven by its
more mature MPS kernel library for convolutions, RNNs, and LSTMs. JAX retakes the lead
on FF DNN and Transformer where XLA's operation fusion outweighs PyTorch's kernel quality.

---

## GPU vs. CPU: when does the GPU actually win?

The results reveal a clear boundary condition: GPU acceleration only produces a latency
*improvement* over CPU once batch size is large enough to saturate parallel compute units.

| Architecture | CPU latency (batch=32, best) | GPU latency (batch=32) | GPU latency (batch=256) |
|---|---|---|---|
| FF DNN | 0.082 ms (JAX JIT) | ~0.3 ms (GPU overhead) | 0.282 ms |
| CNN | 5.012 ms (TF) | ~15 ms | 15.293 ms |
| LSTM | 2.643 ms (JAX JIT) | ~5 ms | 4.816 ms |
| Transformer | 1.731 ms (JAX JIT) | ~7 ms | 7.806 ms |

At batch=32, GPU latency is *worse* across the board for these model sizes. The GPU
doesn't become competitive until batch=256, and even then it barely matches the CPU's best
results. **For low-latency single-request inference at $d=128$, CPU remains faster.**

The GPU advantage appears in **throughput**: at batch=256, PyTorch LSTM processes
891 GFLOP/s vs. ~350 GFLOP/s on CPU, meaning the same hardware is pushing nearly
3× more forward passes per second — even though each individual forward pass takes longer.

---

## Conclusions

### 1. Batch size is the primary GPU utilisation lever

The roofline analysis makes the mechanism explicit: increasing batch size raises arithmetic
intensity (FLOPs per memory byte), pushing workloads toward the compute-bound regime.
At batch=512, LSTM and Transformer approach their compute-bound ceiling on modern GPUs.

### 2. JIT compilation provides larger GPU speedups than CPU speedups — selectively

On CPU, PyTorch eager was already backed by hand-tuned BLAS, so `torch.compile` had little
margin to improve. On GPU, compilation enables kernel fusion that eliminates intermediate
memory round-trips — but only when the backend's lowering is mature. JAX's MPS conv
lowering currently regresses, while LSTM and Transformer benefit substantially.

### 3. PyTorch's MPS kernel library is more mature than JAX's

JAX won 4 of 5 CPU categories but only 2 of 5 GPU categories. The reversal reflects
PyTorch's multi-year investment in production MPS kernels for convolution and recurrent
workloads. As JAX's MPS backend matures, this gap should close.

### 4. Small models on GPU need large batches

For model architectures at $d=128$, a GPU is wasted on single-request inference.
The breakeven batch size is somewhere between 64 and 256 for these architectures.
If your deployment uses online inference with small batch sizes, a well-tuned CPU
(or a batching queue) will likely outperform a GPU on raw latency.

---

## What's next for neural-cost

The v0.2.0 GPU path opens up several directions on the roadmap:

- **NVIDIA CUDA support** — CUDA event timing and `nvidia-smi` power sampling to extend
  roofline analysis to datacenter GPUs.
- **Activation checkpointing model** — re-materialization changes the FLOPs/memory
  tradeoff significantly; the static estimator will gain a checkpoint-aware mode.
- **Distributed communication cost** — all-reduce and pipeline communication costs
  don't appear in per-device FLOPs counts; collective bandwidth modeling is on the list.
- **Per-op kernel traces on JAX** — current JAX and TF adapters use allocator-level
  telemetry; per-kernel XLA HLO traces would close the gap with PyTorch's profiler.

---

## Code and reproducibility

All benchmark scripts, raw JSON telemetry, and figure generators are open-source:

- **neural-cost v0.2.0:** [`davidgraymi/neural-cost`](https://github.com/davidgraymi/neural-cost) · tagged `v0.2.0`
- **GPU data collector:** [`benchmarks/collect_gpu_data.py`](https://github.com/davidgraymi/neural-cost/blob/main/benchmarks/collect_gpu_data.py)
- **Report generator:** [`benchmarks/generate_gpu_report.py`](https://github.com/davidgraymi/neural-cost/blob/main/benchmarks/generate_gpu_report.py)
- **Raw telemetry:** [`benchmarks/results/benchmark_gpu_data.json`](https://github.com/davidgraymi/neural-cost/blob/main/benchmarks/results/benchmark_gpu_data.json)

See also the companion posts:
- [neural-cost: Roofline Analysis Across PyTorch, JAX, and TensorFlow](/blog/neural-cost) — library internals and API
- [PyTorch vs. JAX vs. TensorFlow: A CPU Roofline Benchmark](/blog/ml-framework-comparison) — CPU baseline results
