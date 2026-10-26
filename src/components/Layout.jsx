import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo.jsx";
import MiniTimer from "./MiniTimer.jsx";
import navItems from "./navItems.js";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu when Escape is pressed
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      {/* Top bar (phones and small screens only) */}
      <header className="topbar">
        <Logo size={32} showText={false} />
        <span className="topbar-title">Petal &amp; Pulse</span>
        <button
          className="btn btn-soft btn-icon"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Dark overlay behind the open mobile menu */}
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar (always visible on laptops, slide-in on phones) */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo />
          <button
            className="btn btn-outline btn-icon sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-foot muted small">Made with love, for you. 💗</p>
      </aside>

      {/* Page content */}
      <main className="main">
        <div className="page">
          <MiniTimer />
          <Outlet />
        </div>
      </main>
    </div>
  );
}