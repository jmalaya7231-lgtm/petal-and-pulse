import { useState } from "react";

// Works like useState, but remembers the value in this browser.
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function setAndSave(newValue) {
    setValue(newValue);
    try {
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // Storage can be blocked (e.g. private mode). The app still works.
    }
  }

  return [value, setAndSave];
}