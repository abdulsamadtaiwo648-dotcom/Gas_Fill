import { Store, FileText, Package, CheckCircle2, DollarSign, Flame, AlertTriangle, Bike } from 'lucide-react';
import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import {
  getVendorProducts,
  getVendorInventory,
  getVendorOrders,
  updateOrderStatus,
  updateVendorInventory,
  getAllRiders,
  assignRiderToOrder,
} from "../services/api";

function VendorDashboard() {
  const [stock, setStock] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stock Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    weightKg: 6,
    pricePerKg: 1200,
    availableStockKg: 500,
    available: true,
  });
  const [submittingStock, setSubmittingStock] = useState(false);

  // Rider Selection State per order
  const [selectedRiders, setSelectedRiders] = useState({});

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const vendorId = user && user.id ? user.id : "VEN-001";
  const vendorName = user && (user.name || user.businessName) ? (user.name || user.businessName) : "ABC Gas Station";

  async function loadDashboardData() {
    try {
      setError("");
      const [prodRes, invRes, ordRes, riderRes] = await Promise.all([
        getVendorProducts(vendorId).catch(() => ({ products: [] })),
        getVendorInventory(vendorId).catch(() => ({ inventory: [] })),
        getVendorOrders(vendorId).catch(() => ({ orders: [] })),
        getAllRiders().catch(() => ({ riders: [] })),
      ]);

      setStock(prodRes.products || prodRes || []);
      setInventoryList(invRes.inventory || invRes || []);
      setOrders(ordRes.orders || ordRes || []);
      setRiders(riderRes.riders || riderRes || []);
    } catch (err) {
      setError("Failed to fetch store inventory and incoming orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [vendorId]);

  async function handleStatusChange(orderId, newStatus) {
    try {
      setError("");
      await updateOrderStatus(orderId, newStatus);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    }
  }

  async function handleAssignRider(orderId) {
    const riderId = selectedRiders[orderId];
    if (!riderId) {
      setError("Please select a rider to assign.");
      return;
    }
    try {
      setError("");
      await assignRiderToOrder(orderId, riderId);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Failed to assign rider to order.");
    }
  }

  async function handleSaveStock(e) {
    e.preventDefault();
    setSubmittingStock(true);
    setError("");

    try {
      await updateVendorInventory({
        vendorId: vendorId,
        weightKg: Number(stockForm.weightKg),
        pricePerKg: Number(stockForm.pricePerKg),
        availableStockKg: Number(stockForm.availableStockKg),
        available: stockForm.available,
      });

      setShowStockModal(false);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || "Failed to update stock inventory.");
    } finally {
      setSubmittingStock(false);
    }
  }

  const pendingCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "pending"
  ).length;

  const deliveredCount = orders.filter(
    (o) => o.status === "DELIVERED" || o.status === "delivered"
  ).length;

  const totalRevenue = orders
    .filter((o) => o.status === "DELIVERED" || o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || o.gasCost || 0), 0);

  const totalStockWeight = inventoryList.reduce(
    (sum, inv) => sum + (inv.availableStockKg || 0),
    0
  );

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Vendor Portal</div>
          <a href="#overview" className="sidebar-link active">
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={16} /> Store Overview</span>
          </a>
          <a href="#orders" className="sidebar-link">
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FileText size={16} /> Orders</span> ({orders.length})
          </a>
          <a href="#inventory" className="sidebar-link">
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Package size={16} /> Gas Stock</span> ({inventoryList.length})
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-header">
          <h1>Vendor Dashboard — {vendorName}</h1>
          <p>
            Manage live gas stock levels, accept customer refill orders, assign riders, and track sales revenue.
          </p>
        </div>

        {error && <div className="alert alert-error"> {error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-orange" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Package size={22} /></div>
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={22} /></div>
            <div className="stat-value">{deliveredCount}</div>
            <div className="stat-label">Delivered Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={22} /></div>
            <div className="stat-value">₦{totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Delivered Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-purple" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Flame size={22} /></div>
            <div className="stat-value">{totalStockWeight.toLocaleString()} KG</div>
            <div className="stat-label">Available LPG Stock</div>
          </div>
        </div>

        {/* Stock Management Modal */}
        {showStockModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
          >
            <div className="form-box" style={{ maxWidth: 480, width: "100%" }}>
              <h2>Update LPG Gas Inventory</h2>
              <p className="form-sub" style={{ marginBottom: 16 }}>
                Set price per KG and total available stock volume for your store.
              </p>

              <form onSubmit={handleSaveStock}>
                <div className="form-group">
                  <label htmlFor="stock-weight">Cylinder Size (KG)</label>
                  <select
                    id="stock-weight"
                    className="form-input"
                    value={stockForm.weightKg}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, weightKg: Number(e.target.value) })
                    }
                  >
                    <option value={3}>3 KG</option>
                    <option value={6}>6 KG</option>
                    <option value={12.5}>12.5 KG</option>
                    <option value={25}>25 KG</option>
                    <option value={50}>50 KG</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stock-price">Price Per KG (₦)</label>
                    <input
                      id="stock-price"
                      type="number"
                      className="form-input"
                      value={stockForm.pricePerKg}
                      onChange={(e) =>
                        setStockForm({ ...stockForm, pricePerKg: Number(e.target.value) })
                      }
                      min="100"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="stock-qty">Available Stock (KG)</label>
                    <input
                      id="stock-qty"
                      type="number"
                      className="form-input"
                      value={stockForm.availableStockKg}
                      onChange={(e) =>
                        setStockForm({
                          ...stockForm,
                          availableStockKg: Number(e.target.value),
                        })
                      }
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={stockForm.available}
                      onChange={(e) =>
                        setStockForm({ ...stockForm, available: e.target.checked })
                      }
                    />
                    Mark Available for Online Customer Orders
                  </label>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={() => setShowStockModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={submittingStock}
                  >
                    {submittingStock ? "Saving..." : "Save Inventory Stock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inventory Section */}
        <div className="section-box" id="inventory">
          <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Gas Stock & Price Levels</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowStockModal(true)}
            >
              + Update Stock & Prices
            </button>
          </h3>
          <div className="table-wrap" style={{ border: "none", boxShadow: "none", marginTop: 12 }}>
            {loading ? (
              <Loading text="Fetching store stock levels..." />
            ) : inventoryList.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                No active stock inventory items found. Click "+ Update Stock & Prices" to add stock.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>LPG Size</th>
                    <th>Price / KG</th>
                    <th>Available Stock</th>
                    <th>Estimated Cost (6kg)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryList.map((item, idx) => {
                    const weight = item.weightKg || item.WeightKg || "—";
                    const pricePerKg = item.pricePerKg || item.PricePerKg || 0;
                    const stockKg = item.availableStockKg ?? 500;
                    const isAvail = item.available && stockKg > 0;
                    return (
                      <tr key={item.id || item.ID || idx}>
                        <td><strong>{weight} KG Gas</strong></td>
                        <td>₦{Number(pricePerKg).toLocaleString()} / kg</td>
                        <td><strong>{stockKg} KG</strong></td>
                        <td>₦{Number(weight * pricePerKg).toLocaleString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              isAvail ? "badge-available" : "badge-cancelled"
                            }`}
                          >
                            {isAvail ? "IN STOCK" : "OUT OF STOCK"}
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
        <div className="table-wrap" id="orders" style={{ marginTop: 24 }}>
          <div className="table-head">
            <h3>Incoming Refill & Delivery Orders</h3>
            <span className="badge badge-pending">{pendingCount} Action Required</span>
          </div>
          {loading ? (
            <Loading text="Loading customer orders..." />
          ) : orders.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
              No incoming refill orders found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer ID</th>
                  <th>Gas Size</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Assigned Rider</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => {
                  const oid = ord.id || ord.ID || idx;
                  const status = (ord.status || "PENDING").toUpperCase();
                  const total = ord.totalAmount || ord.TotalAmount || ord.gasCost || 0;

                  return (
                    <tr key={oid}>
                      <td>
                        <strong>#{String(oid).toUpperCase()}</strong>
                      </td>
                      <td>{ord.customerId || ord.CustomerID || "CUST"}</td>
                      <td>{ord.weightKg || ord.WeightKg} KG</td>
                      <td>
                        <strong>₦{Number(total).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        {ord.riderName ? (
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)" }}>
                            {ord.riderName} ({ord.riderPhone || "Active"})
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <select
                              style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6 }}
                              value={selectedRiders[oid] || ""}
                              onChange={(e) =>
                                setSelectedRiders({ ...selectedRiders, [oid]: e.target.value })
                              }
                            >
                              <option value="">-- Select Rider --</option>
                              {riders.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.phone})
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              onClick={() => handleAssignRider(oid)}
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {status === "PENDING" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStatusChange(oid, "ACCEPTED")}
                            >
                              Accept Order
                            </button>
                          )}

                          {status === "ACCEPTED" && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleStatusChange(oid, "PREPARING")}
                            >
                              Mark Preparing
                            </button>
                          )}

                          {status === "PREPARING" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStatusChange(oid, "RIDER_ASSIGNED")}
                            >
                              Ready for Delivery
                            </button>
                          )}

                          {status === "CANCELLED" && (
                            <span style={{ color: "var(--red)", fontSize: 12 }}>Cancelled</span>
                          )}

                          {status === "DELIVERED" && (
                            <span style={{ color: "var(--green)", fontSize: 12 }}>Completed</span>
                          )}
                        </div>
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
