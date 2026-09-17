const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ScanInfo {
  id: string;
  created_at: string;
  video_name: string;
  video_duration: number;
  total_frames: number;
  sampled_frames: number;
  feature_method: string;
  clustering_method: string;
  num_clusters: number;
  status: string;
  video_url: string;
  thumbnail_url: string;
}

export interface ScanResults {
  metrics: {
    silhouette_score: number;
    calinski_harabasz_score: number;
    davies_bouldin_score: number;
  };
  cluster_labels: number[];
  cluster_sizes: Record<string, number>;
  tsne_coords: number[][];
  pca_coords: number[][];
  timeline_data: {
    frame_idx: number;
    timestamp: number;
    cluster: number;
  }[];
  representative_frames: Record<string, string[]>;
}

export interface ProcessOptions {
  feature_method: string;
  clustering_method: string;
  num_clusters: number;
}

export interface StatusResponse {
  id: string;
  status: string;
  progress?: number;
  message?: string;
  error?: string;
}

export interface ScanListResponse {
  items: ScanInfo[];
  total: number;
}

export const api = {
  uploadVideo: async (file: File): Promise<{ scan_id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  processVideo: async (scanId: string, options: ProcessOptions): Promise<void> => {
    const res = await fetch(`${API_URL}/api/process/${scanId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Process failed');
  },

  getStatus: async (scanId: string): Promise<StatusResponse> => {
    const res = await fetch(`${API_URL}/api/status/${scanId}`);
    if (!res.ok) throw new Error('Get status failed');
    return res.json();
  },

  getResults: async (scanId: string): Promise<ScanResults> => {
    const res = await fetch(`${API_URL}/api/results/${scanId}`);
    if (!res.ok) throw new Error('Get results failed');
    return res.json();
  },

  getHistory: async (limit: number = 20, offset: number = 0): Promise<ScanListResponse> => {
    const res = await fetch(`${API_URL}/api/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Get history failed');
    return res.json();
  },

  deleteScan: async (scanId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/scans/${scanId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Delete scan failed');
  }
};
