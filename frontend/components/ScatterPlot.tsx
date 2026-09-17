"use client";

import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Layers } from 'lucide-react';

const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#84cc16', '#a855f7', '#f43f5e', '#0ea5e9', '#22c55e'
];

interface ScatterPlotProps {
  tsneCoords: number[][];
  pcaCoords: number[][];
  labels: number[];
  title?: string;
}

export default function ScatterPlot({ tsneCoords, pcaCoords, labels, title = "Cluster Distribution" }: ScatterPlotProps) {
  const [viewMode, setViewMode] = useState<'tsne' | 'pca'>('tsne');

  const data = useMemo(() => {
    const coords = viewMode === 'tsne' ? tsneCoords : pcaCoords;
    if (!coords || !labels) return [];
    
    return coords.map((coord, idx) => ({
      x: coord[0],
      y: coord[1],
      cluster: labels[idx],
      frameIdx: idx,
    }));
  }, [tsneCoords, pcaCoords, labels, viewMode]);

  const uniqueClusters = Array.from(new Set(labels)).sort((a, b) => a - b);

  return (
    <div className="glass-card flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-400" />
          {title}
        </h3>
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('tsne')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'tsne' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            t-SNE
          </button>
          <button
            onClick={() => setViewMode('pca')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'pca' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            PCA
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" dataKey="x" name="X" tick={{fill: '#9ca3af', fontSize: 12}} stroke="#4b5563" />
            <YAxis type="number" dataKey="y" name="Y" tick={{fill: '#9ca3af', fontSize: 12}} stroke="#4b5563" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
                      <p className="text-white font-medium mb-1">Frame {data.frameIdx}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[data.cluster % COLORS.length] }}></span>
                        Cluster {data.cluster}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Frames" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="p-3 border-t border-gray-800 bg-gray-900/50 flex flex-wrap gap-3 overflow-y-auto max-h-24">
        {uniqueClusters.map(cluster => (
          <div key={cluster} className="flex items-center gap-1.5 text-xs text-gray-300">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[cluster % COLORS.length] }}></div>
            Cluster {cluster}
          </div>
        ))}
      </div>
    </div>
  );
}
