import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Trash2, Copy, Check, Highlighter } from "lucide-react";
import useHighlights from "../hooks/useHighlights.js";
import useDocuments from "../hooks/useDocuments.js";
import useSubjects from "../hooks/useSubjects.js";
import { COLORS, colorLabel } from "../data/highlightColors.js";

export default function Highlights() {
  const { highlights, removeHighlight } = useHighlights();
  const { docs, loading } = useDocuments();
  const { subjects } = useSubjects();

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const byId = new Map(docs.map((d) => [d.id, d]));

  // Add the lesson's current title and subject to each highlight
  const rows = highlights.map((h) => {
    const d = byId.get(h.docId);
    return {
      ...h,
      title: d ? d.title : h.docTitle || "Untitled lesson",
      subject: d ? d.subject : "",
      removed: !loading && !d,
    };
  });

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((h) => {
    if (subjectFilter === "none" && h.subject) return false;
    if (subjectFilter !== "all" && subjectFilter !== "none" && h.subject !== subjectFilter) {
      return false;
    }
    if (colorFilter !== "all" && h.color !== colorFilter) return false;
    if (q) {
      const hay = `${h.text} ${h.note || ""} ${h.title}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // One group per lesson, with the highlights in lesson order
  const groupMap = new Map();
  for (const h of filtered) {
    if (!groupMap.has(h.docId)) {
      groupMap.set(h.docId, {
        docId: h.docId,
        title: h.title,
        subject: h.subject,
        removed: h.removed,
        items: [],
      });
    }
    groupMap.get(h.docId).items.push(h);
  }
  const groups = [...groupMap.values()].sort((a, b) => a.title.localeCompare(b.title));
  groups.forEach((g) => g.items.sort((a, b) => a.page - b.page || a.start - b.start));

  function handleDelete(h) {
    if (window.confirm("Remove this highlight? This can't be undone.")) removeHighlight(h.id);
  }

  async function copyShown() {
    const lines = [];
    groups.forEach((g) => {
      lines.push(g.title + (g.subject ? ` (${g.subject})` : ""));
      g.items.forEach((h) => {
        lines.push(`- ${h.text} (p. ${h.page})${h.note ? ` — Note: ${h.note}` : ""}`);
      });
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setCopied(true);
      setCopyError("");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError("Couldn't copy automatically.");
    }
  }

  const colorCount = (value) => rows.filter((h) => h.color === value).length;

  return (
    <div className="stack">
      <div>
        <h1>Highlights</h1>
        <p className="muted">Everything you've marked as important, in lesson order.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Highlights are saved <strong>in this browser only</strong>. They don't sync to other
          devices and aren't backed up, so use the Backup page to keep a copy. They're your own
          words from your lessons, so they're only as accurate as your notes.
        </span>
      </div>

      {highlights.length === 0 ? (
        <div className="card card-soft stack">
          <div className="card-title" style={{ marginBottom: 0 }}>
            <Highlighter size={20} color="var(--rose)" />
            <h3>No highlights yet</h3>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Open a lesson in the Study Library, select some text and choose a color. It will show
            up here.
          </p>
          <div>
            <Link to="/library" className="btn btn-soft">
              Open library
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="card stack">
            <div className="field">
              <label htmlFor="hl-search">Search your highlights and notes</label>
              <input
                id="hl-search"
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a word"
              />
            </div>

            <div className="chips" role="group" aria-label="Filter by color">
              <button
                className={`chip ${colorFilter === "all" ? "active" : ""}`}
                onClick={() => setColorFilter("all")}
              >
                All colors ({rows.length})
              </button>
              {COLORS.map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${colorFilter === value ? "active" : ""}`}
                  onClick={() => setColorFilter(value)}
                >
                  <span className={`hl-dot hl-${value}`} /> {label} ({colorCount(value)})
                </button>
              ))}
            </div>

            <div className="field">
              <label htmlFor="hl-subject">Subject</label>
              <select
                id="hl-subject"
                className="select filter-select"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All subjects</option>
                <option value="none">No subject</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length > 0 && (
              <div className="row">
                <button className="btn btn-soft" onClick={copyShown}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                  {copied ? "Copied" : `Copy shown (${filtered.length})`}
                </button>
                {copyError && <span className="muted small">{copyError}</span>}
              </div>
            )}
          </section>

          {filtered.length === 0 && (
            <div className="card card-soft">
              <p className="muted" style={{ margin: 0 }}>
                Nothing matches those filters.
              </p>
            </div>
          )}

          {groups.map((g) => (
            <section className="stack" key={g.docId}>
              <div>
                <h2 style={{ margin: 0 }}>{g.title}</h2>
                <div className="doc-meta">
                  {g.subject && <span className="badge">{g.subject}</span>}
                  {g.removed && <span className="badge badge-outline">Lesson removed</span>}
                  <span className="muted small">
                    {g.items.length} {g.items.length === 1 ? "highlight" : "highlights"}
                  </span>
                </div>
              </div>

              <div className="doc-list">
                {g.items.map((h) => (
                  <div className={`card hl-item hl-stripe-${h.color}`} key={h.id}>
                    <div className="hl-item-main">
                      <span className="hl-item-text">{h.text}</span>
                      {h.note && <span className="small hl-item-note">Note: {h.note}</span>}
                      <div className="doc-meta">
                        <span className="badge">{colorLabel[h.color] || "Highlight"}</span>
                        <span className="muted small">Page {h.page}</span>
                        {!g.removed && (
                          <Link
                            className="small"
                            to={`/library/${h.docId}?page=${h.page}&hl=${h.id}`}
                          >
                            Open in lesson
                          </Link>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-outline btn-icon"
                      onClick={() => handleDelete(h)}
                      aria-label="Remove highlight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}