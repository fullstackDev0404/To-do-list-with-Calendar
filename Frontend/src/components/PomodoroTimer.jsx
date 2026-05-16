import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuPlay, LuPause, LuRotateCcw, LuCoffee, LuTimer } from "react-icons/lu";
import { logTime } from "../api/todoApi";

const MODES = [
  { key: "work",       label: "Focus",      minutes: 25, color: "text-violet-400", ring: "stroke-violet-500" },
  { key: "short",      label: "Short break",minutes: 5,  color: "text-emerald-400",ring: "stroke-emerald-500"},
  { key: "long",       label: "Long break", minutes: 15, color: "text-sky-400",    ring: "stroke-sky-500"    },
];

const SIZE = 120;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function PomodoroTimer({ todo, darkMode, onClose, onTimeLogged }) {
  const [modeIdx,   setModeIdx]   = useState(0);
  const [seconds,   setSeconds]   = useState(MODES[0].minutes * 60);
  const [running,   setRunning]   = useState(false);
  const [sessions,  setSessions]  = useState(0);
  const intervalRef = useRef(null);
  const workedRef   = useRef(0); // seconds worked this session

  const mode = MODES[modeIdx];
  const total = mode.minutes * 60;
  const progress = seconds / total;
  const dashOffset = CIRC * progress;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const saveWorked = useCallback(async () => {
    if (workedRef.current >= 60 && todo) {
      const mins = Math.floor(workedRef.current / 60);
      try {
        const updated = await logTime(todo._id, mins);
        onTimeLogged?.(updated);
      } catch { /* silent */ }
      workedRef.current = 0;
    }
  }, [todo, onTimeLogged]);

  // Tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          // notify
          if (Notification.permission === "granted") {
            new Notification(
              modeIdx === 0 ? "Focus session done! 🎉" : "Break over — back to work 💪",
              { body: todo ? `Task: ${todo.title}` : "", icon: "/favicon.ico" }
            );
          }
          if (modeIdx === 0) {
            setSessions((n) => n + 1);
            saveWorked();
          }
          return 0;
        }
        if (modeIdx === 0) workedRef.current += 1;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx, saveWorked, todo]);

  const switchMode = (idx) => {
    stop();
    saveWorked();
    setModeIdx(idx);
    setSeconds(MODES[idx].minutes * 60);
    workedRef.current = 0;
  };

  const reset = () => {
    stop();
    saveWorked();
    setSeconds(total);
    workedRef.current = 0;
  };

  const toggle = () => setRunning((r) => !r);

  const handleClose = () => {
    stop();
    saveWorked();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={{    opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={`fixed bottom-6 right-6 z-50 w-72 rounded-3xl p-5 shadow-2xl ${
        darkMode ? "card-3d-dark" : "card-3d-light"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LuTimer size={15} className={darkMode ? "text-violet-400" : "text-violet-500"} />
          <span className={`text-sm font-semibold truncate max-w-[160px] ${darkMode ? "text-white" : "text-gray-900"}`}>
            {todo?.title || "Pomodoro"}
          </span>
        </div>
        <button
          onClick={handleClose}
          className={`p-1.5 rounded-lg transition-colors ${darkMode ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
        >
          <LuX size={14} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className={`flex gap-1 p-1 rounded-xl mb-4 ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
        {MODES.map((m, i) => (
          <button
            key={m.key}
            onClick={() => switchMode(i)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              modeIdx === i
                ? darkMode ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm"
                : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            {/* Track */}
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              strokeWidth={STROKE}
            />
            {/* Progress */}
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              className={mode.ring}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - dashOffset}
              style={{ transition: "stroke-dashoffset 0.5s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums ${mode.color}`}>{mm}:{ss}</span>
            {sessions > 0 && (
              <span className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                🍅 ×{sessions}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className={`p-2.5 rounded-xl transition-colors ${darkMode ? "text-gray-500 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          aria-label="Reset"
        >
          <LuRotateCcw size={16} />
        </button>
        <button
          onClick={toggle}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-3d ${
            running
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-violet-500 to-indigo-500"
          }`}
        >
          {running ? <LuPause size={16} /> : <LuPlay size={16} />}
        </button>
        <button
          onClick={() => switchMode(modeIdx === 0 ? 1 : 0)}
          className={`p-2.5 rounded-xl transition-colors ${darkMode ? "text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
          aria-label="Toggle break"
        >
          <LuCoffee size={16} />
        </button>
      </div>

      {/* Logged time */}
      {todo && (todo.loggedMinutes > 0 || todo.estimatedMinutes > 0) && (
        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
          darkMode ? "border-white/[0.07] text-gray-500" : "border-gray-100 text-gray-400"
        }`}>
          <span>Logged: <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{todo.loggedMinutes || 0}m</span></span>
          {todo.estimatedMinutes > 0 && (
            <span>Est: <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{todo.estimatedMinutes}m</span></span>
          )}
        </div>
      )}
    </motion.div>
  );
}
