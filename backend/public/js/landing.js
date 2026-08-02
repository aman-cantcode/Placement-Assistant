// Animates the sample gauge in the hero once it's on screen, rather than
// immediately on page load, so it plays when a visitor actually sees it.

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("gauge-demo");
  if (!el) return;

  const demo = createGauge(el, { caption: "ATS Match" });

  if (!("IntersectionObserver" in window)) {
    demo.setScore(78);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        demo.setScore(78);
        observer.disconnect();
      }
    },
    { threshold: 0.4 }
  );
  observer.observe(el);
});
