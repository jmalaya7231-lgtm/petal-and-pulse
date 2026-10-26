import { useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import useTasks from "../hooks/useTasks.js";
import useChecklist from "../hooks/useChecklist.js";
import useFlashcards from "../hooks/useFlashcards.js";
import useQuizzes from "../hooks/useQuizzes.js";
import useSubjects from "../hooks/useSubjects.js";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { useTimer } from "../context/TimerContext.jsx";
import { computeStats, subjectBreakdown } from "../lib/stats.js";
import { formatDate } from "../lib/format.js";

const METRICS = [
  ["minutes", "Study minutes"],
  ["cards", "Flashcards reviewed"],
  ["quizzes", "Quizzes taken"],
  ["tasks", "Tasks and checklist items done"],
];

function Stat({ label, value, hint }) {
  return (
    <div className="card stat">
      <span className="small muted">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="small muted">{hint}</span>
    </div>
  );
}

function Meter({ label, done, total, suffix }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <span className="small">{label}</span>
        <span className="small muted">
          {suffix ?? `${done} of ${total}`}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ marginTop: "var(--space-1)" }}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function Progress() {
  const { tasks } = useTasks();
  const { items: checklist } = useChecklist();
  const { cards } = useFlashcards();
  const { attempts } = useQuizzes();
  const { subjects } = useSubjects();
  const { sessions } = useTimer();
  const [flashLog] = useLocalStorage("pp:flashcardLog", []);
  const [metric, setMetric] = useState("minutes");

  const { days, week, totals, hasAny } = computeStats({
    tasks,
    checklist,
    cards,
    flashLog,
    attempts,
    sessions,
  });
  const rows = subjectBreakdown({ subjects, tasks, cards, attempts, sessions });

  const values = week[metric];
  const max = Math.max(...values, 0);
  const weekTotal = values.reduce((a, b) => a + b, 0);
  const metricLabel = METRICS.find(([key]) => key === metric)[1];
  const recent = [...attempts].reverse().slice(0, 5);

  return (
    <div className="stack">
      <div>
        <h1>Progress</h1>
        <p className="muted">Everything here is counted from what you've actually done.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Your activity is saved <strong>in this browser only</strong>. It doesn't sync to
          other devices and isn't backed up, and clearing your browser data resets these
          numbers.
        </span>
      </div>

      {!hasAny && (
        <div className="card card-soft">
          <p style={{ margin: 0 }}>
            No activity yet. Finish a task, review flashcards, take a quiz or complete a timer
            session in the <Link to="/planner">planner</Link>, and it will show up here.
          </p>
        </div>
      )}

      <section className="stat-grid">
        <Stat
          label="Tasks completed"
          value={totals.tasksDone}
          hint={`of ${totals.tasksTotal} planner ${totals.tasksTotal === 1 ? "task" : "tasks"}`}
        />
        <Stat
          label="Quizzes taken"
          value={totals.quizAttempts}
          hint={totals.quizAvg !== null ? `Average score ${totals.quizAvg}%` : "No quizzes taken yet"}
        />
        <Stat
          label="Flashcards reviewed"
          value={totals.flashReviews}
          hint={`${totals.cardsReviewed} of ${totals.cardsTotal} cards marked reviewed now`}
        />
        <Stat
          label="Study sessions"
          value={totals.sessions}
          hint={`${totals.minutes} ${totals.minutes === 1 ? "minute" : "minutes"} in total`}
        />
      </section>

      {/* Weekly chart */}
      <section className="card stack">
        <h3 style={{ margin: 0 }}>This week</h3>

        <div className="chips" role="group" aria-label="Choose what to chart">
          {METRICS.map(([key, label]) => (
            <button
              key={key}
              className={`chip ${metric === key ? "active" : ""}`}
              onClick={() => setMetric(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bars">
          {days.map((d, i) => (
            <div className="bar-col" key={d.key}>
              <span className="bar-value">{values[i]}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${d.isToday ? "today" : ""}`}
                  style={{
                    height: max ? `${Math.round((values[i] / max) * 100)}%` : "0%",
                    minHeight: values[i] > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className={`bar-label ${d.isToday ? "today-label" : ""}`}>{d.label}</span>
            </div>
          ))}
        </div>

        <p className="muted small" style={{ margin: 0 }}>
          {weekTotal === 0
            ? `No ${metricLabel.toLowerCase()} recorded in the last 7 days.`
            : `${metricLabel}: ${weekTotal} in the last 7 days.`}
        </p>
      </section>

      {/* By subject */}
      <section className="stack">
        <h2>Progress by subject</h2>

        {rows.length === 0 ? (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              No subject activity yet. Give your tasks, flashcards, quizzes and timer sessions a
              subject, and they'll be grouped here.
            </p>
          </div>
        ) : (
          <div className="grid">
            {rows.map((r) => (
              <div className="card stack" key={r.name || "none"}>
                <h3 style={{ margin: 0 }}>{r.name || "No subject"}</h3>

                {r.tasksTotal > 0 && (
                  <Meter label="Tasks done" done={r.tasksDone} total={r.tasksTotal} />
                )}
                {r.cardsTotal > 0 && (
                  <Meter label="Flashcards reviewed" done={r.cardsReviewed} total={r.cardsTotal} />
                )}
                {r.attempts > 0 && (
                  <Meter
                    label="Quiz average"
                    done={r.quizAvg}
                    total={100}
                    suffix={`${r.quizAvg}% · ${r.attempts} ${r.attempts === 1 ? "attempt" : "attempts"}`}
                  />
                )}
                {r.sessions > 0 && (
                  <p className="small muted" style={{ margin: 0 }}>
                    {r.sessions} study {r.sessions === 1 ? "session" : "sessions"} · {r.minutes}{" "}
                    {r.minutes === 1 ? "minute" : "minutes"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent quizzes */}
      <section className="stack">
        <h2>Recent quiz scores</h2>
        {recent.length === 0 ? (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              No quiz scores yet. <Link to="/quizzes">Take a quiz</Link> and your result will be
              listed here.
            </p>
          </div>
        ) : (
          <div className="doc-list">
            {recent.map((a) => (
              <div className="card card-row" key={a.id}>
                <div className="card-row-main">
                  <strong className="clamp">{a.quizTitle}</strong>
                  <span className="muted small">
                    {a.subject || "No subject"} · {formatDate(a.at)}
                  </span>
                </div>
                <span className="badge">
                  {a.score}/{a.total} · {Math.round((a.score / a.total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}