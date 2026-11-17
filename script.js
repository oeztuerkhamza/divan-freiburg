(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  /* German is the default and lives in the HTML. Every other language is a file in i18n/ that
     registers itself on window.DIVAN_I18N and is loaded on demand. */
  var LANGS = ['de', 'en', 'tr', 'fr', 'es', 'it', 'el', 'ru', 'ar', 'fa', 'ku', 'ur', 'hi', 'ko', 'zh'];
  var RTL = { ar: true, fa: true, ur: true };
  var ARABIC = 'Noto+Naskh+Arabic:wght@500;600;700&family=Noto+Sans+Arabic:wght@400;500;600';
  var FONTS = {
    ar: ARABIC, fa: ARABIC, ur: ARABIC,
    hi: 'Noto+Serif+Devanagari:wght@500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600',
    ko: 'Noto+Serif+KR:wght@500;600;700&family=Noto+Sans+KR:wght@400;500;600',
    zh: 'Noto+Serif+SC:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;600',
    el: 'Noto+Serif:wght@500;600;700'
  };
  var dicts = window.DIVAN_I18N = window.DIVAN_I18N || {};

  var STORE_KEY = 'divan-lang';
  var nodes = document.querySelectorAll('[data-i18n]');
  var original = {};
  nodes.forEach(function (el) { original[el.getAttribute('data-i18n')] = el.innerHTML; });

  var langBox = document.getElementById('lang');
  var langBtn = langBox.querySelector('.lang__btn');
  var langCur = langBox.querySelector('.lang__cur');
  function closeLang() { langBox.classList.remove('is-open'); langBtn.setAttribute('aria-expanded', 'false'); }

  var fontsAdded = {};
  function loadFont(lang) {
    var q = FONTS[lang];
    if (!q || fontsAdded[q]) return;
    fontsAdded[q] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + q + '&display=swap';
    document.head.appendChild(l);
  }

  function loadDict(lang, done) {
    if (lang === 'de' || dicts[lang]) { done(true); return; }
    var s = document.createElement('script');
    s.src = 'i18n/' + lang + '.js';
    s.onload = function () { done(!!dicts[lang]); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  function apply(lang) {
    var dict = dicts[lang] || {};
    nodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = (lang !== 'de' && dict[key]) ? dict[key] : original[key];
    });
    var root = document.documentElement;
    root.lang = lang;
    root.dir = RTL[lang] ? 'rtl' : 'ltr';
    langCur.textContent = lang.toUpperCase();
    /* footer links to the generated SEO pages: German for DE, English for every other language */
    document.querySelectorAll('#seo-links a').forEach(function (a) {
      if (!a._de) a._de = { href: a.getAttribute('href'), text: a.textContent };
      a.setAttribute('href', lang === 'de' ? a._de.href : a.getAttribute('data-en-href'));
      a.textContent = lang === 'de' ? a._de.text : a.getAttribute('data-en');
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* private mode */ }
    document.dispatchEvent(new CustomEvent('divan:lang', { detail: lang }));
  }

  var wanted = 'de';
  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0) lang = 'de';
    wanted = lang;
    loadFont(lang);
    loadDict(lang, function (ok) {
      if (wanted !== lang) return; /* a newer choice won */
      apply(ok ? lang : 'de');
    });
  }

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); closeLang(); });
  });
  langBtn.addEventListener('click', function () {
    var open = langBox.classList.toggle('is-open');
    langBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) { if (!langBox.contains(e.target)) closeLang(); });

  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  var param = new URLSearchParams(location.search).get('lang');
  var browser = (navigator.language || 'de').slice(0, 2);
  var initial = [param, saved, browser].filter(function (l) { return LANGS.indexOf(l) >= 0; })[0] || 'de';
  if (initial !== 'de') setLang(initial);

  /* Header background on scroll */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  var links = document.getElementById('nav-links');
  function closeMenu() { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeLang(); } });

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
