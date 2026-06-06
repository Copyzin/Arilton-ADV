/* Arilton Silva Advocacia - main.js */
/* Vanilla JS + GSAP 3 / ScrollTrigger. Mecanicas da agencia. */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';

  if (!hasGSAP || !hasST || prefersReduced) {
    document.documentElement.classList.add('reveal-immediate');
  }
  if (hasGSAP && hasST) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Header: scroll-linked exit + threshold reveal ---------- */
  var header = document.getElementById('siteHeader');
  var hero = document.querySelector('.hero');
  var EXIT_ZONE = 220;
  var UP_REVEAL_THRESHOLD = 60;
  var DOWN_DELTA_THRESHOLD = 6;
  var lastY = window.scrollY;
  var upAccum = 0;
  var wasRetracted = false;
  var hasCrossedHero = false;

  function heroBottom() {
    return hero ? hero.offsetTop + hero.offsetHeight : 600;
  }

  function onHeaderScroll() {
    if (!header) return;
    var y = window.scrollY;
    var hb = heroBottom();
    var exitStart = hb - EXIT_ZONE;

    if (y > 8) header.classList.add('is-elevated');
    else header.classList.remove('is-elevated');

    if (y < exitStart) {
      hasCrossedHero = false;
      header.classList.remove('is-linked');
      header.classList.remove('is-hidden');
      header.style.transform = '';
      wasRetracted = false;
      upAccum = 0;
    } else if (y < hb) {
      if (hasCrossedHero) {
        /* scrolling back UP through the hero — keep header fully visible */
        header.classList.remove('is-linked');
        header.classList.remove('is-hidden');
        header.style.transform = '';
        upAccum = 0;
      } else {
        /* scrolling DOWN through the hero — scroll-linked exit animation */
        header.classList.add('is-linked');
        header.classList.remove('is-hidden');
        var progress = (y - exitStart) / EXIT_ZONE;
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;
        header.style.transform = 'translateY(' + (-progress * 100) + '%)';
        wasRetracted = progress >= 1;
        upAccum = 0;
      }
    } else {
      hasCrossedHero = true;
      header.classList.remove('is-linked');
      if (header.style.transform) {
        header.style.transform = '';
        if (wasRetracted) header.classList.add('is-hidden');
      }
      var dy = y - lastY;
      if (dy > DOWN_DELTA_THRESHOLD) {
        upAccum = 0;
        header.classList.add('is-hidden');
      } else if (dy < 0) {
        upAccum += -dy;
        if (upAccum >= UP_REVEAL_THRESHOLD) header.classList.remove('is-hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* Mobile menu (clip-path splash) retirado neste cliente: a navegacao mobile usa a lista-trilho (#sectionRail) */

  /* ---------- Mobile sticky bar + WhatsApp FAB ---------- */
  /* No GSAP on FAB transform: CSS owns it (avoids the translateY(120%) capture bug) */
  var stickyBar = document.getElementById('mobileStickyBar');
  var fab = document.getElementById('whatsappFab');
  function onStickyScroll() {
    if (!hero) return;
    var show = window.scrollY > hero.offsetHeight * 0.55;
    if (stickyBar) stickyBar.classList.toggle('is-visible', show);
    if (fab) fab.classList.toggle('is-visible', show);
  }
  window.addEventListener('scroll', onStickyScroll, { passive: true });
  onStickyScroll();

  /* ---------- Mobile section rail (wayfinder: vidro + trilho com ponto ativo) ---------- */
  var sectionRail = document.getElementById('sectionRail');
  var railDot = document.getElementById('sectionRailDot');
  if (sectionRail && railDot && hero) {
    var mqMobile = window.matchMedia('(max-width: 767px)');
    var railLinks = Array.prototype.slice.call(sectionRail.querySelectorAll('[data-rail-link]'));
    var railTrack = document.getElementById('sectionRailTrack');
    var railToggle = document.getElementById('sectionRailToggle');
    var ctaFinal = document.querySelector('.cta-final');
    var railTargets = railLinks.map(function (link) {
      var href = link.getAttribute('href');
      return { link: link, el: href === '#top' ? null : document.querySelector(href), isTop: href === '#top' };
    });

    var RAIL_DIR_THRESHOLD = 48;   /* px acumulados p/ minimizar/expandir */
    var railTopPx = parseFloat(getComputedStyle(sectionRail).top) || 56;
    var railWasVisible = false, railMin = false;
    var railLastY = window.scrollY, railDownAccum = 0, railUpAccum = 0;
    var spyLock = false, spyTimer = null;

    function railActiveIndex() {
      var mid = window.scrollY + window.innerHeight * 0.45;
      var idx = 0;
      railTargets.forEach(function (t, i) {
        if (!t.isTop && t.el && t.el.offsetTop <= mid) idx = i;
      });
      return idx;
    }
    function moveRailDot(idx) {
      var linkRect = railTargets[idx].link.getBoundingClientRect();
      var trackRect = railTrack.getBoundingClientRect();
      var y = (linkRect.top + linkRect.height / 2) - trackRect.top - railDot.offsetHeight / 2;
      railDot.style.transform = 'translate(-50%,' + y + 'px)';
    }
    function setActiveRail(idx) {
      railTargets.forEach(function (t, i) {
        t.link.classList.toggle('is-active', i === idx);
        if (i === idx) t.link.setAttribute('aria-current', 'true');
        else t.link.removeAttribute('aria-current');
      });
      moveRailDot(idx);
    }
    function updateMinimize() {
      var y = window.scrollY, dy = y - railLastY;
      railLastY = y;
      if (dy > 0) { railDownAccum += dy; railUpAccum = 0; if (railDownAccum >= RAIL_DIR_THRESHOLD) railMin = true; }
      else if (dy < 0) { railUpAccum -= dy; railDownAccum = 0; if (railUpAccum >= RAIL_DIR_THRESHOLD) railMin = false; }
      sectionRail.classList.toggle('is-min', railMin);
    }
    function expandRail() {
      railMin = false; railDownAccum = 0; railUpAccum = 0; railLastY = window.scrollY;
      sectionRail.classList.remove('is-min');
    }
    function updateRail() {
      if (!mqMobile.matches) { sectionRail.classList.remove('is-visible'); railWasVisible = false; return; }
      var heroClear = hero.getBoundingClientRect().bottom <= railTopPx;   /* regra geometrica: hero fora do painel */
      var beforeDark = ctaFinal ? (ctaFinal.getBoundingClientRect().top > window.innerHeight * 0.6) : true;
      var visible = heroClear && beforeDark;
      sectionRail.classList.toggle('is-visible', visible);
      sectionRail.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) { railWasVisible = false; return; }
      if (!railWasVisible) { railWasVisible = true; expandRail(); }   /* entrou na faixa -> expandido */
      if (spyLock) return;                                           /* navegacao por clique: ponto/estado congelados */
      updateMinimize();
      setActiveRail(railActiveIndex());
    }
    function releaseSpy() {
      spyLock = false; clearTimeout(spyTimer);
      railLastY = window.scrollY; railDownAccum = 0; railUpAccum = 0;
      updateRail();
    }
    if (railToggle) {
      railToggle.addEventListener('click', function () {
        railMin = true; railDownAccum = 0; railUpAccum = 0;
        sectionRail.classList.add('is-min');
      });
    }
    if (railTrack) {
      railTrack.addEventListener('click', function () {
        if (railMin) expandRail();
      });
    }
    railLinks.forEach(function (link, i) {
      link.addEventListener('click', function () {
        expandRail(); setActiveRail(i);                              /* alvo imediato, painel expandido */
        spyLock = true; clearTimeout(spyTimer); spyTimer = setTimeout(releaseSpy, 900);
      });
    });
    window.addEventListener('scrollend', function () { if (spyLock) releaseSpy(); });
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', function () {
      railTopPx = parseFloat(getComputedStyle(sectionRail).top) || 56;
      updateRail();
    }, { passive: true });
    updateRail();
  }

  /* ---------- Active nav link (scroll-linked) ---------- */
  var navLinks = document.querySelectorAll('.nav-link');
  if (navLinks.length > 0) {
    var navSections = [];
    Array.prototype.forEach.call(navLinks, function (link) {
      var href = link.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        var sec = document.querySelector(href);
        if (sec) navSections.push({ el: sec, link: link });
      }
    });
    function updateActiveNav() {
      var scrollMid = window.scrollY + window.innerHeight * 0.45;
      var current = null;
      navSections.forEach(function (s) {
        if (s.el.offsetTop <= scrollMid) current = s;
      });
      navSections.forEach(function (s) {
        s.link.classList.toggle('is-active', s === current);
      });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  /* ---------- Entry reveals (GSAP + ScrollTrigger) ---------- */
  if (hasGSAP && hasST && !prefersReduced) {
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } })
      .to('[data-anim="hero-wordmark"]', { opacity: 1, y: 0, duration: 0.8 })
      .to('[data-anim="hero-eyebrow"]', { opacity: 1, y: 0 }, '-=0.45')
      .to('[data-anim="hero-title"]', { opacity: 1, y: 0 }, '-=0.6')
      .to('[data-anim="hero-sub"]', { opacity: 1, y: 0 }, '-=0.55')
      .to('[data-anim="hero-cta"]', { opacity: 1, y: 0 }, '-=0.5')
      .to('[data-anim="hero-meta"]', { opacity: 1, y: 0 }, '-=0.5')
      .to('[data-anim="hero-ascii"]', { opacity: 1, x: 0, duration: 1.1 }, '-=0.85');

    function reveal(sel, vars) {
      gsap.utils.toArray(sel).forEach(function (el) {
        gsap.to(el, Object.assign({ opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'power3.out' }, vars || {}, {
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }));
      });
    }
    reveal('[data-anim="about-image"]');
    reveal('[data-anim="about-text"]');
    reveal('[data-anim="section-title"]');

    function batchReveal(sel, stagger, start) {
      ScrollTrigger.batch(sel, {
        start: start || 'top 88%',
        onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.8, stagger: stagger, ease: 'power3.out' }); }
      });
    }
    batchReveal('[data-anim="area-card"]', 0.08);
    batchReveal('[data-anim="step"]', 0.1);
    batchReveal('[data-anim="faq-item"]', 0.06, 'top 90%');
    batchReveal('[data-anim="final-cta"]', 0.1, 'top 85%');
  }

  /* ---------- Text Trace (cascade caractere-por-caractere) ---------- */
  var traceTargets = document.querySelectorAll('[data-anim="text-trace"]');
  Array.prototype.forEach.call(traceTargets, function (el) {
    var hasInline = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 1; });
    if (hasInline) { return; }

    var traceColor = getComputedStyle(el).color;
    el.style.setProperty('--trace-color', traceColor);

    var rawText = el.textContent;
    el.textContent = '';
    var chars = [];
    rawText.split(/(\s+)/).forEach(function (tok) {
      if (tok.length === 0) return;
      if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
      var word = document.createElement('span');
      word.className = 'trace-word';
      for (var i = 0; i < tok.length; i++) {
        var span = document.createElement('span');
        span.className = 'trace-char';
        span.textContent = tok[i];
        word.appendChild(span);
        chars.push(span);
      }
      el.appendChild(word);
    });
    if (chars.length === 0) return;

    var staggerMs = parseInt(el.dataset.traceStaggerMs, 10) || 35;
    var durationMs = parseInt(el.dataset.traceDurationMs, 10) || 600;
    if (prefersReduced) return;

    chars.forEach(function (c) { c.style.setProperty('--trace-duration', durationMs + 'ms'); });

    var triggered = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          io.disconnect();
          chars.forEach(function (ch, i) {
            ch.style.setProperty('--trace-delay', i * staggerMs + 'ms');
            ch.classList.add('is-animating');
          });
        }
      });
    }, { threshold: 0.1 });
    io.observe(el);
  });

  /* ---------- FAQ accordion (um aberto por vez) ---------- */
  var faqItems = document.querySelectorAll('#faqList .faq-item');
  Array.prototype.forEach.call(faqItems, function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        Array.prototype.forEach.call(faqItems, function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- WhatsApp mini-FAQ chat (desktop: hover na FAB + auto-peek 1x) ---------- */
  var waWidget = document.getElementById('waWidget');
  var waFab = document.getElementById('whatsappFab');
  if (waWidget) {
    var waThread = document.getElementById('waThread');
    var waQuick = document.getElementById('waQuick');
    var waScroll = document.getElementById('waScroll');
    var waMsgs = [waWidget.dataset.msg1, waWidget.dataset.msg2, waWidget.dataset.msg3].filter(Boolean);
    var waWelcome = waMsgs.length ? waMsgs[Math.floor(Math.random() * waMsgs.length)] : 'Ola! Como posso ajudar?';
    var waReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* perguntas/respostas vem do proprio FAQ (fonte unica) */
    var waFaqs = [];
    Array.prototype.forEach.call(document.querySelectorAll('#faqList .faq-item'), function (it) {
      var q = it.querySelector('summary span');
      var a = it.querySelector('.faq-a p');
      if (q && a) waFaqs.push({ q: q.textContent.trim(), a: a.textContent.trim(), used: false });
    });

    function waScrollBottom() { if (waScroll) waScroll.scrollTop = waScroll.scrollHeight; }
    function waScrollToEl(el) {
      if (!waScroll || !el) return;
      var top = el.getBoundingClientRect().top - waScroll.getBoundingClientRect().top + waScroll.scrollTop;
      waScroll.scrollTop = Math.max(0, top - 8);
    }
    function waBubble(side, text) {
      var b = document.createElement('div');
      b.className = 'wa-bubble wa-bubble--' + side;
      b.textContent = text;
      if (waThread) waThread.appendChild(b);
      waScrollBottom();
      return b;
    }
    function waTypingBubble() {
      var b = document.createElement('div');
      b.className = 'wa-bubble wa-bubble--in wa-bubble--typing';
      b.innerHTML = '<span class="wa-dots"><span></span><span></span><span></span></span>';
      if (waThread) waThread.appendChild(b);
      waScrollBottom();
      return b;
    }
    function waSay(text, cb) {
      if (waReduced) { waBubble('in', text); if (cb) cb(); return; }
      var t = waTypingBubble();
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); waBubble('in', text); if (cb) cb(); }, 750);
    }
    function waRenderChips() {
      if (!waQuick) return;
      waQuick.innerHTML = '';
      var remaining = 0;
      waFaqs.forEach(function (f) {
        if (f.used) return;
        remaining++;
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'wa-chip';
        c.textContent = f.q;
        c.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          waPinned = true;
          f.used = true;
          var qb = waBubble('out', f.q);
          waQuick.innerHTML = '';
          waSay(f.a, function () { waRenderChips(); waScrollToEl(qb); });
        });
        waQuick.appendChild(c);
      });
      if (remaining === 0) {
        var p = document.createElement('p');
        p.className = 'wa-quick-end';
        p.textContent = waWidget.dataset.end || 'Fale com a gente no WhatsApp.';
        waQuick.appendChild(p);
      }
      waScrollBottom();
    }

    var waBuilt = false;
    function waBuildChat() { if (waBuilt) return; waBuilt = true; waSay(waWelcome, waRenderChips); }

    var waTeaser = document.getElementById('waTeaser');
    var waTeaserOpen = document.getElementById('waTeaserOpen');
    var waTeaserClose = document.getElementById('waTeaserClose');
    var waCanHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var waOverFab = false, waOverPanel = false, waCloseT = null, waDismissed = false, waPinned = false, waReady = false, waTimerStarted = false;
    var WA_TEASER_DELAY = 10000;

    function waFabVisible() { return !waFab || waFab.classList.contains('is-visible'); }
    function waChatOpen() { return waWidget.classList.contains('is-open'); }
    function waSyncTeaser() {
      if (!waTeaser) return;
      if (waReady && !waDismissed && waFabVisible() && !waChatOpen()) waTeaser.classList.add('is-shown');
      else waTeaser.classList.remove('is-shown');
    }
    function waHideTeaser() { if (waTeaser) waTeaser.classList.remove('is-shown'); }
    function waStartTimer() {
      if (waTimerStarted || waDismissed || !waFabVisible()) return;
      waTimerStarted = true;
      setTimeout(function () { waReady = true; waSyncTeaser(); }, WA_TEASER_DELAY);
    }
    function waOpen() {
      if (waDismissed || !waFabVisible()) return;
      waReady = true;
      waHideTeaser();
      waWidget.classList.add('is-open');
      waBuildChat();
    }
    function waBackToTeaser() {
      waWidget.classList.remove('is-open');
      waPinned = false;
      waSyncTeaser();
    }
    function waDismiss() {
      waDismissed = true; waPinned = false;
      waWidget.classList.remove('is-open');
      waHideTeaser();
    }
    function waScheduleClose() {
      clearTimeout(waCloseT);
      waCloseT = setTimeout(function () {
        if (!waOverFab && !waOverPanel && !waPinned) waBackToTeaser();
      }, 260);
    }

    var waCloseBtn = document.getElementById('waClose');
    if (waCloseBtn) waCloseBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });
    if (waTeaserOpen) waTeaserOpen.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waPinned = true; waOpen(); });
    if (waTeaserClose) waTeaserClose.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });

    if (waCanHover) {
      if (waFab) {
        waFab.addEventListener('pointerenter', function () { waOverFab = true; clearTimeout(waCloseT); waOpen(); });
        waFab.addEventListener('pointerleave', function () { waOverFab = false; waScheduleClose(); });
      }
      waWidget.addEventListener('pointerenter', function () { waOverPanel = true; clearTimeout(waCloseT); });
      waWidget.addEventListener('pointerleave', function () { waOverPanel = false; waScheduleClose(); });
      document.addEventListener('click', function (e) {
        if (!waChatOpen()) return;
        if (waWidget.contains(e.target) || (waFab && waFab.contains(e.target)) || (waTeaser && waTeaser.contains(e.target))) return;
        waBackToTeaser();
      });
    }

    window.addEventListener('scroll', function () { waStartTimer(); waSyncTeaser(); }, { passive: true });
    waStartTimer();
    waSyncTeaser();
  }

  /* ---------- Recalibra ScrollTrigger apos load (fontes/imagens) ---------- */
  window.addEventListener('load', function () { if (hasST) ScrollTrigger.refresh(); });

})();
