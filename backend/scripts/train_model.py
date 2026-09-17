"""
Model Training Script for Unsupervised Scene Clustering.

Loads dataset videos, extracts frames, computes features,
fits PCA transformer, runs baseline clustering, and saves model artifacts.

Usage:
    python scripts/train_model.py
    python scripts/train_model.py --dataset-dir datasets/ --feature-method cnn
    python scripts/train_model.py --lite  # Use lightweight features (histogram)
"""

import os
import sys
import json
import time
import pickle
import logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Fix for SSL certificate verification errors when downloading PyTorch models
import ssl
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Add parent directory to path so we can import from backend modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def load_dataset_manifest(dataset_dir: str) -> Dict:
    """Load the dataset manifest created by download_dataset.py."""
    manifest_path = os.path.join(dataset_dir, "manifest.json")
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(
            f"Dataset manifest not found at {manifest_path}. "
            f"Run 'python scripts/download_dataset.py' first."
        )
    with open(manifest_path, "r") as f:
        return json.load(f)


def extract_all_frames(
    video_paths: Dict[str, str],
    sample_rate: int = 1,
    frames_dir: str = None
) -> Tuple[List[np.ndarray], List[Dict]]:
    """
    Extract frames from all dataset videos.

    Returns:
        frames: List of frame arrays
        frame_metadata: List of dicts with {video_name, frame_idx, timestamp}
    """
    from ml.frame_extractor import FrameExtractor

    extractor = FrameExtractor()
    all_frames = []
    all_metadata = []

    for video_name, video_path in video_paths.items():
        if not os.path.exists(video_path):
            logger.warning(f"Video not found, skipping: {video_path}")
            continue

        logger.info(f"Extracting frames from: {video_name}")

        try:
            frames, timestamps = extractor.extract_frames(
                video_path=video_path,
                sample_rate=sample_rate
            )

            # Save frames if output dir specified
            if frames_dir:
                video_frames_dir = os.path.join(frames_dir, video_name)
                os.makedirs(video_frames_dir, exist_ok=True)
                extractor.save_frames(frames, timestamps, video_frames_dir)

            for i, (frame, ts) in enumerate(zip(frames, timestamps)):
                all_frames.append(frame)
                all_metadata.append({
                    "video_name": video_name,
                    "frame_idx": i,
                    "timestamp": ts
                })

            logger.info(
                f"  Extracted {len(frames)} frames "
                f"(duration: {timestamps[-1]:.1f}s)"
            )

        except Exception as e:
            logger.error(f"  Error extracting frames from {video_name}: {e}")
            continue

    logger.info(f"Total frames extracted: {len(all_frames)}")
    return all_frames, all_metadata


def compute_features(
    frames: List[np.ndarray],
    method: str = "cnn",
    batch_size: int = 32
) -> np.ndarray:
    """
    Compute feature vectors for all frames.

    Args:
        frames: List of frame arrays (BGR format)
        method: 'cnn' for ResNet-50 or 'histogram' for HSV histograms
        batch_size: Batch size for CNN inference

    Returns:
        features: numpy array of shape (N, feature_dim)
    """
    from ml.feature_extractor import get_feature_extractor

    logger.info(f"Computing features using method: {method}")
    extractor = get_feature_extractor(method)

    start_time = time.time()
    features = extractor.extract(frames)
    elapsed = time.time() - start_time

    logger.info(
        f"Feature extraction complete: "
        f"{features.shape[0]} frames × {features.shape[1]} dimensions "
        f"({elapsed:.1f}s)"
    )

    return features


def fit_pca(
    features: np.ndarray,
    n_components: int = 50
) -> Tuple[np.ndarray, object]:
    """
    Fit PCA on training features and transform.

    Returns:
        reduced_features: PCA-transformed features
        pca_model: Fitted PCA object (for saving)
    """
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler

    logger.info(f"Fitting PCA: {features.shape[1]}D → {n_components}D")

    # Standardize features first
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # Fit PCA
    pca = PCA(n_components=n_components, random_state=42)
    reduced = pca.fit_transform(features_scaled)

    explained_var = np.sum(pca.explained_variance_ratio_) * 100
    logger.info(
        f"PCA complete: explained variance = {explained_var:.1f}%"
    )

    return reduced, pca, scaler


