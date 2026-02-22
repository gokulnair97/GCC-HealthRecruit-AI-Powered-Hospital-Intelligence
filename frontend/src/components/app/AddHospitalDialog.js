import { useState } from "react";
import { API } from "@/App";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

const GCC_REGIONS = {
  "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Makkah", "Madinah"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah"],
  Qatar: ["Doha"],
  Kuwait: ["Kuwait City"],
  Bahrain: ["Manama"],
  Oman: ["Muscat"],
};

export const AddHospitalDialog = ({ open, onClose, onSuccess, selectedRegion, selectedCountry }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    region: selectedRegion !== "all" ? selectedRegion : "",
    country: selectedCountry !== "all" ? selectedCountry : "",
    hr_contact: "",
    hr_email: "",
    website: "",
    specialties: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFormCountry, setSelectedFormCountry] = useState(
    selectedCountry !== "all" ? selectedCountry : ""
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (val) => {
    setSelectedFormCountry(val);
    handleChange("country", val);
    handleChange("region", "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.region || !form.country) {
      toast.error("Name, Region and Country are required");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/hospitals`, form);
      // Close dialog first, then reset form
      onClose();
      setForm({
        name: "", email: "", phone: "", location: "", region: "", country: "",
        hr_contact: "", hr_email: "", website: "", specialties: "",
      });
      setSelectedFormCountry("");
      toast.success("Hospital added successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to add hospital");
    } finally {
      setSubmitting(false);
    }
  };

  const availableRegions = selectedFormCountry ? GCC_REGIONS[selectedFormCountry] || [] : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-lg max-h-[90vh] overflow-y-auto" data-testid="add-hospital-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-['Outfit'] text-zinc-100">Add Hospital</DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            Manually add a hospital to the directory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Hospital Name *</Label>
            <Input
              data-testid="add-hospital-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. King Faisal Specialist Hospital"
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Country *</Label>
              <Select value={selectedFormCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-100" data-testid="add-hospital-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {Object.keys(GCC_REGIONS).map((c) => (
                    <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Region *</Label>
              <Select value={form.region} onValueChange={(val) => handleChange("region", val)}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-100" data-testid="add-hospital-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {availableRegions.map((r) => (
                    <SelectItem key={r} value={r} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Email</Label>
              <Input
                data-testid="add-hospital-email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="info@hospital.com"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Phone</Label>
              <Input
                data-testid="add-hospital-phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+966 xxx xxx xxxx"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Location / Address</Label>
            <Input
              data-testid="add-hospital-location"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Full address"
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">HR Contact Name</Label>
              <Input
                data-testid="add-hospital-hr-contact"
                value={form.hr_contact}
                onChange={(e) => handleChange("hr_contact", e.target.value)}
                placeholder="HR Manager name"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">HR Email</Label>
              <Input
                data-testid="add-hospital-hr-email"
                value={form.hr_email}
                onChange={(e) => handleChange("hr_email", e.target.value)}
                placeholder="hr@hospital.com"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Website</Label>
              <Input
                data-testid="add-hospital-website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="www.hospital.com"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Specialties</Label>
              <Input
                data-testid="add-hospital-specialties"
                value={form.specialties}
                onChange={(e) => handleChange("specialties", e.target.value)}
                placeholder="Cardiology, Oncology..."
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              data-testid="add-hospital-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
              data-testid="add-hospital-submit"
            >
              {submitting ? "Adding..." : "Add Hospital"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
