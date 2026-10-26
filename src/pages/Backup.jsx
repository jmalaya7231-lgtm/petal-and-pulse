import { useEffect, useRef, useState } from "react";
import { Download, Upload, Info, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage.js";
import {
  createBackup,
  downloadBackup,
  parseBackup,
  describeBackup,
  restoreBackup,
  MAX_BACKUP_MB,
} from "../lib/backup.js";
import { formatBytes, formatDate } from "../lib/format.js";

export default function Backup() {
  const inputRef = useRef(null);
  const [lastBackup, setLastBackup] = useLocalStorage("pp:lastBackup", null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  // After a restore the page reloads, so show the result here
  useEffect(() => {
    try {
      if (sessionStorage.getItem("pp:restored")) {
        sessionStorage.removeItem("pp:restored");
        setMessage({ type: "success", text: "Restore complete. Your data is back." });
      }
    } catch {
      // Not important
    }
  }, []);

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    try {
      const backup = await createBackup();
      const name = downloadBackup(backup);
      setLastBackup(new Date().toISOString());
      setMessage({
        type: "success",
        text: `Backup created: ${name}. Keep it somewhere safe. It contains all your saved study data and is not encrypted.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Couldn't create the backup." });
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    setMessage(null);
    setPreview(null);
    if (!file) return;

    if (file.size > MAX_BACKUP_MB * 1024 * 1024) {
      setMessage({ type: "error", text: `That file is larger than ${MAX_BACKUP_MB} MB.` });
      return;
    }

    setBusy(true);
    try {
      const parsed = parseBackup(await file.text());
      setPreview({ fileName: file.name, size: file.size, parsed });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmRestore() {
    const sure = window.confirm(
      "Restore this backup? It replaces the matching saved data in this browser, and the page will reload."
    );
    if (!sure) return;

    setBusy(true);
    try {
      await restoreBackup(preview.parsed);
      try {
        sessionStorage.setItem("pp:restored", "1");
      } catch {
        // Not important
      }
      window.location.reload();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "The restore stopped partway. Try again, or restore into a fresh browser.",
      });
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Backup</h1>
        <p className="muted">Save a copy of your study data, or move it to another device.</p>
      </div>

      <div className="alert">
        <Info size={18} color="var(--deep-rose)" />
        <span>
          Your data lives <strong>in this browser only</strong>. It isn't backed up or synced
          anywhere. Clearing browser data can erase it, and Safari on iPhone can clear data
          for sites you haven't opened in a while. A backup file is the safe way to keep it.
        </span>
      </div>

      {message && (
        <div
          className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <section className="card stack">
        <h3 style={{ margin: 0 }}>Save a backup</h3>
        <p className="muted small" style={{ margin: 0 }}>
          Downloads one file with your lessons (the extracted text, not the original PDFs),
          flashcards, quizzes and scores, tasks, timer sessions, notes and settings.
        </p>
        <p className="small" style={{ margin: 0 }}>
          <strong>Last backup:</strong>{" "}
          {lastBackup ? formatDate(lastBackup) : "Never. Make one now."}
        </p>
        <div>
          <button className="btn btn-primary" onClick={handleExport} disabled={busy}>
            <Download size={18} /> Download backup
          </button>
        </div>
        <div className="alert">
          <ShieldAlert size={18} color="var(--deep-rose)" />
          <span>
            The backup file isn't encrypted, so anyone who gets it can read your notes. Store
            it somewhere private.
          </span>
        </div>
      </section>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>Restore from a backup</h3>
        <p className="muted small" style={{ margin: 0 }}>
          Choose a backup file from this app. You'll see what's inside before anything changes.
          Restoring replaces the saved lists in this browser with the ones in the file, so it's
          best done on a new device or after a data loss.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          hidden
        />
        <div>
          <button
            className="btn btn-soft"
            onClick={() => inputRef.current.click()}
            disabled={busy}
          >
            <Upload size={18} /> Choose backup file
          </button>
        </div>

        {preview && (
          <div className="stack">
            <div className="card card-soft stack">
              <strong>{preview.fileName}</strong>
              <span className="muted small">
                {formatBytes(preview.size)}
                {preview.parsed.exportedAt &&
                  ` · made on ${formatDate(preview.parsed.exportedAt)}`}
              </span>
              <ul className="mini-list">
                {describeBackup(preview.parsed).map(([label, n]) => (
                  <li key={label}>
                    <span>
                      <strong>{n}</strong> {label.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
              {preview.parsed.skipped > 0 && (
                <span className="muted small">
                  {preview.parsed.skipped} damaged lesson
                  {preview.parsed.skipped === 1 ? " was" : "s were"} skipped.
                </span>
              )}
            </div>
            <div className="row">
              <button className="btn btn-primary" onClick={confirmRestore} disabled={busy}>
                Restore this backup
              </button>
              <button className="btn btn-outline" onClick={() => setPreview(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}