import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import { getProducts, createRefillOrder, registerCustomer } from "../services/api";

function BuyGas() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");
  const [orderedId, setOrderedId] = useState(null);
  
  // Details Form Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts("gas");
        const list = data.products || data || [];
        setProducts(list);
      } catch (err) {
        setError("Failed to fetch gas products from database.");
      } finally {
        setLoading(false);
      }
    })();

    // Prefill user details if logged in or previously entered
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCustomerDetails({
          name: parsed.name || `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || "",
          phone: parsed.phone || "",
          email: parsed.email || "",
          address: parsed.address || "",
        });
      }
    } catch {}
  }, []);

  const weights = ["all", "3", "6", "12.5", "25"];

  const filtered = filter === "all"
    ? products
    : products.filter((p) =>
        String(p.weightKg || p.WeightKg || p.weight || "").includes(filter)
      );

  function handleOpenOrderForm(product) {
    setSelectedProduct(product);
  }

  function handleDetailChange(e) {
    setCustomerDetails({
      ...customerDetails,
      [e.target.name]: e.target.value,
    });
  }

  async function handleConfirmOrder(e) {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!customerDetails.name || !customerDetails.phone || !customerDetails.email) {
      setError("Please fill in your name, phone number, and email.");
      return;
    }

    setSubmittingOrder(true);
    setError("");

    try {
      // 1. Try to register/retrieve customer in backend SQLite database
      let customerId = "CUST-0001";
      try {
        const regRes = await registerCustomer({
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email,
          password: "temporary_customer_password_123", // placeholder password for on-demand registration
        });
        if (regRes.customer && regRes.customer.id) {
          customerId = regRes.customer.id;
        }
      } catch (regErr) {
        // If customer email already exists, continue with default ID or try lookup
      }

      // 2. Submit Order to Backend
      const priceVal = selectedProduct.price || selectedProduct.Price || 0;
      const weightVal = selectedProduct.weightKg || selectedProduct.WeightKg || 6;
      await createRefillOrder({
        customerId: customerId,
        vendorId: selectedProduct.vendorId || selectedProduct.VendorID || "VEND-0001",
        weightKg: weightVal,
        pricePerKg: priceVal / weightVal || 1200,
        deliveryFee: 1000,
        fulfillment: "delivery",
      });

      // Save details locally for future orders
      localStorage.setItem("user", JSON.stringify({
        id: customerId,
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        address: customerDetails.address,
      }));

      setOrderedId(selectedProduct.id || selectedProduct.ID);
      setSelectedProduct(null);
      setTimeout(() => setOrderedId(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit order to database.");
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="products-page">
      <div className="products-inner">
        <div className="page-top">
          <span className="tag">🛢️ Buy Gas</span>
          <h1>Order Filled LPG Gas Cylinders</h1>
          <p>Connected live to backend inventory. Select your desired size for fast delivery.</p>
        </div>

        <div className="filter-row">
          {weights.map((w) => (
            <button
              key={w}
              type="button"
              className={`filter-pill ${filter === w ? "active" : ""}`}
              onClick={() => setFilter(w)}
            >
              {w === "all" ? "All Sizes" : `${w} KG`}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {/* DETAILS FORM MODAL OVERLAY */}
        {selectedProduct && (
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16
          }}>
            <div className="form-box" style={{ maxWidth: 480, width: "100%" }}>
              <h2>Enter Order Details</h2>
              <p className="form-sub" style={{ marginBottom: 16 }}>
                Please provide your contact and delivery details to place the order for {selectedProduct.name || `Gas ${selectedProduct.weightKg}KG`}.
              </p>

              <form onSubmit={handleConfirmOrder}>
                <div className="form-group">
                  <label htmlFor="modal-name">Full Name *</label>
                  <input
                    id="modal-name"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Amaka Johnson"
                    value={customerDetails.name}
                    onChange={handleDetailChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-phone">Phone Number *</label>
                    <input
                      id="modal-phone"
                      name="phone"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 080XXXXXXXX"
                      value={customerDetails.phone}
                      onChange={handleDetailChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-email">Email Address *</label>
                    <input
                      id="modal-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. you@example.com"
                      value={customerDetails.email}
                      onChange={handleDetailChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-address">Delivery Address *</label>
                  <input
                    id="modal-address"
                    name="address"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 12 Awolowo Road, Lagos"
                    value={customerDetails.address}
                    onChange={handleDetailChange}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={submittingOrder}
                  >
                    {submittingOrder ? "Submitting..." : "Confirm & Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <Loading text="Fetching gas products from backend database..." />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛢️</div>
            <h3>No products found</h3>
            <p>Try changing your size filter or check back later.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((product, i) => {
              const pid = product.id || product.ID || i;
              const name = product.name || product.Name || `LPG Gas ${product.weightKg}KG`;
              const price = product.price || product.Price || 0;
              const weight = product.weightKg || product.WeightKg || "—";
              const desc = product.description || product.Description || "Quality LPG gas from verified vendors.";

              return (
                <div className="product-card" key={pid}>
                  <div className="product-img">🛢️</div>
                  <div className="product-body">
                    <span className="product-cat">LPG GAS</span>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                      Weight: <strong>{weight} KG</strong>
                    </div>
                    <div className="product-footer">
                      <div className="product-price">₦{Number(price).toLocaleString()}</div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenOrderForm(product)}
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

export default BuyGas;
