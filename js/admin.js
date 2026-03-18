let subscribersCache = [];
let isEditMode = false;

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireRole("ADMIN");
  if (!user) return;

  const welcome = document.getElementById("welcomeText");
  if (welcome) {
    welcome.textContent = `Welcome, ${user.full_name || user.username}`;
  }

  bindAdminEvents();
  await loadSubscribers();
  await loadBilling();
  await loadBillingSummary();
});

function bindAdminEvents() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const addForm = document.getElementById("addSubscriberForm");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isEditMode) {
        await updateSubscriber();
      } else {
        await addSubscriber();
      }
    });
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSubscribers(searchInput.value.trim());
    });
  }

  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetFormMode);
  }

  const genBtn = document.getElementById("generateBillingBtn");
  if (genBtn) {
    genBtn.addEventListener("click", generateBilling);
  }

  bindInstallationDateAutoDueDay();
}

function bindInstallationDateAutoDueDay() {
  const installationDateEl = document.getElementById("installation_date");
  if (!installationDateEl) return;

  installationDateEl.addEventListener("change", () => {
    updateDueDayFromInstallationDate();
  });
}

function updateDueDayFromInstallationDate() {
  const installationDateEl = document.getElementById("installation_date");
  const dueDayEl = document.getElementById("due_day");
  if (!installationDateEl || !dueDayEl) return;

  const value = installationDateEl.value;
  if (!value) {
    dueDayEl.value = "";
    return;
  }

  const d = new Date(value);
  if (isNaN(d.getTime())) {
    dueDayEl.value = "";
    return;
  }

  dueDayEl.value = d.getDate();
}

async function loadSubscribers() {
  try {
    showMessage("pageMessage", "Loading subscribers...", false);

    const result = await apiGet({
      action: "getSubscribers"
    });

    if (!result.success) {
      showMessage("pageMessage", result.message || "Failed to load subscribers.", true);
      return;
    }

    subscribersCache = result.data || [];
    renderSubscribers();
    updateSummaryCards();
    showMessage("pageMessage", "Subscribers loaded successfully.", false);
  } catch (err) {
    showMessage("pageMessage", "Unable to load subscribers.", true);
  }
}

function updateSummaryCards() {
  const total = subscribersCache.length;
  const active = subscribersCache.filter(x => String(x.status).toUpperCase() === "ACTIVE").length;
  const disabled = subscribersCache.filter(x => String(x.status).toUpperCase() === "TEMP DISABLED").length;
  const disconnected = subscribersCache.filter(x => String(x.status).toUpperCase() === "DISCONNECTED").length;

  document.getElementById("cardTotal").textContent = total;
  document.getElementById("cardActive").textContent = active;
  document.getElementById("cardDisabled").textContent = disabled;
  document.getElementById("cardDisconnected").textContent = disconnected;
}

