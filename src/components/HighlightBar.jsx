import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Layers, AlertCircle, CheckCircle } from "lucide-react";
import { COLORS } from "../data/highlightColors.js";

const preview = (t) => (t.length > 120 ? `${t.slice(0, 120)}…` : t);

function ColorButtons({ onPick, current }) {
  return (
    <div className="chips" role="group" aria-label="Highlight color">
      {COLORS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="hl-pick"
          aria-pressed={current === value}
          onClick={() => onPick(value)}
        >
          <span className={`hl-dot hl-${value}`} /> {label}
        </button>
      ))}
    </div>
  );
}

export default function HighlightBar({
  pending,
  active,
  onHighlight,
  onRecolor,
  onSaveNote,
  onRemove,
  onMakeCard,
  onClose,
}) {
  const [note, setNote] = useState("");
  const [cardOpen, setCardOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [msg, setMsg] = useState(null);
  const activeId = active ? active.id : null;

  // Start fresh each time a different highlight is opened
  useEffect(() => {
    setNote(active ? active.note || "" : "");
    setBack(active ? active.text.slice(0, 1500) : "");
    setFront("");
    setCardOpen(false);
    setMsg(null);
  }, [activeId]);

  function saveNote() {
    onSaveNote(note);
    setMsg({ ok: true, text: "Note saved." });
  }

  function saveCard() {
    if (!front.trim() || !back.trim()) {
      setMsg({ ok: false, text: "Fill in both the question and the answer." });
      return;
    }
    const result = onMakeCard(front.trim(), back.trim());
    setMsg(result);
    if (result.ok) {
      setCardOpen(false);
      setFront("");
    }
  }

  /* ---------- A selection waiting to be highlighted ---------- */
  if (pending && pending.error) {
    return (
      <div className="hl-bar" role="alert">
        <div className="hl-bar-inner">
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{pending.error}</span>
          </div>
          <div>
            <button className="btn btn-outline" onClick={onClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="hl-bar" role="region" aria-label="Highlight the selected text">
        <div className="hl-bar-inner">
          <div className="hl-bar-head">
            <strong className="small">Highlight this text</strong>
            <button className="btn btn-outline btn-icon" onClick={onClose} aria-label="Cancel">
              <X size={16} />
            </button>
          </div>
          <p className="hl-quote">{preview(pending.text)}</p>
          <ColorButtons onPick={onHighlight} />
        </div>
      </div>
    );
  }

  /* ---------- A highlight she tapped ---------- */
  if (active) {
    return (
      <div className="hl-bar" role="region" aria-label="Edit highlight">
        <div className="hl-bar-inner">
          <div className="hl-bar-head">
            <strong className="small">Highlight on page {active.page}</strong>
            <button className="btn btn-outline btn-icon" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <p className="hl-quote">{preview(active.text)}</p>

          <ColorButtons onPick={onRecolor} current={active.color} />

          <div className="field">
            <label htmlFor="hl-note">Your note (optional)</label>
            <textarea
              id="hl-note"
              className="textarea"
              style={{ minHeight: 64 }}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setMsg(null);
              }}
              maxLength={500}
              placeholder="e.g. Ask the instructor, likely exam question"
            />
          </div>

          <div className="row">
            <button className="btn btn-primary" onClick={saveNote}>
              Save note
            </button>
            <button className="btn btn-soft" onClick={() => setCardOpen(!cardOpen)}>
              <Layers size={16} /> Make flashcard
            </button>
            <button className="btn btn-outline" onClick={onRemove}>
              <Trash2 size={16} /> Remove
            </button>
          </div>

          {cardOpen && (
            <div className="stack">
              <div className="field">
                <label htmlFor="hl-front">Question (front)</label>
                <textarea
                  id="hl-front"
                  className="textarea"
                  style={{ minHeight: 64 }}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  maxLength={500}
                  placeholder="Write a question that this highlight answers"
                />
              </div>
              <div className="field">
                <label htmlFor="hl-back">Answer (back). Your highlighted words</label>
                <textarea
                  id="hl-back"
                  className="textarea"
                  style={{ minHeight: 64 }}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  maxLength={1500}
                />
              </div>
              <div>
                <button className="btn btn-primary" onClick={saveCard}>
                  Save flashcard
                </button>
              </div>
            </div>
          )}

          {msg && (
            <div
              className={`alert ${msg.ok ? "alert-success" : "alert-error"}`}
              role={msg.ok ? "status" : "alert"}
            >
              {msg.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>
                {msg.text}
                {msg.ok && msg.text.startsWith("Flashcard") && (
                  <>
                    {" "}
                    <Link to="/flashcards">Open flashcards</Link>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}