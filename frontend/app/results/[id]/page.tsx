"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ScanResults, ScanInfo } from "@/lib/api";
import ProcessingStatus from "@/components/ProcessingStatus";
import { MetricsRow } from "@/components/MetricsCard";
import ScatterPlot from "@/components/ScatterPlot";
import ClusterGallery from "@/components/ClusterGallery";
import SceneTimeline from "@/components/SceneTimeline";
import VideoPlayerPreview from "@/components/VideoPlayerPreview";
import { ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ScanResults | null>(null);
  const [scanInfo, setScanInfo] = useState<any>(null); // Simplified typing for now
  const [highlightedCluster, setHighlightedCluster] = useState<string>('0');
  
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const statusData = await api.getStatus(id);
        
        if (statusData.status === 'completed') {
          clearInterval(pollInterval);
          fetchResults();
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setError(statusData.error || "Processing failed");
          setLoading(false);
        }
        // If processing or pending, do nothing and wait for next poll
      } catch (err: any) {
        clearInterval(pollInterval);
        setError("Failed to fetch status: " + err.message);
        setLoading(false);
      }
    };

    const fetchResults = async () => {
      try {
        const [resultsData, scanData] = await Promise.allSettled([
          api.getResults(id),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/history/${id}`).then(r => r.ok ? r.json() : null)
        ]);
        
        if (resultsData.status === 'fulfilled') {
          setResults(resultsData.value);
        } else {
          throw new Error(resultsData.reason?.message || "Failed to load results");
        }

        if (scanData.status === 'fulfilled' && scanData.value) {
          setScanInfo(scanData.value);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError("Failed to fetch results: " + err.message);
        setLoading(false);
      }
    };

    // Initial check
    checkStatus();
    
    // Set up polling
    pollInterval = setInterval(checkStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [id]);

  if (loading) {
    return <ProcessingStatus />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <div className="glass-card p-8 border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Processing Video</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col gap-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Upload
        </Link>
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Results</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-white font-mono text-xs bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">{id.slice(0, 8)}...</span>
          </div>

          {scanInfo && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300">
                {scanInfo.video_name}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                Method: <strong className="text-white uppercase">{scanInfo.feature_method}</strong>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                Clusterer: <strong className="text-accent-400 uppercase">{scanInfo.clustering_method}</strong>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 font-semibold">
                {scanInfo.num_clusters} Scenes Detected
              </span>
            </div>
          )}
        </div>
      </div>

      <MetricsRow 
        silhouette={results.metrics?.silhouette_score ?? 0}
        calinski={results.metrics?.calinski_harabasz_score ?? 0}
        davies={results.metrics?.davies_bouldin_score ?? 0}
      />

      {/* Synchronized Video Player & Scene Scrubber */}
      <VideoPlayerPreview
        videoUrl={scanInfo?.video_url}
        timelineData={results.timeline_data || []}
        numClusters={scanInfo?.num_clusters || 5}
        activeCluster={highlightedCluster}
        onClusterChange={setHighlightedCluster}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ScatterPlot 
          tsneCoords={results.tsne_coords || []} 
          pcaCoords={results.pca_coords || []}
          labels={results.cluster_labels || []} 
        />
        <ClusterGallery 
          clusters={results.representative_frames || {}}
          clusterSizes={results.cluster_sizes || {}}
          activeCluster={highlightedCluster}
          onSelectCluster={setHighlightedCluster}
        />
      </div>

      <SceneTimeline timelineData={results.timeline_data} />

      {/* Visual Explainer & Presentation Guide Section */}
      <div className="mt-12 border-t border-white/[0.08] pt-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">How to Read & Present These Results</h3>
            <p className="text-xs text-gray-400">Step-by-step breakdown of every graph, metric, and visualizer on this dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card-glow p-5 border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs mb-3">
              01
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Validation Metrics</h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              Prove the quality of your clustering without needing ground truth:
            </p>
            <ul className="text-[11px] text-gray-400 space-y-1.5">
              <li><strong className="text-indigo-300">Silhouette</strong>: High score (&gt;0.2) means frames in the same scene look alike, and different scenes are separated.</li>
              <li><strong className="text-cyan-300">Calinski-Harabasz</strong>: High value shows compact, dense clusters.</li>
              <li><strong className="text-purple-300">Davies-Bouldin</strong>: Low score indicates low similarity between scenes.</li>
            </ul>
          </div>

          <div className="glass-card-glow p-5 border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs mb-3">
              02
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Scene Synchronizer</h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              Real-time video verification:
            </p>
            <ul className="text-[11px] text-gray-400 space-y-1.5">
              <li><strong className="text-white">Active Scene Pill</strong>: Automatically detects and displays which scene cluster the video is currently in as it plays.</li>
              <li><strong className="text-white">Jump Buttons</strong>: Click any scene entry point to jump the video directly to the start of that scene.</li>
            </ul>
          </div>

          <div className="glass-card-glow p-5 border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center text-xs mb-3">
              03
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">2D Manifold Scatter</h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              Visualizing high-dimensional space:
            </p>
            <ul className="text-[11px] text-gray-400 space-y-1.5">
              <li><strong className="text-white">Each Dot</strong>: Represents a sampled video frame.</li>
              <li><strong className="text-white">Colors</strong>: Correspond to assigned scene clusters.</li>
              <li><strong className="text-white">t-SNE vs PCA</strong>: Toggle between non-linear manifold projection and principal variance components.</li>
            </ul>
          </div>

          <div className="glass-card-glow p-5 border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs mb-3">
              04
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">Centroids & Timeline</h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              Video story structure:
            </p>
            <ul className="text-[11px] text-gray-400 space-y-1.5">
              <li><strong className="text-white">Centroid Keyframe</strong>: The single mathematical center frame that best represents that entire scene.</li>
              <li><strong className="text-white">Timeline Bar</strong>: Shows continuous temporal sequence and where shot cuts occurred across video duration.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
