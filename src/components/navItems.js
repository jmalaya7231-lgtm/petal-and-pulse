import {
  House,
  BookOpen,
  Highlighter,
  Layers,
  ClipboardList,
  ClipboardPaste,
  CalendarCheck,
  TrendingUp,
  Heart,
  Download,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/library", label: "Study Library", icon: BookOpen },
  { to: "/highlights", label: "Highlights", icon: Highlighter },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/quizzes", label: "Quizzes", icon: ClipboardList },
  { to: "/import", label: "Paste & Import", icon: ClipboardPaste },
  { to: "/planner", label: "Planner", icon: CalendarCheck },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/notes", label: "A Little Note", icon: Heart },
  { to: "/backup", label: "Backup", icon: Download },
];

export default navItems;