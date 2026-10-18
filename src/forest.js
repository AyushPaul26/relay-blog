const branches = {
  research: {
    name: "Research",
    description:
      "Answer company questions using permitted sources and references you can inspect.",
    href: "#story",
  },
  ripple: {
    name: "Ripple",
    description:
      "Follow dependency paths and explore documented backup assumptions without changing company facts.",
    href: "#graph",
  },
  finance: {
    name: "Finance",
    description:
      "Compare approved invoice evidence, produce reports, and maintain an internal exception case.",
    href: "#workflow",
  },
  memory: {
    name: "Memory",
    description:
      "Revisit investigations with their evidence. Preserve history when documents change.",
    href: "#memory",
  },
};

export function initForestExperience() {
  const root = document.documentElement;
  const experience = document.querySelector("#journey");
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const sceneButtons = [...document.querySelectorAll("[data-forest-scene]")];
  const branchButtons = [...document.querySelectorAll("[data-tree-branch]")];
  const container = document.querySelector("#tree-scene");
  const motionButton = document.querySelector("#motion-toggle");
  const mediaMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const status = document.querySelector("#tree-load-status");
  let paused = false;
  let reduced = mediaMotion.matches;
  let scene = null;
  let activeScene = -1;
  let selectedBranch = "research";
  let frame = 0;
  let progress = 0;
  let hasLoaded = false;
  let visible = true;

  root.classList.add("forest-enhanced");
  document.querySelector(".forest-scene-nav").hidden = false;
  document.querySelector(".branch-controls").hidden = false;
  document.querySelector("#sample-approve").hidden = false;
  motionButton.hidden = false;

  function setMotion() {
    reduced = paused || mediaMotion.matches;
    root.classList.toggle("motion-reduced", reduced);
    motionButton.setAttribute("aria-pressed", String(reduced));
    motionButton.disabled = mediaMotion.matches;
    document.querySelector("#motion-label").textContent = mediaMotion.matches
      ? "Reduced motion"
      : paused
        ? "Resume motion"
        : "Pause motion";
    scene?.setReducedMotion(reduced);
  }
  motionButton.addEventListener("click", () => {
    paused = !paused;
    setMotion();
  });
  mediaMotion.addEventListener("change", setMotion);
  setMotion();

  function goToScene(index) {
    const top = window.scrollY + chapters[index].getBoundingClientRect().top;
    window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  }
  sceneButtons.forEach((button) =>
    button.addEventListener("click", () =>
      goToScene(Number(button.dataset.forestScene)),
    ),
  );

  function selectBranch(id) {
    const branch = branches[id];
    if (!branch) return;
    selectedBranch = id;
    branchButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.treeBranch === id),
      ),
    );
    document.querySelector("#branch-name").textContent = branch.name;
    document.querySelector("#branch-description").textContent =
      branch.description;
    document.querySelector("#branch-article-link").href = branch.href;
    scene?.setBranch(id);
  }
  branchButtons.forEach((button) => {
    button.addEventListener("click", () =>
      selectBranch(button.dataset.treeBranch),
    );
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse")
        scene?.setBranch(button.dataset.treeBranch);
    });
    button.addEventListener("pointerleave", () =>
      scene?.setBranch(selectedBranch),
    );
    button.addEventListener("focus", () =>
      scene?.setBranch(button.dataset.treeBranch),
    );
    button.addEventListener("blur", () => scene?.setBranch(selectedBranch));
  });

  const approval = document.querySelector("#sample-approve");
  const gate = document.querySelector("#sample-gate");
  const receipt = document.querySelector("#scene-receipt");
  const sampleStatus = document.querySelector("#sample-status");
  approval.addEventListener("click", () => {
    gate.hidden = true;
    receipt.hidden = false;
    document.querySelector("#receipt-title").focus({ preventScroll: true });
    sampleStatus.textContent =
      "Sample approval given. The example finds a twenty-dollar difference. No live workflow was run.";
    scene?.setBranch("finance");
  });
  document.querySelector("#sample-reset").addEventListener("click", () => {
    receipt.hidden = true;
    gate.hidden = false;
    sampleStatus.textContent =
      "Illustration reset. Sample approval is required again.";
    approval.focus({ preventScroll: true });
    scene?.setBranch(selectedBranch);
  });

  function updateProgress() {
    frame = 0;
    let index = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top <= 1) index = i;
    }
    const rect = chapters[index].getBoundingClientRect();
    const fraction =
      index === chapters.length - 1
        ? 0
        : Math.max(0, Math.min(1, -rect.top / rect.height));
    progress = Math.max(
      0,
      Math.min(1, (index + fraction) / (chapters.length - 1)),
    );
    // The same portrait remains navigable when WebGL is unavailable.
    container.style.setProperty("--world-position", `${progress * 100}%`);
    container.style.setProperty(
      "--world-brightness",
      String(1 - progress * 0.46),
    );
    const next = Math.min(5, Math.round(progress * 5));
    if (next !== activeScene) {
      activeScene = next;
      experience.dataset.scene = String(next);
      sceneButtons.forEach((button, i) =>
        button.setAttribute("aria-pressed", String(i === next)),
      );
      if (!reduced)
        chapters[next]
          .querySelector(".chapter-copy")
          .classList.add("is-entering");
    }
    scene?.setProgress(progress);
  }
  function scheduleProgress() {
    if (!frame) frame = requestAnimationFrame(updateProgress);
  }
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress);
  window.addEventListener("load", scheduleProgress);
  document.fonts?.ready.then(scheduleProgress);
  scheduleProgress();

  function fallback() {
    container.classList.remove("tree-ready");
    container.classList.add("tree-unavailable");
    status.textContent = "Still illustration · explore every chapter below";
  }
  async function loadScene() {
    if (hasLoaded) return;
    hasLoaded = true;
    status.textContent = "Opening the illustrated world…";
    try {
      const { createTreeScene } = await import("./tree-scene.js");
      scene = await createTreeScene({
        container,
        onReady() {
          container.classList.add("tree-ready");
          status.textContent =
            "A visual metaphor. Explore Relay’s real functions.";
        },
        onFallback: fallback,
        onSelect(id) {
          selectBranch(id);
          if (activeScene !== 2) goToScene(2);
        },
      });
      scene.setReducedMotion(reduced);
      scene.setProgress(progress);
      scene.setBranch(selectedBranch);
      scene.setVisible(visible);
    } catch {
      fallback();
    }
  }
  if ("IntersectionObserver" in window) {
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        scene?.setVisible(visible);
        if (visible) loadScene();
      },
      { rootMargin: "150px" },
    );
    visibility.observe(experience);
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
        ".story-section > h2, .product-figure, .pull-quote, .lesson",
      )
      .forEach((element) => reveals.observe(element));
  } else {
    loadScene();
  }
}
