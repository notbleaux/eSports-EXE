// [Ver001.000] TensorFlow.js SimRating ML inference — WASM backend.
import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;
let backendReady = false;

export async function initMLBackend(): Promise<void> {
  try {
    await tf.setBackend('wasm');
    await tf.ready();
    backendReady = true;
    await loadTrainedModel();
  } catch {
    await tf.setBackend('cpu');
    await tf.ready();
    backendReady = true;
    model = buildSimRatingModel();
  }
}

export async function loadTrainedModel(): Promise<boolean> {
  try {
    model = await tf.loadLayersModel('/models/simrating/model.json');
    console.log('[NJZ SimRating] Trained model loaded');
    return true;
  } catch {
    console.warn('[NJZ SimRating] No trained model found, using untrained weights');
    model = buildSimRatingModel();
    return false;
  }
}

export function buildSimRatingModel(): tf.LayersModel {
  const m = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 16, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({ units: 8, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' }),
    ],
  });
  m.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  return m;
}

export async function inferSimRating(components: {
  kd_score: number; acs_score: number;
  consistency_score: number; precision_score: number;
}): Promise<number> {
  const input = [components.kd_score, components.acs_score,
                 components.consistency_score, components.precision_score];
  if (!backendReady || !model) return input.reduce((a, b) => a + b, 0);
  const tensor = tf.tensor2d([input], [1, 4]);
  try {
    const pred = model.predict(tensor) as tf.Tensor;
    const value = (await pred.data())[0];
    pred.dispose();
    return Math.round(value * 100 * 10) / 10;
  } finally { tensor.dispose(); }
}

// Pending request deduplication
const _pending = new Map<string, Promise<number>>();

export async function inferSimRatingDeduped(
  key: string,
  components: Parameters<typeof inferSimRating>[0]
): Promise<number> {
  if (_pending.has(key)) return _pending.get(key)!;
  const p = inferSimRating(components).finally(() => _pending.delete(key));
  _pending.set(key, p);
  return p;
}

export async function inferSimRatingBatch(
  batch: Array<{ key: string } & Parameters<typeof inferSimRating>[0]>
): Promise<number[]> {
  if (!model) return batch.map(b => Object.values(b).slice(1).reduce((a: number, v) => a + (v as number), 0));
  const inputs = batch.map(b => [b.kd_score, b.acs_score, b.consistency_score, b.precision_score]);
  const tensor = tf.tensor2d(inputs, [inputs.length, 4]);
  try {
    const pred = model.predict(tensor) as tf.Tensor;
    const raw = await pred.data();
    pred.dispose();
    return Array.from(raw).map(v => Math.round(v * 100 * 10) / 10);
  } finally {
    tensor.dispose();
  }
}
