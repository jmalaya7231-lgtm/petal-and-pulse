import { useState } from "react";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { makeId } from "../lib/format.js";

const MAX_QUESTIONS = 50;
const LETTERS = ["A", "B", "C", "D"];

function blankQuestion() {
  return { key: makeId(), text: "", options: ["", "", "", ""], correct: 0, explanation: "" };
}

// Turns a saved quiz into the form's working copy
function toDraft(quiz) {
  if (!quiz) return { title: "", subject: "", questions: [blankQuestion()] };
  return {
    title: quiz.title,
    subject: quiz.subject,
    questions: quiz.questions.map((q) => ({
      key: q.id,
      text: q.text,
      options: [...q.options, "", "", "", ""].slice(0, 4),
      correct: q.correctIndex,
      explanation: q.explanation,
    })),
  };
}

function validate(draft) {
  if (!draft.title.trim()) return "Please give the quiz a title.";
  if (draft.questions.length === 0) return "Add at least one question.";

  for (let i = 0; i < draft.questions.length; i++) {
    const q = draft.questions[i];
    const n = i + 1;
    if (!q.text.trim()) return `Question ${n} needs some text.`;

    const filled = q.options.map((o) => o.trim().toLowerCase()).filter(Boolean);
    if (filled.length < 2) return `Question ${n} needs at least two answer options.`;
    if (new Set(filled).size !== filled.length) {
      return `Question ${n} has two identical options.`;
    }
    if (!q.options[q.correct].trim()) {
      return `Question ${n}: the option marked correct is empty.`;
    }
  }
  return "";
}

// Turns the form's working copy into the saved format (empty options removed)
function toQuiz(draft) {
  return {
    title: draft.title.trim(),
    subject: draft.subject,
    questions: draft.questions.map((q) => {
      const options = [];
      let correctIndex = 0;
      q.options.forEach((opt, i) => {
        if (opt.trim()) {
          if (i === q.correct) correctIndex = options.length;
          options.push(opt.trim());
        }
      });
      return {
        id: q.key,
        text: q.text.trim(),
        options,
        correctIndex,
        explanation: q.explanation.trim(),
      };
    }),
  };
}

export default function QuizEditor({ quiz, subjects, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => toDraft(quiz));
  const [error, setError] = useState("");

  function updateQuestion(index, patch) {
    setDraft({
      ...draft,
      questions: draft.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    });
  }

  function updateOption(qIndex, oIndex, value) {
    const q = draft.questions[qIndex];
    updateQuestion(qIndex, {
      options: q.options.map((o, i) => (i === oIndex ? value : o)),
    });
  }

  function addQuestion() {
    if (draft.questions.length >= MAX_QUESTIONS) return;
    setDraft({ ...draft, questions: [...draft.questions, blankQuestion()] });
  }

  function removeQuestion(index) {
    if (draft.questions.length === 1) return;
    if (!window.confirm(`Remove question ${index + 1}?`)) return;
    setDraft({ ...draft, questions: draft.questions.filter((_, i) => i !== index) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(toQuiz(draft));
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          <ArrowLeft size={18} /> Back to quizzes
        </button>
      </div>

      <h1>{quiz ? "Edit quiz" : "New quiz"}</h1>

      <div className="card stack">
        <div className="field">
          <label htmlFor="quiz-title">Quiz title</label>
          <input
            id="quiz-title"
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={80}
            placeholder="e.g. Cardiac medications, Week 4"
          />
        </div>

        <div className="field">
          <label htmlFor="quiz-subject">Subject</label>
          <select
            id="quiz-subject"
            className="select"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          >
            <option value="">No subject yet</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {draft.questions.map((q, qi) => (
        <div className="card stack" key={q.key}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Question {qi + 1}</h3>
            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={() => removeQuestion(qi)}
              disabled={draft.questions.length === 1}
              aria-label={`Remove question ${qi + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="field">
            <label htmlFor={`q-text-${q.key}`}>Question</label>
            <textarea
              id={`q-text-${q.key}`}
              className="textarea"
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              maxLength={500}
              placeholder="Type the question"
            />
          </div>

          <fieldset className="options-fieldset">
            <legend className="small">
              <strong>Answer options</strong>{" "}
              <span className="muted">(tick the circle next to the correct one)</span>
            </legend>
            {q.options.map((opt, oi) => (
              <div className="option-row" key={oi}>
                <input
                  type="radio"
                  name={`correct-${q.key}`}
                  checked={q.correct === oi}
                  onChange={() => updateQuestion(qi, { correct: oi })}
                  aria-label={`Mark option ${LETTERS[oi]} as correct`}
                />
                <span className="option-letter">{LETTERS[oi]}</span>
                <input
                  className="input"
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  maxLength={200}
                  placeholder={oi < 2 ? "Required" : "Optional"}
                  aria-label={`Option ${LETTERS[oi]}`}
                />
              </div>
            ))}
          </fieldset>

          <div className="field">
            <label htmlFor={`q-exp-${q.key}`}>Explanation (shown after answering)</label>
            <textarea
              id={`q-exp-${q.key}`}
              className="textarea"
              value={q.explanation}
              onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
              maxLength={800}
              placeholder="Why is this the right answer? (optional)"
            />
          </div>
        </div>
      ))}

      <div className="row">
        <button
          type="button"
          className="btn btn-soft"
          onClick={addQuestion}
          disabled={draft.questions.length >= MAX_QUESTIONS}
        >
          <Plus size={18} /> Add question
        </button>
        <span className="muted small">
          {draft.questions.length} of {MAX_QUESTIONS} questions
        </span>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="row">
        <button type="submit" className="btn btn-primary">
          Save quiz
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}