"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoUploader from "@/components/VideoUploader";
import { api, ProcessOptions } from "@/lib/api";
import { Brain, Layers, Activity } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ProcessOptions>({
    feature_method: "Color Histogram",
    clustering_method: "KMeans",
    num_clusters: 5,
  });

  const handleProcess = async () => {
    if (!file) {
      setError("Please select a video file first.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const { scan_id } = await api.uploadVideo(file);
      
      const mappedOptions = {
        ...options,
        feature_method: options.feature_method === 'Color Histogram' ? 'histogram' : 'cnn',
        clustering_method: options.clustering_method.toLowerCase(),
        n_clusters: options.num_clusters,
        num_clusters: options.num_clusters,
      };
      
      await api.processVideo(scan_id, mappedOptions);
      
      router.push(`/results/${scan_id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred during processing.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-14 mb-10 text-center border border-primary-500/20 bg-gradient-to-b from-primary-950/40 via-gray-900/60 to-gray-950/80 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
          Digital Video Technology · Computer Vision & ML
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
            Unsupervised Video
          </span>{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-indigo-400 to-accent-400">
            Scene Clustering
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
          Automated temporal segmentation and semantic grouping of continuous video streams. 
          Extract frames, project high-dimensional deep features into latent manifolds, and partition video into coherent story scenes without ground-truth labels.
        </p>

        {/* Quick Highlights / Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
            <span className="text-xs text-gray-400 font-mono">STEP 01</span>
            <p className="text-sm font-semibold text-white mt-1">Adaptive Sampling</p>
            <p className="text-xs text-gray-400 mt-0.5">FPS-based keyframe capture</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
            <span className="text-xs text-primary-400 font-mono">STEP 02</span>
            <p className="text-sm font-semibold text-white mt-1">Feature Extraction</p>
            <p className="text-xs text-gray-400 mt-0.5">ResNet-50 2048D / HSV</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
            <span className="text-xs text-accent-400 font-mono">STEP 03</span>
            <p className="text-sm font-semibold text-white mt-1">Latent Reduction</p>
            <p className="text-xs text-gray-400 mt-0.5">PCA & t-SNE Projections</p>
          </div>
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
            <span className="text-xs text-green-400 font-mono">STEP 04</span>
            <p className="text-sm font-semibold text-white mt-1">Clustering & Eval</p>
            <p className="text-xs text-gray-400 mt-0.5">KMeans, Agglo & DBSCAN</p>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="glass-card p-6 md:p-8 mb-8 border-primary-500/20 shadow-xl">
        <VideoUploader onFileSelect={setFile} selectedFile={file} />
        
        {error && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 text-primary-400">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold text-white">Feature Method</h3>
          </div>
          <div className="space-y-3">
            {['Color Histogram', 'CNN (ResNet-50)'].map((method) => (
              <label key={method} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="feature_method"
                  value={method}
                  checked={options.feature_method === method}
                  onChange={(e) => setOptions({ ...options, feature_method: e.target.value })}
                  className="w-4 h-4 text-primary-500 bg-gray-800 border-gray-700 focus:ring-primary-500"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">{method}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 text-accent-400">
            <Brain className="w-5 h-5" />
            <h3 className="font-semibold text-white">Clustering Method</h3>
          </div>
          <div className="space-y-3">
            {['KMeans', 'Agglomerative', 'DBSCAN'].map((method) => (
              <label key={method} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="clustering_method"
                  value={method}
                  checked={options.clustering_method === method}
                  onChange={(e) => setOptions({ ...options, clustering_method: e.target.value })}
                  className="w-4 h-4 text-accent-500 bg-gray-800 border-gray-700 focus:ring-accent-500"
                />
                <span className="text-gray-300 group-hover:text-white transition-colors">{method}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-white">Number of Clusters</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>2</span>
              <span className="font-bold text-white bg-gray-800 px-2 py-1 rounded">{options.num_clusters}</span>
              <span>20</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              value={options.num_clusters}
              onChange={(e) => setOptions({ ...options, num_clusters: parseInt(e.target.value) })}
              disabled={options.clustering_method === 'DBSCAN'}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-blue-500"
            />
            {options.clustering_method === 'DBSCAN' && (
              <p className="text-xs text-gray-500 mt-2">Determined automatically by DBSCAN</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-16">
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Brain className="w-6 h-6" />
              Analyze Video
            </>
          )}
        </button>
      </div>

      {/* Educational & Technical Architecture Guide Section */}
      <div className="border-t border-gray-800/80 pt-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Unsupervised Scene Clustering Works
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            A comprehensive overview of the computer vision and unsupervised machine learning pipeline powering this system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 border-primary-500/10 hover:border-primary-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold mb-4 text-sm">
              01
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">1. Visual Feature Extraction</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Videos are decomposed into sampled frames. Each frame is encoded into a high-dimensional vector using either:
            </p>
            <ul className="mt-3 text-xs text-gray-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">Color Histograms (HSV)</strong>: 3000-dimensional color distribution capturing lighting, palette, and shot warmth.</li>
              <li><strong className="text-white">Deep CNN (ResNet-50)</strong>: 2048-dimensional embeddings from the global average pooling layer capturing high-level semantic objects and contextual scene semantics.</li>
            </ul>
          </div>

          <div className="glass-card p-6 border-accent-500/10 hover:border-accent-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 text-accent-400 flex items-center justify-center font-bold mb-4 text-sm">
              02
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">2. Manifold & Latent Reduction</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Raw 2048D vectors suffer from the curse of dimensionality. The pipeline employs:
            </p>
            <ul className="mt-3 text-xs text-gray-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">PCA (50 Components)</strong>: Retains ~80% of total variance while eliminating noisy orthogonal dimensions and speeding up distance computations.</li>
              <li><strong className="text-white">t-SNE Projection</strong>: Non-linear probabilistic dimensionality reduction projecting clusters onto a 2D Euclidean coordinate plane for interactive visual inspection.</li>
            </ul>
          </div>

          <div className="glass-card p-6 border-blue-500/10 hover:border-blue-500/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4 text-sm">
              03
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">3. Unsupervised Partitioning</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Grouping continuous frame sequences without labeled training data:
            </p>
            <ul className="mt-3 text-xs text-gray-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">K-Means</strong>: Minimizes intra-cluster inertia around learned centroid vectors.</li>
              <li><strong className="text-white">Agglomerative Hierarchical</strong>: Bottom-up Ward's minimum variance linkage merging adjacent frame neighborhoods.</li>
              <li><strong className="text-white">DBSCAN</strong>: Density-based clustering with automatically computed $\varepsilon$ radius via k-nearest neighbor distance curvature.</li>
            </ul>
          </div>
        </div>

        {/* Evaluation Metrics Explained */}
        <div className="glass-card p-6 md:p-8 bg-gray-900/40 border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-3">Model Quality Evaluation Metrics Explained</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 bg-gray-800/40 rounded-xl border border-gray-700/50">
              <span className="font-semibold text-primary-400">Silhouette Coefficient</span>
              <p className="text-xs text-gray-400 mt-1">
                Measures how similar a frame is to its own cluster compared to neighboring clusters. Ranges from -1 to +1 (higher is better).
              </p>
            </div>
            <div className="p-3.5 bg-gray-800/40 rounded-xl border border-gray-700/50">
              <span className="font-semibold text-accent-400">Calinski-Harabasz Index</span>
              <p className="text-xs text-gray-400 mt-1">
                Variance ratio criterion representing the ratio of the between-clusters dispersion mean to the within-cluster dispersion. Higher values denote distinct, compact clusters.
              </p>
            </div>
            <div className="p-3.5 bg-gray-800/40 rounded-xl border border-gray-700/50">
              <span className="font-semibold text-yellow-400">Davies-Bouldin Index</span>
              <p className="text-xs text-gray-400 mt-1">
                Evaluates the similarity between each cluster and its most similar one. A lower score indicates better clustering separation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
