// Shared API helper for every page.
// The access token only lives in this variable (memory), never in
// localStorage, so it cannot be stolen via XSS.
let accessToken = null;

const API_BASE = "/api/v1";

function setAccessToken(token) {
  accessToken = token;
}

// asks the server for a new access token using the httpOnly refresh cookie
async function refreshSession() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.data.accessToken;
    return true;
  } catch {
    return false;
  }
}

async function api(path, options = {}) {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        // FormData sets its own Content-Type with the boundary
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();

  // access token expired -> silently refresh once and retry
  // (skipped for /auth/ routes like login, where 401 means bad credentials)
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      window.location.href = "/login.html";
      throw new Error("Session expired");
    }
    res = await doFetch();
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data.data;
}

// escapes user content before putting it into innerHTML
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}
