import { useState, useEffect, useCallback } from "react";
import { useAuth, API } from "@/App";
import { Sidebar } from "@/components/app/Sidebar";
import { HospitalCard } from "@/components/app/HospitalCard";
import { StatsBar } from "@/components/app/StatsBar";
import { RegionFilter } from "@/components/app/RegionFilter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, RefreshCw, Download, LayoutGrid, List, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { AddHospitalDialog } from "@/components/app/AddHospitalDialog";

const GCC_REGIONS = {
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Qatar": ["Doha"],
  "Kuwait": ["Kuwait City"],
  "Bahrain": ["Manama"],
  "Oman": ["Muscat"],
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedRegion !== "all") params.region = selectedRegion;
      if (selectedCountry !== "all") params.country = selectedCountry;
      if (searchQuery) params.search = searchQuery;
      const res = await axios.get(`${API}/hospitals`, { params });
      setHospitals(res.data.hospitals);
    } catch (err) {
      toast.error("Failed to fetch hospitals");
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, selectedCountry, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
    fetchStats();
  }, [fetchHospitals, fetchStats]);

  const handleRefresh = async (region = null) => {
    const targetRegion = region || selectedRegion;
    setRefreshing(true);
    toast.info(`AI collecting data for ${targetRegion === "all" ? "all GCC regions" : targetRegion}...`, {
      duration: 10000,
    });
    try {
      const res = await axios.post(`${API}/hospitals/refresh`, { region: targetRegion });
      toast.success(res.data.message);
      await fetchHospitals();
      await fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRegion !== "all") params.append("region", selectedRegion);
      if (selectedCountry !== "all") params.append("country", selectedCountry);
      
      const url = `${API}/hospitals/export/csv?${params.toString()}`;
      window.open(url, "_blank");
      toast.success("CSV export started");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleDeleteHospital = async (id) => {
    try {
      await axios.delete(`${API}/hospitals/${id}`);
      toast.success("Hospital removed");
      fetchHospitals();
      fetchStats();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleRegionSelect = (region, country) => {
    setSelectedRegion(region);
    setSelectedCountry(country || "all");
  };

  return (
    <div className="min-h-screen flex bg-[#09090B]" data-testid="dashboard-page">
      <Sidebar
        selectedCountry={selectedCountry}
        onSelectCountry={(country) => {
          setSelectedCountry(country);
          setSelectedRegion("all");
        }}
        stats={stats}
      />

      <main className="flex-1 ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xl relative search-glow rounded-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search hospitals, contacts, specialties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-blue-500 text-zinc-100 placeholder:text-zinc-600 h-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                data-testid="add-hospital-button"
                onClick={() => setShowAddDialog(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-600 h-10 px-4 gap-2 transition-all active:scale-95"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="view-mode-toggle"
                    variant="outline"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 h-10 w-10 p-0"
                  >
                    {viewMode === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem onClick={() => setViewMode("grid")} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <LayoutGrid className="w-4 h-4 mr-2" /> Grid View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode("list")} className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer">
                    <List className="w-4 h-4 mr-2" /> List View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                data-testid="export-csv-button"
                onClick={handleExport}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-600 h-10 px-4 gap-2 transition-all active:scale-95"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>

              <Button
                data-testid="refresh-data-button"
                onClick={() => handleRefresh()}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-5 gap-2 shadow-lg shadow-blue-900/30 hover:shadow-blue-500/30 transition-all active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "spin-slow" : ""}`} />
                {refreshing ? "Collecting..." : "AI Refresh"}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Stats */}
          <StatsBar stats={stats} />

          {/* Region Filter */}
          <RegionFilter
            regions={GCC_REGIONS}
            selectedRegion={selectedRegion}
            selectedCountry={selectedCountry}
            onSelectRegion={handleRegionSelect}
            onRefreshRegion={handleRefresh}
            refreshing={refreshing}
          />

          {/* Hospital count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold font-['Outfit'] text-zinc-100">
                {selectedRegion !== "all" ? selectedRegion : selectedCountry !== "all" ? selectedCountry : "All GCC"} Hospitals
              </h2>
              <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-md" data-testid="hospital-count">
                {hospitals.length} results
              </span>
            </div>
          </div>

          {/* Hospital Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-6 space-y-4">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold font-['Outfit'] text-zinc-300 mb-2">No hospitals found</h3>
              <p className="text-zinc-500 mb-6 max-w-md">
                {searchQuery
                  ? "Try a different search query"
                  : "Click 'AI Refresh' to collect hospital data using AI for this region"}
              </p>
              {!searchQuery && (
                <Button
                  data-testid="empty-state-refresh"
                  onClick={() => handleRefresh()}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "spin-slow" : ""}`} />
                  Collect Data with AI
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="hospital-grid">
              {hospitals.map((hospital, idx) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  index={idx}
                  onDelete={handleDeleteHospital}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2" data-testid="hospital-list">
              {/* List header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <div className="col-span-3">Hospital</div>
                <div className="col-span-2">Region</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">HR Contact</div>
                <div className="col-span-1"></div>
              </div>
              {hospitals.map((hospital, idx) => (
                <div
                  key={hospital.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 glass-card rounded-lg items-center table-row-hover animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
                  style={{ opacity: 0, animationFillMode: "forwards" }}
                  data-testid={`hospital-list-row-${idx}`}
                >
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-zinc-100 truncate">{hospital.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{hospital.location}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{hospital.region}</span>
                  </div>
                  <div className="col-span-2 text-sm text-zinc-400 truncate">{hospital.email || "—"}</div>
                  <div className="col-span-2 text-sm text-zinc-400 font-mono text-xs">{hospital.phone || "—"}</div>
                  <div className="col-span-2 text-sm text-zinc-400 truncate">{hospital.hr_contact || "—"}</div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHospital(hospital.id)}
                      className="text-zinc-600 hover:text-red-400 h-8 w-8 p-0"
                      data-testid={`delete-list-hospital-${idx}`}
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddHospitalDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          fetchHospitals();
          fetchStats();
        }}
        selectedRegion={selectedRegion}
        selectedCountry={selectedCountry}
      />
    </div>
  );
}
