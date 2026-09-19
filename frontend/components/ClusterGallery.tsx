"use client";

import { useState } from 'react';
import { Eye, Image as ImageIcon, Sparkles, Layers, Percent } from 'lucide-react';

const CLUSTER_COLORS = [
  '#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', 
  '#8b5cf6', '#3b82f6', '#84cc16', '#f43f5e', '#14b8a6'
];

interface ClusterGalleryProps {
  clusters: Record<string, string[] | string>;
  clusterSizes: Record<string, number>;
  activeCluster?: string;
  onSelectCluster?: (clusterId: string) => void;
}

export default function ClusterGallery({ clusters, clusterSizes, activeCluster, onSelectCluster }: ClusterGalleryProps) {
  const clusterIds = Object.keys(clusters).sort((a, b) => parseInt(a) - parseInt(b));
  const [selectedTab, setSelectedTab] = useState<string>(clusterIds[0] || '0');
  
  const currentTab = activeCluster || selectedTab;
  const currentIdx = clusterIds.indexOf(currentTab);
  const clusterColor = CLUSTER_COLORS[Math.max(0, currentIdx) % CLUSTER_COLORS.length];

  const totalFrames = Object.values(clusterSizes).reduce((a, b) => a + b, 0);

  const rawImages = clusters[currentTab];
  const currentImages = Array.isArray(rawImages) ? rawImages : (rawImages ? [rawImages] : []);

  const handleTabClick = (id: string) => {
    setSelectedTab(id);
    if (onSelectCluster) onSelectCluster(id);
  };

  if (clusterIds.length === 0) {
    return (
      <div className="glass-card-glow h-[520px] flex items-center justify-center flex-col text-gray-500 p-8">
        <ImageIcon className="w-12 h-12 mb-4 text-gray-600 animate-pulse" />
        <p className="text-sm font-medium text-gray-400">No representative scene keyframes found</p>
      </div>
    );
  }

  const currentCount = clusterSizes[currentTab] || 0;
  const currentPercent = totalFrames > 0 ? ((currentCount / totalFrames) * 100).toFixed(1) : '0';

  return (
    <div className="glass-card-glow flex flex-col h-[520px] overflow-hidden border border-white/[0.08]">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-white text-sm">Representative Scene Centroids</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400">
            {clusterIds.length} Unique Scenes
          </span>
        </div>
      </div>

      {/* Cluster Tab Pills */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto custom-scrollbar p-2 gap-1.5 bg-black/20">
        {clusterIds.map((id, i) => {
          const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
          const isSelected = currentTab === id;
          const count = clusterSizes[id] || 0;
          return (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-white/[0.1] text-white shadow-lg'
                  : 'bg-white/[0.02] text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] border-transparent'
              }`}
              style={{
                borderColor: isSelected ? color : 'transparent'
              }}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span>Scene {id}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono text-gray-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cluster Meta Stats Bar */}
      <div className="px-5 py-3 bg-white/[0.01] border-b border-white/[0.04] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">
            Frames in Scene: <strong className="text-white">{currentCount}</strong>
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400 flex items-center gap-1">
            Density: <strong className="text-indigo-300 font-mono">{currentPercent}%</strong> of video
          </span>
        </div>
        <span 
          className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border font-mono"
          style={{ 
            color: clusterColor, 
            borderColor: `${clusterColor}40`,
            backgroundColor: `${clusterColor}15`
          }}
        >
          Centroid Exemplar
        </span>
      </div>

      {/* Frame Preview Grid */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
        {currentImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentImages.map((url, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-xl overflow-hidden border border-white/[0.1] bg-gray-900/80 shadow-md aspect-video hover:border-indigo-500/50 transition-all duration-300"
              >
                <img 
                  src={url} 
                  alt={`Cluster ${currentTab} representative frame`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                  <span className="text-[11px] font-mono text-gray-300 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    Scene Centroid Frame
                  </span>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1.5 bg-white/10 hover:bg-white/30 rounded-lg backdrop-blur-md text-white transition-colors"
                    title="Open Full Image"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <p className="text-xs">No preview frames available for Scene {currentTab}</p>
          </div>
        )}
      </div>
    </div>
  );
}
