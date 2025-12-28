"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { AddProspectModal } from "@/components/pipeline/add-prospect-modal";
import { useOrganization } from "@/lib/contexts/organization-context";

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { organizationId } = useOrganization();
  const supabase = createClient();

  useEffect(() => {
    loadProspects();
  }, [organizationId]);

  const loadProspects = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("prospects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    setProspects(data || []);
    setIsLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Prospects
          </h2>
          <p className="text-slate-400 mt-2">
            Manage all your sales prospects in one place
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Prospect
        </button>
      </div>

      <AddProspectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProspects}
      />

      {/* Filters */}
      <div className="bg-[#1A1F2E] rounded-2xl border border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search prospects..."
              className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <select className="px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all">
            <option value="">All Stages</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="cold_called">Cold Called</option>
            <option value="first_demo">First Demo</option>
            <option value="second_demo">Second Demo</option>
            <option value="offer_sent">Offer Sent</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="offer_rejected">Offer Rejected</option>
          </select>
          <select className="px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Prospects Table */}
      {!prospects || prospects.length === 0 ? (
        <div className="bg-[#1A1F2E] rounded-2xl border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No prospects found
          </h3>
          <p className="text-slate-400 mb-6">
            Start building your sales pipeline by adding your first prospect
          </p>
        </div>
      ) : (
        <ProspectsTable prospects={prospects} />
      )}
    </div>
  );
}
