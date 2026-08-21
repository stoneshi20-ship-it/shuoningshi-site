// Shuoning Shi — theme toggle + scroll reveal.
(function () {
  "use strict";

  var STORAGE_KEY = "theme";
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var icon = toggle ? toggle.querySelector(".theme-toggle__icon") : null;

  // ☾ shown in dark mode (click → light); ☀ shown in light mode.
  // ︎ = text-presentation selector so mobile renders the mono glyph, not a colour emoji.
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (icon) icon.textContent = theme === "dark" ? "☾︎" : "☀︎";
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

  // Follow the system theme live — but only while the user hasn't picked one manually.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: light)");
    var onSysChange = function (e) {
      var s = null; try { s = localStorage.getItem(STORAGE_KEY); } catch (err) {}
      if (!s) applyTheme(e.matches ? "light" : "dark");
    };
    if (mq.addEventListener) mq.addEventListener("change", onSysChange);
    else if (mq.addListener) mq.addListener(onSysChange);
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
  // Zoom guard — if the page is zoomed (browser Cmd+/− or pinch), the small
  // custom dot is hard to find, so hand control back to the native cursor.
  var baseDPR = window.devicePixelRatio || 1;
  function checkZoom() {
    var z = (window.visualViewport && window.visualViewport.scale > 1.01) ||
            (Math.abs((window.devicePixelRatio || 1) - baseDPR) > 0.02);
    document.documentElement.classList.toggle("no-orb", !!z);
  }
  addEventListener("resize", checkZoom, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", checkZoom, { passive: true });
  checkZoom();
})();
