/* Google reviews via the Places API (New), shown live with author attribution as Google requires.
   Setup: Google Cloud Console -> enable "Places API (New)" -> create an API key and restrict it
   (HTTP referrers = this site's address, API restriction = Places API (New)). Paste it below.
   Without a key the section stays hidden. The key is visible in the browser; the referrer
   restriction is what protects it. */
(function () {
  'use strict';

  var PLACE_ID = 'ChIJTZYB72EbkUcRHkw_vobgWvc';
  var API_KEY = 'AIzaSyCPAUtxxZF865iex1qtFxvnE5lq5sPdG7E';

  var section = document.getElementById('reviews');
  if (!section || !API_KEY) return;

  var CACHE_KEY = 'divan-reviews';
  var CACHE_MS = 12 * 3600 * 1000; /* each visitor's browser asks Google at most twice a day */
  var list = document.getElementById('rev-list');
  var score = document.getElementById('rev-score');
  var stars = document.getElementById('rev-stars');
  var count = document.getElementById('rev-n');
  var data = null;

  function lang() { return document.documentElement.lang || 'de'; }
  function num(n, opts) {
    try { return new Intl.NumberFormat(lang() + '-u-nu-latn', opts).format(n); } catch (e) { return String(n); }
  }
  function ago(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var days = Math.round((Date.now() - d) / 864e5);
    var v = days < 7 ? [days, 'day'] : days < 30 ? [Math.round(days / 7), 'week'] : days < 365 ? [Math.round(days / 30), 'month'] : [Math.round(days / 365), 'year'];
    try { return new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' }).format(-v[0], v[1]); } catch (e) { return d.toLocaleDateString(); }
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function https(u) { return typeof u === 'string' && /^https:\/\//.test(u) ? u : ''; }

  function render() {
    if (!data) return;
    score.textContent = num(data.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    stars.style.setProperty('--p', (data.rating / 5).toFixed(3));
    count.textContent = num(data.userRatingCount);

    list.textContent = '';
    var shown = 0;
    data.reviews.forEach(function (r) {
      var text = (r.originalText && r.originalText.text) || (r.text && r.text.text) || '';
      if (!text) return; /* rating-only reviews have nothing to show */
      var a = r.authorAttribution || {};
      var link = https(a.uri), photo = https(a.photoUri);

      var card = el('article', 'rev__card');
      card.style.setProperty('--i', String(shown++));

      var who = el(link ? 'a' : 'div', 'rev__who');
      if (link) { who.href = link; who.target = '_blank'; who.rel = 'noopener nofollow'; }
      if (photo) {
        var img = el('img');
        img.src = photo; img.alt = ''; img.width = 40; img.height = 40; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
        who.appendChild(img);
      }
      who.appendChild(el('span', 'rev__name', a.displayName || ''));

      var meta = el('div', 'rev__meta2');
      var st = el('span', 'stars', '★★★★★');
      st.style.setProperty('--p', (r.rating / 5).toFixed(2));
      st.setAttribute('role', 'img');
      st.setAttribute('aria-label', r.rating + ' / 5');
      meta.appendChild(st);
      meta.appendChild(el('time', 'rev__when', ago(r.publishTime)));

      card.appendChild(who);
      card.appendChild(meta);
      card.appendChild(el('p', 'rev__text', text));
      list.appendChild(card);
    });
    section.hidden = shown === 0;
  }

  function load(done) {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && Date.now() - c.t < CACHE_MS) { done(c.d); return; }
    } catch (e) { /* ignore */ }
    fetch('https://places.googleapis.com/v1/places/' + PLACE_ID + '?languageCode=de', {
      /* send the full page URL (not just the origin) so a path-restricted key can tell this site from other
         projects on the same github.io domain */
      referrerPolicy: 'no-referrer-when-downgrade',
      headers: { 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' }
    })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (d) {
        if (typeof d.rating !== 'number') throw new Error('no rating');
        var out = { rating: d.rating, userRatingCount: d.userRatingCount || 0, reviews: d.reviews || [] };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: out })); } catch (e) { /* ignore */ }
        done(out);
      })
      .catch(function (err) { if (window.console) console.warn('Google reviews unavailable:', err.message); });
  }

  document.addEventListener('divan:lang', render);
  load(function (d) { data = d; render(); });
})();
