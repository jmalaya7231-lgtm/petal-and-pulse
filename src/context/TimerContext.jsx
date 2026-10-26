import { createContext, useContext, useEffect, useRef, useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { makeId } from "../lib/format.js";

export const DEFAULT_SETTINGS = { study: 25, shortBreak: 5, longBreak: 15, rounds: 4 };
const MAX_SESSIONS = 5000;

const TimerContext = createContext(null);

export function useTimer() {
  return useContext(TimerContext);
}

export function minutesFor(phase, cfg) {
  if (phase === "study") return cfg.study;
  if (phase === "long") return cfg.longBreak;
  return cfg.shortBreak;
}

export function phaseLabel(phase) {
  if (phase === "study") return "Study";
  if (phase === "long") return "Long break";
  return "Break";
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerProvider({ children }) {
  const [saved, setSaved] = useLocalStorage("pp:timerSettings", DEFAULT_SETTINGS);
  const [sessions, setSessions] = useLocalStorage("pp:sessions", []);
  const settings = { ...DEFAULT_SETTINGS, ...saved };

  const [timer, setTimer] = useState(() => ({
    phase: "study", // "study", "break" or "long"
    running: false,
    endsAt: null,
    remainingMs: settings.study * 60000,
    subject: "",
    cycle: 0, // completed study sessions
  }));
  const [notice, setNotice] = useState("");

  const audioRef = useRef(null);
  const finishing = useRef(false);
  const latest = useRef({});
  latest.current = { settings, sessions, setSessions, timer };

  // Counts down using the real clock, so it stays accurate in background tabs
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      const left = latest.current.timer.endsAt - Date.now();
      if (left <= 0) {
        finishPhase();
      } else {
        setTimer((prev) => (prev.running ? { ...prev, remainingMs: left } : prev));
      }
    }, 250);
    return () => clearInterval(id);
  }, [timer.running]);

  // Show the time in the browser tab title while running
  useEffect(() => {
    document.title = timer.running
      ? `${formatClock(timer.remainingMs)} · ${phaseLabel(timer.phase)} | Petal & Pulse`
      : "Petal & Pulse";
  }, [timer.running, timer.remainingMs, timer.phase]);

  // Warn before closing the page, since a running timer would be lost
  useEffect(() => {
    if (!timer.running) return;
    function warn(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [timer.running]);

  function prepareAudio() {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!audioRef.current) audioRef.current = new Ctor();
      if (audioRef.current.state === "suspended") audioRef.current.resume();
    } catch {
      // Sound is optional
    }
  }

  function beep() {
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Sound is optional
    }
  }

  function finishPhase() {
    if (finishing.current) return;
    finishing.current = true;

    const { timer: t, settings: cfg, sessions: list, setSessions: save } = latest.current;
    const wasStudy = t.phase === "study";

    // A finished phase is recorded. Skipped or reset phases never are.
    save(
      [
        ...list,
        {
          id: makeId(),
          at: new Date().toISOString(),
          kind: wasStudy ? "study" : "break",
          minutes: minutesFor(t.phase, cfg),
          subject: wasStudy ? t.subject : "",
        },
      ].slice(-MAX_SESSIONS)
    );

    const cycle = wasStudy ? t.cycle + 1 : t.cycle;
    const nextPhase = wasStudy ? (cycle % cfg.rounds === 0 ? "long" : "break") : "study";
    const nextMinutes = minutesFor(nextPhase, cfg);

    setTimer({
      phase: nextPhase,
      running: false,
      endsAt: null,
      remainingMs: nextMinutes * 60000,
      subject: t.subject,
      cycle,
    });
    setNotice(
      wasStudy
        ? `Study session complete! Time for a ${nextMinutes}-minute ${
            nextPhase === "long" ? "long break" : "break"
          }.`
        : "Break's over. Ready for another study session?"
    );
    beep();
  }

  function start() {
    prepareAudio();
    finishing.current = false;
    setNotice("");
    setTimer((t) => {
      const remaining =
        t.remainingMs > 0 ? t.remainingMs : minutesFor(t.phase, settings) * 60000;
      return { ...t, running: true, endsAt: Date.now() + remaining, remainingMs: remaining };
    });
  }

  function pause() {
    setTimer((t) =>
      t.running
        ? { ...t, running: false, endsAt: null, remainingMs: Math.max(0, t.endsAt - Date.now()) }
        : t
    );
  }

  function reset() {
    setNotice("");
    setTimer((t) => ({
      ...t,
      running: false,
      endsAt: null,
      remainingMs: minutesFor(t.phase, settings) * 60000,
    }));
  }

  // Moves to the next phase without recording anything
  function skip() {
    setNotice("");
    setTimer((t) => {
      const nextPhase = t.phase === "study" ? "break" : "study";
      return {
        ...t,
        phase: nextPhase,
        running: false,
        endsAt: null,
        remainingMs: minutesFor(nextPhase, settings) * 60000,
      };
    });
  }

  function setSubject(subject) {
    setTimer((t) => ({ ...t, subject }));
  }

  function updateSettings(next) {
    const merged = { ...DEFAULT_SETTINGS, ...next };
    setSaved(merged);
    setTimer((t) =>
      t.running ? t : { ...t, remainingMs: minutesFor(t.phase, merged) * 60000 }
    );
  }

  const value = {
    timer,
    settings,
    sessions,
    notice,
    clearNotice: () => setNotice(""),
    start,
    pause,
    reset,
    skip,
    setSubject,
    updateSettings,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}