import { useRef, useState } from "react";
import { Upload, FileText, X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { extractPdfText, MAX_FILE_MB } from "../lib/pdfExtract.js";
import { saveFile } from "../lib/db.js";
import { formatBytes, makeId } from "../lib/format.js";

export default function UploadBox({ subjects, onAdd }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ page: 0, total: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function chooseFile(chosen) {
    setError("");
    setSuccess("");
    if (!chosen) return;

    const looksLikePdf =
      chosen.type === "application/pdf" || chosen.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) {
      setFile(null);
      setError("That doesn't look like a PDF. Please choose a .pdf file.");
      return;
    }
    if (chosen.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      setError(`That file is larger than ${MAX_FILE_MB} MB. Try a smaller PDF.`);
      return;
    }

    setFile(chosen);
    setTitle(chosen.name.replace(/\.pdf$/i, ""));
  }

  function onInputChange(e) {
    chooseFile(e.target.files[0]);
    e.target.value = ""; // lets you pick the same file again later
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    chooseFile(e.dataTransfer.files[0]);
  }

  function removeFile() {
    setFile(null);
    setTitle("");
    setError("");
    setProgress({ page: 0, total: 0 });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || busy) return;

    setBusy(true);
    setError("");
    setSuccess("");
    setProgress({ page: 0, total: 0 });

    try {
      const result = await extractPdfText(file, (page, total) =>
        setProgress({ page, total })
      );

      const id = makeId();
      const name = title.trim() || file.name;

      await onAdd({
        id,
        title: title.trim().slice(0, 120) || file.name,
        filename: file.name,
        size: file.size,
        numPages: result.numPages,
        charCount: result.charCount,
        pages: result.pages,
        subject,
        addedAt: new Date().toISOString(),
      });

      // Keep a copy of the original PDF so it can be shown exactly as it looks
      let keptOriginal = true;
      try {
        await saveFile(id, await file.arrayBuffer());
      } catch {
        keptOriginal = false;
      }

      setSuccess(
        keptOriginal
          ? `"${name}" was added to your library.`
          : `"${name}" was added, but there wasn't enough browser storage to keep the original PDF, so it opens in text view only.`
      );
      setFile(null);
      setTitle("");
    } catch (err) {
      setError(err.message || "Something went wrong while reading this PDF.");
    } finally {
      setBusy(false);
    }
  }

  const percent = progress.total ? Math.round((progress.page / progress.total) * 100) : 0;

  return (
    <div className="card stack">
      <h3>Add a lesson</h3>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onInputChange}
        hidden
      />

      {!file && (
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload size={26} color="var(--rose)" />
          <strong>Drop a PDF here</strong>
          <span className="muted small">or choose one from your phone or computer</span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => inputRef.current.click()}
          >
            Choose PDF
          </button>
          <span className="muted small">PDF only, up to {MAX_FILE_MB} MB</span>
        </div>
      )}

      {file && (
        <form className="stack" onSubmit={handleSubmit}>
          <div className="file-row">
            <FileText size={22} color="var(--rose)" />
            <div className="file-info">
              <strong className="file-name">{file.name}</strong>
              <span className="muted small">{formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={() => inputRef.current.click()}
              disabled={busy}
              aria-label="Replace file"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={removeFile}
              disabled={busy}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>

          <div className="field">
            <label htmlFor="lesson-title">Lesson title</label>
            <input
              id="lesson-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              disabled={busy}
            />
          </div>

          <div className="field">
            <label htmlFor="lesson-subject">Subject</label>
            <select
              id="lesson-subject"
              className="select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
            >
              <option value="">No subject yet</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {busy && (
            <div>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="muted small" style={{ marginTop: "var(--space-2)" }}>
                {progress.total
                  ? `Reading page ${progress.page} of ${progress.total}...`
                  : "Opening PDF..."}
              </p>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Reading..." : "Read and add to library"}
          </button>
        </form>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}