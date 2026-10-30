---
title: A roofline number should say what it doesn't know
description: I pointed neural-cost at my own AlphaZero chess net and got a confident 69% efficiency that was wrong three ways. Here is what it now reports instead, and the four bugs that only showed up on a real Apple GPU.
pubDate: 2026-10-30
tags: ['machine-learning', 'performance', 'jax', 'apple-silicon', 'gpu', 'python']
series: neural-cost
project: neural-cost
---

I built [neural-cost](https://github.com/davidgraymi/neural-cost) to answer one
question: how fast *should* this network run? Then I used it on my own project
and it gave me a number I believed for about a day.

The project was [pgx-rl](https://github.com/davidgraymi/pgx-rl), an
AlphaZero-style chess agent in JAX: a Flax ResNet policy/value net, a
[pgx](https://github.com/sotetsuk/pgx) chess environment and an
[mctx](https://github.com/google-deepmind/mctx) Gumbel MuZero search. I ran it on
an M3 MacBook, comparing JAX's CPU backend with the
[jax-mps](https://github.com/tillahoffmann/jax-mps) GPU plugin. neural-cost
traced the net, timed it and reported:

```text
  observed: 5.7 ms
  bound: 3.9 ms
  roofline efficiency: 68.9% (memory-bound)
```

That is a clean, useful-looking result. It was also wrong in three ways, and
none of them showed up in the output.

## Three ways a confident number lied

**It scored the wrong device.** I reran the same net with `JAX_PLATFORMS=cpu`.
neural-cost reported the same 100 GB/s, 3.6 TFLOP/s peak, because hardware
detection asked "what chip is this?" and never asked "where did the work run?"
The CPU run came out at 19.5% efficiency, scored against a GPU it never touched.
When I looked closer, the CPU fallback was broken too. The clock-speed sysctl
it relied on doesn't exist on Apple Silicon, so it assumed 2 GFLOP/s per core.

**It described a small part of the workload.** One 16-simulation search at
batch 128 took about 614 ms on the GPU. The network forward pass was about
91 ms of that. Tree bookkeeping took about 300 ms and environment steps about
186 ms, all `gather`, `scatter`, `dynamic_slice` and `while_loop`. neural-cost
modeled none of those primitives, and nothing in the report said so. A 69%
headline over 15% of the runtime isn't a finding.

**It couldn't say where the bytes went.** "Memory-bound: consider fusion" is
advice for every memory-bound model ever written. The net uses `GroupNorm`, and
I couldn't tell whether the norms or the convolutions were moving the traffic.

I wrote all of this up as
[one issue](https://github.com/davidgraymi/neural-cost/issues/51) and split it
into eight more. The fix for all three problems is the same idea: the report
has to say what it measured, on what, and how much of the work it covers.

## Score the device you ran on

`detect_hardware()` now takes the device the work ran on: a string, a JAX or
torch device, or an array. Every spec records whether it describes a CPU or a
GPU:

```python
spec, _ = detect_hardware(device=jax.devices()[0])
spec, _ = JaxAdapter().hardware()      # whatever JAX_PLATFORMS selected
```

Adapter benchmarks record the device they ran on. If that doesn't match the
spec, `analyze_gap` puts a **Device mismatch** finding at the top of the
report instead of quietly producing a number.

Apple Silicon CPUs now get a real peak from a per-generation table: performance
cores do 32 FP32 FLOPs per cycle with NEON, efficiency cores do 16. On the M1
I tested with, that is 541 GFLOP/s. JAX's CPU backend measured 440 GFLOP/s,
81% of the table, so the table is about right. The old fallback said
16 GFLOP/s.

Apple's chip variants are now told apart by GPU core count. A binned M3 Max has
a narrower memory bus (300 GB/s for the 30-core GPU, 400 GB/s for the 40-core),
and the table had the full chip wrong.

## Say how much you modeled

Every JAX trace now produces a coverage count: equations modeled, equations
that are free by construction (reshapes, transposes, casts), and equations
skipped, ranked by frequency. The coverage summary is the first line of the
report:

```text
Neural cost gap analysis
  coverage: 41.2% of 340 equations modeled (unmodeled: sort x12, threefry2x32 x8, ...)
  WARNING: Low coverage: only 41.2% of the traced equations were modeled; the
  roofline bound and efficiency describe part of the workload, not all of it.
```

Then I reduced how much gets skipped. `gather` and `scatter` became their own
cost kinds that count only the elements they touch, never the whole operand: a
lookup of 3 rows from a million-row table reads 3 rows. Scatters update in
place. Scatter-add also reads the old values. `while_loop` bodies, which used
to be counted once, now take a trip count. You can pass one per loop, it is
inferred for simple `i < N` loops, or a default applies, with a warning that
names the loop when nothing is known:

```python
adapter = JaxAdapter(trip_counts={0: 16}, default_trip_count=8)
```

## Show where the bytes go

With the operations passed in, `render()` now prints a per-operation table, and
the JAX adapter names each operation after its Flax module or
`jax.named_scope`. `group_by_scope=True` sums each module. This is the actual
chess net (64 channels, 4 blocks, batch 128) on the M1 GPU through jax-mps:

```text
  coverage: 100.0% of 257 equations modeled
  bound: 6.173 ms (compute 4.190 ms, memory 6.173 ms)
  observed: 12.031 ms
  roofline efficiency: 51.3% (memory-bound)
  top 8 of 30 scopes by share of lower bound:
     #  operation                         kind     FLOPs        bytes   FLOP/B   share
     1  apply/ResNet/Dense_0              mixed    4.9 GFLOP   85.8 MB   57.08   22.8%
     2  apply/ResNet/Conv_0               mixed    1.1 GFLOP   10.5 MB  107.36    5.8%
     3  apply/ResNet/GroupNorm_0          elem.    3.2 MFLOP   21.3 MB    0.15    3.6%
     4  apply/ResNet/Block_0/GroupNorm_0  elem.    3.2 MFLOP   21.3 MB    0.15    3.6%
     ...
```

That answered my original question, and the answer surprised me. The biggest
single cost isn't a residual block. It is the policy head: one dense layer from
the flattened 8×8×64 board to 4,672 move logits, about 5 GFLOPs per batch. Each
GroupNorm does almost no arithmetic (0.15 FLOP per byte) but moves as much data
as a convolution. On the GPU, where compute is cheap, nine GroupNorms add up to
about a third of the lower bound. Those two places are where to work: a smaller
policy head and fused norms.

## Real workloads are pipelines

A search isn't one function. The question I had actually answered by hand,
with separate timings and a spreadsheet, was "per search: tree + 16 × env step +
16 × net forward, which dominates?" That is now an API:

```python
report = Pipeline(
    {
        "tree": Stage(tree_update, (tree, stats)),
        "env": Stage(env_step, (state, action), calls=16),
        "net": Stage(net_apply, (params, obs), calls=16),
    },
    total=Stage(search, (params, state)),
).run(adapter=JaxAdapter(), hardware=spec)
```

It times each stage, multiplies by its call count, and compares the sum with an
end-to-end run. Whatever is left over is reported as **unexplained**, usually
Python dispatch and loop overhead. That leftover is often the most useful line
in the table, because nothing else measures it. Each stage also gets its own
roofline and coverage.

Two smaller additions round it out. `JaxAdapter().calibrate()` measures
achievable FLOP/s and bandwidth on the device itself, for backends that no
spec table covers. `neural-cost compare bench.py:build --platforms cpu,mps` runs
one function on each JAX platform in its own subprocess and prints one table,
since JAX only allows one platform per process.

## Then I ran it on a real GPU

Every feature above passed its tests on the CPU. Then I installed jax-mps and
jax-metal on an M1 and ran everything again. Four things broke, and none of
them would have shown up without the hardware.

**The calibration reported 193% of peak bandwidth.** It measured 132 GB/s on a
chip whose memory tops out at 68 GB/s. The results were numerically correct,
even at 1 GiB, so the arithmetic was being done. The cause: jax-mps runs on
[MLX](https://github.com/ml-explore/mlx), and MLX stores an array made with
`jnp.ones(...)` as a single broadcast value. The `x + 1` bandwidth probe read
4 bytes and only paid for the writes. With random input data the same probe
measures 60.5 GB/s, 89% of spec. The fix takes a few lines. The lesson is that a
benchmark of constants measures the constant-folding.

**Attention disappeared, and the coverage feature caught it.** jax-mps replaces
`jax.nn.dot_product_attention` with its own fused `mps.sdpa` primitive, so on
the GPU the attention FLOPs silently dropped out and a cross-framework test
failed. The new coverage line flagged it straight away:
`coverage: 80.0% of 5 equations modeled (unmodeled: mps.sdpa x1)`. This is
exactly the failure coverage was added to expose, and it happened in its first
week. `mps.sdpa` is now counted as attention.

**The Flax example's `compare` mode failed on every platform.** Loading a
script by path without registering it in `sys.modules` breaks any `@dataclass`,
and every Flax module is a dataclass.

**The `jax-metal` extra had been broken all along.** The latest release of
Apple's plugin targets jax 0.4.34. With current jax, the `METAL` device appears in
`jax.devices()`, but every computation fails with
`unknown attribute code: 22`, a StableHLO bytecode mismatch. The extra now pins
the one version that works. jax-mps, which is built against jaxlib 0.11, needs
the opposite pin, so the two extras are now declared incompatible.

With those fixed, the whole test suite passes with MPS as JAX's default device
(408 tests), and the JAX tests pass on Metal. The M1's three backends:

| | CPU | MPS (jax-mps) | Metal (jax-metal) |
|---|---|---|---|
| Measured peak compute | 0.44 TFLOP/s | 1.92 TFLOP/s (74% of spec) | 1.67 TFLOP/s (64%) |
| Measured bandwidth | 57.6 GB/s | 60.5 GB/s (89%) | 50.0 GB/s (73%) |
| Overhead per call | 3 µs | 163 µs | 58 µs |
| Chess net, batch 128 | 33.9 ms | 12.0 ms | 19.5 ms |
| Roofline efficiency | 59% (compute-bound) | 51% (memory-bound) | 32% (memory-bound) |

These are single runs on one machine. The CPU and GPU share one pool of
unified memory, so their bandwidth is nearly the same; what differs is compute
and overhead. Note the per-call overhead: a small 128×512 matmul runs about
2.7× *faster* on the CPU than on MPS, because 163 µs of dispatch costs more than
the math. Batch size decides which device wins.

## Built by an agent, for agents

The last of the nine issues was that an AI agent using neural-cost had to
rediscover the API every time. I had run into that while profiling pgx-rl.
neural-cost will now ship an
[agent skill](https://github.com/davidgraymi/neural-cost/pull/68):
when to use it, a recipe per framework, how to read the report, and one rule
for reporting results. Never quote a roofline efficiency without the device,
the batch size, the number of runs, and how much of the workload it covers. CI
runs the skill's code examples, so it can't go stale.

The skill felt apt because most of this work was itself done by an agent. I
gave Claude Code the issue list, and it implemented the nine issues one at a
time as a stack of pull requests, each building on the last. Then I asked it to
test everything on the real GPUs, which is where the four bugs above came from.
My part was what it couldn't supply: the workload that exposed the problems,
deciding what an honest report should contain, and reviewing.

## What it still doesn't do

The coverage line counts equations, not time. Matching measured time to the
operations that weren't modeled would need a per-op trace, which I haven't
built. `sort` and JAX's random-number generator are still unmodeled. They are
listed as such, but the bound excludes them. The TensorFlow adapter doesn't
report coverage yet.

The changes are in pull requests
[#60–#69](https://github.com/davidgraymi/neural-cost/pulls) and ship in the next
release. The headline number for my chess net went from "69% efficient" to
"51% efficient over 100% of the network, memory-bound, mostly the policy head
and the norms, and the network is 15% of the search anyway." The second version
is longer, and it is the one I can act on.
