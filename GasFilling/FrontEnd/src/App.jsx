import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";

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
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/"                 element={<Home />}              />
        <Route path="/refill"           element={<RefillGas />}         />
        <Route path="/buy-gas"          element={<BuyGas />}            />
        <Route path="/buy-cylinder"     element={<BuyCylinder />}       />
        <Route path="/login"            element={<Login />}             />
        <Route path="/register"         element={<Register />}          />
        <Route path="/dashboard"        element={<CustomerDashboard />} />
        <Route path="/vendor-dashboard"  element={<VendorDashboard />}  />
        <Route path="/rider-dashboard"   element={<RiderDashboard />}   />
        <Route path="/my-orders"        element={<MyOrders />}          />
        <Route path="/track-order"      element={<TrackOrder />}        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;