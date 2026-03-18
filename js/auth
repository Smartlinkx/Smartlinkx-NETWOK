document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    showMessage("loginMessage", "Logging in...", false);

    try {
      const result = await apiPost({
        action: "loginUser",
        username,
        password
      });

      if (!result.success) {
        showMessage("loginMessage", result.message || "Login failed.", true);
        return;
      }

      const user = result.data || {};
      setSession(user);

      if (user.role === "ADMIN") {
        window.location.href = "admin.html";
      } else if (user.role === "STAFF") {
        window.location.href = "staff.html";
      } else {
        showMessage("loginMessage", "Invalid user role.", true);
      }
    } catch (err) {
      showMessage("loginMessage", "Unable to connect to server.", true);
    }
  });
});
