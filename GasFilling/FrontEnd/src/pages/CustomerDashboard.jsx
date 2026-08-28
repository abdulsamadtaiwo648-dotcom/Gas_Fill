import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import {
  getAllVendors,
  getCustomerOrders,
  createRefillOrder,
  cancelOrder,
} from "../services/api";
import {
  Home,
  Search,
  Package,
  Star,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bike,
  Phone,
  Lightbulb,
  Store,
  Truck,
  Rocket,
  X,
  Flame,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Container,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Gauge,
} from "lucide-react";

function CustomerDashboard() {
  const navigate = useNavigate();

  // User session state
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [profileMsg, setProfileMsg] = useState("");

  const handleOpenEditProfile = () => {
    setProfileForm({
      firstName: user?.firstName || (user?.name ? user.name.split(" ")[0] : ""),
      lastName: user?.lastName || (user?.name ? user.name.split(" ").slice(1).join(" ") : ""),
      email: user?.email || "",
      phone: user?.phone || "08012345678",
    });
    setIsEditingProfile(true);
    setProfileMsg("");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.email.trim()) return;

    const updatedUser = {
      ...user,
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      name: `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setIsEditingProfile(false);
    setProfileMsg("Profile updated successfully!");
    setTimeout(() => setProfileMsg(""), 4000);
  };

  // Main UI Tab State: 'home' | 'explore' | 'orders' | 'saved' | 'profile'
  const [activeTab, setActiveTab] = useState("home");

  // Data states
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("nearest"); // 'nearest' | 'price' | 'rating' | 'updated'
  const [filterAvailability, setFilterAvailability] = useState("all"); // 'all' | 'in_stock' | 'low_stock'
  const [filterDelivery, setFilterDelivery] = useState(false);

  // Favourites state
  const [savedVendorIds, setSavedVendorIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedVendors") || "[]");
    } catch {
      return [];
    }
  });

  // Saved Addresses state (Loaded from localStorage or empty until user fills it out)
  const [addresses, setAddresses] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("customerAddresses") || "[]");
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch { }
    return [];
  });

  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const def = addresses.find((a) => a.isDefault);
    return def ? def.id : addresses[0]?.id || "";
  });

  // Modals
  const [selectedVendorForModal, setSelectedVendorForModal] = useState(null); // Retailer Detail Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Address Form State
  const [addressForm, setAddressForm] = useState({ label: "Home", address: "", instructions: "" });

  // Buy Gas Flow Multi-step Order State
  const [orderStep, setOrderStep] = useState(1);
  const [orderVendor, setOrderVendor] = useState(null);
  const [selectedKg, setSelectedKg] = useState(12.5);
  const [customKg, setCustomKg] = useState("");
  const [fulfillment, setFulfillment] = useState("delivery"); // 'delivery' | 'pickup'
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Order History tab sub-filter: 'all' | 'active' | 'completed' | 'cancelled'
  const [orderHistorySubTab, setOrderHistorySubTab] = useState("all");

  // Customer Gas Cylinder Inventory State
  const [cylinders, setCylinders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("customerCylinders") || "[]");
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {}
    return [
      {
        id: "cyl-1",
        name: "Main Kitchen Cylinder",
        sizeKg: 12.5,
        status: "FULL",
        lastRefilledDate: "2026-08-20",
        lastVendor: "ABC Gas Station",
        lastPrice: 15000,
        notes: "Primary cooking gas cylinder",
      },
      {
        id: "cyl-2",
        name: "Backup Cylinder",
        sizeKg: 6,
        status: "LOW",
        lastRefilledDate: "2026-07-15",
        lastVendor: "XYZ LPG Depot",
        lastPrice: 6900,
        notes: "Used for outdoor cooking / backup",
      },
    ];
  });

  const [cylinderModalOpen, setCylinderModalOpen] = useState(false);
  const [editingCylinder, setEditingCylinder] = useState(null);
  const [cylinderForm, setCylinderForm] = useState({
    name: "",
    sizeKg: 12.5,
    status: "FULL",
    lastRefilledDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem("customerCylinders", JSON.stringify(cylinders));
  }, [cylinders]);

  const handleSaveCylinder = (e) => {
    e.preventDefault();
    if (!cylinderForm.name.trim()) return;

    if (editingCylinder) {
      setCylinders((prev) =>
        prev.map((c) => (c.id === editingCylinder.id ? { ...c, ...cylinderForm, sizeKg: Number(cylinderForm.sizeKg) } : c))
      );
    } else {
      const newCyl = {
        id: `cyl-${Date.now()}`,
        ...cylinderForm,
        sizeKg: Number(cylinderForm.sizeKg),
      };
      setCylinders((prev) => [...prev, newCyl]);
    }
    setCylinderModalOpen(false);
    setEditingCylinder(null);
  };

  const handleDeleteCylinder = (id) => {
    setCylinders((prev) => prev.filter((c) => c.id !== id));
  };

  const openAddCylinderModal = () => {
    setEditingCylinder(null);
    setCylinderForm({
      name: "",
      sizeKg: 12.5,
      status: "FULL",
      lastRefilledDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setCylinderModalOpen(true);
  };

  const openEditCylinderModal = (cyl) => {
    setEditingCylinder(cyl);
    setCylinderForm({
      name: cyl.name,
      sizeKg: cyl.sizeKg,
      status: cyl.status || "FULL",
      lastRefilledDate: cyl.lastRefilledDate || new Date().toISOString().split("T")[0],
      notes: cyl.notes || "",
    });
    setCylinderModalOpen(true);
  };

  const getDaysSinceDate = (dateStr) => {
    if (!dateStr) return "Not recorded";
    const refDate = new Date(dateStr);
    if (isNaN(refDate.getTime())) return dateStr;
    const diffDays = Math.floor((new Date() - refDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Sync saved addresses and favourites to localStorage
  useEffect(() => {
    localStorage.setItem("savedVendors", JSON.stringify(savedVendorIds));
  }, [savedVendorIds]);

  useEffect(() => {
    localStorage.setItem("customerAddresses", JSON.stringify(addresses));
  }, [addresses]);

  // Initial Data Fetching
  const fetchData = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      // Fetch vendors and orders concurrently
      const [vendorsRes, ordersRes] = await Promise.all([
        getAllVendors().catch(() => ({ vendors: [] })),
        getCustomerOrders(user.id).catch(() => ({ orders: [] })),
      ]);

      const fetchedVendors = vendorsRes.vendors || vendorsRes || [];
      const fetchedOrders = ordersRes.orders || ordersRes || [];

      // Augment vendors with default fallback fields if missing
      const processedVendors = (Array.isArray(fetchedVendors) ? fetchedVendors : []).map((v) => {
        const price = v.pricePerKg || v.PricePerKg || 1050;
        const avail = v.availability || v.Availability || "IN STOCK";
        return {
          id: v.id || v.ID,
          name: v.name || v.Name || "LPG Depot",
          address: v.address || v.Address || "Local Depot",
          area: v.address ? v.address.split(",")[0] : "Ilorin",
          pricePerKg: price,
          availability: avail, // 'IN STOCK', 'LOW STOCK', 'OUT OF STOCK'
          lastUpdated: v.updatedAt ? new Date(v.updatedAt) : new Date(Date.now() - 15 * 60000),
          distanceKm: v.distanceKm || (Math.random() * 3 + 0.8).toFixed(1),
          rating: v.rating || 4.8,
          deliveryAvailable: v.deliveryAvailable !== false,
          phone: v.phone || "08012345678",
          hours: "8:00 AM – 8:00 PM",
        };
      });

      setVendors(processedVendors);
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Time-based Greeting Helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const name = user?.firstName || user?.name || "Customer";

  // Favourite toggle handler
  const toggleFavourite = (vendorId) => {
    setSavedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  // Addresses Handlers
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddress.id ? { ...a, ...addressForm } : a))
      );
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
    }
    setAddressModalOpen(false);
    setEditingAddress(null);
    setAddressForm({ label: "Home", address: "", instructions: "" });
  };

  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    setSelectedAddressId(id);
  };

  // Open Buy Gas Modal
  const openBuyGasModal = (preselectedVendor = null, preselectedWeight = 12.5) => {
    if (preselectedVendor) {
      setOrderVendor(preselectedVendor);
      setOrderStep(2);
    } else {
      setOrderVendor(vendors[0] || null);
      setOrderStep(1);
    }
    setSelectedKg(preselectedWeight);
    setCustomKg("");
    setFulfillment("delivery");
    setOrderError("");
    setOrderModalOpen(true);
  };

  // Re-Order Handler (Uses CURRENT live vendor price)
  const handleReorder = (pastOrder) => {
    const currentVendor = vendors.find((v) => v.id === pastOrder.vendorId || v.name === pastOrder.vendorName) || vendors[0];
    const weight = pastOrder.weightKg || pastOrder.WeightKg || 12.5;
    openBuyGasModal(currentVendor, weight);
  };

  // Handle Order Submit
  const handleCreateOrderSubmit = async () => {
    const finalWeight = selectedKg === "custom" ? Number(customKg) : Number(selectedKg);
    if (!finalWeight || finalWeight <= 0) {
      setOrderError("Please enter a valid gas weight in KG.");
      return;
    }
    if (!orderVendor) {
      setOrderError("Please select a valid gas retailer.");
      return;
    }

    const currentAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

    if (fulfillment === "delivery" && (!currentAddr || !currentAddr.address)) {
      setOrderError("Please add a delivery address before placing your order.");
      setEditingAddress(null);
      setAddressForm({ label: "Home", address: "", instructions: "" });
      setAddressModalOpen(true);
      return;
    }

    setOrderSubmitting(true);
    setOrderError("");

    try {
      const orderPayload = {
        customerId: user.id || "CUST-0001",
        vendorId: orderVendor.id,
        vendorName: orderVendor.name,
        vendorAddress: orderVendor.address,
        fulfillment: fulfillment,
        weightKg: finalWeight,
        pricePerKg: orderVendor.pricePerKg,
        deliveryFee: fulfillment === "delivery" ? 1000 : 0,
        deliveryAddress: currentAddr ? `${currentAddr.label}: ${currentAddr.address}` : "Default Location",
      };

      const res = await createRefillOrder(orderPayload);
      const created = res.order || res;

      // Update local orders list & view active order
      setOrders((prev) => [created, ...prev]);
      setOrderModalOpen(false);
      setActiveTab("home");
    } catch (err) {
      setOrderError(err.message || "Failed to create order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Active Order (In Progress)
  const activeOrder = useMemo(() => {
    return orders.find(
      (o) =>
        o.status &&
        ["pending", "accepted", "preparing", "rider_assigned", "picked_up", "out_for_delivery"].includes(
          o.status.toLowerCase()
        )
    );
  }, [orders]);

  // Filtered & Sorted Vendors List for Explore & Home
  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.area.toLowerCase().includes(q)
      );
    }

    // Filter Availability
    if (filterAvailability !== "all") {
      result = result.filter(
        (v) => v.availability.toLowerCase() === filterAvailability.toLowerCase()
      );
    }

    // Filter Delivery Support
    if (filterDelivery) {
      result = result.filter((v) => v.deliveryAvailable);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "price") return a.pricePerKg - b.pricePerKg;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "updated") return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      return a.distanceKm - b.distanceKm; // Default 'nearest'
    });

    return result;
  }, [vendors, searchQuery, sortBy, filterAvailability, filterDelivery]);

  // Saved / Favourite Vendors
  const savedVendorsList = useMemo(() => {
    return vendors.filter((v) => savedVendorIds.includes(v.id));
  }, [vendors, savedVendorIds]);

  // Selected Location Display Label
  const currentAddressObj = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
  const locationLabel = currentAddressObj
    ? `${currentAddressObj.label} — ${currentAddressObj.address}`
    : "Current Location";

  // Helper for availability badge display
  const renderAvailabilityBadge = (avail, lastUpdated) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMins = Math.round((now - updated) / 60000);
    const isOutdated = diffMins > 1440; // > 24 hours

    if (isOutdated) {
      return (
        <span className="availability-pill availability-unknown" title={`Updated ${diffMins} mins ago`}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={12} color="#9CA3AF" /> Outdated</span> ({Math.round(diffMins / 1440)}d ago)
        </span>
      );
    }

    if (avail === "IN STOCK" || avail === "available") {
      return (
        <span className="availability-pill availability-in_stock">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} color="#10B981" /> Available</span> ({diffMins < 1 ? "Just now" : `${diffMins}m ago`})
        </span>
      );
    }
    if (avail === "LOW STOCK") {
      return (
        <span className="availability-pill availability-low_stock">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} color="#F59E0B" /> Low stock</span> ({diffMins}m ago)
        </span>
      );
    }
    return (
      <span className="availability-pill availability-out_stock">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={12} color="#EF4444" /> Out of stock</span>
      </span>
    );
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-inner" style={{ textAlign: "center", padding: "40px 20px" }}>
          <h2>Access Denied</h2>
          <p style={{ margin: "16px 0 24px" }}>Please sign in to view your Customer Dashboard.</p>
          <Link to="/login" className="btn btn-primary">Sign In →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      {/* Desktop Sidebar */}
      <aside className="dash-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Customer Dashboard</div>
          <button
            onClick={() => setActiveTab("home")}
            className={`sidebar-link ${activeTab === "home" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Home size={16} /> Home</span>
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`sidebar-link ${activeTab === "explore" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Search size={16} /> Explore Retailers</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`sidebar-link ${activeTab === "orders" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Package size={16} /> Orders</span> ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`sidebar-link ${activeTab === "inventory" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Container size={16} /> My Cylinders</span> ({cylinders.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`sidebar-link ${activeTab === "saved" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Star size={16} /> Saved</span> ({savedVendorIds.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`sidebar-link ${activeTab === "profile" ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span className="icon" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><User size={16} /> Account & Addresses</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main" style={{ paddingBottom: 80 }}>
        {/* HEADER & LOCATION BAR */}
        <div className="section-box" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 4px" }}>
                {getGreeting()}, {name}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                Find verified LPG gas retailers and instant doorstep delivery near you.
              </p>
            </div>

            {/* Delivery Location Selector */}
            <div style={{ background: "var(--bg-gray)", padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--orange)", marginBottom: 2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> Deliver to</span>
              </div>
              {addresses.length === 0 ? (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({ label: "Home", address: "", instructions: "" });
                    setAddressModalOpen(true);
                  }}
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                >
                  + Add Delivery Address
                </button>
              ) : (
                <select
                  className="form-select"
                  value={selectedAddressId}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW") {
                      setEditingAddress(null);
                      setAddressForm({ label: "Home", address: "", instructions: "" });
                      setAddressModalOpen(true);
                    } else {
                      setSelectedAddressId(e.target.value);
                    }
                  }}
                  style={{ padding: "4px 8px", fontSize: "13px", fontWeight: "600", border: "none", background: "transparent" }}
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.address}
                    </option>
                  ))}
                  <option value="ADD_NEW">+ Add New Delivery Location</option>
                </select>
              )}
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="search-input-wrap" style={{ marginTop: 18 }}>
            <span className="search-icon" style={{ display: "inline-flex", alignItems: "center" }}><Search size={16} /></span>
            <input
              type="text"
              className="form-input"
              placeholder="Search gas retailers or location (e.g. Tanke, GRA, 12.5kg)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="alert alert-error"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={16} /> {error}</span></div>}

        {/* ================= TAB 1: HOME ================= */}
        {activeTab === "home" && (
          <>
            {/* ACTIVE ORDER CARD BANNER */}
            {activeOrder && (
              <div
                className="section-box"
                style={{
                  background: "linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(234, 88, 12, 0.02) 100%)",
                  border: "1px solid var(--orange-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <span className="badge badge-pending" style={{ textTransform: "uppercase", fontSize: "11px" }}>
                      Active Order Status: {activeOrder.status}
                    </span>
                    <h3 style={{ margin: "6px 0 2px", border: "none", padding: 0 }}>
                      Order #{String(activeOrder.id).slice(0, 12).toUpperCase()}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                      {activeOrder.vendorName || "LPG Vendor"} • {activeOrder.weightKg || activeOrder.WeightKg} KG LPG
                    </p>
                  </div>
                  <Link to={`/track-order?orderId=${activeOrder.id}`} className="btn btn-primary btn-sm">
                    Track Order →
                  </Link>
                </div>

                {/* Progress bar visual */}
                <div style={{ height: "8px", background: "var(--border-2)", borderRadius: "4px", overflow: "hidden", margin: "14px 0" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "var(--orange)",
                      width:
                        ["PENDING"].includes((activeOrder.status || "").toUpperCase())
                          ? "20%"
                          : ["ACCEPTED"].includes((activeOrder.status || "").toUpperCase())
                            ? "40%"
                            : ["PREPARING"].includes((activeOrder.status || "").toUpperCase())
                              ? "60%"
                              : ["RIDER_ASSIGNED"].includes((activeOrder.status || "").toUpperCase())
                                ? "75%"
                                : ["PICKED_UP", "OUT_FOR_DELIVERY"].includes((activeOrder.status || "").toUpperCase())
                                  ? "90%"
                                  : "100%",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                {activeOrder.riderName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "inline-flex", justifyContent: "center" }}><Bike size={32} color="var(--orange)" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{activeOrder.riderName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Assigned Rider</div>
                    </div>
                    {activeOrder.riderPhone && (
                      <a href={`tel:${activeOrder.riderPhone}`} className="btn btn-secondary btn-sm">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Phone size={14} /> Call Rider</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MY GAS CYLINDERS & LAST REFILLED STATUS */}
            <div className="section-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Container size={20} color="var(--orange)" /> My Cylinder Inventory & Refill Status
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Monitor gas levels and last refill dates for all your household cylinders
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("inventory")}>
                    Manage Inventory ({cylinders.length})
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={openAddCylinderModal}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Add Cylinder</span>
                  </button>
                </div>
              </div>

              {cylinders.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 16px" }}>
                  <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}>
                    <Container size={40} color="var(--text-muted)" />
                  </div>
                  <h4 style={{ margin: "8px 0 4px" }}>No cylinders added yet</h4>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Add your household LPG cylinders to keep track of refill dates and gas levels.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={openAddCylinderModal}>
                    + Add Your First Cylinder
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {cylinders.map((cyl) => {
                    const statusColor =
                      cyl.status === "FULL"
                        ? "#10B981"
                        : cyl.status === "MEDIUM"
                        ? "#3B82F6"
                        : cyl.status === "LOW"
                        ? "#F59E0B"
                        : "#EF4444";
                    const statusPct =
                      cyl.status === "FULL"
                        ? "100%"
                        : cyl.status === "MEDIUM"
                        ? "50%"
                        : cyl.status === "LOW"
                        ? "25%"
                        : "5%";

                    return (
                      <div
                        key={cyl.id}
                        style={{
                          padding: "16px",
                          borderRadius: "var(--radius)",
                          border: "1px solid var(--border)",
                          background: "var(--bg-gray)",
                          display: "flex",
                          flexDirection: "column",
                          justify: "space-between",
                          position: "relative",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  textTransform: "uppercase",
                                  background: "rgba(234, 88, 12, 0.12)",
                                  color: "var(--orange)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                {cyl.sizeKg} KG LPG
                              </span>
                              <h4 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: "700" }}>{cyl.name}</h4>
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                background: `${statusColor}18`,
                                color: statusColor,
                                border: `1px solid ${statusColor}40`,
                              }}
                            >
                              {cyl.status || "FULL"}
                            </span>
                          </div>

                          {/* Gas level meter bar */}
                          <div style={{ margin: "10px 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: 4 }}>
                              <span>Est. Gas Level</span>
                              <span style={{ fontWeight: "700", color: statusColor }}>{statusPct}</span>
                            </div>
                            <div style={{ height: "6px", background: "var(--border-2)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: statusPct, background: statusColor, transition: "width 0.3s ease" }} />
                            </div>
                          </div>

                          {/* PROMINENT LAST REFILLED BADGE */}
                          <div
                            style={{
                              margin: "12px 0",
                              padding: "10px 12px",
                              background: "var(--bg)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={12} color="var(--orange)" /> Last Refilled
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text)" }}>
                                {cyl.lastRefilledDate || "Not recorded"}
                              </span>
                              <span className="badge badge-secondary" style={{ fontSize: "11px" }}>
                                <Clock size={11} style={{ marginRight: 3 }} /> {getDaysSinceDate(cyl.lastRefilledDate)}
                              </span>
                            </div>
                            {cyl.lastVendor && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>
                                Refilled at: <strong>{cyl.lastVendor}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: "6px 8px" }}
                            onClick={() => openEditCylinderModal(cyl)}
                            title="Edit Cylinder"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => openBuyGasModal(null, cyl.sizeKg)}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Flame size={14} /> Refill {cyl.sizeKg}KG Now
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LIVE LPG PRICE TICKER CARD */}
            <div className="section-box">
              <h3>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Lightbulb size={18} /> Current Retailer LPG Prices</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>
                  Updated live by stations
                </span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {vendors.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: "14px",
                      background: "var(--bg-gray)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>{v.name}</div>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--orange)", margin: "4px 0" }}>
                      ₦{v.pricePerKg.toLocaleString()} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/ kg</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Updated {Math.round((new Date() - new Date(v.lastUpdated)) / 60000)} mins ago
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GAS NEAR YOU (RETAILERS GRID) */}
            <div className="section-box">
              <h3>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={18} /> Gas Retailers Near You ({filteredVendors.length})</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("explore")}>
                  View All →
                </button>
              </h3>

              {loading ? (
                <Loading text="Finding gas stations near you..." />
              ) : filteredVendors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Store size={48} color="var(--text-muted)" /></div>
                  <h3>No gas retailers found nearby</h3>
                  <p>Try clearing your search query or expanding your search area.</p>
                  <button className="btn btn-secondary" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {filteredVendors.map((v) => {
                    const isFav = savedVendorIds.includes(v.id);
                    return (
                      <div key={v.id} className="vendor-card" style={{ marginBottom: 0 }}>
                        <div className="vendor-card-top">
                          <div>
                            <h3>{v.name}</h3>
                            <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {v.address}</p>
                          </div>
                          <button
                            onClick={() => toggleFavourite(v.id)}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: 18,
                              cursor: "pointer",
                              color: isFav ? "#EF4444" : "var(--text-muted)",
                            }}
                            title={isFav ? "Remove from favourites" : "Save retailer"}
                          >
                            <Star size={18} fill={isFav ? "#F59E0B" : "none"} color={isFav ? "#F59E0B" : "var(--text-muted)"} />
                          </button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }}>
                          <span className="dist-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {v.distanceKm} km away</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={14} fill="#F59E0B" color="#F59E0B" /> {v.rating}</span></span>
                          {renderAvailabilityBadge(v.availability, v.lastUpdated)}
                        </div>

                        <div className="vendor-stats-row" style={{ padding: "10px 0", margin: "10px 0" }}>
                          <div className="vendor-stat">
                            <span>LPG PRICE</span>
                            <strong className="price-val">₦{v.pricePerKg.toLocaleString()} / kg</strong>
                          </div>
                          <div className="vendor-stat">
                            <span>DELIVERY</span>
                            <strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{v.deliveryAvailable ? <><Truck size={14} /> Available</> : "Pickup Only"}</strong>
                          </div>
                        </div>

                        <div className="vendor-btns" style={{ marginTop: 12 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => setSelectedVendorForModal(v)}
                          >
                            View Station
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => openBuyGasModal(v)}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Order Gas <ArrowRight size={14} /></span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= TAB 2: EXPLORE ================= */}
        {activeTab === "explore" && (
          <div className="section-box">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Search size={20} /> Explore LPG Retailers</h3>

            {/* Sorting & Filter Controls */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  SORT BY
                </label>
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="nearest">Distance (Nearest First)</option>
                  <option value="price">Lowest Price / KG</option>
                  <option value="rating">Highest Rated</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  AVAILABILITY
                </label>
                <select className="form-select" value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
                  <option value="all">All Availability States</option>
                  <option value="in_stock">In Stock Only</option>
                  <option value="low_stock">Low Stock Only</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  className={`btn ${filterDelivery ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterDelivery(!filterDelivery)}
                >
                  Delivery Available Only
                </button>
              </div>
            </div>

            {/* Explore Retailers Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filteredVendors.map((v) => {
                const isFav = savedVendorIds.includes(v.id);
                return (
                  <div key={v.id} className="vendor-card" style={{ marginBottom: 0 }}>
                    <div className="vendor-card-top">
                      <div>
                        <h3>{v.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {v.address}</p>
                      </div>
                      <button
                        onClick={() => toggleFavourite(v.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 18,
                          cursor: "pointer",
                          color: isFav ? "#EF4444" : "var(--text-muted)",
                        }}
                      >
                        <Star size={18} fill={isFav ? "#F59E0B" : "none"} color={isFav ? "#F59E0B" : "var(--text-muted)"} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0" }}>
                      <span className="dist-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {v.distanceKm} km</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={14} fill="#F59E0B" color="#F59E0B" /> {v.rating}</span></span>
                      {renderAvailabilityBadge(v.availability, v.lastUpdated)}
                    </div>

                    <div className="vendor-stats-row">
                      <div className="vendor-stat">
                        <span>PRICE</span>
                        <strong className="price-val">₦{v.pricePerKg.toLocaleString()} / kg</strong>
                      </div>
                      <div className="vendor-stat">
                        <span>HOURS</span>
                        <strong>{v.hours}</strong>
                      </div>
                    </div>

                    <div className="vendor-btns">
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setSelectedVendorForModal(v)}>
                        Details
                      </button>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openBuyGasModal(v)}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Order Gas <ArrowRight size={14} /></span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: ORDERS ================= */}
        {activeTab === "orders" && (
          <div className="section-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, border: "none", display: "flex", alignItems: "center", gap: 8 }}><Package size={20} /> Order History & Tracking</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openBuyGasModal()}>
                + New Refill Order
              </button>
            </div>

            {/* Sub Filter Pills */}
            <div className="filter-row" style={{ marginBottom: 20 }}>
              <button
                className={`filter-pill ${orderHistorySubTab === "all" ? "active" : ""}`}
                onClick={() => setOrderHistorySubTab("all")}
              >
                All Orders ({orders.length})
              </button>
              <button
                className={`filter-pill ${orderHistorySubTab === "active" ? "active" : ""}`}
                onClick={() => setOrderHistorySubTab("active")}
              >
                Active
              </button>
              <button
                className={`filter-pill ${orderHistorySubTab === "completed" ? "active" : ""}`}
                onClick={() => setOrderHistorySubTab("completed")}
              >
                Completed
              </button>
              <button
                className={`filter-pill ${orderHistorySubTab === "cancelled" ? "active" : ""}`}
                onClick={() => setOrderHistorySubTab("cancelled")}
              >
                Cancelled
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Package size={48} color="var(--text-muted)" /></div>
                <h3>You haven't placed any orders yet</h3>
                <p>Find a gas retailer near you to refill your cylinder.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab("home")}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Find Gas Retailers <ArrowRight size={14} /></span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {orders
                  .filter((o) => {
                    const st = (o.status || "").toLowerCase();
                    if (orderHistorySubTab === "active")
                      return ["pending", "accepted", "preparing", "rider_assigned", "picked_up", "out_for_delivery"].includes(st);
                    if (orderHistorySubTab === "completed") return st === "delivered";
                    if (orderHistorySubTab === "cancelled") return st === "cancelled";
                    return true;
                  })
                  .map((ord) => {
                    const st = (ord.status || "PENDING").toUpperCase();
                    const dateStr = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                      : "Today";
                    const totalCost = Number(ord.totalCost || ord.TotalCost || ord.totalAmount || ord.TotalAmount || ord.gasCost || 0);

                    return (
                      <div
                        key={ord.id}
                        style={{
                          padding: 16,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 14,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ fontSize: 15 }}>Order #{String(ord.id).slice(0, 10).toUpperCase()}</strong>
                            <span className={`badge badge-${st.toLowerCase()}`}>{st}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={16} /> {ord.vendorName || "LPG Depot"}</span> • {ord.weightKg || ord.WeightKg} KG LPG
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            Ordered on {dateStr} • Total: <strong>₦{totalCost.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <Link to={`/track-order?orderId=${ord.id}`} className="btn btn-secondary btn-sm">
                            Track Status
                          </Link>
                          {st === "DELIVERED" && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleReorder(ord)}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Order Again <RefreshCw size={14} /></span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: INVENTORY ================= */}
        {activeTab === "inventory" && (
          <div className="section-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Container size={22} color="var(--orange)" /> My Gas Cylinder Inventory
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Manage your LPG cylinders, track refill history, and monitor last refilled dates.
                </p>
              </div>
              <button className="btn btn-primary" onClick={openAddCylinderModal}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Add New Cylinder</span>
              </button>
            </div>

            {cylinders.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}>
                  <Container size={56} color="var(--text-muted)" />
                </div>
                <h3>No cylinders in your inventory</h3>
                <p>Add your LPG gas cylinders to track when they were last refilled and get refill reminders.</p>
                <button className="btn btn-primary" onClick={openAddCylinderModal}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Add First Cylinder</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                {cylinders.map((cyl) => {
                  const statusColor =
                    cyl.status === "FULL"
                      ? "#10B981"
                      : cyl.status === "MEDIUM"
                      ? "#3B82F6"
                      : cyl.status === "LOW"
                      ? "#F59E0B"
                      : "#EF4444";
                  const statusPct =
                    cyl.status === "FULL"
                      ? "100%"
                      : cyl.status === "MEDIUM"
                      ? "50%"
                      : cyl.status === "LOW"
                      ? "25%"
                      : "5%";

                  return (
                    <div
                      key={cyl.id}
                      style={{
                        padding: "20px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        display: "flex",
                        flexDirection: "column",
                        justify: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "800",
                                background: "rgba(234, 88, 12, 0.12)",
                                color: "var(--orange)",
                                padding: "3px 10px",
                                borderRadius: "4px",
                              }}
                            >
                              {cyl.sizeKg} KG LPG
                            </span>
                            <h3 style={{ margin: "8px 0 2px", fontSize: "18px", fontWeight: "700" }}>{cyl.name}</h3>
                            {cyl.notes && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{cyl.notes}</p>}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "4px 10px",
                              borderRadius: "14px",
                              background: `${statusColor}18`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                            }}
                          >
                            {cyl.status || "FULL"}
                          </span>
                        </div>

                        {/* Gas level meter bar */}
                        <div style={{ margin: "14px 0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: 6 }}>
                            <span>Gas Capacity Gauge</span>
                            <span style={{ fontWeight: "700", color: statusColor }}>{statusPct} ({cyl.status})</span>
                          </div>
                          <div style={{ height: "8px", background: "var(--border-2)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: statusPct, background: statusColor, transition: "width 0.3s ease" }} />
                          </div>
                        </div>

                        {/* Detailed Last Refilled Card */}
                        <div
                          style={{
                            margin: "16px 0",
                            padding: "14px",
                            background: "var(--bg-gray)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--orange)", display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={14} /> LAST REFILLED
                            </span>
                            <span className="badge badge-secondary" style={{ fontSize: "11px" }}>
                              <Clock size={12} style={{ marginRight: 3 }} /> {getDaysSinceDate(cyl.lastRefilledDate)}
                            </span>
                          </div>

                          <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--text)" }}>
                            {cyl.lastRefilledDate || "No record"}
                          </div>

                          {cyl.lastVendor && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                              <Store size={13} /> Refilled at: <strong>{cyl.lastVendor}</strong>
                            </div>
                          )}

                          {cyl.lastPrice > 0 && (
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 2 }}>
                              Cost: <strong>₦{cyl.lastPrice.toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditCylinderModal(cyl)}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeleteCylinder(cyl.id)}
                          style={{ color: "#EF4444", borderColor: "#EF444440" }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => openBuyGasModal(null, cyl.sizeKg)}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Flame size={14} /> Refill {cyl.sizeKg}KG
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SAVED ================= */}
        {activeTab === "saved" && (
          <div className="section-box">
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Star size={20} fill="#F59E0B" color="#F59E0B" /> Saved Retailers ({savedVendorsList.length})</h3>

            {savedVendorsList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><Star size={48} fill="#F59E0B" color="#F59E0B" /></div>
                <h3>You haven't saved any retailers yet</h3>
                <p>Click the star icon on any retailer card to save it for fast access.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab("explore")}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Explore Retailers <ArrowRight size={14} /></span>
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {savedVendorsList.map((v) => (
                  <div key={v.id} className="vendor-card" style={{ marginBottom: 0 }}>
                    <div className="vendor-card-top">
                      <div>
                        <h3>{v.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {v.address}</p>
                      </div>
                      <button
                        onClick={() => toggleFavourite(v.id)}
                        style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}
                      >
                        <Star size={18} fill="#F59E0B" color="#F59E0B" />
                      </button>
                    </div>

                    <div style={{ margin: "10px 0" }}>
                      <strong className="price-val" style={{ fontSize: 18, color: "var(--orange)" }}>
                        ₦{v.pricePerKg.toLocaleString()} / kg
                      </strong>
                    </div>

                    <div className="vendor-btns">
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openBuyGasModal(v)}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Order Gas Now <ArrowRight size={14} /></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: PROFILE & ADDRESSES ================= */}
        {activeTab === "profile" && (
          <>
            {/* Account Details Card */}
            <div className="section-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, border: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={20} color="var(--orange)" /> Consumer Profile
                </h3>
                {!isEditingProfile && (
                  <button className="btn btn-secondary btn-sm" onClick={handleOpenEditProfile}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Edit3 size={14} /> Edit Profile</span>
                  </button>
                )}
              </div>

              {profileMsg && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} /> {profileMsg}
                  </span>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>First Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Save Profile Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>FIRST NAME</label>
                    <strong style={{ fontSize: 15 }}>{user?.firstName || (user?.name ? user.name.split(" ")[0] : "Customer")}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>LAST NAME</label>
                    <strong style={{ fontSize: 15 }}>{user?.lastName || (user?.name ? user.name.split(" ").slice(1).join(" ") : "") || "—"}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>EMAIL ADDRESS</label>
                    <strong style={{ fontSize: 15 }}>{user?.email}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>PHONE NUMBER</label>
                    <strong style={{ fontSize: 15 }}>{user?.phone || "08012345678"}</strong>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>ACCOUNT ROLE</label>
                    <span className="badge badge-confirmed">CUSTOMER</span>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Addresses Manager */}
            <div className="section-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, border: "none", display: "flex", alignItems: "center", gap: 8 }}><MapPin size={20} /> Saved Delivery Addresses</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressForm({ label: "Home", address: "", instructions: "" });
                    setAddressModalOpen(true);
                  }}
                >
                  + Add New Address
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {addresses.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px", textAlign: "center", background: "var(--bg-gray)", borderRadius: "var(--radius)" }}>
                    <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><MapPin size={48} color="var(--text-muted)" /></div>
                    <h4 style={{ margin: "8px 0 4px" }}>No delivery address added yet</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      Fill in your home or work address so vendor riders can deliver gas directly to your doorstep.
                    </p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressForm({ label: "Home", address: "", instructions: "" });
                        setAddressModalOpen(true);
                      }}
                    >
                      + Add Delivery Address
                    </button>
                  </div>
                ) : (
                  addresses.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: 16,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 14 }}>{a.label}</strong>
                          {a.isDefault && <span className="badge badge-delivered">DEFAULT</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{a.address}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {!a.isDefault && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleSetDefaultAddress(a.id)}>
                            Make Default
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingAddress(a);
                            setAddressForm({ label: a.label, address: a.address, instructions: a.instructions || "" });
                            setAddressModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAddress(a.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>


      {/* ================= MODAL 1: MULTI-STEP BUY GAS ORDER FLOW ================= */}
      {orderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Flame size={20} color="var(--orange)" /> Place Refill Order (Step {orderStep} of 3)</h3>
              <button className="modal-close" onClick={() => setOrderModalOpen(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            </div>

            {orderError && <div className="alert alert-error"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={16} /> {orderError}</span></div>}

            {/* Step 1: Select Retailer */}
            {orderStep === 1 && (
              <div>
                <label className="form-group label" style={{ fontSize: 13, fontWeight: 700 }}>
                  Select LPG Gas Station / Retailer
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "10px 0 20px" }}>
                  {vendors.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setOrderVendor(v)}
                      style={{
                        padding: 12,
                        borderRadius: "var(--radius)",
                        border: orderVendor?.id === v.id ? "2px solid var(--orange)" : "1px solid var(--border)",
                        background: orderVendor?.id === v.id ? "var(--orange-light)" : "var(--bg-card)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{v.name}</strong>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {v.address}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: "var(--orange)" }}>₦{v.pricePerKg}/kg</strong>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.distanceKm} km away</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-full"
                  disabled={!orderVendor}
                  onClick={() => setOrderStep(2)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Continue to Quantity <ArrowRight size={14} /></span>
                </button>
              </div>
            )}

            {/* Step 2: Select Quantity & Fulfillment */}
            {orderStep === 2 && orderVendor && (
              <div>
                <div style={{ padding: 12, background: "var(--bg-gray)", borderRadius: "var(--radius)", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>SELECTED RETAILER</span>
                  <div style={{ fontWeight: 700 }}>{orderVendor.name}</div>
                  <div style={{ fontSize: 13, color: "var(--orange)", fontWeight: 700 }}>
                    Live Price: ₦{orderVendor.pricePerKg.toLocaleString()} / KG
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Gas Cylinder Weight</label>
                  <div className="weight-options">
                    {[3, 6, 12.5, 25].map((w) => (
                      <div
                        key={w}
                        className={`weight-option ${selectedKg === w ? "active" : ""}`}
                        onClick={() => {
                          setSelectedKg(w);
                          setCustomKg("");
                        }}
                      >
                        <span className="weight-kg">{w} KG</span>
                      </div>
                    ))}
                  </div>

                  <div
                    onClick={() => setSelectedKg("custom")}
                    style={{
                      padding: 10,
                      border: selectedKg === "custom" ? "2px solid var(--orange)" : "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      marginBottom: 16,
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Custom Quantity (KG)
                    </label>
                    {selectedKg === "custom" && (
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter weight in KG (e.g. 15)"
                        value={customKg}
                        onChange={(e) => setCustomKg(e.target.value)}
                        style={{ marginTop: 6 }}
                        min="1"
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Fulfillment Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      type="button"
                      className={`btn ${fulfillment === "delivery" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setFulfillment("delivery")}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Truck size={16} /> Home Delivery (+₦1,000)</span>
                    </button>
                    <button
                      type="button"
                      className={`btn ${fulfillment === "pickup" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setFulfillment("pickup")}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={16} /> Station Pickup (Free)</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOrderStep(1)}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Back</span>
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const w = selectedKg === "custom" ? Number(customKg) : Number(selectedKg);
                      if (!w || w <= 0) {
                        setOrderError("Please specify a valid weight greater than 0 KG.");
                        return;
                      }
                      setOrderError("");
                      setOrderStep(3);
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Review Order <ArrowRight size={14} /></span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Summary & Confirmation */}
            {orderStep === 3 && orderVendor && (
              <div>
                {(() => {
                  const weight = selectedKg === "custom" ? Number(customKg) : Number(selectedKg);
                  const gasCost = weight * orderVendor.pricePerKg;
                  const delFee = fulfillment === "delivery" ? 1000 : 0;
                  const total = gasCost + delFee;

                  return (
                    <div>
                      <div
                        style={{
                          padding: 16,
                          background: "var(--bg-gray)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          marginBottom: 18,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Retailer:</span>
                          <strong>{orderVendor.name}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Gas Weight:</span>
                          <strong>{weight} KG</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Rate:</span>
                          <span>₦{orderVendor.pricePerKg.toLocaleString()} / KG</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Gas Cost:</span>
                          <span>₦{gasCost.toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Fulfillment:</span>
                          <span>{fulfillment === "delivery" ? "Home Delivery (₦1,000)" : "Station Pickup (Free)"}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span>Deliver To:</span>
                          <span style={{ fontSize: 12 }}>{locationLabel}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px dashed var(--border-2)",
                            fontSize: 18,
                            fontWeight: 800,
                            color: "var(--orange)",
                          }}
                        >
                          <span>TOTAL COST:</span>
                          <span>₦{total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOrderStep(2)}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Back</span>
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          disabled={orderSubmitting}
                          onClick={handleCreateOrderSubmit}
                        >
                          {orderSubmitting ? (
                            "Creating Order..."
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              Confirm & Submit Order <Rocket size={16} />
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: RETAILER DETAIL MODAL ================= */}
      {selectedVendorForModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Store size={20} color="var(--orange)" /> Retailer Station Profile</h3>
              <button className="modal-close" onClick={() => setSelectedVendorForModal(null)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            </div>

            <h2>{selectedVendorForModal.name}</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {selectedVendorForModal.address}</p>

            <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
              <span className="dist-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {selectedVendorForModal.distanceKm} km away</span>
              <span style={{ fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><Star size={14} fill="#F59E0B" color="#F59E0B" /> {selectedVendorForModal.rating}</span>
              {renderAvailabilityBadge(selectedVendorForModal.availability, selectedVendorForModal.lastUpdated)}
            </div>

            <div className="section-box" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Current Price:</span>
                <strong style={{ color: "var(--orange)" }}>₦{selectedVendorForModal.pricePerKg.toLocaleString()} / KG</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Operating Hours:</span>
                <span>{selectedVendorForModal.hours}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Phone:</span>
                <a href={`tel:${selectedVendorForModal.phone}`}>{selectedVendorForModal.phone}</a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Home Delivery:</span>
                <span>{selectedVendorForModal.deliveryAvailable ? "Yes (Delivery Available)" : "No"}</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                const v = selectedVendorForModal;
                setSelectedVendorForModal(null);
                openBuyGasModal(v);
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Order Cooking Gas From Station <ArrowRight size={14} /></span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ADDRESS ADD/EDIT MODAL ================= */}
      {addressModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={20} color="var(--orange)" /> {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}</h3>
              <button className="modal-close" onClick={() => setAddressModalOpen(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className="form-group">
                <label>Address Label</label>
                <select
                  className="form-select"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Full Delivery Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 14 Tanke Road, Opposite Unilorin Gate, Ilorin"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CYLINDER ADD/EDIT MODAL ================= */}
      {cylinderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Container size={20} color="var(--orange)" /> {editingCylinder ? "Edit Gas Cylinder" : "Add Gas Cylinder to Inventory"}
              </h3>
              <button
                className="modal-close"
                onClick={() => setCylinderModalOpen(false)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCylinder}>
              <div className="form-group">
                <label>Cylinder Label / Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Main Kitchen Cylinder, 6kg Generator Cylinder"
                  value={cylinderForm.name}
                  onChange={(e) => setCylinderForm({ ...cylinderForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cylinder Size (KG)</label>
                <select
                  className="form-select"
                  value={cylinderForm.sizeKg}
                  onChange={(e) => setCylinderForm({ ...cylinderForm, sizeKg: Number(e.target.value) })}
                >
                  <option value={3}>3 KG (Camping / Single Burner)</option>
                  <option value={6}>6 KG (Small Household / Generator)</option>
                  <option value={12.5}>12.5 KG (Standard Family Size)</option>
                  <option value={25}>25 KG (Commercial / Restaurant)</option>
                  <option value={50}>50 KG (Industrial Bulk)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Current Gas Status</label>
                <select
                  className="form-select"
                  value={cylinderForm.status}
                  onChange={(e) => setCylinderForm({ ...cylinderForm, status: e.target.value })}
                >
                  <option value="FULL">FULL (100%)</option>
                  <option value="MEDIUM">MEDIUM (~50%)</option>
                  <option value="LOW">LOW (~25% - Needs Refill Soon)</option>
                  <option value="EMPTY">EMPTY (0% - Requires Immediate Refill)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Last Refilled Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={cylinderForm.lastRefilledDate}
                  onChange={(e) => setCylinderForm({ ...cylinderForm, lastRefilledDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes / Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Located in outdoor kitchen store"
                  value={cylinderForm.notes}
                  onChange={(e) => setCylinderForm({ ...cylinderForm, notes: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
                {editingCylinder ? "Save Changes" : "Add Cylinder to Inventory"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
