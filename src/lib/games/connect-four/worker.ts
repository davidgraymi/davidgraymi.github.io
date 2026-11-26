// Runs the thinking model off the main thread and streams every outer step back.
import { parseWeights, ThinkingModel } from './model';

type In = { type: 'load'; url: string } | { type: 'think'; id: number; tokens: number[] } | { type: 'cancel'; id: number };

let model: ThinkingModel | null = null;
let current = 0;

const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<In>) => {
  const msg = e.data;
  if (msg.type === 'load') {
    try {
      const res = await fetch(msg.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      model = new ThinkingModel(parseWeights(await res.arrayBuffer()));
      post({ type: 'ready' });
    } catch (err) {
      post({ type: 'error', message: String(err) });
    }
  } else if (msg.type === 'cancel') {
    if (current === msg.id) current = 0;
  } else if (msg.type === 'think' && model) {
    current = msg.id;
    const steps = model.think(msg.tokens);
    for (;;) {
      const t0 = performance.now();
      const next = steps.next();
      if (next.done) break;
      if (current !== msg.id) return; // a newer request or a new game
      post({ type: 'step', id: msg.id, out: next.value, ms: performance.now() - t0 });
      await new Promise((r) => setTimeout(r, 0)); // let cancel messages in between steps
    }
    if (current === msg.id) post({ type: 'done', id: msg.id });
  }
};
