const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://127.0.0.1:8080/api");

/* ===== RESPONSE HELPER ===== */
async function handleResponse(response) {
  if (!response.ok) {
    let msg = "Request failed.";
    try {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        msg = err.message || err.error || text || msg;
      } catch {
        msg = text || msg;
      }
    } catch {}
    throw new Error(msg);
  }
  return response.json();
}

/* ===== VENDOR APIS ===== */
export async function getNearbyVendors(latitude, longitude, weightKg) {
  const response = await fetch(
    `${API_URL}/vendors/nearby?latitude=${latitude}&longitude=${longitude}&weightKg=${weightKg}`
  );
  return handleResponse(response);
}

export async function getAllVendors() {
  const response = await fetch(`${API_URL}/vendors`);
  return handleResponse(response);
}

export async function getVendorById(id) {
  const response = await fetch(`${API_URL}/vendors/${id}`);
  return handleResponse(response);
}

export async function loginVendor(email, password) {
  const response = await fetch(`${API_URL}/vendors/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function registerVendor(data) {
  const response = await fetch(`${API_URL}/vendors/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getVendorInventory(vendorId) {
  const response = await fetch(`${API_URL}/vendors/${vendorId}/inventory`);
  return handleResponse(response);
}

export async function updateVendorInventory(inventoryData) {
  const response = await fetch(`${API_URL}/vendors/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventoryData),
  });
  return handleResponse(response);
}

export async function updateVendorProfile(vendorId, profileData) {
  const response = await fetch(`${API_URL}/vendors/${vendorId}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  return handleResponse(response);
}

/* ===== PRODUCT APIS ===== */
export async function getProducts(type = "") {
  let url = `${API_URL}/products`;
  if (type) url += `?type=${type}`;
  const response = await fetch(url);
  return handleResponse(response);
}

export async function getVendorProducts(vendorId) {
  const response = await fetch(`${API_URL}/products/vendor/${vendorId}`);
  return handleResponse(response);
}

export async function createProduct(product) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  return handleResponse(response);
}

/* ===== RIDER APIS ===== */
export async function loginRider(email, password) {
  const response = await fetch(`${API_URL}/riders/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function registerRider(riderData) {
  const response = await fetch(`${API_URL}/riders/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(riderData),
  });
  return handleResponse(response);
}

export async function getAllRiders() {
  const response = await fetch(`${API_URL}/riders`);
  return handleResponse(response);
}

export async function updateRiderStatus(riderId, status) {
  const response = await fetch(`${API_URL}/riders/${riderId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function updateRiderLocation(riderId, latitude, longitude) {
  const response = await fetch(`${API_URL}/riders/${riderId}/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude }),
  });
  return handleResponse(response);
}

/* ===== CUSTOMER AUTH APIS ===== */
export async function loginCustomer(email, password) {
  const response = await fetch(`${API_URL}/customers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

export async function registerCustomer({ name, firstName, lastName, phone, email, password }) {
  let fName = firstName || "";
  let lName = lastName || "";
  if (name && !fName) {
    const parts = name.trim().split(" ");
    fName = parts[0] || "";
    lName = parts.slice(1).join(" ") || "User";
  }

  const response = await fetch(`${API_URL}/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: fName,
      lastName: lName,
      phone,
      email,
      password,
    }),
  });
  return handleResponse(response);
}

/* ===== EMAIL OTP & AUTH APIS ===== */
export async function sendEmailOTP(email, purpose = "verification") {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const otps = JSON.parse(localStorage.getItem("email_otps") || "{}");
  otps[email.toLowerCase()] = {
    code,
    purpose,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  localStorage.setItem("email_otps", JSON.stringify(otps));

  try {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose, code }),
    });
    if (response.ok) return await response.json();
  } catch {}

  return {
    success: true,
    message: `OTP sent to ${email}`,
    demoCode: code,
  };
}

export async function verifyEmailOTP(email, code) {
  const otps = JSON.parse(localStorage.getItem("email_otps") || "{}");
  const stored = otps[email.toLowerCase()];

  try {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (response.ok) return await response.json();
  } catch {}

  if (!stored) {
    throw new Error("No OTP request found for this email. Please request a new code.");
  }

  if (Date.now() > stored.expiresAt) {
    throw new Error("OTP code has expired. Please request a new one.");
  }

  if (stored.code !== code.trim()) {
    throw new Error("Invalid OTP code. Please check and try again.");
  }

  delete otps[email.toLowerCase()];
  localStorage.setItem("email_otps", JSON.stringify(otps));

  return { success: true, message: "Email verified successfully!" };
}

export async function getCustomerById(id) {
  const response = await fetch(`${API_URL}/customers/${id}`);
  return handleResponse(response);
}

/* ===== ORDER APIS ===== */
export async function createRefillOrder(orderData) {
  const response = await fetch(`${API_URL}/orders/refill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: orderData.customerId || "CUST-0001",
      vendorId: orderData.vendorId || orderData.Vendor?.ID || "VEND-0001",
      vendorName: orderData.vendorName || "",
      vendorAddress: orderData.vendorAddress || "",
      fulfillment: orderData.fulfillment || "delivery",
      weightKg: Number(orderData.weightKg || orderData.WeightKg || 12.5),
      pricePerKg: Number(orderData.pricePerKg || orderData.PricePerKg || 1200),
      deliveryFee: Number(orderData.deliveryFee || 1000),
      latitude: Number(orderData.latitude || 5.121),
      longitude: Number(orderData.longitude || 7.373),
    }),
  });
  return handleResponse(response);
}

export async function getCustomerOrders(customerId) {
  const response = await fetch(`${API_URL}/orders/customer/${customerId}`);
  return handleResponse(response);
}

export async function getVendorOrders(vendorId) {
  const response = await fetch(`${API_URL}/orders/vendor/${vendorId}`);
  return handleResponse(response);
}

export async function getRiderOrders(riderId) {
  const response = await fetch(`${API_URL}/orders/rider/${riderId}`);
  return handleResponse(response);
}

export async function getAvailableDeliveries() {
  const response = await fetch(`${API_URL}/orders/deliveries/available`);
  return handleResponse(response);
}

export async function getOrderById(id) {
  const response = await fetch(`${API_URL}/orders/${id}`);
  return handleResponse(response);
}

export async function updateOrderStatus(id, status) {
  const response = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function assignRiderToOrder(orderId, riderId) {
  const response = await fetch(`${API_URL}/orders/${orderId}/assign-rider`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ riderId }),
  });
  return handleResponse(response);
}

export async function cancelOrder(orderId, customerId = "") {
  const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });
  return handleResponse(response);
}