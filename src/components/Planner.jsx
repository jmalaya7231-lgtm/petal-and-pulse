import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Info, ListChecks, Bell } from "lucide-react";
import PomodoroTimer from "../components/PomodoroTimer.jsx";
import TaskForm from "../components/TaskForm.jsx";
import useTasks from "../hooks/useTasks.js";
import useChecklist from "../hooks/useChecklist.js";
import useSubjects from "../hooks/useSubjects.js";
import { daysFromToday, dueLabel, formatKey, parseKey } from "../lib/dates.js";
import { sortTasks, todayTasksOf, TYPE_LABEL, PRIORITY_LABEL } from "../lib/planner.js";

function DateTile({ value }) {
  const d = parseKey(value);
  return (
    <div className="date-tile" aria-hidden="true">
      <span>{d.toLocaleDateString(undefined, { month: "short" })}</span>
      <strong>{d.getDate()}</strong>
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const overdue = !task.done && task.dueDate && daysFromToday(task.dueDate) < 0;

  return (
    <div className="card task-row">
      <input
        type="checkbox"
        className="task-check"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
      />
      <div className="task-main">
        <strong className={task.done ? "done-text" : ""}>{task.title}</strong>
        {task.description && (
          <span className="muted small clamp">{task.description}</span>
        )}
        <div className="doc-meta">
          {task.type !== "task" && <span className="badge">{TYPE_LABEL[task.type]}</span>}
          <span className={`badge ${task.priority === "high" ? "badge-strong" : "badge-outline"}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.subject && <span className="badge badge-outline">{task.subject}</span>}
          {task.dueDate && (
            <span className={`small ${overdue ? "due-overdue" : "muted"}`}>
              {formatKey(task.dueDate)}
              {!task.done && ` · ${dueLabel(task.dueDate)}`}
            </span>
          )}
        </div>
      </div>
      <button
        className="btn btn-outline btn-icon"
        onClick={() => onEdit(task)}
        aria-label={`Edit ${task.title}`}
      >
        <Pencil size={16} />
      </button>
      <button
        className="btn btn-outline btn-icon"
        onClick={() => onDelete(task)}
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function Planner() {
  const { tasks, addTask, updateTask, deleteTask, toggleDone } = useTasks();
  const { todayItems, addItem, toggleItem, deleteItem } = useChecklist();
  const { subjects } = useSubjects();

  const [editing, setEditing] = useState(null); // null, "new", or a task
  const [view, setView] = useState("open");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [quickText, setQuickText] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

  function handleSave(data) {
    if (editing === "new") addTask(data);
    else updateTask(editing.id, data);
    setEditing(null);
  }

  function handleDelete(task) {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) deleteTask(task.id);
  }

  function handleQuickAdd(e) {
    e.preventDefault();
    if (addItem(quickText)) setQuickText("");
  }

  // Today's checklist: planner tasks plus quick items
  const dueToday = todayTasksOf(tasks);
  const totalToday = dueToday.length + todayItems.length;
  const doneToday =
    dueToday.filter((t) => t.done).length + todayItems.filter((i) => i.done).length;
  const todayPercent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  // Upcoming quizzes and exams
  const reminders = sortTasks(
    tasks.filter(
      (t) => !t.done && (t.type === "quiz" || t.type === "exam") && t.dueDate && daysFromToday(t.dueDate) >= 0
    )
  );

  // The full task list
  const visible = sortTasks(
    tasks.filter((t) => {
      if (view === "open" && t.done) return false;
      if (view === "done" && !t.done) return false;
      if (subjectFilter === "none") return !t.subject;
      if (subjectFilter !== "all") return t.subject === subjectFilter;
      return true;
    })
  );
  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - openCount;

  return (
    <div className="stack">
      <div>
        <h1>Planner</h1>
        <p className="muted">Plan your tasks, quizzes and exams, and study in focused sessions.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Tasks, checklist items and timer sessions are saved <strong>in this browser only</strong>.
          They don't sync to other devices and aren't backed up, and clearing your browser data
          removes them.
        </span>
      </div>

      <PomodoroTimer subjects={subjects} />

      {/* Today's checklist */}
      <section className="card stack">
        <div className="card-title" style={{ marginBottom: 0 }}>
          <ListChecks size={20} color="var(--rose)" />
          <h3>Today's checklist</h3>
        </div>

        {totalToday > 0 && (
          <div>
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={todayPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-fill" style={{ width: `${todayPercent}%` }} />
            </div>
            <p className="muted small" style={{ margin: "var(--space-2) 0 0" }}>
              {doneToday} of {totalToday} done
            </p>
          </div>
        )}

        {totalToday === 0 && (
          <p className="muted small" style={{ margin: 0 }}>
            Nothing for today yet. Add a quick item below, or give a task today's date.
          </p>
        )}

        <ul className="check-list">
          {dueToday.map((t) => (
            <li className="check-item" key={t.id}>
              <label className="check">
                <input type="checkbox" checked={t.done} onChange={() => toggleDone(t.id)} />
                <span className={t.done ? "done-text" : ""}>{t.title}</span>
              </label>
              <span className={`small ${!t.done && daysFromToday(t.dueDate) < 0 ? "due-overdue" : "muted"}`}>
                {t.done ? "Task" : dueLabel(t.dueDate)}
              </span>
            </li>
          ))}
          {todayItems.map((i) => (
            <li className="check-item" key={i.id}>
              <label className="check">
                <input type="checkbox" checked={i.done} onChange={() => toggleItem(i.id)} />
                <span className={i.done ? "done-text" : ""}>{i.text}</span>
              </label>
              <button
                className="btn btn-outline btn-icon"
                onClick={() => deleteItem(i.id)}
                aria-label={`Remove ${i.text}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <form className="row" onSubmit={handleQuickAdd}>
          <input
            className="input quick-input"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            maxLength={120}
            placeholder="Quick item for today, e.g. Read pages 12 to 20"
            aria-label="New checklist item"
          />
          <button className="btn btn-soft" type="submit">
            <Plus size={18} /> Add
          </button>
        </form>
      </section>

      {/* Upcoming quizzes and exams */}
      <section className="stack">
        <div className="card-title" style={{ marginBottom: 0 }}>
          <Bell size={20} color="var(--rose)" />
          <h2 style={{ margin: 0 }}>Upcoming quizzes and exams</h2>
        </div>
        {reminders.length === 0 ? (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              No quiz or exam reminders. Add a task and set its type to Quiz or Exam.
            </p>
          </div>
        ) : (
          <div className="doc-list">
            {reminders.map((t) => (
              <div className="card card-row" key={t.id}>
                <DateTile value={t.dueDate} />
                <div className="card-row-main">
                  <strong className="clamp">{t.title}</strong>
                  <div className="doc-meta">
                    <span className="badge">{TYPE_LABEL[t.type]}</span>
                    {t.subject && <span className="badge badge-outline">{t.subject}</span>}
                    <span className="muted small">{dueLabel(t.dueDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Tasks</h2>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} /> Add task
          </button>
        </div>

        {editing && (
          <div ref={formRef}>
            <TaskForm
              key={editing === "new" ? "new" : editing.id}
              subjects={subjects}
              initial={editing === "new" ? null : editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        <div className="row">
          {[
            ["open", `Open (${openCount})`],
            ["done", `Completed (${doneCount})`],
            ["all", `All (${tasks.length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`chip ${view === value ? "active" : ""}`}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
          <select
            className="select filter-select"
            style={{ width: "auto", maxWidth: 240 }}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter tasks by subject"
          >
            <option value="all">All subjects</option>
            <option value="none">No subject</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 && (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              {tasks.length === 0
                ? "No tasks yet. Click “Add task” to plan your first one."
                : "Nothing to show here."}
            </p>
          </div>
        )}

        <div className="doc-list">
          {visible.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={toggleDone}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </section>
    </div>
  );
}