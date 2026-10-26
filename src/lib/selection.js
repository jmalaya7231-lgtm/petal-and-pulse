export const MAX_HIGHLIGHT_CHARS = 1000;

// Counts how many characters come before a point inside the page text
export function offsetIn(root, container, offset) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);
  return range.toString().length;
}

// TEXT VIEW. Returns null (nothing to do), { error }, or { page, start, end, text }
export function readSelection(pages, articleEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !articleEl) return null;

  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  if (!articleEl.contains(node)) return null;

  const el = node.nodeType === 3 ? node.parentElement : node;
  const root = el && el.closest ? el.closest("[data-page-text]") : null;
  if (!root) return { error: "Select text within a single page." };

  const page = Number(root.dataset.page);
  const full = pages[page - 1];
  if (typeof full !== "string") return null;

  let start = offsetIn(root, range.startContainer, range.startOffset);
  let end = offsetIn(root, range.endContainer, range.endOffset);

  // Don't include spaces or line breaks at the edges
  while (start < end && /\s/.test(full[start])) start++;
  while (end > start && /\s/.test(full[end - 1])) end--;

  if (end - start < 2) return null;
  if (end - start > MAX_HIGHLIGHT_CHARS) {
    return {
      error: `That's a long selection. Highlights can be up to ${MAX_HIGHLIGHT_CHARS.toLocaleString()} characters.`,
    };
  }

  return { page, start, end, text: full.slice(start, end) };
}

const round = (n) => Math.round(n * 10000) / 10000;

// Keeps the real line boxes and drops duplicates and oversized container boxes
function tidyRects(rects) {
  const kept = rects.filter(
    (r) =>
      r.w > 0.003 &&
      r.h > 0.003 &&
      r.h < 0.08 &&
      r.x > -0.01 &&
      r.y > -0.01 &&
      r.x + r.w < 1.02 &&
      r.y + r.h < 1.02
  );
  const inside = (a, b) =>
    a.x >= b.x - 0.002 &&
    a.y >= b.y - 0.002 &&
    a.x + a.w <= b.x + b.w + 0.002 &&
    a.y + a.h <= b.y + b.h + 0.002;

  return kept
    .filter((a, i) => !kept.some((b, j) => j !== i && inside(a, b) && (!inside(b, a) || j < i)))
    .slice(0, 200)
    .map((r) => ({ x: round(r.x), y: round(r.y), w: round(r.w), h: round(r.h) }));
}

// ORIGINAL PDF VIEW. Returns null, { error }, or { kind: "area", page, rects, text }
export function readAreaSelection(articleEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !articleEl) return null;

  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  if (!articleEl.contains(node)) return null;

  const el = node.nodeType === 3 ? node.parentElement : node;
  const pageEl = el && el.closest ? el.closest("[data-pdf-page]") : null;
  if (!pageEl) return { error: "Select text within a single page." };

  const box = pageEl.getBoundingClientRect();
  if (!box.width || !box.height) return null;

  const text = sel.toString().replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;
  if (text.length > MAX_HIGHLIGHT_CHARS) {
    return {
      error: `That's a long selection. Highlights can be up to ${MAX_HIGHLIGHT_CHARS.toLocaleString()} characters.`,
    };
  }

  const rects = tidyRects(
    Array.from(range.getClientRects()).map((r) => ({
      x: (r.left - box.left) / box.width,
      y: (r.top - box.top) / box.height,
      w: r.width / box.width,
      h: r.height / box.height,
    }))
  );
  if (rects.length === 0) {
    return { error: "Couldn't mark that selection. Try selecting a smaller piece of text." };
  }

  return { kind: "area", page: Number(pageEl.dataset.pdfPage), rects, text };
}