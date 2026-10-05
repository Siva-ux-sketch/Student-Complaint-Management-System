import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import RaiseComplaintForm from "../components/RaiseComplaintForm.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusTimeline from "../components/StatusTimeline.jsx";
import { AREAS, CATEGORY_META, copyText, daysOpen, timeAgo } from "../utils.js";

const PIE_COLORS = ["#b86a12", "#1d6f9f", "#0f766e", "#b42318", "#64748b"];

function complaintCode(c) {
  return c.complaintId || c.ticketId;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { push } = useToast();
  const isStudent = user.role === "student";
  const isStaff = user.role === "staff";
  const isAdmin = user.role === "admin";

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [unassigned, setUnassigned] = useState(false);
  const [showRaise, setShowRaise] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status) params.status = status;
      if (category) params.category = category;
      if (area) params.area = area;
      if (query) params.q = query;
      if (isAdmin && unassigned) params.unassigned = "1";
      const [s, c, a] = await Promise.all([
        api.get("/complaints/stats"),
        api.get("/complaints", { params }),
        api.get("/complaints/activity"),
      ]);
      setStats(s.data);
      setComplaints(c.data);
      setActivity(a.data.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category, area, query, unassigned]);

  const heading = isStudent
    ? "Your complaints"
    : isStaff
      ? `${user.area || "Area"} queue`
      : "Campus complaint center";

  const subtitle = isStudent
    ? "You only see complaints you raised. File a new one for admin review, then track its progress."
    : isStaff
      ? "Work only on complaints the admin has routed to your area."
      : "Review new complaints and route them to library, canteen, ground, and other area staff.";

  const onCreated = (complaint) => {
    setShowRaise(false);
    setComplaints((prev) => [complaint, ...prev]);
    load();
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    const base = [
      { key: "", label: "Total", value: stats.total },
      { key: "Pending", label: "Admin review", value: stats.pending },
      { key: "In Progress", label: "With staff", value: stats.inProgress },
      { key: "Resolved", label: "Resolved", value: stats.resolved },
    ];
    if (isStudent) {
      base.push({ key: "Withdrawn", label: "Withdrawn", value: stats.withdrawn || 0 });
    } else if (isAdmin) {
      base.push({
        key: "__unassigned",
        label: "Needs routing",
        value: stats.unassigned || 0,
      });
    }
    return base;
  }, [stats, isStudent, isAdmin]);

  const pieData = useMemo(
    () => (stats?.byStatus || []).filter((d) => d.value > 0),
    [stats]
  );
  const barData = useMemo(
    () => (stats?.byCategory || []).filter((d) => d.value > 0),
    [stats]
  );

  const onStatClick = (key) => {
    if (key === "__unassigned") {
      setUnassigned((v) => !v);
      setStatus("");
      return;
    }
    setStatus((current) => (current === key ? "" : key));
    setUnassigned(false);
  };

  const copyCode = async (code) => {
    const ok = await copyText(code);
    push(ok ? `Copied ${code}` : "Could not copy complaint ID.");
  };

  const agingOpen = complaints.filter(
    (c) =>
      daysOpen(c.createdAt, c.status) >= 2 &&
      !["Resolved", "Rejected", "Withdrawn"].includes(c.status)
  ).length;

  return (
    <div className="page">
      <section className="hero-panel">
        <p className="eyebrow">{user.role} workspace{user.area ? ` · ${user.area}` : ""}</p>
        <h1>{heading}</h1>
        <p className="muted">{subtitle}</p>
        <div className="hero-actions">
          {isStudent && (
            <>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setShowRaise((v) => !v)}
              >
                {showRaise ? "Close form" : "Raise a complaint"}
              </button>
              <Link className="btn btn-ghost" to="/guidelines">
                Workflow
              </Link>
            </>
          )}
          {isAdmin && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setUnassigned(true);
                setStatus("");
              }}
            >
              Needs routing
            </button>
          )}
          <Link className="btn btn-ghost" to="/activity">
            Activity
          </Link>
        </div>
      </section>

      {agingOpen > 0 && (isStaff || isAdmin) && (
        <div className="notice-banner notice-warn">
          <strong>
            {agingOpen} complaint{agingOpen > 1 ? "s" : ""} open 2+ days
          </strong>
        </div>
      )}

      {isStudent && showRaise && (
        <div className="card raise-card">
          <RaiseComplaintForm onCreated={onCreated} />
        </div>
      )}

      {stats && (
        <div className="stats">
          {statCards.map((item) => {
            const active =
              item.key === "__unassigned" ? unassigned : status === item.key;
            return (
              <button
                key={item.label}
                type="button"
                className={`stat${active ? " is-active" : ""}`}
                onClick={() => onStatClick(item.key)}
              >
                <span className="muted">{item.label}</span>
                <strong>{item.value}</strong>
              </button>
            );
          })}
        </div>
      )}

      {stats && (
        <div className="charts-grid">
          <div className="card chart-card">
            <h3>By status</h3>
            <p className="muted chart-sub">Pie chart of complaint states</p>
            {pieData.length === 0 ? (
              <p className="muted">No data yet.</p>
            ) : (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="card chart-card">
            <h3>By category</h3>
            <p className="muted chart-sub">Bar graph of complaints per category</p>
            <div className="chart-box">
              {barData.length === 0 ? (
                <p className="muted">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d5e0ea" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dash-layout">
        <div className="card list-card">
          <div className="list-header">
            <div>
              <h2>{isStudent ? "Your raised complaints" : "Complaint list"}</h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {isStudent
                  ? "Only complaints you filed appear here."
                  : "Search by title, complaint ID, category, or location."}
              </p>
            </div>
          </div>

          <div className="filters">
            <div className="search-wrap">
              <input
                className="search-input"
                type="search"
                placeholder="Search complaints…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
              <option>Withdrawn</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              <option>Academic</option>
              <option>Hostel</option>
              <option>Facilities</option>
              <option>Transport</option>
              <option>Fees</option>
              <option>Other</option>
            </select>
            {isAdmin && (
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">All areas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            {isAdmin && (
              <label className="check-filter">
                <input
                  type="checkbox"
                  checked={unassigned}
                  onChange={(e) => setUnassigned(e.target.checked)}
                />
                Needs routing
              </label>
            )}
          </div>

          {error && <div className="error">{error}</div>}
          {loading && (
            <div className="complaint-list">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          )}
          {!loading && complaints.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">?</div>
              <h3>No complaints match</h3>
              <p className="muted">
                {isStudent
                  ? "Raise a complaint to send it for admin review."
                  : isStaff
                    ? "No complaints have been routed to your area yet."
                    : "When students file complaints, review and route them here."}
              </p>
            </div>
          )}

          <div className="complaint-list">
            {!loading &&
              complaints.map((c, index) => {
                const openDays = daysOpen(c.createdAt, c.status);
                const cat = CATEGORY_META[c.category];
                const code = complaintCode(c);
                return (
                  <article
                    className="complaint-item"
                    key={c._id}
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <div className="complaint-item-top">
                      <div>
                        {code && (
                          <button
                            type="button"
                            className="complaint-id"
                            onClick={() => copyCode(code)}
                          >
                            {code}
                          </button>
                        )}
                        <Link className="complaint-title" to={`/complaints/${c._id}`}>
                          {c.title}
                        </Link>
                        <div className="chip-row">
                          <span className="chip chip-cat">
                            <span className="chip-icon">{cat?.icon || "•"}</span>
                            {c.category}
                          </span>
                          {c.area && <span className="chip">{c.area}</span>}
                          {openDays >= 2 && (
                            <span className="chip chip-aging">{openDays}d open</span>
                          )}
                          {c.location && <span className="chip">{c.location}</span>}
                          {!isStudent && c.student?.name && (
                            <span className="chip">{c.student.name}</span>
                          )}
                          {(isAdmin || isStaff) && (
                            <span className="chip">
                              {c.assignedTo?.name
                                ? `Assigned: ${c.assignedTo.name}`
                                : "Awaiting admin routing"}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {isStudent && <StatusTimeline status={c.status} />}
                    <div className="complaint-item-foot">
                      <span className="meta">Updated {timeAgo(c.updatedAt)}</span>
                      <Link className="linkish" to={`/complaints/${c._id}`}>
                        {isAdmin && c.status === "Pending" ? "Review & route →" : "View complaint →"}
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>

        <aside className="dash-side">
          <div className="card side-card">
            <h3>Workflow</h3>
            <ol className="tip-list workflow-steps">
              <li>Student files complaint</li>
              <li>Admin reviews (not trusted yet)</li>
              <li>Admin routes to area staff</li>
              <li>Staff resolve and update</li>
            </ol>
            <Link className="linkish" to="/guidelines">
              Full diagram →
            </Link>
          </div>
          <div className="card side-card">
            <div className="side-card-head">
              <h3>Latest activity</h3>
              <Link className="meta linkish" to="/activity">
                View all
              </Link>
            </div>
            {activity.length === 0 && <p className="muted">No recent events.</p>}
            <div className="mini-feed">
              {activity.map((ev) => (
                <Link className="mini-feed-item" key={ev.id} to={`/complaints/${ev.complaintId}`}>
                  <strong>{ev.complaintCode || ev.ticketId}</strong>
                  <span className="muted">
                    {ev.status} · {timeAgo(ev.createdAt)}
                  </span>
                  <span className="mini-feed-title">{ev.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
