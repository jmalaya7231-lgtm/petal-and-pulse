import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../lib/format.js";

export default function useTasks() {
  const [tasks, setTasks] = useLocalStorage("pp:tasks", []);

  function addTask(data) {
    const task = {
      id: makeId(),
      title: data.title.trim(),
      description: data.description.trim(),
      subject: data.subject || "",
      dueDate: data.dueDate || "",
      priority: data.priority,
      type: data.type,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
    };
    setTasks([task, ...tasks]);
  }

  function updateTask(id, data) {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              title: data.title.trim(),
              description: data.description.trim(),
              subject: data.subject || "",
              dueDate: data.dueDate || "",
              priority: data.priority,
              type: data.type,
            }
          : t
      )
    );
  }

  function deleteTask(id) {
    setTasks(tasks.filter((t) => t.id !== id));
  }

  // doneAt records when it was really completed, for the progress page
  function toggleDone(id) {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? t.done
            ? { ...t, done: false, doneAt: null }
            : { ...t, done: true, doneAt: new Date().toISOString() }
          : t
      )
    );
  }

  return { tasks, addTask, updateTask, deleteTask, toggleDone };
}