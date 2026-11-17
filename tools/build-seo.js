#!/usr/bin/env node
/* Generates the static SEO pages (German at /slug/, English at /en/slug/), sitemap.xml and robots.txt.
   No dependencies: `node tools/build-seo.js`. Content lives in tools/seo-content.js, styles in page.css.
   Changing the domain = edit SITE in seo-content.js and run this again. */
const fs = require('fs');
const path = require('path');
const C = require('./seo-content.js');
const { SITE, TEL, MENU_URL, LIEFERANDO, WOLT, ROUTE, INSTAGRAM, GOOGLE_MAPS, GEO, BUILT, DIST, T, pages } = C;

const ROOT = path.join(__dirname, '..');
const LANGS = ['de', 'en'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const slugOf = (p, l) => p.slug[l];
const dirOf = (p, l) => (l === 'de' ? '' : 'en/') + slugOf(p, l) + '/';
const urlOf = (p, l) => `${SITE}/${dirOf(p, l)}`;
const rootRel = l => (l === 'de' ? '../' : '../../');
/* relative link from a page in language `from` to page `p` in language `to` */
const relTo = (from, p, to) => (from === 'de' ? '../' : '../../') + dirOf(p, to);
const byId = id => pages.find(p => p.id === id);

function distTable(l, keys) {
  const t = T[l];
  const rows = keys.map(k => DIST[k]).filter(Boolean).sort((a, b) => a[2] - b[2]);
  const fmt = m => {
    let s = m >= 1000 ? (m / 1000).toFixed(2).replace(/0$/, '') + ' km' : m + ' m';
    if (l === 'de') s = s.replace('.', ',');
    return `${t.approx} ${s}`;
  };
  return `<table class="dist"><caption>${esc(t.distCaption)}</caption><thead><tr>${t.distCols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>` +
    rows.map(r => `<tr><th scope="row">${esc(l === 'de' ? r[0] : r[1])}</th><td>${fmt(r[2])}</td><td>${t.approx} ${r[3]} ${t.min}</td></tr>`).join('') +
    '</tbody></table>';
}

function factsBox(l) {
  const t = T[l];
  return `<div class="facts-box"><h2>${esc(t.factsTitle)}</h2><dl>
<div><dt>${esc(t.address)}</dt><dd>Bertoldstraße 54<br>79098 Freiburg im Breisgau</dd></div>
<div><dt>${esc(t.phone)}</dt><dd><a href="tel:${TEL}" dir="ltr">0761 2927151</a></dd></div>
<div><dt>${esc(t.hours)}</dt><dd>${esc(t.hoursVal)}</dd></div>
<div><dt>${esc(t.lunch)}</dt><dd>${esc(t.lunchVal)}</dd></div>
</dl></div>`;
}

function renderBody(p, l) {
  const t = T[l], c = p[l];
  const fig = p.img
    ? `<figure class="pg-figure"><img src="${rootRel(l)}img/${p.img.src}" alt="${esc(c.figAlt)}" width="${p.img.w}" height="${p.img.h}" loading="lazy"></figure>`
    : '';
  return c.body
    .replace(/\[\[fig\]\]/g, fig)
    .replace(/\[\[facts\]\]/g, factsBox(l))
    .replace(/\[\[dist:([a-z,]+)\]\]/g, (_, ks) => distTable(l, ks.split(',')))
    .replace(/\[\[link:([a-z]+)\|([^\]]+)\]\]/g, (_, id, text) => {
      const target = byId(id);
      if (!target) throw new Error('unknown link target ' + id + ' in ' + p.id);
      return `<a href="${relTo(l, target, l)}">${text}</a>`;
    });
}

