import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import {
  getRiderOrders,
  getAvailableDeliveries,
  updateOrderStatus,
  updateRiderStatus,
  assignRiderToOrder,
} from "../services/api";
import { Bike, Radio, CheckCircle2, DollarSign, Star, AlertTriangle, MapPin, Phone, Package, Check } from "lucide-react";

function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("my");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const riderId = user && user.id ? user.id : "RID-001";
  const riderName = user && user.name ? user.name : "Swift Delivery Rider";

  async function loadRiderData() {
    try {
      setError("");
      const [assignedRes, availRes] = await Promise.all([
        getRiderOrders(riderId).catch(() => ({ orders: [] })),
        getAvailableDeliveries().catch(() => ({ deliveries: [] })),
      ]);

      setAssignedDeliveries(assignedRes.orders || assignedRes || []);
      setAvailableDeliveries(availRes.deliveries || availRes || []);
    } catch (err) {
      setError("Failed to fetch assigned or available deliveries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRiderData();
  }, [riderId]);

  async function handleToggleStatus() {
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await updateRiderStatus(riderId, nextState ? "AVAILABLE" : "OFFLINE");
    } catch (err) {
      setError("Failed to update status on server.");
    }
  }

  async function handleAcceptAvailableDelivery(orderId) {
    try {
      setError("");
      await assignRiderToOrder(orderId, riderId);
      await loadRiderData();
    } catch (err) {
      setError(err.message || "Failed to claim delivery job.");
    }
  }

  async function handleUpdateDeliveryStatus(orderId, newStatus) {
    try {
      setError("");
      await updateOrderStatus(orderId, newStatus);
      await loadRiderData();
    } catch (err) {
      setError(err.message || "Failed to update delivery status.");
    }
  }

  const activeCount = assignedDeliveries.filter(
    (d) => (d.status || "").toUpperCase() !== "DELIVERED" && (d.status || "").toUpperCase() !== "CANCELLED"
  ).length;

  const completedToday = assignedDeliveries.filter(
    (d) => (d.status || "").toUpperCase() === "DELIVERED"
  ).length;

  const totalEarnings = assignedDeliveries
    .filter((d) => (d.status || "").toUpperCase() === "DELIVERED")
    .reduce((sum, d) => sum + (d.deliveryFee || 1000), 0);

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Rider Portal</div>
          <a href="#deliveries" className="sidebar-link active" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Bike size={16} /> Deliveries ({assignedDeliveries.length})
          </a>
          <a href="#available" className="sidebar-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Radio size={16} /> Available Jobs ({availableDeliveries.length})
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* Status Header */}
        <div className="rider-status-bar">
          <div className="rider-status-info">
            <h3>
              {riderName} — Status:{" "}
              <span style={{ color: isOnline ? "var(--green)" : "var(--text-muted)" }}>
                {isOnline ? "Available & Ready" : "Offline"}
              </span>
            </h3>
            <p style={{ fontSize: 13 }}>
              Toggle status to signal availability for automated dispatching.
            </p>
          </div>
          <div className="toggle-switch">
            <span>{isOnline ? "Online" : "Offline"}</span>
            <button
              className={`toggle ${isOnline ? "on" : ""}`}
              onClick={handleToggleStatus}
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-orange" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Bike size={22} />
            </div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Deliveries</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-value">{completedToday}</div>
            <div className="stat-label">Completed Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-value">₦{totalEarnings.toLocaleString()}</div>
            <div className="stat-label">Delivery Earnings</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-purple" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={22} fill="#8B5CF6" color="#8B5CF6" />
            </div>
            <div className="stat-value">4.9 / 5</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="section-box" id="deliveries">
          <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Order Deliveries</span>
            <div className="filter-row" style={{ marginBottom: 0 }}>
              <button
                className={`filter-pill ${activeTab === "my" ? "active" : ""}`}
                onClick={() => setActiveTab("my")}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                My Deliveries ({assignedDeliveries.length})
              </button>
              <button
                className={`filter-pill ${activeTab === "available" ? "active" : ""}`}
                onClick={() => setActiveTab("available")}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                Available Requests ({availableDeliveries.length})
              </button>
            </div>
          </h3>

          {loading ? (
            <Loading text="Loading deliveries..." />
          ) : activeTab === "my" ? (
            assignedDeliveries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Bike size={48} color="var(--text-muted)" /></div>
                <h3>No assigned deliveries yet</h3>
                <p>Check the "Available Requests" tab to accept open delivery jobs.</p>
              </div>
            ) : (
              assignedDeliveries.map((item, idx) => {
                const itemID = item.id || item.ID || idx;
                const status = (item.status || "PENDING").toUpperCase();
                return (
                  <div className="delivery-card" key={itemID}>
                    <div className="delivery-card-head">
                      <div>
                        <h3>{item.weightKg || item.WeightKg} KG Gas Delivery</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          Order ID: #{String(itemID).toUpperCase()}
                        </p>
                      </div>
                      <span className={`badge badge-${status.toLowerCase()}`}>
                        {status}
                      </span>
                    </div>

                    <div className="delivery-addresses">
                      <div className="addr-row">
                        <div className="addr-dot addr-dot-pickup" />
                        <div>
                          <strong style={{ color: "var(--text)" }}>Pickup Depot: </strong>
                          {item.vendorName || "ABC Gas Station"} ({item.vendorAddress || "Vendor Depot"})
                        </div>
                      </div>
                      <div className="addr-row">
                        <div className="addr-dot addr-dot-delivery" />
                        <div>
                          <strong style={{ color: "var(--text)" }}>Delivery Address: </strong>
                          Lat: {item.latitude || 5.121}, Lng: {item.longitude || 7.373}
                        </div>
                      </div>
                    </div>

                    <div className="delivery-footer">
                      <div className="delivery-meta">
                        <span>Customer ID: <strong>{item.customerId || "CUST"}</strong></span>
                        <span>
                          Fee:{" "}
                          <strong style={{ color: "var(--orange)" }}>
                            ₦{Number(item.deliveryFee || 1000).toLocaleString()}
                          </strong>
                        </span>
                      </div>

                      <div className="delivery-btns">
                        {(status === "RIDER_ASSIGNED" || status === "PREPARING" || status === "ACCEPTED") && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateDeliveryStatus(itemID, "PICKED_UP")}
                          >
                            Mark Picked Up from Depot
                          </button>
                        )}

                        {status === "PICKED_UP" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateDeliveryStatus(itemID, "OUT_FOR_DELIVERY")}
                          >
                            Start Transit (Out for Delivery)
                          </button>
                        )}

                        {status === "OUT_FOR_DELIVERY" && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                            onClick={() => handleUpdateDeliveryStatus(itemID, "DELIVERED")}
                          >
                            Confirm Customer Delivery ✓
                          </button>
                        )}

                        {status === "DELIVERED" && (
                          <span style={{ color: "var(--green)", fontWeight: 600 }}>
                            Delivered ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            availableDeliveries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Radio size={48} color="var(--text-muted)" /></div>
                <h3>No available delivery requests</h3>
                <p>New orders requiring rider dispatch will appear here live.</p>
              </div>
            ) : (
              availableDeliveries.map((item, idx) => {
                const itemID = item.id || item.ID || idx;
                return (
                  <div className="delivery-card" key={itemID}>
                    <div className="delivery-card-head">
                      <div>
                        <h3>{item.weightKg || item.WeightKg} KG Refill Request</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          Order ID: #{String(itemID).toUpperCase()}
                        </p>
                      </div>
                      <span className="badge badge-pending">OPEN DISPATCH</span>
                    </div>

                    <div className="delivery-addresses">
                      <div className="addr-row">
                        <div className="addr-dot addr-dot-pickup" />
                        <div>
                          <strong style={{ color: "var(--text)" }}>Pickup Depot: </strong>
                          {item.vendorName || "ABC Gas Station"}
                        </div>
                      </div>
                    </div>

                    <div className="delivery-footer">
                      <div className="delivery-meta">
                        <span>
                          Payout:{" "}
                          <strong style={{ color: "var(--orange)" }}>
                            ₦{Number(item.deliveryFee || 1000).toLocaleString()}
                          </strong>
                        </span>
                      </div>
                      <div className="delivery-btns">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptAvailableDelivery(itemID)}
                        >
                          Accept Delivery Job
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default RiderDashboard;
