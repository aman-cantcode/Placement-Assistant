// Builds the semicircle ATS-score gauge used on the landing page and the
// analysis page. getTotalLength() on the arc path means the geometry only
// has to be right once, in the SVG markup below — the JS just animates it.

function createGauge(container, { caption = "ATS Match" } = {}) {
  container.classList.add("gauge");
  container.innerHTML = `
    <svg class="gauge-svg" viewBox="0 0 260 170" aria-hidden="true">
      <path class="gauge-track" d="M 34 122 A 96 96 0 0 1 226 122" />
      <path class="gauge-progress" d="M 34 122 A 96 96 0 0 1 226 122" />
      <text x="34" y="142" class="gauge-endlabel" text-anchor="middle">0</text>
      <text x="226" y="142" class="gauge-endlabel" text-anchor="middle">100</text>
      <text x="130" y="118" class="gauge-number" text-anchor="middle">0</text>
      <text x="130" y="144" class="gauge-max" text-anchor="middle">/ 100</text>
    </svg>
    <span class="gauge-caption">${esc(caption)}</span>
    <span class="visually-hidden" data-live>${esc(caption)}: 0 out of 100</span>
  `;

  const progress = container.querySelector(".gauge-progress");
  const numberEl = container.querySelector(".gauge-number");
  const liveEl = container.querySelector("[data-live]");
  const length = progress.getTotalLength();
  progress.style.strokeDasharray = String(length);
  progress.style.strokeDashoffset = String(length);

  function setScore(score) {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));

    container.classList.remove("is-low", "is-mid");
    if (clamped < 50) container.classList.add("is-low");
    else if (clamped < 75) container.classList.add("is-mid");

    // rAF lets the browser paint the "empty" state first so the fill-in
    // from zero always animates, even if setScore is called immediately.
    requestAnimationFrame(() => {
      progress.style.strokeDashoffset = String(length * (1 - clamped / 100));
    });

    animateCount(numberEl, clamped);
    liveEl.textContent = `${caption}: ${clamped} out of 100`;
  }

  return { setScore };
}

function animateCount(el, target, duration = 900) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
