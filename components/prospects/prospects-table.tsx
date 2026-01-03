"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProspectDetailModal } from "../pipeline/prospect-detail-modal";

interface Prospect {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  website?: string;
  phone?: string;
  pipeline_stage: string;
  priority: string;
  responsible_person?: string;
}

interface ProspectsTableProps {
  prospects: Prospect[];
}

export function ProspectsTable({ prospects }: ProspectsTableProps) {
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <ProspectDetailModal
        prospectId={selectedProspectId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProspectId(null);
        }}
        onSuccess={() => router.refresh()}
      />

      <div className="bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-slate-700">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Company</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Type</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Location</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Responsible</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Stage</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Priority</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-white">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {prospects.map((prospect) => (
              <tr
                key={prospect.id}
                onClick={() => {
                  setSelectedProspectId(prospect.id);
                  setIsDetailModalOpen(true);
                }}
                className="hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold">
                      {prospect.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-white">{prospect.name}</p>
                      {prospect.website && (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-cyan-400 hover:text-teal-300 hover:underline transition-colors"
                        >
                          {prospect.website}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-slate-400">{prospect.type}</td>
                <td className="py-4 px-6 text-sm text-slate-400">
                  {prospect.city}, {prospect.country}
                </td>
                <td className="py-4 px-6 text-sm text-slate-400">
                  {prospect.responsible_person || "-"}
                </td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                    {prospect.pipeline_stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                    prospect.priority === 'high'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : prospect.priority === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {prospect.priority.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-400">
                  {prospect.phone || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
