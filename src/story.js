const stageMessages = [
  "The evidence exists. The work still needs a path.",
  "Company context connects. Finance content stays behind its approval boundary.",
  "Finance processing waits for a separate auditor’s scoped approval.",
  "This example is waiting for your sample approval.",
];

export function initStoryExperience() {
  const root = document.documentElement;
  const visual = document.querySelector("#journey-visual");
  const beats = [...document.querySelectorAll(".journey-beat")];
  const sceneButtons = [...document.querySelectorAll("[data-show-stage]")];
  const gate = document.querySelector("#scene-gate");
  const approvedNote = document.querySelector("#scene-approved-note");
  const receipt = document.querySelector("#scene-receipt");
  const approve = document.querySelector("#sample-approve");
  const reset = document.querySelector("#sample-reset");
  const motionButton = document.querySelector("#motion-toggle");
  const systemMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const status = document.querySelector("#sample-status");
  let reduced = systemMotion.matches;
  let requestedReduced = false;
  let stage = 0;
  let approved = false;
  let scheduled = false;

  function applyMotionPreference() {
    reduced = systemMotion.matches || requestedReduced;
    root.classList.toggle("motion-reduced", reduced);
    motionButton.setAttribute("aria-pressed", String(reduced));
    motionButton.disabled = systemMotion.matches;
    document.querySelector("#motion-label").textContent = systemMotion.matches
      ? "Reduced motion (system)"
      : "Reduce motion";
  }

  function renderStage(nextStage) {
    stage = nextStage;
    visual.dataset.stage = String(stage);
    visual.dataset.approved = String(approved);
    gate.hidden = stage < 2 || approved;
    approvedNote.hidden = stage !== 2 || !approved;
    receipt.hidden = stage !== 3 || !approved;
    document.querySelector("#journey-console").textContent =
      approved && stage >= 2
        ? stage === 2
          ? "Sample approval recorded in this illustration. Continue to the example result."
          : "Example outcome: a $20 difference, reports, and an internal case."
        : stageMessages[stage];
    document.querySelector("#journey-stage-count").textContent =
      `0${stage + 1} / 04`;
    beats.forEach((beat, index) =>
      beat.classList.toggle("is-current", index === stage),
    );
    sceneButtons.forEach((button, index) =>
      button.setAttribute("aria-pressed", String(index === stage)),
    );
  }

  function triggerLine() {
    if (window.innerWidth <= 760 && window.innerHeight > 640) {
      const boardHeight = visual.getBoundingClientRect().height + 10;
      return boardHeight + Math.max(60, (window.innerHeight - boardHeight) / 2);
    }
    return window.innerHeight * 0.5;
  }

  function updateScrollStory() {
    const line = triggerLine();
    let nextStage = 0;
    for (let index = 0; index < beats.length; index++) {
      const rect = beats[index].getBoundingClientRect();
      if (rect.top + rect.height / 2 <= line) nextStage = index;
    }
    // Short viewports use the scene buttons, so the board never traps scrolling.
    if (window.innerHeight > 640 && nextStage !== stage) renderStage(nextStage);
    if (!reduced) {
      const hero = document.querySelector(".hero");
      const heroProgress = Math.min(
        1,
        Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight),
      );
      root.style.setProperty("--hero-drift", `${heroProgress * 22}px`);
    } else {
      root.style.setProperty("--hero-drift", "0px");
    }
    scheduled = false;
  }

  function scheduleScrollStory() {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateScrollStory);
    }
  }

  function showScene(index) {
    renderStage(index);
    if (window.innerHeight <= 640) return;
    const rect = beats[index].getBoundingClientRect();
    const top =
      window.scrollY + rect.top + rect.height / 2 - triggerLine() + 24;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduced ? "instant" : "smooth",
    });
  }

  sceneButtons.forEach((button) => {
    button.addEventListener("click", () =>
      showScene(Number(button.dataset.showStage)),
    );
  });
  approve.addEventListener("click", () => {
    approved = true;
    renderStage(stage);
    status.textContent =
      "Sample review approved. This illustration has not run tools or changed a live workflow.";
    if (stage === 3)
      document.querySelector("#receipt-title").focus({ preventScroll: true });
    else sceneButtons[3].focus({ preventScroll: true });
  });
  reset.addEventListener("click", () => {
    approved = false;
    renderStage(stage);
    status.textContent =
      "Illustration reset. Finance processing is waiting for sample approval again.";
    approve.focus({ preventScroll: true });
  });
  motionButton.addEventListener("click", () => {
    requestedReduced = !requestedReduced;
    applyMotionPreference();
    scheduleScrollStory();
  });
  systemMotion.addEventListener("change", () => {
    applyMotionPreference();
    scheduleScrollStory();
  });

  applyMotionPreference();
  root.classList.add("story-enhanced");
  motionButton.hidden = false;
  document.querySelector(".journey-controls").hidden = false;
  renderStage(0);

  // Animation is added at entry. Content is never hidden while waiting for JavaScript.
  if ("IntersectionObserver" in window) {
    const reveals = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!reduced) entry.target.classList.add("reveal-enter");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".story-section > h2, .pull-quote, .product-figure, .ripple-demo, .approval-story, .revision-strip, .lesson, .author-card",
      )
      .forEach((element) => reveals.observe(element));
  }
  window.addEventListener("scroll", scheduleScrollStory, { passive: true });
  window.addEventListener("resize", scheduleScrollStory);
  window.addEventListener("load", scheduleScrollStory);
  document.fonts?.ready.then(scheduleScrollStory);
  scheduleScrollStory();
}
