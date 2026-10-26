import { useState } from "react";
import { Info, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import NoteCard from "../components/NoteCard.jsx";
import useNotes, { CATEGORIES } from "../hooks/useNotes.js";

const labelOf = Object.fromEntries(CATEGORIES);

export default function Notes() {
  const { mine, notesIn, addNote, updateNote, deleteNote } = useNotes();

  const [category, setCategory] = useState("general");
  const [formCategory, setFormCategory] = useState("general");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function resetForm() {
    setEditingId(null);
    setText("");
    setError("");
  }

  function submit(e) {
    e.preventDefault();
    const problem = editingId
      ? updateNote(editingId, formCategory, text)
      : addNote(formCategory, text);
    if (problem) {
      setError(problem);
      return;
    }
    resetForm();
  }

  function startEdit(note) {
    setEditingId(note.id);
    setFormCategory(note.category);
    setText(note.text);
    setError("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function handleDelete(note) {
    if (window.confirm("Delete this note? This can't be undone.")) {
      deleteNote(note.id);
      if (editingId === note.id) resetForm();
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>A Little Note for You</h1>
        <p className="muted">Small messages for the days you need them.</p>
      </div>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>What do you need today?</h3>
        <div className="chips" role="group" aria-label="Choose a kind of note">
          {CATEGORIES.map(([value, label]) => (
            <button
              key={value}
              className={`chip ${category === value ? "active" : ""}`}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <NoteCard key={category} category={category} notes={notesIn(category)} />
      </section>

      <section className="stack">
        <h2>Your own notes</h2>

        <div className="alert">
          <Info size={18} color="var(--deep-rose)" />
          <span>
            Notes you add here are saved <strong>in this browser only</strong>. They don't sync
            to other devices and aren't backed up, and clearing your browser data removes them.
            They can also show up as surprises in the other notes above.
          </span>
        </div>

        <form className="card stack" onSubmit={submit}>
          <h3 style={{ margin: 0 }}>{editingId ? "Edit note" : "Add a note"}</h3>

          <div className="field">
            <label htmlFor="note-category">When should it appear?</label>
            <select
              id="note-category"
              className="select"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="note-text">Message</label>
            <textarea
              id="note-text"
              className="textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              maxLength={400}
              placeholder="Write something kind to yourself"
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="row">
            <button className="btn btn-primary" type="submit">
              <Plus size={18} /> {editingId ? "Save changes" : "Add note"}
            </button>
            {editingId && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {mine.length === 0 ? (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              You haven't added any notes yet.
            </p>
          </div>
        ) : (
          <div className="doc-list">
            {[...mine].reverse().map((n) => (
              <div className="card card-row" key={n.id}>
                <div className="card-row-main">
                  <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {n.text}
                  </span>
                  <div className="doc-meta">
                    <span className="badge">{labelOf[n.category]}</span>
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-icon"
                  onClick={() => startEdit(n)}
                  aria-label="Edit note"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="btn btn-outline btn-icon"
                  onClick={() => handleDelete(n)}
                  aria-label="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}