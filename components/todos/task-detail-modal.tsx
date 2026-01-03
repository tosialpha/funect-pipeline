"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/contexts/organization-context";
import { getPersonOptionsForOrg, PERSON_CONFIG, AssignedPerson } from "@/lib/constants/person-colors";

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assigned_to: AssignedPerson;
  due_date: string;
  display_order: number;
  screenshot_url?: string;
  organization_id: string;
}

interface TaskDetailModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTodo: Todo) => void;
  onDelete: (todoId: string) => void;
}

export function TaskDetailModal({ todo, isOpen, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const { slug } = useOrganization();
  const personOptions = getPersonOptionsForOrg(slug);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "team" as AssignedPerson,
    due_date: "",
    completed: false,
    screenshot_url: "" as string | undefined,
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  // Validate and set screenshot file
  const processScreenshotFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setScreenshotFile(file);
    const previewUrl = URL.createObjectURL(file);
    setScreenshotPreview(previewUrl);
  };

  // Handle screenshot file selection
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processScreenshotFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processScreenshotFile(file);
    }
  };

  // Remove screenshot
  const removeScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    setFormData({ ...formData, screenshot_url: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload screenshot to Supabase storage
  const uploadScreenshot = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `screenshots/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-screenshots')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading screenshot:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  useEffect(() => {
    if (todo && isOpen) {
      setFormData({
        title: todo.title || "",
        description: todo.description || "",
        assigned_to: todo.assigned_to || "team",
        due_date: todo.due_date || "",
        completed: todo.completed || false,
        screenshot_url: todo.screenshot_url || undefined,
      });
      setIsEditing(false);
      setError("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
    }
  }, [todo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    setIsLoading(true);
    setError("");

    try {
      // Upload new screenshot if one was selected
      let finalScreenshotUrl = formData.screenshot_url;
      if (screenshotFile) {
        const uploadedUrl = await uploadScreenshot(screenshotFile);
        if (!uploadedUrl) {
          setError('Failed to upload screenshot. Please try again.');
          setIsLoading(false);
          return;
        }
        finalScreenshotUrl = uploadedUrl;
      }

      const { error: dbError } = await supabase
        .from("todos")
        .update({
          title: formData.title,
          description: formData.description || null,
          assigned_to: formData.assigned_to,
          due_date: formData.due_date,
          completed: formData.completed,
          screenshot_url: finalScreenshotUrl || null,
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
        screenshot_url: finalScreenshotUrl,
      });
      setIsEditing(false);
      setScreenshotFile(null);
      setScreenshotPreview(null);
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
      case "ilari":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Ilari" };
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
      <div className="relative bg-slate-900/30 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-slate-800/50">
        <div className="sticky top-0 bg-slate-900/30 backdrop-blur-sm border-b border-slate-800/50 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? "Edit Task" : "Task Details"}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-xl font-medium transition-all border border-cyan-500/20"
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
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-white whitespace-pre-wrap">{formData.description || "-"}</p>
            )}
          </div>

          {/* Screenshot */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Screenshot
            </label>
            {isEditing ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="screenshot-edit-upload"
                />
                {screenshotPreview || formData.screenshot_url ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview || formData.screenshot_url}
                      alt="Screenshot"
                      className="w-full h-48 object-cover rounded-xl border border-slate-700 cursor-pointer"
                      onClick={() => setIsImageModalOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-all"
                      title="Remove screenshot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <label
                      htmlFor="screenshot-edit-upload"
                      className="absolute bottom-2 right-2 p-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
                      title="Change screenshot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="screenshot-edit-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDragging
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-[#0a0f1a] hover:border-cyan-500/50 hover:bg-[#0a0f1a]/80'
                    }`}
                  >
                    <svg className={`w-8 h-8 mb-2 ${isDragging ? 'text-cyan-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </span>
                    <span className="text-xs text-slate-600 mt-1">PNG, JPG up to 5MB</span>
                  </label>
                )}
              </>
            ) : formData.screenshot_url ? (
              <div className="relative">
                <img
                  src={formData.screenshot_url}
                  alt="Screenshot"
                  className="w-full h-48 object-cover rounded-xl border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIsImageModalOpen(true)}
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-xs text-slate-300">
                  Click to view full size
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No screenshot attached</p>
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
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value as AssignedPerson })}
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              >
                {personOptions.map((person) => (
                  <option key={person.value} value={person.value}>
                    {person.value === 'team' ? 'Team Task' : person.label}
                  </option>
                ))}
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
                className="w-full px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0a0f1a] text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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
                  className="w-5 h-5 rounded border-slate-700 bg-[#0a0f1a] text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
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
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                      if (todo) {
                        setFormData({
                          title: todo.title || "",
                          description: todo.description || "",
                          assigned_to: todo.assigned_to || "team",
                          due_date: todo.due_date || "",
                          completed: todo.completed || false,
                          screenshot_url: todo.screenshot_url || undefined,
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
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
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

      {/* Fullscreen Image Modal */}
      {isImageModalOpen && (screenshotPreview || formData.screenshot_url) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={screenshotPreview || formData.screenshot_url}
            alt="Screenshot full view"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
