import { useState } from "react";
import { Heart } from "lucide-react";
import useNotes from "../hooks/useNotes.js";
import { FROM_NAME } from "../data/notes.js";

// Shows one note from a category. Picks a random one when it first appears.
export default function NoteCard({ category, notes, compact = false }) {
  const { notesIn } = useNotes();
  const options = notes ?? notesIn(category);
  const [start] = useState(() => Math.random());
  const [step, setStep] = useState(0);

  if (options.length === 0) return null;

  const index = (Math.floor(start * options.length) + step) % options.length;
  const note = options[index];

  return (
    <aside className={`note-card ${compact ? "compact" : ""}`} aria-label="A little note">
      <Heart className="note-icon" size={18} color="var(--deep-rose)" />
      <div className="note-body">
        <p className="note-text">{note.text}</p>
        {!note.mine && FROM_NAME && <p className="note-from">{FROM_NAME}</p>}
        {!compact && options.length > 1 && (
          <button className="link-btn small" onClick={() => setStep(step + 1)}>
            Show me another
          </button>
        )}
      </div>
    </aside>
  );
}