function jsonLd(p, l) {
  const t = T[l], c = p[l], url = urlOf(p, l);
  const restaurant = {
    '@type': 'Restaurant', '@id': SITE + '/#restaurant', name: 'Divan Ocakbaşı', url: SITE + '/',
    image: [SITE + '/img/hero.jpg', SITE + '/img/adana.jpg', SITE + '/img/meze.jpg'],
    telephone: '+49 761 2927151', servesCuisine: ['Türkisch', 'Anatolisch', 'Grill'],
    address: { '@type': 'PostalAddress', streetAddress: 'Bertoldstraße 54', postalCode: '79098', addressLocality: 'Freiburg im Breisgau', addressCountry: 'DE' },
    geo: { '@type': 'GeoCoordinates', latitude: GEO.lat, longitude: GEO.lon },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '11:30', closes: '23:30' }],
    hasMenu: MENU_URL, acceptsReservations: true,
    sameAs: [INSTAGRAM, GOOGLE_MAPS, LIEFERANDO, WOLT]
  };
  const graph = [
    restaurant,
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: c.title, description: c.desc, inLanguage: l, isPartOf: { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Divan Ocakbaşı' }, about: { '@id': SITE + '/#restaurant' }, breadcrumb: { '@id': url + '#breadcrumb' } },
    { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Divan Ocakbaşı', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: c.eyebrow, item: url }
    ] }
  ];
  if (c.faq && c.faq.length) {
    graph.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
}

function render(p, l) {
  const t = T[l], c = p[l], other = l === 'de' ? 'en' : 'de', url = urlOf(p, l);
  const root = rootRel(l);
  const lunch = byId('lunch'), faq = byId('faq');
  const alt = LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${urlOf(p, x)}">`).join('\n  ') +
    `\n  <link rel="alternate" hreflang="x-default" href="${urlOf(p, 'de')}">`;
  const ogImg = `${SITE}/img/${p.img ? p.img.src : 'hero.jpg'}`;
  const related = pages.filter(x => x.id !== p.id).map(x => {
    const rc = x[l];
    return `<li><a href="${relTo(l, x, l)}"><strong>${esc(rc.title.split(' | ')[0])}</strong><span>${esc(rc.short)}</span></a></li>`;
  }).join('\n');
  const footerLinks = [`<li><a href="${root}">${esc(t.navHome)}</a></li>`]
    .concat(pages.map(x => `<li><a href="${relTo(l, x, l)}">${esc(x[l].title.split(' | ')[0].split(':')[0])}</a></li>`)).join('\n');
  const faqHtml = c.faq && c.faq.length
    ? `<section class="pg-faq" id="faq"><h2>${esc(t.faqTitle)}</h2>\n` + c.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${a}</div></details>`).join('\n') + '\n</section>'
    : '';
  const bag = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V7a5 5 0 0 1 10 0v1h2.2l1.3 13.1a1 1 0 0 1-1 1.1H4.5a1 1 0 0 1-1-1.1L4.8 8H7zm2 0h6V7a3 3 0 0 0-6 0v1z"/></svg>';

  return `<!DOCTYPE html>
<html lang="${l}" class="fx-reduced">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.title)}</title>
  <meta name="description" content="${esc(c.desc)}">
  <link rel="canonical" href="${url}">
  ${alt}
  <meta name="theme-color" content="#0a0504">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Divan Ocakbaşı">
  <meta property="og:title" content="${esc(c.title)}">
  <meta property="og:description" content="${esc(c.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ogImg}">
  <meta property="og:locale" content="${t.locale}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%238e1b1b'/%3E%3Ctext x='32' y='45' font-family='Georgia,serif' font-size='38' text-anchor='middle' fill='%23e3c27a'%3ED%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${root}styles.css">
  <link rel="stylesheet" href="${root}page.css">
  <script type="application/ld+json">
${jsonLd(p, l)}
  </script>
