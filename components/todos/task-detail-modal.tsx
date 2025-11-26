"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assigned_to: "team" | "veeti" | "alppa";
  due_date: string;
  display_order: number;
}

interface TaskDetailModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTodo: Todo) => void;
  onDelete: (todoId: string) => void;
}

export function TaskDetailModal({ todo, isOpen, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "team" as "team" | "veeti" | "alppa",
    due_date: "",
    completed: false,
  });

  const supabase = createClient();

  useEffect(() => {
    if (todo && isOpen) {
      setFormData({
        title: todo.title || "",
        description: todo.description || "",
        assigned_to: todo.assigned_to || "team",
        due_date: todo.due_date || "",
        completed: todo.completed || false,
      });
      setIsEditing(false);
      setError("");
    }
  }, [todo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    setIsLoading(true);
    setError("");

    try {
      const { error: dbError } = await supabase
        .from("todos")
        .update({
          title: formData.title,
          description: formData.description || null,
          assigned_to: formData.assigned_to,
          due_date: formData.due_date,
          completed: formData.completed,
        })
        .eq("id", todo.id);

      if (dbError) {
        console.error("Database error:", dbError);
        setError(dbError.message || "Failed to update task");
        setIsLoading(false);
        return;
      }

      onUpdate({
        ...todo,
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        due_date: formData.due_date,
        completed: formData.completed,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);

    try {
      const { error: dbError } = await supabase
        .from("todos")
        .delete()
        .eq("id", todo.id);

      if (dbError) {
        console.error("Database error:", dbError);
        setError(dbError.message || "Failed to delete task");
        setIsLoading(false);
        return;
      }

      onDelete(todo.id);
      onClose();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (!isOpen || !todo) return null;

  const badge = getAssigneeBadge(formData.assigned_to);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="sticky top-0 bg-[#1A1F2E] border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? "Edit Task" : "Task Details"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Task Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className={`text-white font-medium text-lg ${formData.completed ? 'line-through opacity-50' : ''}`}>
                {formData.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Add details about this task..."
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white whitespace-pre-wrap">{formData.description || "-"}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Assigned To
            </label>
            {isEditing ? (
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value as "team" | "veeti" | "alppa" })}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="team">Team Task</option>
                <option value="veeti">Veeti</option>
                <option value="alppa">Alppa</option>
              </select>
            ) : (
              <span className={`inline-block px-2.5 py-1 text-sm font-semibold ${badge.bg} ${badge.text} rounded-lg border ${badge.border}`}>
                {badge.label}
              </span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Due Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white font-medium">{formatDate(formData.due_date)}</p>
            )}
          </div>

          {/* Completed Status */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Status
            </label>
            {isEditing ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.completed}
                  onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 bg-[#0F1419] text-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-white">Mark as completed</span>
              </label>
            ) : (
              <span className={`inline-block px-2.5 py-1 text-sm font-semibold rounded-lg border ${
                formData.completed
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {formData.completed ? 'Completed' : 'Pending'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition-all border border-red-500/20 disabled:opacity-50"
            >
              Delete Task
            </button>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (todo) {
                        setFormData({
                          title: todo.title || "",
                          description: todo.description || "",
                          assigned_to: todo.assigned_to || "team",
                          due_date: todo.due_date || "",
                          completed: todo.completed || false,
                        });
                      }
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
