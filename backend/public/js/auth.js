// Shared across all four auth pages. Each block only runs if its form is
// actually present on the current page.

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// If someone already has a valid session and lands on login/signup anyway,
// just take them straight to the dashboard instead of the form.
(async function redirectIfAlreadyLoggedIn() {
  if (!document.getElementById("login-form") && !document.getElementById("signup-form")) return;
  if (await refreshSession()) window.location.href = "/dashboard.html";
})();

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      showMessage("login-message", "Enter your email and password.");
      return;
    }

    const btn = document.getElementById("login-btn");
    setButtonLoading(btn, true);
    showMessage("login-message", "");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showMessage("login-message", err.message);
      setButtonLoading(btn, false);
    }
  });
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;

    if (!name || !email || !password) {
      showMessage("signup-message", "Fill in your name, email and password.");
      return;
    }
    if (!emailRegex.test(email)) {
      showMessage("signup-message", "Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showMessage("signup-message", "Password must be at least 6 characters.");
      return;
    }

    const btn = document.getElementById("signup-btn");
    setButtonLoading(btn, true);
    showMessage("signup-message", "");

    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setAccessToken(data.accessToken);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showMessage("signup-message", err.message);
      setButtonLoading(btn, false);
    }
  });
}

const forgotForm = document.getElementById("forgot-form");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forgotForm.email.value.trim();

    if (!email) {
      showMessage("forgot-message", "Enter your email first.");
      return;
    }

    const btn = document.getElementById("forgot-btn");
    setButtonLoading(btn, true);
    showMessage("forgot-message", "");

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      showMessage("forgot-message", "If that email exists, a reset link is on its way. Check your inbox.", "success");
      forgotForm.reset();
    } catch (err) {
      showMessage("forgot-message", err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

const resetForm = document.getElementById("reset-form");
if (resetForm) {
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    document.getElementById("reset-valid").classList.add("hidden");
    document.getElementById("reset-invalid").classList.remove("hidden");
  } else {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = resetForm.password.value;
      const confirmPassword = resetForm["confirm-password"].value;

      if (password.length < 6) {
        showMessage("reset-message", "Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        showMessage("reset-message", "Those passwords don't match.");
        return;
      }

      const btn = document.getElementById("reset-btn");
      setButtonLoading(btn, true);
      showMessage("reset-message", "");

      try {
        await api("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token, password }),
        });
        showMessage("reset-message", "Password updated. Taking you to login…", "success");
        setTimeout(() => (window.location.href = "/login.html"), 1600);
      } catch (err) {
        showMessage("reset-message", err.message);
        setButtonLoading(btn, false);
      }
    });
  }
}
