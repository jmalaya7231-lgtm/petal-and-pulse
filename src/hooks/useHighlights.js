import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../lib/format.js";

const MAX_HIGHLIGHTS = 5000;

function usable(h) {
  if (
    !h ||
    typeof h.id !== "string" ||
    typeof h.docId !== "string" ||
    typeof h.text !== "string" ||
    !Number.isInteger(h.page)
  ) {
    return false;
  }
  if (h.kind === "area") {
    return (
      Array.isArray(h.rects) &&
      h.rects.length > 0 &&
      h.rects.every((r) => r && [r.x, r.y, r.w, r.h].every(Number.isFinite))
    );
  }
  return Number.isInteger(h.start) && Number.isInteger(h.end);
}

export default function useHighlights() {
  const [saved, setSaved] = useLocalStorage("pp:highlights", []);
  const highlights = Array.isArray(saved) ? saved.filter(usable) : [];

  // Returns "" when saved, or a message explaining why it wasn't
  function addHighlight({ docId, docTitle, kind, page, start, end, rects, text, color }) {
    if (highlights.length >= MAX_HIGHLIGHTS) {
      return "You've reached the highlight limit. Remove some to add more.";
    }
    const item = {
      id: makeId(),
      docId,
      docTitle: String(docTitle || "").slice(0, 120),
      kind: kind === "area" ? "area" : "text",
      page,
      start,
      end,
      text,
      color,
      note: "",
      createdAt: new Date().toISOString(),
    };
    if (item.kind === "area") item.rects = rects;
    setSaved([...highlights, item]);
    return "";
  }

  function updateHighlight(id, patch) {
    setSaved(highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }

  function removeHighlight(id) {
    setSaved(highlights.filter((h) => h.id !== id));
  }

  function removeForDoc(docId) {
    setSaved(highlights.filter((h) => h.docId !== docId));
  }

  return { highlights, addHighlight, updateHighlight, removeHighlight, removeForDoc };
}