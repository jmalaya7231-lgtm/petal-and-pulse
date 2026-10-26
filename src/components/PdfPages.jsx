import { useEffect, useRef, useState } from "react";
import pdfjsLib from "../lib/pdfjs.js";


function PdfPage({ pdf, number, width, lazy, highlights, activeId, onPick }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textRef = useRef(null);
  const [near, setNear] = useState(!lazy);
  const [dims, setDims] = useState(null);
  const [error, setError] = useState("");

  // In long lists, only draw pages that are close to the screen
  useEffect(() => {
    if (!lazy) {
      setNear(true);
      return;
    }
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "1200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  // Draw the page and its selectable text
  useEffect(() => {
    if (!near || !width) return;
    let cancelled = false;
    let renderTask = null;
    let textLayer = null;

    (async () => {
      try {
        const page = await pdf.getPage(number);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const viewport = page.getViewport({ scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        const textDiv = textRef.current;
        if (!wrap || !canvas || !textDiv) return;

        wrap.style.setProperty("--scale-factor", String(scale));
        wrap.style.setProperty("--total-scale-factor", String(scale));
        wrap.style.setProperty("--user-unit", "1");

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        setDims({ w: viewport.width, h: viewport.height });

        renderTask = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        });
        await renderTask.promise;
        if (cancelled) return;

        textDiv.replaceChildren();
        textLayer = new pdfjsLib.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textDiv,
          viewport,
        });
        await textLayer.render();
        page.cleanup();
      } catch (err) {
        if (cancelled || (err && err.name === "RenderingCancelledException")) return;
        setError("This page couldn't be shown.");
      }
    })();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
      if (textLayer) textLayer.cancel();
    };
  }, [near, width, pdf, number]);

  // Free memory for pages that scrolled far away
  useEffect(() => {
    if (near) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    if (textRef.current) textRef.current.replaceChildren();
  }, [near]);

  function handleClick(e) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const box = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    const hit = highlights.find((h) =>
      h.rects.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
    );
    if (hit) {
      e.stopPropagation();
      onPick(hit.id);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="pdf-page"
      data-pdf-page={number}
      style={{
        width: dims ? dims.w : width,
        height: dims ? dims.h : Math.round(width * 1.35),
        maxWidth: "100%",
      }}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} />

      <div className="pdf-hl-layer" aria-hidden="true">
        {highlights.map((h) =>
          h.rects.map((r, i) => (
            <div
              key={`${h.id}-${i}`}
              data-hl={i === 0 ? h.id : undefined}
              className={`pdf-hl hl-${h.color}${activeId === h.id ? " active" : ""}`}
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${r.w * 100}%`,
                height: `${r.h * 100}%`,
              }}
            />
          ))
        )}
      </div>

      <div ref={textRef} className="textLayer" />
      {error && <p className="pdf-error muted small">{error}</p>}
    </div>
  );
}

export default function PdfPages({ data, numbers, total, highlights, activeId, onPick }) {
  const boxRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState("");

  // Fit the pages to the available width
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, Math.floor(el.clientWidth)));
    measure();

    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 200);
    });
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Open the saved PDF
  useEffect(() => {
    let cancelled = false;
    let task = null;
    setPdf(null);
    setError("");

    (async () => {
      try {
        // A copy is used because PDF.js takes ownership of the bytes it is given
        task = pdfjsLib.getDocument({ data: data.slice(0) });
        const loaded = await task.promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) {
          setError("The original PDF couldn't be opened. You can still use the text view.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (task) {
        task.destroy().catch(() => {});
      }
    };
  }, [data]);

  return (
    <div ref={boxRef} className="pdf-box">
      {error && <p className="muted">{error}</p>}
      {!error && !pdf && <p className="muted small">Opening PDF...</p>}

      {pdf &&
        width > 0 &&
        numbers.map((n) => (
          <section key={`${n}-${width}`} className="reader-page">
            <div className="reader-label">
              Page {n}
              {numbers.length === 1 ? ` of ${total}` : ""}
            </div>
            <PdfPage
              pdf={pdf}
              number={n}
              width={width}
              lazy={numbers.length > 1}
              highlights={highlights.filter((h) => h.page === n)}
              activeId={activeId}
              onPick={onPick}
            />
          </section>
        ))}
    </div>
  );
}