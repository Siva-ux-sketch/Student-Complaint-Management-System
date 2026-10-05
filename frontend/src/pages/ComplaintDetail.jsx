import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusTimeline from "../components/StatusTimeline.jsx";
import { AREAS, copyText, formatDateTime, timeAgo } from "../utils.js";

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const [complaint, setComplaint] = useState(null);
  const [staff, setStaff] = useState([]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [routeArea, setRouteArea] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [rating, setRating] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isStudent = user.role === "student";
  const isAdmin = user.role === "admin";
  const isStaff = user.role === "staff";

  const load = async () => {
    const { data } = await api.get(`/complaints/${id}`);
    setComplaint(data);
    setStatus(data.status);
    setRouteArea(data.area || "");
    setAssignedTo(data.assignedTo?._id || "");
  };

  useEffect(() => {
    load().catch((err) => setError(err.response?.data?.message || "Not found."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!isAdmin || !routeArea) {
      setStaff([]);
      return;
    }
    api
      .get("/auth/staff", { params: { area: routeArea } })
      .then((res) => setStaff(res.data))
      .catch(() => setStaff([]));
  }, [isAdmin, routeArea]);

  const assignedToMe =
    complaint?.assignedTo && String(complaint.assignedTo._id) === String(user.id);
  const canManage =
    (isStaff && assignedToMe && complaint && complaint.status === "In Progress") ||
    (isAdmin && complaint && ["In Progress", "Resolved", "Rejected"].includes(complaint.status));
  const canRoute = isAdmin && complaint?.status === "Pending";
  const canWithdraw = isStudent && complaint?.status === "Pending";
  const canRate = isStudent && complaint?.status === "Resolved" && !complaint?.feedback;
  const code = complaint?.complaintId || complaint?.ticketId;

  const routeComplaint = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/complaints/${id}/route`, {
        assignedTo,
        area: routeArea,
      });
      setComplaint(data);
      setStatus(data.status);
      push("Complaint reviewed and routed to area staff.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not route complaint.");
    } finally {
      setBusy(false);
    }
  };

  const rejectComplaint = async () => {
    if (!window.confirm("Reject this complaint after review?")) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.patch(`/complaints/${id}`, {
        status: "Rejected",
        note: "Rejected by admin after review",
      });
      setComplaint(data);
      setStatus(data.status);
      push("Complaint rejected.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reject.");
    } finally {
      setBusy(false);
    }
  };

  const saveUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.patch(`/complaints/${id}`, { status });
      setComplaint(data);
      push("Complaint updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm("Withdraw this pending complaint?")) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/complaints/${id}/withdraw`);
      setComplaint(data);
      setStatus(data.status);
      push("Complaint withdrawn.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not withdraw.");
    } finally {
      setBusy(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/complaints/${id}/comments`, { text: comment });
      setComplaint(data);
      setComment("");
      push("Comment posted.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not add comment.");
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/complaints/${id}/feedback`, {
        rating,
        note: feedbackNote,
      });
      setComplaint(data);
      push("Thanks for your feedback.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save feedback.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    const ok = await copyText(code);
    push(ok ? `Copied ${code}` : "Could not copy complaint ID.");
  };

  if (!complaint && !error) return <div className="page">Loading complaint…</div>;
  if (!complaint) {
    return (
      <div className="page">
        <div className="error">{error}</div>
        <Link className="linkish" to="/">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const history = [...(complaint.statusHistory || [])].reverse();

  return (
    <div className="page print-area">
      <p className="no-print">
        <Link className="linkish" to="/">
          ← Back to dashboard
        </Link>
      </p>

      <div className="hero-row">
        <div>
          {code && (
            <button type="button" className="complaint-id" onClick={copyCode}>
              {code}
            </button>
          )}
          <p className="eyebrow">
            {complaint.category} · {complaint.area || "No area"}
          </p>
          <h1>{complaint.title}</h1>
          <p className="muted">
            Filed by {complaint.student?.name}
            {complaint.student?.studentId ? ` (${complaint.student.studentId})` : ""}
          </p>
        </div>
        <div className="detail-actions no-print">
          <StatusBadge status={complaint.status} />
          <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
            Print summary
          </button>
          {canWithdraw && (
            <button className="btn btn-danger" type="button" onClick={withdraw} disabled={busy}>
              Withdraw complaint
            </button>
          )}
        </div>
      </div>

      <div className="card status-card">
        <div className="status-card-head">
          <h3>Current status</h3>
        </div>
        <StatusTimeline status={complaint.status} />
        <p className="meta status-note">
          {complaint.status === "Pending" &&
            (isStudent
              ? "Your complaint is waiting for admin review. It is not trusted until an admin routes it."
              : "Awaiting admin review before routing to area staff.")}
          {complaint.status === "In Progress" &&
            (isStudent
              ? `Routed to ${complaint.area || "area"} staff${
                  complaint.assignedTo?.name ? ` (${complaint.assignedTo.name})` : ""
                }.`
              : "This complaint is with area staff.")}
          {complaint.status === "Resolved" && "This complaint has been resolved."}
          {complaint.status === "Rejected" && "This complaint was rejected after review."}
          {complaint.status === "Withdrawn" && "Withdrawn by the student before admin review."}
        </p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Details</h3>
          <p className="detail-body">{complaint.description}</p>
          <dl className="meta-list">
            <div>
              <dt>Campus area</dt>
              <dd>{complaint.area || "—"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{complaint.location || "Not specified"}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>
                {complaint.assignedTo?.name
                  ? `${complaint.assignedTo.name}${
                      complaint.assignedTo.area ? ` (${complaint.assignedTo.area})` : ""
                    }`
                  : "Awaiting admin routing"}
              </dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{formatDateTime(complaint.createdAt)}</dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd>{formatDateTime(complaint.updatedAt)}</dd>
            </div>
            <div>
              <dt>Complaint ID</dt>
              <dd>{code || "—"}</dd>
            </div>
          </dl>
        </div>

        {canRoute && (
          <form className="card no-print" onSubmit={routeComplaint}>
            <h3>Admin review & route</h3>
            <p className="muted">
              Review this complaint, then send it to the staff for that campus area.
            </p>
            <div className="field">
              <label htmlFor="routeArea">Area</label>
              <select
                id="routeArea"
                value={routeArea}
                onChange={(e) => {
                  setRouteArea(e.target.value);
                  setAssignedTo("");
                }}
                required
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="assignedTo">Assign area staff</label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              >
                <option value="">Select staff</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} · {s.area}
                  </option>
                ))}
              </select>
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={busy || !assignedTo}>
                {busy ? "Routing…" : "Approve & route"}
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={busy}
                onClick={rejectComplaint}
              >
                Reject
              </button>
            </div>
          </form>
        )}

        {canManage && (
          <form className="card no-print" onSubmit={saveUpdate}>
            <h3>Update status</h3>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}

        <div className="card">
          <h3>Status history</h3>
          {history.length === 0 && <p className="muted">No history recorded yet.</p>}
          <div className="history-list">
            {history.map((item) => (
              <div className="history-item" key={item._id || `${item.status}-${item.createdAt}`}>
                <span className="history-dot" />
                <div>
                  <strong>{item.status}</strong>
                  {item.note && (
                    <p className="muted" style={{ margin: "2px 0" }}>
                      {item.note}
                    </p>
                  )}
                  <p className="meta">
                    {item.changedBy?.name || "System"} · {timeAgo(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canRate && (
        <form className="card feedback-card no-print" onSubmit={submitFeedback}>
          <h3>Rate this resolution</h3>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rating-btn${rating === n ? " is-active" : ""}`}
                onClick={() => setRating(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="feedbackNote">Optional note</label>
            <textarea
              id="feedbackNote"
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Submit feedback
          </button>
        </form>
      )}

      {complaint.feedback && (
        <div className="card feedback-card">
          <h3>Student feedback</h3>
          <p className="rating-display">
            {"★".repeat(complaint.feedback.rating)}
            {"☆".repeat(5 - complaint.feedback.rating)}
          </p>
          {complaint.feedback.note && <p>{complaint.feedback.note}</p>}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Updates & comments</h3>
        {complaint.comments.length === 0 && <p className="muted">No comments yet.</p>}
        {complaint.comments.map((c) => (
          <div className="comment" key={c._id}>
            <div className="comment-head">
              <strong>
                {c.user?.name} <span className="muted">({c.user?.role})</span>
              </strong>
              <span className="meta">{timeAgo(c.createdAt)}</span>
            </div>
            <p style={{ margin: "6px 0 0" }}>{c.text}</p>
          </div>
        ))}

        {(isStudent || assignedToMe || isAdmin) && complaint.status !== "Withdrawn" && (
          <form className="no-print" onSubmit={addComment}>
            <div className="field">
              <label htmlFor="comment">Add a comment</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <button className="btn btn-primary" type="submit">
                Post comment
              </button>
            </div>
          </form>
        )}
      </div>

      {error && <div className="error no-print">{error}</div>}
    </div>
  );
}
