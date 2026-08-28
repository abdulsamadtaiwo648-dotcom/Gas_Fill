import { Container, AlertTriangle, Check } from 'lucide-react';
import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import { getProducts, createRefillOrder } from "../services/api";

function BuyCylinder() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [orderedId, setOrderedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts("cylinder");
        const list = data.products || data || [];
        setProducts(list);
      } catch (err) {
        setError("Failed to load cylinder inventory from database.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleOrder(product) {
    const pid = product.id || product.ID;
    setOrderedId(pid);
    setError("");

    let customerId = "CUST-0001";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id) customerId = user.id;
      }
    } catch {}

    try {
      await createRefillOrder({
        customerId: customerId,
        vendorId: product.vendorId || product.VendorID || "VEND-0001",
        weightKg: product.weightKg || product.WeightKg || 6,
        pricePerKg: product.price / (product.weightKg || 1) || 1200,
        deliveryFee: 1000,
        fulfillment: "delivery",
      });
    } catch (err) {
      setError(err.message || "Failed to submit order to database.");
    }
    setTimeout(() => setOrderedId(null), 3000);
  }

  return (
    <div className="products-page">
      <div className="products-inner">
        <div className="page-top">
          <span className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Container size={14} /> Buy Cylinder</span>
          <h1>Buy New LPG Gas Cylinders</h1>
          <p>Browse tested and certified steel cooking gas cylinders directly from backend inventory.</p>
        </div>

        {error && <div className="alert alert-error"> {error}</div>}

        {loading ? (
          <Loading text="Loading cylinder products from database..." />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Container size={48} color="var(--text-muted)" /></div>
            <h3>No cylinders found</h3>
            <p>No cylinders are currently available in the database.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, i) => {
              const pid = product.id || product.ID || i;
              const name = product.name || product.Name || `Cylinder ${product.weightKg}KG`;
              const price = product.price || product.Price || 0;
              const weight = product.weightKg || product.WeightKg || "—";
              const desc = product.description || product.Description || "High-quality safety certified cylinder.";

              return (
                <div className="product-card" key={pid}>
                  <div className="product-img" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Container size={40} color="var(--orange)" /></div>
                  <div className="product-body">
                    <span className="product-cat">CYLINDER</span>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                      Capacity: <strong>{weight} KG</strong>
                    </div>
                    <div className="product-footer">
                      <div className="product-price">₦{Number(price).toLocaleString()}</div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOrder(product)}
                      >
                        {orderedId === pid ? "✓ Order Placed!" : "Order Now"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyCylinder;
