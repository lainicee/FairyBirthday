// fairy.js — enchanted atmosphere logic (v2)
// Drop-in AFTER script.js. Safe to load even with performanceMode on.
//
// v2 changelog:
//  - FIX: `whispers` was never defined → script crashed before vines/marginalia ran
//  - new: aurora sky + breathing moon behind everything
//  - new: tinted fireflies (gold / rose / lavender / mint)
//  - new: click magic-dust bursts on every button
//  - new: shooting stars every 9–18s
//  - new: ambient rising motes + fairy-ring corner doodles
//  - new: shimmer sweep on h1 titles, spinning starlight rims on key cards

(() => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) return;

  const getPerformance = () => document.body.classList.contains('performance-mode');

  // ---- ensure layers exist ----
  let fairyLayer = document.getElementById('fairyLayer');
  if (!fairyLayer) {
    fairyLayer = document.createElement('div');
    fairyLayer.id = 'fairyLayer';
    fairyLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fairyLayer);
  }

  let fairyCursor = document.getElementById('fairyCursor');
  if (!fairyCursor) {
    fairyCursor = document.createElement('div');
    fairyCursor.id = 'fairyCursor';
    fairyCursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fairyCursor);
  }

  // ---- AURORA SKY ----
  let aurora = document.getElementById('fairyAurora');
  if (!aurora) {
    aurora = document.createElement('div');
    aurora.id = 'fairyAurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML =
      '<span class="fairy-aurora-ribbon"></span>' +
      '<span class="fairy-aurora-ribbon-b"></span>' +
      '<span class="fairy-aurora-ribbon-c"></span>' +
      '<span class="fairy-aurora-moon"></span>';
    document.body.prepend(aurora);
  }

  // ---- 1. FIREFLIES: tinted drifting lights ----
  const fireflyCount = 26;
  const fireflies = [];
  const fireflyTints = ['', '', 'is-rose', 'is-lavender', 'is-mint']; // '' = gold, weighted

  function spawnFirefly() {
    if (getPerformance()) return;
    const el = document.createElement('span');
    el.className = 'firefly ' + fireflyTints[Math.floor(Math.random() * fireflyTints.length)];
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    el.style.left = `${startX}%`;
    el.style.top = `${startY}%`;

    // random drift vectors
    const x1 = (Math.random() - 0.5) * 120;
    const y1 = (Math.random() - 0.5) * 80;
    const x2 = (Math.random() - 0.5) * 140;
    const y2 = (Math.random() - 0.5) * 100;
    const x3 = (Math.random() - 0.5) * 100;
    const y3 = (Math.random() - 0.5) * 60;

    el.style.setProperty('--fly-x1', `${x1}px`);
    el.style.setProperty('--fly-y1', `${y1}px`);
    el.style.setProperty('--fly-x2', `${x2}px`);
    el.style.setProperty('--fly-y2', `${y2}px`);
    el.style.setProperty('--fly-x3', `${x3}px`);
    el.style.setProperty('--fly-y3', `${y3}px`);
    el.style.setProperty('--fly-dur', `${18 + Math.random() * 14}s`);
    el.style.setProperty('--fly-delay', `${Math.random() * -20}s`);
    el.style.setProperty('--blink-dur', `${2.5 + Math.random() * 3.5}s`);
    el.style.setProperty('--blink-delay', `${Math.random() * -5}s`);

    fairyLayer.appendChild(el);
    fireflies.push(el);
  }

  for (let i = 0; i < fireflyCount; i++) spawnFirefly();

  // ---- 2. PETALS: one every 2.5s, Studio Ghibli style ----
  const petalChars = ['❀', '✿', '❁', '♡', '✦'];
  let petalTimer = 0;

  function spawnPetal() {
    if (getPerformance() || document.hidden) return;
    const el = document.createElement('span');
    el.className = 'fairy-petal';
    el.textContent = petalChars[Math.floor(Math.random() * petalChars.length)];
    el.style.left = '0';
    el.style.fontSize = `${10 + Math.random() * 10}px`;

    const x = Math.random() * 100;
    const sway = (Math.random() - 0.5) * 120;
    const sway2 = (Math.random() - 0.5) * 160;
    const dur = 9 + Math.random() * 9;

    el.style.setProperty('--petal-x', `${x}vw`);
    el.style.setProperty('--sway', `${sway}px`);
    el.style.setProperty('--sway2', `${sway2}px`);
    el.style.animationDuration = `${dur}s`;

    // slight color variation
    const colors = ['#f0b9c9', '#d5d5f4', '#e8dfc8', '#f2c34f'];
    el.style.color = colors[Math.floor(Math.random() * colors.length)];

    fairyLayer.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function petalLoop() {
    petalTimer = setTimeout(() => {
      spawnPetal();
      petalLoop();
    }, 2400 + Math.random() * 2200);
  }
  petalLoop();

  // ---- 9. SHOOTING STARS: streak across the sky now and then ----
  function spawnShootingStar() {
    if (getPerformance() || document.hidden) return;
    const el = document.createElement('span');
    el.className = 'fairy-shooting-star';
    const startX = 15 + Math.random() * 55;      // upper-left-ish sky
    const startY = 4 + Math.random() * 22;
    const angle = 22 + Math.random() * 14;        // degrees, falling right
    const dist = 38 + Math.random() * 22;         // vw
    const dur = 0.9 + Math.random() * 0.7;

    el.style.left = `${startX}vw`;
    el.style.top = `${startY}vh`;
    el.style.setProperty('--shoot-angle', `${angle}deg`);
    el.style.setProperty('--shoot-dist', `${dist}vw`);
    el.style.setProperty('--shoot-fall', `${dist * Math.tan((angle * Math.PI) / 180)}vw`);
    el.style.setProperty('--shoot-dur', `${dur}s`);

    fairyLayer.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function shootingStarLoop() {
    setTimeout(() => {
      spawnShootingStar();
      shootingStarLoop();
    }, 9000 + Math.random() * 9000);
  }
  setTimeout(spawnShootingStar, 3500); // one early, so visitors catch it fast
  shootingStarLoop();

  // ---- 10. AMBIENT RISING MOTES: quiet sparkles climbing from below ----
  const moteCount = 14;
  function spawnMote(i) {
    if (getPerformance()) return;
    const el = document.createElement('span');
    el.className = 'fairy-mote';
    el.style.left = `${Math.random() * 100}%`;
    el.style.setProperty('--mote-dur', `${14 + Math.random() * 12}s`);
    el.style.setProperty('--mote-delay', `${i * (26 / moteCount) + Math.random() * 2}s`);
    el.style.setProperty('--mote-drift', `${(Math.random() - 0.5) * 90}px`);
    el.style.setProperty('--mote-peak', `${0.3 + Math.random() * 0.35}`);
    if (Math.random() > 0.6) {
      el.style.background = 'rgba(230,200,255,0.9)';
      el.style.boxShadow = '0 0 8px 2px rgba(185,187,231,0.4)';
    }
    fairyLayer.appendChild(el);
  }
  for (let i = 0; i < moteCount; i++) spawnMote(i);

  // ---- 3. CURSOR FAIRY + SPARKLE TRAIL (enhances your cursorTrail canvas) ----
  let mouseX = 0, mouseY = 0, lastSparkle = 0;
  let cursorVisible = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!cursorVisible) {
      fairyCursor.style.opacity = '0.9';
      cursorVisible = true;
    }
    fairyCursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

    // sparkle trail every 60ms
    const now = performance.now();
    if (now - lastSparkle > 60 && !getPerformance() && Math.random() > 0.35) {
      lastSparkle = now;
      const sp = document.createElement('span');
      sp.className = 'fairy-sparkle';
      sp.textContent = Math.random() > 0.5 ? '✦' : '·';
      sp.style.left = `${mouseX + (Math.random()-0.5)*12}px`;
      sp.style.top = `${mouseY + (Math.random()-0.5)*12}px`;
      sp.style.fontSize = `${6 + Math.random()*8}px`;
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 900);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    fairyCursor.style.opacity = '0';
    cursorVisible = false;
  });

  // ---- 8. MAGIC DUST: every click puffs enchanted dust ----
  const dustColors = ['#fff4d0', '#f0b9c9', '#d5d5f4', '#f2c34f', '#e8dfc8'];
  function puffDust(x, y) {
    if (getPerformance()) return;
    const n = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('span');
      d.className = 'fairy-dust';
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const dist = 22 + Math.random() * 42;
      const size = 2 + Math.random() * 4;
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      d.style.background = dustColors[Math.floor(Math.random() * dustColors.length)];
      d.style.boxShadow = `0 0 8px 2px currentColor`;
      d.style.color = d.style.background;
      d.style.setProperty('--dust-x', `${Math.cos(angle) * dist}px`);
      d.style.setProperty('--dust-y', `${Math.sin(angle) * dist}px`);
      d.style.setProperty('--dust-dur', `${0.55 + Math.random() * 0.45}s`);
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1100);
    }
  }

  document.addEventListener('click', (e) => {
    puffDust(e.clientX, e.clientY);
  }, { passive: true });

  function attachMarginalia() {
    document.querySelectorAll('.scene').forEach((scene) => {
      if (scene.querySelector('.fairy-marginalia')) return; // already
      const count = scene.id === 'page1' || scene.id === 'page6' ? 2 : 1;
      const picks = [...whispers].sort(() => 0.5 - Math.random()).slice(0, count);
      picks.forEach((w, i) => {
        const el = document.createElement('span');
        el.className = `fairy-marginalia is-${w.side}`;
        el.textContent = w.text;
        el.style.setProperty('--rot', w.rot);
        el.style.setProperty('--m-delay', `${0.6 + i*0.4}s`);
        el.style.top = w.top;
        // only show if scene is visible later — CSS handles fade
        scene.style.position = scene.style.position || 'relative';
        scene.appendChild(el);
      });
    });
  }
  attachMarginalia();

  // ---- 5. VINES: tiny enchanted doodles on scenes ----
  function addVines() {
    const svgNS = "http://www.w3.org/2000/svg";
    const paths = [
      "M10,80 Q30,10 70,30 T90,10",
      "M5,5 Q25,40 60,20 T85,45",
      "M10,10 C30,40 10,70 50,80"
    ];
    document.querySelectorAll('.scene').forEach((scene, idx) => {
      if (scene.querySelector('.fairy-vine')) return;
      if (Math.random() < 0.3) return; // not every scene
      const svg = document.createElementNS(svgNS, "svg");
      svg.classList.add('fairy-vine');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.style.top = `${8 + Math.random()*60}%`;
      svg.style[ idx % 2 === 0 ? 'right' : 'left'] = '-10px';
      svg.style.setProperty('--vine-delay', `${1 + idx*0.3}s`);
      const p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", paths[idx % paths.length]);
      svg.appendChild(p);
      scene.appendChild(svg);
    });
  }
  addVines();

  // ---- 11. FAIRY RINGS: tiny dotted glowing rings in scene corners ----
  function addFairyRings() {
    const svgNS = "http://www.w3.org/2000/svg";
    document.querySelectorAll('.scene').forEach((scene, idx) => {
      if (scene.querySelector('.fairy-ring')) return;
      if (idx % 2 !== 0) return; // every other scene
      const svg = document.createElementNS(svgNS, 'svg');
      svg.classList.add('fairy-ring');
      svg.setAttribute('viewBox', '0 0 60 60');
      svg.style.width = '52px';
      svg.style.height = '52px';
      svg.style.bottom = '4%';
      svg.style[idx % 4 === 0 ? 'left' : 'right'] = '2%';
      svg.style.setProperty('--ring-delay', `${0.8 + idx * 0.35}s`);
      const c1 = document.createElementNS(svgNS, 'circle');
      c1.setAttribute('cx', '30'); c1.setAttribute('cy', '30'); c1.setAttribute('r', '22');
      const c2 = document.createElementNS(svgNS, 'circle');
      c2.setAttribute('cx', '30'); c2.setAttribute('cy', '30'); c2.setAttribute('r', '14');
      svg.appendChild(c1);
      svg.appendChild(c2);
      scene.appendChild(svg);
    });
  }
  addFairyRings();

  // ---- 6. SHIMMER TITLES: let the h1s drink moonlight ----
  function enchantTitles() {
    document.querySelectorAll('.scene h1').forEach((h) => {
      if (h.classList.contains('fairy-shimmer')) return;
      // don't break layouts that rely on inline structure (heart buttons inside)
      if (h.querySelector('button')) return;
      h.classList.add('fairy-shimmer');
    });
  }
  enchantTitles();

  // ---- 7. ENCHANTED CARD RIMS: spinning starlight border on key cards ----
  function enchantCards() {
    document.querySelectorAll(
      '.resume-card, .final-letter, .egg-box, .wish-note'
    ).forEach((card) => card.classList.add('fairy-enchanted'));
  }
  enchantCards();

  // ---- visibility: wake each enchantment only when its scene is on stage ----
  function wakeOnVisible() {
    const wakeTargets = document.querySelectorAll(
      '.fairy-marginalia, .fairy-vine, .fairy-ring, .fairy-enchanted'
    );
    if (!('IntersectionObserver' in window)) {
      wakeTargets.forEach((el) => el.classList.add('is-awake'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-awake');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    wakeTargets.forEach((el) => io.observe(el));
  }

  // script.js swaps scenes dynamically — wake what's already on stage,
  // and re-scan shortly after in case scenes mount late
  wakeOnVisible();
  setTimeout(wakeOnVisible, 1200);
  document.addEventListener('click', () => setTimeout(wakeOnVisible, 400), { passive: true });

  // ---- 6b. H1 sparkle burst on hover ----
  document.querySelectorAll('h1').forEach((h) => {
    h.addEventListener('mouseenter', () => {
      if (getPerformance()) return;
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const rect = h.getBoundingClientRect();
          const sp = document.createElement('span');
          sp.className = 'fairy-sparkle';
          sp.textContent = ['✦','✧','·','♡'][Math.floor(Math.random()*4)];
          sp.style.left = `${rect.left + Math.random()*rect.width}px`;
          sp.style.top = `${rect.top + Math.random()*rect.height*0.6}px`;
          document.body.appendChild(sp);
          setTimeout(() => sp.remove(), 900);
        }, i * 55);
      }
    });
  });

  // ---- 12. Hook into your performance toggle ----
  const perfToggle = document.getElementById('performanceToggle');
  if (perfToggle) {
    const observer = new MutationObserver(() => {
      if (getPerformance()) {
        fairyLayer.querySelectorAll('.firefly, .fairy-petal, .fairy-mote, .fairy-shooting-star').forEach(el => el.style.display = 'none');
      } else {
        fairyLayer.querySelectorAll('.firefly, .fairy-petal, .fairy-mote, .fairy-shooting-star').forEach(el => el.style.display = '');
        if (fireflies.length < fireflyCount) {
          fairyLayer.querySelectorAll('.firefly').forEach(el => el.remove());
          fireflies.length = 0;
          for (let i = 0; i < fireflyCount; i++) spawnFirefly();
        }
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  console.log('✦ fairy layer v2 active — aurora sky, 26 tinted fireflies, petals, shooting stars, magic dust');
})();
