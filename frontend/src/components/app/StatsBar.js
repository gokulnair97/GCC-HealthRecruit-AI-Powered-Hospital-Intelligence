import { Database, Globe2, Building2, Clock, TrendingUp } from "lucide-react";

export const StatsBar = ({ stats }) => {
  if (!stats) return null;

  const statItems = [
    {
      label: "Total Hospitals",
      value: stats.total_hospitals || 0,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Countries",
      value: stats.country_stats?.length || 0,
      icon: Globe2,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Regions",
      value: stats.region_stats?.length || 0,
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Last Update",
      value: stats.last_refresh
        ? new Date(stats.last_refresh.refreshed_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Never",
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-bar">
      {statItems.map((item, idx) => (
        <div
          key={item.label}
          className={`glass-card rounded-xl p-5 animate-fade-in-up stagger-${idx + 1} group hover:-translate-y-1 transition-all duration-300`}
          style={{ opacity: 0, animationFillMode: "forwards" }}
          data-testid={`stat-card-${idx}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
            </div>
          </div>
          <p className="stat-number text-2xl font-bold font-['Outfit'] text-zinc-100">{item.value}</p>
          <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">{item.label}</p>
        </div>
      ))}
    </div>
  );
};
