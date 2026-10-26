import useLocalStorage from "./useLocalStorage.js";
import { builtInNotes } from "../data/notes.js";
import { makeId } from "../lib/format.js";

export const CATEGORIES = [
  ["quiz", "Before a quiz"],
  ["tired", "On a tiring day"],
  ["break", "Time for a break"],
  ["congrats", "After reaching a goal"],
  ["general", "Just because"],
];

const MAX_NOTES = 200;
const MAX_LENGTH = 400;

export default function useNotes() {
  // Notes added inside the app. These live only in this browser.
  const [mine, setMine] = useLocalStorage("pp:myNotes", []);

  // Built-in messages first, then the ones added in the app
  function notesIn(category) {
    const builtIn = (builtInNotes[category] || []).map((text, i) => ({
      id: `built-in-${category}-${i}`,
      category,
      text,
      mine: false,
    }));
    const added = mine
      .filter((n) => n.category === category)
      .map((n) => ({ ...n, mine: true }));
    return [...builtIn, ...added];
  }

  // Each of these returns an error message, or "" when it worked
  function addNote(category, text) {
    const clean = text.trim().slice(0, MAX_LENGTH);
    if (!clean) return "Please write a message first.";
    if (mine.length >= MAX_NOTES) return "You've reached the limit of saved notes. Delete one to add another.";
    setMine([
      ...mine,
      { id: makeId(), category, text: clean, createdAt: new Date().toISOString() },
    ]);
    return "";
  }

  function updateNote(id, category, text) {
    const clean = text.trim().slice(0, MAX_LENGTH);
    if (!clean) return "Please write a message first.";
    setMine(mine.map((n) => (n.id === id ? { ...n, category, text: clean } : n)));
    return "";
  }

  function deleteNote(id) {
    setMine(mine.filter((n) => n.id !== id));
  }

  return { mine, notesIn, addNote, updateNote, deleteNote };
}