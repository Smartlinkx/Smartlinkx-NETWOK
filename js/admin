let subscribersCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireRole("ADMIN");
  if (!user) return;

  const welcome = document.getElementById("welcomeText");
  if (welcome) {
    welcome.textContent = `Welcome, ${user.full_name || user.username}`;
  }

  bindAdminEvents();
  await loadSubscribers();
});

function bindAdminEvents() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const addForm = document.getElementById("addSubscriberForm");
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addSubscriber();
    });
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSubscribers(searchInput.value.trim());
    });
  }
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
        <td colspan="11" class="empty-cell">No subscribers found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
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

async function addSubscriber() {
  const payload = {
    action: "addSubscriber",
    account_no: document.getElementById("account_no").value.trim(),
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

  try {
    showMessage("formMessage", "Saving subscriber...", false);

    const result = await apiPost(payload);

    if (!result.success) {
      showMessage("formMessage", result.message || "Failed to add subscriber.", true);
      return;
    }

    document.getElementById("addSubscriberForm").reset();
    showMessage("formMessage", "Subscriber added successfully.", false);
    await loadSubscribers();
  } catch (err) {
    showMessage("formMessage", "Unable to save subscriber.", true);
  }
}
