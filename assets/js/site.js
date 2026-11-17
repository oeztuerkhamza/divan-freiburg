/* Divan Ocakbaşı – kleine Helfer. Ohne Cookies, ohne Local Storage, ohne externe Anfragen.
   Alle Inhalte sind auch ohne JavaScript vollständig erreichbar. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');

  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  var links = document.getElementById('nav-links');

  /* Kopfzeile beim Scrollen abdunkeln */
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobiles Menü */
  function setMenu(open) {
    if (!links || !burger) return;
    links.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) { var first = links.querySelector('a'); if (first) first.focus(); }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
  if (links) links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  /* Sprachauswahl: bei Klick daneben oder Escape schließen */
  var lang = document.querySelector('.lang');
  document.addEventListener('click', function (e) { if (lang && lang.open && !lang.contains(e.target)) lang.open = false; });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lang && lang.open) { lang.open = false; lang.querySelector('summary').focus(); }
    if (links && links.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* Einblenden beim Scrollen */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Geöffnet / geschlossen nach Freiburger Zeit */
  var statusEls = document.querySelectorAll('[data-status]');
  if (statusEls.length && window.Intl) {
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); } catch (e) { fmt = null; }
    var toMin = function (s) { return +s.slice(0, 2) * 60 + +s.slice(3, 5); };
    var update = function () {
      if (!fmt) return;
      var now = 0;
      fmt.formatToParts(new Date()).forEach(function (p) {
        if (p.type === 'hour') now += +p.value * 60;
        if (p.type === 'minute') now += +p.value;
      });
      statusEls.forEach(function (el) {
        var a = toMin(el.getAttribute('data-open')), b = toMin(el.getAttribute('data-close'));
        var open = a <= b ? (now >= a && now < b) : (now >= a || now < b);
        el.textContent = el.getAttribute(open ? 'data-t-open' : 'data-t-closed');
        el.classList.toggle('is-open', open);
        el.hidden = false;
      });
    };
    update();
    setInterval(update, 60000);
  }

  /* Karte erst nach Klick laden (Zwei-Klick-Lösung, Datenschutz) */
  document.querySelectorAll('[data-map-src]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('[data-map]');
      var frame = document.createElement('iframe');
      frame.src = btn.getAttribute('data-map-src');
      frame.title = btn.getAttribute('data-map-title') || 'Google Maps';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(frame);
    });
  });

  /* Speisekarte: Suche und aktive Kategorie */
  var search = document.getElementById('menu-search');
  var mnav = document.querySelector('.mnav');
  if (search) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.mitem'));
    var secs = Array.prototype.slice.call(document.querySelectorAll('.msec'));
    var empty = document.getElementById('menu-empty');
    var norm = function (s) {
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
    };
    rows.forEach(function (r) { r._s = norm(r.getAttribute('data-search') || ''); });
    search.addEventListener('input', function () {
      var q = norm(search.value.trim());
      var any = false;
      rows.forEach(function (r) { var hit = !q || r._s.indexOf(q) !== -1; r.hidden = !hit; if (hit) any = true; });
      secs.forEach(function (s) { s.hidden = !!q && !s.querySelector('.mitem:not([hidden])'); });
      if (empty) empty.hidden = any;
    });
  }
  if (mnav) {
    var heads = Array.prototype.slice.call(document.querySelectorAll('.msec h2[id]'));
    var map = {};
    mnav.querySelectorAll('a').forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var current = null, ticking = false;
    var spy = function () {
      ticking = false;
      var c = null;
      heads.forEach(function (h) { if (!h.closest('[hidden]') && h.getBoundingClientRect().top < 170) c = h; });
      if (c === current) return;
      current = c;
      Object.keys(map).forEach(function (k) { map[k].removeAttribute('aria-current'); });
      if (!c) { mnav.scrollTo({ left: 0, behavior: 'smooth' }); return; }
      var a = map[c.id];
      if (!a) return;
      a.setAttribute('aria-current', 'true');
      var r = a.getBoundingClientRect(), q = mnav.getBoundingClientRect();
      mnav.scrollBy({ left: r.left + r.width / 2 - (q.left + q.width / 2), behavior: 'smooth' });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  /* Sprachhinweis: Besucher von außen, deren Browsersprache wir anbieten (keine automatische Umleitung) */
  try {
    var hintsEl = document.getElementById('lang-hints');
    var fromOutside = !document.referrer || document.referrer.indexOf(location.host) === -1;
    if (hintsEl && fromOutside) {
      var hints = JSON.parse(hintsEl.textContent);
      var here = doc.getAttribute('lang');
      var alts = {};
      document.querySelectorAll('.lang__list a[hreflang]').forEach(function (l) {
        alts[l.getAttribute('hreflang').split('-')[0]] = l.href;
      });
      var wanted = (navigator.languages || [navigator.language || '']).map(function (l) { return l.slice(0, 2).toLowerCase(); });
      var target = null;
      for (var i = 0; i < wanted.length; i++) {
        if (wanted[i] === here.slice(0, 2)) break;
        if (alts[wanted[i]] && hints[wanted[i]]) { target = wanted[i]; break; }
      }
      if (target) {
        var h = hints[target];
        var bar = document.createElement('div');
        bar.className = 'hint';
        bar.setAttribute('role', 'region');
        bar.setAttribute('data-nosnippet', '');
        bar.setAttribute('lang', target);
        bar.setAttribute('dir', /^(ar|fa|ur)$/.test(target) ? 'rtl' : 'ltr');
        var p = document.createElement('p'); p.textContent = h[0];
        var a = document.createElement('a'); a.textContent = h[1];
        a.href = alts[target];
        a.setAttribute('hreflang', target);
        var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', h[2]);
        x.addEventListener('click', function () { bar.remove(); });
        bar.appendChild(p); bar.appendChild(a); bar.appendChild(x);
        document.body.appendChild(bar);
      }
    }
  } catch (e) { /* Hinweis ist optional */ }
})();
