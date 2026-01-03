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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Prospects
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage all your sales prospects in one place
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search prospects..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <select className="px-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all">
            <option value="">All Stages</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="cold_called">Cold Called</option>
            <option value="first_demo">First Demo</option>
            <option value="second_demo">Second Demo</option>
            <option value="offer_sent">Offer Sent</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="offer_rejected">Offer Rejected</option>
          </select>
          <select className="px-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Prospects Table */}
      {!prospects || prospects.length === 0 ? (
        <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/50 p-16 text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No prospects found
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Start building your sales pipeline by adding your first prospect
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Add First Prospect
          </button>
        </div>
      ) : (
        <ProspectsTable prospects={prospects} />
      )}
    </div>
  );
}
