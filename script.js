// ---- midnight boot countdown ----
const bootScreen = document.querySelector("#bootScreen");
const bootSkipBtn = document.querySelector("#bootSkipBtn");
const bootDateStage = document.querySelector("#bootDateStage");
const bootDateBefore = document.querySelector("#bootDateBefore");
const bootDateAfter = document.querySelector("#bootDateAfter");
const bootClock = document.querySelector("#bootClock");
const bootKicker = document.querySelector("#bootKicker");
const bootClockCaption = document.querySelector("#bootClockCaption");
const page1El = document.querySelector("#page1");
const resumePrompt = document.querySelector("#resumePrompt");
const resumeContinueBtn = document.querySelector("#resumeContinueBtn");
const resumeStartOverBtn = document.querySelector("#resumeStartOverBtn");
const performanceToggle = document.querySelector("#performanceToggle");
let performanceMode = false;

try {
  performanceMode = localStorage.getItem("birthdayPerformanceMode") === "true";
} catch (error) {
  console.warn("Could not load the performance-mode preference.", error);
}

document.body.classList.toggle("performance-mode", performanceMode);

function hasSavedJourney() {
  try {
    const saved = JSON.parse(localStorage.getItem("birthdayJourneyProgress"));
    return (
      saved?.version === 1 &&
      Number.isInteger(saved.pageIndex) &&
      saved.pageIndex > 0 &&
      saved.pageIndex < 7
    );
  } catch (error) {
    console.warn("Could not check for saved journey progress.", error);
    return false;
  }
}

const returningVisit = hasSavedJourney();
if (returningVisit) bootSkipBtn.classList.remove("hidden");

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (typeof image.decode !== "function") {
        resolve();
        return;
      }

      image
        .decode()
        .then(resolve)
        .catch((error) => {
          console.error(`Could not decode image "${src}".`, error);
          resolve();
        });
    };
    image.onerror = () => {
      console.error(`Could not preload image "${src}".`);
      resolve();
    };
    image.src = src;
  });
}

const imageAssets = [
  ...Array.from({ length: 9 }, (_, index) => `images/photo${index + 1}.jpg`),
  "images/RubyChicken.png",
  "images/Flowers.png",
  "images/HotdogBread.png",
  "images/Muffin.png",
  "images/CakeSlice.png?v=2",
];
const imagePreloadPromise = Promise.all(imageAssets.map(preloadImage));

let bootClockTimer = 0;
let bootFinishTimer = 0;
let backgroundMusicStartTimer = 0;
let bootFinished = false;
const bootDateTransitionDuration = 1250;

async function finishBoot(skipIntro = false) {
  if (bootFinished) return;
  bootFinished = true;
  clearInterval(bootClockTimer);
  clearTimeout(bootFinishTimer);
  if (skipIntro) {
    showMidnightDate();
    await new Promise((resolve) =>
      setTimeout(resolve, bootDateTransitionDuration),
    );
  }

  await imagePreloadPromise;
  await updatePhotoWash(page1);
  setTimeout(
    () => {
      bootScreen.classList.add("fade-out");
      page1El.classList.remove("hidden");
      document.body.classList.add("boot-transition");
      setTimeout(() => {
        document.body.classList.remove("boot-transition");
        bootScreen.remove();
        showResumePromptIfAvailable();
        backgroundMusicStartTimer = setTimeout(() => {
          startBackgroundMusic();
        }, 2600);
      }, 800);
    },
    skipIntro ? 100 : 600,
  );
}

function showMidnightDate() {
  bootDateStage.classList.add("is-midnight");
  bootDateBefore.setAttribute("aria-hidden", "true");
  bootDateAfter.removeAttribute("aria-hidden");
  bootClock.textContent = "12:00:00 AM";
  bootKicker.textContent = "THE DAY IS HERE";
  bootClockCaption.textContent = "happy birthday ♡";
}

bootSkipBtn.addEventListener("click", () => finishBoot(true));

function startBootCountdown() {
  let secondsRemaining = 5;
  const tickDuration = 1000;
  bootClockTimer = setInterval(() => {
    if (bootFinished) {
      clearInterval(bootClockTimer);
      return;
    }

    secondsRemaining -= 1;
    if (secondsRemaining > 0) {
      bootClock.textContent = `11:59:${String(60 - secondsRemaining).padStart(2, "0")} PM`;
      return;
    }

    clearInterval(bootClockTimer);
    showMidnightDate();
    bootFinishTimer = setTimeout(
      () => finishBoot(),
      bootDateTransitionDuration,
    );
  }, tickDuration);
}

startBootCountdown();

const page1 = document.querySelector("#page1");
const page2 = document.querySelector("#page2");
const page3 = document.querySelector("#page3");
const page4 = document.querySelector("#page4");
const page5 = document.querySelector("#page5");
const pageCake = document.querySelector("#pageCake");
const page6 = document.querySelector("#page6");
const photoWash = document.querySelector("#photoWash");
const photoWashPieces = [...photoWash.querySelectorAll("img")];
const heartCollectibles = [...document.querySelectorAll(".heart-collectible")];
const heartCollectionStatus = document.querySelector("#heartCollectionStatus");
const heartParticleLayer = document.querySelector("#heartParticleLayer");
const heartCelebrationMessage = document.querySelector(
  "#heartCelebrationMessage",
);
const collectedHeartIds = new Set();
const heartCollectionStorageKey = "birthdayCollectedHearts";
const heartCelebrationStorageKey = "birthdayHeartCelebrationShown";
let heartCelebrationShown = false;
let heartBurstTimer = 0;

try {
  const savedHeartIds = JSON.parse(
    localStorage.getItem(heartCollectionStorageKey),
  );
  if (Array.isArray(savedHeartIds)) {
    savedHeartIds
      .filter((id) =>
        heartCollectibles.some((heart) => heart.dataset.heartId === id),
      )
      .forEach((id) => collectedHeartIds.add(id));
  }
  heartCelebrationShown =
    localStorage.getItem(heartCelebrationStorageKey) === "true";
} catch (error) {
  console.warn("Could not load collected hearts.", error);
}

function updateHeartCollectibles() {
  const count = collectedHeartIds.size;
  heartCollectionStatus.textContent = `heart collected ${count}/3`;
  heartCollectionStatus.classList.toggle("hidden", count === 0);
  heartCollectibles.forEach((heart) => {
    const collected = collectedHeartIds.has(heart.dataset.heartId);
    heart.textContent = collected ? "♥" : "♡";
    heart.classList.toggle("is-collected", collected);
    heart.setAttribute("aria-pressed", String(collected));
    heart.setAttribute(
      "aria-label",
      collected ? "Heart collected" : "Collect hidden heart",
    );
  });
  updateHeartParticles();
}

function resetHeartCollection() {
  collectedHeartIds.clear();
  heartCelebrationShown = false;
  if (heartBurstTimer) clearTimeout(heartBurstTimer);
  heartBurstTimer = 0;
  heartParticleLayer.replaceChildren();
  heartParticleLayer.classList.remove(
    "is-visible",
    "is-bursting",
    "is-twinkling",
  );

  try {
    localStorage.removeItem(heartCollectionStorageKey);
    localStorage.removeItem(heartCelebrationStorageKey);
  } catch (error) {
    console.warn("Could not clear collected hearts.", error);
  }

  updateHeartCollectibles();
}

function createTwinklingHearts() {
  heartParticleLayer.replaceChildren();
  heartParticleLayer.classList.remove("is-bursting");
  heartParticleLayer.classList.add("is-twinkling");
  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement("span");
    particle.className = "heart-particle";
    particle.textContent = index % 3 === 0 ? "♡" : "♥";
    particle.style.setProperty("--heart-x", `${4 + Math.random() * 92}%`);
    particle.style.setProperty("--heart-y", `${5 + Math.random() * 90}%`);
    particle.style.setProperty("--heart-delay", `${Math.random() * -5}s`);
    particle.style.setProperty(
      "--heart-duration",
      `${3.4 + Math.random() * 3}s`,
    );
    particle.style.setProperty("--heart-size", `${8 + Math.random() * 13}px`);
    heartParticleLayer.append(particle);
  }
}

function createHeartBurst() {
  heartParticleLayer.replaceChildren();
  heartParticleLayer.classList.remove("is-twinkling");
  heartParticleLayer.classList.add("is-bursting");
  for (let index = 0; index < 38; index += 1) {
    const particle = document.createElement("span");
    particle.className = "heart-particle";
    particle.textContent = index % 4 === 0 ? "♡" : "♥";
    particle.style.setProperty("--burst-x", `${(Math.random() - 0.5) * 90}vw`);
    particle.style.setProperty("--burst-y", `${(Math.random() - 0.5) * 80}vh`);
    particle.style.setProperty(
      "--burst-rotate",
      `${(Math.random() - 0.5) * 100}deg`,
    );
    particle.style.setProperty("--heart-size", `${12 + Math.random() * 18}px`);
    particle.style.setProperty("--burst-delay", `${Math.random() * 160}ms`);
    heartParticleLayer.append(particle);
  }

  heartBurstTimer = setTimeout(() => {
    heartBurstTimer = 0;
    createTwinklingHearts();
  }, 1350);
}

function updateHeartParticles() {
  const allCollected = collectedHeartIds.size === heartCollectibles.length;
  const finaleVisible = !page6.classList.contains("hidden");
  heartCelebrationMessage.classList.toggle(
    "hidden",
    !allCollected || !finaleVisible,
  );
  heartCelebrationMessage.classList.toggle(
    "is-visible",
    allCollected && finaleVisible,
  );
  const shouldShow = allCollected && finaleVisible && !performanceMode;
  heartParticleLayer.classList.toggle("is-visible", shouldShow);
  if (!shouldShow || heartParticleLayer.childElementCount > 0) return;

  if (!heartCelebrationShown) {
    heartCelebrationShown = true;
    try {
      localStorage.setItem(heartCelebrationStorageKey, "true");
    } catch (error) {
      console.warn("Could not save the heart celebration state.", error);
    }

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      createHeartBurst();
      return;
    }
  }

  createTwinklingHearts();
}

heartCollectibles.forEach((heart) => {
  heart.addEventListener("click", () => {
    const id = heart.dataset.heartId;
    if (collectedHeartIds.has(id)) return;
    collectedHeartIds.add(id);
    try {
      localStorage.setItem(
        heartCollectionStorageKey,
        JSON.stringify([...collectedHeartIds]),
      );
    } catch (error) {
      console.warn("Could not save collected hearts.", error);
    }
    updateHeartCollectibles();
  });
});
updateHeartCollectibles();

// ---- page history + overall navigation ----
const pageOrder = [page1, page2, page3, page4, page5, pageCake, page6];
const pageBackgroundPhotos = new Map([
  [page1, ["photo1.jpg", "photo3.jpg", "photo5.jpg", "photo7.jpg"]],
  [page2, ["photo3.jpg", "photo5.jpg", "photo7.jpg", "photo8.jpg"]],
  [page3, ["photo1.jpg", "photo8.jpg", "photo5.jpg", "photo9.jpg"]],
  [page4, ["photo7.jpg", "photo9.jpg", "photo1.jpg", "photo5.jpg"]],
  [page5, ["photo8.jpg", "photo1.jpg", "photo3.jpg", "photo9.jpg"]],
  [pageCake, ["photo5.jpg", "photo7.jpg", "photo3.jpg", "photo8.jpg"]],
]);
const pageNames = [
  "Welcome",
  "Birthday message",
  "Constellation",
  "Memories",
  "A song for you",
  "Make a wish",
  "Final note",
];
let pageHistory = [page1];
let pendingResumeProgress = null;

const rewindBtn = document.querySelector("#rewindBtn");
const overallDotsContainer = document.querySelector("#overallDots");
const overallProgress = document.querySelector("#overallProgress");
rewindBtn.setAttribute("aria-label", "Go back to the previous page");

const overallDotEls = pageOrder.map(() => {
  const dot = document.createElement("span");
  dot.classList.add("page-dot");
  dot.setAttribute("aria-hidden", "true");
  overallDotsContainer.appendChild(dot);
  return dot;
});

function updateOverallDots(currentPage) {
  const currentIndex = pageOrder.indexOf(currentPage);
  overallProgress.textContent = `${currentIndex + 1} / ${pageOrder.length}`;
  overallDotsContainer.setAttribute(
    "aria-label",
    `Page ${currentIndex + 1} of ${pageOrder.length}: ${pageNames[currentIndex]}`,
  );
  overallDotEls.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
    dot.classList.toggle("visited", i < currentIndex);
  });
}

let photoWashRequest = 0;

async function waitForImageDecode(image) {
  try {
    if (!image.complete) {
      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }
    if (image.naturalWidth > 0 && typeof image.decode === "function") {
      await image.decode();
    }
  } catch (error) {
    console.error(
      `Could not decode image "${image.currentSrc || image.src}".`,
      error,
    );
  }
}

async function updatePhotoWash(page) {
  const request = ++photoWashRequest;
  const photos = pageBackgroundPhotos.get(page);
  photoWash.classList.add("hidden");
  if (!photos) return;

  photoWashPieces.forEach((piece, index) => {
    const src = `images/${photos[index]}`;
    if (piece.getAttribute("src") !== src) piece.setAttribute("src", src);
  });

  await Promise.all(photoWashPieces.map(waitForImageDecode));
  if (request === photoWashRequest) photoWash.classList.remove("hidden");
}

let pageTransitionInProgress = false;

function goToPage(fromPage, toPage, onEnter, recordHistory = true) {
  if (pageTransitionInProgress) return;
  pageTransitionInProgress = true;
  const isRewind = !recordHistory;
  const outgoingClass = isRewind ? "rewinding-out" : "transitioning-out";
  const incomingClass = isRewind ? "rewinding-in" : "transitioning-in";
  const activeIncomingClass = isRewind
    ? "rewinding-in-active"
    : "transitioning-in-active";
  const transitionDuration = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? 20
    : 900;

  fromPage.classList.remove(
    "transitioning-in",
    "transitioning-in-active",
    "rewinding-in",
    "rewinding-in-active",
  );
  fromPage.classList.add(outgoingClass);
  playWhoosh();

  setTimeout(async () => {
    fromPage.classList.add("hidden");
    fromPage.classList.remove("transitioning-out", "rewinding-out");

    await imagePreloadPromise;
    await updatePhotoWash(toPage);
    await Promise.all(
      [...toPage.querySelectorAll("img")].map(waitForImageDecode),
    );

    toPage.classList.remove(
      "transitioning-out",
      "transitioning-in-active",
      "rewinding-out",
      "rewinding-in-active",
    );
    toPage.classList.remove("hidden");
    updateHeartParticles();
    toPage.classList.add(incomingClass);
    if (typeof onEnter === "function") onEnter();

    void toPage.offsetWidth;

    requestAnimationFrame(() => {
      toPage.classList.add(activeIncomingClass);
      toPage.classList.remove(incomingClass);
      setTimeout(() => {
        toPage.classList.remove(activeIncomingClass);
        pageTransitionInProgress = false;
      }, transitionDuration);
    });

    if (recordHistory) {
      pageHistory.push(toPage);
    }

    updateOverallDots(toPage);
    rewindBtn.classList.toggle("hidden", pageHistory.length <= 1);
    saveJourneyProgress();
  }, transitionDuration);
}

