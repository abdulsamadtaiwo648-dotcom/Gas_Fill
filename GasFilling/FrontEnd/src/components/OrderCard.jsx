function OrderCard({ order }) {
  const statusMap = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
  };

  const statusLabel = order.Status || order.status || "pending";
  const statusClass = statusMap[statusLabel.toLowerCase()] || "status-pending";

  const vendorName =
    order.VendorName || order.Vendor?.Name || "Unknown Vendor";

  const total =
    order.TotalCost ?? order.TotalGasCost ?? 0;

  const weight =
    order.WeightKg ?? order.Weight ?? "—";

  const orderId =
    order.ID || order.id || order.OrderID || "—";

  const createdAt = order.CreatedAt
    ? new Date(order.CreatedAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="order-card">

      <div className="order-card-info">
        <div className="order-id">
          Order #{String(orderId).slice(0, 8).toUpperCase()}
        </div>
        <div className="order-title">
          {weight} KG Gas — {vendorName}
        </div>
        {createdAt && (
          <div className="order-meta">{createdAt}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className={`status-badge ${statusClass}`}>
          {statusLabel}
        </span>
        <div className="order-price">
          ₦{Number(total).toLocaleString()}
        </div>
      </div>

    </div>
  );
}

export default OrderCard;
