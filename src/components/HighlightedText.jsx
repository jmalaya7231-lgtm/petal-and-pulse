// Splits a page's text into plain pieces and highlighted pieces
function buildSegments(text, list) {
  const valid = list
    .filter(
      (h) =>
        h.start >= 0 &&
        h.end <= text.length &&
        h.start < h.end &&
        text.slice(h.start, h.end) === h.text
    )
    .sort((a, b) => a.start - b.start);

  const segs = [];
  let pos = 0;
  for (const h of valid) {
    if (h.start < pos) continue;
    if (h.start > pos) segs.push({ start: pos, text: text.slice(pos, h.start) });
    segs.push({ start: h.start, text: h.text, h });
    pos = h.end;
  }
  if (pos < text.length) segs.push({ start: pos, text: text.slice(pos) });
  return segs;
}

// Important: this div must contain ONLY the page's text. Anything extra inside it
// would throw off the highlight positions.
export default function HighlightedText({ text, page, highlights, activeId, onPick }) {
  const segs = buildSegments(text, highlights);

  return (
    <div className="reader-text" data-page-text data-page={page}>
      {segs.map((s) =>
        s.h ? (
          <mark
            key={`h${s.h.id}`}
            data-s={s.start}
            data-hl={s.h.id}
            className={`hl hl-${s.h.color}${s.h.note ? " has-note" : ""}${
              activeId === s.h.id ? " active" : ""
            }`}
            role="button"
            tabIndex={0}
            onClick={() => onPick(s.h.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick(s.h.id);
              }
            }}
          >
            {s.text}
          </mark>
        ) : (
          <span key={`p${s.start}`} data-s={s.start}>
            {s.text}
          </span>
        )
      )}
    </div>
  );
}