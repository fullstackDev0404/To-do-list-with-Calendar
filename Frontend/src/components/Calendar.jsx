import { useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Calendar({ selectedDate, onSelectDate, todoDates = [], darkMode = true }) {
  const today = new Date();
  const [viewYear,        setViewYear]        = useState(selectedDate ? new Date(selectedDate).getFullYear() : today.getFullYear());
  const [viewMonth,       setViewMonth]       = useState(selectedDate ? new Date(selectedDate).getMonth()    : today.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker,  setShowYearPicker]  = useState(false);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const fmt      = (y, m, d) => `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayFmt = fmt(today.getFullYear(), today.getMonth(), today.getDate());
  const years    = Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i);

  const textBase  = darkMode ? "text-gray-200" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-500" : "text-gray-400";
  const divider   = darkMode ? "border-white/[0.06]" : "border-black/[0.05]";
  const btnHover  = darkMode ? "hover:bg-white/[0.08] hover:text-white" : "hover:bg-gray-100 hover:text-gray-900";
  const popupCls  = darkMode ? "card-3d-dark" : "card-3d-light";

  return (
    <div className={`rounded-2xl overflow-visible ${darkMode ? "card-3d-dark" : "card-3d-light"}`}>

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-4 py-3.5 border-b ${divider}`}>
        <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${darkMode ? "text-gray-500" : "text-gray-400"} ${btnHover}`}>
          <LuChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 text-base font-semibold">
          {/* Month picker */}
          <div className="relative">
            <button
              onClick={() => { setShowMonthPicker(v => !v); setShowYearPicker(false); }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${darkMode ? "text-white" : "text-gray-800"} ${btnHover}`}
            >
              {MONTHS[viewMonth]}
            </button>
            {showMonthPicker && (
              <div className={`absolute top-10 left-0 z-40 rounded-2xl p-2 grid grid-cols-3 gap-1 w-48 ${popupCls}`}>
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setViewMonth(i); setShowMonthPicker(false); }}
                    className={`text-sm py-2 rounded-xl transition-colors ${
                      i === viewMonth
                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold shadow-md shadow-sky-500/30"
                        : darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year picker */}
          <div className="relative">
            <button
              onClick={() => { setShowYearPicker(v => !v); setShowMonthPicker(false); }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${darkMode ? "text-white" : "text-gray-800"} ${btnHover}`}
            >
              {viewYear}
            </button>
            {showYearPicker && (
              <div className={`absolute top-10 -left-8 z-40 rounded-2xl p-2 grid grid-cols-4 gap-1 w-56 max-h-52 overflow-y-auto ${popupCls}`}>
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                    className={`text-sm py-2 rounded-xl transition-colors ${
                      y === viewYear
                        ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold shadow-md shadow-sky-500/30"
                        : darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${darkMode ? "text-gray-500" : "text-gray-400"} ${btnHover}`}>
          <LuChevronRight size={16} />
        </button>
      </div>

      {/* ── Day labels ── */}
      <div className="grid grid-cols-7 px-3 pt-3 pb-1">
        {DAYS.map(d => (
          <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider ${textMuted}`}>{d}</div>
        ))}
      </div>

      {/* ── Date cells ── */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds         = fmt(viewYear, viewMonth, day);
          const isSelected = ds === selectedDate;
          const isToday    = ds === todayFmt;
          const hasTodo    = todoDates.includes(ds);

          return (
            <div key={day} className="flex flex-col items-center">
              <button
                onClick={() => onSelectDate(ds)}
                className={`w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center mx-auto transition-all duration-150 ${
                  isSelected
                    ? "bg-gradient-to-br from-sky-500 to-indigo-500 text-white scale-105"
                    : isToday
                    ? darkMode
                      ? "border border-sky-400/50 text-sky-400"
                      : "border border-sky-500 text-sky-600"
                    : `${textBase} ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`
                }`}
                style={isSelected ? {
                  boxShadow: "0 2px 8px rgba(56,189,248,0.40), 0 1px 0 rgba(255,255,255,0.20) inset"
                } : {}}
              >
                {day}
              </button>
              {hasTodo && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-white/60" : "bg-sky-400"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Today shortcut ── */}
      <div className={`px-4 pb-3.5 text-center border-t ${divider}`}>
        <button
          onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); onSelectDate(todayFmt); }}
          className={`text-sm font-semibold mt-2.5 transition-colors ${
            darkMode ? "text-sky-400/60 hover:text-sky-400" : "text-sky-500/70 hover:text-sky-600"
          }`}
        >
          Jump to today
        </button>
      </div>
    </div>
  );
}
