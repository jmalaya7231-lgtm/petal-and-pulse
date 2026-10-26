import NoteCard from "./NoteCard.jsx";
import { useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, CheckCircle, AlertCircle } from "lucide-react";
import { useTimer, phaseLabel, formatClock, minutesFor } from "../context/TimerContext.jsx";
import { dateKey } from "../lib/dates.js";

const FIELDS = [
  ["study", "Study (minutes)", 1, 180],
  ["shortBreak", "Short break (minutes)", 1, 60],
  ["longBreak", "Long break (minutes)", 1, 120],
  ["rounds", "Long break after how many study sessions", 2, 10],
];

function SettingsForm({ settings, onSave, disabled }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(FIELDS.map(([key]) => [key, String(settings[key])]))
  );
  const [message, setMessage] = useState(null);

  function submit(e) {
    e.preventDefault();
    const next = {};
    for (const [key, label, min, max] of FIELDS) {
      const n = Number(draft[key]);
      if (!Number.isInteger(n) || n < min || n > max) {
        setMessage({ ok: false, text: `${label}: enter a whole number from ${min} to ${max}.` });
        return;
      }
      next[key] = n;
    }
    onSave(next);
    setMessage({ ok: true, text: "Settings saved." });
  }

  return (
    <form className="stack" onSubmit={submit}>
      {disabled && (
        <p className="muted small" style={{ margin: 0 }}>
          Pause the timer to change settings.
        </p>
      )}
      <div className="settings-grid">
        {FIELDS.map(([key, label, min, max]) => (
          <div className="field" key={key}>
            <label htmlFor={`set-${key}`}>{label}</label>
            <input
              id={`set-${key}`}
              className="input"
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={draft[key]}
              onChange={(e) => {
                setDraft({ ...draft, [key]: e.target.value });
                setMessage(null);
              }}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
      {message && (
        <p className={`small ${message.ok ? "" : "due-overdue"}`} style={{ margin: 0 }}>
          {message.text}
        </p>
      )}
      <div>
        <button className="btn btn-soft" type="submit" disabled={disabled}>
          Save settings
        </button>
      </div>
    </form>
  );
}

export default function PomodoroTimer({ subjects }) {
  const {
    timer, settings, sessions, notice, clearNotice,
    start, pause, reset, skip, setSubject, updateSettings,
  } = useTimer();

  const totalMs = minutesFor(timer.phase, settings) * 60000;
  const elapsedPercent = Math.min(100, Math.max(0, Math.round((1 - timer.remainingMs / totalMs) * 100)));
  const untouched = timer.remainingMs >= totalMs;

  const today = dateKey();
  const todays = sessions.filter(
    (s) => s.kind === "study" && dateKey(new Date(s.at)) === today
  );
  const todayMinutes = todays.reduce((sum, s) => sum + s.minutes, 0);

  const position = (timer.cycle % settings.rounds) + 1;

  return (
    <section className="card stack timer-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Pomodoro timer</h3>
        <span className="badge">{phaseLabel(timer.phase)}</span>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          <CheckCircle size={18} />
          <span>
            {notice}{" "}
            <button className="link-btn" onClick={clearNotice}>
              Dismiss
            </button>
          </span>
        </div>
      )}

      <div className="timer-clock" role="timer" aria-live="off">
        {formatClock(timer.remainingMs)}
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={elapsedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${elapsedPercent}%` }} />
      </div>

      <div className="timer-actions">
        {timer.running ? (
          <button className="btn btn-primary" onClick={pause}>
            <Pause size={18} /> Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={start}>
            <Play size={18} /> {untouched ? "Start" : "Resume"}
          </button>
        )}
        <button className="btn btn-outline" onClick={reset}>
          <RotateCcw size={16} /> Reset
        </button>
        <button className="btn btn-outline" onClick={skip}>
          <SkipForward size={16} /> Skip to {timer.phase === "study" ? "break" : "study"}
        </button>
      </div>

      {timer.phase !== "study" && <NoteCard key={timer.cycle} category="break" compact />}
      {timer.phase === "study" && (
        <p className="muted small" style={{ margin: 0 }}>
          Study session {position} of {settings.rounds} before a long break.
        </p>
      )}

      <div className="field">
        <label htmlFor="timer-subject">What are you studying? (optional)</label>
        <select
          id="timer-subject"
          className="select"
          value={timer.subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="small" style={{ margin: 0 }}>
        <strong>Today:</strong> {todays.length} completed study{" "}
        {todays.length === 1 ? "session" : "sessions"} · {todayMinutes} minutes
      </p>

      <div className="alert">
        <AlertCircle size={18} color="var(--deep-rose)" />
        <span>
          Only finished study sessions are counted. Keep this page open while the timer
          runs. If you refresh or close it, the running session is lost.
        </span>
      </div>

      <details className="timer-settings">
        <summary>Timer settings</summary>
        <SettingsForm
          key={JSON.stringify(settings)}
          settings={settings}
          onSave={updateSettings}
          disabled={timer.running}
        />
      </details>
    </section>
  );
}