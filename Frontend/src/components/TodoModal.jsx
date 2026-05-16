import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { LuX, LuCheck, LuFlag, LuTag, LuClock, LuBell } from "react-icons/lu";
import { createTodo, updateTodo } from "../api/todoApi";

const PRIORITIES = [
  { value: "low",    label: "Low",    dark: "bg-sky-500/15 text-sky-400 border-sky-500/30",       light: "bg-sky-50 text-sky-600 border-sky-200"       },
  { value: "medium", label: "Medium", dark: "bg-amber-500/15 text-amber-400 border-amber-500/30", light: "bg-amber-50 text-amber-600 border-amber-200"  },
  { value: "high",   label: "High",   dark: "bg-red-500/15 text-red-400 border-red-500/30",       light: "bg-red-50 text-red-600 border-red-200"        },
];

// Rotating palette so each tag gets a distinct colour
const TAG_COLORS = [
  { dark: "bg-violet-500/15 text-violet-400 border-violet-500/25", light: "bg-violet-50 text-violet-600 border-violet-200" },
  { dark: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", light: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { dark: "bg-pink-500/15 text-pink-400 border-pink-500/25",       light: "bg-pink-50 text-pink-600 border-pink-200"       },
  { dark: "bg-orange-500/15 text-orange-400 border-orange-500/25", light: "bg-orange-50 text-orange-600 border-orange-200" },
  { dark: "bg-teal-500/15 text-teal-400 border-teal-500/25",       light: "bg-teal-50 text-teal-600 border-teal-200"       },
  { dark: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25", light: "bg-indigo-50 text-indigo-600 border-indigo-200" },
];

export function tagColor(tag, darkMode) {
  const idx = [...tag].reduce((acc, c) => acc + c.charCodeAt(0), 0) % TAG_COLORS.length;
  return darkMode ? TAG_COLORS[idx].dark : TAG_COLORS[idx].light;
}

export default function TodoModal({ closeModal, editingTodo, setTodos, defaultDate, darkMode = true, allTags = [] }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [date,        setDate]        = useState(defaultDate || "");
  const [timeFrom,    setTimeFrom]    = useState("");
  const [timeTo,      setTimeTo]      = useState("");
  const [completed,   setCompleted]   = useState(false);
  const [priority,    setPriority]    = useState("medium");
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [reminderAt,  setReminderAt]  = useState("");
  const tagRef = useRef(null);

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description || "");
      setDate(editingTodo.date || defaultDate || "");
      setTimeFrom(editingTodo.timeFrom || "");
      setTimeTo(editingTodo.timeTo || "");
      setCompleted(editingTodo.completed);
      setPriority(editingTodo.priority || "medium");
      setTags(editingTodo.tags || []);
      setEstimatedMinutes(editingTodo.estimatedMinutes || "");
      setReminderAt(editingTodo.reminderAt || "");
    } else {
      setTitle(""); setDescription("");
      setDate(defaultDate || "");
      setTimeFrom(""); setTimeTo("");
      setCompleted(false);
      setPriority("medium");
      setTags([]);
      setEstimatedMinutes("");
      setReminderAt("");
    }
    setTagInput("");
  }, [editingTodo, defaultDate]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (tagRef.current && !tagRef.current.contains(e.target)) setShowSuggest(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addTag = (raw) => {
    const val = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || tags.includes(val) || tags.length >= 10) return;
    setTags((p) => [...p, val]);
    setTagInput("");
    setShowSuggest(false);
  };

  const removeTag = (t) => setTags((p) => p.filter((x) => x !== t));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && !tagInput && tags.length) removeTag(tags[tags.length - 1]);
  };

  const suggestions = allTags.filter(
    (t) => t.includes(tagInput.toLowerCase()) && !tags.includes(t)
  ).slice(0, 6);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Give it a title first"); return; }
    if (!date)         { toast.error("Pick a date");           return; }
    if (timeFrom && timeTo && timeTo <= timeFrom) {
      toast.error("End time must be after start time"); return;
    }
    // commit any pending tag input
    const finalTags = tagInput.trim()
      ? [...new Set([...tags, tagInput.trim().toLowerCase().replace(/\s+/g, "-")])]
      : tags;

    try {
      const payload = { title: title.trim(), description: description.trim(), date, timeFrom, timeTo, completed, priority, tags: finalTags,
        estimatedMinutes: Number(estimatedMinutes) || 0, reminderAt };
      if (editingTodo) {
        const updated = await updateTodo(editingTodo._id, payload);
        setTodos((p) => p.map((t) => (t._id === updated._id ? updated : t)));
        toast.success("Updated!");
      } else {
        const newTodo = await createTodo(payload);
        setTodos((p) => [...p, newTodo]);
        toast.success("Task added!");
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-base transition-all duration-200 ${
    darkMode ? "text-white placeholder-gray-600 input-3d-dark" : "text-gray-900 placeholder-gray-400 input-3d-light"
  }`;
  const labelCls = `block text-xs font-bold uppercase tracking-[0.1em] mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        />

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={`relative w-full max-w-[480px] rounded-3xl p-7 max-h-[90vh] overflow-y-auto ${darkMode ? "card-3d-dark" : "card-3d-light"}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {editingTodo ? "Edit task ✏️" : "New task 🍃"}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {editingTodo ? "Make your changes below" : "What do you need to get done?"}
              </p>
            </div>
            <button
              onClick={closeModal}
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LuX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Title */}
            <div>
              <label className={labelCls}>Task *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Buy oat milk, finish that PR…"
                className={inputCls}
                autoFocus
              />
            </div>

            {/* Priority */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><LuFlag size={11} />Priority</span>
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map(({ value, label, dark, light }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      priority === value
                        ? darkMode ? dark : light
                        : darkMode
                          ? "bg-transparent border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400"
                          : "bg-transparent border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div ref={tagRef} className="relative">
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><LuTag size={11} />Tags</span>
              </label>

              {/* Tag chips + input */}
              <div
                className={`flex flex-wrap gap-1.5 min-h-[46px] px-3 py-2 rounded-xl border transition-all duration-200 cursor-text ${
                  darkMode
                    ? "bg-black/28 border-white/[0.07] focus-within:border-violet-500/45 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.10)]"
                    : "bg-white/80 border-black/10 focus-within:border-sky-400/60 focus-within:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
                }`}
                onClick={() => tagRef.current?.querySelector("input")?.focus()}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${tagColor(tag, darkMode)}`}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                      className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <LuX size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); setShowSuggest(true); }}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => setShowSuggest(true)}
                  placeholder={tags.length === 0 ? "Add tags… (Enter or comma to add)" : ""}
                  className={`flex-1 min-w-[120px] bg-transparent outline-none text-sm ${
                    darkMode ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggest && (tagInput || suggestions.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute z-10 left-0 right-0 mt-1 rounded-xl border overflow-hidden shadow-xl ${
                      darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"
                    }`}
                  >
                    {tagInput && !suggestions.includes(tagInput.toLowerCase()) && (
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(tagInput); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                          darkMode ? "text-violet-400 hover:bg-white/5" : "text-violet-600 hover:bg-violet-50"
                        }`}
                      >
                        <LuTag size={13} />
                        Create <span className="font-semibold">#{tagInput.trim().toLowerCase()}</span>
                      </button>
                    )}
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                          darkMode ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${tagColor(s, darkMode)}`}>
                          #{s}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                Press Enter or comma to add · max 10 tags
              </p>
            </div>

            {/* Date */}
            <div>
              <label className={labelCls}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>

            {/* Time */}
            <div>
              <label className={labelCls}>Time (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={`text-xs mb-1.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>From</p>
                  <input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <p className={`text-xs mb-1.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>To</p>
                  <input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Extra details, links, context…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Estimated time + Reminder */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><LuClock size={11} />Est. time (min)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="e.g. 30"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><LuBell size={11} />Reminder</span>
                </label>
                <input
                  type="time"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Completed */}
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className="flex items-center gap-3 group w-full text-left"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                completed
                  ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/40"
                  : darkMode ? "border-gray-600 group-hover:border-sky-400" : "border-gray-300 group-hover:border-sky-400"
              }`}>
                {completed && <LuCheck size={12} strokeWidth={3} className="text-white" />}
              </div>
              <span className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Mark as already done
              </span>
            </button>

            {/* Divider */}
            <div className={`border-t ${darkMode ? "border-white/[0.07]" : "border-gray-100"}`} />

            {/* Actions */}
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  darkMode
                    ? "text-gray-400 hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 btn-3d"
              >
                {editingTodo ? "Save changes" : "Add task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
