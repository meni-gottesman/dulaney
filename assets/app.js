/* ============================================================================
   NEVIS AFFAIR — interactions
   ========================================================================== */
(function () {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- FOCUS CONTAINMENT ----------
     `inert` on the background siblings makes everything outside the active
     overlay non-focusable, giving a native focus trap with no Tab handler. */
  const body = document.body;
  function lockBackground(active) {
    Array.from(body.children).forEach((el) => {
      if (el === active || el.tagName === "SCRIPT") return;
      el.setAttribute("inert", "");
    });
  }
  function unlockBackground() {
    Array.from(body.children).forEach((el) => el.removeAttribute("inert"));
  }

  /* ---------- ENVELOPE GATE (home page only) ---------- */
  const gate = $("#gate");
  const envelope = $("#envelope");
  let opened = false;

  if (gate && envelope) {
    var exitGate = function (focusTarget) {
      gate.classList.add("is-open");
      body.classList.remove("is-sealed");
      body.classList.add("entered"); // hand the moment off to the hero name reveal
      opened = true;
      unlockBackground();
      try { sessionStorage.setItem("nevis_entered", "1"); } catch (e) {}
      const t = focusTarget || $("#top"); // skip focus into the page content
      if (t) t.focus({ preventScroll: true });
    };
    var openGate = function () {
      if (opened) return;
      opened = true;
      envelope.classList.add("is-opening");
      const gh = $("#gateHint"); if (gh) gh.style.opacity = "0";
      startAudio(); // on this genuine user gesture (then they can mute)
      const delay = prefersReduced ? 0 : 900;
      window.setTimeout(() => exitGate(), delay);
    };
    const skipGate = function () { opened = false; exitGate(); };
    envelope.addEventListener("click", openGate);
    const gs = $("#gateSkip"); if (gs) gs.addEventListener("click", skipGate);

    let returning = false;
    try { returning = sessionStorage.getItem("nevis_entered") === "1"; } catch (e) {}
    if (returning) {
      gate.classList.add("is-instant", "is-open");
      body.classList.remove("is-sealed");
      body.classList.add("entered");
      opened = true;
    } else {
      lockBackground(gate);
      envelope.focus({ preventScroll: true });
    }
  } else {
    // No gate on this page — show content immediately.
    body.classList.remove("is-sealed");
    body.classList.add("entered");
  }

  /* ---------- AMBIENT AUDIO ----------
     Prefers a real <audio> source if one is provided; otherwise synthesises a
     soft, copyright-free ambient pad with the Web Audio API. */
  const audioToggle = $("#audioToggle");
  const audioEl = $("#audioEl");
  const hasRealTrack = audioEl && audioEl.querySelector("source");
  let audioCtx, master, started = false, isOn = false, lfoTimers = [];

  function buildPad() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.0001;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 760; filter.Q.value = 0.6;
    filter.connect(master); master.connect(audioCtx.destination);

    // Warm chord: a gentle, wide major-9 voicing, lightly detuned.
    const freqs = [110, 164.81, 220, 277.18, 329.63];
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 2) * 4;
      const g = audioCtx.createGain();
      g.gain.value = 0.16 / freqs.length;
      // slow tremolo via LFO
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.017;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 0.5 / freqs.length;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      o.connect(g); g.connect(filter);
      o.start(); lfo.start();
    });

    // Soft "sea" — filtered noise swells.
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuf; noise.loop = true;
    const nFilter = audioCtx.createBiquadFilter();
    nFilter.type = "bandpass"; nFilter.frequency.value = 480; nFilter.Q.value = 0.4;
    const nGain = audioCtx.createGain(); nGain.gain.value = 0.05;
    noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(master);
    noise.start();
  }

  function fade(target, t) {
    if (!master) return;
    const now = audioCtx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), now + t);
  }

  function startAudio() {
    // Consent-first: sound is OFF by default and never begins from the gate gesture.
    // It plays only if the guest previously chose it on (persisted in localStorage).
    let pref = "off";
    try { pref = localStorage.getItem("nevis_audio") || "off"; } catch (e) {}
    if (pref !== "on") { setAudioUI(false); return; }
    enableAudio();
  }

  function enableAudio() {
    if (hasRealTrack) {
      audioEl.volume = 0.4;
      const p = audioEl.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      if (!started) { try { buildPad(); started = true; } catch (e) { return; } }
      if (audioCtx.state === "suspended") audioCtx.resume();
      fade(0.5, 4); // gentle — ambient, never loud
    }
    isOn = true; setAudioUI(true);
    try { localStorage.setItem("nevis_audio", "on"); } catch (e) {}
  }

  function disableAudio() {
    if (hasRealTrack) { audioEl.pause(); }
    else if (master) { fade(0.0001, 0.6); }
    isOn = false; setAudioUI(false);
    try { localStorage.setItem("nevis_audio", "off"); } catch (e) {}
  }

  function setAudioUI(on) {
    if (!audioToggle) return;
    audioToggle.classList.toggle("is-playing", on);
    audioToggle.classList.toggle("is-muted", !on);
    audioToggle.setAttribute("aria-pressed", String(on));
    audioToggle.setAttribute("aria-label", on ? "Mute ambient sound" : "Play ambient sound");
  }

  if (audioToggle) audioToggle.addEventListener("click", () => {
    if (isOn) disableAudio(); else enableAudio();
  });

  /* ---------- HEADER state + MENU ---------- */
  const header = $("#header");
  const hero = $(".hero");
  const menu = $("#menu");
  const navToggle = $("#navToggle");

  const headerObs = new IntersectionObserver(
    ([e]) => {
      header.classList.toggle("on-hero", e.isIntersecting && e.intersectionRatio > 0.1);
      header.classList.toggle("scrolled", !(e.isIntersecting && e.intersectionRatio > 0.1));
    },
    { threshold: [0, 0.1, 0.9] }
  );
  if (hero) headerObs.observe(hero);

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    body.style.overflow = open ? "hidden" : "";
    if (open) { lockBackground(menu); $("#menuClose").focus(); }
    else { unlockBackground(); }
  }
  navToggle.addEventListener("click", () => setMenu(true));
  $("#menuClose").addEventListener("click", () => { setMenu(false); navToggle.focus(); });
  $$("#menu .menu__nav a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); navToggle.focus(); }
  });

  /* ---------- SCROLL REVEALS ---------- */
  const reveals = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((r) => r.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((r) => io.observe(r));
  }

  /* ---------- HERO PARALLAX (subtle cinematic depth) ---------- */
  if (!prefersReduced) {
    const heroMedia = $(".hero__media");
    if (heroMedia) {
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY || 0;
          if (y < window.innerHeight * 1.1) {
            heroMedia.style.transform = "translate3d(0," + (y * 0.1).toFixed(1) + "px,0)";
          }
          ticking = false;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- DEFER the closing photo until it's near (mobile data) ---------- */
  (function deferClosing() {
    const cbg = $(".closing__bg");
    if (!cbg) return;
    if (!("IntersectionObserver" in window)) { cbg.classList.add("loaded"); return; }
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) { cbg.classList.add("loaded"); obs.disconnect(); }
    }, { rootMargin: "400px 0px" });
    io.observe(cbg.closest(".closing") || cbg);
  })();

  /* ---------- COUNTDOWN ---------- */
  // Ceremony: Saturday, 8 May 2027, 4:00 PM Atlantic Standard Time (UTC−04:00).
  const target = new Date("2027-05-08T16:00:00-04:00").getTime();
  const cd = {
    days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'),
    mins: $('[data-cd="mins"]'),
  };
  const pad = (n) => String(n).padStart(2, "0");
  let cdTimer = null;
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      const cdEl = $("#countdown");
      if (cdEl) {
        // During the wedding day itself, celebrate; afterwards, settle into a keepsake.
        const dayMsg = diff > -86400000
          ? "Today is the day. ✦"
          : "Married on the island · May 8, 2027 · bon voyage";
        cdEl.innerHTML = '<p class="lede" style="margin:0">' + dayMsg + "</p>";
      }
      if (cdTimer) clearInterval(cdTimer); // stop the per-second timer for good
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    cd.days.textContent = pad(d); cd.hours.textContent = pad(h);
    cd.mins.textContent = pad(m);
  }
  if (cd.days) { tick(); cdTimer = setInterval(tick, 30000); } // calm, not a frantic per-second tick

  /* ---------- SCRATCH TO REVEAL (Save the Date) ---------- */
  (function scratchToReveal() {
    const canvas = $("#scratch");
    if (!canvas) return;
    const hint = $("#scratchHint");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let painting = false, cleared = false, painted = false, samples = 0;

    // Work entirely in device pixels (identity transform) so coverage is correct
    // regardless of any leftover transform state.
    function paintCover() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const W = canvas.width = Math.round(w * dpr), H = canvas.height = Math.round(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#2c2823"); g.addColorStop(0.5, "#3a352d"); g.addColorStop(1, "#241f18");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const s = ctx.createLinearGradient(0, 0, W, H);
      s.addColorStop(0.38, "rgba(255,255,255,0)");
      s.addColorStop(0.5, "rgba(255,255,255,0.06)");
      s.addColorStop(0.62, "rgba(255,255,255,0)");
      ctx.fillStyle = s; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "destination-out";
      painted = true;
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      // CSS coords → device pixels
      return { x: (p.clientX - r.left) * dpr, y: (p.clientY - r.top) * dpr };
    }
    function scratchAt(e) {
      if (!painting || cleared) return;
      const { x, y } = pos(e);
      ctx.beginPath(); ctx.arc(x, y, 30 * dpr, 0, Math.PI * 2); ctx.fill();
      maybeReveal();
    }
    function maybeReveal() {
      samples++;
      if (samples % 6 !== 0) return;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < img.length; i += 64) { total++; if (img[i] === 0) clear++; }
      if (clear / total > 0.45) revealAll();
    }
    function revealAll() {
      if (cleared) return;
      cleared = true;
      canvas.classList.add("is-cleared");
      if (hint) { hint.textContent = "We hope you’ll be there"; }
    }

    if (prefersReduced) {
      canvas.classList.add("is-cleared"); cleared = true;
      if (hint) hint.textContent = "We hope you’ll be there";
      return;
    }
    // Paint the cover immediately (it's just a gradient — no fonts needed), retrying
    // until the canvas has a real size; then repaint once the display font settles,
    // since the underlying date block may have reflowed to a new size.
    function ensurePainted() {
      paintCover();
      if (!painted) requestAnimationFrame(ensurePainted);
    }
    requestAnimationFrame(ensurePainted);
    if (document.fonts) document.fonts.ready.then(() => { if (!cleared) paintCover(); });

    const start = (e) => { painting = true; scratchAt(e); };
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", scratchAt);
    window.addEventListener("pointerup", () => { painting = false; });
    canvas.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); revealAll(); }
    });
    let rT;
    window.addEventListener("resize", () => {
      if (cleared || !painted) return;
      clearTimeout(rT);
      rT = setTimeout(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); paintCover(); }, 200);
    });
  })();

  /* ---------- RSVP ---------- */
  const form = $("#rsvpForm");
  if (form) {
    const ifYes = $("#ifYes");
    form.addEventListener("change", (e) => {
      if (e.target.name === "attending") {
        const yes = form.querySelector('[name="attending"]:checked')?.value === "yes";
        ifYes.classList.toggle("collapsed", !yes);
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      submitRSVP(data);
    });
  }

  function submitRSVP(data) {
    // --- INTEGRATION HOOK ---------------------------------------------------
    // This stores the reply locally and shows a confirmation. To wire a real
    // backend, POST `data` to your endpoint (or the couple's Lovable/Supabase
    // function) here, then resolve the confirmation on success.
    try {
      const all = JSON.parse(localStorage.getItem("nevis_rsvps") || "[]");
      all.push({ ...data, at: new Date().toISOString() });
      localStorage.setItem("nevis_rsvps", JSON.stringify(all));
    } catch (e) {}

    const form = $("#rsvpForm");
    const thanks = $("#rsvpThanks");
    const attending = data.attending === "yes";
    $("#thanksEyebrow").textContent = attending ? "Received with love" : "Thank you for letting us know";
    $("#thanksName").textContent = data.guestName
      ? (attending ? `See you on the island, ${data.guestName.split(" ")[0]}.` : `Thank you, ${data.guestName.split(" ")[0]}.`)
      : (attending ? "See you on the island." : "Thank you.");
    $("#thanksMsg").textContent = attending
      ? "Your reply is received with love. Details to follow as the day draws near."
      : "We'll miss you — but we're so grateful you let us know.";
    form.style.display = "none";
    thanks.classList.add("show");
    thanks.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  }

  /* ---------- GALLERY: fade images in on load + lightbox ---------- */
  const galleryImgs = $$(".gallery-grid .duo");
  galleryImgs.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) img.classList.add("loaded");
    else img.addEventListener("load", () => img.classList.add("loaded"), { once: true });
  });

  (function lightbox() {
    const box = $("#lightbox"), bimg = $("#lightboxImg"), count = $("#lightboxCount");
    const tiles = $$(".gallery-grid .tile");
    if (!box || !tiles.length) return;
    const items = tiles.map((t) => { const im = t.querySelector("img"); return { src: im.src, alt: im.alt }; });
    let idx = 0, lastFocus = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      bimg.src = items[idx].src;
      bimg.alt = items[idx].alt;
      count.textContent = (idx + 1) + " / " + items.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      body.classList.add("menu-open"); // hides the audio toggle too
      lockBackground(box);
      $("#lightboxClose").focus();
    }
    function close() {
      box.classList.remove("is-open");
      body.classList.remove("menu-open");
      unlockBackground();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    tiles.forEach((t, i) => {
      t.addEventListener("click", () => open(i));
      t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    $("#lightboxClose").addEventListener("click", close);
    $("#lightboxPrev").addEventListener("click", () => show(idx - 1));
    $("#lightboxNext").addEventListener("click", () => show(idx + 1));
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
    // touch swipe
    let sx = 0;
    box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  /* ---------- Smooth in-page anchors (respect reduced motion) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    });
  });
})();
