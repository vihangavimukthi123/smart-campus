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

  const passwordRequirements = [
    { label: "8+ characters", test: (pw) => pw.length >= 8 },
    { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
    { label: "Number", test: (pw) => /[0-9]/.test(pw) },
    { label: "Special char (@$!%*?)", test: (pw) => /[@$!%*?&#]/.test(pw) },
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
    const allMet = passwordRequirements.every((req) => req.test(form.password));
    if (!allMet) {
      toast.error("Please meet all password requirements");
      return;
    }
    if (form.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await register(form);
      toast.success("Registration successful! Check your email for OTP.");
      setShowOtp(true);
    } catch (err) {
      const msg =
        err.response?.data?.phone ||
        err.response?.data?.message ||
        "Registration failed";
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
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "OTP verification failed");
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
    } catch {
      toast.error("Failed to resend OTP.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--left" />
      <div className="auth-glow auth-glow--right" />

      <div className="auth-card" style={{ maxWidth: 520 }}>
        {/* Brand header */}
        <div className="auth-brand">
          <img src="/matrix-logo.png" alt="Matrix Corp Logo" className="auth-brand__logo" />
          <div>
            <h1 className="auth-brand__title">Matrix Corp</h1>
            <p className="auth-brand__sub">Incident Hub</p>
          </div>
        </div>

        {!showOtp ? (
          <>
            <h2 className="auth-heading">Create your account</h2>
            <p className="auth-sub">Join the campus maintenance system.</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={submitRegistration} autoComplete="off">
              {/* Name + Email */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">
                    Full Name{" "}
                    <span style={{ color: "var(--clr-error)" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email <span style={{ color: "var(--clr-error)" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@campus.edu"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password + strength checklist */}
              <div className="form-group">
                <label className="form-label">
                  Password <span style={{ color: "var(--clr-error)" }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                />
                <div className="pw-requirements">
                  {passwordRequirements.map((req, i) => {
                    const met = req.test(form.password);
                    return (
                      <div
                        key={i}
                        className={`pw-req${met ? " pw-req--met" : ""}`}
                      >
                        <div className="pw-req__dot">
                          {met && <CheckCircle size={9} color="white" />}
                        </div>
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phone + Department */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">
                    Phone (10 digits){" "}
                    <span style={{ color: "var(--clr-error)" }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="0712345678"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      set("phone", e.target.value.replace(/\D/g, ""))
                    }
                    required
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

              {/* Role selector */}
              <div className="form-group">
                <label className="form-label">I am a…</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {ROLES.map((r) => (
                    <label
                      key={r}
                      className={`role-option${form.role === r ? " role-option--active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={form.role === r}
                        onChange={() => set("role", r)}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: "1.15rem" }}>
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
                style={{ width: "100%", marginTop: "0.25rem" }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    <UserPlus size={16} /> Create Account
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                margin: "20px 0",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              ></div>
              <span
                style={{
                  margin: "0 10px",
                  color: "var(--clr-text-3)",
                  fontSize: "13px",
                }}
              >
                OR
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              ></div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={() =>
                (window.location.href =
                  "http://localhost:8080/api/oauth2/authorization/google")
              }
              className="btn"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                backgroundColor: "#fff",
                color: "#1f2937",
                border: "none",
                fontWeight: "500",
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="G"
                width="18"
              />
              Register with Google
            </button>
          </>
        ) : (
          /* OTP verification view */
          <div className="otp-view">
            <span className="otp-icon">📧</span>
            <h2 className="auth-heading">Verify Your Email</h2>
            <p className="auth-sub">
              Enter the 6-digit code sent to{" "}
              <strong style={{ color: "var(--clr-text)" }}>{form.email}</strong>
            </p>

            <form onSubmit={submitVerify}>
              <input
                className="form-input otp-input"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
              />
              <p
                className={`otp-timer${timer === 0 ? " otp-timer--expired" : " otp-timer--active"}`}
              >
                {timer > 0
                  ? `Expires in ${formatTime(timer)}`
                  : "Code expired — request a new one"}
              </p>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "1.25rem" }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>

            <button
              onClick={handleResend}
              disabled={timer > 0}
              style={{
                background: "none",
                border: "none",
                marginTop: "1rem",
                cursor: timer > 0 ? "not-allowed" : "pointer",
                color: timer > 0 ? "var(--clr-text-3)" : "#818cf8",
                fontSize: "0.875rem",
                fontWeight: 500,
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