function renderSubscribers(keyword = "") {
  const tbody = document.getElementById("subscriberTableBody");
  if (!tbody) return;

  let rows = [...subscribersCache];

  if (keyword) {
    const q = keyword.toLowerCase();
    rows = rows.filter(item =>
      String(item.subscriber_id).toLowerCase().includes(q) ||
      String(item.account_no).toLowerCase().includes(q) ||
      String(item.full_name).toLowerCase().includes(q) ||
      String(item.contact_number).toLowerCase().includes(q) ||
      String(item.plan_name).toLowerCase().includes(q) ||
      String(item.assigned_ip).toLowerCase().includes(q) ||
      String(item.MAC_address).toLowerCase().includes(q) ||
      String(item.olt_port).toLowerCase().includes(q) ||
      String(item.onu_serial).toLowerCase().includes(q)
    );
  }

  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-cell">No subscribers found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
      <td><button type="button" class="btn-light" onclick="startEdit('${escapeJs(item.subscriber_id)}')">Edit</button></td>
      <td>${escapeHtml(item.subscriber_id)}</td>
      <td>${escapeHtml(item.account_no)}</td>
      <td>${escapeHtml(item.full_name)}</td>
      <td>${escapeHtml(item.plan_name)}</td>
      <td>${formatMoney(item.monthly_fee)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.contact_number)}</td>
      <td>${escapeHtml(item.assigned_ip)}</td>
      <td>${escapeHtml(item.MAC_address)}</td>
      <td>${escapeHtml(item.olt_port)}</td>
      <td>${escapeHtml(item.onu_serial)}</td>
    </tr>
  `).join("");
}

function startEdit(subscriberId) {
  const item = subscribersCache.find(x => String(x.subscriber_id) === String(subscriberId));
  if (!item) {
    showMessage("formMessage", "Subscriber not found for edit.", true);
    return;
  }

  isEditMode = true;

  document.getElementById("formTitle").textContent = "Edit Subscriber";
  document.getElementById("saveBtn").textContent = "Update Subscriber";
  document.getElementById("cancelEditBtn").style.display = "inline-block";

  document.getElementById("subscriber_id").value = item.subscriber_id || "";
  document.getElementById("account_no").value = item.account_no || "";
  document.getElementById("full_name").value = item.full_name || "";
  document.getElementById("address").value = item.address || "";
  document.getElementById("contact_number").value = item.contact_number || "";
  document.getElementById("email").value = item.email || "";
  document.getElementById("plan_name").value = item.plan_name || "";
  document.getElementById("monthly_fee").value = item.monthly_fee || "";
  document.getElementById("installation_date").value = normalizeInputDate(item.installation_date);
  updateDueDayFromInstallationDate();
  document.getElementById("status").value = item.status || "ACTIVE";
  document.getElementById("portal_password").value = item.portal_password || "";
  document.getElementById("MAC_address").value = item.MAC_address || "";
  document.getElementById("assigned_ip").value = item.assigned_ip || "";
  document.getElementById("olt_port").value = item.olt_port || "";
  document.getElementById("onu_serial").value = item.onu_serial || "";
  document.getElementById("remarks").value = item.remarks || "";

  showMessage("formMessage", "Editing subscriber: " + (item.full_name || item.account_no), false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFormMode() {
  isEditMode = false;
  document.getElementById("addSubscriberForm").reset();
  document.getElementById("subscriber_id").value = "";
  document.getElementById("formTitle").textContent = "Add New Subscriber";
  document.getElementById("saveBtn").textContent = "Save Subscriber";
  document.getElementById("cancelEditBtn").style.display = "none";
  showMessage("formMessage", "", false);
}

async function addSubscriber() {
  const payload = collectFormPayload("addSubscriber");

  try {
    showMessage("formMessage", "Saving subscriber...", false);

    const result = await apiPost(payload);

    if (!result.success) {
      showMessage("formMessage", result.message || "Failed to add subscriber.", true);
      return;
    }

    const newAccountNo = result?.data?.account_no || "";

    resetFormMode();
    showMessage(
      "formMessage",
      "Subscriber added successfully." + (newAccountNo ? " Account No: " + newAccountNo : ""),
      false
    );
    await loadSubscribers();
  } catch (err) {
    showMessage("formMessage", "Unable to save subscriber.", true);
  }
}

async function updateSubscriber() {
  const payload = collectFormPayload("updateSubscriber");

  try {
    showMessage("formMessage", "Updating subscriber...", false);

    const result = await apiPost(payload);

    if (!result.success) {
      showMessage("formMessage", result.message || "Failed to update subscriber.", true);
      return;
    }

    resetFormMode();
    showMessage("formMessage", "Subscriber updated successfully.", false);
    await loadSubscribers();
  } catch (err) {
    showMessage("formMessage", "Unable to update subscriber.", true);
  }
}

function collectFormPayload(actionName) {
  const payload = {
    action: actionName,
    subscriber_id: document.getElementById("subscriber_id").value.trim(),
    full_name: document.getElementById("full_name").value.trim(),
    address: document.getElementById("address").value.trim(),
    contact_number: document.getElementById("contact_number").value.trim(),
    email: document.getElementById("email").value.trim(),
    plan_name: document.getElementById("plan_name").value.trim(),
    monthly_fee: document.getElementById("monthly_fee").value.trim(),
    installation_date: document.getElementById("installation_date").value.trim(),
    due_day: document.getElementById("due_day").value.trim(),
    status: document.getElementById("status").value.trim(),
    portal_password: document.getElementById("portal_password").value.trim(),
    MAC_address: document.getElementById("MAC_address").value.trim(),
    assigned_ip: document.getElementById("assigned_ip").value.trim(),
    olt_port: document.getElementById("olt_port").value.trim(),
    onu_serial: document.getElementById("onu_serial").value.trim(),
    remarks: document.getElementById("remarks").value.trim()
  };

  if (actionName === "updateSubscriber") {
    payload.account_no = document.getElementById("account_no").value.trim();
  }

  return payload;
}

async function loadBilling() {
  try {
    showMessage("billingMessage", "Loading billing...", false);

    const result = await apiGet({ action: "getBilling" });

    if (!result.success) {
      showMessage("billingMessage", result.message || "Failed to load billing.", true);
      return;
    }

    renderBilling(result.data || []);
    showMessage("billingMessage", "Billing loaded successfully.", false);
  } catch (err) {
    showMessage("billingMessage", "Failed to load billing.", true);
  }
}

function renderBilling(data) {
  const tbody = document.getElementById("billingTableBody");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No billing data.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${escapeHtml(item.billing_id)}</td>
      <td>${escapeHtml(item.account_no)}</td>
      <td>${escapeHtml(item.full_name)}</td>
      <td>${escapeHtml(item.plan_name)}</td>
      <td>${escapeHtml(item.billing_month)}</td>
      <td>${escapeHtml(item.due_date)}</td>
      <td>${formatMoney(item.amount)}</td>
      <td>${escapeHtml(item.status)}</td>
    </tr>
  `).join("");
}

async function loadBillingSummary() {
  try {
    const result = await apiGet({
      action: "getBillingStatusSummary",
      days: 7
    });

    if (!result.success) return;

    const data = result.data || {};

    document.getElementById("cardOverdue").textContent = (data.overdue || []).length;
    document.getElementById("cardDueToday").textContent = (data.dueToday || []).length;
    document.getElementById("cardDueSoon").textContent = (data.dueSoon || []).length;
  } catch (err) {
    console.error("Billing summary error:", err);
  }
}

async function generateBilling() {
  try {
    showMessage("billingMessage", "Generating billing...", false);

    const result = await apiPost({
      action: "generateBilling"
    });

    if (!result.success) {
      showMessage("billingMessage", result.message || "Failed to generate billing.", true);
      return;
    }

    const totalCreated = result?.data?.total_created ?? 0;
    const billingMonth = result?.data?.billing_month || "";

    showMessage(
      "billingMessage",
      `Billing generated successfully. Created: ${totalCreated}${billingMonth ? " | Month: " + billingMonth : ""}`,
      false
    );

    await loadBilling();
    await loadBillingSummary();
  } catch (err) {
    showMessage("billingMessage", "Failed to generate billing.", true);
  }
}

function normalizeInputDate(value) {
  if (!value) return "";
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function escapeJs(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
