"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AddProspectModal } from "./add-prospect-modal";
import { ProspectDetailModal } from "./prospect-detail-modal";
import { ScheduleDemoModal } from "./schedule-demo-modal";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { motion } from "framer-motion";

type PipelineStage =
  | "not_contacted"
  | "cold_called"
  | "first_demo"
  | "second_demo"
  | "offer_sent"
  | "offer_accepted"
  | "offer_rejected";

interface Prospect {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  lastActivity?: string;
  status: string;
  responsible_person?: string;
  type?: string;
}

interface Column {
  id: PipelineStage;
  title: string;
  count: number;
  prospects: Prospect[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: "not_contacted",
    title: "Not Contacted",
    count: 0,
    prospects: [],
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-l-slate-500",
  },
  {
    id: "cold_called",
    title: "Cold Called",
    count: 0,
    prospects: [],
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-l-blue-500",
  },
  {
    id: "first_demo",
    title: "First Demo",
    count: 0,
    prospects: [],
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-l-purple-500",
  },
  {
    id: "second_demo",
    title: "Second Demo",
    count: 0,
    prospects: [],
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-l-cyan-500",
  },
  {
    id: "offer_sent",
    title: "Offer Sent",
    count: 0,
    prospects: [],
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-l-orange-500",
  },
  {
    id: "offer_accepted",
    title: "Won",
    count: 0,
    prospects: [],
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-l-emerald-500",
  },
  {
    id: "offer_rejected",
    title: "Lost",
    count: 0,
    prospects: [],
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-l-red-500",
  },
];

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [scheduleDemoModal, setScheduleDemoModal] = useState<{
    isOpen: boolean;
    prospectId?: string;
    prospectName?: string;
    demoType?: "first_demo" | "second_demo";
    targetStage?: PipelineStage;
    responsiblePerson?: string;
  }>({ isOpen: false });
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);
  const [isDndDragging, setIsDndDragging] = useState(false);
  const { ref: scrollContainerRef } = useDragToScroll({ disabled: isDndDragging });
  const supabase = createClient();

  const loadSportTypes = async () => {
    const { data, error } = await supabase
      .from("prospects")
      .select("type")
      .not("type", "is", null);

    if (error) {
      console.error("Error loading sport types:", error);
      return;
    }

    const uniqueTypes = [...new Set((data || []).map((p) => p.type).filter(Boolean))] as string[];
    setSportTypes(uniqueTypes.sort());
  };

  const loadProspects = async () => {
    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading prospects:", error);
      return;
    }

    const newColumns = INITIAL_COLUMNS.map((col) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const prospects = (data || [])
        .filter((p) => p.pipeline_stage === col.id)
        .filter((p) => selectedSports.length === 0 || selectedSports.includes(p.type))
        .filter((p) => {
          if (!searchLower) return true;
          return (
            p.name?.toLowerCase().includes(searchLower) ||
            p.type?.toLowerCase().includes(searchLower) ||
            p.responsible_person?.toLowerCase().includes(searchLower)
          );
        })
        .map((p) => ({
          id: p.id,
          name: p.name,
          company: p.type,
          type: p.type,
          lastActivity: p.last_activity_date
            ? new Date(p.last_activity_date).toLocaleDateString()
            : undefined,
          status: p.priority.toUpperCase(),
          responsible_person: p.responsible_person,
        }));

      return {
        ...col,
        count: prospects.length,
        prospects,
      };
    });

    setColumns(newColumns);
  };

  useEffect(() => {
    loadSportTypes();
    loadProspects();
  }, []);

  useEffect(() => {
    loadProspects();
  }, [selectedSports, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSportFilter = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const clearFilters = () => {
    setSelectedSports([]);
  };

  const onDragEnd = async (result: any) => {
    const { source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceProspects = [...sourceColumn.prospects];
    const destProspects = source.droppableId === destination.droppableId
      ? sourceProspects
      : [...destColumn.prospects];

    const [movedProspect] = sourceProspects.splice(source.index, 1);

    const isDemoStage = destination.droppableId === "first_demo" || destination.droppableId === "second_demo";
    const isMovingToNewStage = source.droppableId !== destination.droppableId;

    if (isDemoStage && isMovingToNewStage) {
      setScheduleDemoModal({
        isOpen: true,
        prospectId: movedProspect.id,
        prospectName: movedProspect.name,
        demoType: destination.droppableId as "first_demo" | "second_demo",
        targetStage: destination.droppableId as PipelineStage,
        responsiblePerson: movedProspect.responsible_person,
      });
      return;
    }

    destProspects.splice(destination.index, 0, movedProspect);

    const newColumns = columns.map((col) => {
      if (col.id === source.droppableId) {
        return { ...col, prospects: sourceProspects, count: sourceProspects.length };
      }
      if (col.id === destination.droppableId) {
        return { ...col, prospects: destProspects, count: destProspects.length };
      }
      return col;
    });

    setColumns(newColumns);

    if (source.droppableId !== destination.droppableId) {
      const { error } = await supabase
        .from("prospects")
        .update({ pipeline_stage: destination.droppableId })
        .eq("id", movedProspect.id);

      if (error) {
        console.error("Error updating prospect:", error);
        loadProspects();
      }
    }
  };

  const handleDemoScheduled = async () => {
    if (scheduleDemoModal.prospectId && scheduleDemoModal.targetStage) {
      const { error } = await supabase
        .from("prospects")
        .update({ pipeline_stage: scheduleDemoModal.targetStage })
        .eq("id", scheduleDemoModal.prospectId);

      if (error) {
        console.error("Error updating prospect:", error);
      }

      loadProspects();
    }

    setScheduleDemoModal({ isOpen: false });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Sales Pipeline
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Track and manage your prospects through the sales process
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prospects..."
                className="w-64 pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  selectedSports.length > 0
                    ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
                    : "bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-white hover:border-slate-700/50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                Filter
                {selectedSports.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500 text-slate-900 rounded font-semibold">
                    {selectedSports.length}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-64 bg-[#0d1320] border border-slate-800/50 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-800/50 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Filter by Type</span>
                    {selectedSports.length > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin p-2">
                    {sportTypes.length === 0 ? (
                      <p className="text-sm text-slate-500 p-3 text-center">No types found</p>
                    ) : (
                      sportTypes.map((sport) => (
                        <label
                          key={sport}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSports.includes(sport)}
                            onChange={() => toggleSportFilter(sport)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-300">{sport}</span>
                        </label>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Add Button */}
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
        </div>

        {/* Active Filters */}
        {selectedSports.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Active filters:</span>
            {selectedSports.map((sport) => (
              <span
                key={sport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md text-xs font-medium"
              >
                {sport}
                <button
                  onClick={() => toggleSportFilter(sport)}
                  className="hover:text-white transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <AddProspectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProspects}
      />

      <ProspectDetailModal
        prospectId={selectedProspectId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProspectId(null);
        }}
        onSuccess={loadProspects}
      />

      {scheduleDemoModal.prospectId && scheduleDemoModal.prospectName && scheduleDemoModal.demoType && (
        <ScheduleDemoModal
          isOpen={scheduleDemoModal.isOpen}
          onClose={() => {
            setScheduleDemoModal({ isOpen: false });
            loadProspects();
          }}
          prospectId={scheduleDemoModal.prospectId}
          prospectName={scheduleDemoModal.prospectName}
          demoType={scheduleDemoModal.demoType}
          responsiblePerson={scheduleDemoModal.responsiblePerson}
          onSuccess={handleDemoScheduled}
        />
      )}

      {/* Kanban Board */}
      <DragDropContext onDragStart={() => setIsDndDragging(true)} onDragEnd={(result) => { setIsDndDragging(false); onDragEnd(result); }}>
        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {columns.map((column, columnIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.05 }}
              className="flex-shrink-0 w-[300px]"
            >
              <div className="bg-slate-900/40 rounded-xl overflow-hidden">
                {/* Column Header */}
                <div className="p-4 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${column.bgColor.replace('/10', '')}`} />
                      <h3 className="font-medium text-white text-sm">
                        {column.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${column.bgColor} ${column.color}`}>
                        {column.count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 min-h-[400px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <div className="space-y-2.5">
                        {column.prospects.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <p className="text-slate-600 text-sm">No prospects</p>
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                            >
                              + Add first
                            </button>
                          </div>
                        ) : (
                          column.prospects.map((prospect, index) => (
                            <Draggable
                              key={prospect.id}
                              draggableId={prospect.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  data-no-drag-scroll
                                  onClick={() => {
                                    setSelectedProspectId(prospect.id);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className={`bg-[#0d1320]/80 rounded-lg p-3.5 border-l-[3px] ${column.borderColor} transition-all cursor-pointer group ${
                                    snapshot.isDragging ? 'shadow-2xl shadow-cyan-500/10 ring-1 ring-cyan-500/30 scale-[1.02]' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                      {prospect.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                                        {prospect.name}
                                      </h4>
                                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        {prospect.company}
                                      </p>
                                      {prospect.lastActivity && (
                                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {prospect.lastActivity}
                                        </div>
                                      )}
                                      <div className="mt-2.5">
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded border ${
                                          prospect.status === 'HIGH' ? 'status-red' :
                                          prospect.status === 'MEDIUM' ? 'status-orange' : 'status-green'
                                        }`}>
                                          {prospect.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </motion.div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
