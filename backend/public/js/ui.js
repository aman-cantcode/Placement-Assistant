// Small UI helpers shared across pages: toasts, a confirm dialog to replace
// window.confirm(), form message banners, and a couple of formatters.

function toast(message, type = "info") {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }

  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " toast-error" : type === "success" ? " toast-success" : "");
  el.textContent = message;
  stack.appendChild(el);

  setTimeout(() => {
    el.classList.add("is-leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 4000);
}

/** Promise-based replacement for window.confirm(), styled like the rest of the app. */
function confirmDialog({ title = "Are you sure?", message = "", confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">${esc(title)}</h3>
        <p>${esc(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" data-action="cancel">${esc(cancelLabel)}</button>
          <button type="button" class="btn ${danger ? "btn-danger" : ""}" data-action="confirm">${esc(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const finish = (result) => {
      backdrop.remove();
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };
    const onKeydown = (e) => {
      if (e.key === "Escape") finish(false);
    };

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) finish(false);
    });
    backdrop.querySelector('[data-action="cancel"]').addEventListener("click", () => finish(false));
    backdrop.querySelector('[data-action="confirm"]').addEventListener("click", () => finish(true));
    document.addEventListener("keydown", onKeydown);
    backdrop.querySelector('[data-action="confirm"]').focus();
  });
}

function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message || "";
  el.classList.remove("is-error", "is-success");
  if (message) el.classList.add(type === "success" ? "is-success" : "is-error");
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.setAttribute("aria-busy", isLoading ? "true" : "false");
  button.classList.toggle("is-loading", isLoading);
  if (isLoading && !button.querySelector(".spinner-dot")) {
    const dot = document.createElement("span");
    dot.className = "spinner-dot";
    button.appendChild(dot);
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}



function inlineFormat(text) {
  return esc(text)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
}


function formatMarkdown(raw) {
  let text = String(raw ?? "");

  text = text.replace(/\\([\\`*_[\]()>#+\-.!|])/g, "$1");

  const lines = text.split(/\r?\n/);

  let html = "";
  let listOpen = false;
  let orderedListOpen = false;
  let tableRows = [];
  let inTable = false;

  const closeLists = () => {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }

    if (orderedListOpen) {
      html += "</ol>";
      orderedListOpen = false;
    }
  };

  const flushTable = () => {
    if (!inTable) return;

    html += "<table><tbody>";

    tableRows.forEach((row, index) => {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map(cell => cell.trim());

      const tag = index === 0 ? "th" : "td";

      html += "<tr>";

      cells.forEach(cell => {
        html += `<${tag}>${inlineFormat(cell)}</${tag}>`;
      });

      html += "</tr>";
    });

    html += "</tbody></table>";

    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      closeLists();
      flushTable();
      continue;
    }

    // Markdown table
    if (
      line.startsWith("|") &&
      line.endsWith("|")
    ) {
      const nextLine = lines[i + 1]?.trim() || "";

      // Detect table header + separator
      if (
        /^\|[\s|:-]+\|$/.test(nextLine)
      ) {
        closeLists();

        inTable = true;

        tableRows.push(line);

        // Skip separator row
        i++;

        continue;
      }

      if (inTable) {
        tableRows.push(line);
        continue;
      }
    }

    flushTable();

    // Headings: # ## ### #### etc.
    const heading = line.match(/^(#{1,6})\s+(.+)$/);

    if (heading) {
      closeLists();

      const level = heading[1].length;

      html += `<h${level}>${inlineFormat(heading[2])}</h${level}>`;

      continue;
    }

    // Horizontal rule
    if (/^([-*_])(?:\s*\1){2,}$/.test(line)) {
      closeLists();

      html += "<hr>";

      continue;
    }

    // Blockquote
    const quote = line.match(/^>\s*(.*)$/);

    if (quote) {
      closeLists();

      html += `<blockquote>${inlineFormat(quote[1])}</blockquote>`;

      continue;
    }

    // Unordered list
    const bullet = line.match(/^[-*•]\s+(.+)$/);

    if (bullet) {
      if (!listOpen) {
        closeLists();

        html += "<ul>";

        listOpen = true;
      }

      html += `<li>${inlineFormat(bullet[1])}</li>`;

      continue;
    }

    // Ordered list
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);

    if (numbered) {
      if (!orderedListOpen) {
        closeLists();

        html += "<ol>";

        orderedListOpen = true;
      }

      html += `<li>${inlineFormat(numbered[1])}</li>`;

      continue;
    }

    // Normal paragraph
    closeLists();

    html += `<p>${inlineFormat(line)}</p>`;
  }

  closeLists();
  flushTable();

  return html;
}


/**
 * The roadmap comes back from the AI as plain text ("simple headings and
 * bullet points, no tables" per the prompt, but models don't always follow
 * that exactly). This turns it into readable HTML without assuming any
 * particular markdown dialect.
 */
function formatRoadmap(raw) {
  const bulletRe = /^[-*•]\s+|^\d+[.)]\s+/;
  const weekRe = /^(week|day|month)\s*\d+\b/i;

  let html = "";
  let listOpen = false;
  const closeList = () => {
    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
  };

  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      let clean = line.replace(/^#+\s*/, "");
      const wrapped = clean.match(/^\*\*(.+)\*\*$/) || clean.match(/^__(.+)__$/);
      if (wrapped) clean = wrapped[1].trim();

      if (bulletRe.test(clean)) {
        if (!listOpen) {
          html += "<ul>";
          listOpen = true;
        }
        html += `<li>${inlineFormat(clean.replace(bulletRe, ""))}</li>`;
        return;
      }

      const looksLikeHeading = weekRe.test(clean) || (clean.length < 60 && clean.endsWith(":"));
      closeList();
      if (looksLikeHeading) {
        html += `<h4>${inlineFormat(clean.replace(/:$/, ""))}</h4>`;
      } else {
        html += `<p>${inlineFormat(clean)}</p>`;
      }
    });

  closeList();
  return html;
}

async function handleLogout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // even if the request fails, send the user back to login
  }
  window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
});
