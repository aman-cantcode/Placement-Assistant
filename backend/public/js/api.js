// Thin fetch wrapper shared by every page.
//
// The access token only ever lives in this variable (memory), never in
// localStorage or a cookie readable by JS, so it can't be lifted by an XSS
// bug. It naturally clears on refresh, which is why every page calls
// refreshSession() on load to trade the httpOnly refresh cookie for a new one.

let accessToken = null;

function setAccessToken(token) {
  accessToken = token;
}

async function refreshSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const body = await res.json();
    accessToken = body.data.accessToken;
    return true;
  } catch {
    return false;
  }
}

/**
 * Calls the API and returns the parsed `data` payload.
 * Throws an Error with the server's message on failure.
 */
async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();

  // an expired access token gets one silent refresh + retry; /auth/ routes
  // are excluded since a 401 there means "wrong password", not "expired"
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      window.location.href = "/login.html";
      throw new Error("Session expired");
    }
    res = await doFetch();
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error("The server sent back something unexpected.");
  }

  if (!res.ok) {
    throw new Error(body.message || "Something went wrong");
  }
  return body.data;
}

/** Escapes text before it goes into innerHTML. */
function esc(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
