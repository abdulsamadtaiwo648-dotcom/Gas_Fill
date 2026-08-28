import { useState, useEffect } from "react";
import VendorCard from "../components/VendorCard";
import Loading from "../components/Loading";
import { getNearbyVendors, createRefillOrder, registerCustomer } from "../services/api";
import { RefreshCw, Search, MapPin, AlertTriangle, Phone, PartyPopper } from "lucide-react";

function RefillGas() {
  const [weightKg, setWeightKg] = useState(null);
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError]       = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Details Form Modal State
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const weights = [
    { value: 3,    label: "3 KG",    sub: "Small" },
    { value: 6,    label: "6 KG",    sub: "Medium" },
    { value: 12.5, label: "12.5 KG", sub: "Standard" },
    { value: 25,   label: "25 KG",   sub: "Large" },
  ];

  useEffect(() => {
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

  async function fetchVendors(lat, lng) {
    try {
      const data = await getNearbyVendors(lat, lng, Number(weightKg));
      setVendors(data.vendors || []);
      if ((data.vendors || []).length === 0) {
        setError("No vendors found near this location for the selected weight.");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch vendors from server.");
    } finally {
      setLoading(false);
    }
  }

  function findGasNearMe() {
    setError("");
    setVendors([]);
    setSelectedVendor(null);
    setCreatedOrder(null);

    if (!weightKg) {
      setError("Please select how much gas you need.");
      return;
    }

    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchVendors(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchVendors(5.121, 7.373);
        }
      );
    } else {
      fetchVendors(5.121, 7.373);
    }
  }

  function handleOpenOrderForm() {
    setShowDetailsForm(true);
  }

  function handleDetailChange(e) {
    setCustomerDetails({
      ...customerDetails,
      [e.target.name]: e.target.value,
    });
  }

  async function handleConfirmOrder(e) {
    e.preventDefault();
    if (!selectedVendor) return;

    if (!customerDetails.name || !customerDetails.phone || !customerDetails.email) {
      setError("Please enter your name, phone number, and email.");
      return;
    }

    setOrdering(true);
    setError("");

    try {
      // 1. Try to register/retrieve customer in backend SQLite database
      let customerId = "CUST-0001";
      try {
        const regRes = await registerCustomer({
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email,
          password: "temporary_customer_password_123",
        });
        if (regRes.customer && regRes.customer.id) {
          customerId = regRes.customer.id;
        }
      } catch (regErr) {
        // If customer email already exists, continue with default ID
      }

      // 2. Submit Order to Backend
      const res = await createRefillOrder({
        customerId: customerId,
        vendorId: selectedVendor.Vendor.ID,
        weightKg: selectedVendor.WeightKg,
        pricePerKg: selectedVendor.PricePerKg,
        deliveryFee: 1000,
        fulfillment: "delivery",
        latitude: selectedVendor.Vendor.Latitude || 5.121,
        longitude: selectedVendor.Vendor.Longitude || 7.373,
      });

      // Save details locally for future orders
      localStorage.setItem("user", JSON.stringify({
        id: customerId,
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        address: customerDetails.address,
      }));

      setCreatedOrder(res.order || res);
      setShowDetailsForm(false);
    } catch (err) {
      setError(err.message || "Failed to submit order to database.");
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div className="refill-page">
      <div className="refill-inner">
        {/* Header */}
        <div className="refill-header">
          <span className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Gas Refill
          </span>
          <h1>Refill Your Gas Cylinder</h1>
          <p>
            Select your cylinder size and we'll match you with available, verified vendors
            nearest to your location.
          </p>
        </div>

        {/* Form */}
        <div className="refill-card">
          <h2>How much gas do you need?</h2>

          <div className="weight-options">
            {weights.map(({ value, label, sub }) => (
              <button
                key={value}
                type="button"
                className={`weight-option ${weightKg === value ? "active" : ""}`}
                onClick={() => setWeightKg(value)}
              >
                <span className="weight-kg">{label}</span>
                <span className="weight-size">{sub}</span>
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-lg find-btn"
            onClick={findGasNearMe}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              <>
                <Search size={18} /> Searching Nearby Vendors...
              </>
            ) : (
              <>
                <MapPin size={18} /> Find Gas Near Me
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* DETAILS FORM MODAL OVERLAY */}
        {showDetailsForm && selectedVendor && (
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
                Please provide your contact and delivery details to place the refill order with {selectedVendor.Vendor.Name}.
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
                    onClick={() => setShowDetailsForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={ordering}
                  >
                    {ordering ? "Submitting..." : "Confirm & Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <Loading text="Connecting to backend database & searching vendors..." />}

        {/* Vendor List */}
        {vendors.length > 0 && !loading && (
          <section style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h2>Available Gas Vendors ({vendors.length})</h2>
              <p style={{ fontSize: 14 }}>Select a vendor below to confirm your order.</p>
            </div>

            {vendors.map((vendorItem, index) => (
              <div className="vendor-card" key={index}>
                <div className="vendor-card-top">
                  <div>
                    <h3>{vendorItem.Vendor.Name}</h3>
                    <p style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {vendorItem.Vendor.Address}</p>
                  </div>
                  <span className="dist-pill">
                    {vendorItem.DistanceKm.toFixed(2)} km away
                  </span>
                </div>

                <div className="vendor-stats-row">
                  <div className="vendor-stat">
                    <span>Weight</span>
                    <strong>{vendorItem.WeightKg} KG</strong>
                  </div>
                  <div className="vendor-stat">
                    <span>Price / KG</span>
                    <strong>₦{vendorItem.PricePerKg.toLocaleString()}</strong>
                  </div>
                  <div className="vendor-stat">
                    <span>Total Gas Cost</span>
                    <strong className="price-val">
                      ₦{vendorItem.TotalGasCost.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="vendor-btns">
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedVendor(vendorItem)}
                  >
                    Select Vendor
                  </button>
                  {vendorItem.Vendor.Phone && (
                    <a
                      href={`tel:${vendorItem.Vendor.Phone}`}
                      className="btn btn-secondary"
                    >
                      Call
                    </a>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Order Confirmation Summary */}
        {selectedVendor && !createdOrder && !showDetailsForm && (
          <div className="section-box" style={{ marginTop: 24 }}>
            <h3>
              Confirm Refill Order
              <span className="badge badge-confirmed">Vendor Selected</span>
            </h3>

            <p style={{ marginBottom: 12 }}>
              Vendor: <strong>{selectedVendor.Vendor.Name}</strong> ({selectedVendor.Vendor.Address})
            </p>
            <p style={{ marginBottom: 12 }}>
              Gas Amount: <strong>{selectedVendor.WeightKg} KG</strong>
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--orange)", marginBottom: 20 }}>
              Total: ₦{selectedVendor.TotalGasCost.toLocaleString()}
            </p>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleOpenOrderForm}
            >
              Continue to Enter Details →
            </button>
          </div>
        )}

        {/* Order Success */}
        {createdOrder && (
          <div className="alert alert-success" style={{ marginTop: 24, padding: 24, display: "block", textAlign: "center" }}>
            <h2 style={{ color: "var(--green)", marginBottom: 8 }}>Refill Order Submitted!</h2>
            <p style={{ color: "var(--text)", fontSize: 15, marginBottom: 8 }}>
              Order ID: <strong>#{createdOrder.ID || createdOrder.id}</strong>
            </p>
            <p style={{ fontSize: 14 }}>
              Your order has been sent to the backend database. The vendor will process your order shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RefillGas;