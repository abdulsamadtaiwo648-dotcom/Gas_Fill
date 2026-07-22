import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import { getVendorProducts, getVendorOrders, updateOrderStatus } from "../services/api";

function VendorDashboard() {
  const [stock, setStock] = useState([]);
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

  const vendorId = user && user.id ? user.id : "VEND-0001";
  const vendorName = user && user.name ? user.name : "ABC Gas Station";

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          getVendorProducts(vendorId),
          getVendorOrders(vendorId),
        ]);
        setStock(prodRes.products || prodRes || []);
        setOrders(ordRes.orders || ordRes || []);
      } catch (err) {
        setError("Failed to fetch store inventory and incoming orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  async function handleAcceptOrder(orderId) {
    try {
      await updateOrderStatus(orderId, "confirmed");
      const ordRes = await getVendorOrders(vendorId);
      setOrders(ordRes.orders || ordRes || []);
    } catch (err) {
      setError("Failed to update order status on backend.");
    }
  }

  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "Pending").length;
  const deliveredCount = orders.filter(o => o.status === "delivered" || o.status === "Delivered").length;
  const totalRevenue = orders
    .filter(o => o.status === "delivered" || o.status === "Delivered")
    .reduce((sum, o) => sum + (o.totalCost || o.TotalCost || 0), 0);

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Vendor Portal</div>
          <a href="#overview" className="sidebar-link active">
            <span className="icon">🏪</span> Store Overview
          </a>
          <a href="#orders" className="sidebar-link">
            <span className="icon">📋</span> Orders
          </a>
          <a href="#inventory" className="sidebar-link">
            <span className="icon">📦</span> Gas Inventory
          </a>
          <a href="#settings" className="sidebar-link">
            <span className="icon">⚙️</span> Store Settings
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>Vendor Dashboard — {vendorName}</h1>
          <p>Manage gas stock levels, accept customer refill orders, and track sales revenue.</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-orange">📥</div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green">✅</div>
            <div className="stat-value">{deliveredCount}</div>
            <div className="stat-label">Delivered Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue">💰</div>
            <div className="stat-value">₦{totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-purple">🛢️</div>
            <div className="stat-value">{stock.length} Items</div>
            <div className="stat-label">Total Inventory Items</div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="section-box">
          <h3>
            Gas Stock Levels
            <button className="btn btn-outline btn-sm">+ Add Stock</button>
          </h3>
          <div className="table-wrap" style={{ border: "none", boxShadow: "none" }}>
            {loading ? (
              <Loading text="Fetching inventory..." />
            ) : stock.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                No stock inventory records found in database.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product / Size</th>
                    <th>Refill Price</th>
                    <th>Available Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item, idx) => {
                    const weight = item.weightKg || item.WeightKg || "—";
                    return (
                      <tr key={item.id || item.ID || idx}>
                        <td><strong>{item.name || item.Name || `${weight} KG Refill`}</strong></td>
                        <td>₦{Number(item.price || item.Price || 0).toLocaleString()}</td>
                        <td>{weight} KG</td>
                        <td>
                          <span className={`badge ${item.available ? "badge-available" : "badge-cancelled"}`}>
                            {item.available ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Incoming Orders Table */}
        <div className="table-wrap">
          <div className="table-head">
            <h3>Incoming Refill & Purchase Orders</h3>
            <span className="badge badge-pending">{pendingCount} Require Action</span>
          </div>
          {loading ? (
            <Loading text="Loading orders..." />
          ) : orders.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
              No incoming refill orders found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Requested Size</th>
                  <th>Amount</th>
                  <th>Fulfillment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => {
                  const oid = ord.id || ord.ID || idx;
                  const status = ord.status || "Pending";
                  return (
                    <tr key={oid}>
                      <td><strong>#{String(oid).slice(0, 8).toUpperCase()}</strong></td>
                      <td>Customer ({ord.customerId || ord.CustomerID || "CUST"})</td>
                      <td>{ord.weightKg || ord.WeightKg} KG</td>
                      <td><strong>₦{Number(ord.totalCost || ord.TotalCost || 0).toLocaleString()}</strong></td>
                      <td>{ord.fulfillment || "Delivery"}</td>
                      <td>
                        <span className={`badge badge-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        {(status === "pending" || status === "Pending") ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcceptOrder(oid)}
                          >
                            Accept Order
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Accepted</span>
                        )}
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

export default VendorDashboard;
