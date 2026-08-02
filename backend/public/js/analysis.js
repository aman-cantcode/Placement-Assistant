const historyId = new URLSearchParams(window.location.search).get("id");

let gauge = null;
let pollTimer = null;

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

  const user = await api("/users/me");
  document.getElementById("user-avatar").textContent = initials(user.name);
  document.getElementById("user-name-display").textContent = user.name;

  await loadHistory();
}

async function loadHistory() {
  let history;
  try {
    history = await api(`/histories/${historyId}`);
  } catch (err) {
    document.getElementById("analysis-title").textContent = "Not found";
    document.getElementById("state-loading").classList.add("hidden");
    showFailedState(err.message);
    return;
  }

  renderHeader(history);

  if (history.status === "analyzing") {
    document.getElementById("state-loading").classList.remove("hidden");
    document.getElementById("state-failed").classList.add("hidden");
    document.getElementById("state-done").classList.add("hidden");
    pollTimer = setTimeout(loadHistory, 2500);
    return;
  }

  clearTimeout(pollTimer);
  document.getElementById("state-loading").classList.add("hidden");

  if (history.status === "failed") {
    showFailedState();
    return;
  }

  document.getElementById("state-failed").classList.add("hidden");
  document.getElementById("state-done").classList.remove("hidden");

  renderScore(history);
  renderRoadmap(history);
  renderQuestions(history);
  loadChatMessages();
}

function showFailedState(message) {
  document.getElementById("state-failed").classList.remove("hidden");
  document.getElementById("state-done").classList.add("hidden");
  if (message) {
    document.querySelector("#state-failed p.muted").textContent = message;
  }
}

function renderHeader(history) {
  document.title = `${history.title} — Placement Assistant`;
  document.getElementById("analysis-title").textContent = history.title;
  document.getElementById("analysis-eyebrow").textContent = `Started ${formatDate(history.createdAt)}`;

  const stamp = document.getElementById("status-stamp");
  stamp.className = `stamp stamp-${history.status}`;
  stamp.textContent = history.status;
}

function renderScore(history) {
  const el = document.getElementById("ats-gauge");
  if (!gauge) gauge = createGauge(el, { caption: "ATS Match" });
  gauge.setScore(history.analysis?.atsScore ?? 0);

  renderChipList("matching-skills", history.analysis?.matchingSkills, "chip-matching");
  renderChipList("missing-skills", history.analysis?.missingSkills, "chip-missing");
  renderChipList("required-skills", history.analysis?.requiredSkills, "");
}

function renderChipList(elementId, skills, chipClass) {
  document.getElementById(elementId).innerHTML = (skills || [])
    .map((s) => `<span class="chip ${chipClass}">${esc(s)}</span>`)
    .join("");
}

function renderRoadmap(history) {
  const content = document.getElementById("roadmap-content");

  if (history.roadmap) {
    content.innerHTML = `<div class="roadmap-block">${formatRoadmap(history.roadmap)}</div>`;
    return;
  }

  content.innerHTML = `
    <div class="empty-block" style="padding: var(--space-6) var(--space-4);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="1.8"/><circle cx="18" cy="6" r="1.8"/><path d="M7.3 16.8L7.3 13L12 13L12 9L16.7 9L16.7 7.2"/></svg>
      <p class="muted">Generate a personalized plan built around what's missing for this role.</p>
      <button type="button" class="btn" id="roadmap-btn" style="margin-top: var(--space-4);">Generate roadmap</button>
    </div>`;

  document.getElementById("roadmap-btn").addEventListener("click", async (e) => {
    setButtonLoading(e.currentTarget, true);
    try {
      const data = await api(`/histories/${historyId}/roadmap`, { method: "POST" });
      content.innerHTML = `<div class="roadmap-block">${formatRoadmap(data.roadmap)}</div>`;
    } catch (err) {
      toast(err.message, "error");
      setButtonLoading(e.currentTarget, false);
    }
  });
}

function renderQuestions(history) {
  if (history.questions.length === 0) {
    const content = document.getElementById("questions-content");
    content.innerHTML = `
      <div class="empty-block" style="padding: var(--space-6) var(--space-4);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L4 20l1-4.5A8.5 8.5 0 1 1 21 11.5z"/><path d="M12 14v-.4c0-.8.5-1.2 1-1.6.6-.4 1-.9 1-1.7a2 2 0 1 0-4 0"/><circle cx="12" cy="16.6" r="0.6" fill="currentColor" stroke="none"/></svg>
        <p class="muted">Generate a set of role-specific interview questions to practice with.</p>
        <button type="button" class="btn" id="questions-btn" style="margin-top: var(--space-4);">Generate questions</button>
      </div>`;

    document.getElementById("questions-btn").addEventListener("click", async (e) => {
      setButtonLoading(e.currentTarget, true);
      try {
        const data = await api(`/histories/${historyId}/questions`, { method: "POST" });
        renderQuestionCards(data.questions, false);
      } catch (err) {
        toast(err.message, "error");
        setButtonLoading(e.currentTarget, false);
      }
    });
    return;
  }

  const alreadyAnswered = history.questions.every((q) => q.rating != null);
  renderQuestionCards(history.questions, alreadyAnswered);
}

