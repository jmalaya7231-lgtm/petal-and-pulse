import { Link, useLocation } from "react-router-dom";
import { Timer } from "lucide-react";
import { useTimer, phaseLabel, formatClock } from "../context/TimerContext.jsx";

export default function MiniTimer() {
  const { timer } = useTimer();
  const { pathname } = useLocation();

  if (!timer.running || pathname === "/planner") return null;

  return (
    <Link to="/planner" className="mini-timer" aria-label="Open the timer">
      <Timer size={16} />
      {phaseLabel(timer.phase)} {formatClock(timer.remainingMs)}
    </Link>
  );
}