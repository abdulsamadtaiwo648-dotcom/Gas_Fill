const API_URL = typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:8080/api";

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