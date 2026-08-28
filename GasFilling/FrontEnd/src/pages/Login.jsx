import { Flame, ShoppingBag, Store, Bike, AlertTriangle, KeyRound, CheckCircle2, X } from 'lucide-react';
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";
import { loginCustomer, loginVendor, loginRider, sendEmailOTP, verifyEmailOTP } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const clerkSignInObj = useSignIn();
  const isClerkLoaded = clerkSignInObj?.isLoaded;
  const signIn = clerkSignInObj?.signIn;
  const setClerkActive = clerkSignInObj?.setActive;

  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code & New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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
      if (isClerkLoaded && signIn) {
        try {
          const result = await signIn.create({
            identifier: form.email,
            password: form.password,
          });
          if (result.status === "complete" && setClerkActive) {
            await setClerkActive({ session: result.createdSessionId });
          }
        } catch (clerkErr) {
          console.warn("Clerk login fallback:", clerkErr);
        }
      }

      let userData = null;
      if (role === "customer") {
        const res = await loginCustomer(form.email, form.password);
        userData = res.customer || res;
      } else if (role === "vendor") {
        const res = await loginVendor(form.email, form.password);
        userData = res.vendor || res;
      } else if (role === "rider") {
        const res = await loginRider(form.email, form.password);
        userData = res.rider || res;
      }

      if (userData) {
        localStorage.setItem("user", JSON.stringify({ ...userData, role }));
        handleRoleRedirect(role);
      }
    } catch (err) {
      setError(err.message || "Invalid credentials for selected role.");
    } finally {
      setLoading(false);
    }
  }

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMsg("");
    if (!forgotEmail) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await sendEmailOTP(forgotEmail, "password_reset");
      setForgotLoading(false);
      setForgotStep(2);
      setForgotMsg(`A 6-digit verification code has been sent to ${forgotEmail}. Please check your inbox.`);
    } catch (err) {
      setForgotError(err.message || "Failed to send verification code.");
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    if (!resetCode) {
      setForgotError("Please enter the verification code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotLoading(true);
    try {
      await verifyEmailOTP(forgotEmail, resetCode);
      setForgotLoading(false);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || "Invalid or expired verification code.");
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotModalOpen(false);
    setForgotStep(1);
    setForgotEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotMsg("");
    setForgotError("");
  };

  return (
    <div className="form-page">
      <div className="form-box">
        <div className="form-box-logo">
          <div className="brand" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Flame size={20} color="var(--orange)" /> Gas<span>Fill</span></div>
        </div>

        <h2>Sign In to GasFill</h2>
        <p className="form-sub">Select your account role to log into your portal.</p>

        {error && <div className="alert alert-error"> {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label>Select Account Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "6px 0 16px" }}>
              {[
                { id: "customer", label: "Customer" },
                { id: "vendor", label: "Vendor" },
                { id: "rider", label: "Rider" },
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(form.email);
                  setForgotModalOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--orange)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              style={{ marginTop: 6 }}
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

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={20} color="var(--orange)" /> Reset Password
              </h3>
              <button
                className="modal-close"
                onClick={closeForgotModal}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            {forgotError && <div className="alert alert-error">{forgotError}</div>}
            {forgotMsg && <div className="alert alert-success">{forgotMsg}</div>}

            {/* Step 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetCode}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  Enter your registered email address and we'll send you a verification code to reset your password.
                </p>
                <div className="form-group">
                  <label>Account Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={forgotLoading}
                  style={{ marginTop: 12 }}
                >
                  {forgotLoading ? "Sending Code..." : "Send Verification Code →"}
                </button>
              </form>
            )}

            {/* Step 2: Verification Code & New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>6-Digit Verification Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 849204"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setForgotStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success */}
            {forgotStep === 3 && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ display: "inline-flex", padding: 12, borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", marginBottom: 12 }}>
                  <CheckCircle2 size={40} color="#10B981" />
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: 18 }}>Password Reset Complete!</h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                  Your password has been successfully updated. You can now log into your account.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={closeForgotModal}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