function renderQuestionCards(questions, answered) {
  const content = document.getElementById("questions-content");

  content.innerHTML = questions
    .map(
      (q, i) => `
      <div class="question-card">
        <div class="question-head">
          <span class="question-index">${String(i + 1).padStart(2, "0")}</span>
          <p class="question-text">${esc(q.question)}</p>
        </div>
        ${
          answered
            ? `<p class="muted" style="font-size: var(--fs-small); white-space: pre-wrap;">${esc(q.answer)}</p>
               <div class="answer-feedback">
                 <span class="rating-badge ${ratingClass(q.rating)}">${q.rating}/10</span>
                 <span>${esc(q.feedback)}</span>
               </div>`
            : `<textarea class="textarea answer-input" data-index="${i}" rows="3" placeholder="Type your answer…"></textarea>`
        }
      </div>`
    )
    .join("");

  if (!answered) {
    const btnWrap = document.createElement("button");
    btnWrap.type = "button";
    btnWrap.className = "btn";
    btnWrap.id = "submit-answers-btn";
    btnWrap.textContent = "Submit answers";
    content.appendChild(btnWrap);
    btnWrap.addEventListener("click", submitAnswers);
  }
}

function ratingClass(rating) {
  if (rating >= 8) return "";
  if (rating >= 5) return "is-mid";
  return "is-low";
}

async function submitAnswers() {
  const inputs = [...document.querySelectorAll(".answer-input")].sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index)
  );
  const answers = inputs.map((el) => el.value.trim());

  if (answers.some((a) => !a)) {
    toast("Please answer every question before submitting.", "error");
    return;
  }

  const btn = document.getElementById("submit-answers-btn");
  setButtonLoading(btn, true);

  try {
    const data = await api(`/histories/${historyId}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
    renderQuestionCards(data.questions, true);
    toast("Answers rated.", "success");
  } catch (err) {
    toast(err.message, "error");
    setButtonLoading(btn, false);
  }
}

async function loadChatMessages() {
  const messagesEl = document.getElementById("chat-messages");
  try {
    const data = await api(`/histories/${historyId}/chat`);
    if (!data.messages.length) {
      messagesEl.innerHTML = `<p class="chat-empty">Ask anything about this role — what the interview might focus on, how to phrase a bullet point, whatever's useful.</p>`;
      return;
    }
    messagesEl.innerHTML = "";
    data.messages.forEach((m) => appendMessage(m.role, m.content));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (err) {
    messagesEl.innerHTML = `<p class="chat-empty">${esc(err.message)}</p>`;
  }
}

function appendMessage(role, content) {
  const messagesEl = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `msg ${role === "user" ? "msg-user" : "msg-assistant"}`;
  bubble.textContent = content;
  messagesEl.appendChild(bubble);
  return bubble;
}

document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  const messagesEl = document.getElementById("chat-messages");
  const placeholder = messagesEl.querySelector(".chat-empty");
  if (placeholder) placeholder.remove();

  appendMessage("user", message);
  input.value = "";
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const typing = document.createElement("div");
  typing.className = "msg msg-assistant";
  typing.innerHTML = '<span class="msg-typing"><span></span><span></span><span></span></span>';
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const btn = document.getElementById("chat-btn");
  setButtonLoading(btn, true);
  input.disabled = true;

  try {
    const data = await api(`/histories/${historyId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    typing.remove();
    appendMessage("assistant", data.reply);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (err) {
    typing.remove();
    toast(err.message, "error");
  } finally {
    setButtonLoading(btn, false);
    input.disabled = false;
    input.focus();
  }
});

async function deleteThisAnalysis() {
  const confirmed = await confirmDialog({
    title: "Delete this analysis?",
    message: "This removes the score, roadmap, questions and chat for it. This can't be undone.",
    confirmLabel: "Delete",
    danger: true,
  });
  if (!confirmed) return;

  try {
    await api(`/histories/${historyId}`, { method: "DELETE" });
    toast("Analysis deleted", "success");
    window.location.href = "/dashboard.html";
  } catch (err) {
    toast(err.message, "error");
  }
}

document.getElementById("delete-btn").addEventListener("click", deleteThisAnalysis);
document.getElementById("delete-btn-failed").addEventListener("click", deleteThisAnalysis);

init().catch((err) => {
  console.error("Analysis page init failed:", err);
  window.location.href = "/login.html";
});
