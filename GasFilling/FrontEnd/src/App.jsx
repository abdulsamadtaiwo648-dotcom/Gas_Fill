import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Search } from "lucide-react";
import "./App.css";

import Navbar         from "./components/Navbar";
import ErrorBoundary  from "./components/ErrorBoundary";

import Home              from "./pages/Home";
import RefillGas         from "./pages/RefillGas";
import BuyGas            from "./pages/BuyGas";
import BuyCylinder       from "./pages/BuyCylinder";
import Login             from "./pages/Login";
import Register          from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import VendorDashboard   from "./pages/VendorDashboard";
import RiderDashboard    from "./pages/RiderDashboard";
import MyOrders          from "./pages/MyOrders";
import TrackOrder        from "./pages/TrackOrder";

function getDashboardPath(user) {
  if (!user) return "/login";
  const role = user.role || "customer";
  if (role === "vendor") return "/vendor-dashboard";
  if (role === "rider") return "/rider-dashboard";
  return "/dashboard";
}

function HomeGuard({ children }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  if (user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  if (user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || "customer";
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <Routes>
          <Route
            path="/"
            element={
              <HomeGuard>
                <Home />
              </HomeGuard>
            }
          />
          <Route path="/refill"           element={<RefillGas />}         />
          <Route path="/buy-gas"          element={<BuyGas />}            />
          <Route path="/buy-cylinder"     element={<BuyCylinder />}       />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <ErrorBoundary>
                  <CustomerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <ErrorBoundary>
                  <VendorDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rider-dashboard"
            element={
              <ProtectedRoute allowedRoles={["rider"]}>
                <ErrorBoundary>
                  <RiderDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route path="/track-order"      element={<TrackOrder />}        />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "inline-flex", justifyContent: "center" }}><Search size={64} color="var(--orange)" /></div>
              <h2>Page Not Found</h2>
              <p style={{ color: "var(--text-muted)" }}>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary">← Go Home</a>
            </div>
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;