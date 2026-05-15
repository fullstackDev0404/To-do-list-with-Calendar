import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import { LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight } from "react-icons/lu";

export default function Login({ darkMode = true }) {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember,     setRemember]     = useState(false);
  const [loading,      setLoading]      = useState(false);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim());

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email?.trim();
    if (!trimmedEmail)               { toast.error("Email is required");     return; }
    if (!validateEmail(trimmedEmail)){ toast.error("Enter a valid email");   return; }
    if (!password)                   { toast.error("Password is required");  return; }

    setLoading(true);
    try {
      const res   = await API.post("/auth/login", { email: trimmedEmail, password });
      const token = res.data.token;
      if (remember) localStorage.setItem("token", token);
      else          sessionStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full pl-11 pr-11 py-3.5 rounded-xl text-base transition-all duration-200 ${
    darkMode ? "text-white placeholder-gray-600 input-3d-dark" : "text-gray-900 placeholder-gray-400 input-3d-light"
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-widest mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`;
  const iconCls  = `absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-gray-400"}`;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-57px)] px-4 py-10">
      <div className="w-full max-w-[420px]">

        <div className={`rounded-3xl p-8 ${darkMode ? "card-3d-dark" : "card-3d-light"}`}>

          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
              Welcome back 👋
            </h1>
            <p className={`text-base mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Sign in to pick up where you left off
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <LuMail size={16} className={iconCls} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <LuLock size={16} className={iconCls} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setRemember(!remember)}
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  remember
                    ? "bg-gradient-to-br from-sky-500 to-indigo-500 border-0 shadow-md shadow-sky-500/30"
                    : darkMode
                    ? "input-3d-dark border border-white/10 group-hover:border-sky-400/40"
                    : "input-3d-light border border-black/10 group-hover:border-sky-400/60"
                }`}
              >
                {remember && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Keep me signed in</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 btn-3d disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>Sign in <LuArrowRight size={16} /></>
              )}
            </button>

            <p className={`text-center text-sm pt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              No account yet?{" "}
              <Link to="/register" className={`font-semibold transition-colors ${darkMode ? "text-sky-400 hover:text-sky-300" : "text-sky-500 hover:text-sky-600"}`}>
                Create one free
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
