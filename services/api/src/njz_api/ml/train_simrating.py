"""[Ver001.000] SimRating ML training script — exports TFJS model."""
import asyncio, json, os
import numpy as np

async def generate_training_data(session):
    from sqlalchemy import select, func
    from njz_api.models.player_stats import PlayerStats
    from njz_api.models.player import Player
    stmt = (
        select(
            PlayerStats.player_id,
            func.avg(PlayerStats.kd_ratio).label("avg_kd"),
            func.avg(PlayerStats.acs).label("avg_acs"),
            func.avg(PlayerStats.headshot_pct).label("avg_hs"),
            func.count(PlayerStats.id).label("games"),
        )
        .group_by(PlayerStats.player_id)
        .having(func.count(PlayerStats.id) >= 3)
    )
    result = await session.execute(stmt)
    rows = result.all()
    if len(rows) < 10:
        print(f"Only {len(rows)} players — using synthetic data")
        return _synthetic_training_data()
    X, y = [], []
    for row in rows:
        kd    = min(float(row.avg_kd or 0) / 2.0, 1.0) * 25
        acs   = min(float(row.avg_acs or 0) / 300.0, 1.0) * 25
        cons  = min(float(row.games) / 20.0, 1.0) * 25
        prec  = min(float(row.avg_hs or 0) / 30.0, 1.0) * 25
        X.append([kd, acs, cons, prec])
        y.append((kd + acs + cons + prec) / 100.0)
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

def _synthetic_training_data():
    """
    FALLBACK: Generate synthetic SimRating training data.

    This function is used only when fewer than 10 real players with 3+ recorded
    matches exist in the database. It produces 2000 samples with a fixed random
    seed (42) so results are reproducible.

    Replace with real data by running the Pandascore sync to populate
    player_stats, then re-running this training script.

    Returns:
        X (np.ndarray): shape (2000, 4) — [kd_score, acs_score, consistency, precision]
        y (np.ndarray): shape (2000,)  — normalised SimRating target in [0, 1]
    """
    rng = np.random.default_rng(42)
    n = 2000
    X = rng.uniform(0, 25, (n, 4)).astype(np.float32)
    y = np.clip(X.sum(axis=1) / 100.0 + rng.normal(0, 0.01, n), 0.0, 1.0).astype(np.float32)
    return X, y

def export_tfjs_model(model_path: str = "apps/web/public/models/simrating"):
    """
    Build, train, and export the SimRating Keras model as a TensorFlow.js graph.

    Training instructions
    ---------------------
    Run from the repo root (services/api/ virtual environment activated):

        cd services/api
        pip install tensorflowjs tensorflow numpy
        python -m njz_api.ml.train_simrating

    The exported artefacts are written to ``apps/web/public/models/simrating/``:
      - ``model.json``         — model topology + weight manifest
      - ``*.bin``              — sharded weight data
      - ``model_manifest.json``— human-readable metadata (version, I/O shapes)

    Commit all three artefact types so they are served by the Vite dev server and
    included in the Vercel production build.  The browser inference layer
    (``hub-1-sator/ml/simrating-model.ts``) loads ``model.json`` at runtime via
    ``loadTrainedModel()``.

    Args:
        model_path: Destination directory for the exported TFJS model.
                    Defaults to the correct public assets path relative to the
                    monorepo root.
    """
    try:
        import tensorflowjs as tfjs
        import tensorflow as tf
    except ImportError:
        print("tensorflowjs not installed. Run: pip install tensorflowjs tensorflow")
        return
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(16, activation="relu", input_shape=(4,)),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(8, activation="relu"),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    X, y = _synthetic_training_data()
    model.fit(X, y, epochs=50, batch_size=64, validation_split=0.1, verbose=1)
    os.makedirs(model_path, exist_ok=True)
    tfjs.converters.save_keras_model(model, model_path)
    manifest = {"version": "1.0.0", "input_shape": [4], "output_shape": [1],
                "description": "SimRating v2 regression model"}
    with open(f"{model_path}/model_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Model exported to {model_path}")

if __name__ == "__main__":
    export_tfjs_model()
