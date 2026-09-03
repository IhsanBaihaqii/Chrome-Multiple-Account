// ========================================
// LOGIN LOGIC
// ========================================
document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginMessage = document.getElementById("loginMessage");

  // Cek status perangkat
  try {
    const response = await fetch("/status");
    const data = await response.json();

    // Update mode badge
    const modeBadge = document.querySelector(".mode-badge");
    if (modeBadge) {
      if (data.mode === "controller") {
        modeBadge.textContent = "🎮 Mode: Controller";
        modeBadge.className = "mode-badge controller";
      } else {
        modeBadge.textContent = "⚙️ Mode: Worker";
        modeBadge.className = "mode-badge worker";
      }
    }
  } catch (error) {
    console.error("Error getting status:", error);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Reset message
    loginMessage.textContent = "";
    loginMessage.className = "login-message";

    // Validasi
    if (!username || !password) {
      loginMessage.textContent = "⚠️ Username dan password wajib diisi";
      loginMessage.className = "login-message error";
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        loginMessage.textContent =
          "✅ Login berhasil! Mode berubah menjadi CONTROLLER";
        loginMessage.className = "login-message success";

        // Redirect ke dashboard
        setTimeout(() => {
          window.location.href = data.redirect || "/dashboard.html";
        }, 1000);
      } else {
        loginMessage.textContent = "❌ " + data.message;
        loginMessage.className = "login-message error";
      }
    } catch (error) {
      loginMessage.textContent = "❌ Terjadi kesalahan: " + error.message;
      loginMessage.className = "login-message error";
      console.error(error);
    }
  });

  // Enter key support
  loginForm.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loginForm.dispatchEvent(new Event("submit"));
    }
  });
});
