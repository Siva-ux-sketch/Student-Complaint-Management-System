import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import StatusBadge from "../components/StatusBadge.jsx";
import { timeAgo } from "../utils.js";

export default function Activity() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/complaints/activity")
      .then((res) => setEvents(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load activity."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="hero-row">
        <div>
          <p className="eyebrow">Live trail</p>
          <h1>Recent activity</h1>
          <p className="muted">Status changes and comments across the complaints you can see.</p>
        </div>
        <Link className="btn btn-ghost" to="/">
          Dashboard
        </Link>
      </div>

      <div className="card">
        {error && <div className="error">{error}</div>}
        {loading && (
          <div className="complaint-list">
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        )}
        {!loading && events.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">…</div>
            <h3>No activity yet</h3>
            <p className="muted">Raise or claim a complaint to start the trail.</p>
          </div>
        )}
        <div className="activity-feed">
          {events.map((ev) => (
            <article className="activity-item" key={ev.id}>
              <div className="activity-rail" />
              <div className="activity-body">
                <div className="activity-top">
                  <div>
                    <span className="complaint-id">{ev.complaintCode || ev.ticketId}</span>
                    <Link className="complaint-title" to={`/complaints/${ev.complaintId}`}>
                      {ev.title}
                    </Link>
                  </div>
                  {ev.status === "Comment" ? (
                    <span className="badge Comment">Comment</span>
                  ) : (
                    <StatusBadge status={ev.status} />
                  )}
                </div>
                <p className="activity-note">{ev.note}</p>
                <p className="meta">
                  {ev.by} · {timeAgo(ev.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
