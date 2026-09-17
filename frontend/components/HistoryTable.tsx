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
              <tr key={scan.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FileVideo className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="truncate max-w-[200px]">{scan.video_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {new Date(scan.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-gray-300">{scan.feature_method}</span>
                    <span className="text-xs text-gray-500">{scan.clustering_method}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-gray-500" />
                    {scan.num_clusters}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(scan.status)}`}>
                    {scan.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {scan.status === 'completed' && (
                      <Link 
                        href={`/results/${scan.id}`}
                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="View Results"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this scan?')) {
                          onDelete(scan.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
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
