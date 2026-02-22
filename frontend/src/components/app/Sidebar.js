import { useAuth } from "@/App";
import {
  Activity,
  LayoutDashboard,
  Globe2,
  LogOut,
  Database,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const countries = [
  { name: "All GCC", code: "all", flag: "🌐" },
  { name: "Saudi Arabia", code: "Saudi Arabia", flag: "🇸🇦" },
  { name: "UAE", code: "UAE", flag: "🇦🇪" },
  { name: "Qatar", code: "Qatar", flag: "🇶🇦" },
  { name: "Kuwait", code: "Kuwait", flag: "🇰🇼" },
  { name: "Bahrain", code: "Bahrain", flag: "🇧🇭" },
  { name: "Oman", code: "Oman", flag: "🇴🇲" },
];

export const Sidebar = ({ selectedCountry, onSelectCountry, stats }) => {
  const { email, logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 bg-[#0c0c0e] border-r border-zinc-800/50 flex flex-col z-40"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-['Outfit'] text-white tracking-tight">
              GCC HealthRecruit
            </h1>
            <p className="text-[10px] text-zinc-600 tracking-wide uppercase">
              AI Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-3 mb-3">
          Countries
        </p>
        {countries.map((country) => (
          <TooltipProvider key={country.code} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid={`country-nav-${country.code.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => onSelectCountry(country.code)}
                  className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${
                      selectedCountry === country.code
                        ? "active bg-blue-500/8 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                    }`}
                >
                  <span className="text-base">{country.flag}</span>
                  <span className="flex-1 text-left">{country.name}</span>
                  {stats?.country_stats && (
                    <span className="text-[10px] font-mono text-zinc-600">
                      {country.code === "all"
                        ? stats.total_hospitals
                        : stats.country_stats.find(
                            (c) => c.country === country.code
                          )?.count || 0}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-zinc-900 text-zinc-300 border-zinc-800"
              >
                View {country.name} hospitals
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800/30 space-y-3">
        {stats?.last_refresh && (
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 px-2">
            <Clock className="w-3 h-3" />
            <span>
              Last refresh:{" "}
              {new Date(stats.last_refresh.refreshed_at).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-2">
          <div className="pulse-dot" />
          <span className="text-[10px] text-zinc-500 truncate">{email}</span>
        </div>

        <Button
          data-testid="logout-button"
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-zinc-500 hover:text-red-400 hover:bg-red-500/5 h-9 text-xs gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
