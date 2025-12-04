"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import { calendarService } from "@/lib/services/calendar.service";
import { TaskDetailModal } from "@/components/todos/task-detail-modal";
import { useDragToScroll } from "@/hooks/useDragToScroll";

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  assigned_to: "team" | "veeti" | "alppa";
  due_date: string;
  description?: string;
  display_order: number;
  screenshot_url?: string;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "team" as "team" | "veeti" | "alppa",
    dueDate: new Date().toISOString().split('T')[0],
    addToCalendar: false,
    startTime: "09:00",
    endTime: "10:00",
  });
  const [isRecordingTitle, setIsRecordingTitle] = useState(false);
  const [isRecordingDescription, setIsRecordingDescription] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentFieldRef = useRef<'title' | 'description' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDndDragging, setIsDndDragging] = useState(false);
  const { ref: scrollContainerRef } = useDragToScroll({ disabled: isDndDragging });

  const supabase = createClient();

  // Voice dictation function
  const toggleVoiceInput = (field: 'title' | 'description') => {
    if (typeof window === 'undefined') return;

    // If already recording this field, stop it
    if (recognitionRef.current && currentFieldRef.current === field) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      currentFieldRef.current = null;
      return;
    }

    // If recording another field, stop it first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognitionRef.current = recognition;
    currentFieldRef.current = field;

    if (field === 'title') {
      setIsRecordingTitle(true);
      setIsRecordingDescription(false);
    } else {
      setIsRecordingDescription(true);
      setIsRecordingTitle(false);
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setFormData(prev => ({
          ...prev,
          [field]: prev[field] + (prev[field] ? ' ' : '') + transcript
        }));
      }
    };

    recognition.onend = () => {
      setIsRecordingTitle(false);
      setIsRecordingDescription(false);
      recognitionRef.current = null;
      currentFieldRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecordingTitle(false);
      setIsRecordingDescription(false);
      recognitionRef.current = null;
      currentFieldRef.current = null;

      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsRecordingTitle(false);
      setIsRecordingDescription(false);
    }
  };

  // Validate and set screenshot file
  const processScreenshotFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    setScreenshotFile(file);
    // Create preview URL
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

  // Load todos on mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Stop recording when modal closes
  useEffect(() => {
    if (!isModalOpen && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      currentFieldRef.current = null;
      setIsRecordingTitle(false);
      setIsRecordingDescription(false);
    }
  }, [isModalOpen]);

  const loadTodos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("due_date", { ascending: true })
      .order("display_order", { ascending: true });

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

    setIsUploading(true);

    // Upload screenshot if one was selected
    let screenshotUrl: string | null = null;
    if (screenshotFile) {
      screenshotUrl = await uploadScreenshot(screenshotFile);
      if (!screenshotUrl) {
        alert('Failed to upload screenshot. Please try again.');
        setIsUploading(false);
        return;
      }
    }

    // Get the max display_order for the target date to add at the end
    const todosForDate = todos.filter(t => t.due_date === formData.dueDate);
    const maxOrder = todosForDate.length > 0
      ? Math.max(...todosForDate.map(t => t.display_order))
      : -1;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        title: formData.title,
        description: formData.description || null,
        completed: false,
        assigned_to: formData.assignedTo,
        due_date: formData.dueDate,
        user_id: user.id,
        display_order: maxOrder + 1,
        screenshot_url: screenshotUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating todo:", error);
      setIsUploading(false);
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
            assigned_to: formData.assignedTo,
          });
        } catch (calendarError) {
          console.error("Error adding to calendar:", calendarError);
          // Don't fail the todo creation if calendar fails
        }
      }
    }

    // Clear form and screenshot state
    setFormData({
      title: "",
      description: "",
      assignedTo: "team",
      dueDate: new Date().toISOString().split('T')[0],
      addToCalendar: false,
      startTime: "09:00",
      endTime: "10:00",
    });
    removeScreenshot();
    setIsUploading(false);
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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceDate = source.droppableId;
    const destDate = destination.droppableId;

    // Get todos for source and destination dates (sorted)
    const sourceTodos = [...todos]
      .filter((t) => t.due_date === sourceDate)
      .sort((a, b) => a.display_order - b.display_order);

    const destTodos = sourceDate === destDate
      ? sourceTodos
      : [...todos]
          .filter((t) => t.due_date === destDate)
          .sort((a, b) => a.display_order - b.display_order);

    // Remove from source
    const [movedTodo] = sourceTodos.splice(source.index, 1);
    if (!movedTodo) return;

    // Add to destination
    if (sourceDate === destDate) {
      sourceTodos.splice(destination.index, 0, movedTodo);
    } else {
      destTodos.splice(destination.index, 0, movedTodo);
    }

    // Build new todos array with updated dates and orders
    const updatedTodo = { ...movedTodo, due_date: destDate, display_order: destination.index };

    const newTodos = todos.map((todo) => {
      if (todo.id === movedTodo.id) {
        return updatedTodo;
      }
      // Update display_order for other todos in affected columns
      if (sourceDate === destDate) {
        // Same column - use new order from sourceTodos
        const newIndex = sourceTodos.findIndex((t) => t.id === todo.id);
        if (newIndex !== -1) {
          return { ...todo, display_order: newIndex };
        }
      } else {
        // Different columns
        const sourceIndex = sourceTodos.findIndex((t) => t.id === todo.id);
        if (sourceIndex !== -1) {
          return { ...todo, display_order: sourceIndex };
        }
        const destIndex = destTodos.findIndex((t) => t.id === todo.id);
        if (destIndex !== -1) {
          return { ...todo, display_order: destIndex };
        }
      }
      return todo;
    });

    // Update UI immediately
    setTodos(newTodos);

    // Persist all affected todos to database
    try {
      // Collect all todos that need updating
      const updates: { id: string; due_date: string; display_order: number }[] = [];

      // Add the moved todo
      updates.push({
        id: movedTodo.id,
        due_date: destDate,
        display_order: destination.index,
      });

      // Update all todos in source column (if different from dest)
      if (sourceDate !== destDate) {
        sourceTodos.forEach((todo, index) => {
          updates.push({
            id: todo.id,
            due_date: sourceDate,
            display_order: index,
          });
        });
      }

      // Update all todos in destination column
      const finalDestTodos = sourceDate === destDate ? sourceTodos : destTodos;
      finalDestTodos.forEach((todo, index) => {
        if (todo.id !== movedTodo.id) {
          updates.push({
            id: todo.id,
            due_date: destDate,
            display_order: index,
          });
        }
      });

      // Execute all updates
      for (const update of updates) {
        const { error } = await supabase
          .from("todos")
          .update({
            due_date: update.due_date,
            display_order: update.display_order,
          })
          .eq("id", update.id);

        if (error) {
          console.error("Error updating todo:", error);
        }
      }
    } catch (error) {
      console.error("Error updating todos:", error);
      loadTodos();
    }
  };

  const getTodosForDate = (date: string) => {
    return todos
      .filter(todo => todo.due_date === date)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDetailModalOpen(true);
  };

  const handleTodoUpdate = (updatedTodo: Todo) => {
    setTodos(todos.map(t => t.id === updatedTodo.id ? updatedTodo : t));
  };

  const handleTodoDelete = (todoId: string) => {
    setTodos(todos.filter(t => t.id !== todoId));
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
          <div className="relative bg-[#1A1F2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
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

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Task Title *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title..."
                    className="w-full px-4 py-2.5 pr-12 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVoiceInput('title')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      isRecordingTitle
                        ? 'text-red-500 animate-pulse bg-red-500/10'
                        : 'text-slate-400 hover:text-teal-500 hover:bg-slate-800'
                    }`}
                    title="Voice input"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Add details..."
                    className="w-full px-4 py-2.5 pr-12 border border-slate-700 rounded-xl bg-[#0F1419] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVoiceInput('description')}
                    className={`absolute right-3 top-3 p-1.5 rounded-lg transition-all ${
                      isRecordingDescription
                        ? 'text-red-500 animate-pulse bg-red-500/10'
                        : 'text-slate-400 hover:text-teal-500 hover:bg-slate-800'
                    }`}
                    title="Voice input"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Screenshot (optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-40 object-cover rounded-xl border border-slate-700"
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
                  </div>
                ) : (
                  <label
                    htmlFor="screenshot-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      isDragging
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-slate-700 bg-[#0F1419] hover:border-teal-500/50 hover:bg-[#0F1419]/80'
                    }`}
                  >
                    <svg className={`w-8 h-8 mb-2 ${isDragging ? 'text-teal-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm ${isDragging ? 'text-teal-400' : 'text-slate-500'}`}>
                      {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </span>
                    <span className="text-xs text-slate-600 mt-1">PNG, JPG up to 5MB</span>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Assigned To *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignedTo: "team" })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.assignedTo === "team"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignedTo: "veeti" })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.assignedTo === "veeti"
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    Veeti
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignedTo: "alppa" })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      formData.assignedTo === "alppa"
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    Alppa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Due Date *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="flex-1 px-4 py-2.5 border border-slate-700 rounded-xl bg-[#0F1419] text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFormData({ ...formData, dueDate: tomorrow.toISOString().split('T')[0] });
                    }}
                    className="px-4 py-2.5 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:border-slate-600 transition-all whitespace-nowrap text-sm font-medium"
                  >
                    Tomorrow
                  </button>
                </div>
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
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={addTodo}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      <DragDropContext onDragStart={() => setIsDndDragging(true)} onDragEnd={(result) => { setIsDndDragging(false); onDragEnd(result); }}>
        <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4">
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

                  <Droppable droppableId={day.date}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] rounded-xl p-2 -m-2 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-teal-500/10 ring-2 ring-teal-500/30' : ''
                        }`}
                      >
                        {dayTodos.map((todo, index) => {
                            const badge = getAssigneeBadge(todo.assigned_to);
                            return (
                              <Draggable
                                key={todo.id}
                                draggableId={todo.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    data-no-drag-scroll
                                    style={{
                                      ...provided.draggableProps.style,
                                      transition: snapshot.isDropAnimating
                                        ? 'all 0.2s ease'
                                        : provided.draggableProps.style?.transition,
                                    }}
                                    onClick={() => handleTodoClick(todo)}
                                    className={`bg-[#0F1419] rounded-xl p-4 border-l-4 ${getAssigneeColor(todo.assigned_to)} border border-slate-800 hover:border-slate-700 cursor-grab ${
                                      todo.completed ? 'opacity-50' : ''
                                    } ${
                                      snapshot.isDragging
                                        ? 'shadow-2xl shadow-teal-500/20 ring-2 ring-teal-500 z-50'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleTodo(todo.id);
                                        }}
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
                                          <p className="text-xs text-slate-400 mb-2 whitespace-pre-line">{todo.description}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} rounded border ${badge.border}`}>
                                            {badge.label}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTodo(todo.id);
                                        }}
                                        className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                        {provided.placeholder}
                        {dayTodos.length === 0 && (
                          <div className={`text-center py-8 text-slate-500 text-sm rounded-xl border-2 border-dashed ${
                            snapshot.isDraggingOver ? 'border-teal-500/50 bg-teal-500/5' : 'border-transparent'
                          }`}>
                            <p>{snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        todo={selectedTodo}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTodo(null);
        }}
        onUpdate={handleTodoUpdate}
        onDelete={handleTodoDelete}
      />
    </div>
  );
}
