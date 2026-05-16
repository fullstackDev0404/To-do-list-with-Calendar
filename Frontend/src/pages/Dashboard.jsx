import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  LuPlus, LuClock, LuTrash2, LuPencil, LuCheck,
  LuLayoutGrid, LuCalendarDays, LuCircleCheck, LuCircleDashed,
  LuFlag, LuTag, LuX, LuGripVertical, LuTimer, LuFlame, LuTriangleAlert,
} from "react-icons/lu";
import Calendar from "../components/Calendar";
import TodoModal, { tagColor } from "../components/TodoModal";
import PomodoroTimer from "../components/PomodoroTimer";
import { fetchTodos, deleteTodo, updateTodo, reorderTodos } from "../api/todoApi";

const PRIORITY_STYLES = {
  high:   { dark: "text-red-400 bg-red-500/10 border-red-500/25",       light: "text-red-600 bg-red-50 border-red-200"       },
  medium: { dark: "text-amber-400 bg-amber-500/10 border-amber-500/25", light: "text-amber-600 bg-amber-50 border-amber-200" },
  low:    { dark: "text-sky-400 bg-sky-500/10 border-sky-500/25",       light: "text-sky-600 bg-sky-50 border-sky-200"       },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

const isOverdue = (todo) => {
  if (todo.completed) return false;
  const today = todayStr();
  if (todo.date < today) return true;
  if (todo.date === today && todo.timeTo) {
    const now = new Date();
    const [h, m] = todo.timeTo.split(":").map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
  }
  return false;
};

const fmtMins = (m) => {
  if (!m) return null;
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ""}`.trim();
};

// ── Request notification permission once ──────────────────────────────────
function useNotificationPermission() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}

// ── Schedule reminders for today's todos ─────────────────────────────────
function useReminders(todos) {
  const scheduled = useRef(new Set());
  useEffect(() => {
    if (Notification.permission !== "granted") return;
    const today = todayStr();
    todos.forEach((t) => {
      if (!t.reminderAt || t.completed || t.date !== today) return;
      const key = `${t._id}-${t.reminderAt}`;
      if (scheduled.current.has(key)) return;
      const [h, m] = t.reminderAt.split(":").map(Number);
      const fireAt = new Date();
      fireAt.setHours(h, m, 0, 0);
      const ms = fireAt - Date.now();
      if (ms > 0) {
        scheduled.current.add(key);
        setTimeout(() => {
          new Notification(`⏰ Reminder: ${t.title}`, {
            body: t.description || t.date,
            icon: "/favicon.ico",
          });
        }, ms);
      }
    });
  }, [todos]);
}

// ── Single draggable task row ─────────────────────────────────────────────
function TaskRow({ todo, darkMode, textPri, textMuted, divider, activeTag, setActiveTag,
                   onToggle, onEdit, onDelete, onStartPomodoro }) {
  const dragControls = useDragControls();
  const overdue = isOverdue(todo);
  const p  = todo.priority;
  const ps = PRIORITY_STYLES[p] || PRIORITY_STYLES.medium;

  const loggedPct = todo.estimatedMinutes > 0
    ? Math.min(100, Math.round((todo.loggedMinutes || 0) / todo.estimatedMinutes * 100))
    : null;

  return (
    <Reorder.Item
      value={todo}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className={`flex items-start gap-3.5 px-5 py-4 group transition-colors duration-150 ${
        overdue
          ? darkMode ? "bg-red-500/[0.04] hover:bg-red-500/[0.07]" : "bg-red-50/60 hover:bg-red-50"
          : darkMode ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.015]"
      }`}
      style={{ borderBottom: `1px solid ${divider}` }}
      whileDrag={{
        scale: 1.02,
        boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.15)",
        zIndex: 50,
        cursor: "grabbing",
      }}
    >
      {/* Drag handle */}
      <button
        className={`mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none transition-opacity opacity-0 group-hover:opacity-100 ${
          darkMode ? "text-gray-700 hover:text-gray-400" : "text-gray-300 hover:text-gray-500"
        }`}
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Drag to reorder"
      >
        <LuGripVertical size={16} />
      </button>

      {/* Toggle */}
      <button
        onClick={() => onToggle(todo)}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          todo.completed
            ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/40"
            : overdue
            ? "border-red-500 hover:border-red-400"
            : darkMode ? "border-gray-600 hover:border-sky-400" : "border-gray-300 hover:border-sky-400"
        }`}
      >
        {todo.completed && <LuCheck size={11} strokeWidth={3} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-base font-medium leading-snug ${
            todo.completed
              ? `line-through ${darkMode ? "text-gray-600" : "text-gray-400"}`
              : overdue ? (darkMode ? "text-red-400" : "text-red-600")
              : textPri
          }`}>
            {todo.title}
          </p>
          {/* Overdue badge */}
          {overdue && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${darkMode ? "text-red-400" : "text-red-500"}`}>
              <LuTriangleAlert size={12} /> Overdue
            </span>
          )}
          {/* Streak badge */}
          {(todo.streak || 0) >= 2 && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${darkMode ? "text-orange-400" : "text-orange-500"}`}>
              <LuFlame size={12} />{todo.streak}
            </span>
          )}
        </div>

        {todo.description && (
          <p className={`text-sm mt-1 truncate ${textMuted}`}>{todo.description}</p>
        )}

        {(todo.timeFrom || todo.timeTo) && (
          <span className={`inline-flex items-center gap-1.5 text-sm mt-1.5 font-medium ${
            darkMode ? "text-sky-400/70" : "text-sky-500"
          }`}>
            <LuClock size={13} />
            {todo.timeFrom && todo.timeTo
              ? `${todo.timeFrom} – ${todo.timeTo}`
              : todo.timeFrom ? `From ${todo.timeFrom}` : `Until ${todo.timeTo}`}
          </span>
        )}

        {/* Time tracking bar */}
        {todo.estimatedMinutes > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className={`flex-1 h-1 rounded-full overflow-hidden ${darkMode ? "bg-white/10" : "bg-gray-200"}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  loggedPct >= 100 ? "bg-emerald-500" : loggedPct >= 75 ? "bg-amber-400" : "bg-sky-500"
                }`}
                style={{ width: `${loggedPct ?? 0}%` }}
              />
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${textMuted}`}>
              {fmtMins(todo.loggedMinutes || 0)} / {fmtMins(todo.estimatedMinutes)}
            </span>
          </div>
        )}

        {/* Tag chips */}
        {(todo.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {todo.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium border transition-all duration-150 ${tagColor(tag, darkMode)} ${
                  activeTag === tag ? "ring-1 ring-current ring-offset-0" : "opacity-80 hover:opacity-100"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority badge */}
      {p && !todo.completed && (
        <span className={`flex-shrink-0 self-start mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${darkMode ? ps.dark : ps.light}`}>
          <LuFlag size={10} />
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {!todo.completed && (
          <button
            onClick={() => onStartPomodoro(todo)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? "text-gray-600 hover:text-violet-400 hover:bg-violet-400/10" : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"
            }`}
            title="Start Pomodoro"
          >
            <LuTimer size={15} />
          </button>
        )}
        <button
          onClick={() => onEdit(todo)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? "text-gray-600 hover:text-gray-200 hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <LuPencil size={15} />
        </button>
        <button
          onClick={() => onDelete(todo._id)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? "text-gray-600 hover:text-red-400 hover:bg-red-400/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <LuTrash2 size={15} />
        </button>
      </div>
    </Reorder.Item>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ darkMode = true }) {
  const navigate = useNavigate();
  const [allTodos,     setAllTodos]     = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingTodo,  setEditingTodo]  = useState(null);
  const [activeTag,    setActiveTag]    = useState(null);
  const [orderedDay,   setOrderedDay]   = useState([]);
  const [pomodoroTodo, setPomodoroTodo] = useState(null);
  const saveTimer = useRef(null);

  useNotificationPermission();
  useReminders(allTodos);

  const isLoggedIn = () =>
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

  const loadTodos = useCallback(async () => {
    try { setAllTodos(await fetchTodos()); }
    catch { toast.error("Couldn't load todos"); }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadTodos();
  }, [navigate, loadTodos]);

  useEffect(() => {
    const day = allTodos
      .filter((t) => t.date === selectedDate)
      .filter((t) => !activeTag || (t.tags || []).includes(activeTag))
      .sort((a, b) => {
        if (a.order !== b.order) return (a.order ?? 0) - (b.order ?? 0);
        if (!a.timeFrom && !b.timeFrom) return 0;
        if (!a.timeFrom) return 1;
        if (!b.timeFrom) return -1;
        return a.timeFrom.localeCompare(b.timeFrom);
      });
    setOrderedDay(day);
  }, [allTodos, selectedDate, activeTag]);

  const handleReorder = (newOrder) => {
    setOrderedDay(newOrder);
    setAllTodos((prev) => {
      const updated = [...prev];
      newOrder.forEach((t, i) => {
        const idx = updated.findIndex((x) => x._id === t._id);
        if (idx !== -1) updated[idx] = { ...updated[idx], order: i };
      });
      return updated;
    });
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await reorderTodos(newOrder.map((t, i) => ({ id: t._id, order: i }))); }
      catch { toast.error("Couldn't save order"); }
    }, 600);
  };

  const allTags   = [...new Set(allTodos.flatMap((t) => t.tags || []))].sort();
  const dayTagSet = [...new Set(
    allTodos.filter((t) => t.date === selectedDate).flatMap((t) => t.tags || [])
  )].sort();
  const todoDates = [...new Set(allTodos.map((t) => t.date))];

  // Count overdue tasks for the stats area
  const overdueCount = allTodos.filter(isOverdue).length;

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      setAllTodos((p) => p.filter((t) => t._id !== id));
      if (pomodoroTodo?._id === id) setPomodoroTodo(null);
      toast.success("Removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleToggle = async (todo) => {
    try {
      const updated = await updateTodo(todo._id, { ...todo, completed: !todo.completed });
      setAllTodos((p) => p.map((t) => (t._id === updated._id ? updated : t)));
      if (updated.completed && (updated.streak || 0) >= 2) {
        toast.success(`🔥 ${updated.streak}-day streak!`);
      }
    } catch { toast.error("Update failed"); }
  };

  // Called by PomodoroTimer when it logs time
  const handleTimeLogged = (updated) => {
    setAllTodos((p) => p.map((t) => (t._id === updated._id ? updated : t)));
    setPomodoroTodo(updated);
  };

  const openCreate = () => { setEditingTodo(null); setModalOpen(true); };
  const openEdit   = (t) => { setEditingTodo(t);   setModalOpen(true); };
  const handleSelectDate = (d) => { setSelectedDate(d); setActiveTag(null); };

  const today     = todayStr();
  const textPri   = darkMode ? "text-white"    : "text-gray-900";
  const textMuted = darkMode ? "text-gray-500" : "text-gray-400";
  const textSub   = darkMode ? "text-gray-400" : "text-gray-500";
  const divider   = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const stats = [
    { label: "Total",   value: allTodos.length,                                 icon: LuLayoutGrid,   color: "text-sky-400",     glow: "shadow-sky-400/20"     },
    { label: "Today",   value: allTodos.filter((t) => t.date === today).length,  icon: LuCalendarDays, color: "text-violet-400",  glow: "shadow-violet-400/20"  },
    { label: "Done",    value: allTodos.filter((t) => t.completed).length,       icon: LuCircleCheck,  color: "text-emerald-400", glow: "shadow-emerald-400/20" },
    { label: "Overdue", value: overdueCount,                                     icon: LuTriangleAlert,  color: overdueCount > 0 ? "text-red-400" : "text-gray-500", glow: overdueCount > 0 ? "shadow-red-400/20" : "" },
  ];

  return (
    <div className="min-h-[calc(100vh-57px)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-5">

        {/* ── LEFT ── */}
        <div className="md:w-[330px] flex-shrink-0 flex flex-col gap-4">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            todoDates={todoDates}
            darkMode={darkMode}
          />

          {/* Stats */}
          <div className={`rounded-2xl p-5 ${darkMode ? "card-3d-dark" : "card-3d-light"}`}>
            <p className={`text-xs font-bold uppercase tracking-[0.12em] mb-3 ${textMuted}`}>
              At a glance
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ label, value, icon: Icon, color, glow }) => (
                <div
                  key={label}
                  className={`rounded-xl p-3.5 flex items-center gap-3 stat-chip-${darkMode ? "dark" : "light"} shadow-md ${glow}`}
                >
                  <div className={`${color} flex-shrink-0`}><Icon size={20} /></div>
                  <div>
                    <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
                    <p className={`text-sm mt-1 ${textMuted}`}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All-tags sidebar */}
          {allTags.length > 0 && (
            <div className={`rounded-2xl p-5 ${darkMode ? "card-3d-dark" : "card-3d-light"}`}>
              <p className={`text-xs font-bold uppercase tracking-[0.12em] mb-3 ${textMuted}`}>
                All tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all duration-150 ${
                      activeTag === tag
                        ? tagColor(tag, darkMode)
                        : darkMode
                          ? "bg-transparent border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                          : "bg-transparent border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                    }`}
                  >
                    <LuTag size={9} />#{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Date header */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h2 className={`text-xl font-semibold leading-snug truncate ${textPri}`}>
                {formatDisplayDate(selectedDate)}
              </h2>
              <p className={`text-sm mt-1 ${textSub}`}>
                {orderedDay.length === 0
                  ? activeTag ? `No tasks tagged #${activeTag} today` : "Nothing planned — enjoy the quiet ☕"
                  : `${orderedDay.length} task${orderedDay.length === 1 ? "" : "s"} · ${orderedDay.filter((t) => t.completed).length} done`}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 btn-3d"
            >
              <LuPlus size={16} strokeWidth={2.5} />
              New task
            </button>
          </div>

          {/* Tag filter bar */}
          {dayTagSet.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <LuTag size={13} className={textMuted} />
              {dayTagSet.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                    activeTag === tag
                      ? tagColor(tag, darkMode)
                      : darkMode
                        ? "bg-transparent border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                        : "bg-transparent border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <LuX size={11} /> Clear
                </button>
              )}
            </div>
          )}

          {/* Task list */}
          <div className={`flex-1 rounded-2xl overflow-hidden ${darkMode ? "card-3d-dark" : "card-3d-light"}`}>
            {orderedDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 select-none">
                <span className="text-5xl">{activeTag ? "🏷️" : "🌿"}</span>
                <p className={`text-base font-medium ${textMuted}`}>
                  {activeTag ? `No tasks tagged #${activeTag}` : "All clear for this day"}
                </p>
                {!activeTag && (
                  <button
                    onClick={openCreate}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                      darkMode
                        ? "text-sky-400 bg-sky-400/10 hover:bg-sky-400/20"
                        : "text-sky-500 bg-sky-50 hover:bg-sky-100"
                    }`}
                  >
                    + Add a task
                  </button>
                )}
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={orderedDay}
                onReorder={handleReorder}
                as="div"
                className="outline-none"
              >
                <AnimatePresence initial={false}>
                  {orderedDay.map((todo) => (
                    <TaskRow
                      key={todo._id}
                      todo={todo}
                      darkMode={darkMode}
                      textPri={textPri}
                      textMuted={textMuted}
                      divider={divider}
                      activeTag={activeTag}
                      setActiveTag={setActiveTag}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onStartPomodoro={setPomodoroTodo}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen && (
        <TodoModal
          closeModal={() => setModalOpen(false)}
          editingTodo={editingTodo}
          setTodos={setAllTodos}
          defaultDate={selectedDate}
          darkMode={darkMode}
          allTags={allTags}
        />
      )}

      {/* Pomodoro timer */}
      <AnimatePresence>
        {pomodoroTodo && (
          <PomodoroTimer
            key={pomodoroTodo._id}
            todo={pomodoroTodo}
            darkMode={darkMode}
            onClose={() => setPomodoroTodo(null)}
            onTimeLogged={handleTimeLogged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
