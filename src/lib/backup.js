import { getAllDocs, saveDoc } from "./db.js";
import { dateKey } from "./dates.js";

const FORMAT = "petal-and-pulse-backup";
const VERSION = 1;
export const MAX_BACKUP_MB = 100;

// The only saved items a backup may contain, and the shape each must have
const SHAPES = {
  "pp:greetingName": "string",
  "pp:customSubjects": "array",
  "pp:readerSize": "string",
  "pp:flashcards": "array",
  "pp:flashcardLog": "array",
  "pp:quizzes": "array",
  "pp:quizAttempts": "array",
  "pp:tasks": "array",
  "pp:checklist": "array",
  "pp:timerSettings": "object",
  "pp:sessions": "array",
  "pp:myNotes": "array",
  "pp:highlights": "array",
};

function shapeMatches(value, shape) {
  if (shape === "array") return Array.isArray(value);
  if (shape === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === shape;
}

// Keeps only the lesson fields we know about. Returns null if it isn't a usable lesson.
function cleanDoc(d) {
  if (!d || typeof d !== "object") return null;
  if (typeof d.id !== "string" || !d.id || d.id.length > 100) return null;
  if (!Array.isArray(d.pages) || d.pages.length === 0) return null;
  if (!d.pages.every((p) => typeof p === "string")) return null;

  return {
    id: d.id,
    title: typeof d.title === "string" ? d.title.slice(0, 120) : "Untitled lesson",
    filename: typeof d.filename === "string" ? d.filename.slice(0, 200) : "",
    size: Number.isFinite(d.size) ? d.size : 0,
    numPages: d.pages.length,
    charCount: d.pages.reduce((sum, p) => sum + p.length, 0),
    pages: d.pages,
    subject: typeof d.subject === "string" ? d.subject.slice(0, 40) : "",
    addedAt:
      typeof d.addedAt === "string" && !Number.isNaN(Date.parse(d.addedAt))
        ? d.addedAt
        : new Date().toISOString(),
  };
}

export async function createBackup() {
  const local = {};
  for (const key of Object.keys(SHAPES)) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) local[key] = JSON.parse(raw);
    } catch {
      // Skip anything unreadable
    }
  }
  const documents = await getAllDocs();
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    local,
    documents,
  };
}

// Starts a file download and returns the file name
export function downloadBackup(backup) {
  const name = `petal-and-pulse-backup-${dateKey()}.json`;
  const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

// Reads and checks a backup file's text. The file is only ever read as data, never run.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file couldn't be read. It isn't a valid backup.");
  }
  if (!data || data.format !== FORMAT) {
    throw new Error("This doesn't look like a Petal & Pulse backup file.");
  }
  if (data.version !== VERSION) {
    throw new Error("This backup was made by a different version of the app.");
  }

  const source = data.local && typeof data.local === "object" ? data.local : {};
  const local = {};
  for (const [key, shape] of Object.entries(SHAPES)) {
    if (!(key in source)) continue;
    if (!shapeMatches(source[key], shape)) {
      throw new Error("The backup contains damaged data, so it wasn't restored.");
    }
    local[key] = source[key];
  }

  const rawDocs = Array.isArray(data.documents) ? data.documents : [];
  const documents = rawDocs.map(cleanDoc).filter(Boolean);

  return {
    local,
    documents,
    skipped: rawDocs.length - documents.length,
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : "",
  };
}

export function describeBackup(parsed) {
  const count = (key) => (Array.isArray(parsed.local[key]) ? parsed.local[key].length : 0);
  return [
    ["Lessons", parsed.documents.length],
    ["Highlights", count("pp:highlights")],
    ["Flashcards", count("pp:flashcards")],
    ["Quizzes", count("pp:quizzes")],
    ["Quiz scores", count("pp:quizAttempts")],
    ["Tasks", count("pp:tasks")],
    ["Timer sessions", count("pp:sessions")],
    ["Your own notes", count("pp:myNotes")],
  ];
}

// Lessons are added (or replaced if they share an id). Each saved list in the backup
// replaces the matching list in this browser.
export async function restoreBackup(parsed) {
  for (const doc of parsed.documents) {
    await saveDoc(doc);
  }
  for (const [key, value] of Object.entries(parsed.local)) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}