rewindBtn.addEventListener("click", () => {
  if (pageTransitionInProgress || pageHistory.length <= 1) return;

  const current = pageHistory.pop(); // remove current page
  const previous = pageHistory[pageHistory.length - 1]; // peek at the one before it

  goToPage(
    current,
    previous,
    previous === page3 ? resetConstellationPage : undefined,
    false,
  );
});

updateOverallDots(page1);

const openBtn = document.querySelector("#openBtn");
const linesContainer = document.querySelector("#messageLines");
const nextBtn = document.querySelector("#nextBtn");

// The lines of your message — edit these to whatever you want to say
const lines = [
  "Hey sweetie before we start, lemme wish you HAPPY SWEET SEVENTEEN BABYY :>",
  "I don't really know how to put everything I want to say into one message...",
  "But thank you so much for your presence in my life.",
  "I hope today I could remind you of how loved and appreciated you are :3",
];

openBtn.addEventListener("click", () => {
  if (typeof window.startBookCutscene === "function") {
    window.startBookCutscene();
    return;
  }

  // Graceful fallback if the cinematic layer fails to load.
  goToPage(page1, page2, () => showLines());
});

function showLines() {
  const lineEl = document.createElement("p");
  linesContainer.appendChild(lineEl);

  let i = 0;

  function showNextLine() {
    if (i >= lines.length) {
      nextBtn.classList.remove("hidden");
      return;
    }

    lineEl.textContent = lines[i];
    lineEl.classList.remove("fade-out");
    lineEl.classList.add("fade-in");

    setTimeout(() => {
      lineEl.classList.remove("fade-in");
      lineEl.classList.add("fade-out");

      setTimeout(() => {
        i++;
        showNextLine();
      }, 1000);
    }, 3300);
  }

  showNextLine();
}

const sky = document.querySelector("#sky");
const starMessage = document.querySelector("#starMessage");
const starDate = document.querySelector("#starDate");
const starHint = document.querySelector("#starHint");
const doodleSvg = document.querySelector("#doodleSvg");
const toFinaleBtn = document.querySelector("#toFinaleBtn");

function showStarHint() {
  starHint.classList.remove("is-hidden");
}

function hideStarHint() {
  starHint.classList.add("is-hidden");
}

nextBtn.addEventListener("click", () => {
  goToPage(page2, page3, () => {
    resizeCanvas();
    syncContinueButton();
    if (discovered.size === 0) showStarHint();
    else hideStarHint();
  });
});

const linesSvg = document.querySelector("#constellationLines");
const starEls = [...document.querySelectorAll(".star:not(.npc-star)")];

// Libra, drawn like the star-chart reference: a kite-shaped scale with a long
// tail of three stars trailing off to the left. Star order (= memory order):
// 0 top, 1-3 left tail, 4 upper right, 5 lower right, 6 bottom. The little NPC
// star (index 7) is the tiny tip hanging beneath the bottom star.
const starPositions = starEls.map((star) => ({
  x: (Number(star.dataset.x) / 100) * 500,
  y: (Number(star.dataset.y) / 100) * 260,
}));
const NPC_INDEX = starPositions.length;
starPositions.push({ x: (50.8 / 100) * 500, y: (84 / 100) * 260 });
const libraEdges = [
  [0, 1], [1, 2], [2, 3], // the long tail to the left
  [0, 4], // top to upper right
  [0, 5], // top down to lower right (the long diagonal)
  [4, 5], // right side
  [5, 6], // lower right to bottom
  [6, NPC_INDEX], // bottom star to the tiny tip
];
libraEdges.forEach(([a, b]) => {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", starPositions[a].x);
  line.setAttribute("y1", starPositions[a].y);
  line.setAttribute("x2", starPositions[b].x);
  line.setAttribute("y2", starPositions[b].y);
  line.classList.add("constellation-line");
  linesSvg.appendChild(line);
});
const lineEls = [...linesSvg.querySelectorAll(".constellation-line")];

starEls.forEach((star) => {
  star.style.left = star.dataset.x + "%";
  star.style.top = star.dataset.y + "%";
});

// The little eighth star is an NPC: purely decorative, not clickable and
// not counted toward the seven memory stars or constellation completion.
const npcStar = document.querySelector(".npc-star");
if (npcStar) {
  npcStar.style.left = "50.8%";
  npcStar.style.top = "84%";
}

// ---- progress dots ----
const progressDots = document.querySelector("#progressDots");
const dotEls = starEls.map(() => {
  const dot = document.createElement("span");
  dot.classList.add("dot");
  progressDots.appendChild(dot);
  return dot;
});

const discovered = new Set();
const constellationCompletion = document.querySelector(
  "#constellationCompletion",
);
let constellationCompleted = false;
let constellationCompletionRevealed = false;
let constellationCompletionTimers = [];
let restoringJourneyProgress = false;

function syncContinueButton() {
  toFinaleBtn.classList.toggle("hidden", !constellationCompletionRevealed);
}

function completeConstellation(animate = true) {
  if (constellationCompleted || discovered.size !== starEls.length) return;
  constellationCompleted = true;
  constellationCompletion.classList.add("hidden");

  skyForZoom.style.transform = "none";
  if (!animate) {
    linesSvg.classList.add("constellation-complete");
    constellationCompletion.classList.remove("hidden");
    constellationCompletionRevealed = true;
    syncContinueButton();
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const zoomOutDuration = reducedMotion ? 20 : 1200;
  const drawDuration = reducedMotion ? 20 : 1100;
  constellationCompletionTimers = [
    setTimeout(() => {
      if (discovered.size !== starEls.length) return;
      linesSvg.classList.add("constellation-completing");
      constellationCompletionTimers.push(
        setTimeout(() => {
          if (discovered.size !== starEls.length) return;
          linesSvg.classList.add("constellation-complete");
          constellationCompletion.classList.remove("hidden");
          constellationCompletionRevealed = true;
          syncContinueButton();

          // The heart has just finished closing: give it a distinct final bloom.
          spawnConstellationCompletionFx();
          playConstellationCompletionSound();
        }, drawDuration),
      );
    }, zoomOutDuration),
  ];
}

function revealProgress(index) {
  discovered.add(index);
  starEls[index].classList.add("lit");
  starEls[index].setAttribute(
    "aria-label",
    `Memory revealed: ${starEls[index].dataset.msg}`,
  );
  dotEls[index].classList.add("lit");
  syncContinueButton();

  // reveal any line where BOTH connected stars are now discovered
  lineEls.forEach((line, i) => {
    const [a, b] = libraEdges[i];
    if (discovered.has(a) && (b === NPC_INDEX || discovered.has(b))) {
      line.classList.add("revealed");
    }
  });
  if (discovered.size === starEls.length) {
    completeConstellation(!restoringJourneyProgress);
  }
  saveJourneyProgress();
}

const skyForZoom = document.querySelector("#sky");
const constellationViewport = document.querySelector("#viewport");
const backBtn = document.querySelector("#backBtn");
const constellationZoom = 2.5;
let starSelectionSequence = 0;

// ---- constellation bloom particles ----
// Lightweight DOM particles: intentionally skipped in performance mode.
let constellationFxLayer = null;

function ensureConstellationFxLayer() {
  if (constellationFxLayer) return constellationFxLayer;
  constellationFxLayer = document.createElement("div");
  constellationFxLayer.id = "constellationFxLayer";
  constellationFxLayer.setAttribute("aria-hidden", "true");
  constellationViewport.appendChild(constellationFxLayer);
  return constellationFxLayer;
}

function spawnConstellationBurst(x, y, options = {}) {
  if (performanceMode) return;

  const layer = ensureConstellationFxLayer();
  const count = options.count ?? 18;
  const spread = options.spread ?? 1;
  const colors = options.colors ?? ["gold", "lavender", "rose", "white"];

  const flash = document.createElement("span");
  flash.className = "constellation-bloom-flash";
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  layer.appendChild(flash);
  flash.addEventListener("animationend", () => flash.remove(), { once: true });

  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    particle.className = "constellation-bloom-particle";
    const angle = Math.random() * Math.PI * 2;
    const distance = (24 + Math.random() * 52) * spread;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance;
    const size = 2 + Math.random() * 3.4;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty("--burst-x", `${driftX}px`);
    particle.style.setProperty("--burst-y", `${driftY}px`);
    particle.style.setProperty(
      "--burst-rotate",
      `${Math.round((Math.random() - 0.5) * 180)}deg`,
    );
    particle.style.setProperty(
      "--burst-delay",
      `${Math.random() * 70}ms`,
    );
    particle.dataset.tone =
      colors[Math.floor(Math.random() * colors.length)];

    layer.appendChild(particle);
    particle.addEventListener(
      "animationend",
      () => particle.remove(),
      { once: true },
    );
  }
}

function burstAtStar(star, options = {}) {
  if (performanceMode) return;

  requestAnimationFrame(() => {
    const rect = star.getBoundingClientRect();
    const viewportRect = constellationViewport.getBoundingClientRect();
    spawnConstellationBurst(
      rect.left + rect.width / 2 - viewportRect.left,
      rect.top + rect.height / 2 - viewportRect.top,
      options,
    );
  });
}

function spawnConstellationCompletionFx() {
  if (performanceMode) return;

  const viewportRect = constellationViewport.getBoundingClientRect();
  const centerX = viewportRect.width / 2;
  const centerY = viewportRect.height * 0.34;

  spawnConstellationBurst(centerX, centerY, {
    count: 52,
    spread: 1.55,
    colors: ["gold", "lavender", "rose", "white"],
  });

  const layer = ensureConstellationFxLayer();

  // Replace the old expanding ring with a softer "bloom": little starbursts
  // appear at different distances, twinkle, then dissolve into dust.
  const sparkleCount = 18;
  for (let i = 0; i < sparkleCount; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "constellation-completion-sparkle";
    const angle = (Math.PI * 2 * i) / sparkleCount + (Math.random() - 0.5) * 0.28;
    const distance = 26 + Math.random() * 92;

    sparkle.style.left = `${centerX}px`;
    sparkle.style.top = `${centerY}px`;
    sparkle.style.setProperty("--twinkle-x", `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty("--twinkle-y", `${Math.sin(angle) * distance}px`);
    sparkle.style.setProperty("--twinkle-size", `${7 + Math.random() * 9}px`);
    sparkle.style.setProperty("--twinkle-delay", `${80 + Math.random() * 260}ms`);
    sparkle.dataset.tone = ["gold", "lavender", "rose", "white"][i % 4];

    layer.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
  }
}

function playConstellationCompletionSound() {
  if (performanceMode) return;

  const play = () => {
    try {
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((frequency, index) => {
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = index === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency * 0.96, now);
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency,
          now + 0.22,
        );

        const start = now + index * 0.075;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          index === 0 ? 0.065 : 0.04,
          start + 0.035,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.35);

        oscillator.connect(gain);
        gain.connect(effectsGain);
        oscillator.start(start);
        oscillator.stop(start + 1.4);
      });

      // A very soft high shimmer, distinct from the normal two-note star sound.
      playNoiseSweep({
        duration: 0.85,
        startFrequency: 2600,
        endFrequency: 6200,
        peak: 0.018,
        filterType: "highpass",
        delay: 0.08,
      });
    } catch (error) {
      /* visual completion should never depend on audio */
    }
  };

  if (audioCtx.state === "running") {
    play();
  } else {
    audioCtx.resume().then(play).catch(() => {});
  }
}

function drawDoodle(key) {
  const pathData = doodles[key];
  if (!pathData) return;

  doodleSvg.classList.remove("active");
  doodleSvg.innerHTML = `<path d="${pathData}"></path>`;
  const path = doodleSvg.querySelector("path");
  const length = path.getTotalLength();

  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  void path.getBoundingClientRect();
  path.style.transition = "stroke-dashoffset 0.9s ease";
  doodleSvg.classList.add("active");
  path.style.strokeDashoffset = "0";
}

starEls.forEach((star, index) => {
  star.setAttribute("role", "button");
  star.setAttribute("tabindex", "0");
  star.setAttribute("aria-label", `Reveal memory: ${star.dataset.msg}`);
  star.addEventListener("click", () => {
    playMagicStar(index);
    const x = parseFloat(star.dataset.x);
    const y = parseFloat(star.dataset.y);
    const offsetX =
      constellationViewport.clientWidth / 2 -
      (constellationViewport.clientWidth * x * constellationZoom) / 100;
    const offsetY =
      constellationViewport.clientHeight / 2 -
      (constellationViewport.clientHeight * y * constellationZoom) / 100;

    skyForZoom.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${constellationZoom})`;
    burstAtStar(star);
    revealProgress(index);
    hideStarHint();
    drawDoodle(starDoodleMap[index]);
    starDate.classList.remove("show");
    starMessage.classList.remove("show");
    const selectionSequence = ++starSelectionSequence;

    setTimeout(() => {
      if (selectionSequence !== starSelectionSequence) return;
      starDate.textContent = star.dataset.date;
      starDate.classList.remove("show");
      void starDate.offsetWidth;
      starDate.classList.add("show");
      starMessage.textContent = star.dataset.msg;
      starMessage.classList.remove("show");
      void starMessage.offsetWidth;
      starMessage.classList.add("show");
      backBtn.classList.remove("hidden");
    }, 700);
  });
  star.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    star.click();
  });
});

backBtn.addEventListener("click", () => {
  starSelectionSequence++;
  skyForZoom.style.transform = "none";
  starDate.classList.remove("show");
  starMessage.classList.remove("show");
  backBtn.classList.add("hidden");
  doodleSvg.classList.remove("active");
});

function resetConstellationPage() {
  starSelectionSequence++;
  skyForZoom.style.transform = "none";
  starDate.classList.remove("show");
  starMessage.classList.remove("show");
  backBtn.classList.add("hidden");
  doodleSvg.classList.remove("active");
  syncContinueButton();
  if (discovered.size === 0) showStarHint();
  else hideStarHint();
}

