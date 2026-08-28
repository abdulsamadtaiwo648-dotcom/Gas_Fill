import { Flame, ShoppingBag, Store, Bike, AlertTriangle, KeyRound, Mail, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { registerCustomer, registerVendor, registerRider, sendEmailOTP, verifyEmailOTP } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const clerkSignUpObj = useSignUp();
  const isClerkLoaded = clerkSignUpObj?.isLoaded;
  const signUp = clerkSignUpObj?.signUp;
  const setClerkActive = clerkSignUpObj?.setActive;

  const [role, setRole] = useState("customer");
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verification
  const [usingClerk, setUsingClerk] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let timer;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

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

  // Step 1 Submit: Trigger Email OTP via Clerk or System Service
  async function handleStartVerification(e) {
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

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isClerkLoaded && signUp) {
        try {
          await signUp.create({
            emailAddress: form.email,
            password: form.password,
            firstName: form.name.trim().split(" ")[0],
            lastName: form.name.trim().split(" ").slice(1).join(" ") || "User",
          });
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setUsingClerk(true);
        } catch (clerkErr) {
          console.warn("Clerk auth dispatch fallback:", clerkErr);
          await sendEmailOTP(form.email, "registration");
          setUsingClerk(false);
        }
      } else {
        await sendEmailOTP(form.email, "registration");
        setUsingClerk(false);
      }

      setStep(2);
      setResendTimer(60);
      setCanResend(false);
      setSuccessMsg(`A 6-digit confirmation code has been sent to ${form.email}`);
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP Code
  async function handleResendOTP() {
    if (!canResend) return;
    setError("");
    setLoading(true);
    try {
      if (usingClerk && signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        await sendEmailOTP(form.email, "registration");
      }
      setResendTimer(60);
      setCanResend(false);
      setSuccessMsg(`A new verification code has been sent to ${form.email}`);
    } catch (err) {
      setError("Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2 Submit: Verify OTP and Register Account
  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    setError("");

    if (!otpCode || otpCode.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      if (usingClerk && signUp) {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: otpCode,
        });
        if (completeSignUp.status === "complete" && setClerkActive) {
          await setClerkActive({ session: completeSignUp.createdSessionId });
        }
      } else {
        await verifyEmailOTP(form.email, otpCode);
      }

      // Complete registration in database
      let registeredUser = null;
      if (role === "customer") {
        const data = await registerCustomer({
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          password: form.password,
        });
        registeredUser = data.customer || data;
      } else if (role === "vendor") {
        const data = await registerVendor({
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          address:  form.address || "Main Street, Depot City",
          password: form.password,
        });
        registeredUser = data.vendor || data;
      } else if (role === "rider") {
        const data = await registerRider({
          name:     form.name,
          email:    form.email,
          phone:    form.phone,
          password: form.password,
        });
        registeredUser = data.rider || data;
      }

      if (registeredUser) {
        localStorage.setItem("user", JSON.stringify({ ...registeredUser, role, emailVerified: true }));
        handleRoleRedirect(role);
      }
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-box form-box-wide">
        <div className="form-box-logo">
          <div className="brand" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flame size={20} color="var(--orange)" /> Gas<span>Fill</span>
          </div>
        </div>

        {step === 1 ? (
          <>
            <h2>Create GasFill Account</h2>
            <p className="form-sub">Choose your account role and enter your details to get started.</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleStartVerification}>
              {/* Role Selection */}
              <div className="form-group">
                <label>Select Account Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "6px 0 16px" }}>
                  {[
                    { id: "customer", label: "Customer" },
                    { id: "vendor",   label: "Vendor" },
                    { id: "rider",    label: "Rider" },
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
                {loading ? "Sending Code..." : `Register as ${role.toUpperCase()} →`}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(1)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 12,
              }}
            >
              <ArrowLeft size={16} /> Edit Account Details
            </button>

            <h2>Verify Email Address</h2>
            <p className="form-sub">
              We sent a 6-digit confirmation code to <strong>{form.email}</strong>. Please check your inbox and enter it below.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <form onSubmit={handleVerifyAndRegister}>
              <div className="form-group">
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: 22,
                    letterSpacing: 6,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 20px" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the email?"}
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: canResend ? "var(--orange)" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: canResend ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <RefreshCw size={13} /> Resend Code
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Verifying Code..." : `Verify Email & Activate Account →`}
              </button>
            </form>
          </>
        )}

        <div className="form-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
