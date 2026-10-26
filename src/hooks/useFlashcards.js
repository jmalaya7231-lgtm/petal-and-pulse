import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../lib/format.js";

const MAX_LOG = 5000;

export default function useFlashcards() {
  const [cards, setCards] = useLocalStorage("pp:flashcards", []);
  // A record of real review events. The progress page uses it.
  const [log, setLog] = useLocalStorage("pp:flashcardLog", []);

  // New cards go at the end, so the list stays in the order they were made
  function addCard({ front, back, subject }) {
    const card = {
      id: makeId(),
      front: front.trim(),
      back: back.trim(),
      subject: subject || "",
      createdAt: new Date().toISOString(),
      reviewed: false,
      reviewCount: 0,
      lastReviewedAt: null,
    };
    setCards([...cards, card]);
  }

  // Saves many cards at once, in the order given. Skips any whose question already exists.
  function addCards(items) {
    const existing = new Set(cards.map((c) => c.front.trim().toLowerCase()));
    const now = new Date().toISOString();
    const fresh = [];

    for (const item of items) {
      const front = item.front.trim();
      const back = item.back.trim();
      const key = front.toLowerCase();
      if (!front || !back || existing.has(key)) continue;
      existing.add(key);
      fresh.push({
        id: makeId(),
        front,
        back,
        subject: item.subject || "",
        createdAt: now,
        reviewed: false,
        reviewCount: 0,
        lastReviewedAt: null,
      });
    }

    if (fresh.length > 0) setCards([...cards, ...fresh]);
    return { added: fresh.length, skipped: items.length - fresh.length };
  }

  function updateCard(id, { front, back, subject }) {
    setCards(
      cards.map((c) =>
        c.id === id
          ? { ...c, front: front.trim(), back: back.trim(), subject: subject || "" }
          : c
      )
    );
  }

  function deleteCard(id) {
    setCards(cards.filter((c) => c.id !== id));
  }

  function deleteMany(ids) {
    const gone = new Set(ids);
    setCards(cards.filter((c) => !gone.has(c.id)));
  }

  function setReviewed(id, value) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.reviewed === value) return;

    const now = new Date().toISOString();
    setCards(
      cards.map((c) => {
        if (c.id !== id) return c;
        return value
          ? { ...c, reviewed: true, reviewCount: c.reviewCount + 1, lastReviewedAt: now }
          : { ...c, reviewed: false };
      })
    );
    if (value) setLog([...log, { at: now, cardId: id }].slice(-MAX_LOG));
  }

  function resetReviewed(ids) {
    const set = new Set(ids);
    setCards(cards.map((c) => (set.has(c.id) ? { ...c, reviewed: false } : c)));
  }

  return {
    cards,
    addCard,
    addCards,
    updateCard,
    deleteCard,
    deleteMany,
    setReviewed,
    resetReviewed,
  };
}