import { useState, useEffect } from "react";
import { useNavigate, BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LuSun, LuMoon, LuLogOut, LuSquareCheck } from "react-icons/lu";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  const isLoggedIn = () =>
    !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    if (isLoggedIn()) navigate("/dashboard");
  }, [navigate]);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div
        className="min-h-screen relative overflow-x-hidden transition-colors duration-500"
        style={{
          background: darkMode
            ? "#000000"
            : "linear-gradient(160deg, #eef2ff 0%, #f5f7ff 50%, #eff6ff 100%)",
        }}
      >
        {/* Ambient depth blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px]"
            style={{ background: darkMode
              ? "radial-gradient(circle, rgba(180,120,80,0.06), transparent 65%)"
              : "radial-gradient(circle, rgba(99,102,241,0.08), transparent 65%)"
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: darkMode
              ? "radial-gradient(circle, rgba(120,80,60,0.05), transparent 65%)"
              : "radial-gradient(circle, rgba(56,189,248,0.07), transparent 65%)"
            }}
          />
          {/* Floor shadow — gives sense of ground plane */}
          {darkMode && (
            <div
              className="absolute bottom-0 left-0 right-0 h-32"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }}
            />
          )}
        </div>

        {/* ── HEADER ── */}
        <header className={`relative z-20 flex justify-between items-center px-5 md:px-8 py-3.5 ${
          darkMode ? "header-3d-dark" : "header-3d-light"
        }`}>
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-500 flex items-center justify-center logo-badge">
              <LuSquareCheck size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <span className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
              TodoPro
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {isLoggedIn() && (
              <button
                onClick={handleLogout}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  darkMode
                    ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.05]"
                }`}
              >
                <LuLogOut size={13} />
                Log out
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                darkMode
                  ? "text-amber-300 hover:bg-white/[0.08]"
                  : "text-indigo-500 hover:bg-black/[0.05]"
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <LuSun size={15} /> : <LuMoon size={15} />}
            </button>
          </div>
        </header>

        {/* ── ROUTES ── */}
        <Routes>
          <Route path="/"          element={<Login    darkMode={darkMode} />} />
          <Route path="/login"     element={<Login    darkMode={darkMode} />} />
          <Route path="/register"  element={<Register darkMode={darkMode} />} />
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
        </Routes>
      </div>

      <ToastContainer
        position="bottom-right"
        transition={Slide}
        autoClose={2500}
        hideProgressBar
        closeButton={false}
        toastClassName={() =>
          `flex items-center gap-2.5 px-4 py-3 mb-2 rounded-xl text-sm font-medium cursor-pointer select-none ${
            darkMode
              ? "bg-[#1c1a18] text-gray-100 border border-white/[0.08] shadow-2xl shadow-black/50"
              : "bg-white text-gray-800 border border-black/[0.06] shadow-xl shadow-black/10"
          }`
        }
      />
    </div>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