const canvas = document.querySelector("#bgStars");
const ctx = canvas.getContext("2d", { alpha: true });
let bgStars = [];
let bgStarsFrame = 0;
let skyCanvasWidth = 0;
let skyCanvasHeight = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  skyCanvasWidth = Math.max(1, rect.width);
  skyCanvasHeight = Math.max(1, rect.height);

  // Render at device-pixel resolution so tiny stars stay crisp on Retina/high-DPI
  // displays instead of becoming fuzzy blobs.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(skyCanvasWidth * dpr);
  canvas.height = Math.round(skyCanvasHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Several depth layers: lots of quiet dust, fewer medium stars, and a handful
  // of softly glowing points. This makes the background feel like a sky rather
  // than a uniform particle generator.
  const stars = [];

  for (let i = 0; i < 125; i += 1) {
    stars.push({
      x: Math.random() * skyCanvasWidth,
      y: Math.random() * skyCanvasHeight,
      radius: Math.random() * 0.65 + 0.25,
      baseAlpha: Math.random() * 0.28 + 0.10,
      twinkleSpeed: Math.random() * 0.012 + 0.003,
      phase: Math.random() * Math.PI * 2,
      glow: false,
    });
  }

  for (let i = 0; i < 28; i += 1) {
    stars.push({
      x: Math.random() * skyCanvasWidth,
      y: Math.random() * skyCanvasHeight,
      radius: Math.random() * 0.9 + 0.55,
      baseAlpha: Math.random() * 0.34 + 0.22,
      twinkleSpeed: Math.random() * 0.018 + 0.004,
      phase: Math.random() * Math.PI * 2,
      glow: false,
    });
  }

  for (let i = 0; i < 7; i += 1) {
    stars.push({
      x: Math.random() * skyCanvasWidth,
      y: Math.random() * skyCanvasHeight,
      radius: Math.random() * 1.0 + 0.75,
      baseAlpha: Math.random() * 0.28 + 0.48,
      twinkleSpeed: Math.random() * 0.022 + 0.006,
      phase: Math.random() * Math.PI * 2,
      glow: true,
    });
  }

  // Quiet colour variety: most stars stay moon-white, some lean lavender or rose.
  stars.forEach((st) => {
    const roll = Math.random();
    st.tone = roll < 0.16 ? 1 : roll < 0.30 ? 2 : 0;
  });
  bgStars = stars;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawStars(time) {
  bgStarsFrame = 0;
  ctx.clearRect(0, 0, skyCanvasWidth, skyCanvasHeight);

  if (performanceMode || !skyCanvasWidth || !skyCanvasHeight) return;

  bgStars.forEach((s) => {
    const pulse = Math.sin(time * s.twinkleSpeed + s.phase);
    const alpha = Math.max(0.02, Math.min(0.92, s.baseAlpha + pulse * 0.16));

    if (s.glow) {
      const glow = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, s.radius * 5.5
      );
      glow.addColorStop(0, `rgba(255, 248, 204, ${alpha * 0.55})`);
      glow.addColorStop(0.28, `rgba(242, 195, 79, ${alpha * 0.18})`);
      glow.addColorStop(1, "rgba(242, 195, 79, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 5.5, 0, Math.PI * 2);
      ctx.fill();
      // tiny four-point flare that breathes with the twinkle
      const flare = s.radius * (6 + pulse * 2.2);
      ctx.strokeStyle = `rgba(255, 248, 230, ${alpha * 0.42})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(s.x - flare, s.y);
      ctx.lineTo(s.x + flare, s.y);
      ctx.moveTo(s.x, s.y - flare);
      ctx.lineTo(s.x, s.y + flare);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    const rgb = s.tone === 1 ? "213, 213, 244" : s.tone === 2 ? "240, 185, 201" : "244, 241, 234";
    ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
    ctx.fill();
  });

  bgStarsFrame = requestAnimationFrame(drawStars);
}

if (performanceMode) {
  ctx.clearRect(0, 0, skyCanvasWidth, skyCanvasHeight);
} else {
  bgStarsFrame = requestAnimationFrame(drawStars);
}

toFinaleBtn.addEventListener("click", () => {
  goToPage(page3, page4);
});

const finalLetterPages = [
  "I miss u...",
  "I MISS UUUUUUUUUUUUUUUU x10",
  "MISSSSSSSS UUUUUUUUUUUUUU SSSMMMMMMMMMMMM (miss, luv, happyy, laik) X999",
];
const lastThingBtn = document.querySelector("#lastThingBtn");
const finaleInteraction = document.querySelector("#finaleInteraction");
const finalEnvelope = document.querySelector("#finalEnvelope");
const envelopeFlap = finalEnvelope.querySelector(".envelope-flap");
const finalMessage = document.querySelector("#finalMessage");
const finalLetterMessage = document.querySelector("#finalLetterMessage");
const finalLetterClosing = document.querySelector("#finalLetterClosing");
const finalLetterPageCount = document.querySelector("#finalLetterPageCount");
const nextLetterPageBtn = document.querySelector("#nextLetterPageBtn");
const closeFinalLetterBtn = document.querySelector("#closeFinalLetterBtn");
const giftBox = document.querySelector("#giftBox");
const giftBoxHint = document.querySelector("#giftBoxHint");
const giftReveal = document.querySelector("#giftReveal");
const giftSpotlight = document.querySelector("#giftSpotlight");
const giftSpotlightBox = document.querySelector("#giftSpotlightBox");
const giftSpotlightImage = document.querySelector("#giftSpotlightImage");
const giftSpotlightName = document.querySelector("#giftSpotlightName");
const giftSpotlightParticles = document.querySelector(
  "#giftSpotlightParticles",
);
const gifts = [
  { name: "Ruby Chicken", src: "images/RubyChicken.png" },
  { name: "Flowers", src: "images/Flowers.png" },
  { name: "Hotdog Bread", src: "images/HotdogBread.png" },
  { name: "Muffin", src: "images/Muffin.png" },
  { name: "Cake Slice", src: "images/CakeSlice.png?v=2" },
];
let giftTapCount = 0;
let currentGiftIndex = 0;
let giftSpotlightComplete = false;
let currentLetterPage = 0;
let letterPageSequence = 0;

function showGiftSpotlight() {
  const gift = gifts[currentGiftIndex];
  if (giftSpotlightParticles.childElementCount === 0) {
    for (let index = 0; index < 18; index += 1) {
      const particle = document.createElement("span");
      particle.className = "gift-glow-particle";
      particle.style.setProperty("--particle-x", `${8 + Math.random() * 84}%`);
      particle.style.setProperty("--particle-y", `${8 + Math.random() * 84}%`);
      particle.style.setProperty(
        "--particle-delay",
        `${Math.random() * -3.5}s`,
      );
      particle.style.setProperty(
        "--particle-duration",
        `${2.1 + Math.random() * 2.2}s`,
      );
      particle.style.setProperty(
        "--particle-size",
        `${3 + Math.random() * 5}px`,
      );
      giftSpotlightParticles.append(particle);
    }
  }
  giftSpotlightImage.src = gift.src;
  giftSpotlightImage.alt = gift.name;
  giftSpotlightName.textContent = gift.name;
  giftSpotlight.classList.remove("hidden");
  page6.classList.add("gift-spotlight-open");
  const giftEntry = giftSpotlightImage.parentElement;
  giftEntry.classList.remove("is-shaking");
  void giftEntry.offsetWidth;
  giftEntry.classList.add("is-shaking");
  giftSpotlightImage.classList.remove("is-revealing");
  void giftSpotlightImage.offsetWidth;
  giftSpotlightImage.classList.add("is-revealing");
  giftSpotlight.focus();
}

function dismissGiftSpotlight() {
  giftSpotlight.classList.add("hidden");
  page6.classList.remove("gift-spotlight-open");
  giftReveal.insertBefore(giftBox, giftBoxHint);
  giftSpotlightComplete = true;
  giftBoxHint.textContent = "Real gift on the wayy yahh hunny, hihi ♡";
  giftBox.focus();
}

function advanceGiftSpotlight() {
  if (giftSpotlight.classList.contains("hidden")) return;
  playPaperRustle();
  if (currentGiftIndex < gifts.length - 1) {
    currentGiftIndex += 1;
    showGiftSpotlight();
  } else {
    dismissGiftSpotlight();
  }
  saveJourneyProgress();
}

function openGiftBox(showSpotlight = true) {
  giftBox.classList.add("is-opened");
  giftBox.setAttribute("aria-expanded", "true");
  giftBox.setAttribute("aria-label", "Your birthday gifts are open");
  if (showSpotlight && !giftSpotlightComplete) {
    giftBoxHint.textContent =
      "A little collection of things picked just for you ♡";
    giftSpotlightBox.append(giftBox);
    showGiftSpotlight();
  } else {
    giftBoxHint.textContent = "You've unwrapped every little surprise ♡";
  }
}

giftBox.addEventListener("click", () => {
  if (giftTapCount >= 5) return;
  giftTapCount += 1;
  playPaperRustle();
  giftBox.classList.remove("is-tapping");
  void giftBox.offsetWidth;
  giftBox.classList.add("is-tapping");
  if (giftTapCount < 5) {
    giftBoxHint.textContent = `A little gift is waiting — ${5 - giftTapCount} more ${5 - giftTapCount === 1 ? "tap" : "taps"} ♡`;
    giftBox.setAttribute(
      "aria-label",
      `Tap to unwrap your gift, ${giftTapCount} of 5 taps`,
    );
  } else {
    giftSpotlightComplete = false;
    openGiftBox();
  }
  saveJourneyProgress();
});

giftSpotlight.addEventListener("click", (event) => {
  if (event.target === giftSpotlight) advanceGiftSpotlight();
});

giftSpotlight.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    if (event.shiftKey && document.activeElement === giftSpotlight) {
      giftBox.focus();
    } else if (!event.shiftKey && document.activeElement === giftBox) {
      giftSpotlight.focus();
    } else if (event.shiftKey) {
      giftSpotlight.focus();
    } else {
      giftBox.focus();
    }
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    advanceGiftSpotlight();
  }
});

lastThingBtn.addEventListener("click", () => {
  lastThingBtn.classList.add("hidden");
  page6.classList.add("finale-started");
  finaleInteraction.classList.remove("hidden");
  saveJourneyProgress();
});

finalEnvelope.addEventListener("click", () => {
  if (
    finalEnvelope.classList.contains("is-opening") &&
    !finalEnvelope.classList.contains("is-opened")
  ) {
    return;
  }

  playPaperRustle();

  if (finalEnvelope.classList.contains("is-opened")) {
    revealFinalLetter();
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finalEnvelope.classList.add("is-opened");
    finalEnvelope.setAttribute("aria-expanded", "true");
    saveJourneyProgress();
    revealFinalLetter();
    return;
  }

  finalEnvelope.classList.add("is-opening");
  envelopeFlap.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName === "envelopeFlapOpen") {
        finalEnvelope.classList.add("is-opened");
        finalEnvelope.setAttribute("aria-expanded", "true");
        saveJourneyProgress();
        revealFinalLetter();
      }
    },
    { once: true },
  );
});

function revealFinalLetter() {
  currentLetterPage = 0;
  finalLetterClosing.classList.remove("is-visible");
  showLetterPage();
  finalEnvelope.classList.add("hidden");
  finalMessage.classList.remove("hidden");
  finalMessage.classList.remove("letter-returning");
  finalMessage.classList.add("letter-revealed");
  saveJourneyProgress();
}

function showLetterPage() {
  const sequence = ++letterPageSequence;
  const message = finalLetterPages[currentLetterPage];
  finalLetterMessage.textContent = message;
  finalLetterMessage.style.setProperty(
    "--letter-steps",
    Math.max(1, message.length),
  );
  finalLetterPageCount.textContent = `${currentLetterPage + 1} / ${finalLetterPages.length}`;
  nextLetterPageBtn.disabled =
    currentLetterPage === finalLetterPages.length - 1;
  nextLetterPageBtn.textContent = nextLetterPageBtn.disabled
    ? "The end ♡"
    : "Next page →";

  finalMessage.classList.remove("letter-revealed");
  finalLetterClosing.classList.remove("is-visible");
  finalLetterClosing.setAttribute("aria-hidden", "true");
  finalLetterMessage.style.animation = "none";
  requestAnimationFrame(() => {
    finalLetterMessage.style.removeProperty("animation");
    finalMessage.classList.add("letter-revealed");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealLetterClosing();
    } else if (currentLetterPage === finalLetterPages.length - 1) {
      setTimeout(() => {
        if (sequence === letterPageSequence) revealLetterClosing();
      }, 2300);
    }
  });
}

function revealLetterClosing() {
  if (currentLetterPage === finalLetterPages.length - 1) {
    finalLetterClosing.classList.add("is-visible");
    finalLetterClosing.setAttribute("aria-hidden", "false");
  }
}

nextLetterPageBtn.addEventListener("click", () => {
  if (currentLetterPage >= finalLetterPages.length - 1) return;
  playPaperRustle();
  currentLetterPage += 1;
  showLetterPage();
  saveJourneyProgress();
});

closeFinalLetterBtn.addEventListener("click", () => {
  playPaperRustle();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    putLetterAway();
    return;
  }

  finalMessage.classList.add("letter-returning");
});

finalMessage.addEventListener("animationend", (event) => {
  if (
    event.target === finalMessage &&
    event.animationName === "finalLetterReturn"
  ) {
    putLetterAway();
  }
});

function putLetterAway() {
  finalMessage.classList.add("hidden");
  finalMessage.classList.remove("letter-revealed", "letter-returning");
  finalEnvelope.classList.remove("hidden");
  finalEnvelope.setAttribute("aria-expanded", "false");
  saveJourneyProgress();
}

// ---- confetti + floating hearts (canvas) ----
const confettiCanvas = document.querySelector("#confettiCanvas");
const cctx = confettiCanvas.getContext("2d");
const replayConfettiBtn = document.querySelector("#replayConfettiBtn");
let finaleConfettiShown = false;

function resizeConfetti() {
  confettiCanvas.width = confettiCanvas.offsetWidth;
  confettiCanvas.height = confettiCanvas.offsetHeight;
}
resizeConfetti();
window.addEventListener("resize", resizeConfetti);

const colors = ["#e6a5b8", "#f4f1ea", "#a5c4e6", "#e6d5a5", "#c5a5e6"];

function makeConfettiPiece() {
  return {
    x: Math.random() * confettiCanvas.width,
    y: -20,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 3 + 2.5,
    speedX: (Math.random() - 0.5) * 1.5,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 6,
    isHeart: Math.random() < 0.25,
  };
}

let confettiPieces = [];
let confettiAnimationFrame = 0;
let confettiTimeout = 0;
let confettiStartedAt = null;
let confettiPopStartedAt = null;
let confettiPopPieces = [];
const confettiDuration = 4800;
const confettiFadeDuration = 800;

function launchConfetti() {
  if (confettiAnimationFrame) {
    cancelAnimationFrame(confettiAnimationFrame);
    confettiAnimationFrame = 0;
  }
  if (confettiTimeout) {
    clearTimeout(confettiTimeout);
    confettiTimeout = 0;
  }
  if (performanceMode) {
    confettiPieces = [];
    confettiPopPieces = [];
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    replayConfettiBtn.classList.add("hidden");
    return;
  }

  confettiPieces = Array.from({ length: 120 }, () => {
    const piece = makeConfettiPiece();
    piece.y = -Math.random() * confettiCanvas.height * 0.55;
    return piece;
  });
  confettiPopPieces = Array.from({ length: 36 }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.28 + 0.18,
    size: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI,
  }));
  confettiPopStartedAt = null;
  playConfettiBoom();
  replayConfettiBtn.classList.add("hidden");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    confettiPieces.forEach((piece) => {
      piece.y = Math.random() * confettiCanvas.height;
    });
    drawConfettiFrame(1, false);
    confettiTimeout = setTimeout(finishConfetti, 1800);
    return;
  }

  confettiStartedAt = null;
  confettiAnimationFrame = requestAnimationFrame(animateConfetti);
}

function drawHeart(x, y, size, color, rotation) {
  cctx.save();
  cctx.translate(x, y);
  cctx.rotate((rotation * Math.PI) / 180);
  cctx.fillStyle = color;
  cctx.beginPath();
  const s = size / 2;
  cctx.moveTo(0, s * 0.3);
  cctx.bezierCurveTo(-s, -s * 0.6, -s * 1.6, s * 0.5, 0, s * 1.4);
  cctx.bezierCurveTo(s * 1.6, s * 0.5, s, -s * 0.6, 0, s * 0.3);
  cctx.fill();
  cctx.restore();
}

function drawConfettiFrame(opacity, movePieces, timestamp) {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  cctx.globalAlpha = opacity;

  confettiPieces.forEach((p) => {
    if (movePieces) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
    }

    if (p.isHeart) {
      drawHeart(p.x, p.y, p.size * 1.5, p.color, p.rotation);
    } else {
      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate((p.rotation * Math.PI) / 180);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      cctx.restore();
    }
  });

  cctx.globalAlpha = 1;

  if (movePieces && timestamp !== undefined) {
    drawConfettiPop(timestamp);
  }
}

function drawConfettiPop(timestamp) {
  if (confettiPopStartedAt === null) confettiPopStartedAt = timestamp;
  const elapsed = timestamp - confettiPopStartedAt;
  const duration = 620;
  if (elapsed >= duration) {
    confettiPopPieces = [];
    return;
  }

  const progress = elapsed / duration;
  const opacity = 1 - progress;
  const centerX = confettiCanvas.width / 2;
  const centerY = confettiCanvas.height * 0.42;
  const radius =
    12 +
    progress * Math.min(confettiCanvas.width, confettiCanvas.height) * 0.42;

  cctx.save();
  cctx.globalAlpha = opacity * 0.72;
  cctx.strokeStyle = "#f2c34f";
  cctx.lineWidth = 2.5 * opacity;
  cctx.beginPath();
  cctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  cctx.stroke();

  confettiPopPieces.forEach((piece) => {
    const distance = elapsed * piece.speed;
    const x = centerX + Math.cos(piece.angle) * distance;
    const y = centerY + Math.sin(piece.angle) * distance;
    cctx.save();
    cctx.translate(x, y);
    cctx.rotate(piece.rotation + progress * 4);
    cctx.fillStyle = piece.color;
    cctx.fillRect(
      -piece.size / 2,
      -piece.size / 2,
      piece.size,
      piece.size * 1.8,
    );
    cctx.restore();
  });
  cctx.restore();
}

function animateConfetti(timestamp) {
  if (confettiStartedAt === null) confettiStartedAt = timestamp;
  const elapsed = timestamp - confettiStartedAt;

  if (elapsed >= confettiDuration) {
    finishConfetti();
    return;
  }

  const fadeStart = confettiDuration - confettiFadeDuration;
  const opacity =
    elapsed > fadeStart ? 1 - (elapsed - fadeStart) / confettiFadeDuration : 1;
  drawConfettiFrame(opacity, true, timestamp);
  confettiAnimationFrame = requestAnimationFrame(animateConfetti);
}

function finishConfetti() {
  confettiAnimationFrame = 0;
  confettiTimeout = 0;
  confettiStartedAt = null;
  confettiPopStartedAt = null;
  confettiPieces = [];
  confettiPopPieces = [];
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  replayConfettiBtn.classList.remove("hidden");
}

replayConfettiBtn.addEventListener("click", () => launchConfetti());

// ---- secret: konami code easter egg ----
const konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
let konamiProgress = 0;

const easterEgg = document.querySelector("#easterEgg");
const closeEggBtn = document.querySelector("#closeEggBtn");

document.addEventListener("keydown", (event) => {
  const expectedKey = konamiCode[konamiProgress];
  const pressedKey =
    event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (pressedKey === expectedKey) {
    konamiProgress++;
    if (konamiProgress === konamiCode.length) {
      easterEgg.classList.remove("hidden");
      konamiProgress = 0;
    }
  } else {
    // wrong key breaks the sequence, start over
    konamiProgress = pressedKey === konamiCode[0] ? 1 : 0;
  }
});

closeEggBtn.addEventListener("click", () => {
  easterEgg.classList.add("hidden");
});

// ---- parallax on the starfield ----
const viewport = document.querySelector("#viewport");

let parallaxX = 0;
let parallaxY = 0;
let targetX = 0;
let targetY = 0;

viewport.addEventListener("mousemove", (event) => {
  if (performanceMode) return;
  const rect = viewport.getBoundingClientRect();
  const x = event.clientX - rect.left; // mouse position inside viewport
  const y = event.clientY - rect.top;

  // convert to a -1 to 1 range based on distance from center
  const relX = (x / rect.width - 0.5) * 2;
  const relY = (y / rect.height - 0.5) * 2;

  const maxShift = 12; // how far the stars can drift, in pixels
  targetX = -relX * maxShift;
  targetY = -relY * maxShift;
});

viewport.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});

function animateParallax() {
  parallaxFrame = 0;
  if (performanceMode) {
    canvas.style.transform = "none";
    parallaxX = 0;
    parallaxY = 0;
    targetX = 0;
    targetY = 0;
    return;
  }

  // ease toward the target instead of snapping, for a smooth drift
  parallaxX += (targetX - parallaxX) * 0.05;
  parallaxY += (targetY - parallaxY) * 0.05;

  canvas.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;

  parallaxFrame = requestAnimationFrame(animateParallax);
}
let parallaxFrame = performanceMode
  ? 0
  : requestAnimationFrame(animateParallax);

// ---- cursor sparkle trail ----
const trailCanvas = document.querySelector("#cursorTrail");
const tctx = trailCanvas.getContext("2d");

function resizeTrailCanvas() {
  trailCanvas.width = window.innerWidth;
  trailCanvas.height = window.innerHeight;
}
resizeTrailCanvas();
window.addEventListener("resize", resizeTrailCanvas);

let sparkles = [];
let lastPointerPosition = null;

function spawnSparkle(x, y) {
  sparkles.push({
    x,
    y,
    size: Math.random() * 2 + 1,
    life: 1,
    drift: (Math.random() - 0.5) * 0.6,
    fadeSpeed: Math.random() * 0.015 + 0.01,
  });
}

document.addEventListener("mousemove", (event) => {
  if (performanceMode) return;
  if (!lastPointerPosition) {
    spawnSparkle(event.clientX, event.clientY);
  } else {
    const dx = event.clientX - lastPointerPosition.x;
    const dy = event.clientY - lastPointerPosition.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.min(8, Math.ceil(distance / 12));

    for (let step = 1; step <= steps; step++) {
      const progress = step / steps;
      spawnSparkle(
        lastPointerPosition.x + dx * progress,
        lastPointerPosition.y + dy * progress,
      );
    }
  }

  lastPointerPosition = { x: event.clientX, y: event.clientY };
});

function animateTrail() {
  trailFrame = 0;
  tctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
  if (performanceMode) return;

  sparkles.forEach((s) => {
    s.life -= s.fadeSpeed;
    s.y -= 0.3; // gentle upward drift, like dust
    s.x += s.drift;

    tctx.beginPath();
    tctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    tctx.fillStyle = `rgba(244, 241, 234, ${Math.max(0, s.life) * 0.3})`;
    tctx.fill();
  });

  // remove sparkles that have fully faded
  sparkles = sparkles.filter((s) => s.life > 0);

  trailFrame = requestAnimationFrame(animateTrail);
}
let trailFrame = performanceMode ? 0 : requestAnimationFrame(animateTrail);

// ---- scrapbook photo gallery ----
const scrapbook = document.querySelector("#scrapbook");
const photoOverlay = document.querySelector("#photoOverlay");
const overlayImg = document.querySelector("#overlayImg");

const photos = [
  {
    src: "images/photo1.jpg",
    caption: "<3 picture of uu",
    title: "I still remember this one",
    story: "I don't think you realize how much I like this picture. aaaaaaaa I like it a lot when you smile like I really wish there was more pictures of you smiling like this. :3",
    top: "5%",
    left: "5%",
    rotate: -4,
  },
  {
    src: "images/photo7.jpg",
    caption: "chicken nugget",
    title: "Awkward moment, but it's still precious",
    story: "first time doing photobooth just by the two of us. I WISH I COULD SHOW YA MORE CUZ I LOVE EM ALL DARLINNN.",
    top: "10%",
    left: "35%",
    rotate: 3,
  },
  {
    src: "images/photo3.jpg",
    caption: "this one's staying",
    title: "I couldn't leave this out",
    story: "I remembered I took this pic of u randomly cuz I love doing it hihi. IDK, BUT I LOVEE ITT LIKE REALLY. IT WAS INDIRECTLY PERFECT :>",
    top: "6%",
    left: "65%",
    rotate: -2,
  },
  {
    src: "images/photo4.jpg",
    caption: "piece of an ordinary day",
    title: ">w<",
    story: "LET'S DO MORE OF THESE IN THE FUTURE BABYY. though this one here wasn't the most perfect, but AAAAAAAA, YOU KNOW IT'S A PIECE TO KEEP :>",
    top: "37%",
    left: "15%",
    rotate: 5,
  },
  {
    src: "images/photo5.jpg",
    caption: "a walk",
    title: "One for the memories",
    story: "YK I STUMBLED ACROSS THIS IMAGE RANDOMLY AFTER SEARCHING FOR THE PHOTOS OF UU IN MY GALLERY FOR HOURS, AND THISS IS, THIS IS DIAMOND. I wish I could keep every little detail of days like these, but I'm glad I at least have this picture to come back to :3",
    top: "40%",
    left: "45%",
    rotate: -3,
  },
];

// ---- photo viewer: the clicked photo lifts off the board and settles on the
// left (3:4) with its title + description beside it (below on mobile) ----
const photoBackdrop = document.querySelector("#photoBackdrop");
const photoStory = document.querySelector("#photoStory");
const photoFrame = document.querySelector("#photoFrame");
const photoFrameNote = document.querySelector("#photoFrameNote");
const photoText = document.querySelector("#photoText");
const photoKicker = document.querySelector("#photoKicker");
const photoStoryTitle = document.querySelector("#photoStoryTitle");
const photoSquiggle = document.querySelector("#photoSquiggle");
const photoStoryText = document.querySelector("#photoStoryText");
const photoNav = document.querySelector("#photoNav");
const photoCount = document.querySelector("#photoCount");
const photoCloseBtn = document.querySelector("#photoCloseBtn");
const photoPrevBtn = document.querySelector("#photoPrevBtn");
const photoNextBtn = document.querySelector("#photoNextBtn");

const photoCards = [];
const photoViewer = {
  index: -1,
  open: false,
  closing: false,
  swapping: false,
  anims: [],
};
const PHOTO_REST = "rotate(-1.5deg)"; // how the photo sits once it has settled

const photoMotionOk = () =>
  !performanceMode &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function trackPhotoAnim(animation) {
  photoViewer.anims.push(animation);
  return animation;
}

function cancelPhotoAnims() {
  photoViewer.anims.forEach((animation) => animation.cancel());
  photoViewer.anims = [];
}

function fillPhoto(index) {
  const photo = photos[index];
  overlayImg.src = photo.src;
  overlayImg.alt = photo.caption;
  photoFrameNote.textContent = photo.caption;
  photoKicker.textContent = `memory ${String(index + 1).padStart(2, "0")}`;
  photoStoryTitle.textContent = photo.title;
  photoStoryText.textContent = photo.story;
  photoCount.textContent = `${index + 1} / ${photos.length}`;
}

// where the photo card sits on the board, expressed as a transform of the
// settled frame (so the frame can fly out of / back into the card)
function photoCardTransform(index) {
  const card = photoCards[index];
  const c = card.getBoundingClientRect();
  const f = photoFrame.getBoundingClientRect();
  const dx = c.left + c.width / 2 - (f.left + f.width / 2);
  const dy = c.top + c.height / 2 - (f.top + f.height / 2);
  const scale = card.offsetWidth / photoFrame.offsetWidth;
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${photos[index].rotate}deg) scale(${scale.toFixed(3)})`;
}

// the text slides in piece by piece, like notes being pinned on
function animatePhotoText(delay = 0) {
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  [photoKicker, photoStoryTitle, photoSquiggle, photoStoryText, photoNav].forEach(
    (el, i) => {
      trackPhotoAnim(
        el.animate(
          [
            {
              opacity: 0,
              transform: mobile ? "translateY(16px)" : "translateX(28px)",
            },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: 580,
            delay: delay + i * 90,
            easing: "cubic-bezier(0.2, 0.8, 0.25, 1)",
            fill: "backwards",
          },
        ),
      );
    },
  );
}

function openPhoto(index) {
  if (photoViewer.open || photoViewer.closing) return;
  photoViewer.index = index;
  photoViewer.open = true;
  fillPhoto(index);
  photoOverlay.classList.remove("hidden");
  photoOverlay.scrollTop = 0;

  if (photoMotionOk()) {
    cancelPhotoAnims();
    const from = photoCardTransform(index);
    trackPhotoAnim(
      photoFrame.animate(
        [
          {
            transform: from,
            opacity: 0.92,
            easing: "cubic-bezier(0.2, 0.85, 0.25, 1)",
          },
          {
            transform: "translate(0, 0) rotate(-3deg) scale(1.035)",
            opacity: 1,
            offset: 0.62,
            easing: "cubic-bezier(0.3, 0, 0.2, 1)",
          },
          { transform: PHOTO_REST, opacity: 1 },
        ],
        { duration: 780 },
      ),
    );
    trackPhotoAnim(
      photoBackdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 420,
        easing: "ease-out",
      }),
    );
    trackPhotoAnim(
      photoCloseBtn.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
        delay: 350,
        fill: "backwards",
      }),
    );
    animatePhotoText(300);
  }

  photoCards[index].style.visibility = "hidden";
  photoCloseBtn.focus({ preventScroll: true });
}

