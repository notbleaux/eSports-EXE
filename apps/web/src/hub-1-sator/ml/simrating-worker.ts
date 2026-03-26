// [Ver001.000] SimRating inference Web Worker — offloads TF.js from main thread.
/// <reference lib="webworker" />
import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;

async function init() {
  try {
    await tf.setBackend('wasm');
    await tf.ready();
  } catch {
    await tf.setBackend('cpu');
    await tf.ready();
  }
  try {
    model = await tf.loadLayersModel('/models/simrating/model.json');
  } catch {
    // No trained model — worker will return null scores
  }
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { id, players } = e.data as {
    id: string;
    players: Array<{ kd: number; acs: number; cons: number; prec: number }>;
  };

  if (!model) {
    self.postMessage({ id, scores: players.map(() => null) });
    return;
  }

  const inputs = players.map(p => [p.kd, p.acs, p.cons, p.prec]);
  const tensor = tf.tensor2d(inputs, [inputs.length, 4]);
  try {
    const pred = model.predict(tensor) as tf.Tensor;
    const raw = await pred.data();
    pred.dispose();
    const scores = Array.from(raw).map(v => Math.round(v * 100 * 10) / 10);
    self.postMessage({ id, scores });
  } finally {
    tensor.dispose();
  }
});

init();