def run_baseline_clustering(
    features: np.ndarray,
    k_range: Tuple[int, int] = (2, 15)
) -> Dict:
    """
    Run baseline clustering to establish reference metrics.

    Tests multiple values of K and selects the optimal one.
    """
    from ml.clustering import SceneClusterer
    from ml.evaluation import ClusterEvaluator

    clusterer = SceneClusterer()
    evaluator = ClusterEvaluator()

    logger.info(f"Running baseline clustering (K range: {k_range[0]}-{k_range[1]})")

    # Find optimal K using elbow method
    optimal_k, inertias = clusterer.find_optimal_k(features, k_range=k_range)
    logger.info(f"Optimal K (elbow method): {optimal_k}")

    # Run clustering with multiple methods for comparison
    results = {}

    # KMeans with optimal K
    logger.info(f"\n--- KMeans (K={optimal_k}) ---")
    kmeans_labels = clusterer.cluster(
        features, method="kmeans", n_clusters=optimal_k
    )
    kmeans_metrics = evaluator.evaluate(features, kmeans_labels)
    results["kmeans"] = {
        "labels": kmeans_labels.tolist(),
        "metrics": kmeans_metrics,
        "n_clusters": optimal_k
    }
    logger.info(f"  Silhouette Score: {kmeans_metrics['silhouette_score']:.4f}")
    logger.info(f"  Calinski-Harabasz: {kmeans_metrics['calinski_harabasz_score']:.4f}")
    logger.info(f"  Davies-Bouldin: {kmeans_metrics['davies_bouldin_score']:.4f}")

    # Agglomerative with optimal K
    logger.info(f"\n--- Agglomerative (K={optimal_k}) ---")
    agg_labels = clusterer.cluster(
        features, method="agglomerative", n_clusters=optimal_k
    )
    agg_metrics = evaluator.evaluate(features, agg_labels)
    results["agglomerative"] = {
        "labels": agg_labels.tolist(),
        "metrics": agg_metrics,
        "n_clusters": optimal_k
    }
    logger.info(f"  Silhouette Score: {agg_metrics['silhouette_score']:.4f}")
    logger.info(f"  Calinski-Harabasz: {agg_metrics['calinski_harabasz_score']:.4f}")
    logger.info(f"  Davies-Bouldin: {agg_metrics['davies_bouldin_score']:.4f}")

    # DBSCAN (auto eps)
    logger.info(f"\n--- DBSCAN (auto eps) ---")
    try:
        dbscan_labels = clusterer.cluster(
            features, method="dbscan", min_samples=5
        )
        n_dbscan_clusters = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
        if n_dbscan_clusters >= 2:
            dbscan_metrics = evaluator.evaluate(features, dbscan_labels)
            results["dbscan"] = {
                "labels": dbscan_labels.tolist(),
                "metrics": dbscan_metrics,
                "n_clusters": n_dbscan_clusters
            }
            logger.info(f"  Clusters found: {n_dbscan_clusters}")
            logger.info(f"  Silhouette Score: {dbscan_metrics['silhouette_score']:.4f}")
        else:
            logger.warning(f"  DBSCAN found only {n_dbscan_clusters} cluster(s) — skipping metrics")
            results["dbscan"] = {"labels": dbscan_labels.tolist(), "n_clusters": n_dbscan_clusters}
    except Exception as e:
        logger.warning(f"  DBSCAN failed: {e}")
        results["dbscan"] = {"error": str(e)}

    results["optimal_k"] = optimal_k
    results["inertias"] = inertias

    return results


