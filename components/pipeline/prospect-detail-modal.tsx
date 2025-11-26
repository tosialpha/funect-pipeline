"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";

interface ProspectDetailModalProps {
  prospectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProspectDetailModal({ prospectId, isOpen, onClose, onSuccess }: ProspectDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    country: "",
    city: "",
    website: "",
    phone: "",
    email: "",
    pipeline_stage: "not_contacted",
    priority: "medium",
    lead_source: "cold_outreach",
    responsible_person: "",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    if (prospectId && isOpen) {
      loadProspect();
    }
  }, [prospectId, isOpen]);

  const loadProspect = async () => {
    if (!prospectId) return;

    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (error) {
      console.error("Error loading prospect:", error);
      return;
    }

    if (data) {
      setFormData({
        name: data.name || "",
        type: data.type || "",
        country: data.country || "",
        city: data.city || "",
        website: data.website || "",
        phone: data.phone || "",
        email: data.email || "",
        pipeline_stage: data.pipeline_stage || "not_contacted",
        priority: data.priority || "medium",
        lead_source: data.lead_source || "cold_outreach",
        responsible_person: data.responsible_person || "",
        notes: data.notes || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectId) return;

    setIsLoading(true);
    setError("");

    try {
      const { error: dbError } = await supabase
        .from("prospects")
        .update(formData)
        .eq("id", prospectId);

      if (dbError) {
        console.error("Database error:", dbError);
        setError(dbError.message || "Failed to update prospect");
        setIsLoading(false);
        return;
      }

      onSuccess();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating prospect:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!prospectId) return;
    if (!confirm("Are you sure you want to delete this prospect?")) return;

    setIsLoading(true);

    try {
      const { error: dbError } = await supabase
        .from("prospects")
        .delete()
        .eq("id", prospectId);

      if (dbError) {
        console.error("Database error:", dbError);
        setError(dbError.message || "Failed to delete prospect");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error deleting prospect:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (!isOpen || !prospectId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-[#1A1F2E] border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? "Edit Prospect" : "Prospect Details"}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm text-teal-400 hover:bg-teal-500/10 rounded-xl font-medium transition-all border border-teal-500/20"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Company Name
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Business Type
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Country
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.country}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                City
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Website
              </label>
              {isEditing ? (
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 hover:underline">
                      {formData.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Phone
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.phone || "-"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Email
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full"
                />
              ) : (
                <p className="text-white font-medium">{formData.email || "-"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Responsible Person
              </label>
              {isEditing ? (
                <select
                  value={formData.responsible_person}
                  onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="">Not assigned</option>
                  <option value="team">Team</option>
                  <option value="veeti">Veeti</option>
                  <option value="alppa">Alppa</option>
                </select>
              ) : (
                <span className={`inline-block px-2.5 py-1 text-sm font-semibold rounded-lg border ${
                  formData.responsible_person === 'veeti'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : formData.responsible_person === 'alppa'
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : formData.responsible_person === 'team'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {formData.responsible_person === 'veeti' ? 'Veeti'
                    : formData.responsible_person === 'alppa' ? 'Alppa'
                    : formData.responsible_person === 'team' ? 'Team'
                    : 'Not assigned'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Pipeline Stage
              </label>
              {isEditing ? (
                <select
                  value={formData.pipeline_stage}
                  onChange={(e) => setFormData({ ...formData, pipeline_stage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="cold_called">Cold Called</option>
                  <option value="first_demo">First Demo</option>
                  <option value="second_demo">Second Demo</option>
                  <option value="offer_sent">Offer Sent</option>
                  <option value="offer_accepted">Offer Accepted</option>
                  <option value="offer_rejected">Offer Rejected</option>
                </select>
              ) : (
                <span className="inline-block px-2.5 py-1 text-sm font-semibold bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  {formData.pipeline_stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              ) : (
                <span className={`inline-block px-2.5 py-1 text-sm font-semibold rounded-lg border ${
                  formData.priority === 'high'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : formData.priority === 'medium'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                  {formData.priority.toUpperCase()}
                </span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Lead Source
              </label>
              {isEditing ? (
                <select
                  value={formData.lead_source}
                  onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="cold_outreach">Cold Outreach</option>
                  <option value="inbound">Inbound</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="website">Website</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white font-medium">
                  {formData.lead_source.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Add notes about this prospect..."
                />
              ) : (
                <p className="text-white font-medium whitespace-pre-wrap">{formData.notes || "-"}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all border border-red-500/20 disabled:opacity-50"
            >
              Delete Prospect
            </button>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      loadProspect();
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