</head>
<body class="pg">
  <a class="skip" href="#main">${esc(t.skip)}</a>
  <div class="glow" aria-hidden="true"></div>

  <header class="nav is-scrolled">
    <div class="nav__inner">
      <a class="brand" href="${root}" aria-label="Divan Ocakbaşı"><span class="brand__name">Divan</span><span class="brand__sub">Ocakbaşı</span></a>
      <nav class="nav__links" id="nav-links" aria-label="${esc(t.home)}">
        <a href="${root}">${esc(t.navHome)}</a>
        <a href="${relTo(l, lunch, l)}">${esc(t.navLunch)}</a>
        <a href="${MENU_URL}" target="_blank" rel="noopener">${esc(t.navMenu)}</a>
        <a href="${relTo(l, faq, l)}">${esc(t.navFaq)}</a>
        <a class="btn btn--gold btn--sm nav__cta" href="tel:${TEL}">${esc(t.reserve)}</a>
      </nav>
      <div class="nav__right">
        <a class="lang-link" lang="${other}" hreflang="${other}" href="${relTo(l, p, other)}">${T[other].lang.toUpperCase()}</a>
        <button class="burger" type="button" aria-controls="nav-links" aria-expanded="false" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>

  <main id="main">
    <section class="pg-hero">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}">Divan Ocakbaşı</a><i>›</i><span aria-current="page">${esc(c.eyebrow)}</span></nav>
      <p class="eyebrow eyebrow--gold">${esc(c.eyebrow)}</p>
      <h1 class="burn">${c.h1}</h1>
      <p class="pg-lead">${esc(c.lead)}</p>
      <div class="pg-actions">
        <a class="btn btn--gold" href="tel:${TEL}">${esc(t.call)}</a>
        <a class="btn btn--ghost" href="${MENU_URL}" target="_blank" rel="noopener">${esc(t.menuBtn)}</a>
        <a class="btn btn--outline" href="${ROUTE}" target="_blank" rel="noopener">${esc(t.routeBtn)}</a>
      </div>
    </section>

    <section class="pg-body">
${renderBody(p, l)}
    </section>

    ${faqHtml}

    <section class="cta-band">
      <h2>${esc(t.ctaTitle)}</h2>
      <p>${esc(t.ctaText)}</p>
      <div class="row">
        <a class="btn btn--gold" href="tel:${TEL}">${esc(t.call)}</a>
        <a class="btn btn--outline" href="${LIEFERANDO}" target="_blank" rel="noopener">${bag}Lieferando</a>
        <a class="btn btn--outline" href="${WOLT}" target="_blank" rel="noopener">${bag}Wolt</a>
      </div>
    </section>

    <section class="pg-related">
      <h2>${esc(t.relatedTitle)}</h2>
      <ul>
${related}
      </ul>
    </section>
  </main>

  <footer class="footer">
    <div class="coals" aria-hidden="true"></div>
    <div class="footer__inner">
      <a class="brand brand--footer" href="${root}"><span class="brand__name">Divan</span><span class="brand__sub">Ocakbaşı</span></a>
      <p class="footer__addr">Bertoldstraße 54 · 79098 Freiburg im Breisgau · <a href="tel:${TEL}" dir="ltr">0761 2927151</a><br>${esc(t.footerHours)}</p>
      <p class="footer__order">${esc(t.orderLead)} <a href="${LIEFERANDO}" target="_blank" rel="noopener">Lieferando</a> · <a href="${WOLT}" target="_blank" rel="noopener">Wolt</a></p>
      <ul class="footer__links">
${footerLinks}
      </ul>
      <p class="footer__small">© ${BUILT.slice(0, 4)} Divan Ocakbaşı · <a href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a> · ${esc(t.made)} <a href="https://breisgau-digital.de" target="_blank" rel="noopener">Breisgau Digital</a></p>
    </div>
  </footer>
  <script src="${root}page.js" defer></script>
</body>
</html>
`;
}

/* ---- write pages ---- */
const written = [];
for (const p of pages) {
  for (const l of LANGS) {
    const dir = path.join(ROOT, dirOf(p, l));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), render(p, l));
    written.push(dirOf(p, l) + 'index.html');
  }
}

/* ---- sitemap + robots ---- */
const entries = [{ loc: SITE + '/', alts: null }].concat(pages.map(p => ({ loc: urlOf(p, 'de'), p })).concat(pages.map(p => ({ loc: urlOf(p, 'en'), p }))));
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const e of entries) {
  sm.push('  <url>', `    <loc>${e.loc}</loc>`, `    <lastmod>${BUILT}</lastmod>`);
  if (e.p) {
    for (const x of LANGS) sm.push(`    <xhtml:link rel="alternate" hreflang="${x}" href="${urlOf(e.p, x)}"/>`);
    sm.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(e.p, 'de')}"/>`);
  }
  sm.push('  </url>');
}
sm.push('</urlset>', '');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm.join('\n'));
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(written.length + ' pages + sitemap.xml + robots.txt');
written.forEach(w => console.log('  ' + w));
