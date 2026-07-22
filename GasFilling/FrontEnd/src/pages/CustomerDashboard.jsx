import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import { getCustomerOrders } from "../services/api";

function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getCustomerOrders(user.id);
        setOrders(res.orders || res || []);
      } catch (err) {
        setError("Failed to fetch dashboard stats.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-inner" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2>Access Denied</h2>
          <p style={{ margin: "16px 0 24px" }}>Please sign in to view your Customer Dashboard.</p>
          <Link to="/login" className="btn btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  const name = user.firstName || user.name || "Customer";
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length;
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const totalSpent = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalCost || o.TotalCost || 0), 0);

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Customer Portal</div>
          <a href="#overview" className="sidebar-link active">
            <span className="icon">📊</span> Overview
          </a>
          <Link to="/my-orders" className="sidebar-link">
            <span className="icon">📦</span> My Orders
          </Link>
          <Link to="/refill" className="sidebar-link">
            <span className="icon">🔄</span> Refill Gas
          </Link>
          <Link to="/buy-gas" className="sidebar-link">
            <span className="icon">🛢️</span> Buy Gas
          </Link>
          <Link to="/track-order" className="sidebar-link">
            <span className="icon">🚚</span> Track Order
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>Welcome back, {name}</h1>
          <p>Manage your gas refill requests, order history, and account preferences.</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-orange">📦</div>
            <div className="stat-value">{totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue">🔄</div>
            <div className="stat-value">{activeOrders}</div>
            <div className="stat-label">Active Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green">✅</div>
            <div className="stat-value">{completedOrders}</div>
            <div className="stat-label">Completed Deliveries</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-purple">💳</div>
            <div className="stat-value">₦{totalSpent.toLocaleString()}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-box">
          <h3>Quick Order Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Link to="/refill" className="btn btn-primary btn-lg" style={{ justifyContent: "center" }}>
              🔄 Refill Gas Cylinder
            </Link>
            <Link to="/buy-gas" className="btn btn-secondary btn-lg" style={{ justifyContent: "center" }}>
              🛢️ Buy Filled Gas
            </Link>
            <Link to="/buy-cylinder" className="btn btn-secondary btn-lg" style={{ justifyContent: "center" }}>
              🏭 Buy New Cylinder
            </Link>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="table-wrap">
          <div className="table-head">
            <h3>Recent Orders</h3>
            <Link to="/my-orders" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {loading ? (
            <Loading text="Loading stats..." />
          ) : orders.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
              No orders submitted yet.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Vendor</th>
                  <th>Cylinder Size</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((ord, idx) => {
                  const oid = ord.id || ord.ID || idx;
                  const date = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                    : "—";
                  return (
                    <tr key={oid}>
                      <td><strong>#{String(oid).slice(0, 8).toUpperCase()}</strong></td>
                      <td>{ord.vendorName || ord.VendorName || "LPG Depot"}</td>
                      <td>{ord.weightKg || ord.WeightKg} KG</td>
                      <td><strong>₦{Number(ord.totalCost || ord.TotalCost).toLocaleString()}</strong></td>
                      <td>{date}</td>
                      <td>
                        <span className={`badge badge-${ord.status?.toLowerCase() || "pending"}`}>
                          {ord.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default CustomerDashboard;
