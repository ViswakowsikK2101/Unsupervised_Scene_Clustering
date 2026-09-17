-- scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    video_name TEXT NOT NULL,
    video_duration FLOAT,
    total_frames INT,
    sampled_frames INT,
    feature_method TEXT NOT NULL DEFAULT 'cnn',
    clustering_method TEXT NOT NULL DEFAULT 'kmeans',
    num_clusters INT DEFAULT 5,
    status TEXT DEFAULT 'processing',
    video_url TEXT,
    thumbnail_url TEXT
);

-- scan_results table  
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    silhouette_score FLOAT,
    calinski_harabasz_score FLOAT,
    davies_bouldin_score FLOAT,
    cluster_labels JSONB,
    cluster_sizes JSONB,
    tsne_coords JSONB,
    pca_coords JSONB,
    timeline_data JSONB,
    representative_frames JSONB
);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - service role)
CREATE POLICY "Allow all on scans" ON scans FOR ALL USING (true);
CREATE POLICY "Allow all on scan_results" ON scan_results FOR ALL USING (true);

-- Storage buckets (run in Supabase dashboard)
-- CREATE BUCKET video-uploads;
-- CREATE BUCKET frame-thumbnails;
