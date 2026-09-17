"use client";

import { useEffect, useState } from "react";
import { api, ScanInfo } from "@/lib/api";
import HistoryTable from "@/components/HistoryTable";
import { RefreshCw } from "lucide-react";

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory(50, 0);
      setScans(data.items);
      setError("");
    } catch (err: any) {
      setError("Failed to load history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteScan(id);
      setScans(scans.filter(scan => scan.id !== id));
    } catch (err: any) {
      alert("Failed to delete scan: " + err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Scan History</h1>
          <p className="text-gray-400">View and manage your previous video analysis sessions.</p>
        </div>
        <button 
          onClick={loadHistory}
          disabled={loading}
          className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      ) : (
        <HistoryTable scans={scans} onDelete={handleDelete} loading={loading} />
      )}
    </div>
  );
}
