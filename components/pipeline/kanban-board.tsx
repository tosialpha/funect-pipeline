"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AddProspectModal } from "./add-prospect-modal";
import { ProspectDetailModal } from "./prospect-detail-modal";
import { ScheduleDemoModal } from "./schedule-demo-modal";
import { useDragToScroll } from "@/hooks/useDragToScroll";

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
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: "not_contacted",
    title: "Not Contacted",
    count: 0,
    prospects: [],
    color: "border-slate-400",
  },
  {
    id: "cold_called",
    title: "Cold Called",
    count: 0,
    prospects: [],
    color: "border-blue-500",
  },
  {
    id: "first_demo",
    title: "First Demo",
    count: 0,
    prospects: [],
    color: "border-purple-500",
  },
  {
    id: "second_demo",
    title: "Second Demo",
    count: 0,
    prospects: [],
    color: "border-teal-500",
  },
  {
    id: "offer_sent",
    title: "Offer Sent",
    count: 0,
    prospects: [],
    color: "border-orange-500",
  },
  {
    id: "offer_accepted",
    title: "Offer Accepted",
    count: 0,
    prospects: [],
    color: "border-green-500",
  },
  {
    id: "offer_rejected",
    title: "Offer Rejected",
    count: 0,
    prospects: [],
    color: "border-red-500",
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

  // Close filter dropdown when clicking outside
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

    // Check if moving to a demo stage
    const isDemoStage = destination.droppableId === "first_demo" || destination.droppableId === "second_demo";
    const isMovingToNewStage = source.droppableId !== destination.droppableId;

    if (isDemoStage && isMovingToNewStage) {
      // Show scheduling modal instead of immediately updating
      setScheduleDemoModal({
        isOpen: true,
        prospectId: movedProspect.id,
        prospectName: movedProspect.name,
        demoType: destination.droppableId as "first_demo" | "second_demo",
        targetStage: destination.droppableId as PipelineStage,
        responsiblePerson: movedProspect.responsible_person,
      });
      // Don't update the UI yet - wait for the modal to be confirmed or cancelled
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

    // Update in database
    if (source.droppableId !== destination.droppableId) {
      const { error } = await supabase
        .from("prospects")
        .update({ pipeline_stage: destination.droppableId })
        .eq("id", movedProspect.id);

      if (error) {
        console.error("Error updating prospect:", error);
        // Revert on error
        loadProspects();
      }
    }
  };

  const handleDemoScheduled = async () => {
    // Update the prospect's pipeline stage
    if (scheduleDemoModal.prospectId && scheduleDemoModal.targetStage) {
      const { error } = await supabase
        .from("prospects")
        .update({ pipeline_stage: scheduleDemoModal.targetStage })
        .eq("id", scheduleDemoModal.prospectId);

      if (error) {
        console.error("Error updating prospect:", error);
      }

      // Reload prospects to reflect the changes
      loadProspects();
    }

    setScheduleDemoModal({ isOpen: false });
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Sales Pipeline
          </h2>
          <p className="text-slate-400 mt-2">
            Drag and drop prospects between stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prospects..."
              className="w-64 pl-10 pr-4 py-2.5 border border-slate-700 rounded-xl bg-[#1A1F2E] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sports Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2.5 border rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedSports.length > 0
                  ? "border-teal-500 bg-teal-500/10 text-teal-400"
                  : "border-slate-700 bg-[#1A1F2E] text-slate-300 hover:border-slate-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Sports
              {selectedSports.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-teal-500 text-white rounded-full">
                  {selectedSports.length}
                </span>
              )}
              <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1A1F2E] border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Filter by Sport</span>
                  {selectedSports.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {sportTypes.length === 0 ? (
                    <p className="text-sm text-slate-500 p-2">No sports found</p>
                  ) : (
                    sportTypes.map((sport) => (
                      <label
                        key={sport}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSports.includes(sport)}
                          onChange={() => toggleSportFilter(sport)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-slate-300">{sport}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
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
      </div>

      {/* Active Filter Chips */}
      {selectedSports.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400">Filtering by:</span>
          {selectedSports.map((sport) => (
            <span
              key={sport}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full text-sm"
            >
              {sport}
              <button
                onClick={() => toggleSportFilter(sport)}
                className="hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

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
            loadProspects(); // Reload to restore the original state
          }}
          prospectId={scheduleDemoModal.prospectId}
          prospectName={scheduleDemoModal.prospectName}
          demoType={scheduleDemoModal.demoType}
          responsiblePerson={scheduleDemoModal.responsiblePerson}
          onSuccess={handleDemoScheduled}
        />
      )}

      <DragDropContext onDragStart={() => setIsDndDragging(true)} onDragEnd={(result) => { setIsDndDragging(false); onDragEnd(result); }}>
        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
            >
              <div className="bg-[#1A1F2E] rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-6 rounded-full ${column.color.replace('border-', 'bg-')}`} />
                    <h3 className="font-semibold text-white">
                      {column.title}
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg">
                      {column.count}
                    </span>
                  </div>
                  <button className="text-slate-500 hover:text-slate-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-slate-800/30 rounded-xl p-2' : ''
                      }`}
                    >
                      {column.prospects.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          <p>No prospects</p>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-2 text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
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
                                className={`bg-[#0F1419] rounded-xl p-4 border-l-4 ${column.color} border border-slate-800 hover:border-slate-700 transition-all cursor-pointer ${
                                  snapshot.isDragging ? 'shadow-2xl shadow-teal-500/20 ring-2 ring-teal-500 scale-105' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                    {prospect.name[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className="font-semibold text-white text-sm">
                                        {prospect.name}
                                      </h4>
                                      <button className="text-slate-500 hover:text-slate-300 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">
                                      {prospect.company}
                                    </p>
                                    {prospect.lastActivity && (
                                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {prospect.lastActivity}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="px-2.5 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
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
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
