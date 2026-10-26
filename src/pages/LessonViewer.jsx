import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Highlighter,
  FileUp,
  AlertCircle,
} from "lucide-react";
import HighlightedText from "../components/HighlightedText.jsx";
import HighlightBar from "../components/HighlightBar.jsx";
import PdfPages from "../components/PdfPages.jsx";
import useHighlights from "../hooks/useHighlights.js";
import useFlashcards from "../hooks/useFlashcards.js";
import useSubjects from "../hooks/useSubjects.js";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { getDoc, saveDoc, getFile, saveFile } from "../lib/db.js";
import { readSelection, readAreaSelection } from "../lib/selection.js";
import pdfjsLib from "../lib/pdfjs.js";
import { MAX_FILE_MB } from "../lib/pdfExtract.js";
import { formatBytes, formatDate } from "../lib/format.js";
import { COLORS } from "../data/highlightColors.js";

// Pages draw a moment after the screen opens, so keep looking for the highlight
function scrollToHighlight(hid) {
  let tries = 0;
  const timer = setInterval(() => {
    const el = document.querySelector(`[data-hl="${hid}"]`);
    tries++;
    if (el) {
      el.scrollIntoView({ block: "center" });
      clearInterval(timer);
    } else if (tries > 25) {
      clearInterval(timer);
    }
  }, 150);
}

