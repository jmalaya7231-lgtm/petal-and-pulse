import useLocalStorage from "./useLocalStorage.js";
import { defaultSubjects } from "../data/subjects.js";

export default function useSubjects() {
  const [custom, setCustom] = useLocalStorage("pp:customSubjects", []);

  const subjects = [...defaultSubjects, ...custom];

  // Returns { ok, message } so the page can show feedback
  function addSubject(rawName) {
    const name = rawName.trim().slice(0, 40);
    if (!name) return { ok: false, message: "Please type a subject name." };

    const exists = subjects.some((s) => s.toLowerCase() === name.toLowerCase());
    if (exists) return { ok: false, message: "That subject already exists." };

    setCustom([...custom, name]);
    return { ok: true, message: `Added "${name}".` };
  }

  return { subjects, addSubject };
}