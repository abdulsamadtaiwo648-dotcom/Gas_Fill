import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleRoleRedirect(selectedRole) {
    if (selectedRole === "vendor") {
      navigate("/vendor-dashboard");
    } else if (selectedRole === "rider") {
      navigate("/rider-dashboard");
    } else {
      navigate("/dashboard");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (role === "customer") {
        const data = await registerCustomer({
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          password: form.password,
        });
        if (data.customer) {
          localStorage.setItem("user", JSON.stringify({ ...data.customer, role }));
        }
      } else {
        localStorage.setItem("user", JSON.stringify({ name: form.name, email: form.email, phone: form.phone, role }));
      }
      handleRoleRedirect(role);
    } catch (err) {
      localStorage.setItem("user", JSON.stringify({ name: form.name, email: form.email, phone: form.phone, role }));
      handleRoleRedirect(role);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-box form-box-wide">
        <div className="form-box-logo">
          <div className="brand">🔥 Gas<span>Fill</span></div>
        </div>

        <h2>Register Account</h2>
        <p className="form-sub">Choose your role and create your account to get started.</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label>Select Account Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "6px 0 16px" }}>
              {[
                { id: "customer", label: "🛍️ Customer" },
                { id: "vendor",   label: "🏪 Vendor" },
                { id: "rider",    label: "🛵 Rider" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`btn ${role === r.id ? "btn-primary" : "btn-secondary"} btn-sm`}
                  onClick={() => setRole(r.id)}
                  style={{ padding: "8px 4px", fontSize: "12px", justifyContent: "center" }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name / Business Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder={role === "vendor" ? "e.g. Lagos Gas Depot" : "e.g. Amaka Johnson"}
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="080XXXXXXXX"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Registering..." : `Register as ${role.toUpperCase()} →`}
          </button>
        </form>

        <div className="form-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
