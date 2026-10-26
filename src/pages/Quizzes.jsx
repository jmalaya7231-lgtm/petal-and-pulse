import { useState } from "react";
import { Info, Plus, Play, Pencil, Trash2 } from "lucide-react";
import QuizEditor from "../components/QuizEditor.jsx";
import QuizTake from "../components/QuizTake.jsx";
import useQuizzes from "../hooks/useQuizzes.js";
import useSubjects from "../hooks/useSubjects.js";
import { shuffled } from "../lib/shuffle.js";
import { formatDate } from "../lib/format.js";

export default function Quizzes() {
  const { quizzes, attempts, saveQuiz, deleteQuiz, recordAttempt } = useQuizzes();
  const { subjects } = useSubjects();

  const [mode, setMode] = useState("list"); // "list" or "edit"
  const [editing, setEditing] = useState(null); // the quiz being edited, or null for a new one
  const [run, setRun] = useState(null); // the quiz being taken
  const [shuffleQs, setShuffleQs] = useState(false);
  const [filter, setFilter] = useState("all");

  const visible = quizzes.filter((q) => {
    if (filter === "all") return true;
    if (filter === "none") return !q.subject;
    return q.subject === filter;
  });

  function statsFor(quizId) {
    const mine = attempts.filter((a) => a.quizId === quizId);
    if (mine.length === 0) return null;
    const last = mine[mine.length - 1];
    const best = mine.reduce((b, a) => (a.score / a.total > b.score / b.total ? a : b));
    return { count: mine.length, last, best };
  }

  function start(quiz) {
    window.scrollTo({ top: 0 });
    setRun({
      quiz,
      questions: shuffleQs ? shuffled(quiz.questions) : quiz.questions,
      record: true,
      key: Date.now(),
    });
  }

  function retryMissed(missedQuestions) {
    window.scrollTo({ top: 0 });
    setRun({
      quiz: run.quiz,
      questions: missedQuestions,
      record: false, // practice rounds don't count toward progress
      key: Date.now(),
    });
  }

  function openEditor(quiz) {
    window.scrollTo({ top: 0 });
    setEditing(quiz);
    setMode("edit");
  }

  function closeEditor() {
    setEditing(null);
    setMode("list");
  }

  function handleSave(data) {
    saveQuiz(data, editing ? editing.id : undefined);
    closeEditor();
  }

  function handleDelete(quiz) {
    if (
      window.confirm(
        `Delete "${quiz.title}"? The quiz can't be recovered. Your past scores stay in your history.`
      )
    ) {
      deleteQuiz(quiz.id);
    }
  }

  if (run) {
    return (
      <QuizTake
        key={run.key}
        quiz={run.quiz}
        questions={run.questions}
        record={run.record}
        onComplete={(score, total) => recordAttempt(run.quiz, score, total)}
        onRetryAll={() => start(run.quiz)}
        onRetryMissed={retryMissed}
        onExit={() => setRun(null)}
      />
    );
  }

  if (mode === "edit") {
    return (
      <QuizEditor
        key={editing ? editing.id : "new"}
        quiz={editing}
        subjects={subjects}
        onSave={handleSave}
        onCancel={closeEditor}
      />
    );
  }

  return (
    <div className="stack">
      <div>
        <h1>Practice Quizzes</h1>
        <p className="muted">Write multiple-choice questions, then test yourself.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Quizzes and scores are saved <strong>in this browser only</strong>. They don't
          sync to other devices and aren't backed up, and clearing your browser data
          removes them. Nothing is sent anywhere.
        </span>
      </div>

      <div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>
          <Plus size={18} /> Create a quiz
        </button>
      </div>

      <section className="stack">
        <h2>Your quizzes</h2>

        {quizzes.length > 0 && (
          <div className="row">
            <div className="field" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
              <label htmlFor="quiz-filter">Show</label>
              <select
                id="quiz-filter"
                className="select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All subjects ({quizzes.length})</option>
                <option value="none">
                  No subject ({quizzes.filter((q) => !q.subject).length})
                </option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s} ({quizzes.filter((q) => q.subject === s).length})
                  </option>
                ))}
              </select>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={shuffleQs}
                onChange={(e) => setShuffleQs(e.target.checked)}
              />
              Shuffle question order
            </label>
          </div>
        )}

        {visible.length === 0 && (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>
              {quizzes.length === 0
                ? "No quizzes yet. Click “Create a quiz” to write your first one."
                : "No quizzes in this subject yet."}
            </p>
          </div>
        )}

        <div className="doc-list">
          {visible.map((quiz) => {
            const stats = statsFor(quiz.id);
            const n = quiz.questions.length;
            return (
              <div className="card card-row" key={quiz.id}>
                <div className="card-row-main">
                  <strong className="clamp">{quiz.title}</strong>
                  <div className="doc-meta">
                    {quiz.subject ? (
                      <span className="badge">{quiz.subject}</span>
                    ) : (
                      <span className="badge badge-outline">No subject</span>
                    )}
                    <span className="muted small">
                      {n} {n === 1 ? "question" : "questions"}
                    </span>
                  </div>
                  <span className="muted small">
                    {stats
                      ? `Last: ${stats.last.score}/${stats.last.total} on ${formatDate(
                          stats.last.at
                        )} · Best: ${stats.best.score}/${stats.best.total} · Taken ${
                          stats.count
                        }×`
                      : "Not taken yet"}
                  </span>
                </div>
                <button className="btn btn-primary" onClick={() => start(quiz)}>
                  <Play size={16} /> Start
                </button>
                <button
                  className="btn btn-outline btn-icon"
                  onClick={() => openEditor(quiz)}
                  aria-label={`Edit ${quiz.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="btn btn-outline btn-icon"
                  onClick={() => handleDelete(quiz)}
                  aria-label={`Delete ${quiz.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}