function closePhoto() {
  if (!photoViewer.open || photoViewer.closing) return;
  const index = photoViewer.index;
  const card = photoCards[index];
  photoViewer.closing = true;
  cancelPhotoAnims();

  const finish = () => {
    cancelPhotoAnims();
    photoOverlay.classList.add("hidden");
    card.style.visibility = "";
    photoViewer.open = false;
    photoViewer.closing = false;
    card.focus({ preventScroll: true });
  };

  if (!photoMotionOk()) {
    finish();
    return;
  }

  const to = photoCardTransform(index);
  const flight = trackPhotoAnim(
    photoFrame.animate(
      [
        { transform: PHOTO_REST, opacity: 1 },
        { transform: to, opacity: 0.95 },
      ],
      {
        duration: 480,
        easing: "cubic-bezier(0.5, 0, 0.2, 1)",
        fill: "forwards",
      },
    ),
  );
  [photoText, photoCloseBtn].forEach((el) =>
    trackPhotoAnim(
      el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 220,
        easing: "ease-in",
        fill: "forwards",
      }),
    ),
  );
  trackPhotoAnim(
    photoBackdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 440,
      easing: "ease-in",
      fill: "forwards",
    }),
  );
  flight.onfinish = finish;
}

// previous / next: the current photo slips away, the next one slides in
async function stepPhoto(direction) {
  if (!photoViewer.open || photoViewer.closing || photoViewer.swapping) return;
  const oldIndex = photoViewer.index;
  const newIndex = (oldIndex + direction + photos.length) % photos.length;
  photoViewer.swapping = true;

  const swapContent = () => {
    photoCards[oldIndex].style.visibility = "";
    photoCards[newIndex].style.visibility = "hidden";
    photoViewer.index = newIndex;
    fillPhoto(newIndex);
  };

  if (!photoMotionOk()) {
    swapContent();
    photoViewer.swapping = false;
    return;
  }

  const leaving = trackPhotoAnim(
    photoFrame.animate(
      [
        { transform: PHOTO_REST, opacity: 1 },
        {
          transform: `translateX(${-direction * 70}px) rotate(${-direction * 8}deg)`,
          opacity: 0,
        },
      ],
      { duration: 260, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "forwards" },
    ),
  );
  trackPhotoAnim(
    photoText.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 200,
      fill: "forwards",
    }),
  );
  await leaving.finished.catch(() => {});

  swapContent();
  await Promise.race([
    overlayImg.decode().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 350)),
  ]);
  cancelPhotoAnims();

  trackPhotoAnim(
    photoFrame.animate(
      [
        {
          transform: `translateX(${direction * 70}px) rotate(${direction * 7}deg)`,
          opacity: 0,
          easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
        },
        {
          transform: `translateX(${direction * -6}px) rotate(${-1.5 - direction * 1.5}deg)`,
          opacity: 1,
          offset: 0.7,
          easing: "ease-out",
        },
        { transform: PHOTO_REST, opacity: 1 },
      ],
      { duration: 640 },
    ),
  );
  animatePhotoText(120);
  photoViewer.swapping = false;
}

