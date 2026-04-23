import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../api/authService";
import toast from "react-hot-toast";
import { UserPlus, CheckCircle } from "lucide-react";

const ROLES = ["USER", "TECHNICIAN"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    role: "USER",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(300);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // --- PASSWORD VALIDATION LOGIC ---
  const passwordRequirements = [
    { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
    { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
    { label: "One number", test: (pw) => /[0-9]/.test(pw) },
    {
      label: "One special character (@$!%*?)",
      test: (pw) => /[@$!%*?&#]/.test(pw),
    },
  ];

  useEffect(() => {
    let interval;
    if (showOtp && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    // Backend ekata yanna kalin frontend validation ekak karamu
    const allMet = passwordRequirements.every((req) => req.test(form.password));
    if (!allMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register(form);
      toast.success("Registration successful! Please check your email for OTP");
      setShowOtp(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.verifyOtp({ email: form.email, otp });
      toast.success("Email verified successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.error || "OTP verification failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOtp(form.email);
      setTimer(300);
      setOtp("");
      toast.success("New OTP sent to your email.");
    } catch (err) {
      toast.error("Failed to resend OTP.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--left" />
      <div className="auth-glow auth-glow--right" />

      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-brand">
          <span className="auth-brand__logo">🏛️</span>
          <div>
            <h1 className="auth-brand__title text-gradient">SmartCampus</h1>
            <p className="auth-brand__sub">Incident Hub</p>
          </div>
        </div>

        {!showOtp ? (
          <>
            <h2 className="auth-heading">Create your account</h2>
            <p className="auth-sub">Join the campus maintenance system.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={submitRegistration} autoComplete="off">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@campus.edu"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Password *</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  autoComplete="new-password"
                />

                {/* --- LIVE PASSWORD CHECKER UI --- */}
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "8px",
                  }}
                >
                  {passwordRequirements.map((req, i) => {
                    const isMet = req.test(form.password);
                    return (
                      <div
                        key={i}
                        style={{
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: isMet ? "#10b981" : "#94a3b8",
                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            border: isMet ? "none" : "1px solid #475569",
                            background: isMet ? "#10b981" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isMet && <CheckCircle size={10} color="white" />}
                        </div>
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    placeholder="+94 77 123 4567"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    className="form-input"
                    placeholder="Engineering"
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label
                  className="form-label"
                  style={{ marginBottom: "0.75rem", display: "block" }}
                >
                  I am a...
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  {ROLES.map((r) => (
                    <label
                      key={r}
                      style={{
                        cursor: "pointer",
                        padding: "12px",
                        borderRadius: "12px",
                        border: `2px solid ${form.role === r ? "var(--clr-primary, #3b82f6)" : "var(--clr-border, #1e293b)"}`,
                        background:
                          form.role === r
                            ? "rgba(59, 130, 246, 0.1)"
                            : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s ease",
                        color:
                          form.role === r
                            ? "white"
                            : "var(--clr-text-3, #94a3b8)",
                        fontWeight: form.role === r ? "600" : "400",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={form.role === r}
                        onChange={() => set("role", r)}
                        style={{ display: "none" }} // Radio button එක හංගනවා
                      />
                      <span style={{ fontSize: "1.2rem" }}>
                        {r === "USER" ? "👤" : "🔧"}
                      </span>
                      {r === "USER" ? "Student / Staff" : "Technician"}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "1.5rem" }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <UserPlus size={16} /> Create Account
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="otp-view" style={{ textAlign: "center" }}>
            {/* OTP UI Section (Kalin widiyatama thiyanna) */}
            <h2 className="auth-heading">Verify Your Email</h2>
            <p className="auth-sub">
              Enter the code sent to <b>{form.email}</b>
            </p>
            <form onSubmit={submitVerify}>
              <input
                className="form-input"
                style={{
                  fontSize: "2rem",
                  textAlign: "center",
                  letterSpacing: "0.5rem",
                  fontWeight: "bold",
                }}
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <p
                style={{
                  marginTop: "1rem",
                  color: timer === 0 ? "red" : "inherit",
                }}
              >
                {formatTime(timer)}
              </p>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "1rem" }}
                disabled={loading}
              >
                Verify
              </button>
            </form>
            <button
              onClick={handleResend}
              disabled={timer > 0}
              style={{
                background: "none",
                border: "none",
                color: "var(--clr-primary)",
                marginTop: "1rem",
                cursor: "pointer",
              }}
            >
              Resend OTP
            </button>
          </div>
        )}

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
