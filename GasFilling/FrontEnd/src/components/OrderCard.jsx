import { Link } from "react-router-dom";
import { cancelOrder } from "../services/api";
import { Bike, MapPin } from "lucide-react";

function OrderCard({ order, onCancelled }) {
  const statusLabel = (order.Status || order.status || "PENDING").toUpperCase();

  const vendorName =
    order.vendorName || order.VendorName || order.Vendor?.Name || "ABC Gas Station";
  const vendorAddress = order.vendorAddress || order.VendorAddress || "Partner Depot";

  const total =
    order.totalAmount || order.TotalAmount || order.totalCost || order.TotalCost || order.gasCost || 0;

  const weight = order.weightKg ?? order.WeightKg ?? "—";
  const orderId = order.id || order.ID || "—";
  const riderName = order.riderName;
  const riderPhone = order.riderPhone;

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this refill order?")) return;
    try {
      await cancelOrder(orderId, order.customerId || order.CustomerID);
      if (onCancelled) onCancelled();
    } catch (err) {
      alert(err.message || "Failed to cancel order.");
    }
  }

  return (
    <div
      className="order-card"
      style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Order #{String(orderId).toUpperCase()}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>
            {weight} KG LPG Gas Refill
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Depot: <strong style={{ color: "var(--text-2)" }}>{vendorName}</strong>
            {vendorAddress !== "Partner Depot" && ` • ${vendorAddress}`}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {dateStr}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span className={`badge badge-${statusLabel.toLowerCase()}`} style={{ fontSize: 11 }}>
            {statusLabel}
          </span>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>
            ₦{Number(total).toLocaleString()}
          </div>
        </div>
      </div>

      {riderName && (
        <div style={{ backgroundColor: "var(--bg-gray)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Bike size={16} /> <strong>Assigned Rider:</strong> {riderName} {riderPhone ? `(${riderPhone})` : ""}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
        <Link to={`/track-order?orderId=${orderId}`} className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} /> Track Delivery →
        </Link>

        {statusLabel === "PENDING" && (
          <button onClick={handleCancel} className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderCard;

