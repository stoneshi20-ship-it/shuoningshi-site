// Photo Framer — local, in-browser. 3 frames + free reposition + eyedropper swatches.
(function () {
  "use strict";

  var stage  = document.getElementById("stage");
  var canvas = document.getElementById("framer-canvas");
  var drop   = document.getElementById("drop");
  var file   = document.getElementById("file");
  var hint   = document.getElementById("hint");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var typeSeg = document.getElementById("type-seg");
  var sizeSeg = document.getElementById("size-seg");
  var orientSeg = document.getElementById("orient-seg");
  var mBorder = document.getElementById("m-border");
  var mGrad = document.getElementById("m-grad");
  var gradRow = document.getElementById("grad-row");
  var frameColorRow = document.getElementById("framecolor-row");
  var labelGroup = document.getElementById("label-group");
  var mTitle = document.getElementById("m-title");
  var mCamera = document.getElementById("m-camera");
  var mFilm = document.getElementById("m-film");
  var oLabel = document.getElementById("o-label");
  var labelSub = document.getElementById("label-sub");
  var swRow = document.getElementById("swatch-row");
  var swCount = document.getElementById("sw-count");
  var swMinus = document.getElementById("sw-minus");
  var swPlus = document.getElementById("sw-plus");
  var swatchColors = ["#9cc4d6", "#7aa884", "#e0714b"];
  var mLogo = document.getElementById("m-logo");
  var logoBtn = document.getElementById("logo-btn");
  var logoClear = document.getElementById("logo-clear");
  var centerSeg = document.getElementById("center-seg");
  var mCenter = document.getElementById("m-center");
  var mMark = document.getElementById("m-mark");
  var markRow = document.getElementById("mark-row");
  var exportSeg = document.getElementById("export-seg");
  var fmtSeg = document.getElementById("fmt-seg");
  var exportBtn = document.getElementById("export");

  var img = null, exif = {}, logoImg = null;
  var centerMode = "none", centerImg = null;
  // preset centre mark = user's brand logo, embedded as a data URI (no canvas taint → exports fine)
  var markImg = new Image();
  markImg.onload = function () { _markTintCanvas = null; render(); };
  if (window.MARK_SRC) markImg.src = window.MARK_SRC;
  var markColor = (mMark && mMark.value) || "#4fb3d1";
  var scale = 1, panX = 0, panY = 0;   // free reposition (pan in -0.5..0.5, scale >=1)
  var RB = 1400, exportSize = "original", exportFmt = "png"; // RB = render base (long edge of photo area)
  var SANS = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

  // --- frame model ---
  // polaroid: instant sizes; even/gradient: border/none + portrait|landscape orientation
  var SIZES = {
    polaroid: [{ k: "mini", label: "Mini", aspect: 0.8 }, { k: "square", label: "Square", aspect: 1 }, { k: "wide", label: "Wide", aspect: 1.6 }],
    even:     [{ k: "i", label: "I" }, { k: "ii", label: "II" }, { k: "iii", label: "III" }, { k: "iv", label: "IV" }, { k: "v", label: "V" }],
    gradient: null
  };
  var type = "polaroid", size = "mini", orient = "portrait";

  function buildSizeSeg() {
    var opts = SIZES[type];
    sizeSeg.innerHTML = "";
    if (!opts) { sizeSeg.style.display = "none"; return; }
    sizeSeg.style.display = "flex";
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "seg__btn" + (o.k === size ? " is-active" : "");
      b.setAttribute("data-size", o.k);
      b.textContent = o.label;
      sizeSeg.appendChild(b);
    });
  }
  function syncOrient() { orientSeg.style.display = (type === "polaroid") ? "none" : "flex"; }
  function currentAspect() {
    if (type === "polaroid") {
      var o = SIZES.polaroid.filter(function (x) { return x.k === size; })[0] || SIZES.polaroid[0];
      return o.aspect;
    }
    if (type === "even") return orient === "portrait" ? 0.8 : 1.25;
    return orient === "portrait" ? 0.75 : 1.3333; // gradient
  }

  /* ---------------- EXIF ---------------- */
  function parseExif(buf) {
    var out = {};
    try {
      var dv = new DataView(buf);
      if (dv.getUint16(0) !== 0xFFD8) return out;
      var off = 2, len = dv.byteLength, app1 = -1;
      while (off < len) {
        var marker = dv.getUint16(off);
        if ((marker & 0xFF00) !== 0xFF00) break;
        var sz = dv.getUint16(off + 2);
        if (marker === 0xFFE1) { app1 = off + 4; break; }
        off += 2 + sz;
      }
      if (app1 < 0 || dv.getUint32(app1) !== 0x45786966) return out;
      var tiff = app1 + 6, le = dv.getUint16(tiff) === 0x4949;
      var u16 = function (o) { return dv.getUint16(o, le); };
      var u32 = function (o) { return dv.getUint32(o, le); };
      var SZ = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
      function readIFD(s) { var n = u16(s), e = s + 2, m = {}; for (var i = 0; i < n; i++, e += 12) m[u16(e)] = { t: u16(e + 2), c: u32(e + 4), v: e + 8 }; return m; }
      function val(en) {
        var total = (SZ[en.t] || 1) * en.c, o = total <= 4 ? en.v : tiff + u32(en.v);
        if (en.t === 2) { var s = ""; for (var i = 0; i < en.c - 1; i++) { var ch = dv.getUint8(o + i); if (ch) s += String.fromCharCode(ch); } return s.trim(); }
        if (en.t === 3) return u16(o);
        if (en.t === 4) return u32(o);
        if (en.t === 5) { var d = u32(o + 4); return d ? u32(o) / d : 0; }
        return null;
      }
      var d0 = readIFD(tiff + u32(tiff + 4));
      if (d0[0x010F]) out.make = val(d0[0x010F]);
      if (d0[0x0110]) out.model = val(d0[0x0110]);
      if (d0[0x0132]) out.date = val(d0[0x0132]);
      if (d0[0x8769]) {
        var ex = readIFD(tiff + u32(d0[0x8769].v));
        if (ex[0x8827]) out.iso = val(ex[0x8827]);
        if (ex[0x829D]) out.fnum = val(ex[0x829D]);
        if (ex[0x829A]) out.exp = val(ex[0x829A]);
        if (ex[0x920A]) out.focal = val(ex[0x920A]);
        if (ex[0x9003]) out.date = val(ex[0x9003]) || out.date;
      }
    } catch (e) {}
    return out;
  }
  function cameraGuess() { return [exif.make, exif.model].filter(Boolean).join(" ").trim(); }
  function fmtShutter(t) { return !t ? "" : (t < 1 ? "1/" + Math.round(1 / t) + "s" : (Math.round(t * 10) / 10) + "s"); }
  function cameraText() { return mCamera.value.trim(); }
  function settingsText() { return mFilm.value.trim(); }

  /* ---------------- colour helpers ---------------- */
  function hexToRgb(h) { h = (h || "#ffffff").replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(h) { var c = hexToRgb(h); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }
  function hue(h) {
    var c = hexToRgb(h), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, hh = 0;
    if (d === 0) hh = 0;
    else if (mx === r) hh = ((g - b) / d) % 6;
    else if (mx === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh *= 60; if (hh < 0) hh += 360; return hh;
  }
  function sortSwatchesByHue() { swatchColors.sort(function (a, b) { return hue(a) - hue(b); }); }
  var BG, INK, SUB, LIGHT;
  function setPalette() { BG = mBorder.value || "#ffffff"; LIGHT = lum(BG) > 140; INK = LIGHT ? "#222222" : "#f2f2f2"; SUB = LIGHT ? "#8a8a8a" : "#bcbcbc"; }
  function fillBg() { ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height); }

  function text(s, x, y, sz, color, align, weight) {
    if (!s) return;
    ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    ctx.font = (weight || "400") + " " + sz + "px " + SANS;
    ctx.fillText(s, x, y);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function box(maxEdge, aspect) {
    if (aspect >= 1) return { w: maxEdge, h: Math.round(maxEdge / aspect) };
    return { w: Math.round(maxEdge * aspect), h: maxEdge };
  }
  // pan/zoom-aware photo draw into dx,dy,dw,dh
  function drawPhoto(dx, dy, dw, dh) {
    var sw = img.naturalWidth, sh = img.naturalHeight, sAsp = sw / sh, dAsp = dw / dh, scw, sch;
    if (sAsp > dAsp) { sch = sh; scw = sh * dAsp; } else { scw = sw; sch = sw / dAsp; }
    scw /= scale; sch /= scale;
    var maxX = sw - scw, maxY = sh - sch;
    var sx = Math.max(0, Math.min(maxX, maxX * (0.5 + panX)));
    var sy = Math.max(0, Math.min(maxY, maxY * (0.5 + panY)));
    ctx.drawImage(img, sx, sy, scw, sch, dx, dy, dw, dh);
  }

  /* ---------------- swatches (dynamic 3–6, editable, eyedropper) ---------------- */
  function samplePoints(n) {
    // n spread-out points across a 40×40 thumbnail
    var preset = [[10, 12], [30, 10], [20, 30], [33, 32], [8, 30], [22, 8]];
    return preset.slice(0, n);
  }
  function sampleSwatches() {
    if (!img) return;
    var s = document.createElement("canvas"); s.width = 40; s.height = 40;
    var sc = s.getContext("2d"); sc.drawImage(img, 0, 0, 40, 40);
    var d = sc.getImageData(0, 0, 40, 40).data;
    samplePoints(swatchColors.length).forEach(function (pt, i) {
      var k = (pt[1] * 40 + pt[0]) * 4;
      swatchColors[i] = "#" + [d[k], d[k + 1], d[k + 2]].map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
    });
    sortSwatchesByHue();
    buildSwatchRow();
  }
  function buildSwatchRow() {
    swRow.innerHTML = "";
    swatchColors.forEach(function (col, i) {
      var cell = document.createElement("span"); cell.className = "sw-cell";
      var inp = document.createElement("input"); inp.type = "color"; inp.className = "sw"; inp.value = col;
      inp.addEventListener("input", function () { swatchColors[i] = inp.value; render(); });
      var pick = document.createElement("button"); pick.type = "button"; pick.className = "sw-pick"; pick.textContent = "◎"; pick.title = "Pick from photo";
      pick.addEventListener("click", function () { if (img) { pickIdx = i; canvas.classList.add("is-picking"); } });
      cell.appendChild(inp); cell.appendChild(pick); swRow.appendChild(cell);
    });
    if (swCount) swCount.textContent = swatchColors.length;
  }
  function drawSwatches(x, y, sw) {
    var gap = Math.round(sw * 0.75);
    for (var i = 0; i < swatchColors.length; i++) { ctx.fillStyle = swatchColors[i]; roundRect(x + i * (sw + gap), y, sw, sw, Math.max(1, sw * 0.08)); ctx.fill(); }
  }
  // a user-uploaded brand logo, drawn at maxH height (returns false if none)
  function placeLogo(x, yCenter, maxH, align) {
    if (!logoImg) return false;
    var h = maxH, w = h * (logoImg.naturalWidth / logoImg.naturalHeight);
    var dx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    ctx.drawImage(logoImg, dx, yCenter - h / 2, w, h);
    return true;
  }
  // optional centre mark — recoloured from the embedded brand image (luminance-keyed → any colour, exportable)
  var _markTintCanvas = null, _markTintColor = null;
  function tintedMark(color) {
    if (!(markImg && markImg.complete && markImg.naturalWidth)) return null;
    if (_markTintCanvas && _markTintColor === color) return _markTintCanvas;
    var w = markImg.naturalWidth, h = markImg.naturalHeight;
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var cc = c.getContext("2d"); cc.drawImage(markImg, 0, 0);
    var id; try { id = cc.getImageData(0, 0, w, h); } catch (e) { return null; }
    var d = id.data, rgb = hexToRgb(color);
    for (var i = 0; i < d.length; i += 4) {
      var lumi = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      var t = (lumi - 0.06) / 0.94; if (t < 0) t = 0; if (t > 1) t = 1; // drop the dark backing
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
      d[i + 3] = Math.round(255 * t * (d[i + 3] / 255));
    }
    cc.putImageData(id, 0, 0);
    _markTintCanvas = c; _markTintColor = color; return c;
  }
  function drawMark(cx, cy, h) {
    var tm = tintedMark(markColor);
    if (tm) { var w = h * (tm.width / tm.height); ctx.drawImage(tm, cx - w / 2, cy - h / 2, w, h); return; }
    ctx.save();
    var r = h * 0.27, off = h * 0.24;
    ctx.strokeStyle = markColor; ctx.lineWidth = Math.max(1, h * 0.10);
    ctx.shadowColor = markColor; ctx.shadowBlur = h * 0.42;
    ctx.beginPath(); ctx.arc(cx, cy - off, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy + off, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function placeCenterLogo(cx, cy, maxH) {
    if (centerMode === "mark") { drawMark(cx, cy, maxH); return; }
    if (centerMode !== "custom" || !centerImg || !centerImg.complete || !centerImg.naturalWidth) return;
    var h = maxH, w = h * (centerImg.naturalWidth / centerImg.naturalHeight);
    ctx.drawImage(centerImg, cx - w / 2, cy - h / 2, w, h);
  }
  // 3-column caption: [swatches + title] · [centre logo] · [info + brand logo]
  function caption3(x0, x1, bandTop, bandH, W, ink, sub, yShift) {
    var mid = bandTop + bandH / 2 + (yShift || 0);
    var swU = Math.round(W * 0.026);          // swatch square (W = canvas width, consistent)
    var infoSz = Math.round(W * 0.022);       // unified, relative to the whole canvas
    var titleSz = infoSz;                     // title matches the info size
    var gapMid = Math.round(W * 0.011);

    // LEFT — swatches + title (title may wrap to multiple lines), centred as a block
    var tlines = (mTitle.value || "").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    var tGap = Math.round(titleSz * 0.4);
    var titleH = tlines.length ? tlines.length * titleSz + (tlines.length - 1) * tGap : 0;
    var leftH = swU + (titleH ? gapMid + titleH : 0);
    var lt = mid - leftH / 2;
    drawSwatches(x0, lt, swU);
    var saved = ctx.letterSpacing;
    try { ctx.letterSpacing = Math.round(W * 0.0008) + "px"; } catch (e) {}
    for (var ti = 0; ti < tlines.length; ti++)
      text(tlines[ti], x0, lt + swU + gapMid + titleSz + ti * (titleSz + tGap), titleSz, sub, "left", "400");
    try { ctx.letterSpacing = saved || "0px"; } catch (e) {}

    // CENTRE — optional logo
    placeCenterLogo((x0 + x1) / 2, mid, bandH * 0.52);

    // RIGHT — camera + settings, vertically centred; settings split so it reads as up to 3 lines
    var bh = bandH * 0.46;
    var cam = cameraText();
    var settings = settingsText();
    var parts = settings ? settings.split(/\s*·\s*/).filter(Boolean) : [];
    var lines = [];
    if (cam) lines.push(cam);
    if (parts.length >= 3) {
      var h = Math.ceil(parts.length / 2);
      lines.push(parts.slice(0, h).join("  ·  "));
      lines.push(parts.slice(h).join("  ·  "));
    } else if (settings) {
      lines.push(settings);
    }
    var lineGap = Math.round(infoSz * 0.5);
    var infoH = lines.length ? lines.length * infoSz + (lines.length - 1) * lineGap : 0;

    function drawInfo(topY) {
      for (var i = 0; i < lines.length; i++) text(lines[i], x1, topY + i * (infoSz + lineGap) + infoSz, infoSz, sub, "right");
    }
    if (logoImg) {
      var rH = infoH + (infoH ? gapMid : 0) + bh, rt = mid - rH / 2;
      drawInfo(rt);
      placeLogo(x1, rt + infoH + (infoH ? gapMid : 0) + bh / 2, bh, "right");
    } else {
      drawInfo(mid - infoH / 2);
    }
  }

  /* ---------------- render ---------------- */
  function render(rb) {
    if (!img) return;
    RB = (typeof rb === "number" && rb > 0) ? rb : 1400;
    setPalette();

    try {
    if (type === "polaroid") {
      if (size === "wide") {
        // real Instax Wide geometry: paper 108×86, image 99×62 (mm)
        var k = RB / 108;
        var cw = Math.round(108 * k), ch = Math.round(86 * k);
        canvas.width = cw; canvas.height = ch;
        fillBg();
        var wx = Math.round(4.5 * k), wy = Math.round(4.5 * k), ww = Math.round(99 * k), wh = Math.round(62 * k);
        drawPhoto(wx, wy, ww, wh);
        if (oLabel.checked) caption3(wx, cw - wx, wy + wh, ch - (wy + wh), cw, INK, SUB);
      } else {
        var a = currentAspect(), base = RB, iw, ih;
        if (a >= 1) { iw = base; ih = Math.round(base / a); } else { ih = base; iw = Math.round(base * a); }
        var b = Math.round(iw * 0.06), bottom = Math.round(iw * 0.26);
        canvas.width = iw + b * 2; canvas.height = ih + b + bottom;
        fillBg();
        drawPhoto(b, b, iw, ih);
        if (oLabel.checked) caption3(b, canvas.width - b, b + ih, bottom, canvas.width, INK, SUB);
      }
    }

    else if (type === "even") {
      // equal border on all sides — three widths (I / II / III), no label
      var p = box(RB, currentAspect());
      var lvl = { i: 0.02, ii: 0.045, iii: 0.08, iv: 0.13, v: 0.20 }[size] || 0.08;
      var m = Math.round(Math.max(p.w, p.h) * lvl);
      canvas.width = p.w + m * 2; canvas.height = p.h + m * 2;
      fillBg();
      drawPhoto(m, m, p.w, p.h);
    }

    else if (type === "gradient") {
      var pg = box(RB, currentAspect()), gw = pg.w, gh = pg.h;
      canvas.width = gw; canvas.height = gh;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, gw, gh);
      drawPhoto(0, 0, gw, gh);
      // gradient always shows (independent of the label), colour editable
      var band = Math.round(gh * 0.30);
      var gc = hexToRgb(mGrad.value || "#000000");
      var g = ctx.createLinearGradient(0, gh - band, 0, gh);
      g.addColorStop(0, "rgba(" + gc[0] + "," + gc[1] + "," + gc[2] + ",0)");
      g.addColorStop(1, "rgba(" + gc[0] + "," + gc[1] + "," + gc[2] + ",0.78)");
      ctx.fillStyle = g; ctx.fillRect(0, gh - band, gw, band);
      if (oLabel.checked) {
        var pad = Math.round(gw * 0.04);
        // caption sits in the lower part of the gradient, nudged further down
        var capH = Math.round(band * 0.62);
        caption3(pad, gw - pad, gh - capH, capH, gw, "#ffffff", "rgba(255,255,255,0.78)", Math.round(band * 0.12));
      }
    }
    } catch (e) { /* never blank the canvas on a label/draw error */ }

    canvas.hidden = false;
    drop.style.display = "none";
    hint.hidden = false;
  }

  /* ---------------- load ---------------- */
  function load(f) {
    if (!f || !/^image\//.test(f.type)) return;
    var reader = new FileReader();
    reader.onload = function (e) { exif = parseExif(e.target.result); afterExif(f); };
    reader.readAsArrayBuffer(f);
  }
  function afterExif(f) {
    var url = URL.createObjectURL(f), i = new Image();
    i.onload = function () {
      img = i; scale = 1; panX = 0; panY = 0;
      if (!mCamera.value && cameraGuess()) mCamera.value = cameraGuess();
      if (!mFilm.value) {
        var p = [];
        if (exif.iso) p.push("ISO " + exif.iso);
        if (exif.focal) p.push(Math.round(exif.focal) + "mm");
        if (exif.fnum) p.push("f/" + (Math.round(exif.fnum * 10) / 10));
        if (exif.exp) p.push(fmtShutter(exif.exp));
        mFilm.value = p.join(" · ");
      }
      sampleSwatches();
      URL.revokeObjectURL(url);
      render();
    };
    i.src = url;
  }

  /* ---------------- free reposition (drag + wheel) + eyedropper ---------------- */
  var dragging = false, lastX = 0, lastY = 0, pickIdx = -1;

  function toCanvas(e) {
    var r = canvas.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) / r.width * canvas.width), y: Math.round((e.clientY - r.top) / r.height * canvas.height), w: r.width, h: r.height };
  }
  canvas.addEventListener("pointerdown", function (e) {
    if (!img) return;
    if (pickIdx >= 0) {
      var c = toCanvas(e);
      try {
        var d = ctx.getImageData(Math.max(0, Math.min(canvas.width - 1, c.x)), Math.max(0, Math.min(canvas.height - 1, c.y)), 1, 1).data;
        swatchColors[pickIdx] = "#" + [d[0], d[1], d[2]].map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
        sortSwatchesByHue(); buildSwatchRow();
      } catch (err) {}
      pickIdx = -1; canvas.classList.remove("is-picking"); render();
      return;
    }
    dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging || !img) return;
    var r = canvas.getBoundingClientRect();
    panX -= (e.clientX - lastX) / r.width;
    panY -= (e.clientY - lastY) / r.height;
    panX = Math.max(-0.5, Math.min(0.5, panX));
    panY = Math.max(-0.5, Math.min(0.5, panY));
    lastX = e.clientX; lastY = e.clientY;
    render();
  });
  canvas.addEventListener("pointerup", function () { dragging = false; });
  canvas.addEventListener("wheel", function (e) {
    if (!img) return;
    e.preventDefault();
    scale *= e.deltaY < 0 ? 1.08 : 0.926;
    scale = Math.max(1, Math.min(5, scale));
    render();
  }, { passive: false });

  swMinus.addEventListener("click", function () {
    if (swatchColors.length > 3) { swatchColors.pop(); buildSwatchRow(); render(); }
  });
  swPlus.addEventListener("click", function () {
    if (swatchColors.length < 6) {
      swatchColors.push(swatchColors[swatchColors.length - 1] || "#cccccc");
      if (img) sampleSwatches(); else buildSwatchRow();
      render();
    }
  });

  /* ---------------- controls ---------------- */
  file.addEventListener("change", function () { if (file.files[0]) load(file.files[0]); });
  ["dragenter", "dragover"].forEach(function (ev) { stage.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { stage.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
  stage.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });

  function syncByType() {
    if (labelGroup) labelGroup.style.display = (type === "even") ? "none" : "";
    if (gradRow) gradRow.style.display = (type === "gradient") ? "" : "none";
    if (frameColorRow) frameColorRow.style.display = (type === "gradient") ? "none" : "";
  }

  typeSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    type = btn.getAttribute("data-type");
    typeSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
    var opts = SIZES[type];
    size = type === "even" ? "iii" : (opts ? opts[0].k : size);
    buildSizeSeg(); syncOrient(); syncByType(); render();
  });
  sizeSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    size = btn.getAttribute("data-size");
    sizeSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
    render();
  });
  orientSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    orient = btn.getAttribute("data-orient");
    orientSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
    render();
  });
  [mTitle, mCamera, mFilm].forEach(function (el) { el.addEventListener("input", function () { render(); }); });
  function syncLabelSub() { if (labelSub) labelSub.classList.toggle("is-collapsed", !oLabel.checked); }
  oLabel.addEventListener("change", function () { syncLabelSub(); render(); });
  syncLabelSub();
  mBorder.addEventListener("input", function () { render(); });
  mGrad.addEventListener("input", function () { render(); });
  buildSwatchRow();

  // brand logo upload (user-supplied image — no logos are bundled with the tool)
  logoBtn.addEventListener("click", function () { mLogo.click(); });
  mLogo.addEventListener("change", function () {
    var f = mLogo.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    var url = URL.createObjectURL(f), li = new Image();
    li.onload = function () { logoImg = li; URL.revokeObjectURL(url); render(); };
    li.src = url;
  });
  logoClear.addEventListener("click", function () { logoImg = null; mLogo.value = ""; render(); });

  // centre logo: None / Mark (preset) / Upload
  function syncMarkRow() { if (markRow) markRow.hidden = (centerMode !== "mark"); }
  centerSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    var c = btn.getAttribute("data-c");
    if (c === "upload") { mCenter.click(); return; }
    centerMode = c;
    centerSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
    syncMarkRow(); render();
  });
  if (mMark) mMark.addEventListener("input", function () { markColor = mMark.value; _markTintCanvas = null; render(); });
  syncMarkRow();
  mCenter.addEventListener("change", function () {
    var f = mCenter.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    var url = URL.createObjectURL(f), ci = new Image();
    ci.onload = function () {
      centerImg = ci; centerMode = "custom";
      centerSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el.getAttribute("data-c") === "upload"); });
      syncMarkRow();
      URL.revokeObjectURL(url); render();
    };
    ci.src = url;
  });

  exportSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    exportSize = btn.getAttribute("data-x");
    exportSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
  });
  fmtSeg.addEventListener("click", function (e) {
    var btn = e.target.closest(".seg__btn"); if (!btn) return;
    exportFmt = btn.getAttribute("data-f");
    fmtSeg.querySelectorAll(".seg__btn").forEach(function (el) { el.classList.toggle("is-active", el === btn); });
  });

  exportBtn.addEventListener("click", function () {
    if (!img) return;
    var maxNat = Math.max(img.naturalWidth, img.naturalHeight);
    var rb = exportSize === "2k" ? 2048 : exportSize === "4k" ? 4096 : Math.min(maxNat, 6000);
    render(rb);
    var dims = canvas.width + "x" + canvas.height;
    var mime = exportFmt === "jpeg" ? "image/jpeg" : "image/png";
    var ext = exportFmt === "jpeg" ? "jpg" : "png";
    var q = exportFmt === "jpeg" ? 0.92 : undefined;
    var name = "framed-" + type + "-" + dims + "." + ext;
    try {
      canvas.toBlob(function (blob) {
        if (!blob) { render(); return; }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        render();
      }, mime, q);
    } catch (e) {
      try {
        var a2 = document.createElement("a");
        a2.href = canvas.toDataURL(mime, q);
        a2.download = name;
        a2.click();
      } catch (e2) { alert("Export failed: " + (e2.message || e2)); }
      render();
    }
  });

  buildSizeSeg(); syncOrient(); syncByType();
})();
