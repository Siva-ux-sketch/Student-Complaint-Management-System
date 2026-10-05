const STEPS = [
  { key: "Pending", label: "Admin review" },
  { key: "In Progress", label: "Area staff" },
  { key: "Resolved", label: "Resolved" },
];

export default function StatusTimeline({ status }) {
  const rejected = status === "Rejected";
  const withdrawn = status === "Withdrawn";
  const closed = rejected || withdrawn;
  const activeIndex = closed ? -1 : Math.max(
    0,
    STEPS.findIndex((s) => s.key === status)
  );

  return (
    <div className="timeline" aria-label={`Complaint status: ${status}`}>
      {STEPS.map((step, index) => {
        const done = !closed && index <= activeIndex;
        const current = !closed && index === activeIndex;
        return (
          <div
            key={step.key}
            className={`timeline-step${done ? " is-done" : ""}${current ? " is-current" : ""}`}
          >
            <span className="timeline-dot" />
            <span className="timeline-label">{step.label}</span>
          </div>
        );
      })}
      {rejected && (
        <div className="timeline-step is-rejected is-current">
          <span className="timeline-dot" />
          <span className="timeline-label">Rejected</span>
        </div>
      )}
      {withdrawn && (
        <div className="timeline-step is-withdrawn is-current">
          <span className="timeline-dot" />
          <span className="timeline-label">Withdrawn</span>
        </div>
      )}
    </div>
  );
}
