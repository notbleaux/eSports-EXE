# ML Models (TF.js/ONNX)

## Player Prediction
```ts
import * as tf from &#39;@tensorflow/tfjs&#39;;

// Load ONNX model
const model = await onnxruntime.InferenceSession.create(&#39;player_pred.onnx&#39;);
const probs = model.predict({input: playerStats});
```

**Models**: Duel win prob, round outcome, EV booster.
**Resources**: [TF.js Esports](https://www.tensorflow.org/js/tutorials), ONNX Runtime Web.

