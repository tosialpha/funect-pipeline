"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProspectModal({ isOpen, onClose, onSuccess }: AddProspectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    country: "",
    city: "",
    website: "",
    phone: "",
    pipeline_stage: "not_contacted",
    priority: "medium",
    lead_source: "cold_outreach",
    responsible_person: "",
    current_system: "",
    notes: "",
  });
  const [customType, setCustomType] = useState("");
  const [customSystem, setCustomSystem] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customCity, setCustomCity] = useState("");

  const supabase = createClient();

  // City options by country (top 20 by population)
  const getCitiesByCountry = (country: string): string[] => {
    const cities: { [key: string]: string[] } = {
      Finland: [
        "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä",
        "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hämeenlinna",
        "Vaasa", "Rovaniemi", "Seinäjoki", "Mikkeli", "Kotka", "Salo"
      ],
      Sweden: [
        "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping",
        "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås",
        "Södertälje", "Eskilstuna", "Halmstad", "Växjö", "Karlstad", "Sundsvall"
      ],
      Estonia: [
        "Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere",
        "Maardu", "Sillamäe", "Kuressaare", "Võru", "Valga", "Haapsalu", "Jõhvi",
        "Paide", "Keila", "Kiviõli", "Tapa", "Põlva", "Türi"
      ],
    };
    return cities[country] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const dataToSubmit = {
        ...formData,
        type: formData.type === "Other" ? customType : formData.type,
        current_system: formData.current_system === "Other" ? customSystem : formData.current_system,
        country: formData.country === "Other" ? customCountry : formData.country,
        city: formData.city === "Other" ? customCity : formData.city,
      };
      const { error: dbError } = await supabase.from("prospects").insert([dataToSubmit]);

      if (dbError) {
        console.error("Database error:", dbError);
        setError(dbError.message || "Failed to create prospect");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
      setFormData({
        name: "",
        type: "",
        country: "",
        city: "",
        website: "",
        phone: "",
        pipeline_stage: "not_contacted",
        priority: "medium",
        lead_source: "cold_outreach",
        responsible_person: "",
        current_system: "",
        notes: "",
      });
      setCustomType("");
      setCustomSystem("");
      setCustomCountry("");
      setCustomCity("");
    } catch (err) {
      console.error("Error creating prospect:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-[#1A1F2E] border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Add New Prospect
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Acme Corp"
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Business Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value });
                  if (e.target.value !== "Other") {
                    setCustomType("");
                  }
                }}
                required
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Select business type...</option>
                <option value="Golf">Golf</option>
                <option value="Golf Simulator">Golf Simulator</option>
                <option value="Yoga">Yoga</option>
                <option value="Pilates">Pilates</option>
                <option value="Other">Other</option>
              </select>
              {formData.type === "Other" && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  required
                  placeholder="Enter custom business type"
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => {
                  setFormData({ ...formData, country: e.target.value, city: "" });
                  setCustomCity("");
                  if (e.target.value !== "Other") {
                    setCustomCountry("");
                  }
                }}
                required
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Select country...</option>
                <option value="Finland">Finland</option>
                <option value="Sweden">Sweden</option>
                <option value="Estonia">Estonia</option>
                <option value="Other">Other</option>
              </select>
              {formData.country === "Other" && (
                <input
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  required
                  placeholder="Enter country name"
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all mt-2"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  if (e.target.value !== "Other") {
                    setCustomCity("");
                  }
                }}
                required
                disabled={!formData.country || formData.country === "Other"}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.country || formData.country === "Other"
                    ? "Select country first..."
                    : "Select city..."}
                </option>
                {formData.country && formData.country !== "Other" && getCitiesByCountry(formData.country).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                {formData.country && formData.country !== "Other" && (
                  <option value="Other">Other</option>
                )}
              </select>
              {formData.city === "Other" && (
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  required
                  placeholder="Enter city name"
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all mt-2"
                />
              )}
              {formData.country === "Other" && (
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => {
                    setCustomCity(e.target.value);
                    setFormData({ ...formData, city: e.target.value });
                  }}
                  required
                  placeholder="Enter city name"
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+46 123 456 789"
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Responsible Person
              </label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Pipeline Stage
              </label>
              <select
                value={formData.pipeline_stage}
                onChange={(e) => setFormData({ ...formData, pipeline_stage: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="cold_called">Cold Called</option>
                <option value="first_demo">First Demo</option>
                <option value="second_demo">Second Demo</option>
                <option value="offer_sent">Offer Sent</option>
                <option value="offer_accepted">Offer Accepted</option>
                <option value="offer_rejected">Offer Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Current System
              </label>
              <select
                value={formData.current_system}
                onChange={(e) => {
                  setFormData({ ...formData, current_system: e.target.value });
                  if (e.target.value !== "Other") {
                    setCustomSystem("");
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Select current system...</option>
                <option value="VARAA HETI">VARAA HETI</option>
                <option value="THRIL">THRIL</option>
                <option value="MOMENSE">MOMENSE</option>
                <option value="CLASS PASS">CLASS PASS</option>
                <option value="APIX">APIX</option>
                <option value="ASIO">ASIO</option>
                <option value="CONFIRMA">CONFIRMA</option>
                <option value="WISE">WISE</option>
                <option value="PLAYFI">PLAYFI</option>
                <option value="TEHDEN">TEHDEN</option>
                <option value="varaavuoro">varaavuoro</option>
                <option value="Juliusvarausjärjestelmä">Juliusvarausjärjestelmä</option>
                <option value="CINTOIA">CINTOIA</option>
                <option value="avoinna 24">avoinna 24</option>
                <option value="Slotti">Slotti</option>
                <option value="Playtomic">Playtomic</option>
                <option value="matchi">matchi</option>
                <option value="Liikuttajat.fi">Liikuttajat.fi</option>
                <option value="Vello solutions">Vello solutions</option>
                <option value="Other">Other</option>
              </select>
              {formData.current_system === "Other" && (
                <input
                  type="text"
                  value={customSystem}
                  onChange={(e) => setCustomSystem(e.target.value)}
                  required
                  placeholder="Enter custom system name"
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all mt-2"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Lead Source
              </label>
              <select
                value={formData.lead_source}
                onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="cold_outreach">Cold Outreach</option>
                <option value="inbound">Inbound</option>
                <option value="referral">Referral</option>
                <option value="linkedin">LinkedIn</option>
                <option value="website">Website</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about this prospect..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Prospect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
