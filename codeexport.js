/* codeexport.js — password-gated "download this tool's source" for Playground tools.
   Any element with [data-export-code] triggers it. It auto-collects the page's own
   HTML plus its local <script src> / <link stylesheet> files and downloads them as one
   store-only .zip (no dependencies). */
(function () {
  "use strict";

  // ---------- CRC32 ----------
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function strBytes(s) { return new TextEncoder().encode(s); }

  // ---------- minimal store-only ZIP ----------
  function makeZip(files) { // files: [{name, data(Uint8Array)}]
    var chunks = [], central = [], offset = 0;
    function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
    function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
    function push(arr, part) { arr.push(part); return part.length; }

    files.forEach(function (f) {
      var name = strBytes(f.name), data = f.data, crc = crc32(data), size = data.length, start = offset;
      var local = [];
      offset += push(local, u32(0x04034b50));
      offset += push(local, u16(20)); offset += push(local, u16(0)); offset += push(local, u16(0));
      offset += push(local, u16(0)); offset += push(local, u16(0));            // time/date
      offset += push(local, u32(crc)); offset += push(local, u32(size)); offset += push(local, u32(size));
      offset += push(local, u16(name.length)); offset += push(local, u16(0));
      offset += push(local, name); offset += push(local, data);
      local.forEach(function (p) { chunks.push(p); });

      var cen = [];
      push(cen, u32(0x02014b50)); push(cen, u16(20)); push(cen, u16(20)); push(cen, u16(0)); push(cen, u16(0));
      push(cen, u16(0)); push(cen, u16(0)); push(cen, u32(crc)); push(cen, u32(size)); push(cen, u32(size));
      push(cen, u16(name.length)); push(cen, u16(0)); push(cen, u16(0)); push(cen, u16(0)); push(cen, u16(0));
      push(cen, u32(0)); push(cen, u32(start)); push(cen, name);
      central.push(cen);
    });

    var cStart = offset, cSize = 0;
    central.forEach(function (cen) { cen.forEach(function (p) { chunks.push(p); cSize += p.length; }); });
    var end = [];
    end.push(u32(0x06054b50)); end.push(u16(0)); end.push(u16(0));
    end.push(u16(files.length)); end.push(u16(files.length));
    end.push(u32(cSize)); end.push(u32(cStart)); end.push(u16(0));
    end.forEach(function (p) { chunks.push(p); });
    return new Blob(chunks, { type: "application/zip" });
  }

  // ---------- collect the page's own files ----------
  function isLocal(u) { return u && !/^https?:/i.test(u) && !/^data:/i.test(u) && !/^blob:/i.test(u); }
  function pageName() { var p = (location.pathname.split("/").pop() || "index.html"); return p || "index.html"; }
  function collect() {
    var list = [pageName()];
    document.querySelectorAll("script[src]").forEach(function (s) { var u = s.getAttribute("src"); if (isLocal(u)) list.push(u); });
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) { var u = l.getAttribute("href"); if (isLocal(u)) list.push(u); });
    return list.filter(function (v, i, a) { return a.indexOf(v.split("?")[0]) === i; }).map(function (v) { return v.split("?")[0]; });
  }

  function run() {
    var ans = window.prompt("Quick question to unlock the source code:\n\nStone's fun fact — what does he NOT eat?");
    if (ans === null) return;
    if (ans.trim().toLowerCase() !== "chocolate") { alert("Not quite 🍫 — hint: it's a sweet treat. Try again."); return; }
    var files = collect();
    Promise.all(files.map(function (f) {
      return fetch(f).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (buf) { return { name: f, data: new Uint8Array(buf) }; })
        .catch(function () { return null; });
    })).then(function (results) {
      var ok = results.filter(Boolean);
      if (!ok.length) { alert("Couldn't read the source files (are you opening this over http, not file://?)."); return; }
      var base = pageName().replace(/\.html?$/i, "") || "tool";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(makeZip(ok));
      a.download = base + "-source.zip"; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-export-code]");
    if (b) { e.preventDefault(); run(); }
  });
})();
