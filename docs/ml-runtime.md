# Why the games don't use TensorFlow.js

*Review of the in-browser ML, October 2026.*

**Short version:** keep the hand-written code. None of the three models is the
kind of workload an inference framework speeds up. A framework would add
13× to 400× the bytes and run no faster. The trained artifacts now have a
canonical, versioned home on the Hugging Face Hub (`npm run models`), but the
site keeps serving its own copies.

## What actually runs in the browser

The custom "runtime" is about 60 lines spread across three games. Nothing is
trained in the browser. Every model is trained offline, committed as a small
static artifact, and only *evaluated* on the page.

| Game | Model | Artifact | Inference code | Shipped (gzip) |
| --- | --- | --- | --- | --- |
| Beat the bot | 4 → 32 → 32 → 1 MLP (DQN value net) | `src/lib/games/tetris/weights.json`, 11 KB | `value()` in `tetris/bot.ts`, 12 lines | 9.5 KB for the whole game chunk, weights included |
| Is it poisonous? | ID3 decision tree | `is-it-poisonous/model.json`, 7 KB | `classify()` in `id3.ts`, a tree walk | 2.1 KB |
| Draw a digit | Weighted KNN, k ≤ 15 | `public/games/knn-digits/mnist-subset.bin`, 300 KB | `classify()` in `knn.ts`, one distance loop | 3.4 KB code + 72 KB data |

Route the robots runs LaCAM, a search algorithm with no learned parameters, so
no ML framework applies to it.

## Would a framework help?

Measured in October 2026 with esbuild (minified, gzip -9) and Chrome on an
M-series Mac.

### Bytes

| Option | Extra JS (gzip) | Notes |
| --- | --- | --- |
| Current code | 0 | |
| `@tensorflow/tfjs-core` + CPU backend | **125 KB** | 13× the entire Tetris game |
| tfjs-core + WebGL backend | 177 KB | |
| `@tensorflow/tfjs` (everything) | 308 KB | |
| `onnxruntime-web/wasm` | 25 KB JS + **3.6 MB** WASM | `ort-wasm-simd-threaded.wasm` is 14 MB raw |
| `@litertjs/core` | 9 KB JS + **2.8 MB** WASM | ~9.4 MB raw; Google's successor to TF Lite on the web |

### Speed

The only neural network is the Tetris value net. Each time a new piece appears,
the agent scores every legal placement, typically about 34. One batch of 34
forward passes:

| Implementation | Time per batch | Max output difference vs. current code |
| --- | --- | --- |
| Current plain TypeScript | 98 µs | — |
| TF.js, CPU backend | 96 µs | 7 × 10⁻⁶ |
| TF.js, WebGL backend | 1,789 µs | 2 × 10⁻⁵ |

The work is about 1,200 multiply-adds, and GPU upload and readback cost far
more than that. The headless run may have used software WebGL, so read the
WebGL number as an order of magnitude, but the overhead is real on any GPU. The
agent also deliberately takes 550–2,200 ms per piece, so 0.1 ms of inference is
invisible either way.

As a bonus, the TF.js comparison independently confirms that the hand-written
forward pass matches a reference implementation to float32 precision.

KNN is roughly 600k subtract-square-adds over 750 stored digits, under a
millisecond on the main thread. TF.js could vectorise it, but the cost would be
the same 125 KB and a tensor round-trip per stroke. ID3 isn't a tensor model
at all, and no mainstream web inference runtime executes decision trees.

### Health of the options

- **TensorFlow.js** has had no release since 4.22.0 (January 2025). Google's
  on-device effort has moved to LiteRT (TF Lite itself is now
  maintenance-only), and coverage of TensorFlow 2.21 describes the wider
  project as focused on fixes rather than features. Adopting TF.js today
  means taking on a dependency that is standing still.
- **LiteRT.js** (`@litertjs/core`, 2.5.x, July 2026) is Google's web runtime
  for `.tflite` models: WebGPU, WASM/XNNPack, WebNN.
- **ONNX Runtime Web** (`onnxruntime-web`, 1.30, September 2026) is active,
  framework-neutral (export from PyTorch, Keras or scikit-learn), and has WASM,
  WebGPU and WebNN backends. It is also what **Transformers.js** (4.3,
  October 2026) runs on to pull models straight from the Hugging Face Hub.

## When to reach for a framework

When a game ships a model that is actually big: a convolutional network on
camera frames, a transformer, anything with millions of weights or a
GPU-shaped workload. The sign-language interpreter would be the first
candidate. At that point:

1. Export the model to ONNX (or `.tflite` if it starts in Keras/TF).
2. Run it with ONNX Runtime Web, or Transformers.js if it's a standard
   architecture, in a Web Worker. Load the runtime with a dynamic import when
   the game mounts, as the current games already do.
3. Let it fetch the weights from the Hub (see below) instead of committing
   them.
4. Expect to adjust the CSP. ORT's default build inlines its workers, which
   the hash-only `script-src` written by `src/lib/csp-integration.mjs` won't
   allow. Use the non-inlined build, serve the `.wasm` from the site, and add
   `'wasm-unsafe-eval'`.

Don't use TF.js for new work, for the reasons above.

## Hugging Face Hub

`scripts/models/` publishes each artifact to its own model repo with a
generated model card (what it is, file format, how it was trained, links to
the game and write-up):

| Model | Repo | Files |
| --- | --- | --- |
| Tetris value net | `davidgraymi/tetris-value-net` | `weights.json` |
| ID3 tree | `davidgraymi/id3-mushrooms` | `model.json` |
| KNN training set | `davidgraymi/knn-mnist-subset` | `mnist-subset.bin` |

```bash
HF_TOKEN=hf_... npm run models -- publish   # create repos, upload, record the commit in models.lock.json
npm run models -- pull                      # restore the locked revision, hash-checked
npm run models -- verify                    # local files == lock (runs in CI, no network)
```

`models.lock.json` pins each repo's commit and each file's SHA-256. CI fails if
an artifact changes without being republished, so retraining and publishing
stay in step.

### Why the site doesn't load these from the Hub at runtime

It could. `huggingface.co/<repo>/resolve/<commit>/<file>` sends
`Access-Control-Allow-Origin` for our origin and redirects to a CDN
(`*.cdn.hf.co`) that sends `*`. But for these files:

- **They're tiny.** 2–72 KB gzipped, already same-origin, cached and
  served from GitHub Pages. Two weights files are bundled straight into the game
  chunk.
- **It adds a third party to every play.** Pages would depend on the Hub
  being up. `connect-src` would have to allow `huggingface.co` plus the CDN's
  rotating hostnames, and players' IPs would reach Hugging Face.
- **Offline determinism.** A build today plays the same tomorrow.

Load from the Hub at runtime when a model is too big to commit (multi-MB
weights), using a commit-pinned `resolve` URL and the CSP change above.
Transformers.js does this by default.

## Sources

- TensorFlow Lite → LiteRT and maintenance status: [TensorFlow Lite is now LiteRT](https://developers.googleblog.com/en/tensorflow-lite-is-now-litert/), [tensorflow/lite README](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/lite/README.md), [What's new in TensorFlow 2.21](https://developers.googleblog.com/en/whats-new-in-tensorflow-221/), [google-ai-edge/LiteRT](https://github.com/google-ai-edge/litert)
- ONNX Runtime Web deployment and CSP notes: [Deploying ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/deploy.html)
- Package versions and release dates: npm registry (`npm view <pkg> time`), October 2026
- Bundle sizes, benchmark and Hub CORS headers: measured for this review