photos.forEach((photo, index) => {
  const card = document.createElement("div");
  card.classList.add("polaroid");
  card.style.top = photo.top;
  card.style.left = photo.left;
  card.style.transform = `rotate(${photo.rotate}deg)`;
  card.style.setProperty("--frame-delay", `${index * -0.8}s`);
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open photo: ${photo.title}`);

  const img = document.createElement("img");
  img.src = photo.src;
  img.alt = photo.caption;

  const caption = document.createElement("p");
  caption.classList.add("caption");
  caption.textContent = photo.caption;

  card.appendChild(img);
  card.appendChild(caption);
  scrapbook.appendChild(card);
  photoCards.push(card);

  card.addEventListener("click", () => openPhoto(index));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPhoto(index);
    }
  });
});

photoCloseBtn.addEventListener("click", closePhoto);
photoPrevBtn.addEventListener("click", () => stepPhoto(-1));
photoNextBtn.addEventListener("click", () => stepPhoto(1));
// clicking the empty space around the photo closes it, like before
photoOverlay.addEventListener("click", (event) => {
  if (!event.target.closest(".photo-frame, .photo-text, .photo-close")) {
    closePhoto();
  }
});
document.addEventListener("keydown", (event) => {
  if (!photoViewer.open) return;
  if (event.key === "Escape") closePhoto();
  else if (event.key === "ArrowLeft") stepPhoto(-1);
  else if (event.key === "ArrowRight") stepPhoto(1);
});

// ---- go from the scrapbook to the finale ----
const toSongBtn = document.querySelector("#toSongBtn");

toSongBtn.addEventListener("click", () => {
  goToPage(page4, page5, () => {
    resizePulseCanvas();
    updateCredits();
  });
});

// ---- song player ----
const audio = document.querySelector("#audio");
const backgroundMusic = document.querySelector("#backgroundMusic");
const backgroundMusicToggle = document.querySelector("#backgroundMusicToggle");
const player = document.querySelector("#player");
const playBtn = document.querySelector("#playBtn");
const progressBar = document.querySelector("#progressBar");
const progressFill = document.querySelector("#progressFill");
const timeDisplay = document.querySelector("#timeDisplay");
const audioStatus = document.querySelector("#audioStatus");
const backgroundMusicVolume = 0.13;
const backgroundMusicFadeDuration = 1100;
let backgroundMusicMuted = false;
let backgroundMusicFadeFrame = 0;
let backgroundMusicFadeResolve = null;
let backgroundMusicStarting = false;
let backgroundMusicUnavailable = false;

try {
  backgroundMusicMuted =
    localStorage.getItem("birthdayBackgroundMusicMuted") === "true";
} catch (error) {
  console.warn("Could not load the background-music preference.", error);
}

backgroundMusic.volume = 0;

function fadeBackgroundMusicTo(
  targetVolume,
  duration = backgroundMusicFadeDuration,
) {
  if (backgroundMusicFadeFrame) {
    cancelAnimationFrame(backgroundMusicFadeFrame);
    backgroundMusicFadeResolve?.();
  }
  backgroundMusicFadeFrame = 0;
  const startVolume = backgroundMusic.volume;
  const startTime = performance.now();

  return new Promise((resolve) => {
    backgroundMusicFadeResolve = resolve;

    function step(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const easedProgress = progress * progress * (3 - 2 * progress);
      backgroundMusic.volume =
        startVolume + (targetVolume - startVolume) * easedProgress;
      if (progress < 1) {
        backgroundMusicFadeFrame = requestAnimationFrame(step);
      } else {
        backgroundMusicFadeFrame = 0;
        backgroundMusicFadeResolve = null;
        resolve();
      }
    }

    backgroundMusicFadeFrame = requestAnimationFrame(step);
  });
}

function updateBackgroundMusicToggle() {
  const label = backgroundMusicUnavailable
    ? "Background music unavailable"
    : backgroundMusicMuted
      ? "Unmute background music"
      : backgroundMusicStarting
        ? "Background music starting"
        : backgroundMusicNeedsGesture
          ? "Start background music"
          : "Mute background music";
  backgroundMusicToggle.setAttribute(
    "aria-pressed",
    String(backgroundMusicMuted),
  );
  backgroundMusicToggle.setAttribute("aria-label", label);
  backgroundMusicToggle.title = label;
  backgroundMusicToggle.dataset.muted = String(backgroundMusicMuted);
}

let backgroundMusicNeedsGesture = false;

async function startBackgroundMusic() {
  if (
    backgroundMusicMuted ||
    backgroundMusicStarting ||
    !backgroundMusic.paused
  )
    return;
  backgroundMusicStarting = true;
  updateBackgroundMusicToggle();
  try {
    await backgroundMusic.play();
    backgroundMusicNeedsGesture = false;
    backgroundMusicUnavailable = false;
    updateBackgroundMusicToggle();
    if (!backgroundMusicMuted)
      fadeBackgroundMusicTo(backgroundMusicVolume, 1800);
  } catch (error) {
    if (error.name === "NotAllowedError") {
      backgroundMusicNeedsGesture = true;
    } else if (error.name !== "AbortError") {
      backgroundMusicUnavailable = true;
      console.error("Could not play background music.", error);
    }
    updateBackgroundMusicToggle();
  } finally {
    backgroundMusicStarting = false;
    updateBackgroundMusicToggle();
  }
}

function resumeBackgroundMusic() {
  if (backgroundMusicMuted) return;
  if (backgroundMusic.paused) {
    startBackgroundMusic();
  } else {
    fadeBackgroundMusicTo(backgroundMusicVolume);
  }
}

backgroundMusicToggle.addEventListener("click", () => {
  if (backgroundMusicMuted) {
    backgroundMusicMuted = false;
    updateBackgroundMusicToggle();
    try {
      localStorage.setItem("birthdayBackgroundMusicMuted", "false");
    } catch (error) {
      console.warn("Could not save the background-music preference.", error);
    }
    startBackgroundMusic();
    return;
  }

  if (backgroundMusic.paused && !backgroundMusicStarting) {
    startBackgroundMusic();
    return;
  }

  backgroundMusicMuted = true;
  fadeBackgroundMusicTo(0, 450);
  updateBackgroundMusicToggle();
  try {
    localStorage.setItem("birthdayBackgroundMusicMuted", "true");
  } catch (error) {
    console.warn("Could not save the background-music preference.", error);
  }
});

updateBackgroundMusicToggle();

function syncPlayerPlaybackState() {
  const isPlaying = !audio.paused && !audio.ended;
  player.classList.toggle("is-playing", isPlaying);
  playBtn.textContent = isPlaying ? "⏸" : "▶";
  playBtn.setAttribute("aria-label", isPlaying ? "Pause song" : "Play song");
}

playBtn.addEventListener("click", async () => {
  if (audio.paused) {
    await fadeBackgroundMusicTo(0, backgroundMusicFadeDuration);
    try {
      await audio.play();
      audioStatus.textContent = "";
    } catch (error) {
      console.error("Could not play the music-page track.", error);
      audioStatus.textContent =
        "The song could not be played. Please try again.";
      resumeBackgroundMusic();
    }
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", syncPlayerPlaybackState);
audio.addEventListener("pause", () => {
  syncPlayerPlaybackState();
  resumeBackgroundMusic();
});

audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = percent + "%";

  const mins = Math.floor(audio.currentTime / 60);
  const secs = Math.floor(audio.currentTime % 60)
    .toString()
    .padStart(2, "0");
  timeDisplay.textContent = `${mins}:${secs}`;
});

progressBar.addEventListener("click", (event) => {
  const rect = progressBar.getBoundingClientRect();
  const clickPercent = (event.clientX - rect.left) / rect.width;
  audio.currentTime = clickPercent * audio.duration;
});

audio.addEventListener("ended", () => {
  syncPlayerPlaybackState();
  resumeBackgroundMusic();
});

// ---- end-credits roll on the music page (synced to the song) ----
// The song is ~3:11. The roll starts with playback and finishes well before
// the song ends.
const creditsStartTime = 0;
const creditsDuration = 195; // seconds the whole roll lasts (2:15)

// EDIT THIS: change the texts however you like. Each block is either
//   { heading: "..." }                      -> a big handwritten title
//   { text: ["line", "line"] }              -> a small paragraph
//   { label: "hobbies", value: "..." }      -> a label + its answer
// "value" can also be an array of lines. Add/remove blocks freely, the
// scroll speed adjusts itself so the roll always lasts creditsDuration.
const creditsContent = [
  { heading: "a few things about you" },
  {
    text: [
      "something interesting about you that I know:",
      "sorry if some of these are wrong, but I tried my best to remember them correctly :>",
      "this is all about you",
    ],
  },
  {
    label: "hobbies",
    value: [
      "photography",
      "drawing",
      "painting",
      "editing",
      "graphic designing",
      "cooking",
      "baking",
      "videography",
      "video games"
    ],
  },
  { label: "favorite songs", value: ["The Cure - Olivia Rodrigo"] },
  { label: "favorite colors", value: ["yellow", "blue", "cream"] },
  { label: "favorite flower", value: "sunflower" },
  { label: "favorite food", value: ["fried chicken", "mom's cook"] },
  { label: "favorite pastry", value: "hotdog or sausage bread" },
  { label: "favorite drinks", value: ["juice", "plain milk"] },
  {
    label: "favorite animals",
    value: ["dog", "cat", "chicken", "catfish", "fish", "bombom", "boba"],
  },
  { label: "favorite season", value: "autumn" },
  { label: "favorite movie / show", value: "bla bla" },
  { label: "favorite place", value: ["Gramedia", "anywhere with amazing views"] },
  { label: "favorite scent", value: ["vanilla", "chocolate"] },
  { label: "something that always makes you happy", value: "when you achieve something in life, you're always seem so happy hihi" },
  { label: "your comfort activity", value: "maybe when you take pictures" },
  { label: "something I secretly love about you", value: "our awkward silence in calls or direct meeting :p" },
  { text: ["and a hundred little things", "I'm still learning"] },
  { heading: "happy birthday, Elena" },
  { text: "prayers for you, at every moment" },
  { text: ["stay healthy", "stay happy", "love yourself even more"] },
  { text: "may good luck be with you everytime." },
  { heading: "<3" },
];

const creditsEl = document.querySelector("#credits");
const creditsTrack = document.querySelector("#creditsTrack");

// Accepts a string or an array of strings for "text" and "value", and skips
// any entry it can't read, so one typo here can never break the whole page.
function creditsLines(input) {
  return [].concat(input ?? []).map((line) => String(line));
}

function buildCredits() {
  creditsContent.forEach((item) => {
    try {
      if (!item || typeof item !== "object") return;

      const block = document.createElement("div");
      block.className = "credits-block";

      if (item.heading) {
        block.classList.add("credits-block-heading");
        const heading = document.createElement("p");
        heading.className = "credits-heading";
        heading.textContent = String(item.heading);
        block.append(heading);
      } else if (item.label) {
        const label = document.createElement("p");
        label.className = "credits-label";
        label.textContent = String(item.label);
        block.append(label);
        creditsLines(item.value).forEach((line) => {
          const value = document.createElement("p");
          value.className = "credits-value";
          value.textContent = line;
          block.append(value);
        });
      } else if (item.text) {
        creditsLines(item.text).forEach((line) => {
          const value = document.createElement("p");
          value.className = "credits-value credits-text";
          value.textContent = line;
          block.append(value);
        });
      } else {
        return;
      }

      creditsTrack.append(block);
    } catch (error) {
      console.warn(
        "Skipped a credits entry that could not be read.",
        item,
        error,
      );
    }
  });
}
try {
  buildCredits();
} catch (error) {
  console.warn("Could not build the credits.", error);
}

// The roll lasts creditsDuration seconds, but never longer than the song
// itself (minus a small buffer) so it always reaches the end before the music.
function creditsRollDuration() {
  const songLength = audio.duration;
  if (Number.isFinite(songLength) && songLength > 0) {
    return Math.max(10, Math.min(creditsDuration, songLength - 4));
  }
  return creditsDuration;
}

// Constant speed for most of the roll, then a gentle slow-down over the last
// 8% so the final heading glides to a rest instead of stopping abruptly.
// (The cruising speed is nudged up slightly so the total time stays the same.)
function easeCreditsProgress(p) {
  const easeStart = 0.92;
  const speed = 2 / (1 + easeStart);
  if (p <= easeStart) return speed * p;
  const t = p - easeStart;
  const span = 1 - easeStart;
  return speed * (easeStart + t - (t * t) / (2 * span));
}

// Position is derived from the song's current time, so pausing, seeking
// and replaying all keep the credits perfectly in sync.
function updateCredits() {
  const viewHeight = creditsEl.clientHeight;
  if (!viewHeight) return; // music page is hidden
  const time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const rawProgress = Math.min(
    1,
    Math.max(0, (time - creditsStartTime) / creditsRollDuration()),
  );
  const progress = easeCreditsProgress(rawProgress);

  // Start just below the panel; finish with the centre of the very last
  // heading ("<3") sitting exactly in the vertical middle of the panel.
  const lastBlock = creditsTrack.lastElementChild;
  const startY = viewHeight;
  const endY = lastBlock
    ? viewHeight / 2 - (lastBlock.offsetTop + lastBlock.offsetHeight / 2)
    : -creditsTrack.offsetHeight;
  const y = startY + (endY - startY) * progress;
  creditsTrack.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
}

let creditsFrame = 0;
function creditsLoop() {
  creditsFrame = 0;
  updateCredits();
  if (!audio.paused && !audio.ended) {
    creditsFrame = requestAnimationFrame(creditsLoop);
  }
}

audio.addEventListener("play", () => {
  creditsEl.classList.add("is-active");
  if (!creditsFrame) creditsFrame = requestAnimationFrame(creditsLoop);
});
["pause", "seeked", "ended", "loadedmetadata", "timeupdate"].forEach((name) =>
  audio.addEventListener(name, updateCredits),
);
window.addEventListener("resize", updateCredits);

// ---- pulsing visual synced to playback ----
const pulseCanvas = document.querySelector("#pulseCanvas");
const pctx = pulseCanvas.getContext("2d");

function resizePulseCanvas() {
  pulseCanvas.width = pulseCanvas.offsetWidth;
  pulseCanvas.height = pulseCanvas.offsetHeight;
}
resizePulseCanvas();
window.addEventListener("resize", resizePulseCanvas);

let pulsePhase = 0;
let pulseFrame = 0;

function animatePulse() {
  pulseFrame = 0;
  if (performanceMode) {
    pctx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);
    return;
  }
  if (!pulseCanvas.width || !pulseCanvas.height) {
    pulseFrame = requestAnimationFrame(animatePulse);
    return;
  }

  pctx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);

  if (!audio.paused) {
    pulsePhase += 0.05;
  } else {
    pulsePhase += 0.015;
  }

  const centerY = pulseCanvas.height / 2;
  const barCount = 24;
  const barWidth = pulseCanvas.width / barCount;

  for (let i = 0; i < barCount; i++) {
    // fake waveform: sine wave with per-bar phase offset, driven by pulsePhase
    const motion = Math.sin(pulsePhase + i * 0.5);
    const height = audio.paused
      ? (motion * 0.5 + 0.5) * 24 + 8
      : (motion * 0.5 + 0.5) * 38 + 8;

    const gradient = pctx.createLinearGradient(
      0,
      centerY - height / 2,
      0,
      centerY + height / 2,
    );
    gradient.addColorStop(0, "#b9bbe7");
    gradient.addColorStop(1, "#e6a5b8");
    pctx.fillStyle = gradient;
    pctx.beginPath();
    pctx.roundRect(
      i * barWidth + 2,
      centerY - height / 2,
      Math.max(1, barWidth - 4),
      height,
      Math.max(0, (barWidth - 4) / 2),
    );
    pctx.fill();
  }

  pulseFrame = requestAnimationFrame(animatePulse);
}
if (!performanceMode) pulseFrame = requestAnimationFrame(animatePulse);

// ---- go from page5 to finale ----
const toFinaleBtn2 = document.querySelector("#toFinaleBtn2");

toFinaleBtn2.addEventListener("click", () => {
  goToPage(page5, pageCake);
});

// ---- birthday cake: blow out candles ----
const birthdayWish = "may all your wishes today come true babyy :>";
const cakeHintLit = "hold the button to blow out the candles";
const cakeHint = document.querySelector("#cakeHint");
const cakeEl = document.querySelector("#cake");
const wishNote = document.querySelector("#wishNote");
const wishNoteMessage = document.querySelector("#wishNoteMessage");
const candles = [...document.querySelectorAll(".candle")];
const blowOutCandlesBtn = document.querySelector("#blowOutCandlesBtn");
const relightCandlesBtn = document.querySelector("#relightCandlesBtn");
const toFinaleBtn3 = document.querySelector("#toFinaleBtn3");
const reliveBtn = document.querySelector("#reliveBtn");

// ---- hold-to-blow: press and hold the button until the ring fills ----
const BLOW_HOLD_MS = 1500; // how long the button must be held
const BLOW_DRAIN_MS = 650; // how fast the ring drains if released early
const BLOW_STAGGER_MS = 150; // gap between each candle going out
const blowRing = document.querySelector("#blowRing");
const blowRingPaths = blowRing.querySelectorAll("path");
const blowRingFill = blowRing.querySelector(".blow-ring-fill");

const windLayer = document.createElement("div");
windLayer.className = "wind-layer";
windLayer.setAttribute("aria-hidden", "true");
cakeEl.appendChild(windLayer);

const blowState = {
  holding: false,
  done: false,
  progress: 0,
  raf: 0,
  last: 0,
  pointerId: null,
  nextPuffAt: 0,
  nextSoundAt: 0,
  hintKey: "",
};
let blowTimers = [];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Draws the ring path around the button's outline (pill shape), starting
// at the top-centre and running clockwise.
function layoutBlowRing() {
  const w = blowOutCandlesBtn.offsetWidth;
  const h = blowOutCandlesBtn.offsetHeight;
  if (!w || !h) return;
  const gap = 7;
  const x = -gap;
  const y = -gap;
  const W = w + gap * 2;
  const H = h + gap * 2;
  const cornerRadius =
    parseFloat(getComputedStyle(blowOutCandlesBtn).borderTopLeftRadius) ||
    h / 2;
  const r = Math.min(cornerRadius + gap, H / 2, W / 2);
  const d = [
    `M ${x + W / 2} ${y}`,
    `H ${x + W - r}`,
    `A ${r} ${r} 0 0 1 ${x + W} ${y + r}`,
    `V ${y + H - r}`,
    `A ${r} ${r} 0 0 1 ${x + W - r} ${y + H}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + H - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    `H ${x + W / 2}`,
  ].join(" ");
  blowRingPaths.forEach((path) => path.setAttribute("d", d));
}
if (typeof ResizeObserver === "function") {
  new ResizeObserver(layoutBlowRing).observe(blowOutCandlesBtn);
}
window.addEventListener("resize", layoutBlowRing);
document.fonts?.ready.then(layoutBlowRing);

