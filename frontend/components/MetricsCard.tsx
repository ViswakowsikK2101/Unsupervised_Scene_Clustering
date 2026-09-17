import { ReactNode } from "react";

interface MetricsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
}

export function MetricsCard({ title, value, description, icon }: MetricsCardProps) {
  const displayValue = typeof value === 'number' ? value.toFixed(3) : value;
  
  return (
    <div className="glass-card p-6 flex items-start gap-4">
      <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-1">{title}</h4>
        <div className="text-2xl font-bold text-white mb-1">{displayValue}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

interface MetricsRowProps {
  silhouette: number;
  calinski: number;
  davies: number;
}

import { Activity, Layers, BarChart3 } from "lucide-react";

export function MetricsRow({ silhouette, calinski, davies }: MetricsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricsCard
        title="Silhouette Score"
        value={silhouette}
        description="Higher is better (range -1 to 1)"
        icon={<Activity className="w-6 h-6 text-primary-400" />}
      />
      <MetricsCard
        title="Calinski-Harabasz"
        value={calinski}
        description="Higher is better (variance ratio)"
        icon={<Layers className="w-6 h-6 text-accent-400" />}
      />
      <MetricsCard
        title="Davies-Bouldin"
        value={davies}
        description="Lower is better (avg similarity)"
        icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
      />
    </div>
  );
}
