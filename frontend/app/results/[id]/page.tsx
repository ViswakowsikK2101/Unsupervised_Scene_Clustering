"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ScanResults, ScanInfo } from "@/lib/api";
import ProcessingStatus from "@/components/ProcessingStatus";
import { MetricsRow } from "@/components/MetricsCard";
import ScatterPlot from "@/components/ScatterPlot";
import ClusterGallery from "@/components/ClusterGallery";
import SceneTimeline from "@/components/SceneTimeline";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ScanResults | null>(null);
  const [scanInfo, setScanInfo] = useState<any>(null); // Simplified typing for now
  
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
        const data = await api.getResults(id);
        setResults(data);
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
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span>Results</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-300 font-mono">{id}</span>
        </div>
      </div>

      <MetricsRow 
        silhouette={results.metrics.silhouette_score}
        calinski={results.metrics.calinski_harabasz_score}
        davies={results.metrics.davies_bouldin_score}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ScatterPlot 
          tsneCoords={results.tsne_coords} 
          pcaCoords={results.pca_coords}
          labels={results.cluster_labels} 
        />
        <ClusterGallery 
          clusters={results.representative_frames}
          clusterSizes={results.cluster_sizes}
        />
      </div>

      <SceneTimeline timelineData={results.timeline_data} />
    </div>
  );
}
