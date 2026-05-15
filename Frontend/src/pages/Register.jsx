import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import { LuUser, LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight } from "react-icons/lu";

export default function Register({ darkMode = true }) {
  const navigate = useNavigate();
  const [username,     setUsername]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength,     setStrength]     = useState(0);
  const [loading,      setLoading]      = useState(false);

  const checkStrength = (pass) => {
    let s = 0;
    if (pass.length > 6)         s++;
    if (/[A-Z]/.test(pass))      s++;
    if (/[0-9]/.test(pass))      s++;
    if (/[!@#$%^&*]/.test(pass)) s++;
    setStrength(s);
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-yellow-300", "bg-emerald-400"][strength];
  const strengthText  = ["", "text-red-400", "text-amber-400", "text-yellow-300", "text-emerald-400"][strength];

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim());

  const handleRegister = async (e) => {
    e.preventDefault();
    const u  = username?.trim();
    const em = email?.trim();
    if (!u)                  { toast.error("Username is required");          return; }
    if (u.length < 2)        { toast.error("Username needs 2+ characters");  return; }
    if (!em)                 { toast.error("Email is required");             return; }
    if (!validateEmail(em))  { toast.error("Enter a valid email");           return; }
    if (!password)           { toast.error("Password is required");          return; }
    if (password.length < 6) { toast.error("Password needs 6+ characters"); return; }

    setLoading(true);
    try {
      await API.post("/auth/register", { username: u, email: em, password });
      toast.success("Account created! 🎉");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Register failed");
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
              Join the club 🎉
            </h1>
            <p className={`text-base mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Takes about 10 seconds, no credit card
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Username */}
            <div>
              <label className={labelCls}>Username</label>
              <div className="relative">
                <LuUser size={16} className={iconCls} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="something cool"
                  className={inputCls}
                />
              </div>
            </div>

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
                  onChange={(e) => { setPassword(e.target.value); checkStrength(e.target.value); }}
                  placeholder="make it a good one"
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

              {/* Strength bar */}
              {password && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? strengthColor : darkMode ? "bg-white/10" : "bg-gray-200"
                        }`}
                        style={i <= strength ? {
                          boxShadow: strength >= 4 ? "0 0 6px rgba(52,211,153,0.5)" : "none"
                        } : {}}
                      />
                    ))}
                  </div>
                  <p className={`text-sm ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
                    Strength: <span className={`font-semibold ${strengthText}`}>{strengthLabel}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 btn-3d disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account…
                </span>
              ) : (
                <>Create account <LuArrowRight size={16} /></>
              )}
            </button>

            <p className={`text-center text-sm pt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Already have one?{" "}
              <Link to="/login" className={`font-semibold transition-colors ${darkMode ? "text-sky-400 hover:text-sky-300" : "text-sky-500 hover:text-sky-600"}`}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