function setBlowRing(progress) {
  blowRingFill.style.strokeDashoffset = String(100 - progress * 100);
  blowRingFill.style.opacity = progress > 0.002 ? "1" : "0";
}

function setBlowHint(key, text) {
  if (blowState.hintKey === key) return;
  blowState.hintKey = key;
  cakeHint.textContent = text;
}

function spawnWindPuff(strength) {
  if (windLayer.childElementCount > 16) return;
  const puff = document.createElement("span");
  puff.className = "wind-puff";
  const length = 28 + Math.random() * 44;
  const top = 48 + Math.random() * 90;
  const drift = (Math.random() - 0.35) * 26;
  const travel = cakeEl.offsetWidth + length * 2 + 30;
  puff.style.top = `${top}px`;
  puff.style.left = `${-length - 10}px`;
  puff.style.width = `${length}px`;
  puff.style.height = `${2 + Math.random() * 2.5}px`;
  windLayer.appendChild(puff);
  const peak = 0.25 + strength * 0.5;
  const animation = puff.animate(
    [
      { transform: "translate3d(0, 0, 0) scaleX(0.45)", opacity: 0 },
      {
        transform: `translate3d(${travel * 0.35}px, ${drift * 0.4}px, 0) scaleX(1)`,
        opacity: peak,
        offset: 0.3,
      },
      {
        transform: `translate3d(${travel}px, ${drift}px, 0) scaleX(1.6)`,
        opacity: 0,
      },
    ],
    {
      duration: 560 + Math.random() * 360,
      easing: "cubic-bezier(0.25, 0.6, 0.4, 1)",
    },
  );
  animation.onfinish = () => puff.remove();
}

// soft, growing whoosh while the button is held
function playBlowBreath(strength) {
  try {
    if (typeof audioCtx === "undefined" || audioCtx.state !== "running") return;
    playNoiseSweep({
      duration: 0.5,
      startFrequency: 520 + strength * 520,
      endFrequency: 360 + strength * 260,
      peak: 0.02 + strength * 0.05,
      filterType: "lowpass",
    });
  } catch (error) {
    /* sound is optional */
  }
}

// Called every frame while holding / draining. Everything visual is driven
// from one number (progress 0 → 1) so it all stays in sync and smooth.
function renderBlow(now) {
  const p = blowState.progress;
  const reduced = prefersReducedMotion();
  const calm = reduced || performanceMode;
  // the wind builds quickly, then holds steady
  const wind = 1 - Math.pow(1 - p, 2.2);

  pageCake.style.setProperty("--blow", p.toFixed(3));
  setBlowRing(p);

  candles.forEach((candle, i) => {
    const wobble = calm
      ? 0
      : Math.sin(now / 62 + i * 1.9) * 0.6 + Math.sin(now / 37 + i * 3.1) * 0.4;
    const lean = wind * 36 + wobble * wind * 9;
    const scale = 1 - p * 0.34 + (calm ? 0 : wobble * 0.05 * wind);
    candle.style.setProperty("--lean", `${lean.toFixed(2)}deg`);
    candle.style.setProperty("--flame-scale", scale.toFixed(3));
    candle.style.setProperty("--flame-bright", (1 - p * 0.28).toFixed(3));
  });

  if (!calm) {
    const shudder = Math.sin(now / 55) * 0.5 + Math.sin(now / 83) * 0.5;
    cakeEl.style.setProperty(
      "--cake-tilt",
      `${(wind * 0.9 + shudder * wind * 0.35).toFixed(3)}deg`,
    );
    cakeEl.style.setProperty(
      "--cake-push",
      `${(shudder * wind * 1.2).toFixed(2)}px`,
    );
    cakeEl.style.setProperty("--cake-grow", (1 + wind * 0.022).toFixed(4));

    if (blowState.holding) {
      if (now >= blowState.nextPuffAt) {
        spawnWindPuff(wind);
        blowState.nextPuffAt = now + 230 - wind * 150 + Math.random() * 40;
      }
    }
  }

  if (blowState.holding) {
    if (now >= blowState.nextSoundAt) {
      playBlowBreath(wind);
      blowState.nextSoundAt = now + 380;
    }
    if (p < 0.34) setBlowHint("a", "huff…");
    else if (p < 0.67) setBlowHint("b", "keep going…");
    else setBlowHint("c", "almost there…");
  }
}

function clearBlowVisuals() {
  pageCake.style.removeProperty("--blow");
  ["--cake-tilt", "--cake-push", "--cake-grow"].forEach((name) =>
    cakeEl.style.removeProperty(name),
  );
  candles.forEach((candle) => {
    ["--lean", "--flame-scale", "--flame-bright"].forEach((name) =>
      candle.style.removeProperty(name),
    );
  });
  windLayer.replaceChildren();
  setBlowRing(0);
}

function blowFrame(now) {
  blowState.raf = 0;
  const dt = Math.min(64, now - blowState.last || 16);
  blowState.last = now;

  const step = blowState.holding ? dt / BLOW_HOLD_MS : -dt / BLOW_DRAIN_MS;
  blowState.progress = Math.min(1, Math.max(0, blowState.progress + step));
  renderBlow(now);

  if (blowState.progress >= 1) {
    completeBlow();
  } else if (blowState.holding || blowState.progress > 0) {
    blowState.raf = requestAnimationFrame(blowFrame);
  } else {
    // fully drained after an early release: settle everything back
    cakeEl.classList.remove("is-blowing");
    clearBlowVisuals();
    setBlowHint("idle", cakeHintLit);
  }
}

function startBlowHold() {
  if (blowState.done || blowState.holding || blowOutCandlesBtn.disabled) return;
  blowState.holding = true;
  blowState.nextPuffAt = 0;
  blowState.nextSoundAt = 0;
  blowOutCandlesBtn.classList.add("is-holding");
  cakeEl.classList.remove("blow-settle");
  cakeEl.classList.add("is-blowing");
  blowState.last = performance.now();
  if (!blowState.raf) blowState.raf = requestAnimationFrame(blowFrame);
}

function stopBlowHold() {
  if (!blowState.holding) return;
  blowState.holding = false;
  blowOutCandlesBtn.classList.remove("is-holding");
  if (blowState.progress > 0.2) {
    setBlowHint("again", "almost! hold a little longer ♡");
  }
}

function completeBlow() {
  blowState.holding = false;
  blowState.done = true;
  blowOutCandlesBtn.classList.remove("is-holding");
  blowOutCandlesBtn.classList.add("is-complete");
  blowOutCandlesBtn.disabled = true;
  setBlowRing(1);
  playCandleWind();

  const reduced = prefersReducedMotion();
  // ease the held-lean back out while the bounce plays
  cakeEl.classList.add("blow-settle");
  cakeEl.classList.remove("is-blowing");
  ["--cake-tilt", "--cake-push", "--cake-grow"].forEach((name) =>
    cakeEl.style.removeProperty(name),
  );
  blowTimers.push(
    setTimeout(() => cakeEl.classList.remove("blow-settle"), 700),
  );
  if (!reduced) {
    pageCake.classList.add("cake-camera-shake");
    cakeEl.classList.add("blowout-bounce");
  }

  // candles go out one after another, like a real gust sweeping across
  candles.forEach((candle, i) => {
    blowTimers.push(
      setTimeout(
        () => {
          if (candle.dataset.lit === "true") {
            candle.dataset.lit = "false";
            spawnSmoke(candle);
          }
        },
        reduced ? 0 : i * BLOW_STAGGER_MS,
      ),
    );
  });
  blowTimers.push(
    setTimeout(
      checkAllCandlesOut,
      reduced ? 10 : (candles.length - 1) * BLOW_STAGGER_MS + 220,
    ),
  );
}

function resetBlowHold() {
  cancelAnimationFrame(blowState.raf);
  blowTimers.forEach(clearTimeout);
  blowTimers = [];
  Object.assign(blowState, {
    holding: false,
    done: false,
    progress: 0,
    raf: 0,
    pointerId: null,
    hintKey: "",
  });
  blowOutCandlesBtn.classList.remove("is-holding", "is-complete");
  cakeEl.classList.remove("is-blowing", "blow-settle");
  clearBlowVisuals();
}

blowOutCandlesBtn.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  blowState.pointerId = event.pointerId;
  try {
    blowOutCandlesBtn.setPointerCapture(event.pointerId);
  } catch (error) {
    /* capture is a nicety, not a requirement */
  }
  startBlowHold();
});

["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
  blowOutCandlesBtn.addEventListener(type, (event) => {
    if (blowState.pointerId !== null && event.pointerId !== blowState.pointerId)
      return;
    blowState.pointerId = null;
    stopBlowHold();
  });
});

// keyboard: hold Space or Enter
blowOutCandlesBtn.addEventListener("keydown", (event) => {
  if (event.key !== " " && event.key !== "Enter") return;
  event.preventDefault();
  if (!event.repeat) startBlowHold();
});
blowOutCandlesBtn.addEventListener("keyup", (event) => {
  if (event.key !== " " && event.key !== "Enter") return;
  event.preventDefault();
  stopBlowHold();
});
blowOutCandlesBtn.addEventListener("blur", () => {
  if (blowState.pointerId === null) stopBlowHold();
});
blowOutCandlesBtn.addEventListener("click", (event) => event.preventDefault());
blowOutCandlesBtn.addEventListener("contextmenu", (event) =>
  event.preventDefault(),
);
window.addEventListener("blur", stopBlowHold);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopBlowHold();
});

pageCake.addEventListener("animationend", (event) => {
  if (event.target === pageCake && event.animationName === "cakeCameraShake") {
    pageCake.classList.remove("cake-camera-shake");
  }
});

cakeEl.addEventListener("animationend", (event) => {
  if (event.target === cakeEl && event.animationName === "cakeBlowoutBounce") {
    cakeEl.classList.remove("blowout-bounce");
  }
});

relightCandlesBtn.addEventListener("click", () => {
  resetBlowHold();
  pageCake.classList.remove("cake-camera-shake");
  cakeEl.classList.remove("blowout-bounce");
  candles.forEach((candle, i) => {
    candle.dataset.lit = "true";
    candle.classList.add("is-igniting");
    setTimeout(() => candle.classList.remove("is-igniting"), 900 + i * 120);
  });
  cakeEl.classList.add("candles-lit");
  cakeHint.textContent = cakeHintLit;
  wishNote.classList.add("hidden");
  wishNoteMessage.textContent = "";
  relightCandlesBtn.classList.add("hidden");
  toFinaleBtn3.classList.add("hidden");
  blowOutCandlesBtn.disabled = false;
  blowOutCandlesBtn.classList.remove("hidden");
  saveJourneyProgress();
});

