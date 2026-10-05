export function statusClass(status) {
  return (status || "").replace(/\s+/g, "-");
}

export default function StatusBadge({ status }) {
  return <span className={`badge ${statusClass(status)}`}>{status}</span>;
}
