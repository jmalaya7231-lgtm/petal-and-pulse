import NoteCard from "../components/NoteCard.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Check,
  ListChecks,
  CalendarCheck,
  FileText,
  TrendingUp,
  BookOpen,
  Heart,
  ArrowRight,
} from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage.js";
import useDocuments from "../hooks/useDocuments.js";
import useTasks from "../hooks/useTasks.js";
import useChecklist from "../hooks/useChecklist.js";
import { dueLabel, daysFromToday } from "../lib/dates.js";
import { sortTasks, todayTasksOf } from "../lib/planner.js";

const messages = [
  "Small steps still count. One page at a time.",
  "You don't have to be perfect. You just have to keep showing up.",
  "Rest is part of studying too. Be kind to yourself today.",
  "Every lesson you review is helping someone in the future.",
  "You've handled hard days before. You can handle this one.",
  "Slow progress is still progress.",
  "Take a breath. You know more than you think you do.",
];

// Picks one message per day, so it stays the same all day
function messageOfTheDay() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayNumber = Math.floor((now - startOfYear) / 86400000);
  return messages[dayNumber % messages.length];
}

function EmptyState({ text, linkTo, linkLabel }) {
  return (
    <div className="empty">
      <p className="muted small">{text}</p>
      {linkTo && (
        <Link to={linkTo} className="btn btn-soft">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

const quickLinks = [
  { to: "/library", label: "Study Library", hint: "Your lessons and PDFs", icon: BookOpen },
  { to: "/planner", label: "Planner", hint: "Tasks and study timer", icon: CalendarCheck },
  { to: "/progress", label: "Progress", hint: "See how far you've come", icon: TrendingUp },
  { to: "/notes", label: "A Little Note", hint: "Something for you", icon: Heart },
];

export default function Dashboard() {
  const { docs } = useDocuments();
  const { tasks, toggleDone } = useTasks();
  const { todayItems, toggleItem } = useChecklist();
  const [name, setName] = useLocalStorage("pp:greetingName", "future nurse");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Today's checklist: tasks due today plus quick items
  const checklist = [
    ...todayTasksOf(tasks).map((t) => ({
      key: `t-${t.id}`,
      text: t.title,
      done: t.done,
      toggle: () => toggleDone(t.id),
    })),
    ...todayItems.map((i) => ({
      key: `i-${i.id}`,
      text: i.text,
      done: i.done,
      toggle: () => toggleItem(i.id),
    })),
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistPercent = checklist.length
    ? Math.round((checklistDone / checklist.length) * 100)
    : 0;

  // Next open tasks
  const upcoming = sortTasks(tasks.filter((t) => !t.done)).slice(0, 4);

  function startEditing() {
    setDraft(name);
    setEditing(true);
  }

  function saveName(e) {
    e.preventDefault();
    const cleaned = draft.trim().slice(0, 40);
    setName(cleaned || "future nurse");
    setEditing(false);
  }

  return (
    <div className="stack">
      {/* Greeting */}
      <section className="card card-soft hero">
        <p className="small muted hero-date">{today}</p>

        {editing ? (
          <form className="row" onSubmit={saveName}>
            <input
              className="input hero-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={40}
              aria-label="Name to show in the greeting"
              autoFocus
            />
            <button className="btn btn-primary" type="submit">
              <Check size={18} /> Save
            </button>
          </form>
        ) : (
          <div className="hero-title-row">
            <h1 className="hero-title">
              Hi, {name}! Ready for a little study session? 💗
            </h1>
            <button
              className="btn btn-outline btn-icon"
              onClick={startEditing}
              aria-label="Edit greeting name"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}

        <p className="hero-message">{messageOfTheDay()}</p>
      </section>

      {/* Main cards */}
      <section className="dash-grid">
        <div className="card">
          <div className="card-title">
            <ListChecks size={20} color="var(--rose)" />
            <h3>Today's checklist</h3>
          </div>
          {checklist.length === 0 ? (
            <EmptyState
              text="Nothing on your checklist today. Add items in the planner."
              linkTo="/planner"
              linkLabel="Open planner"
            />
          ) : (
            <div className="stack">
              <div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow={checklistPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-fill" style={{ width: `${checklistPercent}%` }} />
                </div>
                <p className="muted small" style={{ margin: "var(--space-2) 0 0" }}>
                  {checklistDone} of {checklist.length} done
                </p>
              </div>
              <ul className="check-list">
                {checklist.slice(0, 6).map((c) => (
                  <li className="check-item" key={c.key}>
                    <label className="check">
                      <input type="checkbox" checked={c.done} onChange={c.toggle} />
                      <span className={c.done ? "done-text" : ""}>{c.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
                            {checklistDone === checklist.length && <NoteCard category="congrats" compact />}
              {checklist.length > 6 && (
                <Link to="/planner" className="small">
                  See all {checklist.length} in the planner
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <CalendarCheck size={20} color="var(--rose)" />
            <h3>Upcoming study tasks</h3>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              text="No open tasks. Add tasks, quizzes and exams in the planner."
              linkTo="/planner"
              linkLabel="Go to planner"
            />
          ) : (
            <ul className="mini-list">
              {upcoming.map((t) => (
                <li key={t.id}>
                  <strong>{t.title}</strong>
                  <span
                    className={`small ${
                      t.dueDate && daysFromToday(t.dueDate) < 0 ? "due-overdue" : "muted"
                    }`}
                  >
                    {dueLabel(t.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <FileText size={20} color="var(--rose)" />
            <h3>Recent study materials</h3>
          </div>
          {docs.length === 0 ? (
            <EmptyState
              text="No lessons yet. Add your first PDF in the Study Library."
              linkTo="/library"
              linkLabel="Open library"
            />
          ) : (
            <ul className="mini-list">
              {docs.slice(0, 3).map((d) => (
                <li key={d.id}>
                  <Link to={`/library/${d.id}`}>{d.title}</Link>
                  <span className="muted small">{d.subject || "No subject"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <TrendingUp size={20} color="var(--rose)" />
            <h3>Study progress</h3>
          </div>
          <EmptyState
            text="Your progress summary arrives in the next step. It will be built from your real activity."
            linkTo="/progress"
            linkLabel="View progress"
          />
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2>Quick links</h2>
        <div className="quick-grid">
          {quickLinks.map(({ to, label, hint, icon: Icon }) => (
            <Link key={to} to={to} className="card card-interactive quick-link">
              <Icon size={22} color="var(--rose)" />
              <div>
                <strong>{label}</strong>
                <div className="muted small">{hint}</div>
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}