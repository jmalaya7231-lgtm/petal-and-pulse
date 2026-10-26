import { daysFromToday } from "./dates.js";

export const TYPE_LABEL = { task: "Task", quiz: "Quiz", exam: "Exam" };
export const PRIORITY_LABEL = { high: "High priority", medium: "Medium", low: "Low" };

const RANK = { high: 0, medium: 1, low: 2 };

// Earliest due date first, tasks with no date last, then by priority
export function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return RANK[a.priority] - RANK[b.priority];
  });
}

// Tasks due today (done or not) plus overdue tasks that are still open
export function todayTasksOf(tasks) {
  return sortTasks(
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const n = daysFromToday(t.dueDate);
      return n === 0 || (n < 0 && !t.done);
    })
  );
}