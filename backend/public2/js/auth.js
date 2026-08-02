function showMessage(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

async function redirectIfLoggedIn() {
  if (await refreshSession()) {
    window.location.href = "/dashboard.html";
  }
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
  (async () => {
    await redirectIfLoggedIn();
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage("error", "");
      const form = new FormData(loginForm);
      try {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        });
        setAccessToken(data.accessToken);
        window.location.href = "/dashboard.html";
      } catch (err) {
        showMessage("error", err.message);
      }
    });
  })();
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  (async () => {
    await redirectIfLoggedIn();
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage("error", "");
      const form = new FormData(signupForm);
      try {
        const data = await api("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          }),
        });
        setAccessToken(data.accessToken);
        window.location.href = "/dashboard.html";
      } catch (err) {
        showMessage("error", err.message);
      }
    });
  })();
}

const forgotForm = document.getElementById("forgot-form");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("error", "");
    showMessage("success", "");
    const form = new FormData(forgotForm);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      showMessage("success", "If that email exists, a reset link has been sent.");
    } catch (err) {
      showMessage("error", err.message);
    }
  });
}

const resetForm = document.getElementById("reset-form");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("error", "");
    const token = new URLSearchParams(window.location.search).get("token");
    const form = new FormData(resetForm);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: form.get("password") }),
      });
      alert("Password reset! Please log in with your new password.");
      window.location.href = "/login.html";
    } catch (err) {
      showMessage("error", err.message);
    }
  });
}
