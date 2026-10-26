import NoteCard from "./NoteCard.jsx";
import { useState } from "react";
import { ArrowLeft, RotateCcw, Check, X } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizTake({
  quiz,
  questions,
  record,
  onComplete,
  onRetryAll,
  onRetryMissed,
  onExit,
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState([]); // { question, selected }
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  function choose(i) {
    if (!checked) setSelected(i);
  }

  function next() {
    const newAnswers = [...answers, { question: q, selected }];
    setAnswers(newAnswers);

    if (index === questions.length - 1) {
      const score = newAnswers.filter((a) => a.selected === a.question.correctIndex).length;
      if (record) onComplete(score, newAnswers.length);
      setFinished(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
      setChecked(false);
    }
  }

  /* ---------- Results ---------- */
  if (finished) {
    const score = answers.filter((a) => a.selected === a.question.correctIndex).length;
    const total = answers.length;
    const percent = Math.round((score / total) * 100);
    const missed = answers.filter((a) => a.selected !== a.question.correctIndex);

    return (
      <div className="stack">
        <div>
          <button className="btn btn-outline" onClick={onExit}>
            <ArrowLeft size={18} /> Back to quizzes
          </button>
        </div>

        <div className="card card-soft score-card">
          <span className="flash-label">Your result</span>
          <div className="score-big">
            {score} / {total}
          </div>
          <div className="muted">{percent}% correct</div>
          <p className="small muted" style={{ margin: 0 }}>
            {record
              ? "This score was saved to your quiz history."
              : "This was a practice round of missed questions, so it wasn't added to your history."}
          </p>
        </div>

        <div className="row">
          <button className="btn btn-primary" onClick={onRetryAll}>
            <RotateCcw size={18} /> Retry whole quiz
          </button>
          {missed.length > 0 && (
            <button
              className="btn btn-soft"
              onClick={() => onRetryMissed(missed.map((a) => a.question))}
            >
              Retry missed ({missed.length})
            </button>
          )}
        </div>

        <NoteCard category={percent >= 70 ? "congrats" : "general"} compact />
        {missed.length === 0 ? (
          <div className="alert alert-success">
            <Check size={18} />
            <span>You got every question right.</span>
          </div>
        ) : (
          <section className="stack">
            <h2>Questions to review</h2>
            {missed.map(({ question, selected: picked }) => (
              <div className="card stack" key={question.id}>
                <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {question.text}
                </strong>
                <div className="alert alert-error">
                  <X size={18} />
                  <span>
                    Your answer:{" "}
                    {picked === null ? "(none)" : question.options[picked]}
                  </span>
                </div>
                <div className="alert alert-success">
                  <Check size={18} />
                  <span>Correct answer: {question.options[question.correctIndex]}</span>
                </div>
                {question.explanation && (
                  <p className="muted small" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {question.explanation}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  /* ---------- Taking the quiz ---------- */
  const isCorrect = selected === q.correctIndex;
  const percent = Math.round((index / questions.length) * 100);

  return (
    <div className="stack">
      <div>
        <button
          className="btn btn-outline"
          onClick={() => {
            if (window.confirm("Leave this quiz? Your progress in it won't be saved.")) {
              onExit();
            }
          }}
        >
          <ArrowLeft size={18} /> Leave quiz
        </button>
      </div>

      <div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong className="small">{quiz.title}</strong>
          <span className="muted small">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ marginTop: "var(--space-2)" }}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="card stack">
        {index === 0 && <NoteCard category="quiz" compact />}
        <h3 className="quiz-question">{q.text}</h3>

        <div className="stack" role="group" aria-label="Answer options">
          {q.options.map((opt, i) => {
            let state = "";
            if (checked) {
              if (i === q.correctIndex) state = "correct";
              else if (i === selected) state = "wrong";
              else state = "dim";
            } else if (i === selected) {
              state = "selected";
            }
            return (
              <button
                key={i}
                type="button"
                className={`quiz-option ${state} ${checked ? "locked" : ""}`}
                onClick={() => choose(i)}
                aria-pressed={selected === i}
              >
                <span className="quiz-letter">{LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {checked && (
          <div className={`alert ${isCorrect ? "alert-success" : "alert-error"}`} role="status">
            {isCorrect ? <Check size={18} /> : <X size={18} />}
            <span>
              <strong>{isCorrect ? "Correct." : "Not quite."}</strong>
              {!isCorrect && ` The correct answer is ${q.options[q.correctIndex]}.`}
              {q.explanation && (
                <span style={{ display: "block", marginTop: 6, whiteSpace: "pre-wrap" }}>
                  {q.explanation}
                </span>
              )}
            </span>
          </div>
        )}

        {!checked ? (
          <button
            className="btn btn-primary"
            onClick={() => setChecked(true)}
            disabled={selected === null}
          >
            Check answer
          </button>
        ) : (
          <button className="btn btn-primary" onClick={next}>
            {index === questions.length - 1 ? "See results" : "Next question"}
          </button>
        )}
      </div>
    </div>
  );
}