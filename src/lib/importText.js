import { makeId } from "./format.js";

const LETTERS = ["A", "B", "C", "D"];
const MAX_QUESTIONS = 100;
const MAX_CARDS = 300;

const START_RE = /^\s*(?:q(?:uestion)?\s*\d*\s*[:.)]|\d+\s*[.)])\s*(.*)$/i;
const OPTION_RE = /^\s*\(?([A-Da-d])[).:]\s*(.+)$/;
const ANSWER_RE =
  /^\s*(?:correct\s+)?(?:answer|ans|key)\s*[:\-]\s*\(?([A-Da-d])\s*(?:$|[).:,\-])/i;
const RATIONALE_RE = /^\s*(?:rationale|explanation|reason)\s*[:\-]\s*(.*)$/i;

function clean(text) {
  return text.replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim();
}

// Reads multiple-choice questions written in this format:
//   Q: question
//   A) option   B) option   C) option   D) option
//   Answer: B
//   Rationale: why
// The text is only ever read as data.
export function parseQuizText(text) {
  const blocks = [];
  let cur = null;
  let field = null; // "stem", an option number, or "rationale"

  function begin(stem, implicit = false) {
    cur = { stem, options: ["", "", "", ""], answer: null, rationale: "", tooMany: false, implicit };
    blocks.push(cur);
    field = "stem";
  }

  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const line = rawLine.replace(/\*\*|__/g, "").trim();
    if (!line) continue;

    const start = line.match(START_RE);
    const startsWithQ = /^q/i.test(line);
    if (start && (startsWithQ || !cur || cur.answer !== null)) {
      begin(start[1]);
      continue;
    }

    const option = line.match(OPTION_RE);
    if (option && cur) {
      const index = option[1].toUpperCase().charCodeAt(0) - 65;
      cur.options[index] = option[2];
      field = index;
      continue;
    }

    const answer = line.match(ANSWER_RE);
    if (answer && cur) {
      cur.answer = answer[1].toUpperCase().charCodeAt(0) - 65;
      field = null;
      continue;
    }

    const why = line.match(RATIONALE_RE);
    if (why && cur) {
      cur.rationale = why[1];
      field = "rationale";
      continue;
    }

    if (cur && /^\(?[Ee][).:]\s+/.test(line)) {
      cur.tooMany = true;
      continue;
    }

    if (!cur) {
      begin(line, true);
      continue;
    }

    // A wrapped line continues whatever came before it
    if (field === "stem") cur.stem += " " + line;
    else if (typeof field === "number") cur.options[field] += " " + line;
    else if (field === "rationale") cur.rationale += " " + line;
  }

  const questions = [];
  const errors = [];
  let n = 0;

  for (const b of blocks) {
    // Intro text from a chatbot ("Here are your questions") isn't a question
    if (b.implicit && b.answer === null && b.options.every((o) => !o.trim())) continue;

    n++;
    const label = `Question ${n}`;
    const stem = clean(b.stem);

    if (!stem) {
      errors.push(`${label}: the question text is empty.`);
      continue;
    }
    if (stem.length > 1500) {
      errors.push(`${label}: the question is too long (limit 1,500 characters).`);
      continue;
    }
    if (b.tooMany) {
      errors.push(`${label}: has more than four options. This app supports A to D.`);
      continue;
    }

    const options = [];
    let correctIndex = -1;
    b.options.forEach((o, i) => {
      const t = clean(o);
      if (!t) return;
      if (i === b.answer) correctIndex = options.length;
      options.push(t);
    });

    if (options.length < 2) {
      errors.push(`${label}: needs at least two options (A) and B)).`);
      continue;
    }
    if (b.answer === null) {
      errors.push(`${label}: no answer found. Add a line like “Answer: B”.`);
      continue;
    }
    if (correctIndex === -1) {
      errors.push(`${label}: the answer ${LETTERS[b.answer]} doesn't match any option.`);
      continue;
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
      errors.push(`${label}: two options are identical.`);
      continue;
    }
    if (options.some((o) => o.length > 400)) {
      errors.push(`${label}: an option is too long (limit 400 characters).`);
      continue;
    }

    questions.push({
      id: `${makeId()}-${n}`,
      text: stem,
      options,
      correctIndex,
      explanation: clean(b.rationale).slice(0, 1500),
    });

    if (questions.length >= MAX_QUESTIONS) {
      errors.push(`Only the first ${MAX_QUESTIONS} questions were read.`);
      break;
    }
  }

  return { questions, errors };
}

// Reads flashcards written one per line as:  Question :: Answer
export function parseCardText(text) {
  const cards = [];
  const errors = [];

  text
    .replace(/\r/g, "")
    .split("\n")
    .forEach((raw, i) => {
      const line = raw.replace(/\*\*|__/g, "").trim();
      if (!line) return;

      let parts = line.split("::");
      if (parts.length < 2) parts = line.split("\t");
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: put “::” between the question and the answer.`);
        return;
      }

      const front = parts[0].trim().replace(/^(?:[-•*]\s*|\d+[.)]\s*)/, "");
      const back = parts.slice(1).join("::").trim();

      if (!front || !back) {
        errors.push(`Line ${i + 1}: the question or the answer is empty.`);
      } else if (front.length > 500 || back.length > 1500) {
        errors.push(`Line ${i + 1}: too long (question 500, answer 1,500 characters).`);
      } else if (cards.length < MAX_CARDS) {
        cards.push({ front, back });
      }
    });

  if (cards.length >= MAX_CARDS) errors.push(`Only the first ${MAX_CARDS} cards were read.`);
  return { cards, errors };
}