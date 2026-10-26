import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../lib/format.js";
import { dateKey, daysFromToday } from "../lib/dates.js";

export default function useChecklist() {
  const [items, setItems] = useLocalStorage("pp:checklist", []);
  const today = dateKey();
  const todayItems = items.filter((i) => i.date === today);

  function addItem(text) {
    const clean = text.trim().slice(0, 120);
    if (!clean) return false;
    // Drop items older than 60 days so this list doesn't grow forever
    const kept = items.filter((i) => daysFromToday(i.date) >= -60);
    setItems([
      ...kept,
      { id: makeId(), text: clean, date: today, done: false, doneAt: null },
    ]);
    return true;
  }

  function toggleItem(id) {
    setItems(
      items.map((i) =>
        i.id === id
          ? i.done
            ? { ...i, done: false, doneAt: null }
            : { ...i, done: true, doneAt: new Date().toISOString() }
          : i
      )
    );
  }

  function deleteItem(id) {
    setItems(items.filter((i) => i.id !== id));
  }

   return { items, todayItems, addItem, toggleItem, deleteItem };
}