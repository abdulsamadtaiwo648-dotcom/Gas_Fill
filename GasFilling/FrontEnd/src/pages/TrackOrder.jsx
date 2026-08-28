import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getOrderById } from "../services/api";
import { FileText, CheckCircle2, FlaskConical, Bike, Package, Truck, PartyPopper, AlertTriangle } from "lucide-react";

function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function fetchOrder(idToSearch) {
    if (!idToSearch.trim()) return;
    setError("");
    setSearched(true);
    setLoading(true);
    try {
      const data = await getOrderById(idToSearch.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || "Order not found or backend server error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const urlParam = searchParams.get("orderId");
    if (urlParam) {
      setOrderId(urlParam);
      fetchOrder(urlParam);
    }
  }, [searchParams]);

  async function handleSearch(e) {
    e.preventDefault();
    fetchOrder(orderId);
  }

  const rawStatus = (result?.status || result?.Status || "PENDING").toUpperCase();

  const statusOrder = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "RIDER_ASSIGNED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  const currentStepIndex = statusOrder.indexOf(rawStatus);

  const timelineSteps = [
    { icon: <FileText size={18} />, label: "Order Placed", desc: "Order submitted to depot.", step: "PENDING" },
    { icon: <CheckCircle2 size={18} />, label: "Vendor Confirmed", desc: "Depot accepted refill request.", step: "ACCEPTED" },
    { icon: <FlaskConical size={18} />, label: "Preparing Refill", desc: "Filling LPG cylinder at station.", step: "PREPARING" },
    { icon: <Bike size={18} />, label: "Rider Assigned", desc: "Delivery partner assigned to pickup.", step: "RIDER_ASSIGNED" },
    { icon: <Package size={18} />, label: "Picked Up", desc: "Cylinder collected from depot.", step: "PICKED_UP" },
    { icon: <Truck size={18} />, label: "Out for Delivery", desc: "Rider is en route to your location.", step: "OUT_FOR_DELIVERY" },
    { icon: <PartyPopper size={18} />, label: "Delivered", desc: "Safely delivered to customer address.", step: "DELIVERED" },
  ];

  return (
    <div className="track-page">
      <div className="track-inner">
        <span className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Truck size={14} /> Real-Time Tracking
        </span>
        <h1 style={{ marginTop: 12, marginBottom: 8 }}>
          Track Your Gas Refill & Delivery
        </h1>
        <p>Enter your unique order ID below to monitor real-time delivery status.</p>

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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={16} /> {error}</span>
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
              <span className={`badge badge-${rawStatus.toLowerCase()}`}>
                {rawStatus}
              </span>
            </div>

            <div className="track-details">
              <div className="track-detail">
                <label>Vendor Station</label>
                <span>{result.vendorName || "ABC Gas Station"}</span>
              </div>
              <div className="track-detail">
                <label>Gas Cost</label>
                <span>₦{Number(result.totalAmount || result.gasCost || 0).toLocaleString()}</span>
              </div>
              <div className="track-detail">
                <label>Weight</label>
                <span>{result.weightKg || result.WeightKg} KG</span>
              </div>
              <div className="track-detail">
                <label>Assigned Rider</label>
                <span>{result.riderName ? `${result.riderName} (${result.riderPhone})` : "Pending Rider"}</span>
              </div>
            </div>

            {rawStatus === "CANCELLED" && (
              <div className="alert alert-error" style={{ margin: "20px 0" }}>
                This order was cancelled.
              </div>
            )}

            <h3 style={{ marginBottom: 20, fontSize: 15 }}>Order Lifecycle Milestone Progress</h3>

            <div className="timeline">
              {timelineSteps.map((step, i) => {
                const stepIdx = statusOrder.indexOf(step.step);
                const isDone = rawStatus !== "CANCELLED" && currentStepIndex >= stepIdx;

                return (
                  <div className="tl-item" key={i}>
                    <div className={`tl-dot ${isDone ? "done" : ""}`}>
                      {step.icon}
                    </div>
                    <div className="tl-body">
                      <h4 style={{ color: isDone ? "var(--text)" : "var(--text-muted)" }}>
                        {step.label}
                      </h4>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackOrder;
