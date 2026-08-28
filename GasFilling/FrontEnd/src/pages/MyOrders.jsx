import { Package, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import OrderCard from "../components/OrderCard";
import { getCustomerOrders } from "../services/api";

function MyOrders() {
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
        setError("Failed to fetch order history from database.");
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
          <p style={{ margin: "16px 0 24px" }}>Please log in to view your cooking gas order history.</p>
          <Link to="/login" className="btn btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-inner">
        <span className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Package size={14} /> Order History</span>
        <h1 style={{ margin: "12px 0 8px" }}>My Orders</h1>
        <p style={{ marginBottom: 32 }}>
          Track and view all your cooking gas refills, deliveries, and cylinder purchases.
        </p>

        {error && <div className="alert alert-error"> {error}</div>}

        {loading ? (
          <Loading text="Loading order history from backend..." />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Package size={48} color="var(--text-muted)" /></div>
            <h3>No orders found</h3>
            <p>Your refill and cylinder orders will appear here once submitted.</p>
            <Link to="/refill" className="btn btn-primary">Refill Gas Near Me</Link>
          </div>
        ) : (
          <div>
            {orders.map((order, idx) => (
              <OrderCard
                key={order.id || order.ID || idx}
                order={order}
                onCancelled={async () => {
                  if (user && user.id) {
                    const res = await getCustomerOrders(user.id);
                    setOrders(res.orders || res || []);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
