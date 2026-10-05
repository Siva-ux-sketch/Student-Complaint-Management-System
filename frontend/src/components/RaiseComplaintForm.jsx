import { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { AREAS, suggestArea } from "../utils.js";

const INITIAL = {
  title: "",
  description: "",
  category: "Academic",
  area: "Academic",
  location: "",
};

export default function RaiseComplaintForm({ onCreated, compact = false }) {
  const { push } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, area: suggestArea(prev.category) }));
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "category") next.area = suggestArea(value);
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/complaints", form);
      setForm({ ...INITIAL, area: suggestArea(INITIAL.category) });
      push(`Complaint ${data.complaintId || data.ticketId} submitted for admin review.`);
      onCreated?.(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not file complaint.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={`raise-form${compact ? " raise-form-compact" : ""}`} onSubmit={onSubmit}>
      {!compact && (
        <>
          <h2>Raise a complaint</h2>
          <p className="muted">
            Your complaint goes to admin first. After review it is routed to the right area staff.
          </p>
        </>
      )}
      <div className="raise-grid raise-grid-4">
        <div className="field">
          <label htmlFor="raise-title">Title</label>
          <input
            id="raise-title"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Short summary of the issue"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="raise-category">Category</label>
          <select id="raise-category" name="category" value={form.category} onChange={onChange}>
            <option>Academic</option>
            <option>Hostel</option>
            <option>Facilities</option>
            <option>Transport</option>
            <option>Fees</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="raise-area">Campus area</label>
          <select id="raise-area" name="area" value={form.area} onChange={onChange} required>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="raise-location">Location</label>
          <input
            id="raise-location"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="e.g. Block B, Lab 2"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="raise-description">Description</label>
        <textarea
          id="raise-description"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="What happened, when it started, and who is affected?"
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit for admin review"}
        </button>
      </div>
    </form>
  );
}
