"""
Module for clustering scene features.
"""
import logging
import numpy as np
from typing import Tuple, List, Optional
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import PCA

logger = logging.getLogger(__name__)

class SceneClusterer:
    """
    Clusters scene features using various algorithms.
    """
    
    def reduce_dimensions(self, features: np.ndarray, n_components: int = 50) -> np.ndarray:
        """
        Reduce dimensionality of features using PCA.
        
        Args:
            features: Input features array (N_samples, n_features).
            n_components: Target number of dimensions.
            
        Returns:
            Reduced features array (N_samples, n_components).
        """
        n_samples, n_features = features.shape
        if n_features <= n_components:
            logger.info(f"Skipping PCA reduction: {n_features} <= {n_components}")
            return features
            
        target_components = min(n_samples, n_components)
        logger.info(f"Reducing dimensions from {n_features} to {target_components} using PCA")
        
        pca = PCA(n_components=target_components, random_state=42)
        return pca.fit_transform(features)

    def cluster(self, features: np.ndarray, method: str, **params) -> np.ndarray:
        """
        Cluster features using the specified method.
        
        Args:
            features: Features array to cluster.
            method: Clustering method ('kmeans', 'agglomerative', 'dbscan').
            **params: Additional parameters for the clustering algorithm.
            
        Returns:
            Array of cluster labels.
        """
        method = method.lower()
        logger.info(f"Clustering {len(features)} samples using {method} with params: {params}")
        
        if method == 'kmeans':
            n_clusters = params.get('n_clusters', 5)
            # Ensure n_clusters is not greater than the number of samples
            n_clusters = min(n_clusters, len(features))
            model = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
            
        elif method == 'agglomerative':
            n_clusters = params.get('n_clusters', 5)
            n_clusters = min(n_clusters, len(features))
            linkage = params.get('linkage', 'ward')
            model = AgglomerativeClustering(n_clusters=n_clusters, linkage=linkage)
            
        elif method == 'dbscan':
            eps = params.get('eps')
            min_samples = params.get('min_samples', 5)
            
            if eps is None:
                # Auto-compute eps using k-distance graph
                k = min_samples
                if len(features) > k:
                    neigh = NearestNeighbors(n_neighbors=k)
                    neigh.fit(features)
                    distances, _ = neigh.kneighbors(features)
                    # Use the knee point of sorted k-distances, heuristic: 90th percentile
                    k_distances = np.sort(distances[:, -1])
                    eps = np.percentile(k_distances, 90)
                    if eps == 0:
                        eps = 1e-3
                    logger.info(f"Auto-computed eps for DBSCAN: {eps:.4f}")
                else:
                    eps = 0.5
                    
            model = DBSCAN(eps=eps, min_samples=min_samples)
            
        else:
            raise ValueError(f"Unknown clustering method: {method}")
            
        labels = model.fit_predict(features)
        
        n_clusters_found = len(set(labels)) - (1 if -1 in labels else 0)
        logger.info(f"Clustering completed. Found {n_clusters_found} clusters.")
        
        return labels
        
    def find_optimal_k(self, features: np.ndarray, k_range: Tuple[int, int] = (2, 15)) -> Tuple[int, List[float]]:
        """
        Find optimal k for KMeans using the Elbow method.
        
        Args:
            features: Features array.
            k_range: Tuple of (min_k, max_k) to evaluate.
            
        Returns:
            Tuple of (optimal_k, list_of_inertias).
        """
        min_k, max_k = k_range
        max_k = min(max_k, len(features) - 1)
        
        if max_k <= min_k:
            logger.warning(f"Insufficient samples to find optimal k within range {k_range}.")
            return max(1, len(features) // 2), []
            
        inertias = []
        k_values = list(range(min_k, max_k + 1))
        
        logger.info(f"Finding optimal k in range {min_k} to {max_k}")
        
        for k in k_values:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
            kmeans.fit(features)
            inertias.append(kmeans.inertia_)
            
        # Simple heuristic to find elbow: point with max distance from line connecting first and last point
        p1 = np.array([k_values[0], inertias[0]])
        p2 = np.array([k_values[-1], inertias[-1]])
        
        distances = []
        v1 = p2 - p1
        v1_norm = np.linalg.norm(v1)
        
        for i, (k, inertia) in enumerate(zip(k_values, inertias)):
            p0 = np.array([k, inertia])
            v2 = p1 - p0
            # Distance from point p0 to line (p1, p2) using 2D cross product equivalent
            cross_2d = v1[0] * v2[1] - v1[1] * v2[0]
            d = np.abs(cross_2d) / v1_norm if v1_norm > 0 else 0
            distances.append(d)
            
        optimal_idx = np.argmax(distances)
        optimal_k = k_values[optimal_idx]
        
        logger.info(f"Optimal k found: {optimal_k}")
        
        return optimal_k, inertias
