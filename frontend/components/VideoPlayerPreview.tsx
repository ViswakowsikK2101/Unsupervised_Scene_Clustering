'use client';

import { useState, useRef } from 'react';
import { Film, Sparkles, SkipForward } from 'lucide-react';

const CLUSTER_COLORS = [
  '#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', 
  '#8b5cf6', '#3b82f6', '#84cc16', '#f43f5e', '#14b8a6'
];

interface TimelinePoint {
  frame_idx: number;
  timestamp: number;
  cluster: number;
}

interface VideoPlayerPreviewProps {
  videoUrl?: string;
  timelineData: TimelinePoint[];
  numClusters: number;
  activeCluster?: string;
  onClusterChange?: (clusterId: string) => void;
}

export default function VideoPlayerPreview({
  videoUrl,
  timelineData,
  numClusters,
  activeCluster,
  onClusterChange,
}: VideoPlayerPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentCluster, setCurrentCluster] = useState<number>(0);

  // Find active cluster based on playback time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Find closest frame in timelineData
    if (timelineData && timelineData.length > 0) {
      let closest = timelineData[0];
      let minDiff = Math.abs(timelineData[0].timestamp - time);

      for (let i = 1; i < timelineData.length; i++) {
        const diff = Math.abs(timelineData[i].timestamp - time);
        if (diff < minDiff) {
          minDiff = diff;
          closest = timelineData[i];
        }
      }

      if (closest && closest.cluster !== currentCluster) {
        setCurrentCluster(closest.cluster);
        if (onClusterChange) {
          onClusterChange(String(closest.cluster));
        }
      }
    }
  };

  // Find earliest timestamp for each cluster to jump to
  const clusterTimestamps = (timelineData || []).reduce<Record<number, number>>((acc, curr) => {
    if (acc[curr.cluster] === undefined || curr.timestamp < acc[curr.cluster]) {
      acc[curr.cluster] = curr.timestamp;
    }
    return acc;
  }, {});

  const seekToCluster = (clusterId: number) => {
    const targetTime = clusterTimestamps[clusterId];
    if (targetTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = targetTime;
      videoRef.current.play();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeColor = CLUSTER_COLORS[currentCluster % CLUSTER_COLORS.length];

  return (
    <div className="glass-card-glow p-6 mb-8 border border-white/[0.08] relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interactive Video Scene Synchronizer</h3>
            <p className="text-xs text-gray-400">Watch playback with synchronized real-time scene cluster classification</p>
          </div>
        </div>

        {/* Real-time active scene pill */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md"
          style={{
            backgroundColor: `${activeColor}15`,
            borderColor: `${activeColor}40`,
            color: activeColor,
          }}
        >
          <span className="w-2 h-2 rounded-full animate-ping inline-block" style={{ backgroundColor: activeColor }} />
          <span>Active Scene: Cluster {currentCluster}</span>
          <span className="text-gray-400 font-mono text-[11px]">[{formatSeconds(currentTime)}]</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* HTML5 Video Player */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-black/80 border border-white/[0.1] shadow-2xl relative aspect-video flex items-center justify-center">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-center gap-2">
              <Film className="w-10 h-10 opacity-30" />
              <p className="text-xs">Direct video stream URL unavailable or local only</p>
            </div>
          )}
        </div>

        {/* Scene Jump Sidebar */}
        <div className="flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Jump to Scene Start
            </span>
            <span className="font-mono text-[11px]">{Object.keys(clusterTimestamps).length} Entry Points</span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
            {Object.keys(clusterTimestamps)
              .map(Number)
              .sort((a, b) => a - b)
              .map((cId) => {
                const t = clusterTimestamps[cId];
                const color = CLUSTER_COLORS[cId % CLUSTER_COLORS.length];
                const isCurrent = currentCluster === cId;
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => seekToCluster(cId)}
                    className={`px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all group ${
                      isCurrent
                        ? 'bg-white/[0.1] shadow-md border-white/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Scene {cId}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Starts at {formatSeconds(t)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-white transition-colors">
                      <SkipForward className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
