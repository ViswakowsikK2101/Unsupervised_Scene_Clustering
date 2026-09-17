"""
Pipeline for the complete unsupervised scene clustering process.
"""
import os
import logging
import numpy as np
from typing import Dict, Any, Optional

from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from sklearn.metrics import pairwise_distances_argmin_min

from .frame_extractor import FrameExtractor
from .feature_extractor import get_feature_extractor
from .clustering import SceneClusterer
from .evaluation import ClusterEvaluator

logger = logging.getLogger(__name__)

class SceneClusteringPipeline:
    """
    Orchestrates the entire scene clustering workflow.
    """
    
    def __init__(self, feature_method: str = 'cnn', clustering_method: str = 'kmeans', 
                 n_clusters: int = 5, pca_components: int = 50, sample_rate: int = 1):
        self.feature_method = feature_method
        self.clustering_method = clustering_method
        self.n_clusters = n_clusters
        self.pca_components = pca_components
        self.sample_rate = sample_rate
        
        self.frame_extractor = FrameExtractor()
        self.feature_extractor = get_feature_extractor(feature_method)
        self.clusterer = SceneClusterer()
        self.evaluator = ClusterEvaluator()

    def run(self, video_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Run the clustering pipeline on a video.
        
        Args:
            video_path: Path to the input video.
            output_dir: Optional directory to save intermediate outputs (like frames).
            
        Returns:
            Dictionary containing comprehensive results.
        """
        logger.info(f"Starting scene clustering pipeline for: {video_path}")
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        video_name = os.path.basename(video_path)
        
        # 1. Extract frames
        try:
            frames, timestamps = self.frame_extractor.extract_frames(
                video_path, sample_rate=self.sample_rate, output_dir=output_dir
            )
            total_frames = len(frames)
            
            if total_frames == 0:
                raise ValueError("No frames extracted from the video.")
                
            duration = timestamps[-1] if timestamps else 0.0
            
        except Exception as e:
            logger.error(f"Frame extraction failed: {e}")
            raise
            
        # 2. Extract features
        try:
            features = self.feature_extractor.extract(frames)
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            raise
            
        # 3. Dimensionality reduction (PCA)
        try:
            reduced_features = self.clusterer.reduce_dimensions(
                features, n_components=self.pca_components
            )
        except Exception as e:
            logger.error(f"Dimensionality reduction failed: {e}")
            reduced_features = features
            
        # 4. Clustering
        try:
            labels = self.clusterer.cluster(
                reduced_features, 
                method=self.clustering_method, 
                n_clusters=self.n_clusters
            )
        except Exception as e:
            logger.error(f"Clustering failed: {e}")
            raise
            
        # 5. Evaluation
        try:
            eval_results = self.evaluator.evaluate(reduced_features, labels)
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            eval_results = {}
            
        # 6. Compute t-SNE for visualization (2D)
        logger.info("Computing t-SNE coordinates for visualization...")
        try:
            perplexity = min(30, max(5, total_frames // 3)) # Ensure valid perplexity
            tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity)
            tsne_coords = tsne.fit_transform(reduced_features).tolist()
        except Exception as e:
            logger.error(f"t-SNE computation failed: {e}")
            tsne_coords = [[0.0, 0.0] for _ in range(total_frames)]
            
        # 7. Compute PCA for visualization (2D)
        logger.info("Computing 2D PCA coordinates for visualization...")
        try:
            pca_2d = PCA(n_components=2, random_state=42)
            pca_coords = pca_2d.fit_transform(reduced_features).tolist()
        except Exception as e:
            logger.error(f"2D PCA computation failed: {e}")
            pca_coords = [[0.0, 0.0] for _ in range(total_frames)]
            
        # 8. Identify representative frames (closest to centroid)
        logger.info("Identifying representative frames for each cluster...")
        representative_frames = {}
        unique_labels = set(labels)
        
        for label in unique_labels:
            if label == -1: # Skip noise cluster
                continue
                
            cluster_indices = np.where(labels == label)[0]
            cluster_features = reduced_features[cluster_indices]
            
            if len(cluster_features) > 0:
                # Compute centroid
                centroid = np.mean(cluster_features, axis=0).reshape(1, -1)
                # Find closest point to centroid
                closest, _ = pairwise_distances_argmin_min(centroid, cluster_features)
                original_idx = int(cluster_indices[closest[0]])
                representative_frames[int(label)] = [original_idx]
                
        # 9. Assemble timeline data
        timeline_data = []
        for i, (ts, label) in enumerate(zip(timestamps, labels)):
            timeline_data.append({
                'frame_idx': i,
                'timestamp': float(ts),
                'cluster': int(label)
            })
            
        # Construct final result dict
        results = {
            'scan_info': {
                'video_name': video_name,
                'duration': duration,
                'total_frames_in_video': None,
                'sampled_frames': total_frames,
                'feature_method': self.feature_method,
                'clustering_method': self.clustering_method,
                'n_clusters': eval_results.get('n_clusters', self.n_clusters)
            },
            'metrics': {
                'silhouette': eval_results.get('silhouette_score'),
                'calinski_harabasz': eval_results.get('calinski_harabasz_score'),
                'davies_bouldin': eval_results.get('davies_bouldin_score')
            },
            'cluster_labels': [int(lbl) for lbl in labels],
            'cluster_sizes': eval_results.get('cluster_sizes', {}),
            'tsne_coords': tsne_coords,
            'pca_coords': pca_coords,
            'timeline_data': timeline_data,
            'representative_frames': representative_frames
        }
        
        logger.info("Pipeline execution completed successfully.")
        return results
