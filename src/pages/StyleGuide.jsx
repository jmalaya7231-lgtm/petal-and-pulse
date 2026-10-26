import { useState } from "react";
import {
  Heart,
  BookOpen,
  Calendar,
  Timer,
  Upload,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
   import Logo from "../components/Logo.jsx";

const colors = [
  { name: "Pale Pink", hex: "#FCE7F0" },
  { name: "Soft Pink", hex: "#F8BBD0" },
  { name: "Rose Pink", hex: "#E879A9" },
  { name: "Deep Rose", hex: "#C44578" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Soft White", hex: "#FFFAFC" },
  { name: "Dark Text", hex: "#49343D" },
  { name: "Muted Text", hex: "#8C7A83" },
  { name: "Light Border", hex: "#F0E1E7" },
];

   export default function StyleGuide() {
  const [checked, setChecked] = useState(true);
  const [progress, setProgress] = useState(60);

  return (
    <>
      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "var(--space-4)" }}>
          <Logo />
        </div>
      </header>

      <main className="container" style={{ paddingBottom: "var(--space-7)" }}>
        <section className="section">
          <h1>Design System</h1>
          <p className="muted">
            A preview of every building block we'll use in Petal &amp; Pulse.
          </p>
        </section>

        {/* Colors */}
        <section className="section">
          <h2>Colors</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            {colors.map((c) => (
              <div className="swatch" key={c.hex}>
                <div className="swatch-color" style={{ background: c.hex }} />
                <div className="swatch-info">
                  <strong>{c.name}</strong>
                  <span className="muted">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="section">
          <h2>Typography</h2>
          <div className="card stack">
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <p>
              Body text uses Nunito at a comfortable size, so long study notes
              stay easy to read.
            </p>
            <p className="muted small">Muted small text for hints and labels.</p>
          </div>
        </section>

        {/* Buttons */}
        <section className="section">
          <h2>Buttons</h2>
          <div className="card">
            <div className="row">
              <button className="btn btn-primary"><Upload size={18} /> Primary</button>
              <button className="btn btn-soft"><Sparkles size={18} /> Soft</button>
              <button className="btn btn-outline">Outline</button>
              <button className="btn btn-primary" disabled>Disabled</button>
              <button className="btn btn-soft btn-icon" aria-label="Favorite">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Forms */}
        <section className="section">
          <h2>Form Fields</h2>
          <div className="card stack">
            <div className="field">
              <label htmlFor="task">Task title</label>
              <input id="task" className="input" placeholder="e.g. Review cardiac pharmacology" />
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <select id="subject" className="select" defaultValue="">
                <option value="" disabled>Choose a subject</option>
                <option>Anatomy and Physiology</option>
                <option>Pharmacology</option>
                <option>Fundamentals of Nursing</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" className="textarea" placeholder="Write something..." />
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              Finished reading chapter 3
            </label>
          </div>
        </section>

        {/* Cards */}
        <section className="section">
          <h2>Cards, Badges and Progress</h2>
          <div className="grid">
            <div className="card card-interactive">
              <BookOpen size={22} color="var(--rose)" />
              <h3 style={{ marginTop: "var(--space-3)" }}>Pharmacology</h3>
              <p className="muted small">3 lessons in your library</p>
              <span className="badge">Subject</span>
            </div>

            <div className="card card-interactive">
              <Calendar size={22} color="var(--rose)" />
              <h3 style={{ marginTop: "var(--space-3)" }}>Quiz on Friday</h3>
              <p className="muted small">Fundamentals of Nursing</p>
              <span className="badge badge-outline">High priority</span>
            </div>

            <div className="card card-soft">
              <Timer size={22} color="var(--deep-rose)" />
              <h3 style={{ marginTop: "var(--space-3)" }}>Sample progress</h3>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ background: "var(--white)" }}
              >
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="muted small" style={{ marginTop: "var(--space-2)" }}>
                {progress}% (demo only)
              </p>
              <button
                className="btn btn-outline"
                onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 20))}
              >
                Change demo value
              </button>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="section">
          <h2>Alerts</h2>
          <div className="stack">
            <div className="alert">
              <Info size={18} color="var(--deep-rose)" />
              <span>Information: your notes are processed in this browser.</span>
            </div>
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>Success: your PDF was read successfully.</span>
            </div>
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>Error: this PDF has no selectable text.</span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}