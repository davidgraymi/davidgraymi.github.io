"""Exports the Connect Four thinking model (c4p-long-D, EMA weights) for the browser.

Run from a checkout of davidgraymi/CS440-Final-Project (it imports that package):

    mkdir -p out/model
    uv run python /path/to/this/export.py results/c4p/c4p-long-D/ckpt.pt out/model data/c4v2_tactical.npz

Writes out/model/weights.f16.bin (every tensor, flattened, fp16) and out/model/manifest.json
(config + name/shape/offset of each tensor), and out/reference.json (per-step outputs for four
positions, used by check.mjs). Also prints how often fp16 weights change the chosen move.
Copy weights.f16.bin to public/games/connect-four/ and manifest.json to src/lib/games/connect-four/.
"""
import json, sys
import numpy as np, torch
from cs440_final_project.models import ModelConfig, build_model
from cs440_final_project.c4_ponder import episode, halting_dist, stop_step

ckpt, out = sys.argv[1], sys.argv[2]
ck = torch.load(ckpt, map_location="cpu", weights_only=True)
cfg = ModelConfig(**ck["cfg"])
sd = ck["ema"]
names = [k for k in sd if k != "n_averaged"]
manifest, blobs, off = [], [], 0
for k in names:
    a = sd[k].float().numpy().astype(np.float16).ravel()
    manifest.append(dict(name=k, shape=list(sd[k].shape), offset=off, length=a.size))
    blobs.append(a); off += a.size
np.concatenate(blobs).tofile(f"{out}/weights.f16.bin")

def run(model, toks):
    with torch.no_grad():
        o = episode(model, torch.tensor(toks), cfg.n_sup, ckpt=False)
    pol = torch.stack(o["policy"], 1); q = torch.stack(o["q"], 1)
    return pol, q, torch.stack(o["value"], 1), torch.stack(o["cols"], 1)

m32 = build_model("trm", cfg); m32.load_state_dict(sd); m32.eval()
m16 = build_model("trm", cfg)
m16.load_state_dict({k: v.half().float() if v.is_floating_point() else v for k, v in sd.items()}); m16.eval()

d = np.load(sys.argv[3])
toks = d["tokens"][:2000].astype(np.int64)
p32, q32, *_ = run(m32, toks); p16, q16, *_ = run(m16, toks)
s32 = stop_step(halting_dist(q32)); s16 = stop_step(halting_dist(q16))
mv32 = p32[torch.arange(len(toks)), s32 - 1].argmax(-1); mv16 = p16[torch.arange(len(toks)), s16 - 1].argmax(-1)
print("fp16 move agreement", (mv32 == mv16).float().mean().item(), "stop agreement", (s32 == s16).float().mean().item())

# reference for JS: empty board + 3 others, fp16 weights
ref_toks = np.concatenate([np.ones((1, 42), np.int64), toks[:3]])
pol, q, val, cols = run(m16, ref_toks)
ref = dict(tokens=ref_toks.tolist(), policy=pol.tolist(), q=q.tolist(), value=val.tolist(), cols=cols[:, :, :, :].tolist())
json.dump(dict(cfg=ck["cfg"], tensors=manifest), open(f"{out}/manifest.json", "w"))
json.dump(ref, open(f"{out}/../reference.json", "w"))
print("params", off)
