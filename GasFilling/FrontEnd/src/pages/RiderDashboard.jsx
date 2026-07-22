import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import { getVendorOrders, updateOrderStatus } from "../services/api";

function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const defaultVendorId = "VEND-0001"; // Fetch from default sample store

  useEffect(() => {
    (async () => {
      try {
        const res = await getVendorOrders(defaultVendorId);
        const list = res.orders || res || [];
        setDeliveries(list);
      } catch (err) {
        setError("Failed to fetch assigned deliveries.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function updateStatus(id, newStatus) {
    setError("");
    try {
      await updateOrderStatus(id, newStatus);
      // Refresh list
      const res = await getVendorOrders(defaultVendorId);
      setDeliveries(res.orders || res || []);
    } catch (err) {
      setError("Failed to update status on server.");
    }
  }

  const filteredDeliveries = activeTab === "all"
    ? deliveries
    : deliveries.filter((d) => (d.status || "").toLowerCase() === activeTab.toLowerCase());

  const totalEarnings = deliveries
    .filter((d) => (d.status || "").toLowerCase() === "delivered")
    .reduce((sum, d) => sum + (d.deliveryFee || 1000), 0);

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Rider Portal</div>
          <a href="#overview" className="sidebar-link active">
            <span className="icon">🛵</span> Deliveries
          </a>
          <a href="#earnings" className="sidebar-link">
            <span className="icon">💳</span> Earnings
          </a>
          <a href="#profile" className="sidebar-link">
            <span className="icon">👤</span> Profile
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* Status Header */}
        <div className="rider-status-bar">
          <div className="rider-status-info">
            <h3>Rider Status: <span style={{ color: isOnline ? "var(--green)" : "var(--text-muted)" }}>{isOnline ? "Online & Ready" : "Offline"}</span></h3>
            <p style={{ fontSize: 13 }}>Toggle status to accept or pause incoming delivery requests.</p>
          </div>
          <div className="toggle-switch">
            <span>{isOnline ? "Available" : "Offline"}</span>
            <button
              className={`toggle ${isOnline ? "on" : ""}`}
              onClick={() => setIsOnline(!isOnline)}
            />
          </div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-orange">🛵</div>
            <div className="stat-value">{deliveries.filter(d => (d.status || "").toLowerCase() !== 'delivered').length}</div>
            <div className="stat-label">Active Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green">✅</div>
            <div className="stat-value">{deliveries.filter(d => (d.status || "").toLowerCase() === 'delivered').length}</div>
            <div className="stat-label">Completed Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue">💰</div>
            <div className="stat-value">₦{totalEarnings.toLocaleString()}</div>
            <div className="stat-label">Today's Earnings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-purple">⭐</div>
            <div className="stat-value">4.9 / 5</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="section-box">
          <h3>
            Assigned Deliveries
            <div className="filter-row" style={{ marginBottom: 0 }}>
              {["all", "pending", "confirmed", "delivered"].map((tab) => (
                <button
                  key={tab}
                  className={`filter-pill ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ fontSize: 12, padding: "4px 12px" }}
                >
                  {tab === "all" ? "All" : tab.toUpperCase()}
                </button>
              ))}
            </div>
          </h3>

          {loading ? (
            <Loading text="Loading active deliveries..." />
          ) : filteredDeliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛵</div>
              <h3>No deliveries found</h3>
              <p>No active delivery requests match the selected status.</p>
            </div>
          ) : (
            filteredDeliveries.map((item, idx) => {
              const itemID = item.id || item.ID || idx;
              const status = item.status || "Pending";
              return (
                <div className="delivery-card" key={itemID}>
                  <div className="delivery-card-head">
                    <div>
                      <h3>{item.weightKg || item.WeightKg} KG Gas Delivery</h3>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Order ID: #{String(itemID).slice(0, 8).toUpperCase()}</p>
                    </div>
                    <span className={`badge badge-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>

                  <div className="delivery-addresses">
                    <div className="addr-row">
                      <div className="addr-dot addr-dot-pickup" />
                      <div>
                        <strong style={{ color: "var(--text)" }}>Pickup: </strong>
                        ABC Gas Station (Aba Road)
                      </div>
                    </div>
                    <div className="addr-row">
                      <div className="addr-dot addr-dot-delivery" />
                      <div>
                        <strong style={{ color: "var(--text)" }}>Delivery Address: </strong>
                        Customer Location (Latitude: {item.latitude}, Longitude: {item.longitude})
                      </div>
                    </div>
                  </div>

                  <div className="delivery-footer">
                    <div className="delivery-meta">
                      <span>Recipient ID: <strong>{item.customerId}</strong></span>
                      <span>Delivery Fee: <strong style={{ color: "var(--orange)" }}>₦{Number(item.deliveryFee || 1000).toLocaleString()}</strong></span>
                    </div>

                    <div className="delivery-btns">
                      {(status === "pending" || status === "Pending") && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateStatus(itemID, "confirmed")}
                        >
                          Start Delivery
                        </button>
                      )}
                      {(status === "confirmed" || status === "Confirmed") && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--green)", borderColor: "var(--green)" }}
                          onClick={() => updateStatus(itemID, "delivered")}
                        >
                          Mark Delivered ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default RiderDashboard;
