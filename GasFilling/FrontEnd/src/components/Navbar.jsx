import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar({ theme, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "active" : "";

  return (
    <>
      <header className="navbar">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">🔥</div>
          <div className="logo-text">Gas<span>Fill</span></div>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className={isActive("/")}>Home</Link>
          <Link to="/refill" className={isActive("/refill")}>Refill Gas</Link>
          <Link to="/buy-gas" className={isActive("/buy-gas")}>Buy Gas</Link>
        </nav>

        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>

        <button
          className="navbar-hamburger"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <nav className={`navbar-mobile ${mobileOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link to="/refill" onClick={() => setMobileOpen(false)}>Refill Gas</Link>
        <Link to="/buy-gas" onClick={() => setMobileOpen(false)}>Buy Gas</Link>
        <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14 }}>Theme</span>
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
        </div>
        <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
        <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
      </nav>
    </>
  );
}

export default Navbar;