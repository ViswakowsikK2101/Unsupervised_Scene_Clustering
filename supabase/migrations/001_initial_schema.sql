-- ============================================================================
-- Unsupervised Scene Clustering — Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: scans — Stores video scan history
-- =============================================================================
CREATE TABLE IF NOT EXISTS scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    video_name TEXT NOT NULL,
    video_duration FLOAT,
    total_frames INT,
    sampled_frames INT,
    feature_method TEXT NOT NULL DEFAULT 'cnn',
    clustering_method TEXT NOT NULL DEFAULT 'kmeans',
    num_clusters INT DEFAULT 5,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    video_url TEXT,
    thumbnail_url TEXT
);

-- =============================================================================
-- Table: scan_results — Stores clustering results for each scan
-- =============================================================================
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    silhouette_score FLOAT,
    calinski_harabasz_score FLOAT,
    davies_bouldin_score FLOAT,
    cluster_labels JSONB,
    cluster_sizes JSONB,
    tsne_coords JSONB,
    pca_coords JSONB,
    timeline_data JSONB,
    representative_frames JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for service role key usage from backend)
-- In production, you'd restrict this to authenticated users
CREATE POLICY "Allow all operations on scans"
    ON scans FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on scan_results"
    ON scan_results FOR ALL
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- Storage Buckets (create these manually in Supabase Dashboard)
-- =============================================================================
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket: "video-uploads" (public: false)
-- 3. Create bucket: "frame-thumbnails" (public: true)
--
-- Storage policies for frame-thumbnails (public read):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('video-uploads', 'video-uploads', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('frame-thumbnails', 'frame-thumbnails', true);
