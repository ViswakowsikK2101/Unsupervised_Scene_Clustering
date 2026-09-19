"use client";

import { ScanInfo } from "@/lib/api";
import Link from "next/link";
import { Trash2, Eye, FileVideo, Calendar, LayoutGrid } from "lucide-react";

interface HistoryTableProps {
  scans: ScanInfo[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export default function HistoryTable({ scans, onDelete, loading }: HistoryTableProps) {
  if (loading) {
    return (
      <div className="glass-card p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-3 border-gray-600 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
        <FileVideo className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-gray-300 mb-2">No history yet</h3>
        <p className="text-gray-500 mb-6">Upload and analyze a video to see your history here.</p>
        <Link href="/" className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors">
          Upload Video
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Video Name</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Clusters</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {scans.map((scan) => (
              <tr 
                key={scan.id} 
                onClick={() => {
                  if (scan.status === 'completed') {
                    window.location.href = `/results/${scan.id}`;
                  }
                }}
                className={`transition-colors ${scan.status === 'completed' ? 'hover:bg-primary-950/20 cursor-pointer' : 'hover:bg-gray-800/30'}`}
              >
                <td className="px-6 py-4 font-medium text-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0 text-primary-400">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-white truncate max-w-[220px] block">{scan.video_name}</span>
                      <span className="text-xs text-gray-500 font-mono">{scan.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-gray-200 font-medium capitalize">{scan.feature_method}</span>
                    <span className="text-xs text-primary-400 uppercase tracking-wider">{scan.clustering_method}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-accent-400" />
                    <span className="text-gray-200 font-semibold">{scan.num_clusters}</span>
                    <span className="text-xs text-gray-500">scenes</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${getStatusColor(scan.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${scan.status === 'completed' ? 'bg-green-400 animate-pulse' : scan.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    {scan.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {scan.status === 'completed' && (
                      <Link 
                        href={`/results/${scan.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600 border border-primary-500/30 text-primary-300 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                        title="View Detailed Results"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Result</span>
                      </Link>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this scan?')) {
                          onDelete(scan.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-800/40 rounded-lg transition-colors"
                      title="Delete Scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
