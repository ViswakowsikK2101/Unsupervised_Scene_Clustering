"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { Clock } from 'lucide-react';

const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#84cc16', '#a855f7', '#f43f5e', '#0ea5e9', '#22c55e'
];

interface SceneTimelineProps {
  timelineData: {
    frame_idx: number;
    timestamp: number;
    cluster: number;
  }[];
}

export default function SceneTimeline({ timelineData }: SceneTimelineProps) {
  const data = useMemo(() => {
    // We add a constant height 'value' for the bar chart so it looks like a timeline
    return timelineData.map(item => ({
      ...item,
      value: 1, 
      formattedTime: formatTime(item.timestamp)
    }));
  }, [timelineData]);

  if (!data || data.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4 text-white font-semibold border-b border-gray-800 pb-2">
        <Clock className="w-4 h-4 text-primary-400" />
        <h3>Scene Timeline</h3>
      </div>
      
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 20, left: 10 }} barGap={0} barCategoryGap={0}>
            <XAxis 
              dataKey="formattedTime" 
              tick={{fill: '#9ca3af', fontSize: 10}} 
              stroke="#4b5563" 
              interval="preserveStartEnd"
              minTickGap={50}
            />
            {/* Hide Y axis completely */}
            <YAxis hide domain={[0, 1]} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-gray-900 border border-gray-700 p-2 rounded shadow-lg text-sm">
                      <p className="text-white font-medium">{d.formattedTime}</p>
                      <p className="text-gray-400 flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[d.cluster % COLORS.length] }}></span>
                        Cluster {d.cluster}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Frame {d.frame_idx}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.cluster % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
