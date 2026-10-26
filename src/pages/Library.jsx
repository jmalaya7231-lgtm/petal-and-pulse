import useHighlights from "../hooks/useHighlights.js";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Trash2, Plus, Info, AlertCircle } from "lucide-react";
import UploadBox from "../components/UploadBox.jsx";
import useDocuments from "../hooks/useDocuments.js";
import useSubjects from "../hooks/useSubjects.js";
import { formatBytes, formatDate } from "../lib/format.js";

export default function Library() {
  const { docs, loading, error, add, remove } = useDocuments();
  const { subjects, addSubject } = useSubjects();
    const { removeForDoc } = useHighlights();

  const [filter, setFilter] = useState("all");
  const [newSubject, setNewSubject] = useState("");
  const [subjectMsg, setSubjectMsg] = useState(null);

  const visibleDocs = filter === "all" ? docs : docs.filter((d) => d.subject === filter);

  function handleAddSubject(e) {
    e.preventDefault();
    const result = addSubject(newSubject);
    setSubjectMsg(result);
    if (result.ok) setNewSubject("");
  }

    async function handleDelete(doc) {
    const sure = window.confirm(
      `Remove "${doc.title}" from your library? Its highlights will be removed too. This can't be undone.`
    );
    if (sure) {
      await remove(doc.id);
      removeForDoc(doc.id);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Study Library</h1>
        <p className="muted">Upload your PDF notes and organize them by subject.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Lessons are saved <strong>in this browser only</strong>. They don't sync to
          other devices, aren't encrypted or backed up, and clearing your browser data
          removes them. Only the extracted text is kept, not the original PDF. Your
          files are read on this device and are not uploaded anywhere.
        </span>
      </div>

      <UploadBox subjects={subjects} onAdd={add} />

      {/* Subject filter */}
      <section className="stack">
        <h2>Your lessons</h2>

        <div className="chips" role="group" aria-label="Filter by subject">
          <button
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({docs.length})
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              className={`chip ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s} ({docs.filter((d) => d.subject === s).length})
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && <p className="muted">Loading your library...</p>}

        {!loading && !error && visibleDocs.length === 0 && (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              {docs.length === 0
                ? "Your library is empty. Add your first PDF above."
                : "No lessons in this subject yet."}
            </p>
          </div>
        )}

        <div className="doc-list">
          {visibleDocs.map((d) => (
            <div className="card doc-card" key={d.id}>
              <FileText size={22} color="var(--rose)" />
              <div className="doc-main">
                <Link to={`/library/${d.id}`} className="doc-title">
                  {d.title}
                </Link>
                <div className="doc-meta">
                  {d.subject ? (
                    <span className="badge">{d.subject}</span>
                  ) : (
                    <span className="badge badge-outline">No subject</span>
                  )}
                  <span className="muted small">
                    {d.numPages} {d.numPages === 1 ? "page" : "pages"} · {formatBytes(d.size)} ·{" "}
                    {formatDate(d.addedAt)}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon"
                onClick={() => handleDelete(d)}
                aria-label={`Remove ${d.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Custom subjects */}
      <section className="card stack">
        <h3>Add a custom subject</h3>
        <form className="row" onSubmit={handleAddSubject}>
          <input
            className="input subject-input"
            placeholder="e.g. Mental Health Nursing"
            value={newSubject}
            onChange={(e) => {
              setNewSubject(e.target.value);
              setSubjectMsg(null);
            }}
            maxLength={40}
            aria-label="New subject name"
          />
          <button className="btn btn-soft" type="submit">
            <Plus size={18} /> Add subject
          </button>
        </form>
        {subjectMsg && (
          <p className={`small ${subjectMsg.ok ? "" : "muted"}`} style={{ margin: 0 }}>
            {subjectMsg.message}
          </p>
        )}
      </section>
    </div>
  );
}