function spawnSmoke(candle) {
  const smoke = document.createElement("div");
  smoke.classList.add("smoke");
  for (let i = 0; i < 4; i++) {
    const ember = document.createElement("span");
    ember.classList.add("ember");
    ember.style.setProperty("--ember-drift", `${(i - 1.5) * 5}px`);
    ember.style.setProperty("--ember-delay", `${i * 90}ms`);
    smoke.appendChild(ember);
  }
  candle.appendChild(smoke);
  setTimeout(() => smoke.remove(), 1500);
}

function checkAllCandlesOut() {
  const allOut = candles.every((c) => c.dataset.lit === "false");
  if (allOut) {
    cakeEl.classList.remove("candles-lit");
    cakeHint.textContent = "your wish is in the air ♡";
    wishNoteMessage.textContent = birthdayWish;
    wishNote.classList.remove("hidden");
    blowOutCandlesBtn.classList.add("hidden");
    relightCandlesBtn.classList.remove("hidden");
    toFinaleBtn3.classList.remove("hidden");
  }
  saveJourneyProgress();
}

toFinaleBtn3.addEventListener("click", () => {
  goToPage(pageCake, page6, () => {
    playChime();
    resizeConfetti();
    if (!finaleConfettiShown) {
      finaleConfettiShown = true;
      launchConfetti();
    } else {
      replayConfettiBtn.classList.toggle("hidden", performanceMode);
    }
  });
});

function resetJourneyState(resetHearts = false) {
  window.resetBookCutscene?.();
  if (resetHearts) resetHeartCollection();
  pageHistory.splice(0, pageHistory.length, page1);
  page6.classList.remove("finale-started");
  linesContainer.replaceChildren();
  nextBtn.classList.add("hidden");

  discovered.clear();
  constellationCompletionTimers.forEach(clearTimeout);
  constellationCompletionTimers = [];
  constellationCompleted = false;
  constellationCompletionRevealed = false;
  constellationCompletion.classList.add("hidden");
  linesSvg.classList.remove(
    "constellation-completing",
    "constellation-complete",
  );
  starEls.forEach((star) => {
    star.classList.remove("lit");
    star.setAttribute("aria-label", `Reveal memory: ${star.dataset.msg}`);
  });
  dotEls.forEach((dot) => dot.classList.remove("lit"));
  lineEls.forEach((line) => line.classList.remove("revealed"));
  resetConstellationPage();
  updateOverallDots(page1);
  rewindBtn.classList.add("hidden");

  resetBlowHold();
  candles.forEach((candle) => {
    candle.dataset.lit = "true";
    candle.classList.remove("is-igniting");
    candle.querySelectorAll(".smoke").forEach((smoke) => smoke.remove());
  });
  cakeEl.classList.remove("blowout-bounce");
  cakeEl.classList.add("candles-lit");
  pageCake.classList.remove("cake-camera-shake");
  cakeHint.textContent = cakeHintLit;
  wishNote.classList.add("hidden");
  wishNoteMessage.textContent = "";
  blowOutCandlesBtn.disabled = false;
  blowOutCandlesBtn.classList.remove("hidden");
  relightCandlesBtn.classList.add("hidden");
  toFinaleBtn3.classList.add("hidden");

  audio.pause();
  audio.currentTime = 0;
  syncPlayerPlaybackState();

  lastThingBtn.classList.remove("hidden");
  finaleInteraction.classList.add("hidden");
  finalEnvelope.classList.remove("hidden", "is-opening", "is-opened");
  finalEnvelope.setAttribute("aria-expanded", "false");
  finalMessage.classList.add("hidden");
  finalMessage.classList.remove("letter-revealed", "letter-returning");
  finalLetterMessage.textContent = "";
  finalLetterClosing.classList.remove("is-visible");
  finalLetterClosing.setAttribute("aria-hidden", "true");
  letterPageSequence++;
  finalLetterPageCount.textContent = "";
  currentLetterPage = 0;
  nextLetterPageBtn.disabled = false;
  nextLetterPageBtn.textContent = "Next page →";
  giftTapCount = 0;
  currentGiftIndex = 0;
  giftSpotlightComplete = false;
  giftBox.classList.remove("is-opened", "is-tapping");
  giftBox.setAttribute("aria-expanded", "false");
  giftBox.setAttribute("aria-label", "Tap to unwrap your gift, 0 of 5 taps");
  giftBoxHint.textContent = "A little gift is waiting — tap the box 5 times ♡";
  giftSpotlight.classList.add("hidden");
  page6.classList.remove("gift-spotlight-open");
  giftReveal.insertBefore(giftBox, giftBoxHint);

  if (confettiAnimationFrame) cancelAnimationFrame(confettiAnimationFrame);
  if (confettiTimeout) clearTimeout(confettiTimeout);
  confettiAnimationFrame = 0;
  confettiTimeout = 0;
  confettiStartedAt = null;
  confettiPopStartedAt = null;
  confettiPieces = [];
  confettiPopPieces = [];
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  replayConfettiBtn.classList.add("hidden");
  finaleConfettiShown = false;
  try {
    localStorage.removeItem("birthdayJourneyProgress");
  } catch (error) {
    console.warn("Could not clear the saved journey progress.", error);
  }
}

function readSavedJourneyProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("birthdayJourneyProgress"));
    if (
      !saved ||
      saved.version !== 1 ||
      !Number.isInteger(saved.pageIndex) ||
      saved.pageIndex < 1 ||
      saved.pageIndex >= pageOrder.length
    ) {
      return null;
    }

    return {
      ...saved,
      discovered: Array.isArray(saved.discovered)
        ? saved.discovered.filter(
            (index) =>
              Number.isInteger(index) && index >= 0 && index < starEls.length,
          )
        : [],
      giftTapCount: Number.isInteger(saved.giftTapCount)
        ? Math.max(0, Math.min(saved.giftTapCount, 5))
        : 0,
      giftIndex: Number.isInteger(saved.giftIndex)
        ? Math.max(0, Math.min(saved.giftIndex, gifts.length - 1))
        : 0,
      giftOpened: saved.giftOpened === true,
      giftSpotlightComplete: saved.giftSpotlightComplete === true,
    };
  } catch (error) {
    console.warn("Could not read the saved journey progress.", error);
    return null;
  }
}

function saveJourneyProgress() {
  const pageIndex = pageOrder.indexOf(pageHistory[pageHistory.length - 1]);
  if (pageIndex <= 0) {
    try {
      localStorage.removeItem("birthdayJourneyProgress");
    } catch (error) {
      console.warn("Could not clear the saved journey progress.", error);
    }
    return;
  }

  const progress = {
    version: 1,
    pageIndex,
    discovered: [...discovered],
    candlesOut: candles.every((candle) => candle.dataset.lit === "false"),
    finaleStarted: lastThingBtn.classList.contains("hidden"),
    envelopeOpened: finalEnvelope.classList.contains("is-opened"),
    letterOpen: !finalMessage.classList.contains("hidden"),
    letterPage: currentLetterPage,
    finaleConfettiShown,
    musicTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
    giftTapCount,
    giftIndex: currentGiftIndex,
    giftOpened: giftBox.classList.contains("is-opened"),
    giftSpotlightComplete,
  };

  try {
    localStorage.setItem("birthdayJourneyProgress", JSON.stringify(progress));
  } catch (error) {
    console.warn("Could not save the journey progress.", error);
  }
}

function showResumePromptIfAvailable() {
  pendingResumeProgress = readSavedJourneyProgress();
  if (!pendingResumeProgress) return;

  const pageName = pageNames[pendingResumeProgress.pageIndex];
  document.querySelector("#resumeDescription").textContent =
    `Would you like to continue from ${pageName}?`;
  resumePrompt.classList.remove("hidden");
  resumeContinueBtn.focus();
}

function restoreJourneyProgress(progress) {
  resetJourneyState();
  discovered.clear();
  restoringJourneyProgress = true;
  try {
    progress.discovered.forEach((index) => revealProgress(index));
  } finally {
    restoringJourneyProgress = false;
  }

  if (progress.candlesOut) {
    candles.forEach((candle) => {
      candle.dataset.lit = "false";
    });
    cakeEl.classList.remove("candles-lit");
    cakeHint.textContent = "your wish is in the air ♡";
    wishNoteMessage.textContent = birthdayWish;
    wishNote.classList.remove("hidden");
    blowOutCandlesBtn.classList.add("hidden");
    relightCandlesBtn.classList.remove("hidden");
    toFinaleBtn3.classList.remove("hidden");
  }

  lastThingBtn.classList.toggle("hidden", progress.finaleStarted);
  page6.classList.toggle("finale-started", progress.finaleStarted);
  finaleInteraction.classList.toggle("hidden", !progress.finaleStarted);
  finalEnvelope.classList.toggle("is-opened", progress.envelopeOpened);
  finalEnvelope.setAttribute("aria-expanded", String(progress.envelopeOpened));
  giftTapCount = progress.giftOpened ? 5 : progress.giftTapCount;
  currentGiftIndex = progress.giftIndex;
  giftSpotlightComplete = progress.giftSpotlightComplete;
  if (giftTapCount > 0 && giftTapCount < 5) {
    giftBox.setAttribute(
      "aria-label",
      `Tap to unwrap your gift, ${giftTapCount} of 5 taps`,
    );
    giftBoxHint.textContent = `A little gift is waiting — ${5 - giftTapCount} more ${5 - giftTapCount === 1 ? "tap" : "taps"} ♡`;
  }
  if (progress.giftOpened || giftTapCount >= 5) {
    openGiftBox(!giftSpotlightComplete);
  }
  currentLetterPage = Math.max(
    0,
    Math.min(progress.letterPage || 0, finalLetterPages.length - 1),
  );
  if (progress.letterOpen && progress.finaleStarted) {
    finalEnvelope.classList.add("hidden");
    finalMessage.classList.remove("hidden");
    showLetterPage();
  }

  finaleConfettiShown = Boolean(progress.finaleConfettiShown);
  replayConfettiBtn.classList.toggle(
    "hidden",
    !finaleConfettiShown || performanceMode,
  );
  if (Number.isFinite(progress.musicTime) && progress.musicTime > 0) {
    const restoreMusicPosition = () => {
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(progress.musicTime, audio.duration);
      }
    };
    if (audio.readyState >= 1) restoreMusicPosition();
    else
      audio.addEventListener("loadedmetadata", restoreMusicPosition, {
        once: true,
      });
  }

  const targetPage = pageOrder[progress.pageIndex];
  pageOrder.forEach((page, index) => {
    page.classList.remove(
      "transitioning-in",
      "transitioning-in-active",
      "transitioning-out",
      "rewinding-in",
      "rewinding-in-active",
      "rewinding-out",
    );
    page.classList.toggle("hidden", index !== progress.pageIndex);
  });

  if (targetPage === page2) {
    linesContainer.replaceChildren();
    lines.forEach((text) => {
      const line = document.createElement("p");
      line.textContent = text;
      line.style.opacity = "1";
      linesContainer.appendChild(line);
    });
    nextBtn.classList.remove("hidden");
  }
  if (targetPage === page3) {
    resetConstellationPage();
    resizeCanvas();
    const recentStarIndex = progress.discovered[progress.discovered.length - 1];
    if (recentStarIndex !== undefined) {
      const recentStar = starEls[recentStarIndex];
      drawDoodle(starDoodleMap[recentStarIndex]);
      starDate.textContent = recentStar.dataset.date;
      starDate.classList.add("show");
      starMessage.textContent = recentStar.dataset.msg;
      starMessage.classList.add("show");
    }
  }
  if (targetPage === page5) requestAnimationFrame(updateCredits);
  if (targetPage === page6) resizeConfetti();

  pageHistory = pageOrder.slice(0, progress.pageIndex + 1);
  updateHeartParticles();
  updateOverallDots(targetPage);
  rewindBtn.classList.remove("hidden");
  updatePhotoWash(targetPage);
  saveJourneyProgress();
  const focusTarget = targetPage.querySelector(
    "button:not(.hidden):not(:disabled), [tabindex='0']",
  );
  if (!giftSpotlight.classList.contains("hidden")) giftSpotlight.focus();
  else if (focusTarget) focusTarget.focus();
}

resumeContinueBtn.addEventListener("click", () => {
  if (!pendingResumeProgress) return;
  restoreJourneyProgress(pendingResumeProgress);
  resumePrompt.classList.add("hidden");
  pendingResumeProgress = null;
});

resumeStartOverBtn.addEventListener("click", () => {
  resetJourneyState(true);
  pendingResumeProgress = null;
  resumePrompt.classList.add("hidden");
  openBtn.focus();
});

reliveBtn.addEventListener("click", () => {
  if (pageTransitionInProgress) return;
  resetJourneyState(true);
  goToPage(page6, page1, undefined, false);
});

// ---- transition sound effects (synthesized, no files needed) ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundToggle = document.querySelector("#soundToggle");
const effectsGain = audioCtx.createGain();
let soundEffectsMuted = false;

try {
  soundEffectsMuted =
    localStorage.getItem("birthdaySoundEffectsMuted") === "true";
} catch (error) {
  console.warn("Could not load the saved sound-effects preference.", error);
}

effectsGain.gain.value = soundEffectsMuted ? 0 : 1;
effectsGain.connect(audioCtx.destination);

function updateSoundToggle() {
  soundToggle.setAttribute("aria-pressed", String(soundEffectsMuted));
  soundToggle.setAttribute("aria-label", "Sound effects");
  soundToggle.title = soundEffectsMuted
    ? "Unmute sound effects"
    : "Mute sound effects";
  soundToggle.dataset.muted = String(soundEffectsMuted);
}

soundToggle.addEventListener("click", () => {
  soundEffectsMuted = !soundEffectsMuted;
  if (soundEffectsMuted)
    effectsGain.gain.setValueAtTime(0, audioCtx.currentTime);
  else effectsGain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.015);
  updateSoundToggle();

  try {
    localStorage.setItem(
      "birthdaySoundEffectsMuted",
      String(soundEffectsMuted),
    );
  } catch (error) {
    console.warn("Could not save the sound-effects preference.", error);
  }
});

updateSoundToggle();

document.addEventListener(
  "click",
  () => {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  },
  { once: true },
);

function playWhoosh() {
  const duration = 0.4;
  const bufferSize = audioCtx.sampleRate * duration;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // fading white noise
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(800, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(
    200,
    audioCtx.currentTime + duration,
  );

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime); // kept quiet
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(effectsGain);

  noise.start();
  noise.stop(audioCtx.currentTime + duration);
}

function playChime() {
  const now = audioCtx.currentTime;
  const notes = [880, 1108.73]; // a soft two-note chime (A5 -> C#6)

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = audioCtx.createGain();
    const startTime = now + i * 0.1;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

    osc.connect(gain);
    gain.connect(effectsGain);

    osc.start(startTime);
    osc.stop(startTime + 0.6);
  });
}

