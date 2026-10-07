/* Simulated participant data — shared passcode gate + picker for the Patrick Star tools.
   Used by: ../../earfit.html (Face Blur) and thermo_analyzer.html (Thermocouple Analyzer).
   Data lives in ../data/sim/ (manifest.json + participants/… + photos/…) — see ../data/sim/README.md.

   Usage from a tool page:
     <script src="patrickstar/tools/simdata.js"></script>
     SimData.open({ tool:'thermo', apply: async (sel, api) => { … } });
   `tool` picks the picker UI ('thermo' | 'faceblur'); `apply` receives the user's
   selection plus fetch helpers and does the tool-specific import. */
(function () {
  'use strict';

  // SHA-256 of the 6-digit passcode — same code (and same hash) as the Patrick Star project gate.
  var HASH = '21747eafc787b7d86ca0da9f073e63217b75a12fcc7c3379d96b8a4ad0c248b9';
  var UNLOCK_KEY = 'ps-sim-unlocked';
  var scriptEl = document.currentScript;
  var BASE = new URL('../data/sim/', scriptEl ? scriptEl.src : location.href).href;
  var manifestP = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function unlocked() { try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; } }
  function setUnlocked() { try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {} }

  // Tiny SHA-256 (hex) — used only when crypto.subtle is unavailable (file:// previews).
  function sha256js(str) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = new TextEncoder().encode(str), l = bytes.length, bl = l * 8;
    var n = ((l + 9 + 63) >> 6) << 6, buf = new Uint8Array(n); buf.set(bytes); buf[l] = 0x80;
    buf[n - 4] = (bl >>> 24) & 255; buf[n - 3] = (bl >>> 16) & 255; buf[n - 2] = (bl >>> 8) & 255; buf[n - 1] = bl & 255;
    var w = new Uint32Array(64), rotr = function (x, k) { return (x >>> k) | (x << (32 - k)); };
    for (var off = 0; off < n; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = (buf[off + i * 4] << 24) | (buf[off + i * 4 + 1] << 16) | (buf[off + i * 4 + 2] << 8) | buf[off + i * 4 + 3];
      for (i = 16; i < 64; i++) { var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0; }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0; H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(function (x) { return x.toString(16).padStart(8, '0'); }).join('');
  }
  async function sha256(str) {
    try {
      if (crypto && crypto.subtle) {
        var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return [].map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
    } catch (e) {}
    return sha256js(str);
  }

  function loadManifest() {
    if (!manifestP) manifestP = fetch(BASE + 'manifest.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('manifest.json ' + r.status); return r.json();
    }).catch(function (e) { manifestP = null; throw e; });
    return manifestP;
  }
  function fetchText(rel) { return fetch(BASE + rel, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(rel + ' ' + r.status); return r.text(); }); }
  function fetchBlob(rel) { return fetch(BASE + rel).then(function (r) { if (!r.ok) throw new Error(rel + ' ' + r.status); return r.blob(); }); }
  function fetchJSON(rel) { return fetchText(rel).then(function (t) { return JSON.parse(t); }); }

  /* ---------- styles ---------- */
  var CSS = '\
.sd-wrap{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;\
  background:rgba(10,12,16,.46);-webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);\
  font-family:-apple-system,"SF Pro Display","SF Pro Text",BlinkMacSystemFont,"Helvetica Neue","Segoe UI",sans-serif;\
  --sd-bg:rgba(255,255,255,.92);--sd-bg2:rgba(0,0,0,.045);--sd-bg3:rgba(0,0,0,.08);--sd-t0:#1d1d1f;--sd-t1:#3a3a40;--sd-t2:#7a7a82;--sd-t3:#a8a8b0;\
  --sd-hair:rgba(0,0,0,.10);--sd-accent:#0796FF;--sd-accent-ink:#fff;--sd-ok:#2f9e5f;--sd-err:#e0736a;animation:sdFade .18s ease-out}\
html[data-theme="dark"] .sd-wrap{--sd-bg:rgba(24,24,30,.90);--sd-bg2:rgba(255,255,255,.06);--sd-bg3:rgba(255,255,255,.10);--sd-t0:#f5f5f7;--sd-t1:#c8c8d2;--sd-t2:#8a8a96;--sd-t3:#5c5c66;\
  --sd-hair:rgba(255,255,255,.12);--sd-ok:#57c98a;background:rgba(0,0,0,.55)}\
@keyframes sdFade{from{opacity:0}to{opacity:1}}\
@keyframes sdPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}\
.sd-card{width:100%;max-width:440px;max-height:min(86vh,720px);display:flex;flex-direction:column;border-radius:22px;background:var(--sd-bg);color:var(--sd-t1);\
  border:1px solid var(--sd-hair);box-shadow:0 30px 80px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);overflow:hidden;animation:sdPop .22s cubic-bezier(.2,.8,.2,1)}\
.sd-head{display:flex;align-items:center;gap:10px;padding:16px 18px 12px}\
.sd-head svg{flex-shrink:0;color:var(--sd-t0)}\
.sd-title{font-size:16px;font-weight:700;color:var(--sd-t0);letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap}\
.sd-pill{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 7px;border-radius:980px;background:var(--sd-accent);color:var(--sd-accent-ink)}\
.sd-sub{font-size:12.5px;line-height:1.5;color:var(--sd-t2);margin-top:2px}\
.sd-x{margin-left:auto;width:30px;height:30px;border-radius:50%;border:none;background:var(--sd-bg2);color:var(--sd-t1);cursor:pointer;font-size:15px;line-height:30px;text-align:center;flex-shrink:0}\
.sd-x:hover{background:var(--sd-bg3)}\
.sd-body{padding:4px 18px 14px;overflow:auto;flex:1;min-height:0}\
.sd-foot{display:flex;gap:8px;align-items:center;padding:12px 18px 16px;border-top:1px solid var(--sd-hair)}\
.sd-btn{height:38px;padding:0 16px;border-radius:980px;border:1px solid var(--sd-hair);background:var(--sd-bg2);color:var(--sd-t0);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s}\
.sd-btn:hover{background:var(--sd-bg3)}\
.sd-btn.primary{background:var(--sd-accent);border-color:transparent;color:var(--sd-accent-ink)}\
.sd-btn.primary:hover{filter:brightness(1.08)}\
.sd-btn:disabled{opacity:.45;cursor:not-allowed;filter:none}\
.sd-spacer{flex:1}\
.sd-gate{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:24px;background:#ffffff;font-family:-apple-system,"SF Pro Display","SF Pro Text",BlinkMacSystemFont,"Helvetica Neue","Segoe UI",sans-serif;\
  --sd-t0:#1d1d1f;--sd-t2:#86868b;--sd-hair:#e6e6e8;--sd-surface:rgba(255,255,255,.5);--sd-err:#e0736a;animation:sdFade .18s ease-out}\
html[data-theme="dark"] .sd-gate{background:#0c0e12;--sd-t0:#e7e9ee;--sd-t2:#9aa1ab;--sd-hair:rgba(255,255,255,.12);--sd-surface:rgba(255,255,255,.05)}\
.sd-gate .sd-back{position:absolute;top:16px;left:18px;width:36px;height:36px;border-radius:50%;border:1px solid var(--sd-hair);background:var(--sd-surface);color:var(--sd-t0);display:inline-grid;place-items:center;cursor:pointer;padding:0}\
.sd-gate .sd-box{text-align:center;max-width:360px;width:100%}\
.sd-gate .sd-lock{display:block;margin:0 auto 14px;color:var(--sd-t0)}\
.sd-gate h2{margin:0 0 8px;font-size:22px;font-weight:700;color:var(--sd-t0);letter-spacing:0}\
.sd-gate p{margin:0 0 20px;color:var(--sd-t2);font-size:14px;line-height:1.6}\
.sd-code{display:block;width:200px;margin:0 auto;text-align:center;letter-spacing:.4em;font-size:20px;padding:12px 14px;border-radius:12px;\
  border:1px solid var(--sd-hair);background:var(--sd-surface);color:var(--sd-t0);outline:none;font-family:inherit}\
.sd-err{min-height:1.2em;text-align:center;color:var(--sd-err);font-size:13px;margin-top:12px}\
.sd-note{font-size:12px;line-height:1.5;color:var(--sd-t2);padding:10px 12px;border-radius:12px;background:var(--sd-bg2);margin:8px 0 12px}\
.sd-note b{color:var(--sd-t0)}\
.sd-tools{display:flex;align-items:center;gap:10px;margin:4px 0 8px;font-size:12px;color:var(--sd-t2)}\
.sd-tools a{color:var(--sd-accent);text-decoration:none;cursor:pointer;font-weight:600}\
.sd-list{display:flex;flex-direction:column;gap:4px}\
.sd-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;cursor:pointer;border:1px solid transparent}\
.sd-row:hover{background:var(--sd-bg2)}\
.sd-row.on{background:var(--sd-bg2);border-color:var(--sd-hair)}\
.sd-row input{accent-color:var(--sd-accent);width:15px;height:15px;margin:0;flex-shrink:0}\
.sd-id{font-weight:700;color:var(--sd-t0);font-size:13px;font-variant-numeric:tabular-nums;min-width:74px}\
.sd-meta{font-size:12px;color:var(--sd-t2);line-height:1.35;flex:1;min-width:0}\
.sd-meta b{color:var(--sd-t1);font-weight:600}\
.sd-tag{font-size:10.5px;font-weight:700;color:var(--sd-t2);background:var(--sd-bg3);border-radius:6px;padding:2px 6px;white-space:nowrap}\
.sd-step{display:flex;align-items:center;justify-content:center;gap:14px;margin:6px 0 4px}\
.sd-step button{width:42px;height:42px;border-radius:50%;border:1px solid var(--sd-hair);background:var(--sd-bg2);color:var(--sd-t0);font-size:22px;line-height:1;cursor:pointer}\
.sd-step button:hover{background:var(--sd-bg3)}\
.sd-step input{width:84px;height:54px;text-align:center;font:inherit;font-size:28px;font-weight:700;color:var(--sd-t0);background:transparent;border:none;outline:none;font-variant-numeric:tabular-nums}\
.sd-caption{text-align:center;font-size:12px;color:var(--sd-t2);margin-bottom:6px}\
.sd-views{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0 2px}\
.sd-views span{font-size:11px;font-weight:600;color:var(--sd-t1);background:var(--sd-bg2);border:1px solid var(--sd-hair);border-radius:980px;padding:4px 9px}\
.sd-prog{display:flex;flex-direction:column;align-items:center;gap:12px;padding:26px 0 18px;color:var(--sd-t2);font-size:13px}\
.sd-bar{width:70%;height:4px;border-radius:4px;background:var(--sd-bg3);overflow:hidden}\
.sd-bar i{display:block;height:100%;width:0;background:var(--sd-accent);transition:width .2s}\
.sd-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1999;display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);\
  padding:9px 10px 9px 14px;border-radius:980px;font:600 12.5px -apple-system,"SF Pro Text",BlinkMacSystemFont,"Helvetica Neue",sans-serif;\
  background:rgba(255,255,255,.95);color:#1d1d1f;box-shadow:0 10px 30px rgba(0,0,0,.22);border:1px solid rgba(0,0,0,.1);animation:sdPop .25s ease-out}\
html[data-theme="dark"] .sd-toast{background:rgba(24,24,30,.94);color:#f5f5f7;border-color:rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.4)}\
.sd-toast .sd-pill{font-size:9.5px}\
.sd-toast button{border:none;background:rgba(127,127,127,.18);color:inherit;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:13px;line-height:24px}\
@media (max-width:520px){.sd-card{border-radius:18px;max-height:92vh}.sd-head,.sd-body,.sd-foot{padding-left:14px;padding-right:14px}}';

  function injectCSS() {
    if (document.getElementById('sd-css')) return;
    var st = document.createElement('style'); st.id = 'sd-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  var LOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.8a5.2 5.2 0 0 0-5.2 5.2v2.2H6.2A2.2 2.2 0 0 0 4 11.4v8.4A2.2 2.2 0 0 0 6.2 22h11.6A2.2 2.2 0 0 0 20 19.8v-8.4a2.2 2.2 0 0 0-2.2-2.2h-.6V7A5.2 5.2 0 0 0 12 1.8Zm0 2.2a3 3 0 0 1 3 3v2.2H9V7a3 3 0 0 1 3-3Z"/></svg>';
  var OPEN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.8a5.2 5.2 0 0 0-5.2 5.2h2.2A3 3 0 0 1 15 6.9l.02.1a3 3 0 0 1 .18 1v1.2H6.2A2.2 2.2 0 0 0 4 11.4v8.4A2.2 2.2 0 0 0 6.2 22h11.6A2.2 2.2 0 0 0 20 19.8v-8.4a2.2 2.2 0 0 0-2.2-2.2h-.6V7A5.2 5.2 0 0 0 12 1.8Z"/></svg>';

  /* ---------- modal plumbing ---------- */
  function openModal(inner) {
    injectCSS();
    var wrap = document.createElement('div'); wrap.className = 'sd-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="sd-card">' + inner + '</div>';
    document.body.appendChild(wrap);
    var prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    var api = { el: wrap, card: wrap.firstChild, close: function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); document.documentElement.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); }, onEsc: null };
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); if (api.onEsc) api.onEsc(); } }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap && api.onEsc) api.onEsc(); });
    return api;
  }
  function head(title, sub, icon) {
    return '<div class="sd-head">' + (icon || LOCK) + '<div><div class="sd-title">' + title + '</div>' + (sub ? '<div class="sd-sub">' + sub + '</div>' : '') + '</div><button class="sd-x" type="button" aria-label="Close" data-close>✕</button></div>';
  }

  /* ---------- 1. passcode gate ---------- */
  function gate() {
    if (unlocked()) return Promise.resolve(true);
    return new Promise(function (resolve) {
      injectCSS();
      var wrap = document.createElement('div'); wrap.className = 'sd-gate'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
      wrap.innerHTML =
        '<button class="sd-back" type="button" title="Cancel" aria-label="Cancel"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></button>' +
        '<div class="sd-box">' +
        '<svg class="sd-lock" width="42" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.8a5.2 5.2 0 0 0-5.2 5.2v2.2H6.2A2.2 2.2 0 0 0 4 11.4v8.4A2.2 2.2 0 0 0 6.2 22h11.6A2.2 2.2 0 0 0 20 19.8v-8.4a2.2 2.2 0 0 0-2.2-2.2h-.6V7A5.2 5.2 0 0 0 12 1.8Zm0 2.2a3 3 0 0 1 3 3v2.2H9V7a3 3 0 0 1 3-3Z"/></svg>' +
        '<h2>Simulated data</h2>' +
        '<p>This dataset is access-restricted.<br>Enter the 6-digit passcode to load it.</p>' +
        '<input class="sd-code" type="password" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="" aria-label="Passcode">' +
        '<div class="sd-err"></div></div>';
      document.body.appendChild(wrap);
      var prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
      var inp = wrap.querySelector('.sd-code'), err = wrap.querySelector('.sd-err'), icon = wrap.querySelector('.sd-lock');
      var busy = false, closed = false;
      function done(ok) {
        if (closed) return; closed = true;
        document.removeEventListener('keydown', onKey);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        document.documentElement.style.overflow = prevOverflow;
        resolve(ok);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); done(false); } }
      document.addEventListener('keydown', onKey);
      wrap.querySelector('.sd-back').addEventListener('click', function () { done(false); });
      async function tryit() {
        if (busy) return; var v = inp.value.trim(); if (!v) { inp.focus(); return; }
        busy = true; var h = await sha256(v); busy = false;
        if (h === HASH) {
          setUnlocked();
          // same unlock beat as the project page: the padlock opens, then the screen goes away
          icon.innerHTML = '<path d="M12 1.8a5.2 5.2 0 0 0-5.2 5.2h2.2A3 3 0 0 1 15 6.9l.02.1a3 3 0 0 1 .18 1v1.2H6.2A2.2 2.2 0 0 0 4 11.4v8.4A2.2 2.2 0 0 0 6.2 22h11.6A2.2 2.2 0 0 0 20 19.8v-8.4a2.2 2.2 0 0 0-2.2-2.2h-.6V7A5.2 5.2 0 0 0 12 1.8Z"/>';
          setTimeout(function () { done(true); }, 420);
        } else { err.textContent = 'Incorrect passcode'; inp.value = ''; setTimeout(function () { inp.focus(); }, 0); }
      }
      inp.addEventListener('input', function () { err.textContent = ''; if (inp.value.length >= 6) tryit(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryit(); });
      setTimeout(function () { inp.focus(); }, 60);
    });
  }

  /* ---------- 2. pickers ---------- */
  function orderText(p) { return (p.order || []).map(esc).join(' → '); }

  function pickParticipants(man) {
    var parts = man.participants || [];
    var sub = 'Pick participants to load — each one pairs a thermocouple CSV with its Tagger JSON, exactly like the folder scanner.';
    var rows = parts.map(function (p, i) {
      var meta = '<b>' + esc(p.dateLabel) + '</b> · ' + orderText(p) + '<br>' + esc(p.sessionMinutes) + ' min session · ' + esc(p.adjustments) + ' adj';
      var tag = 'RPE ' + [p.rpe && p.rpe.e1, p.rpe && p.rpe.e2].map(function (x) { return x == null ? '–' : x; }).join('/');
      return '<label class="sd-row' + (i < 3 ? ' on' : '') + '"><input type="checkbox" value="' + esc(p.id) + '"' + (i < 3 ? ' checked' : '') + '><span class="sd-id">' + esc(p.id) + '</span><span class="sd-meta">' + meta + '</span><span class="sd-tag">' + esc(tag) + '</span></label>';
    }).join('');
    return new Promise(function (resolve) {
      var m = openModal(head(esc(man.label || 'Simulated data') + ' <span class="sd-pill">Demo</span>', sub, OPEN) +
        '<div class="sd-body"><div class="sd-note"><b>' + esc(man.label || 'Simulated data') + ':</b> ' + esc(man.note || '') + '</div>' +
        '<div class="sd-tools"><span><b data-count>3</b> of ' + parts.length + ' selected</span><span class="sd-spacer"></span><a data-all>Select all</a><a data-none>None</a></div>' +
        '<div class="sd-list">' + rows + '</div></div>' +
        '<div class="sd-foot"><span class="sd-spacer"></span><button class="sd-btn" type="button" data-close>Cancel</button><button class="sd-btn primary" type="button" data-go>Load 3</button></div>');
      var boxes = [].slice.call(m.card.querySelectorAll('input[type=checkbox]')), go = m.card.querySelector('[data-go]'), cnt = m.card.querySelector('[data-count]');
      function sync() {
        var n = boxes.filter(function (b) { return b.checked; }).length;
        boxes.forEach(function (b) { b.closest('.sd-row').classList.toggle('on', b.checked); });
        cnt.textContent = n; go.textContent = 'Load ' + n + (n === 1 ? ' participant' : ' participants'); go.disabled = !n;
      }
      boxes.forEach(function (b) { b.addEventListener('change', sync); });
      m.card.querySelector('[data-all]').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); sync(); });
      m.card.querySelector('[data-none]').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); sync(); });
      function done(v) { m.close(); resolve(v); }
      m.onEsc = function () { done(null); };
      m.card.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { done(null); }); });
      go.addEventListener('click', function () {
        var ids = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        done({ ids: ids, participants: parts.filter(function (p) { return ids.indexOf(p.id) >= 0; }) });
      });
      sync();
    });
  }

  function pickPhotos(man) {
    var sets = man.photoSets || [];
    var set = sets[0];
    if (!set) return Promise.resolve({ error: 'No simulated photo set is configured yet (manifest.json → photoSets).' });
    var views = Object.keys(set.views || {});
    var maxN = Math.max(1, man.participants ? man.participants.length : 17), def = Math.min(4, maxN);
    return new Promise(function (resolve) {
      var m = openModal(head(esc(man.label || 'Simulated data') + ' <span class="sd-pill">Demo</span>', 'Load a simulated photo set so Face Blur can group and mask participants in one go.', OPEN) +
        '<div class="sd-body"><div class="sd-note"><b>' + esc(man.label || 'Simulated data') + ':</b> ' + esc(set.note || man.note || '') + '</div>' +
        '<div class="sd-caption">How many simulated participants?</div>' +
        '<div class="sd-step"><button type="button" data-dec aria-label="Fewer">−</button><input type="number" min="1" max="' + maxN + '" value="' + def + '" aria-label="Participants"><button type="button" data-inc aria-label="More">+</button></div>' +
        '<div class="sd-caption" data-sum></div>' +
        '<div class="sd-views">' + views.map(function (v) { return '<span>' + esc(v.charAt(0).toUpperCase() + v.slice(1)) + '</span>'; }).join('') + '</div>' +
        '<div class="sd-caption" style="margin-top:8px" data-naming></div></div>' +
        '<div class="sd-foot"><span class="sd-spacer"></span><button class="sd-btn" type="button" data-close>Cancel</button><button class="sd-btn primary" type="button" data-go>Load photos</button></div>');
      var inp = m.card.querySelector('input'), sum = m.card.querySelector('[data-sum]'), go = m.card.querySelector('[data-go]');
      function n() { var v = parseInt(inp.value, 10); if (!(v >= 1)) v = 1; if (v > maxN) v = maxN; return v; }
      var naming = m.card.querySelector('[data-naming]');
      function sync() {
        var v = n(); inp.value = v;
        sum.textContent = v + (v === 1 ? ' participant' : ' participants') + ' × ' + views.length + ' views = ' + (v * views.length) + ' photos';
        go.textContent = 'Load ' + (v * views.length) + ' photos';
        var ids = photoIds({ set: set, count: v }), first = views[0] ? views[0].charAt(0).toUpperCase() + views[0].slice(1) : 'Front';
        naming.innerHTML = 'Files arrive as <code>' + esc(ids[0]) + '_' + esc(first) + '.jpg</code>' + (ids.length > 1 ? ', <code>' + esc(ids[1]) + '_' + esc(first) + '.jpg</code> …' : ' …') + ' so the tool groups them by participant.';
      }
      m.card.querySelector('[data-dec]').addEventListener('click', function () { inp.value = n() - 1; sync(); });
      m.card.querySelector('[data-inc]').addEventListener('click', function () { inp.value = n() + 1; sync(); });
      inp.addEventListener('input', sync); inp.addEventListener('change', sync);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
      function done(v) { m.close(); resolve(v); }
      m.onEsc = function () { done(null); };
      m.card.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { done(null); }); });
      go.addEventListener('click', function () { done({ count: n(), set: set, views: views }); });
      sync(); setTimeout(function () { inp.focus(); inp.select(); }, 40);
    });
  }

  /* ---------- 3. progress + toast ---------- */
  function progress(title) {
    var m = openModal(head(esc(title) + ' <span class="sd-pill">Demo</span>', '', OPEN) +
      '<div class="sd-body"><div class="sd-prog"><div data-msg>Loading…</div><div class="sd-bar"><i></i></div></div></div>');
    m.card.querySelector('[data-close]').style.display = 'none';
    var bar = m.card.querySelector('.sd-bar i'), msg = m.card.querySelector('[data-msg]');
    return { set: function (done, total, text) { bar.style.width = (total ? Math.round(done / total * 100) : 0) + '%'; if (text) msg.textContent = text; }, close: m.close };
  }
  var toastEl = null;
  function toast(text, sticky) {
    injectCSS();
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    var el = document.createElement('div'); el.className = 'sd-toast';
    el.innerHTML = '<span class="sd-pill">Simulated</span><span>' + esc(text) + '</span><button type="button" aria-label="Dismiss">✕</button>';
    el.querySelector('button').addEventListener('click', function () { if (el.parentNode) el.parentNode.removeChild(el); });
    document.body.appendChild(el); toastEl = el;
    if (!sticky) setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
  }

  /* ---------- 4. public entry ---------- */
  async function open(opts) {
    opts = opts || {};
    var tool = opts.tool || 'thermo';
    var ok = await gate(); if (!ok) return null;
    var man;
    try { man = await loadManifest(); }
    catch (e) {
      alert('Could not load the simulated dataset (' + e.message + ').\nIt is served from ' + BASE + ' — open the tool over http(s), not as a file.');
      return null;
    }
    var sel = tool === 'faceblur' ? await pickPhotos(man) : await pickParticipants(man);
    if (!sel) return null;
    if (sel.error) { alert(sel.error); return null; }
    var prog = progress(man.label || 'Simulated data');
    var api = { base: BASE, manifest: man, fetchText: fetchText, fetchBlob: fetchBlob, fetchJSON: fetchJSON, progress: prog.set, toast: toast, pad2: pad2 };
    try {
      var result = await opts.apply(sel, api);
      prog.close();
      return result;
    } catch (e) {
      prog.close();
      alert('Simulated data could not be loaded: ' + (e && e.message ? e.message : e));
      return null;
    }
  }

  /* Simulated participant IDs: the set's idBase (e.g. MD123456) counted upwards → MD123456, MD123457, … */
  function photoIds(sel) {
    var base = (sel.set && sel.set.idBase) || 'SIM01';
    var m = base.match(/^(.*?)(\d+)$/), prefix = m ? m[1] : base, start = m ? parseInt(m[2], 10) : 1, width = m ? m[2].length : 2;
    var ids = [];
    for (var k = 0; k < sel.count; k++) ids.push(prefix + String(start + k).padStart(width, '0'));
    return ids;
  }

  /* Build the File list for Face Blur: N simulated participants × the set's views. */
  async function photoFiles(sel, api) {
    var views = sel.views, blobs = {};
    var i = 0;
    for (var v of views) {
      api.progress(i, views.length + 1, 'Fetching ' + v + ' view…');
      blobs[v] = await api.fetchBlob(sel.set.views[v]); i++;
    }
    api.progress(views.length, views.length + 1, 'Naming ' + (sel.count * views.length) + ' photos…');
    var files = [], ids = photoIds(sel);
    for (var k = 0; k < ids.length; k++) {
      var id = ids[k];
      for (var w of views) {
        var ext = (sel.set.views[w].match(/\.(jpe?g|png|webp)$/i) || ['', 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
        var name = id + '_' + w.charAt(0).toUpperCase() + w.slice(1) + '.' + ext;
        files.push(new File([blobs[w]], name, { type: blobs[w].type || 'image/jpeg' }));
      }
    }
    return files;
  }

  window.SimData = { open: open, gate: gate, unlocked: unlocked, manifest: loadManifest, photoIds: photoIds, photoFiles: photoFiles, toast: toast, base: BASE };
})();
