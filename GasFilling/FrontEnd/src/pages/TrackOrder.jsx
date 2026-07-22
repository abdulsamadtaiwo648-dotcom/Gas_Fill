import { useState } from "react";
import { getOrderById } from "../services/api";

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setSearched(true);
    setResult(null);

    if (!orderId.trim()) {
      setError("Please enter a valid Order ID.");
      return;
    }

    setLoading(true);
    try {
      const data = await getOrderById(orderId.trim());
      setResult(data);
    } catch (err) {
      setError("Order not found or backend server error.");
    } finally {
      setLoading(false);
    }
  }

  const status = (result?.status || result?.Status || "pending").toLowerCase();

  const timelineSteps = [
    { icon: "📋", label: "Order Placed",    desc: "Order has been submitted.", done: true },
    { icon: "✅", label: "Order Accepted",  desc: "Vendor confirmed availability.", done: status === "confirmed" || status === "delivered" },
    { icon: "🚚", label: "Out for Delivery", desc: "Rider has picked up the gas.", done: status === "delivered" },
    { icon: "🎉", label: "Delivered",       desc: "Delivered to your address.", done: status === "delivered" },
  ];

  return (
    <div className="track-page">
      <div className="track-inner">
        <span className="tag">🚚 Track Order</span>
        <h1 style={{ marginTop: 12, marginBottom: 8 }}>
          Track Your Gas Delivery
        </h1>
        <p>Enter your unique order ID below to see the real-time status timeline.</p>

        {/* Search Form */}
        <form className="track-search" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter Order ID (e.g. ORD-0001)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Track →"}
          </button>
        </form>

        {/* Error */}
        {searched && error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="track-result">
            <div className="track-top">
              <div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                  Order ID: #{result.id || result.ID}
                </p>
                <h2 style={{ marginBottom: 4 }}>{result.weightKg || result.WeightKg} KG Gas Refill</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Fulfillment: {result.fulfillment || "Delivery"}
                </p>
              </div>
              <span className={`badge badge-${status}`}>
                {status.toUpperCase()}
              </span>
            </div>

            <div className="track-details">
              <div className="track-detail">
                <label>Vendor Station</label>
                <span>ABC Gas Station</span>
              </div>
              <div className="track-detail">
                <label>Fulfillment Cost</label>
                <span>₦{Number(result.totalCost || result.TotalCost || 0).toLocaleString()}</span>
              </div>
              <div className="track-detail">
                <label>Size / Weight</label>
                <span>{result.weightKg || result.WeightKg} KG</span>
              </div>
              <div className="track-detail">
                <label>Delivery Fee</label>
                <span>₦{Number(result.deliveryFee || result.DeliveryFee || 1000).toLocaleString()}</span>
              </div>
            </div>

            <h3 style={{ marginBottom: 20, fontSize: 15 }}>Delivery Progress</h3>

            <div className="timeline">
              {timelineSteps.map((step, i) => (
                <div className="tl-item" key={i}>
                  <div className={`tl-dot ${step.done ? "done" : ""}`}>
                    {step.icon}
                  </div>
                  <div className="tl-body">
                    <h4 style={{ color: step.done ? "var(--text)" : "var(--text-muted)" }}>
                      {step.label}
                    </h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackOrder;
