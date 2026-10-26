import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Copy, Check, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import useQuizzes from "../hooks/useQuizzes.js";
import useFlashcards from "../hooks/useFlashcards.js";
import useSubjects from "../hooks/useSubjects.js";
import { parseQuizText, parseCardText } from "../lib/importText.js";

const LETTERS = ["A", "B", "C", "D"];

const QUIZ_PROMPT = `I'm a nursing student preparing for the PNLE (Philippine Nurse Licensure Examination).

Using ONLY the notes I paste below, write 10 multiple-choice questions in PNLE style: a short clinical scenario or a direct stem, four options (A to D) with one best answer, believable wrong options, and a short rationale explaining why the answer is correct. Do not add facts that are not in the notes. If the notes don't support a question, skip it.

Use exactly this format, with a blank line between questions and no other text:

Q: (question)
A) (option)
B) (option)
C) (option)
D) (option)
Answer: (one letter)
Rationale: (short explanation)

NOTES:
(paste your notes here)`;

const CARD_PROMPT = `I'm a nursing student. Using ONLY the notes I paste below, write flashcards, one per line, in exactly this format and with no other text:

Question :: Answer

Keep answers short and taken from the notes. Do not add facts that are not in the notes. Do not number the lines.

NOTES:
(paste your notes here)`;

