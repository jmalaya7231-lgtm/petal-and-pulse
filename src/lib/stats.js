import { dateKey } from "./dates.js";

// The last n days in her local time, oldest first, ending with today
export function lastDays(n = 7) {
  const now = new Date();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({
      key: dateKey(d),
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

const sum = (list) => list.reduce((a, b) => a + b, 0);
const dayOf = (iso) => dateKey(new Date(iso));

function tally(days, events) {
  const counts = new Map(days.map((d) => [d.key, 0]));
  for (const e of events) {
    if (counts.has(e.date)) counts.set(e.date, counts.get(e.date) + e.value);
  }
  return days.map((d) => counts.get(d.key));
}

function averagePercent(attempts) {
  const percents = attempts.filter((a) => a.total > 0).map((a) => (a.score / a.total) * 100);
  return percents.length ? Math.round(sum(percents) / percents.length) : null;
}

// Everything here is counted from saved activity. Nothing is estimated.
export function computeStats({ tasks, checklist, cards, flashLog, attempts, sessions }) {
  const days = lastDays(7);
  const study = sessions.filter((s) => s.kind === "study");

  const doneStamps = [
    ...tasks.filter((t) => t.done && t.doneAt).map((t) => t.doneAt),
    ...checklist.filter((i) => i.done && i.doneAt).map((i) => i.doneAt),
  ];

  const week = {
    minutes: tally(days, study.map((s) => ({ date: dayOf(s.at), value: s.minutes }))),
    cards: tally(days, flashLog.map((e) => ({ date: dayOf(e.at), value: 1 }))),
    quizzes: tally(days, attempts.map((a) => ({ date: dayOf(a.at), value: 1 }))),
    tasks: tally(days, doneStamps.map((at) => ({ date: dayOf(at), value: 1 }))),
  };

  const totals = {
    tasksDone: tasks.filter((t) => t.done).length,
    tasksTotal: tasks.length,
    checklistDone: checklist.filter((i) => i.done).length,
    quizAttempts: attempts.length,
    quizAvg: averagePercent(attempts),
    flashReviews: flashLog.length,
    cardsReviewed: cards.filter((c) => c.reviewed).length,
    cardsTotal: cards.length,
    sessions: study.length,
    minutes: sum(study.map((s) => s.minutes)),
    weekMinutes: sum(week.minutes),
  };

  const hasAny =
    totals.tasksDone +
      totals.checklistDone +
      totals.quizAttempts +
      totals.flashReviews +
      totals.sessions >
    0;

  return { days, week, totals, hasAny };
}

// One row per subject that has any real data
export function subjectBreakdown({ subjects, tasks, cards, attempts, sessions }) {
  const names = new Set(subjects);
  [...tasks, ...cards, ...attempts, ...sessions].forEach((x) => {
    if (x.subject) names.add(x.subject);
  });

  const rows = [...names, ""].map((name) => {
    const t = tasks.filter((x) => (x.subject || "") === name);
    const c = cards.filter((x) => (x.subject || "") === name);
    const a = attempts.filter((x) => (x.subject || "") === name);
    const s = sessions.filter((x) => x.kind === "study" && (x.subject || "") === name);
    return {
      name,
      tasksDone: t.filter((x) => x.done).length,
      tasksTotal: t.length,
      cardsReviewed: c.filter((x) => x.reviewed).length,
      cardsTotal: c.length,
      attempts: a.length,
      quizAvg: averagePercent(a),
      sessions: s.length,
      minutes: sum(s.map((x) => x.minutes)),
    };
  });

  return rows.filter((r) => r.tasksTotal + r.cardsTotal + r.attempts + r.sessions > 0);
}