export default function LessonViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { subjects } = useSubjects();
  const { highlights, addHighlight, updateHighlight, removeHighlight } = useHighlights();
  const { addCards } = useFlashcards();

  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [fileBytes, setFileBytes] = useState(null); // the saved original PDF, if any
  const [view, setView] = useState("text"); // "original" or "text"
  const [pageIndex, setPageIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [size, setSize] = useLocalStorage("pp:readerSize", "md");
  const [pending, setPending] = useState(null); // text she just selected
  const [activeId, setActiveId] = useState(null); // highlight she tapped
  const [attach, setAttach] = useState({ busy: false, error: "" });

  const articleRef = useRef(null);
  const attachRef = useRef(null);
  const pagesRef = useRef([]);
  const viewRef = useRef("text");
  const highlightsRef = useRef([]);
  pagesRef.current = doc ? doc.pages : [];
  viewRef.current = view;
  highlightsRef.current = highlights;

  // Load the lesson and its original PDF, and jump to a page or highlight if the link asks
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPending(null);
    setActiveId(null);

    Promise.all([getDoc(id), getFile(id).catch(() => null)])
      .then(([found, record]) => {
        if (cancelled) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        const bytes = record && record.bytes ? record.bytes : null;
        setDoc(found);
        setFileBytes(bytes);

        const p = Number(searchParams.get("page"));
        setPageIndex(Number.isInteger(p) && p >= 1 && p <= found.pages.length ? p - 1 : 0);

        const h = searchParams.get("hl");
        const safe = h && /^[A-Za-z0-9]+$/.test(h) ? h : null;
        setActiveId(safe);

        const target = safe ? highlightsRef.current.find((x) => x.id === safe) : null;
        const wantsOriginal = target ? target.kind === "area" : true;
        setView(bytes && wantsOriginal ? "original" : "text");
        setStatus("ready");

        if (safe) scrollToHighlight(safe);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Notice when she selects text, in whichever view is showing
  useEffect(() => {
    function onChange() {
      const result =
        viewRef.current === "original"
          ? readAreaSelection(articleRef.current)
          : readSelection(pagesRef.current, articleRef.current);
      if (result) {
        setPending(result);
        setActiveId(null);
      }
    }
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  if (status === "loading") return <p className="muted">Opening lesson...</p>;

  if (status !== "ready") {
    return (
      <div className="stack">
        <Link to="/library" className="back-link">
          <ArrowLeft size={18} /> Back to library
        </Link>
        <div className="card card-soft">
          <h3>{status === "missing" ? "Lesson not found" : "Couldn't open this lesson"}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {status === "missing"
              ? "It may have been removed, or it was saved in a different browser."
              : "This browser couldn't read its saved storage."}
          </p>
        </div>
      </div>
    );
  }

  const total = doc.pages.length;
  const mine = highlights.filter((h) => h.docId === doc.id);
  const areaHighlights = mine.filter((h) => h.kind === "area");
  const textHighlightsOn = (n) => mine.filter((h) => h.kind !== "area" && h.page === n);
  const active = activeId ? mine.find((h) => h.id === activeId) : null;
  const allNumbers = doc.pages.map((_, i) => i + 1);
  const inOriginal = view === "original" && fileBytes;

  function clearSelection() {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  function closeBar() {
    clearSelection();
    setPending(null);
    setActiveId(null);
  }

  function switchView(next) {
    closeBar();
    setView(next);
  }

  function goToPage(index) {
    closeBar();
    setPageIndex(index);
    window.scrollTo({ top: 0 });
  }

  async function changeSubject(e) {
    const updated = { ...doc, subject: e.target.value };
    setDoc(updated);
    try {
      await saveDoc(updated);
    } catch {
      // The screen still shows the new value; saving can be retried by changing it again.
    }
  }

  // For lessons added before the original PDF was kept, or restored from a backup
  async function attachOriginal(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setAttach({ busy: true, error: "" });
    try {
      const looksLikePdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!looksLikePdf) throw new Error("Please choose a .pdf file.");
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        throw new Error(`That file is larger than ${MAX_FILE_MB} MB.`);
      }

      const bytes = await file.arrayBuffer();
      const header = new TextDecoder().decode(new Uint8Array(bytes.slice(0, 5)));
      if (header !== "%PDF-") throw new Error("This file isn't a valid PDF.");

      const task = pdfjsLib.getDocument({ data: bytes.slice(0) });
      let pageCount;
      try {
        pageCount = (await task.promise).numPages;
      } catch {
        throw new Error("This PDF couldn't be opened.");
      } finally {
        try {
          await task.destroy();
        } catch {
          // Ignore cleanup problems
        }
      }

      if (pageCount !== doc.numPages) {
        throw new Error(
          `This PDF has ${pageCount} pages, but this lesson has ${doc.numPages}. Choose the same file you uploaded.`
        );
      }

      await saveFile(doc.id, bytes);
      setFileBytes(bytes);
      setView("original");
      setAttach({ busy: false, error: "" });
    } catch (err) {
      setAttach({ busy: false, error: err.message || "Couldn't attach the PDF." });
    }
  }

  function handleArticleClick(e) {
    if (e.target.closest && e.target.closest("mark")) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setPending(null);
      setActiveId(null);
    }
  }

  function pickHighlight(highlightId) {
    clearSelection();
    setPending(null);
    setActiveId(highlightId);
  }

  function handleHighlight(color) {
    if (!pending || pending.error) return;

    if (pending.kind === "area") {
      const problem = addHighlight({
        docId: doc.id,
        docTitle: doc.title,
        kind: "area",
        page: pending.page,
        start: Math.round(pending.rects[0].y * 10000), // only used for ordering
        end: Math.round(pending.rects[0].y * 10000),
        rects: pending.rects,
        text: pending.text,
        color,
      });
      if (problem) {
        setPending({ error: problem });
        return;
      }
      closeBar();
      return;
    }

    const overlaps = mine.some(
      (h) =>
        h.kind !== "area" &&
        h.page === pending.page &&
        h.start < pending.end &&
        pending.start < h.end
    );
    if (overlaps) {
      setPending({
        error:
          "That overlaps a highlight you already made. Tap the highlight to change or remove it, or select different text.",
      });
      return;
    }

    const problem = addHighlight({
      docId: doc.id,
      docTitle: doc.title,
      kind: "text",
      page: pending.page,
      start: pending.start,
      end: pending.end,
      text: pending.text,
      color,
    });
    if (problem) {
      setPending({ error: problem });
      return;
    }
    closeBar();
  }

  function handleRemove() {
    if (window.confirm("Remove this highlight?")) {
      removeHighlight(activeId);
      setActiveId(null);
    }
  }

  function handleMakeCard(front, back) {
    const { added } = addCards([{ front, back, subject: doc.subject || "" }]);
    return added
      ? { ok: true, text: "Flashcard added." }
      : { ok: false, text: "You already have a flashcard with that question." };
  }

  function renderTextPage(index) {
    const text = doc.pages[index];
    if (!text) {
      return (
        <div className="reader-text">
          <span className="muted">No selectable text on this page.</span>
        </div>
      );
    }
    return (
      <HighlightedText
        text={text}
        page={index + 1}
        highlights={textHighlightsOn(index + 1)}
        activeId={activeId}
        onPick={pickHighlight}
      />
    );
  }

  return (
    <div className="stack">
      <Link to="/library" className="back-link">
        <ArrowLeft size={18} /> Back to library
      </Link>

      <div>
        <h1>{doc.title}</h1>
        <p className="muted small">
          {doc.numPages} pages · {formatBytes(doc.size)} · added {formatDate(doc.addedAt)}
        </p>
      </div>

      <div className="alert">
        <Highlighter size={18} color="var(--deep-rose)" />
        <span>
          <strong>Highlight what matters.</strong> Select some text (on a phone, press and hold
          a word, then drag the handles) and pick a color. Tap a highlight to add a note, change
          its color, make a flashcard or remove it. Highlights made in one view show in that
          view. <Link to="/highlights">See all highlights</Link>
        </span>
      </div>

      <div className="hl-legend" aria-label="Highlight colors">
        {COLORS.map(([value, label]) => (
          <span key={value}>
            <span className={`hl-dot hl-${value}`} /> {label} (
            {mine.filter((h) => h.color === value).length})
          </span>
        ))}
      </div>

      {!fileBytes && (
        <div className="card card-soft stack">
          <strong>The original PDF isn't saved for this lesson</strong>
          <span className="muted small">
            It was added before originals were kept, or restored from a backup, so only the text
            view is available. Choose the same PDF to show it exactly as it looks. Your
            highlights and notes stay.
          </span>
          <input
            ref={attachRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={attachOriginal}
            hidden
          />
          <div>
            <button
              className="btn btn-soft"
              onClick={() => attachRef.current.click()}
              disabled={attach.busy}
            >
              <FileUp size={16} /> {attach.busy ? "Checking..." : "Attach the original PDF"}
            </button>
          </div>
          {attach.error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{attach.error}</span>
            </div>
          )}
        </div>
      )}

      <div className="card viewer-tools">
        <div className="field">
          <label htmlFor="viewer-subject">Subject</label>
          <select
            id="viewer-subject"
            className="select"
            value={doc.subject}
            onChange={changeSubject}
          >
            <option value="">No subject yet</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>View</label>
          <div className="row">
            <button
              className={`chip ${view === "original" ? "active" : ""}`}
              onClick={() => switchView("original")}
              disabled={!fileBytes}
            >
              Original PDF
            </button>
            <button
              className={`chip ${view === "text" ? "active" : ""}`}
              onClick={() => switchView("text")}
            >
              Text view
            </button>
          </div>
        </div>

        {view === "text" && (
          <div className="field">
            <label>Text size</label>
            <div className="row">
              {[
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${size === value ? "active" : ""}`}
                  onClick={() => setSize(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="check">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => {
              closeBar();
              setShowAll(e.target.checked);
            }}
          />
          Show all pages at once
        </label>
      </div>

      <article
        ref={articleRef}
        className={`card reader reader-${size}${inOriginal ? " reader-original" : ""}`}
        onClick={handleArticleClick}
      >
        {inOriginal ? (
          <PdfPages
            data={fileBytes}
            numbers={showAll ? allNumbers : [pageIndex + 1]}
            total={total}
            highlights={areaHighlights}
            activeId={activeId}
            onPick={pickHighlight}
          />
        ) : showAll ? (
          doc.pages.map((_, i) => (
            <section key={i} className="reader-page">
              <div className="reader-label">Page {i + 1}</div>
              {renderTextPage(i)}
            </section>
          ))
        ) : (
          <section className="reader-page">
            <div className="reader-label">
              Page {pageIndex + 1} of {total}
            </div>
            {renderTextPage(pageIndex)}
          </section>
        )}
      </article>

      {!showAll && (
        <div className="pager">
          <button
            className="btn btn-outline"
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <select
            className="select pager-select"
            value={pageIndex}
            onChange={(e) => goToPage(Number(e.target.value))}
            aria-label="Jump to page"
          >
            {doc.pages.map((_, i) => (
              <option key={i} value={i}>
                Page {i + 1}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline"
            onClick={() => goToPage(pageIndex + 1)}
            disabled={pageIndex === total - 1}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          {inOriginal
            ? "This is your original PDF, shown as it looks in the file. A copy is saved in this browser only, and highlights are saved here too."
            : "This is the text extracted from your PDF. Tables, diagrams and images aren't shown, and some formatting may look different. Highlights are saved in this browser only."}
        </span>
      </div>

      {(pending || active) && <div className="hl-bar-space" aria-hidden="true" />}

      <HighlightBar
        pending={pending}
        active={active}
        onHighlight={handleHighlight}
        onRecolor={(color) => updateHighlight(activeId, { color })}
        onSaveNote={(note) => updateHighlight(activeId, { note: note.trim().slice(0, 500) })}
        onRemove={handleRemove}
        onMakeCard={handleMakeCard}
        onClose={closeBar}
      />
    </div>
  );
}