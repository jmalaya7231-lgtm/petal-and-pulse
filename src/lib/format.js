export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// crypto.randomUUID() only works on secure (https/localhost) pages,
// so we use a simple id that also works when testing on your phone over Wi-Fi.
export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}