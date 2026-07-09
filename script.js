// Shuoning Shi — theme toggle + scroll reveal.
(function () {
  "use strict";

  var STORAGE_KEY = "theme";
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var icon = toggle ? toggle.querySelector(".theme-toggle__icon") : null;

  // ☾ shown in dark mode (click → light); ☀ shown in light mode.
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (icon) icon.textContent = theme === "dark" ? "☾" : "☀";
  }

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  var prefersLight =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(saved || (prefersLight ? "light" : "dark"));

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  // Footer year.
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Liquid-glass nav — inject refraction filter + build the mobile menu.
  (function setupNav() {
    if (!document.getElementById("liquidGlass")) {
      var holder = document.createElement("div");
      holder.setAttribute("aria-hidden", "true");
      holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
      holder.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<filter id="liquidGlass" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7" result="n"/>' +
        '<feGaussianBlur in="n" stdDeviation="1.1" result="sn"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="sn" scale="16" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter></svg>';
      document.body.appendChild(holder);
    }

    var nav = document.querySelector(".nav");
    var inner = nav && nav.querySelector(".nav__inner");
    var links = inner && inner.querySelector(".nav__links");
    if (!nav || !inner || !links) return;

    var btn = document.createElement("button");
    btn.className = "nav__toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";
    links.parentNode.insertBefore(btn, links);

    function setOpen(open) {
      nav.classList.toggle("nav--open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains("nav--open"));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!inner.contains(e.target)) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) setOpen(false);
    });
  })();

  // Intro animation — plays ONLY on a home refresh or when the name is clicked.
  var intro = document.getElementById("intro");

  function runIntro() {
    if (!intro) return;
    // clone the inner so the CSS animations restart from the top on every replay
    var inner = intro.querySelector(".intro__inner");
    if (inner) { var fresh = inner.cloneNode(true); inner.parentNode.replaceChild(fresh, inner); }
    intro.classList.remove("is-done");
    document.body.style.overflow = "hidden";
    var finished = false;
    function end() {
      if (finished) return;
      finished = true;
      intro.classList.add("is-done");
      document.body.style.overflow = "";
    }
    var timer = setTimeout(end, 5600);
    intro.addEventListener("click", function h() { clearTimeout(timer); end(); intro.removeEventListener("click", h); });
    document.addEventListener("keydown", function onKey() { clearTimeout(timer); end(); document.removeEventListener("keydown", onKey); });
  }

  if (intro) {
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // detect a page reload
    var navType = "navigate";
    try {
      var navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (navEntry) navType = navEntry.type;
      else if (performance.navigation) navType = performance.navigation.type === 1 ? "reload" : "navigate";
    } catch (e) {}
    // a click on the name from another page sets this flag before navigating here
    var flagged = false;
    try { flagged = sessionStorage.getItem("playIntro") === "1"; sessionStorage.removeItem("playIntro"); } catch (e) {}

    if (!reduceMotion && (navType === "reload" || flagged)) runIntro();
    else intro.classList.add("is-done");
  }

  // Brand (top-left name) — clicking replays the intro.
  var brand = document.querySelector(".nav__brand");
  if (brand) {
    brand.addEventListener("click", function (e) {
      if (intro) {                       // we're on the home page
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        runIntro();
      } else {                           // on another page → flag, then let it navigate home
        try { sessionStorage.setItem("playIntro", "1"); } catch (err) {}
      }
    });
  }

  // Scroll reveal — stagger items within the same row.
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !items.length) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        var el = entry.target;
        el.style.transitionDelay = (i % 3) * 80 + "ms";
        el.classList.add("is-visible");
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach(function (el) { io.observe(el); });
})();

/* Glowing blue cursor orb — precise dot + trailing glow (fine pointers only) */
(function () {
  if (!window.matchMedia || !matchMedia("(pointer:fine)").matches) return;
  var glow = document.createElement("div"); glow.className = "cursor-glow";
  var dot = document.createElement("div"); dot.className = "cursor-dot";
  document.body.appendChild(glow); document.body.appendChild(dot);
  document.documentElement.classList.add("has-orb");
  var gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, seen = false;
  var hotSel = "a,button,label,input,textarea,.hub-card,.seg__btn,.slot,.uchip";
  addEventListener("pointermove", function (e) {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = "translate(-50%,-50%) translate(" + tx + "px," + ty + "px)";
    if (!seen) { seen = true; glow.style.opacity = 1; dot.style.opacity = 1; }
  }, { passive: true });
  addEventListener("pointerdown", function () { dot.classList.add("down"); glow.classList.add("down"); });
  addEventListener("pointerup", function () { dot.classList.remove("down"); glow.classList.remove("down"); });
  addEventListener("pointerover", function (e) { if (e.target.closest && e.target.closest(hotSel)) glow.classList.add("hot"); });
  addEventListener("pointerout", function (e) { if (e.target.closest && e.target.closest(hotSel)) glow.classList.remove("hot"); });
  document.addEventListener("mouseleave", function () { glow.style.opacity = 0; dot.style.opacity = 0; });
  document.addEventListener("mouseenter", function () { if (seen) { glow.style.opacity = 1; dot.style.opacity = 1; } });
  (function loop() {
    gx += (tx - gx) * 0.18; gy += (ty - gy) * 0.18;
    glow.style.transform = "translate(-50%,-50%) translate(" + gx + "px," + gy + "px)";
    requestAnimationFrame(loop);
  })();
})();
