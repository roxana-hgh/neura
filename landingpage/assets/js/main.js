/* Neura landing page — interactions & scroll animations (no build step). */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = () => window.matchMedia("(max-width: 640px)").matches;

  /* ---------- App links ---------- */
  const APP_URL = (window.NEURA_CONFIG && window.NEURA_CONFIG.APP_URL) || "";
  $$("[data-app]").forEach((a) => {
    a.href = APP_URL + (a.dataset.app || "");
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Hero intro ---------- */
  $$("[data-hero]").forEach((el) => el.style.setProperty("--i", el.dataset.hero));
  const start = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))]).then(start);
  } else {
    start();
  }
  if (reduceMotion) document.body.classList.add("no-motion");

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  const scrollToY = (y) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  };

  /* ---------- Nav ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const y = id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - (id === "#workflow" ? 0 : 72);
      scrollToY(y);
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Generated mockup content ---------- */
  // Small deterministic PRNG so the mockups look the same on every load.
  const rng = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  $$("[data-heat]").forEach((el, k) => {
    const n = Number(el.dataset.heat) || 56;
    const r = rng(42 + k * 7);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const cell = document.createElement("i");
      const v = r() + i / n / 2.5; // trend upward: recent days are busier
      cell.dataset.l = v > 1.05 ? "4" : v > 0.85 ? "3" : v > 0.6 ? "2" : v > 0.38 ? "1" : "0";
      cell.style.setProperty("--n", String(i));
      frag.appendChild(cell);
    }
    el.appendChild(frag);
  });

  const cal = $("#cal");
  if (cal) {
    const r = rng(7);
    const colors = ["var(--rose)", "var(--amber)", "var(--sky)", "rgb(255 255 255 / 0.18)"];
    const frag = document.createDocumentFragment();
    // Oct 26 → Nov 29 (five Monday-first weeks), "today" is the 9th
    for (let i = 0; i < 35; i++) {
      const out = i < 6;
      const day = out ? 26 + i : i - 5;
      const cell = document.createElement("span");
      if (out) cell.className = "out";
      if (!out && day === 9) cell.className = "today";
      cell.innerHTML = `<b>${day}</b>`;
      const count = Math.floor(r() * 4.2);
      if (count && !out) {
        const bar = document.createElement("span");
        bar.className = "bar";
        for (let c = 0; c < count; c++) {
          const seg = document.createElement("i");
          seg.style.background = day < 9 ? colors[3] : colors[Math.floor(r() * 3)];
          bar.appendChild(seg);
        }
        cell.appendChild(bar);
      }
      frag.appendChild(cell);
    }
    cal.appendChild(frag);
  }

  /* ---------- Manifesto: split into words ---------- */
  const manifesto = $("#manifesto");
  let words = [];
  if (manifesto) {
    const highlight = new Set(["ideas,", "matters."]);
    const parts = manifesto.textContent.trim().split(/\s+/);
    manifesto.textContent = "";
    parts.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "w" + (highlight.has(w) ? " hl" : "");
      s.textContent = w;
      manifesto.appendChild(s);
      if (i < parts.length - 1) manifesto.appendChild(document.createTextNode(" "));
    });
    words = $$(".w", manifesto);
  }

  /* ---------- Scroll-linked updates ---------- */
  const heroWindow = $("#heroWindow");
  const story = $("#workflow");
  const steps = $$("#steps .step");
  const scenes = $$(".scene");
  const storyBar = $("#storyBar");
  const ringBar = $("#ringBar");
  const focusTime = $("#focusTime");
  const RING = 2 * Math.PI * 88;
  let activeStep = -1;
  let storyVisible = false;

  steps.forEach((step, i) => {
    step.style.cursor = "pointer";
    step.addEventListener("click", () => {
      const total = story.offsetHeight - window.innerHeight;
      scrollToY(story.offsetTop + total * ((i + 0.5) / steps.length));
    });
  });

  const setStep = (i) => {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    scenes.forEach((s, k) => {
      s.classList.toggle("is-active", k === i);
      s.classList.toggle("is-past", k < i);
    });
  };

  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav.classList.toggle("is-scrolled", y > 8);

    // Hero window: tilted back → flat as you scroll
    if (heroWindow && !reduceMotion) {
      const p = clamp(y / (vh * 0.65));
      const base = isSmall() ? 10 : 22;
      const e = 1 - Math.pow(1 - p, 3);
      heroWindow.style.setProperty("--rx", `${(base * (1 - e)).toFixed(2)}deg`);
      heroWindow.style.setProperty("--sc", (0.92 + 0.08 * e).toFixed(4));
      heroWindow.style.setProperty("--ty", `${(-40 * e).toFixed(1)}px`);
    }

    // Manifesto words light up with scroll
    if (manifesto && words.length) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = reduceMotion ? words.length : Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < lit));
    }

    // Sticky workflow story
    if (story) {
      const r = story.getBoundingClientRect();
      const total = story.offsetHeight - vh;
      const p = clamp(-r.top / total);
      storyVisible = r.top < vh && r.bottom > 0;
      if (storyBar) storyBar.style.height = `${(p * 100).toFixed(2)}%`;
      const n = steps.length;
      setStep(Math.min(n - 1, Math.floor(p * n)));

      // Focus scene: ring fills and the clock runs down with scroll
      const local = clamp(p * n - 2);
      if (ringBar) ringBar.style.strokeDashoffset = String(RING * (1 - (0.06 + 0.9 * local)));
      if (focusTime) {
        const secs = Math.round(50 * 60 * (1 - local * 0.9));
        focusTime.textContent = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
      }
    }
  };

  if (ringBar) ringBar.style.strokeDasharray = String(RING);
  if (lenis) lenis.on("scroll", update);
  else window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal, .bcard");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Cursor spotlight on cards ---------- */
  $$(".spot").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Capture scene: typing loop ---------- */
  const captureText = $("#captureText");
  const captureList = $(".capture__list");
  if (captureText && captureList) {
    const phrases = [
      "Email Ali about the contract",
      "Idea: dark mode for the reports",
      "Buy a birthday gift for Neda",
      "Read the article on deep work",
    ];
    let phrase = 0;
    let char = 0;
    const tick = () => {
      if (!storyVisible || activeStep !== 0) return setTimeout(tick, 400);
      const text = phrases[phrase];
      if (char <= text.length) {
        captureText.textContent = text.slice(0, char++);
        return setTimeout(tick, 38 + Math.random() * 60);
      }
      // "press Enter": the thought drops into the inbox
      setTimeout(() => {
        const li = document.createElement("li");
        li.className = "new";
        li.innerHTML = `<span></span><small class="mono">Just now</small>`;
        li.firstChild.textContent = text;
        captureList.prepend(li);
        while (captureList.children.length > 3) captureList.lastElementChild.remove();
        captureList.querySelectorAll("small").forEach((s, i) => {
          if (i > 0 && s.textContent === "Just now") s.textContent = "1m ago";
        });
        captureText.textContent = "";
        char = 0;
        phrase = (phrase + 1) % phrases.length;
        setTimeout(tick, 900);
      }, 650);
    };
    if (reduceMotion) captureText.textContent = phrases[0];
    else setTimeout(tick, 600);
  }

  /* ---------- Assistant chat sequence ---------- */
  const chat = $("#chat");
  if (chat) {
    const items = $$("[data-chat]", chat);
    const showAll = () =>
      items.forEach((el) => {
        el.classList.add("show");
        el.classList.add("done");
      });

    const play = () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      (async () => {
        for (const el of items) {
          if (el.classList.contains("msg--bot")) {
            el.classList.add("thinking", "show");
            await wait(1300);
            el.classList.remove("thinking");
            el.classList.add("done");
            await wait(1100);
          } else {
            el.classList.add("show");
            await wait(650);
          }
        }
      })();
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          play();
        },
        { threshold: 0.4 }
      );
      io.observe(chat);
    }
  }
})();
