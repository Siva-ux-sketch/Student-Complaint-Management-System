import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AREAS, CATEGORY_META } from "../utils.js";

const STEPS = [
  {
    title: "Student files",
    text: "Student registers and files a complaint with category, area, and details.",
  },
  {
    title: "Admin review",
    text: "Admin reviews each complaint before it is routed to staff.",
  },
  {
    title: "Route to area",
    text: "Admin sends the complaint to the right person — library, ground, canteen, hostel, and more.",
  },
  {
    title: "Staff resolve",
    text: "Assigned area staff update status, comment, and mark the complaint Resolved or Rejected.",
  },
];

export default function Guidelines() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section className="hero-panel hero-panel-soft">
        <p className="eyebrow">Help center</p>
        <h1>Complaint workflow</h1>
        <p className="muted">
          From student filing to admin review and area staff resolution — one clear campus path.
        </p>
        <div className="hero-actions">
          {user.role === "student" && (
            <Link className="btn btn-primary" to="/file">
              File a complaint
            </Link>
          )}
          <Link className="btn btn-ghost" to="/">
            Back to dashboard
          </Link>
        </div>
      </section>

      <div className="card workflow-diagram-card">
        <h2>End-to-end flow</h2>
        <div className="workflow-diagram" aria-label="Complaint workflow diagram">
          <div className="workflow-node">
            <span className="workflow-num">1</span>
            <strong>Student</strong>
            <p>Files complaint</p>
          </div>
          <span className="workflow-arrow" aria-hidden>
            →
          </span>
          <div className="workflow-node">
            <span className="workflow-num">2</span>
            <strong>Admin</strong>
            <p>Reviews (not trusted yet)</p>
          </div>
          <span className="workflow-arrow" aria-hidden>
            →
          </span>
          <div className="workflow-node">
            <span className="workflow-num">3</span>
            <strong>Area staff</strong>
            <p>Library / Ground / Canteen…</p>
          </div>
          <span className="workflow-arrow" aria-hidden>
            →
          </span>
          <div className="workflow-node">
            <span className="workflow-num">4</span>
            <strong>Resolved</strong>
            <p>Closed with updates</p>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        {STEPS.map((step, i) => (
          <article className="feature-card" key={step.title}>
            <span className="feature-index">{String(i + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p className="muted">{step.text}</p>
          </article>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Area staff desks</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Admin routes each complaint to the matching campus area.
        </p>
        <div className="category-grid">
          {AREAS.map((name) => (
            <div className="category-tile" key={name}>
              <span className="category-icon" aria-hidden>
                {name[0]}
              </span>
              <div>
                <strong>{name} staff</strong>
                <p className="muted">Handles complaints for the {name.toLowerCase()} area</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Categories</h2>
        <div className="category-grid">
          {Object.entries(CATEGORY_META).map(([name, meta]) => (
            <div className="category-tile" key={name}>
              <span className="category-icon" aria-hidden>
                {meta.icon}
              </span>
              <div>
                <strong>{name}</strong>
                <p className="muted">
                  {meta.hint} · suggests {meta.area}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
