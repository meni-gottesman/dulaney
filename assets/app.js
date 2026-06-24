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

  /* ---------- ENTRY GATE (home page only) — the opening film ----------
     The couple's "J&M" wax-heart envelope. It plays ONLY on a tap (poster +
     "Tap to open" until then), with the film's own letter-opening sound, blooms
     to white, and the site fades in from white. As the film ends, that sound
     crossfades into the looping ambient track. Phones get a more zoomed-out
     portrait cut. Audio is ON by default (a prior mute is respected). */
  const gate = $("#gate");
  const gateVideo = $("#gateVideo");
  let opened = false;

  if (gate && gateVideo) {
    var exitGate = function (focusTarget) {
      if (opened) return;
      opened = true;
      gate.classList.add("is-open");
      body.classList.remove("is-sealed");
      body.classList.add("entered");
      unlockBackground();
      try { sessionStorage.setItem("nevis_entered", "1"); } catch (e) {}
      try { gateVideo.pause(); } catch (e) {}
      const t = focusTarget || $("#top");
      if (t) t.focus({ preventScroll: true });
    };

    // film's own audio on the tap → crossfade into the looping track
    function startOpeningAudio() {
      var want = "on";
      try { want = localStorage.getItem("nevis_audio") || "on"; } catch (e) {}
      if (want === "off") { setAudioUI(false); return; }
      if (hasRealTrack) playLoop();  // the film is muted; play ONLY the looping music (reliable on iOS)
      isOn = true; setAudioUI(true);
      try { localStorage.setItem("nevis_audio", "on"); } catch (e) {}
    }

    let returning = false;
    try { returning = sessionStorage.getItem("nevis_entered") === "1"; } catch (e) {}

    if (returning) {
      gate.classList.add("is-instant");
      exitGate();
    } else if (prefersReduced) {
      // honour reduced motion: hold on the sealed poster, enter on tap
      lockBackground(gate);
      gate.addEventListener("click", function () { startAudio(); exitGate(); });
    } else {
      lockBackground(gate);
      let clicked = false;
      const playFilm = function () {
        if (opened) return;
        const p = gateVideo.play();
        if (p && p.catch) p.catch(function () {});
      };
      gateVideo.addEventListener("playing", function () { gate.classList.add("is-playing"); });
      gateVideo.addEventListener("ended", function () {
        // line the song's swell up with the reveal: if the audio is still in the
        // envelope/quiet part when the film ends, jump it to the swell-in point.
        try { if (audioEl && hasRealTrack && !audioEl.paused && audioEl.currentTime < SONG_FADE_START) audioEl.currentTime = SONG_FADE_START; } catch (e) {}
        exitGate();
      });
      gateVideo.addEventListener("error", function () { if (clicked) window.setTimeout(exitGate, 400); });
      gate.addEventListener("click", function () { if (!opened && !clicked) { clicked = true; startOpeningAudio(); playFilm(); } });
    }
  } else {
    // No gate on this page — show content immediately.
    body.classList.remove("is-sealed");
    body.classList.add("entered");
  }

  /* ---------- AMBIENT AUDIO ----------
     The looping track plays through a Web Audio gain node so volume/fades work
     even on iOS (where HTMLMediaElement.volume is read-only and a deferred play
     won't start). Falls back to a synthesized pad if no <source> is present. */
  const audioToggle = $("#audioToggle");
  const audioEl = $("#audioEl");
  const hasRealTrack = audioEl && audioEl.querySelector("source");
  let audioCtx, master, started = false, isOn = false;

  // Play the looping <audio> as simply as possible — the only thing iOS reliably
  // honours: a bare .play() on ONE media element inside a user gesture. No Web
  // Audio, no volume changes (both are ignored/unreliable on iOS); the file is
  // pre-leveled so it sits gently, and the gate video is MUTED so it never steals
  // the audio session from this element.
  function playLoop() {
    if (!hasRealTrack) return;
    const p = audioEl.play(); if (p && p.catch) p.catch(function () {});
  }
  function pauseLoop() {
    if (hasRealTrack) { try { audioEl.pause(); } catch (e) {} }
  }

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
    // The ambient track begins on the tap-to-open gesture (a valid user gesture),
    // unless the guest muted it on a previous visit. They can mute any time.
    let pref = "on";
    try { pref = localStorage.getItem("nevis_audio") || "on"; } catch (e) {}
    if (pref !== "on") { setAudioUI(false); return; }
    enableAudio();
  }

  function enableAudio() {
    if (hasRealTrack) {
      playLoop();
    } else {
      if (!started) { try { buildPad(); started = true; } catch (e) { return; } }
      if (audioCtx.state === "suspended") audioCtx.resume();
      fade(0.5, 4);
    }
    isOn = true; setAudioUI(true);
    try { localStorage.setItem("nevis_audio", "on"); } catch (e) {}
  }

  function disableAudio() {
    if (hasRealTrack) { pauseLoop(); }
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

  // ambient.mp3 = [envelope-opening sound 0–5.4s] → [song swells in from 5.4s] →
  // plays at full to ~10s → a gentle 6s fade-out, ending silent at ~16s. It plays
  // ONCE (no loop): the fade-out is baked into the file so it works on iOS too,
  // where HTMLMediaElement.volume is read-only and can't be ramped in JS.
  const SONG_FADE_START = 5.4; // the song begins swelling here (≈ the film's white-out / reveal)
  // Keep the control in sync with the element's REAL state (prevents the
  // "click twice" bug where the UI said 'on' but nothing was actually playing).
  if (audioEl) {
    audioEl.addEventListener("ended", function () { isOn = false; setAudioUI(false); }); // track faded out — reflect "off"
    audioEl.addEventListener("playing", function () { isOn = true; setAudioUI(true); });
    audioEl.addEventListener("pause", function () { if (hasRealTrack && audioEl.currentTime < audioEl.duration - 0.5) { isOn = false; setAudioUI(false); } });
  }

  // The <audio> starts at preload="metadata" so the 2.3MB track never competes with
  // the opening for bandwidth. Once the page has painted and gone idle, quietly buffer
  // it in the background so it's ready the instant the guest taps (no envelope-sound lag).
  // (iOS ignores media preload until a gesture either way, so this is a desktop/Android win.)
  if (audioEl && hasRealTrack) {
    var warmAudio = function () {
      if (!audioEl.paused || audioEl.currentTime > 0) return; // already started — don't disturb it
      try { audioEl.preload = "auto"; audioEl.load(); } catch (e) {}
    };
    var scheduleWarm = function () {
      if ("requestIdleCallback" in window) requestIdleCallback(warmAudio, { timeout: 2500 });
      else window.setTimeout(warmAudio, 700);
    };
    if (document.readyState === "complete") scheduleWarm();
    else window.addEventListener("load", scheduleWarm);
  }

  if (audioToggle) audioToggle.addEventListener("click", function () {
    var playing = hasRealTrack ? (audioEl && !audioEl.paused) : isOn;
    if (playing) disableAudio(); else enableAudio();
  });

  // Stop the music the moment the guest leaves or backgrounds the site — otherwise
  // phones can keep it playing for a long time after they've moved on (the reported
  // "it played for hours" bug). We only pause; the saved on/off preference is left
  // untouched, so the music returns on the guest's next visit.
  function silenceOnExit() {
    if (hasRealTrack) { pauseLoop(); }
    else if (audioCtx && master) { try { fade(0.0001, 0.25); if (audioCtx.state === "running") audioCtx.suspend(); } catch (e) {} }
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) silenceOnExit(); });
  window.addEventListener("pagehide", silenceOnExit);

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

  /* ---------- SAVE THE DATE — three hearts, scratch to reveal ----------
     Each heart hides one of Day · Month · Year; scratch (or Enter) clears the
     ocean-toned cover. When all three are open, the line beneath fades in.
     No countdown — the date stays a surprise until the guest uncovers it. */
  (function saveTheDate() {
    const hearts = $("#hearts");
    if (!hearts) return;
    const cue = $("#heartsCue");
    const revealedLine = $("#savedateRevealed");
    const canvases = $$(".heart__cover", hearts);
    if (!canvases.length) return;

    let openedCount = 0;
    function onHeartOpen() {
      if (++openedCount < canvases.length) return;
      hearts.classList.add("unlocked");
      if (cue) cue.style.opacity = "0";
      if (revealedLine) revealedLine.classList.add("revealed");
      startCountdown(); // the date is uncovered now, so a countdown gives nothing away
    }

    function startCountdown() {
      const cd = $("#countdown");
      if (!cd || cd.dataset.started) return;
      cd.dataset.started = "1";
      // Ceremony: Friday, 7 May 2027, 5:00 PM Atlantic Standard Time (UTC−04:00).
      const target = new Date("2027-05-07T17:00:00-04:00").getTime();
      const dEl = cd.querySelector('[data-cd="days"]');
      const hEl = cd.querySelector('[data-cd="hours"]');
      const mEl = cd.querySelector('[data-cd="mins"]');
      const pad = function (n) { return String(n).padStart(2, "0"); };
      let timer = null;
      function tick() {
        const diff = target - Date.now();
        if (diff <= 0) {
          cd.innerHTML = '<p class="savedate__line" style="margin:0">Today is the day. ✦</p>';
          if (timer) clearInterval(timer);
          return;
        }
        dEl.textContent = pad(Math.floor(diff / 86400000));
        hEl.textContent = pad(Math.floor((diff % 86400000) / 3600000));
        mEl.textContent = pad(Math.floor((diff % 3600000) / 60000));
      }
      tick();
      timer = setInterval(tick, 30000); // calm, not a frantic per-second tick
    }

    function makeHeart(canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      let drawing = false, cleared = false, samples = 0, painted = false;

      function paint() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return false;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        g.addColorStop(0, "#2f5d6b"); g.addColorStop(1, "#21424c"); // Caribbean-toned cover
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-out";
        painted = true; return true;
      }
      function posOf(e) {
        const r = canvas.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return { x: (p.clientX - r.left) * dpr, y: (p.clientY - r.top) * dpr };
      }
      function scratch(e) {
        if (!drawing || cleared || !painted) return;
        if (e.cancelable && e.type === "touchmove") e.preventDefault();
        const { x, y } = posOf(e);
        ctx.beginPath(); ctx.arc(x, y, canvas.width * 0.24, 0, Math.PI * 2); ctx.fill();
        if (++samples % 4 === 0) check();
      }
      function check() {
        if (cleared) return;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let clear = 0, total = 0;
        for (let i = 3; i < data.length; i += 64) { total++; if (data[i] < 128) clear++; }
        if (clear / total > 0.5) reveal();
      }
      function reveal() {
        if (cleared) return;
        cleared = true;
        canvas.classList.add("is-cleared");
        onHeartOpen();
      }

      let downX = 0, downY = 0, moved = false;
      const TAP_SLOP = 10; // px of travel under which a press counts as a tap, not a scratch

      canvas.addEventListener("pointerdown", function (e) {
        drawing = true; moved = false; downX = e.clientX; downY = e.clientY;
        try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
        scratch(e);
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!moved && (Math.abs(e.clientX - downX) > TAP_SLOP || Math.abs(e.clientY - downY) > TAP_SLOP)) moved = true;
        scratch(e);
      });
      canvas.addEventListener("pointerup", function () {
        drawing = false;
        // A simple TAP (no real dragging) reveals the whole heart, so no guest is left
        // unsure how to "scratch". A drag still scratches and reveals past halfway.
        if (!moved) reveal();
      });
      canvas.addEventListener("pointercancel", function () { drawing = false; });
      canvas.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); }
      });

      return {
        paint: paint,
        repaint: function () { if (!cleared) paint(); },
        setDpr: function () { dpr = Math.min(window.devicePixelRatio || 1, 2); },
        reveal: reveal,
      };
    }

    const cards = canvases.map(makeHeart);

    // Reduced motion: skip the ritual, show the date straight away.
    if (prefersReduced) { cards.forEach(function (c) { c.reveal(); }); return; }

    // Paint the covers once the hearts are laid out & in view (real canvas size).
    let allPainted = false;
    function paintAll() {
      if (allPainted) return;
      let ok = true;
      cards.forEach(function (c) { if (!c.paint()) ok = false; });
      if (ok) allPainted = true;
    }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { paintAll(); if (allPainted) io.disconnect(); } });
      }, { threshold: 0.2 });
      io.observe(hearts);
    }
    requestAnimationFrame(paintAll);
    if (document.fonts) document.fonts.ready.then(paintAll);

    let rT;
    window.addEventListener("resize", function () {
      clearTimeout(rT);
      rT = setTimeout(function () { cards.forEach(function (c) { c.setDpr(); c.repaint(); }); }, 200);
    });
  })();

  /* ---------- RSVP — form · public guest list · hosts admin ----------
     Data lives in a Google Sheet via an Apps Script web app (see RSVP_ENDPOINT).
     With no endpoint set it runs in LOCAL DEMO mode (this browser only) so the
     flow can be shown before the couple connects their Sheet. The admin password
     is verified SERVER-SIDE by the Apps Script in live mode. */
  (function rsvp() {
    const form = $("#rsvpForm");
    if (!form) return;

    // ===== CONFIG — set these to go live ===================================
    // Paste the Apps Script web-app URL (…/exec). Empty = local demo mode.
    const RSVP_ENDPOINT = "";
    // Demo-only password (local mode). In live mode the REAL password lives in
    // the Apps Script, NOT here — this value is ignored when an endpoint is set.
    const DEMO_ADMIN_PASSWORD = "dulaney2027";
    // =======================================================================
    const LIVE = !!RSVP_ENDPOINT;
    if (!LIVE) console.warn("[RSVP] Demo mode (saves to this browser only). Set RSVP_ENDPOINT in assets/app.js — see README §6 — to collect replies in your Google Sheet.");

    /* ----- data layer (swaps between the Sheet API and local demo) ----- */
    function gas(payload) {
      return fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // simple req → no CORS preflight
        body: JSON.stringify(payload),
        redirect: "follow",
      }).then((r) => r.json());
    }
    const LS_KEY = "nevis_rsvps_v2";
    const lsAll = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } };
    const lsSave = (a) => { try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {} };
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const pub = (r) => ({ name: r.name, party: r.party, companions: r.companions || [] });
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    const api = {
      submit(rec) {
        if (LIVE) return gas({ action: "submit", record: rec });
        const all = lsAll();
        const i = all.findIndex((r) => (r.email || "").toLowerCase() === rec.email.toLowerCase());
        const saved = Object.assign({ id: i >= 0 ? all[i].id : uid() }, rec, { updated: new Date().toISOString() });
        if (i >= 0) all[i] = saved; else all.push(saved);
        lsSave(all);
        return Promise.resolve({ ok: true, record: saved });
      },
      listPublic() {
        if (LIVE) return gas({ action: "list" }).then((r) => r.guests || []);
        return Promise.resolve(lsAll().filter((r) => r.attending === "yes").map(pub));
      },
      adminAuth(pw) {
        if (LIVE) return gas({ action: "admin", password: pw });
        return Promise.resolve(pw === DEMO_ADMIN_PASSWORD ? { ok: true, guests: lsAll() } : { ok: false });
      },
      adminUpdate(pw, id, fields) {
        if (LIVE) return gas({ action: "update", password: pw, id: id, fields: fields });
        const all = lsAll(); const r = all.find((x) => x.id === id);
        if (r) { Object.assign(r, fields); lsSave(all); }
        return Promise.resolve({ ok: true, guests: all });
      },
      adminRemove(pw, id) {
        if (LIVE) return gas({ action: "remove", password: pw, id: id });
        const all = lsAll().filter((x) => x.id !== id); lsSave(all);
        return Promise.resolve({ ok: true, guests: all });
      },
    };

    /* ----- companions (who's coming with you) ----- */
    const companionsWrap = $("#companions");
    function addCompanion(value) {
      const row = document.createElement("div");
      row.className = "companion";
      row.innerHTML = '<input type="text" class="companion__name" placeholder="Guest name" autocomplete="off" />' +
        '<button type="button" class="companion__remove" aria-label="Remove guest">×</button>';
      row.querySelector(".companion__name").value = value || "";
      row.querySelector(".companion__remove").addEventListener("click", () => row.remove());
      companionsWrap.appendChild(row);
      return row;
    }
    const getCompanions = () => $$(".companion__name", companionsWrap).map((i) => i.value.trim()).filter(Boolean);
    const setCompanions = (arr) => { companionsWrap.innerHTML = ""; (arr || []).forEach((n) => addCompanion(n)); };
    const addBtn = $("#addCompanion");
    if (addBtn) addBtn.addEventListener("click", () => addCompanion().querySelector("input").focus());

    /* ----- attending toggle ----- */
    const ifYes = $("#ifYes");
    function syncIfYes() {
      const yes = (form.querySelector('[name="attending"]:checked') || {}).value === "yes";
      ifYes.classList.toggle("collapsed", !yes);
    }
    form.addEventListener("change", (e) => { if (e.target.name === "attending") syncIfYes(); });
    syncIfYes();

    /* ----- submit ----- */
    const statusEl = $("#rsvpStatus");
    const thanks = $("#rsvpThanks");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const attending = (form.querySelector('[name="attending"]:checked') || {}).value || "no";
      const companions = attending === "yes" ? getCompanions() : [];
      const rec = {
        name: $("#guestName").value.trim(),
        email: $("#guestEmail").value.trim(),
        attending: attending,
        companions: companions,
        party: attending === "yes" ? 1 + companions.length : 0,
        song: ($("#weddingSong").value || "").trim(),
        roomBooked: attending === "yes" ? ((form.querySelector('[name="roomBooked"]:checked') || {}).value || "") : "",
        note: ($("#note").value || "").trim(),
      };
      const btn = $("#rsvpSubmit");
      btn.disabled = true; statusEl.textContent = "Sending…";
      api.submit(rec).then(() => {
        try { localStorage.setItem("nevis_my_rsvp", JSON.stringify(rec)); } catch (x) {}
        statusEl.textContent = "";
        showThanks(rec);
        loadGuestList();
      }).catch(() => { statusEl.textContent = "Hmm — that didn’t send. Please try again."; })
        .then(() => { btn.disabled = false; });
    });

    function showThanks(rec) {
      const attending = rec.attending === "yes";
      const first = rec.name ? rec.name.split(" ")[0] : "";
      $("#thanksEyebrow").textContent = attending ? "Received with love" : "Thank you for letting us know";
      $("#thanksName").textContent = attending
        ? (first ? "See you on the island, " + first + "." : "See you on the island.")
        : (first ? "Thank you, " + first + "." : "Thank you.");
      $("#thanksMsg").textContent = attending
        ? (rec.party > 1 ? "Your party of " + rec.party + " is on the list. Details to follow." : "Your reply is received with love. Details to follow.")
        : "We’ll miss you — but we’re so grateful you let us know.";
      form.style.display = "none";
      thanks.classList.add("show");
      thanks.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
    }

    /* ----- change my reply (this device) ----- */
    const editAgain = $("#rsvpEditAgain");
    if (editAgain) editAgain.addEventListener("click", () => {
      thanks.classList.remove("show");
      form.style.display = "";
      try {
        const mine = JSON.parse(localStorage.getItem("nevis_my_rsvp") || "null");
        if (mine) {
          $("#guestName").value = mine.name || "";
          $("#guestEmail").value = mine.email || "";
          const r = form.querySelector('[name="attending"][value="' + mine.attending + '"]'); if (r) r.checked = true;
          $("#weddingSong").value = mine.song || "";
          if (mine.roomBooked) { const rb = form.querySelector('[name="roomBooked"][value="' + mine.roomBooked + '"]'); if (rb) rb.checked = true; }
          $("#note").value = mine.note || "";
          setCompanions(mine.companions);
          syncIfYes();
        }
      } catch (x) {}
      form.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
    });

    /* ----- public guest list ----- */
    const glItems = $("#guestlistItems");
    const glCount = $("#guestlistCount");
    const glEmpty = $("#guestlistEmpty");
    function loadGuestList() {
      api.listPublic().then((guests) => {
        glItems.innerHTML = "";
        if (!guests.length) { glCount.innerHTML = "&nbsp;"; glEmpty.hidden = false; return; }
        glEmpty.hidden = true;
        const total = guests.reduce((s, g) => s + (Number(g.party) || 1), 0);
        glCount.textContent = total + (total === 1 ? " coming, so far" : " coming, so far");
        guests.forEach((g) => {
          const li = document.createElement("li");
          li.className = "guestlist__item";
          const withText = (g.companions && g.companions.length) ? "with " + g.companions.join(", ") : "";
          const partyText = g.party > 1 ? "party of " + g.party : "";
          const meta = [partyText, withText].filter(Boolean).join(" · ");
          li.innerHTML = '<span class="g-name">' + esc(g.name) + "</span>" + (meta ? '<span class="g-meta">' + esc(meta) + "</span>" : "");
          glItems.appendChild(li);
        });
      }).catch(() => {});
    }
    loadGuestList();

    /* ----- hosts admin (password-gated) ----- */
    const admin = $("#admin");
    if (admin) {
      const adminGate = $("#adminGate");
      const adminPanel = $("#adminPanel");
      const adminErr = $("#adminError");
      const adminList = $("#adminList");
      const adminSummary = $("#adminSummary");
      let adminPw = "", adminGuests = [];

      const openAdmin = () => { admin.hidden = false; body.classList.add("menu-open"); $("#adminPw").focus(); };
      const closeAdmin = () => { admin.hidden = true; body.classList.remove("menu-open"); if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search); };
      const hostsLink = $("#hostsLink"); if (hostsLink) hostsLink.addEventListener("click", (e) => { e.preventDefault(); openAdmin(); });
      const adminCloseBtn = $("#adminClose"); if (adminCloseBtn) adminCloseBtn.addEventListener("click", closeAdmin);
      if (location.hash === "#admin") openAdmin();

      adminGate.addEventListener("submit", (e) => {
        e.preventDefault();
        const pw = $("#adminPw").value;
        adminErr.textContent = "Checking…";
        api.adminAuth(pw).then((res) => {
          if (res && res.ok) {
            adminPw = pw; adminGuests = res.guests || [];
            adminGate.hidden = true; adminPanel.hidden = false; adminErr.textContent = "";
            renderAdmin();
          } else { adminErr.textContent = "That password didn’t match."; }
        }).catch(() => { adminErr.textContent = "Couldn’t reach the guest list. Please try again."; });
      });

      function renderAdmin() {
        const yes = adminGuests.filter((g) => g.attending === "yes");
        const heads = yes.reduce((s, g) => s + (Number(g.party) || 1), 0);
        adminSummary.textContent = adminGuests.length + (adminGuests.length === 1 ? " reply" : " replies") + " · " +
          yes.length + " coming (" + heads + (heads === 1 ? " guest" : " guests") + ") · " +
          adminGuests.filter((g) => g.attending === "no").length + " declined";
        adminList.innerHTML = "";
        adminGuests.slice().sort((a, b) => (b.updated || "").localeCompare(a.updated || "")).forEach((g) => {
          const row = document.createElement("div");
          row.className = "admin-row";
          const party = g.attending === "yes" ? "party of " + (g.party || 1) + ((g.companions && g.companions.length) ? ": " + esc(g.companions.join(", ")) : "") : "";
          row.innerHTML =
            '<div class="admin-row__main"><span class="admin-row__name">' + esc(g.name) + '</span>' +
            '<span class="admin-row__email">' + esc(g.email) + '</span></div>' +
            '<div class="admin-row__meta"><span class="tag ' + (g.attending === "yes" ? "tag--yes" : "tag--no") + '">' + (g.attending === "yes" ? "Coming" : "Declined") + '</span>' +
            (party ? '<span class="admin-row__party">' + party + '</span>' : "") +
            (g.song ? '<span class="admin-row__song">♪ ' + esc(g.song) + '</span>' : "") +
            (g.roomBooked ? '<span class="admin-row__room tag ' + (g.roomBooked === "yes" ? "tag--yes" : "tag--no") + '">Room: ' + (g.roomBooked === "yes" ? "booked" : "not yet") + '</span>' : "") +
            (g.note ? '<span class="admin-row__note">“' + esc(g.note) + '”</span>' : "") + '</div>' +
            '<div class="admin-row__actions"><button type="button" class="link-btn" data-toggle="' + g.id + '">' + (g.attending === "yes" ? "Mark declined" : "Mark coming") + '</button>' +
            '<button type="button" class="link-btn link-btn--danger" data-remove="' + g.id + '">Remove</button></div>';
          adminList.appendChild(row);
        });
        $$("[data-toggle]", adminList).forEach((b) => b.addEventListener("click", () => {
          const id = b.getAttribute("data-toggle"), g = adminGuests.find((x) => x.id === id);
          const next = g.attending === "yes" ? "no" : "yes";
          api.adminUpdate(adminPw, id, { attending: next, party: next === "yes" ? (g.party || 1) : 0 }).then((res) => { adminGuests = res.guests || adminGuests; renderAdmin(); loadGuestList(); });
        }));
        $$("[data-remove]", adminList).forEach((b) => b.addEventListener("click", () => {
          const id = b.getAttribute("data-remove"), g = adminGuests.find((x) => x.id === id);
          if (!window.confirm("Remove " + (g ? g.name : "this guest") + " from the list?")) return;
          api.adminRemove(adminPw, id).then((res) => { adminGuests = res.guests || adminGuests; renderAdmin(); loadGuestList(); });
        }));
      }

      const csvBtn = $("#downloadCsv");
      const csvCell = (v) => { v = String(v == null ? "" : v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      if (csvBtn) csvBtn.addEventListener("click", () => {
        const rows = [["Name", "Email", "Attending", "Party", "Companions", "Wedding song", "Room booked", "Note", "Updated"]];
        adminGuests.forEach((g) => rows.push([g.name, g.email, g.attending, g.party || "", (g.companions || []).join("; "), g.song || "", g.roomBooked || "", g.note || "", g.updated || ""]));
        const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
        a.download = "dulaney-rsvps.csv";
        document.body.appendChild(a); a.click(); a.remove();
      });
    }
  })();

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
