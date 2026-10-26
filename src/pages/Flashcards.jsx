import { useState } from "react";
import { Info, Pencil, Trash2, Plus, Play, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";
import FlashcardStudy from "../components/FlashcardStudy.jsx";
import useFlashcards from "../hooks/useFlashcards.js";
import useSubjects from "../hooks/useSubjects.js";

const MAX_FRONT = 500;
const MAX_BACK = 1500;

export default function Flashcards() {
  const { cards, addCard, updateCard, deleteCard, deleteMany, setReviewed, resetReviewed } =
    useFlashcards();
  const { subjects } = useSubjects();

  const [filter, setFilter] = useState("all"); // "all", "none", or a subject name
  const [editingId, setEditingId] = useState(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [studyIds, setStudyIds] = useState(null);

  const visible = cards.filter((c) => {
    if (filter === "all") return true;
    if (filter === "none") return !c.subject;
    return c.subject === filter;
  });
  const notReviewed = visible.filter((c) => !c.reviewed);
  const reviewedVisible = visible.length - notReviewed.length;

  function clearForm() {
    setEditingId(null);
    setFront("");
    setBack("");
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError("Please fill in both the question and the answer.");
      setSaved("");
      return;
    }
    if (editingId) {
      updateCard(editingId, { front, back, subject });
      setSaved("Changes saved.");
    } else {
      addCard({ front, back, subject });
      setSaved("Flashcard added at the end of your list.");
    }
    // Keep the subject selected so she can add several cards quickly
    setEditingId(null);
    setFront("");
    setBack("");
    setError("");
  }

  function startEdit(card) {
    setEditingId(card.id);
    setFront(card.front);
    setBack(card.back);
    setSubject(card.subject);
    setError("");
    setSaved("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(card) {
    if (window.confirm("Delete this flashcard? This can't be undone.")) {
      deleteCard(card.id);
      if (editingId === card.id) clearForm();
    }
  }

  function handleDeleteShown() {
    const n = visible.length;
    const what = n === 1 ? "the 1 flashcard" : `all ${n} flashcards`;
    if (window.confirm(`Delete ${what} currently shown? This can't be undone.`)) {
      deleteMany(visible.map((c) => c.id));
      if (editingId && visible.some((c) => c.id === editingId)) clearForm();
    }
  }

  if (studyIds) {
    return (
      <FlashcardStudy
        ids={studyIds}
        cards={cards}
        onSetReviewed={setReviewed}
        onExit={() => setStudyIds(null)}
      />
    );
  }

  return (
    <div className="stack">
      <div>
        <h1>Flashcards</h1>
        <p className="muted">Write your own cards, then flip through them to practice.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Flashcards are saved <strong>in this browser only</strong>. They don't sync to
          other devices and aren't backed up, and clearing your browser data removes
          them. Nothing is sent anywhere.
        </span>
      </div>

      {/* Create / edit form */}
      <form className="card stack" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit flashcard" : "New flashcard"}</h3>

        <div className="field">
          <label htmlFor="card-front">Question (front)</label>
          <textarea
            id="card-front"
            className="textarea"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            maxLength={MAX_FRONT}
            placeholder="e.g. What is the normal adult resting heart rate?"
          />
        </div>

        <div className="field">
          <label htmlFor="card-back">Answer (back)</label>
          <textarea
            id="card-back"
            className="textarea"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            maxLength={MAX_BACK}
            placeholder="Type the answer from your notes"
          />
        </div>

        <div className="field">
          <label htmlFor="card-subject">Subject</label>
          <select
            id="card-subject"
            className="select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">No subject yet</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {saved && !error && (
          <div className="alert alert-success" role="status">
            <CheckCircle size={18} />
            <span>{saved}</span>
          </div>
        )}

        <div className="row">
          <button className="btn btn-primary" type="submit">
            <Plus size={18} /> {editingId ? "Save changes" : "Add flashcard"}
          </button>
          {editingId && (
            <button className="btn btn-outline" type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Filter and study buttons */}
      <section className="stack">
        <div>
          <h2>Your cards</h2>
          <p className="muted small" style={{ margin: 0 }}>
            Cards are listed, and studied, in the order they were made.
          </p>
        </div>

        <div className="field">
          <label htmlFor="card-filter">Show</label>
          <select
            id="card-filter"
            className="select filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All subjects ({cards.length})</option>
            <option value="none">No subject ({cards.filter((c) => !c.subject).length})</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s} ({cards.filter((c) => c.subject === s).length})
              </option>
            ))}
          </select>
        </div>

        {visible.length > 0 && (
          <div className="row">
            <button
              className="btn btn-primary"
              onClick={() => setStudyIds(visible.map((c) => c.id))}
            >
              <Play size={18} /> Study all ({visible.length})
            </button>
            <button
              className="btn btn-soft"
              onClick={() => setStudyIds(notReviewed.map((c) => c.id))}
              disabled={notReviewed.length === 0}
            >
              Study not yet reviewed ({notReviewed.length})
            </button>
            {reviewedVisible > 0 && (
              <button
                className="btn btn-outline"
                onClick={() => resetReviewed(visible.map((c) => c.id))}
              >
                <RotateCcw size={16} /> Reset reviewed
              </button>
            )}
            <button className="btn btn-outline" onClick={handleDeleteShown}>
              <Trash2 size={16} /> Delete shown ({visible.length})
            </button>
          </div>
        )}

        {visible.length === 0 && (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              {cards.length === 0
                ? "No flashcards yet. Add your first one above."
                : "No flashcards in this subject yet."}
            </p>
          </div>
        )}

        <div className="doc-list">
          {visible.map((c) => (
            <div className="card card-row" key={c.id}>
              <div className="card-row-main">
                <strong className="clamp">{c.front}</strong>
                <span className="muted small clamp">{c.back}</span>
                <div className="doc-meta">
                  {c.subject ? (
                    <span className="badge">{c.subject}</span>
                  ) : (
                    <span className="badge badge-outline">No subject</span>
                  )}
                  {c.reviewed && <span className="badge">Reviewed</span>}
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon"
                onClick={() => startEdit(c)}
                aria-label="Edit flashcard"
              >
                <Pencil size={16} />
              </button>
              <button
                className="btn btn-outline btn-icon"
                onClick={() => handleDelete(c)}
                aria-label="Delete flashcard"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}