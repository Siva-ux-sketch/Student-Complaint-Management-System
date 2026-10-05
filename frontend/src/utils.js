export const AREAS = [
  "Library",
  "Ground",
  "Canteen",
  "Hostel",
  "Academic",
  "Transport",
  "Facilities",
];

export const CATEGORY_META = {
  Academic: { icon: "A", hint: "Classes, faculty, exams, marks", area: "Academic" },
  Hostel: { icon: "H", hint: "Rooms, mess, wardens, Wi‑Fi", area: "Hostel" },
  Facilities: { icon: "F", hint: "Labs, classrooms, campus amenities", area: "Facilities" },
  Transport: { icon: "T", hint: "Bus routes, timing, passes", area: "Transport" },
  Fees: { icon: "₹", hint: "Payments, receipts, scholarships", area: "Academic" },
  Other: { icon: "•", hint: "Anything else campus-related", area: "Facilities" },
};

export function passwordChecks(password = "") {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password = "") {
  const c = passwordChecks(password);
  return c.length && c.upper && c.lower && c.digit && c.special;
}

export function passwordStrengthMessage(password = "") {
  if (!password) return "Password is required.";
  if (!isStrongPassword(password)) {
    return "Password needs 8+ chars with upper, lower, number, and special character.";
  }
  return "";
}

export function timeAgo(value) {
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function daysOpen(createdAt, status) {
  if (["Resolved", "Rejected", "Withdrawn"].includes(status)) return 0;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function suggestArea(category) {
  return CATEGORY_META[category]?.area || "Facilities";
}