export default function Import() {
  const { saveQuiz } = useQuizzes();
  const { addCards } = useFlashcards();
  const { subjects } = useSubjects();

  const [tab, setTab] = useState("quiz");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [notice, setNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  const prompt = tab === "quiz" ? QUIZ_PROMPT : CARD_PROMPT;

  function switchTab(next) {
    setTab(next);
    setText("");
    setResult(null);
    setNotice(null);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNotice({ type: "error", text: "Couldn't copy automatically. Select the text and copy it by hand." });
    }
  }

  function check() {
    setNotice(null);
    if (!text.trim()) {
      setResult(null);
      setNotice({ type: "error", text: "Paste some text first." });
      return;
    }
    setResult(tab === "quiz" ? parseQuizText(text) : parseCardText(text));
  }

  function save() {
    if (!result) return;

    if (tab === "quiz") {
      if (!title.trim()) {
        setNotice({ type: "error", text: "Please give the quiz a title." });
        return;
      }
      saveQuiz({ title: title.trim().slice(0, 80), subject, questions: result.questions });
      setNotice({
        type: "success",
        text: `Saved a quiz with ${result.questions.length} question${result.questions.length === 1 ? "" : "s"}.`,
        to: "/quizzes",
        label: "Open quizzes",
      });
    } else {
      const { added, skipped } = addCards(result.cards.map((c) => ({ ...c, subject })));
      setNotice({
        type: "success",
        text:
          `Added ${added} flashcard${added === 1 ? "" : "s"}.` +
          (skipped ? ` ${skipped} skipped because you already have a card with the same question.` : ""),
        to: "/flashcards",
        label: "Open flashcards",
      });
    }
    setText("");
    setResult(null);
    setTitle("");
  }

  const count = result ? (tab === "quiz" ? result.questions.length : result.cards.length) : 0;

  return (
    <div className="stack">
      <div>
        <h1>Paste &amp; Import</h1>
        <p className="muted">
          Bring in questions and flashcards you already have, or ones made by a free AI chat app.
        </p>
      </div>

      <div className="alert">
        <ShieldAlert size={18} color="var(--deep-rose)" />
        <span>
          <strong>Check everything before studying from it.</strong> This page only checks the
          format. It can't tell if a question or answer is medically correct. AI chat apps can
          make mistakes, so compare each item with your notes, your instructors' materials and
          current references. If you paste your notes into a chat app, they are sent to that
          service.
        </span>
      </div>

      <div className="chips" role="group" aria-label="What to import">
        <button className={`chip ${tab === "quiz" ? "active" : ""}`} onClick={() => switchTab("quiz")}>
          Quiz questions (PNLE style)
        </button>
        <button className={`chip ${tab === "cards" ? "active" : ""}`} onClick={() => switchTab("cards")}>
          Flashcards
        </button>
      </div>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>Step 1: Get the questions</h3>
        <p className="muted small" style={{ margin: 0 }}>
          Copy this prompt into a free AI chat app, replace the last line with your notes, and
          send it. Or write or collect {tab === "quiz" ? "questions" : "cards"} yourself in the same format.
        </p>
        <details>
          <summary className="link-btn">Show the prompt</summary>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              margin: "var(--space-3) 0 0",
              padding: "var(--space-3) var(--space-4)",
              fontFamily: "inherit",
              fontSize: "var(--fs-sm)",
              background: "var(--soft-white)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {prompt}
          </pre>
        </details>
        <div>
          <button className="btn btn-soft" onClick={copyPrompt}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </section>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>Step 2: Paste the result here</h3>
        <textarea
          className="textarea"
          style={{ minHeight: 220 }}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          placeholder={
            tab === "quiz"
              ? "Q: A nurse is caring for a client...\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: B\nRationale: ..."
              : "What is the normal adult resting heart rate? :: 60 to 100 beats per minute"
          }
          aria-label="Pasted text"
        />
        <div>
          <button className="btn btn-primary" onClick={check}>
            Check format
          </button>
        </div>
      </section>

      {notice && (
        <div
          className={`alert ${notice.type === "error" ? "alert-error" : "alert-success"}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>
            {notice.text}
            {notice.to && (
              <>
                {" "}
                <Link to={notice.to}>{notice.label}</Link>
              </>
            )}
          </span>
        </div>
      )}

      {result && result.errors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>
              {result.errors.length} problem{result.errors.length === 1 ? "" : "s"} found. Those
              items are left out:
            </strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: "1.2rem" }}>
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && count > 0 && (
        <section className="card stack">
          <h3 style={{ margin: 0 }}>
            Step 3: Review and save ({count} {tab === "quiz" ? "question" : "card"}
            {count === 1 ? "" : "s"})
          </h3>

          <ul className="draft-list">
            {tab === "quiz"
              ? result.questions.map((q, n) => (
                  <li className="draft-item" key={q.id}>
                    <div className="draft-check">
                      <span className="draft-body">
                        <strong>
                          {n + 1}. {q.text}
                        </strong>
                        <span className="draft-options">
                          {q.options.map((opt, i) => (
                            <span key={i} className={i === q.correctIndex ? "draft-correct" : ""}>
                              {LETTERS[i]}. {opt}
                              {i === q.correctIndex ? "  ✓" : ""}
                            </span>
                          ))}
                        </span>
                        {q.explanation && <span className="muted small">{q.explanation}</span>}
                      </span>
                    </div>
                  </li>
                ))
              : result.cards.map((c, n) => (
                  <li className="draft-item" key={n}>
                    <div className="draft-check">
                      <span className="draft-body">
                        <strong>{c.front}</strong>
                        <span>{c.back}</span>
                      </span>
                    </div>
                  </li>
                ))}
          </ul>

          {tab === "quiz" && (
            <div className="field">
              <label htmlFor="imp-title">Quiz title</label>
              <input
                id="imp-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Cardiac nursing, PNLE practice"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="imp-subject">Subject</label>
            <select
              id="imp-subject"
              className="select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">No subject yet</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <button className="btn btn-primary" onClick={save}>
              Save {tab === "quiz" ? "quiz" : "flashcards"}
            </button>
            <button className="btn btn-outline" onClick={() => setResult(null)}>
              Cancel
            </button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Everything is saved in this browser only, in the order you pasted it. You can edit
            or delete items afterwards.
          </p>
        </section>
      )}

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Format tips: for quizzes, start each question with <code>Q:</code>, give options{" "}
          <code>A)</code> to <code>D)</code>, then <code>Answer: B</code> and an optional{" "}
          <code>Rationale:</code>. Separate questions with a blank line. For flashcards, put{" "}
          <code>::</code> between the question and the answer, one card per line.
        </span>
      </div>
    </div>
  );
}