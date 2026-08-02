const historyId = new URLSearchParams(window.location.search).get("id");
let currentHistory = null;

async function init() {
  const ok = await refreshSession();
  if (!ok) {
    window.location.href = "/login.html";
    return;
  }
  if (!historyId) {
    window.location.href = "/dashboard.html";
    return;
  }
  await loadHistory();
  loadChat();
}

async function loadHistory() {
  try {
    currentHistory = await api(`/histories/${historyId}`);
  } catch (err) {
    alert(err.message);
    window.location.href = "/dashboard.html";
    return;
  }

  document.getElementById("history-title").textContent = currentHistory.title;
  renderStatus();
}

function renderStatus() {
  document.getElementById("analyzing").hidden = currentHistory.status !== "analyzing";
  document.getElementById("failed").hidden = currentHistory.status !== "failed";
  document.getElementById("results").hidden = currentHistory.status !== "done";

  if (currentHistory.status === "analyzing") {
    setTimeout(loadHistory, 3000);
    return;
  }
  if (currentHistory.status === "done") {
    renderResults();
  }
}

function chips(skills, extraClass = "") {
  if (!skills || !skills.length) {
    return '<span class="muted">None</span>';
  }
  return skills
    .map((s) => `<span class="chip ${extraClass}">${esc(s)}</span>`)
    .join("");
}

function renderResults() {
  document.getElementById("ats-score").textContent = currentHistory.analysis.atsScore ?? "-";
  document.getElementById("matching-skills").innerHTML = chips(currentHistory.analysis.matchingSkills, "chip-green");
  document.getElementById("required-skills").innerHTML = chips(currentHistory.analysis.requiredSkills);
  document.getElementById("missing-skills").innerHTML = chips(currentHistory.analysis.missingSkills, "chip-red");

  if (currentHistory.roadmap) showRoadmap(currentHistory.roadmap);
  if (currentHistory.questions && currentHistory.questions.length) renderQuestions();
}

// ---------- roadmap ----------

function showRoadmap(text) {
  document.getElementById("roadmap-btn").hidden = true;
  const el = document.getElementById("roadmap-text");
  el.hidden = false;
  el.textContent = text;
}

document.getElementById("roadmap-btn").addEventListener("click", async (e) => {
  const btn = e.target;
  btn.disabled = true;
  btn.textContent = "Generating...";
  try {
    const data = await api(`/histories/${historyId}/roadmap`, { method: "POST" });
    showRoadmap(data.roadmap);
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Generate roadmap";
  }
});

// ---------- interview practice ----------

function renderQuestions() {
  document.getElementById("questions-btn").hidden = true;
  document.getElementById("answers-form").hidden = false;

  document.getElementById("questions-list").innerHTML = currentHistory.questions
    .map(
      (q, i) => `
      <div class="question">
        <p><strong>Q${i + 1}.</strong> ${esc(q.question)}</p>
        <textarea rows="3" data-answer="${i}" placeholder="Type your answer...">${esc(q.answer || "")}</textarea>
        ${q.rating != null
          ? `<div class="feedback">
               <span class="score-pill">${q.rating}/10</span>
               <p>${esc(q.feedback)}</p>
             </div>`
          : ""}
      </div>`
    )
    .join("");
}

document.getElementById("questions-btn").addEventListener("click", async (e) => {
  const btn = e.target;
  btn.disabled = true;
  btn.textContent = "Generating...";
  try {
    const data = await api(`/histories/${historyId}/questions`, { method: "POST" });
    currentHistory.questions = data.questions;
    renderQuestions();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Generate questions";
  }
});

document.getElementById("answers-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const answers = [...document.querySelectorAll("[data-answer]")].map((t) => t.value);

  const btn = document.getElementById("answers-btn");
  btn.disabled = true;
  btn.textContent = "Rating your answers...";
  try {
    const data = await api(`/histories/${historyId}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
    currentHistory.questions = data.questions;
    renderQuestions();
  } catch (err) {
    alert(err.message);
  }
  btn.disabled = false;
  btn.textContent = "Submit answers";
});

// ---------- chat ----------

async function loadChat() {
  try {
    const data = await api(`/histories/${historyId}/chat`);
    data.messages.forEach((m) => appendMessage(m.role, m.content));
  } catch {
    // chat is empty or history still analyzing, nothing to show yet
  }
}

function appendMessage(role, content) {
  const box = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  div.textContent = content;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = e.target.message;
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";

  const btn = document.getElementById("chat-btn");
  btn.disabled = true;
  const typing = appendMessage("assistant", "Thinking...");
  try {
    const data = await api(`/histories/${historyId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    typing.textContent = data.reply;
  } catch (err) {
    typing.textContent = `Error: ${err.message}`;
  }
  btn.disabled = false;
});

init().catch((err) => {
  console.error("Page init failed:", err);
  window.location.href = "/login.html";
});
