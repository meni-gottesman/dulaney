/* ============================================================================
   PRIVATE ACCESS GATE — the Dulaney site
   ----------------------------------------------------------------------------
   A password screen shown before anything else. IMPORTANT, by design honest:
   this is a DETERRENT, not server-grade security. On static hosting the page is
   delivered to the browser, so a determined person can bypass a client-side
   check; and a true per-IP limit needs a server. So: the password is stored
   only as a SHA-256 HASH (never in plain text), and attempts are capped per
   device/browser (the closest static equivalent of "per IP").
   ========================================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  if (!html.classList.contains("locked")) return; // access already granted on this device

  var PW_HASH = "46b259a44f6700358882501fcaa538c9bde2cdd38a6bcbec395685f39f0e525e"; // SHA-256 of the access password
  var MAX_ATTEMPTS = 5;
  var ACCESS_KEY = "nevis_access_v1";
  var ATTEMPT_KEY = "nevis_access_attempts_v1";

  var getAttempts = function () { try { return parseInt(localStorage.getItem(ATTEMPT_KEY) || "0", 10) || 0; } catch (e) { return 0; } };
  var setAttempts = function (n) { try { localStorage.setItem(ATTEMPT_KEY, String(n)); } catch (e) {} };

  function sha256hex(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  function grantAccess() {
    try { localStorage.setItem(ACCESS_KEY, "granted"); } catch (e) {}
    try { localStorage.removeItem(ATTEMPT_KEY); } catch (e) {}
    html.classList.remove("locked");
    html.style.overflow = "";
    if (document.body) document.body.style.overflow = "";
    var el = document.getElementById("lockscreen");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    if (!document.body) return;
    var overlay = document.createElement("div");
    overlay.id = "lockscreen";
    overlay.className = "lockscreen";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Private — password required");
    overlay.innerHTML =
      '<div class="lockscreen__inner">' +
        '<p class="lockscreen__eyebrow">Private</p>' +
        '<h1 class="lockscreen__title display">By invitation</h1>' +
        '<form class="lockscreen__form" id="lockForm" novalidate>' +
          '<label class="lockscreen__label" for="lockPw">Enter the password to continue</label>' +
          '<input class="lockscreen__input" type="password" id="lockPw" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />' +
          '<button class="lockscreen__btn" type="submit" id="lockSubmit">Enter</button>' +
          '<p class="lockscreen__error" id="lockError" role="alert" aria-live="polite"></p>' +
        '</form>' +
        '<p class="lockscreen__legal">This website and all of its contents are the property of <strong>Meni David Gottesman</strong>. Access is by permission only; any unauthorized access, use, reproduction, or distribution is prohibited and will be pursued to the fullest extent of the law.</p>' +
      '</div>';
    document.body.appendChild(overlay);

    var form = document.getElementById("lockForm");
    var input = document.getElementById("lockPw");
    var btn = document.getElementById("lockSubmit");
    var err = document.getElementById("lockError");

    function lockOut() {
      input.disabled = true; btn.disabled = true;
      overlay.classList.add("is-locked-out");
      err.textContent = "Too many attempts. Access has been locked on this device.";
    }

    if (getAttempts() >= MAX_ATTEMPTS) { lockOut(); }
    else { try { input.focus(); } catch (e) {} }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (getAttempts() >= MAX_ATTEMPTS) { lockOut(); return; }
      var val = input.value || "";
      btn.disabled = true; err.textContent = "Checking…";
      sha256hex(val).then(function (h) {
        if (h === PW_HASH) { grantAccess(); return; }
        var n = getAttempts() + 1; setAttempts(n);
        var left = MAX_ATTEMPTS - n;
        if (left <= 0) { lockOut(); return; }
        err.textContent = "Incorrect password — " + left + (left === 1 ? " attempt" : " attempts") + " remaining.";
        input.value = ""; input.focus(); btn.disabled = false;
      }).catch(function () {
        err.textContent = "Something went wrong — please try again.";
        btn.disabled = false;
      });
    });
  });
})();
