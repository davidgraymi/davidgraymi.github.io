"""Regenerate the benchmark charts used by the two roofline blog posts.

Data snapshots in ./data come from davidgraymi/neural-cost at commit e05cc36
(benchmarks/results/benchmark_data.json and benchmark_gpu_data.json, Apple M3).

Every chart is written twice, a light and a dark variant, as lossless WebP:
    public/images/benchmarks/<name>.webp
    public/images/benchmarks/<name>-dark.webp
The rehype figure plugin in astro.config.mjs swaps them with the site theme.

Charts carry no in-image title; the post's <figcaption> does that job.

    python3 -m venv .venv && .venv/bin/pip install matplotlib numpy pillow
    .venv/bin/python scripts/blog-charts/generate.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap, LogNorm, Normalize  # noqa: E402
from matplotlib.lines import Line2D  # noqa: E402
from matplotlib.ticker import FixedLocator, FuncFormatter, LogLocator, NullLocator  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).resolve().parent / "data"
OUT = ROOT / "public" / "images" / "benchmarks"

ARCHS = ["FF DNN", "CNN", "RNN", "LSTM", "Transformer"]
OPTIMIZED = {"PyTorch": "compiled", "JAX": "jit", "TensorFlow": "tf.function"}
LABEL = {"PyTorch": "PyTorch (compiled)", "JAX": "JAX (jit)", "TensorFlow": "TensorFlow (tf.function)"}

# Framework identity never rests on colour alone: each also has a marker and a hatch.
# Hues follow Okabe–Ito (orange / blue / reddish purple), tuned to the site's amber.
THEMES = {
    "light": {
        "page": "#ffffff",
        "text": "#0a0a0a",
        "muted": "#3f3f46",
        "grid": "#e4e4e7",
        "rule": "#18181b",
        "fw": {"PyTorch": "#a14a07", "JAX": "#0369a1", "TensorFlow": "#a2457f"},
        "heat": ["#fffaf0", "#fddc9f", "#f59e0b", "#a14a07", "#451a03"],
    },
    "dark": {
        "page": "#06090e",
        "text": "#f1f5f9",
        "muted": "#94a3b8",
        "grid": "#1e293b",
        "rule": "#273449",
        "fw": {"PyTorch": "#f59e0b", "JAX": "#38bdf8", "TensorFlow": "#e08ac0"},
        "heat": ["#0a0e16", "#422600", "#a14a07", "#f59e0b", "#fef3c7"],
    },
}
MARKER = {"PyTorch": "o", "JAX": "s", "TensorFlow": "^"}
HATCH = {"PyTorch": "", "JAX": "////", "TensorFlow": "...."}
ARCH_MARKER = {"FF DNN": "o", "CNN": "s", "RNN": "D", "LSTM": "^", "Transformer": "P"}

W = 8.0  # inches; at 200 dpi a 1600 px image that the 704 px column shows at 11 pt ≈ 13 px


def load(name: str) -> dict:
    return json.loads((DATA / name).read_text())


def rec(records, fw, variant, arch, batch):
    for r in records:
        if (r["framework"], r["variant"], r["architecture"], r["batch"]) == (fw, variant, arch, batch):
            return r
    return None


def plain(x, _pos=None):
    """Log-axis tick label without scientific notation: 0.02, 0.5, 3, 40, 1,000."""
    if x <= 0:
        return ""
    if x >= 1000:
        return f"{x:,.0f}"
    if x >= 1:
        return f"{x:g}"
    return f"{x:.3g}"


def style(theme: str):
    t = THEMES[theme]
    plt.rcdefaults()
    plt.rcParams.update(
        {
            "font.family": ["Helvetica Neue", "Helvetica", "Arial", "DejaVu Sans"],
            "font.size": 11,
            "axes.titlesize": 11,
            "axes.titleweight": "bold",
            "axes.labelsize": 10.5,
            "xtick.labelsize": 10,
            "ytick.labelsize": 10,
            "legend.fontsize": 10,
            "text.color": t["text"],
            "axes.labelcolor": t["muted"],
            "axes.edgecolor": t["rule"],
            "axes.facecolor": "none",
            "figure.facecolor": "none",
            "savefig.facecolor": "none",
            "xtick.color": t["muted"],
            "ytick.color": t["muted"],
            "axes.grid": True,
            "grid.color": t["grid"],
            "grid.linewidth": 0.8,
            "axes.axisbelow": True,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "legend.frameon": False,
            "hatch.linewidth": 0.6,
            "hatch.color": t["text"] if theme == "dark" else "#ffffff",
        }
    )
    return t


def save(fig, name: str, theme: str):
    OUT.mkdir(parents=True, exist_ok=True)
    suffix = "" if theme == "light" else "-dark"
    path = OUT / f"{name}{suffix}.webp"
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.12, transparent=True,
                pil_kwargs={"lossless": True, "quality": 100, "method": 6})
    plt.close(fig)
    print("wrote", path.relative_to(ROOT))


def heat_cmap(t):
    return LinearSegmentedColormap.from_list("amber", t["heat"])


def text_on(rgba) -> str:
    r, g, b = rgba[:3]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "#0a0a0a" if lum > 0.45 else "#ffffff"


# ---------------------------------------------------------------------------
# Chart builders
# ---------------------------------------------------------------------------


def roofline(data, frameworks, batch, name, theme):
    t = style(theme)
    hw = data["hardware"]
    peak = hw["peak_flops"] / 1e9
    bw = hw["memory_bandwidth"] / 1e9
    ridge = hw["ridge_point"]

    fig, axes = plt.subplots(1, len(frameworks), figsize=(W, 3.9), sharey=True)
    ai = np.logspace(-0.5, 3, 400)
    roof = np.minimum(bw * ai, peak)
    for ax, fw in zip(axes, frameworks):
        ax.plot(ai, roof, color=t["text"], lw=1.6, zorder=2)
        ax.axvline(ridge, color=t["muted"], lw=0.9, ls=(0, (4, 3)), zorder=1)
        for arch in ARCHS:
            r = rec(data["records"], fw, OPTIMIZED[fw], arch, batch)
            if r is None:
                continue
            ax.scatter(r["arith_intensity"], r["achieved_gflops"], marker=ARCH_MARKER[arch], s=62,
                       facecolor=t["fw"][fw], edgecolor=t["text"], linewidth=0.7, alpha=0.9, zorder=3)
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.set_xlim(0.4, 700)
        ax.set_ylim(10, 8000)
        ax.set_title(LABEL[fw], color=t["fw"][fw])
        ax.set_xlabel("Arithmetic intensity (FLOP/byte)")
        for axis in (ax.xaxis, ax.yaxis):
            axis.set_major_formatter(FuncFormatter(plain))
            axis.set_minor_locator(NullLocator())
        ax.xaxis.set_major_locator(FixedLocator([1, 10, 100]))
        ax.yaxis.set_major_locator(FixedLocator([10, 100, 1000]))
        ax.text(ridge * 1.08, 14, f"ridge {ridge:g}", color=t["muted"], fontsize=9)
    axes[0].set_ylabel("Achieved throughput (GFLOP/s)")
    axes[0].text(1.6, 55, f"{bw:g} GB/s", color=t["muted"], fontsize=9)
    axes[-1].text(ridge * 1.2, peak * 1.15, f"peak {peak / 1000:g} TFLOP/s", ha="left", color=t["muted"], fontsize=9)
    handles = [Line2D([], [], marker=ARCH_MARKER[a], ls="", markersize=8, markerfacecolor="none",
                      markeredgecolor=t["text"], label=a) for a in ARCHS]
    fig.legend(handles=handles, loc="lower center", ncol=5, bbox_to_anchor=(0.5, -0.08))
    fig.tight_layout()
    save(fig, name, theme)


def grouped_bars(ax, t, frameworks, values, highs=None, fmt="{:.2f}"):
    n = len(frameworks)
    width = 0.8 / n
    x = np.arange(len(ARCHS))
    for i, fw in enumerate(frameworks):
        xs = x + (i - (n - 1) / 2) * width
        v = np.array(values[fw], dtype=float)
        ax.bar(xs, v, width * 0.92, color=t["fw"][fw], hatch=HATCH[fw], edgecolor=t["fw"][fw],
               linewidth=0, label=LABEL[fw], zorder=2)
        if highs is not None:
            h = np.array(highs[fw], dtype=float)
            ax.vlines(xs, v, h, color=t["text"], lw=0.9, zorder=3)
            ax.hlines(h, xs - width * 0.15, xs + width * 0.15, color=t["text"], lw=0.9, zorder=3)
            tops = np.maximum(v, h)
        else:
            tops = v
        for xi, vi, top in zip(xs, v, tops):
            ax.text(xi, top * 1.12, fmt.format(vi), ha="center", va="bottom", fontsize=8, color=t["muted"],
                    bbox={"facecolor": t["page"], "edgecolor": "none", "pad": 1}, zorder=4)
    ax.set_xticks(x, ARCHS)
    ax.grid(axis="x", visible=False)


def bar_legend(fig, ax, frameworks):
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=len(frameworks))
    fig.tight_layout()


def latency_bars(data, frameworks, batch, name, theme):
    t = style(theme)
    vals, p95 = {}, {}
    for fw in frameworks:
        rs = [rec(data["records"], fw, OPTIMIZED[fw], a, batch) for a in ARCHS]
        vals[fw] = [r["latency_median_ms"] for r in rs]
        p95[fw] = [r["latency_p95_ms"] for r in rs]
    fig, ax = plt.subplots(figsize=(W, 4.0))
    ax.set_yscale("log")
    grouped_bars(ax, t, frameworks, vals, highs=p95, fmt="{:.3g}")
    ax.set_ylabel("Median latency (ms, log scale)")
    ax.yaxis.set_major_formatter(FuncFormatter(plain))
    ax.yaxis.set_minor_locator(NullLocator())
    lo = min(min(v) for v in vals.values())
    hi = max(max(v) for v in p95.values())
    ax.set_ylim(lo / 2.5, hi * 4)
    ax.yaxis.set_major_locator(FixedLocator([0.01, 0.1, 1, 10, 100]))
    bar_legend(fig, ax, frameworks)
    save(fig, name, theme)


def speedup_bars(data, frameworks, batch, name, theme):
    t = style(theme)
    vals = {}
    for fw in frameworks:
        vals[fw] = []
        for a in ARCHS:
            base = rec(data["records"], fw, "baseline", a, batch)["latency_median_ms"]
            opt = rec(data["records"], fw, OPTIMIZED[fw], a, batch)["latency_median_ms"]
            vals[fw].append(base / opt)
    fig, ax = plt.subplots(figsize=(W, 3.8))
    ax.set_yscale("log", base=2)
    lo = min(min(v) for v in vals.values())
    hi = max(max(v) for v in vals.values())
    ax.set_ylim(min(0.25, lo / 1.4), max(2.5, hi * 1.9))
    ax.axhline(1, color=t["muted"], lw=1, ls=(0, (4, 3)), zorder=1)
    grouped_bars(ax, t, frameworks, vals, fmt="{:.2f}×")
    ticks = [x for x in [0.25, 0.5, 1, 2, 4, 8, 16] if ax.get_ylim()[0] <= x <= ax.get_ylim()[1]]
    ax.yaxis.set_major_locator(FixedLocator(ticks))
    ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _p: f"{x:g}×"))
    ax.yaxis.set_minor_locator(NullLocator())
    ax.set_ylabel("Speedup over eager (log scale)")
    bar_legend(fig, ax, frameworks)
    save(fig, name, theme)


def heatmap(data, frameworks, batch, field, scale, norm, label, name, theme, fmt="{:.1f}%"):
    t = style(theme)
    m = np.array([[rec(data["records"], fw, OPTIMIZED[fw], a, batch)[field] * scale for fw in frameworks]
                  for a in ARCHS])
    fig, ax = plt.subplots(figsize=(1.55 * len(frameworks) + 2.6, 4.2))
    cmap = heat_cmap(t)
    im = ax.imshow(m, cmap=cmap, norm=norm, aspect="auto")
    ax.grid(False)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks(range(len(frameworks)), [LABEL[f].replace(" (", "\n(") for f in frameworks])
    ax.set_yticks(range(len(ARCHS)), ARCHS)
    ax.tick_params(length=0)
    # Cell gaps in the page colour instead of gridlines through the values
    for k in range(len(frameworks) + 1):
        ax.axvline(k - 0.5, color=t["page"], lw=3)
    for k in range(len(ARCHS) + 1):
        ax.axhline(k - 0.5, color=t["page"], lw=3)
    for i in range(len(ARCHS)):
        for j in range(len(frameworks)):
            v = m[i, j]
            ax.text(j, i, fmt.format(v), ha="center", va="center", fontsize=11, fontweight="bold",
                    color=text_on(cmap(norm(v))))
    cb = fig.colorbar(im, ax=ax, fraction=0.06, pad=0.04)
    cb.outline.set_visible(False)
    cb.set_label(label)
    if isinstance(norm, LogNorm):
        cb.set_ticks([1, 3, 10, 30, 100, 300])
        cb.ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _p: f"{x:g}%"))
        cb.ax.yaxis.set_minor_locator(NullLocator())
    else:
        cb.ax.yaxis.set_major_formatter(FuncFormatter(lambda x, _p: f"{x:g}%"))
    fig.tight_layout()
    save(fig, name, theme)


def small_multiples(data, frameworks, batches, field, ylabel, name, theme, log=True, note=None):
    """Five architecture panels in a 3×2 grid; the sixth cell holds the legend."""
    t = style(theme)
    fig, axes = plt.subplots(2, 3, figsize=(W, 5.6))
    flat = axes.ravel()
    for ax, arch in zip(flat, ARCHS):
        for fw in frameworks:
            ys = [rec(data["records"], fw, OPTIMIZED[fw], arch, b)[field] for b in batches]
            ax.plot(batches, ys, color=t["fw"][fw], marker=MARKER[fw], markersize=5.5, lw=1.8,
                    markeredgecolor=t["fw"][fw])
        ax.set_xscale("log", base=2)
        if log:
            ax.set_yscale("log")
            ax.yaxis.set_major_locator(LogLocator(base=10, subs=(1, 3)))
            ax.yaxis.set_major_formatter(FuncFormatter(plain))
            ax.yaxis.set_minor_locator(NullLocator())
        else:
            ax.set_ylim(bottom=0)
        ax.xaxis.set_major_locator(FixedLocator(batches))
        ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _p: f"{x:g}"))
        ax.xaxis.set_minor_locator(NullLocator())
        ax.set_title(arch)
        if note and note[0] == arch:
            _, fw, b, text = note
            y = rec(data["records"], fw, OPTIMIZED[fw], arch, b)[field]
            ax.annotate(text, (b, y), xytext=(0.97, 0.06), textcoords="axes fraction", ha="right",
                        fontsize=8.5, color=t["fw"][fw],
                        arrowprops={"arrowstyle": "-", "color": t["fw"][fw], "lw": 0.8})
    for ax in axes[1]:
        ax.set_xlabel("Batch size")
    for ax in axes[:, 0]:
        ax.set_ylabel(ylabel)
    legend_ax = flat[-1]
    legend_ax.axis("off")
    handles = [Line2D([], [], color=t["fw"][fw], marker=MARKER[fw], lw=1.8, label=LABEL[fw]) for fw in frameworks]
    legend_ax.legend(handles=handles, loc="center", handlelength=2.4, labelspacing=1.0)
    fig.tight_layout(h_pad=1.6)
    save(fig, name, theme)


def throughput_bars(data, frameworks, batch, name, theme):
    t = style(theme)
    peak = data["hardware"]["peak_flops"] / 1e9
    vals = {fw: [rec(data["records"], fw, OPTIMIZED[fw], a, batch)["achieved_gflops"] for a in ARCHS]
            for fw in frameworks}
    fig, ax = plt.subplots(figsize=(W, 3.9))
    ax.set_yscale("log")
    ax.set_ylim(30, peak * 2.2)
    ax.axhline(peak, color=t["muted"], lw=1, ls=(0, (4, 3)))
    ax.text(len(ARCHS) - 0.5, peak * 1.08, f"peak {peak:,.0f} GFLOP/s", ha="right", va="bottom",
            fontsize=9, color=t["muted"])
    grouped_bars(ax, t, frameworks, vals, fmt="{:.0f}")
    ax.yaxis.set_major_locator(FixedLocator([30, 100, 300, 1000, 3000]))
    ax.yaxis.set_major_formatter(FuncFormatter(plain))
    ax.yaxis.set_minor_locator(NullLocator())
    ax.set_ylabel("Achieved GFLOP/s (log scale)")
    bar_legend(fig, ax, frameworks)
    save(fig, name, theme)


def main():
    cpu = load("cpu-m3.json")
    gpu = load("gpu-m3-mps.json")
    all_fw = ["PyTorch", "JAX", "TensorFlow"]
    gpu_fw = ["PyTorch", "JAX"]  # TensorFlow was not run on MPS
    # Same scale on both efficiency heatmaps so the posts can be compared directly.
    eff_norm = Normalize(0, 30)

    for theme in THEMES:
        # CPU post (ml-framework-comparison)
        roofline(cpu, all_fw, 32, "cpu-roofline", theme)
        latency_bars(cpu, all_fw, 32, "cpu-latency", theme)
        speedup_bars(cpu, all_fw, 32, "cpu-speedup", theme)
        heatmap(cpu, all_fw, 32, "roofline_efficiency", 100, eff_norm, "Roofline efficiency",
                "cpu-efficiency", theme)
        small_multiples(cpu, all_fw, [1, 8, 32, 128], "latency_median_ms", "Median latency (ms)",
                        "cpu-batch-scaling", theme,
                        note=("FF DNN", "PyTorch", 32, "CV 354%:\nnoisy run"))
        heatmap(cpu, all_fw, 32, "latency_cv_pct", 1, LogNorm(1, 400), "Coefficient of variation (log scale)",
                "cpu-noise", theme)

        # GPU post (neural-cost-gpu-benchmark)
        roofline(gpu, gpu_fw, 256, "gpu-roofline", theme)
        latency_bars(gpu, gpu_fw, 256, "gpu-latency", theme)
        heatmap(gpu, gpu_fw, 256, "roofline_efficiency", 100, eff_norm, "Roofline efficiency",
                "gpu-efficiency", theme)
        small_multiples(gpu, gpu_fw, [32, 256], "latency_median_ms", "Median latency (ms)",
                        "gpu-batch-scaling", theme)
        speedup_bars(gpu, gpu_fw, 256, "gpu-speedup", theme)
        throughput_bars(gpu, gpu_fw, 256, "gpu-throughput", theme)
        small_multiples(gpu, gpu_fw, [32, 256], "achieved_gflops", "Achieved GFLOP/s",
                        "gpu-throughput-scaling", theme, log=False)


if __name__ == "__main__":
    main()