function playConfettiBoom() {
  const play = () => {
    const now = audioCtx.currentTime;
    const boom = audioCtx.createOscillator();
    const boomGain = audioCtx.createGain();
    boom.type = "triangle";
    boom.frequency.setValueAtTime(190, now);
    boom.frequency.exponentialRampToValueAtTime(72, now + 0.3);
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    boom.connect(boomGain);
    boomGain.connect(effectsGain);
    boom.start(now);
    boom.stop(now + 0.38);

    playNoiseSweep({
      duration: 0.22,
      startFrequency: 2200,
      endFrequency: 420,
      peak: 0.16,
      filterType: "bandpass",
    });
  };

  if (audioCtx.state !== "running") {
    audioCtx
      .resume()
      .then(play)
      .catch((error) => {
        console.error("Could not resume audio for the confetti sound.", error);
      });
    return;
  }

  play();
}

function playNoiseSweep({
  duration,
  startFrequency,
  endFrequency,
  peak,
  filterType = "bandpass",
  delay = 0,
}) {
  const now = audioCtx.currentTime + delay;
  const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const samples = noiseBuffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(startFrequency, now);
  filter.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  if (filterType === "bandpass") filter.Q.value = 0.7;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(
    peak,
    now + Math.min(0.045, duration / 4),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(effectsGain);
  noise.start(now);
  noise.stop(now + duration);
}

function playCandleWind() {
  playNoiseSweep({
    duration: 0.72,
    startFrequency: 1250,
    endFrequency: 170,
    peak: 0.12,
    filterType: "lowpass",
  });
}

function playPaperRustle() {
  playNoiseSweep({
    duration: 0.2,
    startFrequency: 1900,
    endFrequency: 700,
    peak: 0.055,
    delay: 0,
  });
  playNoiseSweep({
    duration: 0.28,
    startFrequency: 1400,
    endFrequency: 420,
    peak: 0.04,
    delay: 0.12,
  });
}

function playMagicStar(index) {
  const now = audioCtx.currentTime;
  const root = [659.25, 739.99, 830.61, 987.77, 880, 783.99, 1046.5][index % 7];

  [root, root * 1.5].forEach((frequency, noteIndex) => {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = noteIndex === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency * 0.88, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency,
      now + 0.16 + noteIndex * 0.04,
    );

    const gain = audioCtx.createGain();
    const start = now + noteIndex * 0.055;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(
      noteIndex === 0 ? 0.075 : 0.035,
      start + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

    oscillator.connect(gain);
    gain.connect(effectsGain);
    oscillator.start(start);
    oscillator.stop(now + 0.54);
  });
}

// ---- subtle film grain texture ----
const grainCanvas = document.querySelector("#grainCanvas");
const gctx = grainCanvas.getContext("2d");

function resizeGrain() {
  grainCanvas.width = Math.ceil(window.innerWidth / 2);
  grainCanvas.height = Math.ceil(window.innerHeight / 2);
}
resizeGrain();
window.addEventListener("resize", resizeGrain);

function drawGrain() {
  if (performanceMode) {
    gctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
    return;
  }

  const imageData = gctx.createImageData(grainCanvas.width, grainCanvas.height);
  const buffer = imageData.data;

  for (let i = 0; i < buffer.length; i += 4) {
    const value = Math.random() * 255;
    buffer[i] = value; // R
    buffer[i + 1] = value; // G
    buffer[i + 2] = value; // B
    buffer[i + 3] = 255; // A
  }

  gctx.putImageData(imageData, 0, 0);
}

let grainInterval = 0;
if (!performanceMode) {
  drawGrain();
  grainInterval = setInterval(drawGrain, 160);
}

// sum handdrawn shi
const doodles = {
  laugh: "M20,60 Q60,100 100,60 M35,45 Q40,35 45,45 M75,45 Q80,35 85,45",
  spark: "M60,15 L68,50 L105,60 L68,70 L60,105 L52,70 L15,60 L52,50 Z",
  music:
    "M40,90 Q40,100 50,100 Q60,100 60,90 L60,25 L95,15 L95,80 Q95,90 85,90 Q75,90 75,80",
  heart:
    "M60,100 C20,70 10,35 35,25 C50,20 60,35 60,35 C60,35 70,20 85,25 C110,35 100,70 60,100 Z",
  swirl:
    "M60,20 C90,20 100,50 80,70 C65,85 40,80 40,60 C40,48 55,45 60,55 C63,62 55,65 52,58",
  crescent:
    "M78,22 C52,30 42,62 57,84 C64,94 76,99 88,96 C69,112 39,108 24,89 C7,68 12,38 33,22 C46,12 64,12 78,22 Z",
  flower:
    "M60,60 C47,51 47,38 60,31 C73,38 73,51 60,60 C69,47 82,47 89,60 C82,73 69,73 60,60 C73,69 73,82 60,89 C47,82 47,69 60,60 C51,73 38,73 31,60 C38,47 51,47 60,60 Z M60,55 A5,5 0 1,0 60,65 A5,5 0 1,0 60,55",
};

const starDoodleMap = [
  "spark",
  "swirl",
  "laugh",
  "heart",
  "music",
  "crescent",
  "flower",
];

function updatePerformanceToggle() {
  performanceToggle.setAttribute("aria-pressed", String(performanceMode));
  performanceToggle.setAttribute("aria-label", "Performance mode");
  performanceToggle.title = performanceMode
    ? "♡ Performance mode on — resume background effects"
    : "♡ Performance mode off — reduce background effects";
}

function setPerformanceMode(enabled) {
  if (performanceMode === enabled) return;
  performanceMode = enabled;
  document.body.classList.toggle("performance-mode", performanceMode);
  updatePerformanceToggle();

  try {
    localStorage.setItem("birthdayPerformanceMode", String(performanceMode));
  } catch (error) {
    console.warn("Could not save the performance-mode preference.", error);
  }

  if (performanceMode) {
    [bgStarsFrame, parallaxFrame, trailFrame, pulseFrame].forEach((frame) => {
      if (frame) cancelAnimationFrame(frame);
    });
    bgStarsFrame = 0;
    parallaxFrame = 0;
    trailFrame = 0;
    pulseFrame = 0;
    ctx.clearRect(0, 0, skyCanvasWidth, skyCanvasHeight);
    canvas.style.transform = "none";
    parallaxX = 0;
    parallaxY = 0;
    targetX = 0;
    targetY = 0;
    sparkles = [];
    lastPointerPosition = null;
    tctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    pctx.clearRect(0, 0, pulseCanvas.width, pulseCanvas.height);

    if (grainInterval) clearInterval(grainInterval);
    grainInterval = 0;
    gctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);

    if (confettiAnimationFrame) cancelAnimationFrame(confettiAnimationFrame);
    if (confettiTimeout) clearTimeout(confettiTimeout);
    confettiAnimationFrame = 0;
    confettiTimeout = 0;
    confettiStartedAt = null;
    confettiPopStartedAt = null;
    confettiPieces = [];
    confettiPopPieces = [];
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    replayConfettiBtn.classList.add("hidden");
    updateHeartParticles();
    return;
  }

  bgStarsFrame = requestAnimationFrame(drawStars);
  parallaxFrame = requestAnimationFrame(animateParallax);
  trailFrame = requestAnimationFrame(animateTrail);
  pulseFrame = requestAnimationFrame(animatePulse);
  drawGrain();
  grainInterval = setInterval(drawGrain, 160);
  updateHeartParticles();

  if (finaleConfettiShown && !page6.classList.contains("hidden")) {
    replayConfettiBtn.classList.remove("hidden");
  }
}

performanceToggle.addEventListener("click", () => {
  setPerformanceMode(!performanceMode);
});
updatePerformanceToggle();


/* ================= SKY POLISH =================
   Ambient dust, shooting stars, faint neighbouring constellations, light that
   flows along revealed lines, idle star pulses, and a layered bloom on click.
   Everything here is skipped or hidden in performance mode. */
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const viewport = constellationViewport;
  const rand = (min, max) => min + Math.random() * (max - min);

  // ---- 1. light that travels along every revealed line ----
  [...linesSvg.querySelectorAll(".constellation-line")].forEach((line, i) => {
    const flow = document.createElementNS(SVG_NS, "line");
    ["x1", "y1", "x2", "y2"].forEach((attr) =>
      flow.setAttribute(attr, line.getAttribute(attr)),
    );
    flow.setAttribute("pathLength", "100");
    flow.classList.add("constellation-flow");
    flow.style.setProperty("--flow-delay", `${(i * 0.85) % 4.2}s`);
    line.after(flow);
  });

  // ---- 2. faint neighbouring constellations (they zoom with the sky) ----
  const faintSets = [
    { pts: [[28, 40], [52, 26], [78, 44], [98, 30]], edges: [[0, 1], [1, 2], [2, 3]] },
    { pts: [[398, 26], [426, 52], [455, 40], [472, 72], [440, 86]], edges: [[0, 1], [1, 2], [2, 3], [1, 4]] },
    { pts: [[22, 172], [48, 198], [40, 228], [78, 214], [102, 238]], edges: [[0, 1], [1, 2], [1, 3], [3, 4]] },
    { pts: [[392, 178], [420, 202], [452, 186], [472, 216]], edges: [[0, 1], [1, 2], [2, 3]] },
  ];
  const faintSvg = document.createElementNS(SVG_NS, "svg");
  faintSvg.setAttribute("viewBox", "0 0 500 260");
  faintSvg.setAttribute("preserveAspectRatio", "none");
  faintSvg.setAttribute("aria-hidden", "true");
  faintSvg.classList.add("sky-faint");
  faintSets.forEach(({ pts, edges }, setIndex) => {
    edges.forEach(([a, b]) => {
      const l = document.createElementNS(SVG_NS, "line");
      l.setAttribute("x1", pts[a][0]);
      l.setAttribute("y1", pts[a][1]);
      l.setAttribute("x2", pts[b][0]);
      l.setAttribute("y2", pts[b][1]);
      faintSvg.appendChild(l);
    });
    pts.forEach(([x, y], i) => {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", i % 3 === 0 ? 1.7 : 1.1);
      c.style.setProperty("--tw-delay", `${((setIndex * 5 + i) * 0.7) % 5}s`);
      faintSvg.appendChild(c);
    });
  });
  sky.prepend(faintSvg);

  // ---- 3. ambient layer: milky haze, rising dust, a small label ----
  const ambient = document.createElement("div");
  ambient.id = "skyAmbientLayer";
  ambient.setAttribute("aria-hidden", "true");

  ["", "is-rose"].forEach((variant) => {
    const haze = document.createElement("span");
    haze.className = `sky-milkyway ${variant}`.trim();
    ambient.appendChild(haze);
  });

  const moteColors = [
    "rgba(255, 244, 208, 0.9)",
    "rgba(213, 213, 244, 0.9)",
    "rgba(240, 185, 201, 0.85)",
  ];
  for (let i = 0; i < 20; i += 1) {
    const mote = document.createElement("span");
    mote.className = "sky-mote";
    mote.style.setProperty("--mx", `${rand(2, 98).toFixed(1)}%`);
    mote.style.setProperty("--ms", `${rand(1.6, 3.4).toFixed(1)}px`);
    mote.style.setProperty("--mc", moteColors[i % moteColors.length]);
    mote.style.setProperty("--md", `${rand(15, 28).toFixed(1)}s`);
    mote.style.setProperty("--mdelay", `${(-rand(0, 28)).toFixed(1)}s`);
    mote.style.setProperty("--mdx", `${rand(-26, 26).toFixed(0)}px`);
    mote.style.setProperty("--mpeak", rand(0.35, 0.8).toFixed(2));
    ambient.appendChild(mote);
  }

  const label = document.createElement("span");
  label.className = "sky-label";
  label.textContent = "♎ Libra · Oct 11";
  ambient.appendChild(label);

  const bgCanvas = viewport.querySelector("#bgStars");
  if (bgCanvas) bgCanvas.after(ambient);
  else viewport.prepend(ambient);

  // ---- 4. idle pulses: every star breathes on its own rhythm ----
  starEls.forEach((star, i) => {
    star.style.setProperty("--pulse-delay", `${((i * 0.67) % 3.2).toFixed(2)}s`);
    star.style.setProperty("--pulse-dur", `${(3.2 + (i % 4) * 0.5).toFixed(1)}s`);
  });

  // ---- 5. layered bloom ----
  function spawnStarBloom(x, y, soft = false) {
    if (performanceMode) return;
    const layer = ensureConstellationFxLayer();

    const make = (className, vars = {}) => {
      const el = document.createElement("span");
      el.className = className;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
      layer.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });
      return el;
    };

    make("star-bloom-halo", { "--bloom-scale": soft ? "1.25" : "1.7" });
    make("star-bloom-ring");
    make("star-bloom-ring", { "--ring-delay": "150ms" });
    if (!soft) make("star-bloom-flare");

    const tones = ["#fff4d0", "#d5d5f4", "#f0b9c9", "#ffffff"];
    const count = soft ? 6 : 10;
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(14, 46);
      make("star-bloom-mote", {
        "--mote-x": `${(Math.cos(angle) * dist).toFixed(1)}px`,
        "--mote-y": `${(Math.sin(angle) * dist - rand(8, 24)).toFixed(1)}px`,
        "--mote-size": `${rand(1.8, 3.6).toFixed(1)}px`,
        "--mote-delay": `${Math.round(rand(0, 220))}ms`,
        "--mote-dur": `${Math.round(rand(1500, 2600))}ms`,
        "--mote-color": tones[i % tones.length],
      });
    }
  }

  starEls.forEach((star) => {
    star.addEventListener("click", () => {
      const rect = star.getBoundingClientRect();
      const vRect = viewport.getBoundingClientRect();
      spawnStarBloom(
        rect.left + rect.width / 2 - vRect.left,
        rect.top + rect.height / 2 - vRect.top,
      );

      star.classList.remove("is-blooming");
      void star.offsetWidth;
      star.classList.add("is-blooming");
      setTimeout(() => star.classList.remove("is-blooming"), 1100);

      // The sky glides so the clicked star lands in the centre: give it a
      // second, softer bloom on arrival.
      const sequence = starSelectionSequence;
      setTimeout(() => {
        if (sequence !== starSelectionSequence) return;
        if (!star.classList.contains("lit")) return;
        if (skyForZoom.style.transform === "none") return;
        spawnStarBloom(vRect.width / 2, vRect.height / 2, true);
      }, 560);
    });
  });

  // ---- 6. occasional shooting star ----
  function spawnShootingStar() {
    if (performanceMode || document.hidden || page3.classList.contains("hidden")) return;
    const star = document.createElement("span");
    star.className = "sky-shooting-star";
    const dist = rand(150, 230);
    const fall = dist * rand(0.22, 0.42);
    star.style.left = `${rand(4, 55)}%`;
    star.style.top = `${rand(4, 40)}%`;
    star.style.setProperty("--shoot-dist", `${dist.toFixed(0)}px`);
    star.style.setProperty("--shoot-fall", `${fall.toFixed(0)}px`);
    star.style.setProperty("--shoot-angle", `${(Math.atan2(fall, dist) * 57.3).toFixed(1)}deg`);
    star.style.setProperty("--shoot-dur", `${Math.round(rand(850, 1250))}ms`);
    ambient.appendChild(star);
    star.addEventListener("animationend", () => star.remove(), { once: true });
  }

  function scheduleShootingStar() {
    setTimeout(() => {
      spawnShootingStar();
      scheduleShootingStar();
    }, rand(6000, 13000));
  }
  scheduleShootingStar();
})();
