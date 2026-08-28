import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Store, Bike, Moon, Sun } from "lucide-react";

function Navbar({ theme, onToggleTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const getDashboardPath = (u) => {
    if (!u) return "/";
    const role = u.role || "customer";
    if (role === "vendor") return "/vendor-dashboard";
    if (role === "rider") return "/rider-dashboard";
    return "/dashboard";
  };

  const dashboardPath = getDashboardPath(user);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setMobileOpen(false);
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ? "active" : "";

  return (
    <>
      <header className="navbar">
        <Link to={user ? dashboardPath : "/"} className="navbar-logo">
          <div className="logo-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={20} color="var(--orange)" />
          </div>
          <div className="logo-text">Gas<span>Fill</span></div>
        </Link>

        <nav className="navbar-links">
          {!user && (
            <>
              <Link to="/" className={isActive("/")}>Home</Link>
              <Link to="/refill" className={isActive("/refill")}>Refill Gas</Link>
              <Link to="/buy-gas" className={isActive("/buy-gas")}>Buy Gas</Link>
            </>
          )}

          {user && (user.role === "customer" || !user.role) && (
            <>
              <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
            </>
          )}

          {user && user.role === "vendor" && (
            <Link to="/vendor-dashboard" className={isActive("/vendor-dashboard")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Store size={16} /> Vendor Portal
              </span>
            </Link>
          )}

          {user && user.role === "rider" && (
            <Link to="/rider-dashboard" className={isActive("/rider-dashboard")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Bike size={16} /> Rider Portal
              </span>
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            aria-label="Toggle theme"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {user.name || user.firstName || user.email || "Account"}
                <span className="badge badge-pending" style={{ marginLeft: 6, fontSize: 10, textTransform: "uppercase" }}>
                  {user.role || "Customer"}
                </span>
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
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
        {!user && (
          <>
            <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/refill" onClick={() => setMobileOpen(false)}>Refill Gas</Link>
            <Link to="/buy-gas" onClick={() => setMobileOpen(false)}>Buy Gas</Link>
          </>
        )}

        {user && (user.role === "customer" || !user.role) && (
          <>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          </>
        )}

        {user && user.role === "vendor" && (
          <Link to="/vendor-dashboard" onClick={() => setMobileOpen(false)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Store size={16} /> Vendor Portal
            </span>
          </Link>
        )}

        {user && user.role === "rider" && (
          <Link to="/rider-dashboard" onClick={() => setMobileOpen(false)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Bike size={16} /> Rider Portal
            </span>
          </Link>
        )}

        <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14 }}>Theme</span>
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {theme === "light" ? (
              <>
                <Moon size={16} /> Dark Mode
              </>
            ) : (
              <>
                <Sun size={16} /> Light Mode
              </>
            )}
          </button>
        </div>

        {user ? (
          <div style={{ padding: "12px 24px" }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
              Logged in as {user.name || user.email} ({user.role || "Customer"})
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-full">
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
          </>
        )}
      </nav>
    </>
  );
}

export default Navbar;