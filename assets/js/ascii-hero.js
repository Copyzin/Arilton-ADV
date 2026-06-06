/* Arilton - ASCII hero: render tonal INVERTIDO (tinta clara) preenchendo o hero (cover, reposicionado) */
/* + glitch monocromatico em LINHA (larga/curta) com falloff suave no cursor + marcas de canto. */

(function () {
  'use strict';

  /* ---------- Marcas de canto (blueprint) ---------- */
  function initCorners() {
    var nodes = document.querySelectorAll('[data-corners]');
    Array.prototype.forEach.call(nodes, function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      ['tl', 'tr', 'bl', 'br'].forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'cmark cmark--' + c;
        s.setAttribute('aria-hidden', 'true');
        s.textContent = '+';
        el.appendChild(s);
      });
    });
  }

  /* ---------- ASCII hero canvas ---------- */
  var canvas = document.getElementById('asciiCanvas');
  var box = canvas ? canvas.parentElement : null;          // .hero-ascii (full-bleed)
  var heroEl = canvas ? canvas.closest('.hero') : null;
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d', { willReadFrequently: true }) : null;

  var rows = [], artW = 0, artH = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, cssW = 0, cssH = 0;
  var src = null, srcCtx = null, srcData = null, interactive = false;
  var pointer = { x: 0, y: 0, inside: false };
  var rafId = null, lastShuffle = 0;
  var INK = '245,245,248';                                  // invertido: tinta clara sobre hero escuro

  /* reposicionamento do recorte (cover): desloca o desenho p/ direita e p/ baixo */
  var OVER = 1.18;          // leve over-cover -> folga p/ reposicionar sem abrir buraco
  var SHIFT_X = 0.42;       // fracao da folga horizontal (direita) - menor = puxa p/ esquerda (mostra a balanca)
  var SHIFT_Y = 0.72;       // fracao da folga vertical (baixo -> revela o rosto)

  var DENS = { '%': 0.95, '#': 0.82, '*': 0.6, '+': 0.3, '=': 0.34, '-': 0.22, ':': 0.2, '.': 0.13 };

  function boot() {
    initCorners();
    if (!ctx) return;
    fetch('ascii-art.txt', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (text) {
        rows = text.replace(/\r/g, '').split('\n');
        while (rows.length && rows[rows.length - 1].replace(/\s+/g, '') === '') rows.pop();
        artH = rows.length;
        for (var i = 0; i < artH; i++) if (rows[i].length > artW) artW = rows[i].length;
        if (!artH || !artW) return;
        evalMode(); build(); bind();
      })
      .catch(function () { /* sem ASCII: hero segue normal */ });
  }

  function evalMode() {
    interactive = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      && window.matchMedia('(min-width: 861px)').matches;
  }

  function build() {
    if (!box) return;
    var cw = box.clientWidth, chh = box.clientHeight;
    if (cw < 8 || chh < 8) return;
    var cellAspect = 0.5;
    var cellH = Math.max(chh / artH, cw / (artW * cellAspect)) * OVER;  // cover + folga
    var cellW = cellH * cellAspect;
    cssW = Math.max(1, Math.round(artW * cellW));
    cssH = Math.max(1, Math.round(artH * cellH));
    W = Math.max(1, Math.floor(cssW * dpr));
    H = Math.max(1, Math.floor(cssH * dpr));
    canvas.width = W; canvas.height = H;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    /* reposiciona o recorte sem expor bordas (offset dentro da folga) */
    var slackX = (cssW - cw) / 2, slackY = (cssH - chh) / 2;
    var offX = slackX * SHIFT_X, offY = slackY * SHIFT_Y;
    canvas.style.left = (cw / 2 + offX) + 'px';
    canvas.style.top = (chh / 2 + offY) + 'px';
    canvas.style.transform = 'translate(-50%,-50%)';
    renderSource(cellW * dpr, cellH * dpr);
    drawBase();
  }

  function renderSource(cw, ch) {
    if (!src) src = document.createElement('canvas');
    src.width = W; src.height = H;
    srcCtx = src.getContext('2d', { willReadFrequently: true });
    srcCtx.clearRect(0, 0, W, H);
    srcCtx.textBaseline = 'top';
    srcCtx.font = '700 ' + (ch * 1.32) + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
    var types = Object.keys(DENS);
    for (var t = 0; t < types.length; t++) {
      var T = types[t];
      srcCtx.fillStyle = 'rgba(' + INK + ',' + DENS[T] + ')';
      for (var r = 0; r < artH; r++) {
        var line = rows[r]; if (!line) continue;
        var y = r * ch, idx = -1;
        while ((idx = line.indexOf(T, idx + 1)) !== -1) srcCtx.fillText(T, idx * cw, y);
      }
    }
    srcData = srcCtx.getImageData(0, 0, W, H);
  }

  function drawBase() { if (src) { ctx.clearRect(0, 0, W, H); ctx.drawImage(src, 0, 0); } }

  function bind() {
    var deb;
    window.addEventListener('resize', function () {
      clearTimeout(deb);
      deb = setTimeout(function () { evalMode(); build(); }, 160);
    });
    if (!interactive || !heroEl) return;
    heroEl.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) * (W / rect.width);
      pointer.y = (e.clientY - rect.top) * (H / rect.height);
      pointer.inside = true; heroEl.classList.add('is-touched'); kick();
    });
    heroEl.addEventListener('pointerleave', function () { pointer.inside = false; });
  }

  function kick() { if (rafId == null) rafId = requestAnimationFrame(loop); }

  /* glitch em LINHA: larga, altura curta, deslocamento horizontal por faixas, */
  /* taper smoothstep nas duas direcoes -> bordas dissipam, sem limite nitido.  */
  function loop(ts) {
    if (!pointer.inside) { drawBase(); rafId = null; return; }
    if (ts - lastShuffle < 45) { rafId = requestAnimationFrame(loop); return; }
    lastShuffle = ts;
    drawBase();
    if (!srcData) { rafId = requestAnimationFrame(loop); return; }

    var halfW = 320 * dpr;     // metade do comprimento da linha (larga)
    var halfH = 30 * dpr;      // metade da altura (curta)
    var amp = 20 * dpr;        // intensidade do deslocamento
    var cx = pointer.x, cy = pointer.y;
    var rx = Math.max(0, Math.floor(cx - halfW)), rxe = Math.min(W, Math.ceil(cx + halfW));
    var ry = Math.max(0, Math.floor(cy - halfH)), rye = Math.min(H, Math.ceil(cy + halfH));
    var rw = rxe - rx, rh = rye - ry;
    if (rw <= 0 || rh <= 0) { rafId = requestAnimationFrame(loop); return; }

    var bandPx = Math.max(1, Math.round(3 * dpr));
    var nBands = Math.ceil(rh / bandPx) + 1;
    var offs = new Float32Array(nBands);
    for (var b = 0; b < nBands; b++) offs[b] = Math.random() * 2 - 1;

    var s = srcData.data;
    var out = ctx.createImageData(rw, rh);
    var o = out.data;

    for (var y = ry; y < rye; y++) {
      var vy = (y - cy) / halfH; if (vy < 0) vy = -vy;
      var vF = vy >= 1 ? 0 : (1 - vy); vF = vF * vF * (3 - 2 * vF);       // smoothstep vertical
      var rowOff = offs[((y - ry) / bandPx) | 0];
      var orow = (y - ry) * rw, srow = y * W;
      for (var x = rx; x < rxe; x++) {
        var di = (orow + (x - rx)) << 2;
        if (vF <= 0.0008) {
          var si0 = (srow + x) << 2;
          o[di] = s[si0]; o[di + 1] = s[si0 + 1]; o[di + 2] = s[si0 + 2]; o[di + 3] = s[si0 + 3];
          continue;
        }
        var hx = (x - cx) / halfW; if (hx < 0) hx = -hx;
        var hF = hx >= 1 ? 0 : (1 - hx); hF = hF * hF * (3 - 2 * hF);     // smoothstep horizontal
        var dx = (rowOff * amp * vF * hF) | 0;
        var sx = x - dx; if (sx < 0) sx = 0; else if (sx >= W) sx = W - 1;
        var si = (srow + sx) << 2;
        o[di] = s[si]; o[di + 1] = s[si + 1]; o[di + 2] = s[si + 2]; o[di + 3] = s[si + 3];
      }
    }
    ctx.putImageData(out, rx, ry);
    rafId = requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