def save_model_artifacts(
    model_dir: str,
    pca_model,
    scaler,
    baseline_results: Dict,
    feature_method: str,
    training_metadata: Dict
) -> None:
    """Save all model artifacts for later inference."""
    os.makedirs(model_dir, exist_ok=True)

    # Save PCA model
    pca_path = os.path.join(model_dir, "pca_model.pkl")
    with open(pca_path, "wb") as f:
        pickle.dump(pca_model, f)
    logger.info(f"Saved PCA model: {pca_path}")

    # Save scaler
    scaler_path = os.path.join(model_dir, "scaler.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    logger.info(f"Saved scaler: {scaler_path}")

    # Save baseline results
    baseline_path = os.path.join(model_dir, "baseline_results.json")

    # Convert numpy types to native Python types for JSON serialization
    def convert_for_json(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: convert_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_for_json(v) for v in obj]
        return obj

    with open(baseline_path, "w") as f:
        json.dump(convert_for_json(baseline_results), f, indent=2)
    logger.info(f"Saved baseline results: {baseline_path}")

    # Save training metadata
    metadata = {
        "feature_method": feature_method,
        "pca_components": pca_model.n_components,
        "explained_variance_ratio": float(np.sum(pca_model.explained_variance_ratio_)),
        "training_samples": training_metadata.get("n_samples", 0),
        "training_videos": training_metadata.get("n_videos", 0),
        "feature_dim": training_metadata.get("feature_dim", 0),
        "optimal_k": baseline_results.get("optimal_k", 5),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    metadata_path = os.path.join(model_dir, "training_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved training metadata: {metadata_path}")


def train(
    dataset_dir: str = None,
    model_dir: str = None,
    feature_method: str = "cnn",
    pca_components: int = 50,
    sample_rate: int = 1,
    save_frames: bool = False
) -> None:
    """
    Full training pipeline:
    1. Load dataset manifest
    2. Extract frames from all videos
    3. Compute features (histogram or CNN)
    4. Fit PCA dimensionality reduction
    5. Run baseline clustering with multiple algorithms
    6. Save model artifacts
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if dataset_dir is None:
        dataset_dir = os.path.join(base_dir, "datasets")
    if model_dir is None:
        model_dir = os.path.join(base_dir, "models")

    logger.info("=" * 60)
    logger.info("Scene Clustering Model Training")
    logger.info(f"Feature method: {feature_method}")
    logger.info(f"PCA components: {pca_components}")
    logger.info(f"Sample rate: 1 frame per {sample_rate} second(s)")
    logger.info(f"Dataset dir: {dataset_dir}")
    logger.info(f"Model dir: {model_dir}")
    logger.info("=" * 60)

    # Step 1: Load dataset
    logger.info("\n[Step 1/5] Loading dataset manifest...")
    manifest = load_dataset_manifest(dataset_dir)
    video_paths = {
        name: info["path"]
        for name, info in manifest["videos"].items()
    }
    logger.info(f"Found {len(video_paths)} videos in dataset")

    # Step 2: Extract frames
    logger.info("\n[Step 2/5] Extracting frames from all videos...")
    frames_dir = os.path.join(base_dir, "training_frames") if save_frames else None
    frames, frame_metadata = extract_all_frames(
        video_paths, sample_rate=sample_rate, frames_dir=frames_dir
    )

    if len(frames) < 10:
        logger.error(
            f"Too few frames extracted ({len(frames)}). "
            f"Need at least 10 frames for training. "
            f"Check your dataset directory."
        )
        sys.exit(1)

    # Step 3: Compute features
    logger.info("\n[Step 3/5] Computing features...")
    features = compute_features(frames, method=feature_method)

    # Step 4: Fit PCA
    logger.info("\n[Step 4/5] Fitting PCA for dimensionality reduction...")
    n_components = min(pca_components, features.shape[0] - 1, features.shape[1])
    reduced_features, pca_model, scaler = fit_pca(features, n_components=n_components)

    # Step 5: Run baseline clustering
    logger.info("\n[Step 5/5] Running baseline clustering...")
    max_k = min(15, len(frames) // 2)
    baseline_results = run_baseline_clustering(
        reduced_features,
        k_range=(2, max(3, max_k))
    )

    # Save everything
    logger.info("\nSaving model artifacts...")
    save_model_artifacts(
        model_dir=model_dir,
        pca_model=pca_model,
        scaler=scaler,
        baseline_results=baseline_results,
        feature_method=feature_method,
        training_metadata={
            "n_samples": len(frames),
            "n_videos": len(video_paths),
            "feature_dim": features.shape[1]
        }
    )

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Videos processed: {len(video_paths)}")
    logger.info(f"Total frames: {len(frames)}")
    logger.info(f"Feature dimensions: {features.shape[1]} → {n_components} (PCA)")
    logger.info(f"Optimal K: {baseline_results['optimal_k']}")

    best_method = "kmeans"
    best_score = -1
    for method in ["kmeans", "agglomerative"]:
        if method in baseline_results:
            score = baseline_results[method].get("metrics", {}).get("silhouette_score", -1)
            if score > best_score:
                best_score = score
                best_method = method

    logger.info(f"Best clustering method: {best_method} (silhouette={best_score:.4f})")
    logger.info(f"\nModel artifacts saved to: {model_dir}")
    logger.info(
        f"Files: pca_model.pkl, scaler.pkl, "
        f"baseline_results.json, training_metadata.json"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Train scene clustering model on downloaded dataset"
    )
    parser.add_argument(
        "--dataset-dir",
        type=str,
        default=None,
        help="Path to dataset directory (default: backend/datasets/)"
    )
    parser.add_argument(
        "--model-dir",
        type=str,
        default=None,
        help="Path to save model artifacts (default: backend/models/)"
    )
    parser.add_argument(
        "--feature-method",
        type=str,
        choices=["cnn", "histogram"],
        default="cnn",
        help="Feature extraction method"
    )
    parser.add_argument(
        "--pca-components",
        type=int,
        default=50,
        help="Number of PCA components"
    )
    parser.add_argument(
        "--sample-rate",
        type=int,
        default=1,
        help="Frame sample rate (1 = one frame per second)"
    )
    parser.add_argument(
        "--lite",
        action="store_true",
        help="Use histogram features instead of CNN (faster)"
    )
    parser.add_argument(
        "--save-frames",
        action="store_true",
        help="Save extracted frames to disk"
    )

    args = parser.parse_args()

    feature_method = "histogram" if args.lite else args.feature_method

    train(
        dataset_dir=args.dataset_dir,
        model_dir=args.model_dir,
        feature_method=feature_method,
        pca_components=args.pca_components,
        sample_rate=args.sample_rate,
        save_frames=args.save_frames
    )
