import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle, Check } from "lucide-react";

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlashcardStudy({ ids, cards, onSetReviewed, onExit }) {
  const [order, setOrder] = useState(ids);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const byId = new Map(cards.map((c) => [c.id, c]));
  const card = byId.get(order[index]);

  if (!card) {
    return (
      <div className="stack">
        <button className="btn btn-outline" onClick={onExit}>
          <ArrowLeft size={18} /> Back to cards
        </button>
        <div className="card card-soft">
          <p style={{ margin: 0 }}>This card is no longer available.</p>
        </div>
      </div>
    );
  }

  const reviewedCount = order.filter((id) => byId.get(id)?.reviewed).length;
  const percent = Math.round((reviewedCount / order.length) * 100);

  function go(newIndex) {
    setIndex(newIndex);
    setRevealed(false);
  }

  function shuffleCards() {
    setOrder(shuffled(order));
    go(0);
  }

  return (
    <div className="stack">
      <div>
        <button className="btn btn-outline" onClick={onExit}>
          <ArrowLeft size={18} /> Back to cards
        </button>
      </div>

      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="small">
            <strong>
              Card {index + 1} of {order.length}
            </strong>
          </span>
          <span className="muted small">
            {reviewedCount} of {order.length} reviewed
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ marginTop: "var(--space-2)" }}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <button
        className={`flashcard ${revealed ? "revealed" : ""}`}
        onClick={() => setRevealed(!revealed)}
        aria-live="polite"
      >
        {revealed ? (
          <>
            <span className="flash-q">{card.front}</span>
            <span className="flash-label">Answer</span>
            <span className="flash-text">{card.back}</span>
            <span className="muted small">Tap to hide the answer</span>
          </>
        ) : (
          <>
            <span className="flash-label">Question</span>
            <span className="flash-text">{card.front}</span>
            <span className="muted small">Tap to reveal the answer</span>
          </>
        )}
      </button>

      <div className="pager">
        <button
          className="btn btn-outline"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button
          className="btn btn-soft btn-icon"
          onClick={shuffleCards}
          aria-label="Shuffle cards"
        >
          <Shuffle size={18} />
        </button>
        <button
          className="btn btn-outline"
          onClick={() => go(index + 1)}
          disabled={index === order.length - 1}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      <button
        className={`btn ${card.reviewed ? "btn-soft" : "btn-primary"}`}
        onClick={() => onSetReviewed(card.id, !card.reviewed)}
      >
        <Check size={18} /> {card.reviewed ? "Reviewed (tap to undo)" : "Mark as reviewed"}
      </button>

      {index === order.length - 1 && (
        <p className="muted small" style={{ margin: 0, textAlign: "center" }}>
          That's the last card. Nice work. 💗
        </p>
      )}
    </div>
  );
}