# [Ver001.000] ML Inference Guide — SimRating

## Training the Model
```bash
cd services/api
pip install tensorflowjs tensorflow numpy
python -m njz_api.ml.train_simrating
```
The trained model is exported to `apps/web/public/models/simrating/`.
Commit `model.json` and `*.bin` files to make them available in production.

## Browser Inference
The WASM backend is initialized on first load via `initMLBackend()`.
If the trained model is not found, untrained weights are used (ratings will be random).

## Updating the Model
Re-run training after collecting 50+ real player_stats records (via Pandascore sync).
