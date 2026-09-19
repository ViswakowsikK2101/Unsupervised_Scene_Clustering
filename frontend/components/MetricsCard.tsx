import { ReactNode } from "react";
import { Activity, Layers, BarChart3, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number | string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: ReactNode;
}

export function MetricsCard({ title, value, description, badge, badgeColor = "bg-primary-500/10 text-primary-300 border-primary-500/20", icon }: MetricsCardProps) {
  const displayValue = typeof value === 'number' ? value.toFixed(3) : value;
  
  return (
    <div className="glass-card-glow p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.08] group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</h4>
        <div className="text-3xl font-black text-white tracking-tight mb-1 flex items-baseline gap-2">
          {displayValue}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

interface MetricsRowProps {
  silhouette: number;
  calinski: number;
  davies: number;
}

export function MetricsRow({ silhouette, calinski, davies }: MetricsRowProps) {
  const getSilhouetteBadge = (s: number) => {
    if (s > 0.4) return { text: "Excellent Separation", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    if (s > 0.2) return { text: "Good Clustering", color: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30" };
    if (s > 0) return { text: "Moderate Overlap", color: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
    return { text: "High Overlap", color: "bg-red-500/10 text-red-300 border-red-500/30" };
  };

  const silBadge = getSilhouetteBadge(silhouette);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricsCard
        title="Silhouette Coefficient"
        value={silhouette}
        badge={silBadge.text}
        badgeColor={silBadge.color}
        description="Measures cohesion within clusters vs separation from other scenes (-1 to +1)."
        icon={<Activity className="w-6 h-6 text-indigo-400" />}
      />
      <MetricsCard
        title="Calinski-Harabasz Score"
        value={calinski}
        badge="Higher is Better"
        badgeColor="bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
        description="Ratio of between-cluster variance to within-cluster dispersion (compactness)."
        icon={<Layers className="w-6 h-6 text-cyan-400" />}
      />
      <MetricsCard
        title="Davies-Bouldin Index"
        value={davies}
        badge="Lower is Better"
        badgeColor="bg-purple-500/10 text-purple-300 border-purple-500/30"
        description="Average similarity between each cluster and its nearest neighbor."
        icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
      />
    </div>
  );
}
