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
      await api.processVideo(scan_id, options);
      
      router.push(`/results/${scan_id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred during processing.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-400">
          Unsupervised Scene Clustering
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Analyze video structure automatically. Extract frames, compute features, and group similar scenes without labeled data.
        </p>
      </div>

      <div className="glass-card p-6 md:p-8 mb-8">
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

      <div className="flex justify-center">
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
    </div>
  );
}
