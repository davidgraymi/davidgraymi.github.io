"""Charts for "Teaching a network to think longer" (the Connect Four thinking-model post).

Data: data/thinking-c4.json, a snapshot of results/c4p/reports/outer-steps.json and
tournament.json from davidgraymi/CS440-Final-Project at commit c918bb7.

Writes light and dark lossless WebP to public/images/thinking/, same style as
generate.py (which it imports for the theme, style() and save()).

    .venv/bin/python scripts/blog-charts/thinking.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

import generate as g  # noqa: E402

g.OUT = g.ROOT / "public" / "images" / "thinking"
D = json.loads((Path(__file__).resolve().parent / "data" / "thinking-c4.json").read_text())

GROUPS = [  # required-lookahead buckets merged, n-weighted (every bucket has ~1,500 positions)
    ("r = 1–2", ["1", "2"], "o"),
    ("r = 3–8", ["3–4", "5–6", "7–8"], "s"),
    ("r = 9+", ["9–10", "11–12", "13–16", "17+"], "^"),
]


def ramp(t):
    return [t["heat"][2], t["heat"][3], t["heat"][4]] if t is g.THEMES["light"] else [t["heat"][2], t["heat"][3], t["heat"][4]]


def curves(theme):
    t = g.style(theme)
    fig, ax = plt.subplots(figsize=(g.W, 4.2))
    k = np.arange(1, 25)
    for (label, buckets, marker), color in zip(GROUPS, ramp(t)):
        acc = np.mean([D["D0_by_bucket"][b]["curve"] for b in buckets], 0) * 100
        ax.plot(k, acc, color=color, lw=2, marker=marker, ms=5, markevery=[0, 3, 8, 15, 23])
        ax.annotate(label, (24, acc[-1]), xytext=(8, 0), textcoords="offset points", va="center",
                    color=t["text"], fontsize=10)
    stop = D["D0"]["mean_stop"]
    ax.axvline(stop, color=t["muted"], lw=1, ls=(0, (4, 3)))
    ax.annotate(f"mean stopping step {stop:.1f}", (stop, 42), xytext=(6, 0), textcoords="offset points",
                color=t["muted"], fontsize=9.5)
    ax.set_xlim(0.5, 24.5)
    ax.set_ylim(40, 102)
    ax.set_xticks([1, 4, 8, 12, 16, 20, 24])
    ax.set_xlabel("Outer thinking step")
    ax.set_ylabel("Optimal-move accuracy (%)")
    g.save(fig, "accuracy-by-step", theme)


def stop_vs_settle(theme):
    t = g.style(theme)
    fig, ax = plt.subplots(figsize=(g.W, 3.8))
    buckets = list(D["D0_by_bucket"].keys())
    x = np.arange(len(buckets))
    stop = [D["D0_by_bucket"][b]["stop"] for b in buckets]
    settle = [D["D0"]["settle_by_bucket"][b] for b in buckets]
    ax.plot(x, stop, color=t["fw"]["PyTorch"], lw=2, marker="o", ms=6)
    ax.plot(x, settle, color=t["fw"]["JAX"], lw=2, marker="s", ms=6)
    ax.fill_between(x, settle, stop, color=t["fw"]["PyTorch"], alpha=0.08, lw=0)
    ax.annotate("step it stops at (mean)", (x[-1], stop[-1]), xytext=(8, 0), textcoords="offset points",
                va="center", color=t["text"], fontsize=10)
    ax.annotate("step its answer settles (median)", (x[-1], settle[-1]), xytext=(8, 0),
                textcoords="offset points", va="center", color=t["text"], fontsize=10)
    ax.set_xticks(x, buckets)
    ax.set_xlabel("Required lookahead r (plies)")
    ax.set_ylabel("Outer step")
    ax.set_ylim(0, 12)
    g.save(fig, "stop-vs-settle", theme)


def ablation(theme):
    t = g.style(theme)
    order = ["k1", "k4", "k8", "k24", "A", "C", "D0"]
    names = {
        "k1": "Fixed 1 step",
        "k4": "Fixed 4 steps",
        "k8": "Fixed 8 steps",
        "k24": "Fixed 24 steps",
        "A": "Adaptive, no credit across steps",
        "C": "Adaptive, full credit",
        "D0": "Adaptive, full credit + per-column target",
    }
    acc = [D["accuracy"][k]["acc"] * 100 for k in order]
    steps = [D["accuracy"][k]["mean_stop"] for k in order]
    fig, ax = plt.subplots(figsize=(g.W, 3.6))
    y = np.arange(len(order))[::-1]
    # Dots, not bars: the axis doesn't start at zero, so bar length would mislead.
    for yi, a, k in zip(y, acc, order):
        ax.plot([a], [yi], marker="o", ms=9, color=t["fw"]["PyTorch"] if k == "D0" else t["muted"],
                markeredgecolor=t["page"] if theme == "light" else "#14120f", markeredgewidth=2)
    for yi, a, s in zip(y, acc, steps):
        ax.annotate(f"{a:.1f}%  ·  {s:.1f} steps", (a, yi), xytext=(10, 0), textcoords="offset points",
                    va="center", color=t["text"], fontsize=9.5)
    ax.set_yticks(y, [names[k] for k in order])
    ax.set_xlim(76, 94)
    ax.set_xlabel("Optimal-move accuracy on the tactical set (%)")
    ax.grid(axis="y", visible=False)
    g.save(fig, "ablation", theme)


def main():
    for theme in ("light", "dark"):
        curves(theme)
        stop_vs_settle(theme)
        ablation(theme)


if __name__ == "__main__":
    main()
