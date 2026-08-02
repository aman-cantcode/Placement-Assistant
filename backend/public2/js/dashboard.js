let currentUser = null;

const toList = (value) =>
  value.split(",").map((s) => s.trim()).filter(Boolean);

async function init() {
  const ok = await refreshSession();
  if (!ok) {
    window.location.href = "/login.html";
    return;
  }
  currentUser = await api("/users/me");
  fillProfile();
  renderResumeInfo();
  loadHistories();
}

function fillProfile() {
  const form = document.getElementById("profile-form");
  form.name.value = currentUser.name || "";
  form.branch.value = currentUser.branch || "";
  form.cgpa.value = currentUser.cgpa ?? "";
  form.skills.value = (currentUser.skills || []).join(", ");
  form.targetCompanies.value = (currentUser.targetCompanies || []).join(", ");
}

function renderResumeInfo() {
  const info = document.getElementById("resume-info");
  if (currentUser.resume?.fileName) {
    const date = new Date(currentUser.resume.uploadedAt).toLocaleDateString();
    info.textContent = `Current resume: ${currentUser.resume.fileName} (uploaded ${date})`;
  }
}

async function loadHistories() {
  const list = document.getElementById("history-list");
  try {
    const items = await api("/histories");

    if (!items.length) {
      list.innerHTML = '<p class="muted">No analyses yet. Upload your resume and paste a JD above to get started.</p>';
      return;
    }

  list.innerHTML = items
    .map(
      (h) => `
      <div class="history-item">
        <div>
          <a href="/history.html?id=${h._id}" class="history-title">${esc(h.title)}</a>
          <div class="muted small">${new Date(h.createdAt).toLocaleString()}</div>
        </div>
        <div class="history-actions">
          <span class="badge badge-${h.status}">${h.status}</span>
          ${h.status === "done" && h.analysis?.atsScore != null
            ? `<span class="score-pill">${h.analysis.atsScore}/100</span>`
            : ""}
          <button class="btn-danger" data-delete="${h._id}">Delete</button>
        </div>
      </div>`
    )
    .join("");

  list.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this analysis?")) return;
      try {
        await api(`/histories/${btn.dataset.delete}`, { method: "DELETE" });
        loadHistories();
      } catch (err) {
        alert(err.message);
      }
    });
  });
  } catch (err) {
    list.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}

document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  document.getElementById("profile-error").textContent = "";
  document.getElementById("profile-success").textContent = "";
  try {
    currentUser = await api("/users/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: form.name.value,
        branch: form.branch.value,
        cgpa: form.cgpa.value,
        skills: toList(form.skills.value),
        targetCompanies: toList(form.targetCompanies.value),
      }),
    });
    document.getElementById("profile-success").textContent = "Profile saved!";
  } catch (err) {
    document.getElementById("profile-error").textContent = err.message;
  }
});

document.getElementById("resume-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  document.getElementById("resume-error").textContent = "";
  document.getElementById("resume-success").textContent = "";

  const formData = new FormData();
  formData.append("resume", form.resume.files[0]);

  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Uploading...";
  try {
    const data = await api("/users/resume", { method: "POST", body: formData });
    currentUser.resume = data.resume;
    renderResumeInfo();
    document.getElementById("resume-success").textContent = "Resume uploaded!";
    form.reset();
  } catch (err) {
    document.getElementById("resume-error").textContent = err.message;
  }
  button.disabled = false;
  button.textContent = "Upload resume";
});

document.getElementById("history-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  document.getElementById("history-error").textContent = "";
  try {
    const data = await api("/histories", {
      method: "POST",
      body: JSON.stringify({
        title: form.title.value,
        jdText: form.jdText.value,
      }),
    });
    // jump straight to the result page, it polls while analyzing
    window.location.href = `/history.html?id=${data._id}`;
  } catch (err) {
    document.getElementById("history-error").textContent = err.message;
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // even if the call fails, send the user back to login
  }
  window.location.href = "/login.html";
});

init().catch((err) => {
  console.error("Page init failed:", err);
  window.location.href = "/login.html";
});
