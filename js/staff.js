let subscribersCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireRole("STAFF");
  if (!user) return;

  const welcome = document.getElementById("welcomeText");
  if (welcome) {
    welcome.textContent = `Welcome, ${user.full_name || user.username}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderSubscribers(searchInput.value.trim());
    });
  }

  await loadSubscribers();
});

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
    showMessage("pageMessage", "Subscribers loaded successfully.", false);
  } catch (err) {
    showMessage("pageMessage", "Unable to load subscribers.", true);
  }
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
        <td colspan="10" class="empty-cell">No subscribers found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows.map(item => `
    <tr>
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
