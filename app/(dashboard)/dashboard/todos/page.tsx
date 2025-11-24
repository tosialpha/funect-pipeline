"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { calendarService } from "@/lib/services/calendar.service";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  assigned_to: "team" | "veeti" | "alppa";
  due_date: string;
  description?: string;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "team" as "team" | "veeti" | "alppa",
    dueDate: new Date().toISOString().split('T')[0],
    addToCalendar: false,
    startTime: "09:00",
    endTime: "10:00",
  });

  const supabase = createClient();

  // Load todos on mount
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error loading todos:", error);
    } else {
      setTodos(data || []);
    }
    setIsLoading(false);
  };

  // Generate next 7 days
  const getDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0,
      });
    }
    return days;
  };

  const days = getDays();

  const addTodo = async () => {
    if (!formData.title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        title: formData.title,
        description: formData.description || null,
        completed: false,
        assigned_to: formData.assignedTo,
        due_date: formData.dueDate,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating todo:", error);
      return;
    }

    if (data) {
      setTodos([...todos, data]);

      // If user wants to add to calendar, create calendar event
      if (formData.addToCalendar) {
        try {
          const [year, month, day] = formData.dueDate.split('-').map(Number);
          const [startHour, startMinute] = formData.startTime.split(':').map(Number);
          const [endHour, endMinute] = formData.endTime.split(':').map(Number);

          const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
          const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

          await calendarService.createEvent({
            title: formData.title,
            description: formData.description || undefined,
            event_type: "task",
            start_time: startDateTime,
            end_time: endDateTime,
            color: "#00C896",
          });
        } catch (calendarError) {
          console.error("Error adding to calendar:", calendarError);
          // Don't fail the todo creation if calendar fails
        }
      }
    }

    setFormData({
      title: "",
      description: "",
      assignedTo: "team",
      dueDate: new Date().toISOString().split('T')[0],
      addToCalendar: false,
      startTime: "09:00",
      endTime: "10:00",
    });
    setIsModalOpen(false);
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await supabase
      .from("todos")
      .update({ completed: !todo.completed })
      .eq("id", id);

    if (error) {
      console.error("Error toggling todo:", error);
      return;
    }

    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting todo:", error);
      return;
    }

    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getTodosForDate = (date: string) => {
    return todos.filter(todo => todo.due_date === date);
  };

  const getAssigneeColor = (assignedTo: string) => {
    switch (assignedTo) {
      case "team":
        return "border-purple-500";
      case "veeti":
        return "border-blue-500";
      case "alppa":
        return "border-orange-500";
      default:
        return "border-slate-500";
    }
  };

  const getAssigneeBadge = (assignedTo: string) => {
    switch (assignedTo) {
      case "team":
        return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", label: "Team Task" };
      case "veeti":
        return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Veeti" };
      case "alppa":
        return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", label: "Alppa" };
      default:
        return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", label: "Unassigned" };
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">
            To Do Calendar
          </h2>
          <p className="text-slate-400 mt-2">
            Manage tasks across your team
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title..."
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Add details..."
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Assigned To *
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value as "team" | "veeti" | "alppa" })}
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="team">Team Task</option>
                  <option value="veeti">Veeti</option>
                  <option value="alppa">Alppa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Add to Calendar Option */}
              <div className="border-t border-slate-800 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.addToCalendar}
                    onChange={(e) => setFormData({ ...formData, addToCalendar: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-[#0F1419] text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">Add to Calendar</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create a calendar event for this task
                    </p>
                  </div>
                </label>

                {/* Time Pickers (shown when Add to Calendar is checked) */}
                {formData.addToCalendar && (
                  <div className="mt-4 grid grid-cols-2 gap-4 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addTodo}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {days.map((day) => {
          const dayTodos = getTodosForDate(day.date);
          return (
            <div
              key={day.date}
              className="flex-shrink-0 w-80"
            >
              <div className="bg-[#1A1F2E] rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-6 rounded-full ${day.isToday ? 'bg-teal-500' : 'bg-slate-600'}`} />
                    <h3 className="font-semibold text-white">
                      {day.label}
                    </h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg">
                      {dayTodos.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {dayTodos.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      <p>No tasks</p>
                    </div>
                  ) : (
                    dayTodos.map((todo) => {
                      const badge = getAssigneeBadge(todo.assigned_to);
                      return (
                        <motion.div
                          key={todo.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-[#0F1419] rounded-xl p-4 border-l-4 ${getAssigneeColor(todo.assigned_to)} border border-slate-800 hover:border-slate-700 transition-all cursor-pointer ${
                            todo.completed ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                todo.completed
                                  ? 'bg-teal-500 border-teal-500'
                                  : 'border-slate-600 hover:border-teal-500'
                              }`}
                            >
                              {todo.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-white text-sm mb-1 ${todo.completed ? 'line-through' : ''}`}>
                                {todo.title}
                              </h4>
                              {todo.description && (
                                <p className="text-xs text-slate-400 mb-2">{todo.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} rounded border ${badge.border}`}>
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTodo(todo.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
