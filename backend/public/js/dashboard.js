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
  renderUserChip();
  fillProfile();
  renderResumeInfo();
  loadHistories();
}

function renderUserChip() {
  document.getElementById("user-avatar").textContent = initials(currentUser.name);
  document.getElementById("user-name-display").textContent = currentUser.name;
  document.getElementById("welcome-heading").textContent = `Welcome back, ${currentUser.name.split(" ")[0]}`;
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
  const status = document.getElementById("resume-status");
  const icon = document.getElementById("resume-status-icon");
  const text = document.getElementById("resume-status-text");
  const date = document.getElementById("resume-status-date");
  const hint = document.getElementById("resume-required-hint");

  const hasResume = Boolean(currentUser.resume?.fileName);
  status.classList.toggle("is-empty", !hasResume);
  hint.classList.toggle("hidden", hasResume);

  if (hasResume) {
    icon.innerHTML = '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>';
    text.textContent = currentUser.resume.fileName;
    date.textContent = `Uploaded ${formatDate(currentUser.resume.uploadedAt)}`;
  } else {
    icon.innerHTML = '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M12 11.5v5M9.5 14h5"/>';
    text.textContent = "No resume uploaded yet";
    date.textContent = "";
  }
}

async function loadHistories() {
  const list = document.getElementById("history-list");
  try {
    const items = await api("/histories");

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l1.5 3h5L16 12h4"/><path d="M5.5 6h13L20 12v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z"/></svg>
          <p class="muted">No analyses yet — paste a job description above to get your first score.</p>
        </div>`;
      return;
    }

    list.innerHTML = items.map(historyRowHtml).join("");

    list.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteHistoryItem(btn.dataset.delete));
    });
  } catch (err) {
    list.innerHTML = `
      <div class="error-block">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4L3 20h18L12 4z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>
        <p class="muted">${esc(err.message)}</p>
      </div>`;
  }
}

function historyRowHtml(h) {
  const hasScore = h.status === "done" && h.analysis?.atsScore != null;
  return `
    <div class="case-row">
      <div class="case-main">
        <a href="/analysis.html?id=${h._id}" class="case-title">${esc(h.title)}</a>
        <div class="case-date">${formatDate(h.createdAt)}</div>
      </div>
      <div class="case-actions">
        ${hasScore ? `<span class="score-pill">${h.analysis.atsScore}/100</span>` : ""}
        <span class="stamp stamp-${h.status}">${h.status}</span>
        <button type="button" class="btn btn-icon btn-ghost" data-delete="${h._id}" aria-label="Delete ${esc(h.title)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>`;
}

async function deleteHistoryItem(id) {
  const confirmed = await confirmDialog({
    title: "Delete this analysis?",
    message: "This removes the score, roadmap, questions and chat for it. This can't be undone.",
    confirmLabel: "Delete",
    danger: true,
  });
  if (!confirmed) return;

  try {
    await api(`/histories/${id}`, { method: "DELETE" });
    toast("Analysis deleted", "success");
    loadHistories();
  } catch (err) {
    toast(err.message, "error");
  }
}

document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById("profile-btn");
  showMessage("profile-message", "");
  setButtonLoading(btn, true);

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
    renderUserChip();
    showMessage("profile-message", "Profile saved.", "success");
  } catch (err) {
    showMessage("profile-message", err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById("resume-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById("resume-btn");
  const file = form.resume.files[0];

  if (!file) {
    showMessage("resume-message", "Choose a file first.");
    return;
  }

  const formData = new FormData();
  formData.append("resume", file);

  showMessage("resume-message", "");
  setButtonLoading(btn, true);

  try {
    const data = await api("/users/resume", { method: "POST", body: formData });
    currentUser.resume = data.resume;
    renderResumeInfo();
    showMessage("resume-message", "Resume uploaded.", "success");
    form.reset();
  } catch (err) {
    showMessage("resume-message", err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById("history-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById("history-btn");
  showMessage("new-analysis-message", "");
  setButtonLoading(btn, true);

  try {
    const data = await api("/histories", {
      method: "POST",
      body: JSON.stringify({ title: form.title.value, jdText: form.jdText.value }),
    });
    // the result page polls while the analysis is still running
    window.location.href = `/analysis.html?id=${data._id}`;
  } catch (err) {
    showMessage("new-analysis-message", err.message);
    setButtonLoading(btn, false);
  }
});

init().catch((err) => {
  console.error("Dashboard init failed:", err);
  window.location.href = "/login.html";
});
