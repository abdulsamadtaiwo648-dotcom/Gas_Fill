import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginCustomer } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [role, setRole]       = useState("customer");
  const [form, setForm]       = useState({ email: "", password: "" });
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

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (role === "customer") {
        const data = await loginCustomer(form.email, form.password);
        if (data.customer) {
          localStorage.setItem("user", JSON.stringify({ ...data.customer, role }));
        }
      } else {
        localStorage.setItem("user", JSON.stringify({ email: form.email, name: form.email.split("@")[0], role }));
      }
      handleRoleRedirect(role);
    } catch (err) {
      // Demo fallback if account not in db yet
      localStorage.setItem("user", JSON.stringify({ email: form.email, name: form.email.split("@")[0], role }));
      handleRoleRedirect(role);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-box">
        <div className="form-box-logo">
          <div className="brand">🔥 Gas<span>Fill</span></div>
        </div>

        <h2>Sign In to GasFill</h2>
        <p className="form-sub">Select your account role to log into your portal.</p>

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
            <label htmlFor="email">Email Address</label>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Authenticating..." : `Sign In as ${role.toUpperCase()} →`}
          </button>
        </form>

        <div className="form-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
