"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Image as ImageIcon } from 'lucide-react';

interface ClusterGalleryProps {
  clusters: Record<string, string[] | string>;
  clusterSizes: Record<string, number>;
}

export default function ClusterGallery({ clusters, clusterSizes }: ClusterGalleryProps) {
  const clusterIds = Object.keys(clusters).sort((a, b) => parseInt(a) - parseInt(b));
  const [activeTab, setActiveTab] = useState<string>(clusterIds[0] || '0');
  
  const rawImages = clusters[activeTab];
  const currentImages = Array.isArray(rawImages) ? rawImages : (rawImages ? [rawImages] : []);

  if (clusterIds.length === 0) {
    return (
      <div className="glass-card h-[500px] flex items-center justify-center flex-col text-gray-500">
        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
        <p>No cluster images available</p>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col h-[500px]">
      <div className="flex border-b border-gray-800 overflow-x-auto custom-scrollbar">
        {clusterIds.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border-b-2 ${
              activeTab === id
                ? 'border-primary-500 text-white bg-gray-800/50'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
            }`}
          >
            Cluster {id}
            <span className="ml-2 text-xs py-0.5 px-2 bg-gray-700/50 rounded-full text-gray-300">
              {clusterSizes[id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {currentImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {currentImages.map((url, idx) => (
              <div key={idx} className="relative group aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {/* Normally we'd use next/image but since URLs might be external/variable, standard img is safer for this demo unless domains are configured */}
                <img 
                  src={url} 
                  alt={`Cluster ${activeTab} frame ${idx}`} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full backdrop-blur-sm text-white hover:bg-white/20">
                    <Eye className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No representative images found for this cluster.</p>
          </div>
        )}
      </div>
    </div>
  );
}
