function apiGet(params = {}) {
  const url = new URL(APP_CONFIG.API_BASE_URL);

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      url.searchParams.append(key, params[key]);
    }
  });

  return fetch(url.toString())
    .then(res => res.json());
}

function apiPost(payload = {}) {
  return fetch(APP_CONFIG.API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  }).then(res => res.json());
}

function setSession(user) {
  localStorage.setItem("isp_user", JSON.stringify(user));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("isp_user") || "null");
  } catch (e) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem("isp_user");
}

function requireRole(role) {
  const user = getSession();
  if (!user || !user.role) {
    window.location.href = "index.html";
    return null;
  }

  if (role && user.role !== role) {
    if (user.role === "ADMIN") {
      window.location.href = "admin.html";
    } else if (user.role === "STAFF") {
      window.location.href = "staff.html";
    } else {
      window.location.href = "index.html";
    }
    return null;
  }

  return user;
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(elId, message, isError = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message || "";
  el.className = isError ? "message error" : "message success";
}

function formatMoney(value) {
  const num = Number(value || 0);
  return "₱" + num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
