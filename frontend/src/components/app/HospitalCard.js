import { Mail, Phone, MapPin, User, Globe, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HospitalCard = ({ hospital, index, onDelete }) => {
  const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`;

  return (
    <div
      className={`hospital-card glass-card rounded-xl p-6 animate-fade-in-up ${staggerClass} group relative`}
      style={{ opacity: 0, animationFillMode: "forwards" }}
      data-testid={`hospital-card-${index}`}
    >
      {/* Glow accent on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <h3 className="text-sm font-semibold text-zinc-100 truncate font-['Outfit']">
                {hospital.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-medium">
                {hospital.region}
              </span>
              <span className="text-[10px] text-zinc-600">{hospital.country}</span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(hospital.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 h-7 w-7 p-0"
                  data-testid={`delete-hospital-${index}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 text-zinc-300 border-zinc-800 text-xs">
                Remove hospital
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Details */}
        <div className="space-y-2.5">
          {hospital.email && (
            <div className="flex items-center gap-2.5 text-xs">
              <Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <a
                href={`mailto:${hospital.email}`}
                className="text-zinc-400 hover:text-blue-400 transition-colors truncate"
              >
                {hospital.email}
              </a>
            </div>
          )}
          {hospital.phone && (
            <div className="flex items-center gap-2.5 text-xs">
              <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <a
                href={`tel:${hospital.phone}`}
                className="text-zinc-400 hover:text-cyan-400 transition-colors font-mono"
              >
                {hospital.phone}
              </a>
            </div>
          )}
          {hospital.location && (
            <div className="flex items-center gap-2.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span className="text-zinc-500 truncate">{hospital.location}</span>
            </div>
          )}
        </div>

        {/* HR Contact */}
        {(hospital.hr_contact || hospital.hr_email) && (
          <div className="pt-3 mt-3 border-t border-zinc-800/50">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">HR Contact</p>
            {hospital.hr_contact && (
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-zinc-300">{hospital.hr_contact}</span>
              </div>
            )}
            {hospital.hr_email && (
              <div className="flex items-center gap-2 text-xs mt-1.5">
                <Mail className="w-3 h-3 text-zinc-700 shrink-0" />
                <a
                  href={`mailto:${hospital.hr_email}`}
                  className="text-zinc-500 hover:text-blue-400 transition-colors truncate text-[11px]"
                >
                  {hospital.hr_email}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Specialties */}
        {hospital.specialties && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {hospital.specialties.split(",").slice(0, 3).map((s, i) => (
                <span
                  key={i}
                  className="text-[9px] bg-zinc-800/80 text-zinc-500 px-1.5 py-0.5 rounded"
                >
                  {s.trim()}
                </span>
              ))}
              {hospital.specialties.split(",").length > 3 && (
                <span className="text-[9px] text-zinc-600">
                  +{hospital.specialties.split(",").length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {hospital.website && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <Globe className="w-3 h-3 text-zinc-700 shrink-0" />
            <a
              href={hospital.website.startsWith("http") ? hospital.website : `https://${hospital.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-blue-400 transition-colors text-[11px] truncate"
            >
              {hospital.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
