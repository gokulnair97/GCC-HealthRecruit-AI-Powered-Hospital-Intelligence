import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const regionColors = {
  "Riyadh": "from-blue-500/20 to-blue-600/5",
  "Jeddah": "from-cyan-500/20 to-cyan-600/5",
  "Dammam": "from-emerald-500/20 to-emerald-600/5",
  "Makkah": "from-amber-500/20 to-amber-600/5",
  "Madinah": "from-purple-500/20 to-purple-600/5",
  "Dubai": "from-orange-500/20 to-orange-600/5",
  "Abu Dhabi": "from-rose-500/20 to-rose-600/5",
  "Sharjah": "from-teal-500/20 to-teal-600/5",
  "Doha": "from-indigo-500/20 to-indigo-600/5",
  "Kuwait City": "from-yellow-500/20 to-yellow-600/5",
  "Manama": "from-pink-500/20 to-pink-600/5",
  "Muscat": "from-lime-500/20 to-lime-600/5",
};

const regionBorders = {
  "Riyadh": "hover:border-blue-500/40",
  "Jeddah": "hover:border-cyan-500/40",
  "Dammam": "hover:border-emerald-500/40",
  "Makkah": "hover:border-amber-500/40",
  "Madinah": "hover:border-purple-500/40",
  "Dubai": "hover:border-orange-500/40",
  "Abu Dhabi": "hover:border-rose-500/40",
  "Sharjah": "hover:border-teal-500/40",
  "Doha": "hover:border-indigo-500/40",
  "Kuwait City": "hover:border-yellow-500/40",
  "Manama": "hover:border-pink-500/40",
  "Muscat": "hover:border-lime-500/40",
};

export const RegionFilter = ({
  regions,
  selectedRegion,
  selectedCountry,
  onSelectRegion,
  onRefreshRegion,
  refreshing,
}) => {
  // Filter regions based on selected country
  const filteredRegions = selectedCountry !== "all"
    ? { [selectedCountry]: regions[selectedCountry] || [] }
    : regions;

  return (
    <div className="space-y-4" data-testid="region-filter">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600">Filter by Region</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          data-testid="region-btn-all"
          onClick={() => onSelectRegion("all", selectedCountry)}
          className={`region-pill px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200
            ${selectedRegion === "all"
              ? "region-btn-active text-blue-300 border-blue-500/50"
              : "bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
        >
          All Regions
        </button>

        {Object.entries(filteredRegions).map(([country, regionList]) => (
          regionList.map((region) => (
            <button
              key={region}
              data-testid={`region-btn-${region.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => onSelectRegion(region, country)}
              className={`region-pill px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-200
                ${selectedRegion === region
                  ? "region-btn-active text-blue-300 border-blue-500/50"
                  : `bg-gradient-to-r ${regionColors[region] || "from-zinc-800/50 to-zinc-900/50"} text-zinc-400 border-zinc-800 ${regionBorders[region] || "hover:border-zinc-700"} hover:text-zinc-200`
                }`}
            >
              {region}
              {selectedCountry === "all" && (
                <span className="ml-1.5 text-[9px] text-zinc-600">{country.split(" ")[0]}</span>
              )}
            </button>
          ))
        ))}

        {/* Refresh selected region */}
        {selectedRegion !== "all" && (
          <Button
            data-testid="region-refresh-button"
            onClick={() => onRefreshRegion(selectedRegion)}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-blue-400 h-auto py-2 px-3 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "spin-slow" : ""}`} />
            Refresh {selectedRegion}
          </Button>
        )}
      </div>
    </div>
  );
};
