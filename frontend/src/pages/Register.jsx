import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AREAS, passwordChecks, passwordStrengthMessage } from "../utils.js";

export default function Register() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.pathname === "/login" ? "login" : "register");

  useEffect(() => {
    setMode(location.pathname === "/login" ? "login" : "register");
    setError("");
  }, [location.pathname]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    area: "Library",
    studentId: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const checks = useMemo(() => passwordChecks(regForm.password), [regForm.password]);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    navigate(next === "login" ? "/login" : "/register", { replace: true });
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (regForm.password !== regForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const strength = passwordStrengthMessage(regForm.password);
    if (strength) {
      setError(strength);
      return;
    }
    if (regForm.role === "staff" && !regForm.area) {
      setError("Staff must select a campus area.");
      return;
    }
    setBusy(true);
    try {
      await register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        role: regForm.role,
        area: regForm.role === "staff" ? regForm.area : "",
        studentId: regForm.role === "student" ? regForm.studentId : "",
        department: regForm.department,
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-panel">
        <p className="auth-kicker">CampusDesk</p>
        <h1>One place for students, staff, and admin.</h1>
        <p>
          Sign in or create an account as a student, area staff, or admin — then raise, review, and
          resolve campus complaints.
        </p>
        <ul className="auth-points">
          <li>Students file and track their own complaints</li>
          <li>Admin reviews and routes to the right desk</li>
          <li>Staff work on assigned area complaints</li>
        </ul>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-card auth-card-wide">
          <div className="auth-brand">
            <span className="auth-brand-mark">CD</span>
            CampusDesk
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`auth-tab${mode === "login" ? " is-active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              className={`auth-tab${mode === "register" ? " is-active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Create account
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={onLogin}>
              <h2>Welcome back</h2>
              <p className="muted">Student, staff, or admin — use your campus email.</p>
              <div className="field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="field">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister}>
              <h2>Create account</h2>
              <p className="muted">
                Register as many students as you need — each with a unique email. Staff and admin
                can also create accounts here.
              </p>

              <div className="field">
                <label htmlFor="role">Account type</label>
                <select
                  id="role"
                  name="role"
                  value={regForm.role}
                  onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                />
              </div>

              {regForm.role === "student" && (
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="studentId">Student ID</label>
                    <input
                      id="studentId"
                      value={regForm.studentId}
                      onChange={(e) => setRegForm({ ...regForm, studentId: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="department">Department</label>
                    <input
                      id="department"
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {regForm.role === "staff" && (
                <div className="field">
                  <label htmlFor="area">Campus area</label>
                  <select
                    id="area"
                    value={regForm.area}
                    onChange={(e) => setRegForm({ ...regForm, area: e.target.value })}
                    required
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {regForm.role === "admin" && (
                <div className="field">
                  <label htmlFor="department-admin">Office / department</label>
                  <input
                    id="department-admin"
                    value={regForm.department}
                    onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                    placeholder="e.g. Administration"
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                />
                <ul className="password-checklist">
                  <li className={checks.length ? "ok" : ""}>At least 8 characters</li>
                  <li className={checks.upper ? "ok" : ""}>One uppercase letter</li>
                  <li className={checks.lower ? "ok" : ""}>One lowercase letter</li>
                  <li className={checks.digit ? "ok" : ""}>One number</li>
                  <li className={checks.special ? "ok" : ""}>One special character</li>
                </ul>
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              {error && <div className="error">{error}</div>}
              <div className="field">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  {busy ? "Creating…" : `Create ${regForm.role} account`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
