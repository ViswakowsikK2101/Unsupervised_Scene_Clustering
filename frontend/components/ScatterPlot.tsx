"use client";

import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Layers } from 'lucide-react';

const COLORS = [
  '#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', 
  '#8b5cf6', '#3b82f6', '#84cc16', '#f43f5e', '#14b8a6'
];

interface ScatterPlotProps {
  tsneCoords: number[][];
  pcaCoords: number[][];
  labels: number[];
  title?: string;
}

export default function ScatterPlot({ tsneCoords, pcaCoords, labels, title = "2D Manifold Latent Projection" }: ScatterPlotProps) {
  const [viewMode, setViewMode] = useState<'tsne' | 'pca'>('tsne');

  const data = useMemo(() => {
    const coords = viewMode === 'tsne' ? tsneCoords : pcaCoords;
    if (!coords || !labels) return [];
    
    return coords.map((coord, idx) => ({
      x: Number(coord[0].toFixed(3)),
      y: Number(coord[1].toFixed(3)),
      cluster: labels[idx],
      frameIdx: idx,
    }));
  }, [tsneCoords, pcaCoords, labels, viewMode]);

  const uniqueClusters = Array.from(new Set(labels)).sort((a, b) => a - b);

  return (
    <div className="glass-card-glow flex flex-col h-[520px] overflow-hidden border border-white/[0.08]">
      <div className="p-4 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.02]">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-cyan-400" />
            {title}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {viewMode === 'tsne' ? 'Non-linear t-Distributed Stochastic Neighbor Embedding' : 'Linear Principal Component Analysis (Orthogonal Variance)'}
          </p>
        </div>
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/[0.08]">
          <button
            onClick={() => setViewMode('tsne')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'tsne' 
                ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            t-SNE
          </button>
          <button
            onClick={() => setViewMode('pca')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'pca' 
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            PCA
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Component 1" 
              tick={{fill: '#6b7280', fontSize: 10}} 
              stroke="rgba(255, 255, 255, 0.1)" 
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Component 2" 
              tick={{fill: '#6b7280', fontSize: 10}} 
              stroke="rgba(255, 255, 255, 0.1)" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255, 255, 255, 0.2)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const cColor = COLORS[d.cluster % COLORS.length];
                  return (
                    <div className="bg-gray-950/90 border border-white/[0.15] p-3 rounded-xl shadow-2xl backdrop-blur-xl text-xs">
                      <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/[0.08]">
                        <span className="text-white font-bold">Sample #{d.frameIdx}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded" style={{ backgroundColor: `${cColor}20`, color: cColor }}>
                          Scene {d.cluster}
                        </span>
                      </div>
                      <div className="text-gray-400 space-y-1 font-mono text-[11px]">
                        <p>X: <strong className="text-gray-200">{d.x}</strong></p>
                        <p>Y: <strong className="text-gray-200">{d.y}</strong></p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Frames" data={data}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.cluster % COLORS.length]} 
                  opacity={0.85}
                  r={4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Cluster Legend Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-black/30 flex flex-wrap items-center gap-3 overflow-x-auto custom-scrollbar">
        <span className="text-[11px] font-semibold text-gray-400">Clusters:</span>
        {uniqueClusters.map((cluster) => (
          <div key={cluster} className="flex items-center gap-1.5 text-xs text-gray-300">
            <span 
              className="w-2.5 h-2.5 rounded-full shadow-sm" 
              style={{ backgroundColor: COLORS[cluster % COLORS.length] }}
            />
            <span>Scene {cluster}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
