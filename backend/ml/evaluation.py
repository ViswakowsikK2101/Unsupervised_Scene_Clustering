"""
Module for evaluating clustering results.
"""
import logging
import numpy as np
from typing import Dict, Any
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score

logger = logging.getLogger(__name__)

class ClusterEvaluator:
    """
    Evaluates clustering quality using various metrics.
    """
    
    def evaluate(self, features: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
        """
        Evaluate clustering results.
        
        Args:
            features: Original features used for clustering.
            labels: Cluster labels assigned to each sample.
            
        Returns:
            Dictionary containing evaluation metrics and cluster statistics.
        """
        logger.info("Evaluating clustering results")
        
        unique_labels = np.unique(labels)
        n_clusters = len(unique_labels) - (1 if -1 in labels else 0)
        
        # Calculate cluster sizes
        cluster_sizes = {}
        for label in unique_labels:
            # Cast label to int for JSON serialization later
            cluster_sizes[int(label)] = int(np.sum(labels == label))
            
        results = {
            'n_clusters': n_clusters,
            'cluster_sizes': cluster_sizes,
            'silhouette_score': None,
            'calinski_harabasz_score': None,
            'davies_bouldin_score': None
        }
        
        # Metrics require at least 2 clusters and not all points being noise
        valid_labels_mask = labels != -1
        valid_features = features[valid_labels_mask]
        valid_labels = labels[valid_labels_mask]
        
        n_valid_clusters = len(np.unique(valid_labels))
        
        if n_valid_clusters > 1 and len(valid_features) > n_valid_clusters:
            try:
                results['silhouette_score'] = float(silhouette_score(valid_features, valid_labels))
                results['calinski_harabasz_score'] = float(calinski_harabasz_score(valid_features, valid_labels))
                results['davies_bouldin_score'] = float(davies_bouldin_score(valid_features, valid_labels))
                logger.info(f"Evaluation metrics computed successfully. Silhouette: {results['silhouette_score']:.4f}")
            except Exception as e:
                logger.error(f"Error computing clustering metrics: {e}")
        else:
            logger.warning(f"Cannot compute metrics: need at least 2 clusters, found {n_valid_clusters}")
            
        return results
