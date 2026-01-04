"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { calendarService, CalendarEvent, EventType } from "@/lib/services/calendar.service";
import { PERSON_CONFIG, getPersonOptionsForOrg, AssignedPerson } from "@/lib/constants/person-colors";
import { useOrganization } from "@/lib/contexts/organization-context";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EventModalData {
  isOpen: boolean;
  date?: Date;
  time?: string;
  event?: CalendarEvent;
  isEditing?: boolean;
}

export default function CalendarPage() {
  const { organizationId, slug } = useOrganization();
  const personOptions = getPersonOptionsForOrg(slug);
  const PERSONS: AssignedPerson[] = personOptions.map(p => p.value as AssignedPerson);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [eventModal, setEventModal] = useState<EventModalData>({ isOpen: false });
  const [visiblePersons, setVisiblePersons] = useState<AssignedPerson[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "task" as EventType,
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    assignedTo: "team" as AssignedPerson,
  });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode, organizationId]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = 8 * 60;
    }
  }, []);

  useEffect(() => {
    const options = getPersonOptionsForOrg(slug);
    setVisiblePersons(options.map(p => p.value as AssignedPerson));
  }, [slug]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      let startDate, endDate;

      if (viewMode === "day") {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = getWeekStart(currentDate);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      }

      const data = await calendarService.getEvents(startDate, endDate);
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    }
    setIsLoading(false);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Convert Sunday (0) to 7 for Monday-first calculation
    const dayOffset = day === 0 ? 6 : day - 1;
    const diff = d.getDate() - dayOffset;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = () => {
    if (viewMode === "day") {
      return [currentDate];
    }

    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const getDayEvents = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getDayEventsForPerson = (date: Date, person: AssignedPerson) => {
    return getDayEvents(date).filter((event) => event.assigned_to === person);
  };

  const togglePersonVisibility = (person: AssignedPerson) => {
    setVisiblePersons((prev) => {
      if (prev.includes(person)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== person);
      }
      return [...prev, person];
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return {
      top: `${startHour * 60}px`,
      height: `${duration * 60}px`,
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    const daysToMove = viewMode === "day" ? 1 : 7;
    newDate.setDate(newDate.getDate() + (direction === "next" ? daysToMove : -daysToMove));
    setCurrentDate(newDate);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(hour, 0, 0, 0);

    setFormData({
      ...formData,
      date: clickedDate.toISOString().split('T')[0],
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
    });
    setEventModal({ isOpen: true, date: clickedDate, time: `${hour}:00` });
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim()) return;

    try {
      const [year, month, day] = formData.date.split('-').map(Number);
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
      const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

      await calendarService.createEvent({
        title: formData.title,
        description: formData.description || undefined,
        event_type: formData.eventType,
        start_time: startDateTime,
        end_time: endDateTime,
        location: formData.location || undefined,
        assigned_to: formData.assignedTo,
      }, organizationId);

      setEventModal({ isOpen: false });
      setFormData({
        title: "",
        description: "",
        eventType: "task",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        assignedTo: "team",
      });
      loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }
    try {
      await calendarService.deleteEvent(eventId);
      await loadEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      alert(`Failed to delete event: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    setFormData({
      title: event.title,
      description: event.description || "",
      eventType: event.event_type,
      date: startDate.toISOString().split('T')[0],
      startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      location: event.location || "",
      assignedTo: event.assigned_to || "team",
    });
    setEventModal({ isOpen: true, event, isEditing: true });
  };

  const handleUpdateEvent = async () => {
    if (!formData.title.trim() || !eventModal.event) return;

    try {
      const [year, month, day] = formData.date.split('-').map(Number);
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);

      const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
      const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

      await calendarService.updateEvent({
        id: eventModal.event.id,
        title: formData.title,
        description: formData.description || undefined,
        event_type: formData.eventType,
        start_time: startDateTime,
        end_time: endDateTime,
        location: formData.location || undefined,
        assigned_to: formData.assignedTo,
      });

      setEventModal({ isOpen: false });
      setFormData({
        title: "",
        description: "",
        eventType: "task",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        assignedTo: "team",
      });
      loadEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const weekDays = getWeekDays();
  const today = new Date();

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Calendar</h2>
          <p className="text-slate-400 mt-2">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Person Filter Toggles */}
          <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-sm rounded-xl p-1 border border-white/[0.06]">
            {PERSONS.map((person) => {
              const config = PERSON_CONFIG[person];
              const isVisible = visiblePersons.includes(person);
              return (
                <button
                  key={person}
                  onClick={() => togglePersonVisibility(person)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isVisible
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  style={{
                    backgroundColor: isVisible ? config.color + "30" : "transparent",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-sm rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "week"
                  ? "bg-cyan-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === "day"
                  ? "bg-cyan-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-slate-900/40 backdrop-blur-sm text-slate-300 rounded-xl font-medium hover:bg-slate-800 transition-all border border-white/[0.06]"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek("prev")}
              className="p-2 bg-slate-900/40 backdrop-blur-sm text-slate-300 rounded-lg hover:bg-slate-800 transition-all border border-white/[0.06]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateWeek("next")}
              className="p-2 bg-slate-900/40 backdrop-blur-sm text-slate-300 rounded-lg hover:bg-slate-800 transition-all border border-white/[0.06]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setEventModal({ isOpen: true })}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col">
        {/* Day Headers */}
        <div className="border-b border-white/[0.04] bg-[#0a0f1a]">
          <div className={`grid ${viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]"}`}>
            <div className="p-3"></div>
            {weekDays.map((day, i) => {
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();
              return (
                <div key={i} className="p-2 text-center border-l border-white/[0.04]">
                  <div className="text-xs text-slate-400 mb-1">
                    {DAYS_OF_WEEK[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday
                        ? "w-8 h-8 mx-auto bg-cyan-500 text-white rounded-full flex items-center justify-center"
                        : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`grid ${viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]"} border-t border-white/[0.04]`}>
            <div></div>
            {weekDays.map((_, dayIndex) => (
              <div key={dayIndex} className="flex border-l border-white/[0.04]">
                {visiblePersons.map((person, personIndex) => {
                  const config = PERSON_CONFIG[person];
                  return (
                    <div
                      key={person}
                      className={`flex-1 py-1 text-center text-xs font-medium ${
                        personIndex > 0 ? "border-l border-white/[0.03]" : ""
                      }`}
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Time Grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto">
          <div className={`grid ${viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]"} relative`}>
            <div>
              {HOURS.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-white/[0.04] px-2 text-xs text-slate-500 pt-1">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-l border-white/[0.04] flex">
                {visiblePersons.map((person, personIndex) => {
                  const config = PERSON_CONFIG[person];
                  const personEvents = getDayEventsForPerson(day, person);

                  return (
                    <div
                      key={person}
                      className={`flex-1 relative ${personIndex > 0 ? "border-l border-white/[0.02]" : ""}`}
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, assignedTo: person }));
                            handleTimeSlotClick(day, hour);
                          }}
                          className="h-[60px] border-b border-white/[0.04] hover:bg-slate-800/30 cursor-pointer transition-colors"
                          style={{ backgroundColor: `${config.color}05` }}
                        />
                      ))}

                      {personEvents.map((event) => {
                        const position = getEventPosition(event);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: "absolute",
                              top: position.top,
                              height: position.height,
                              left: "2px",
                              right: "2px",
                              minHeight: "40px",
                              backgroundColor: event.color + "20",
                              borderLeft: `3px solid ${event.color}`,
                            }}
                            className="rounded-lg p-1 text-xs cursor-pointer group overflow-hidden"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventModal({ isOpen: true, event });
                            }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate text-[10px]">
                                  {event.title}
                                </div>
                                <div className="text-slate-400 text-[10px]">
                                  {formatTime(event.start_time)}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all flex-shrink-0"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {eventModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEventModal({ isOpen: false })} />
          <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-white/[0.08]">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {eventModal.event && !eventModal.isEditing ? "Event Details" : eventModal.isEditing ? "Edit Event" : "New Event"}
              </h3>
              <button onClick={() => setEventModal({ isOpen: false })} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {eventModal.event && !eventModal.isEditing ? (
                <>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{eventModal.event.title}</h4>
                    {eventModal.event.description && <p className="text-slate-400 text-sm">{eventModal.event.description}</p>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(eventModal.event.start_time)} - {formatTime(eventModal.event.end_time)}
                    </div>
                    {eventModal.event.assigned_to && (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PERSON_CONFIG[eventModal.event.assigned_to]?.color }} />
                        <span style={{ color: PERSON_CONFIG[eventModal.event.assigned_to]?.color }}>{PERSON_CONFIG[eventModal.event.assigned_to]?.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleEditEvent(eventModal.event!)} className="flex-1 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-xl font-medium transition-all">Edit Event</button>
                    <button onClick={() => { handleDeleteEvent(eventModal.event!.id); setEventModal({ isOpen: false }); }} className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-medium transition-all">Delete</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Event title..." className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Add details..." className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Event Type *</label>
                    <select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })} className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all">
                      <option value="task">Task</option>
                      <option value="demo">Demo</option>
                      <option value="meeting">Meeting</option>
                      <option value="call">Call</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Date *</label>
                      <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Who is going? *</label>
                      <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value as AssignedPerson })} className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all">
                        {personOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Start Time *</label>
                      <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">End Time *</label>
                      <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setEventModal({ isOpen: false })} className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all">Cancel</button>
                    <button onClick={eventModal.isEditing ? handleUpdateEvent : handleCreateEvent} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20">{eventModal.isEditing ? "Save Changes" : "Create Event"}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
