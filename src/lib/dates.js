const pad = (n) => String(n).padStart(2, "0");

// "2026-10-14" in the user's local time zone
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// 0 = today, 1 = tomorrow, -1 = yesterday
export function daysFromToday(key) {
  return Math.round((parseKey(key) - parseKey(dateKey())) / 86400000);
}

export function dueLabel(key) {
  if (!key) return "No due date";
  const n = daysFromToday(key);
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n === -1) return "1 day overdue";
  if (n < 0) return `${-n} days overdue`;
  return `Due in ${n} days`;
}

export function formatKey(key) {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}