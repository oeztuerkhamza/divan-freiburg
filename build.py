#!/usr/bin/env python3
"""Statischer Seitengenerator für die Website des Divan Ocakbaşı (nur Python-Standardbibliothek).

    python3 build.py                                # baut nach _site/
    BASE_PATH=/divan-freiburg/ python3 build.py     # GitHub-Pages-Projektseite (nur 404-Seite betroffen)
    python3 -m http.server -d _site 8000            # lokal ansehen

Quellen
  data/site.json      Stammdaten: Adresse, Zeiten, Links, Impressum-Angaben
  data/menu.json      Speisekarte in allen Sprachen (tools/fetch_menu.py)
  data/reviews.json   ausgewählte Google-Bewertungen (manuell gepflegt)
  src/i18n/*.json     Texte der Website je Sprache
  src/legal/*.html    Impressum und Datenschutz (Deutsch verbindlich, Englisch als Übersetzung)
  assets/             CSS, JavaScript, Schriften, Bilder (tools/optimize_images.py)

Jede Sprache bekommt eigene, crawlbare URLs mit hreflang-Verweisen. Deutsch liegt im
Wurzelverzeichnis, damit die Adressen der alten Website (/menu, /reservierung, /kontakt)
erhalten bleiben.
"""
import datetime
import hashlib
import html
import json
import os
import posixpath
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("OUT_DIR", os.path.join(ROOT, "_site"))
BASE_PATH = os.environ.get("BASE_PATH", "/")


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


SITE = load("data/site.json")
MENU = load("data/menu.json")
REVIEWS = load("data/reviews.json")
IMG = load("assets/img/manifest.json")
LANGS = [x["code"] for x in MENU["languages"]]
T = {l: load(f"src/i18n/{l}.json") for l in LANGS}
URL = SITE["url"].rstrip("/")
TODAY = datetime.date.today()
WARNINGS = []

RTL = {"ar", "fa", "ur"}
HREFLANG = {"zh": "zh-Hans"}
OG_LOCALE = {"de": "de_DE", "en": "en_GB", "fr": "fr_FR", "tr": "tr_TR", "ku": "ku_TR", "es": "es_ES",
             "it": "it_IT", "el": "el_GR", "ar": "ar_AR", "fa": "fa_IR", "ur": "ur_PK", "hi": "hi_IN",
             "ru": "ru_RU", "zh": "zh_CN", "ko": "ko_KR"}
DECIMAL_COMMA = {"de", "tr", "fr", "es", "it", "el", "ru", "ku"}
LATIN = {"de", "en", "fr", "tr", "ku", "es", "it"}

PAGES = ("home", "menu", "reservation", "contact", "reviews")
SLUGS = {
    "de": {"menu": "menu", "reservation": "reservierung", "contact": "kontakt", "reviews": "bewertungen"},
    "en": {"menu": "menu", "reservation": "reservations", "contact": "contact", "reviews": "reviews"},
    "tr": {"menu": "menu", "reservation": "rezervasyon", "contact": "iletisim", "reviews": "yorumlar"},
    "fr": {"menu": "carte", "reservation": "reservation", "contact": "contact", "reviews": "avis"},
    "es": {"menu": "carta", "reservation": "reservas", "contact": "contacto", "reviews": "opiniones"},
    "it": {"menu": "menu", "reservation": "prenotazioni", "contact": "contatti", "reviews": "recensioni"},
    "ku": {"menu": "menu", "reservation": "rezervasyon", "contact": "tekili", "reviews": "nirxandin"},
}
DEFAULT_SLUGS = {"menu": "menu", "reservation": "reservation", "contact": "contact", "reviews": "reviews"}
LEGAL = {"impressum": {"de": "impressum/", "en": "en/legal-notice/"},
         "datenschutz": {"de": "datenschutz/", "en": "en/privacy/"}}
# Alte Adressen der Laravel-Seite -> neue Ziele (Weiterleitungsseiten + _redirects)
OLD_URLS = {"home": "", "kasse": "menu/", "adressecheck": "", "speisekarte": "menu/"}

# Startseite: Spezialitäten (Abschnitt, Nummer, Foto) und Kategorie-Kacheln (Abschnitt, Foto)
SPECIALS = [("k5", "116", "h-koefte-peynirli"), ("k6", "107", "h-iskender"), ("k4", "137", "h-karniyarik"),
            ("k2", "18", "h-meze"), ("k7", "38", "h-kiremit"), ("k17", "149", "h-kuenefe")]
FEATURE = ("k5", "129", "130", "m-karisik-et-tabagi")
TILES = [("k2", "m-sigara-boregi"), ("k5", "m-koefte"), ("k4", "m-karniyarik"), ("k6", "m-iskender"),
         ("k7", "m-sebzeli-kiremit"), ("k10", "m-pide-peynirli"), ("k11", "m-pizza-salami"),
         ("k12", "m-boerek-spinat"), ("k13", "m-pohca-2"), ("k14", "m-makarna-tomate"),
         ("k17", "m-suetlac"), ("k18", "m-mokka")]
# Korrekte türkische Schreibweise, wo die Karte vereinfacht schreibt (nur wenn nicht übersetzt)
TR_NAMES = {"116": "Peynirli Sarımsaklı Köfte", "107": "İskender Spezial", "137": "Karnıyarık",
            "18": "Karışık Meze", "149": "Künefe", "129": "Karışık Et Tabağı"}


# ---------------------------------------------------------------- Hilfen
def esc(s):
    return html.escape(str(s), quote=True)


def slugify(s):
    s = s.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss"), ("ç", "c"), ("ş", "s"), ("ğ", "g"),
                 ("ı", "i"), ("&", " ")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def slugs(lang):
    return SLUGS.get(lang, DEFAULT_SLUGS)


def page_path(lang, page):
    prefix = "" if lang == "de" else f"{lang}/"
    return prefix if page == "home" else f"{prefix}{slugs(lang)[page]}/"


def legal_path(kind, lang):
    return LEGAL[kind]["de" if lang == "de" else "en"]


def rel(from_dir, to):
    """Relativer Link von einem Seitenverzeichnis ('en/menu/') zu einem Ziel."""
    base = from_dir.rstrip("/") or "."
    is_dir = to == "" or to.endswith("/")
    r = posixpath.relpath(to.rstrip("/") or ".", base)
    if is_dir:
        return "./" if r == "." else r + "/"
    return r


def absurl(path):
    return f"{URL}/{path}"


def hreflang(lang):
    return HREFLANG.get(lang, lang)


def sec(sid):
    return next(s for s in MENU["sections"] if s["id"] == sid)


def item(sid, num):
    return next(i for i in sec(sid)["items"] if i["num"] == num)


def loc(d, lang):
    if not d:
        return ""
    return d.get(lang) or d.get("de") or ""


def item_name(it, lang):
    n = loc(it["name"], lang)
    if n == it["name"]["de"] and it["num"] in TR_NAMES:
        return TR_NAMES[it["num"]]
    return n


def price_num(p):
    m = re.search(r"(\d+)[,.](\d{2})", p)
    return f"{m.group(1)}.{m.group(2)}" if m else None


def fingerprint(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:8]


# Kennzahlen, die in die Texte eingesetzt werden
LUNCH = sec("k1")
LUNCH_PRICES = {i["price"] for i in LUNCH["items"]}
COUNT = sum(len(s["items"]) for s in MENU["sections"])
FETCHED = datetime.date.fromisoformat(MENU["fetched"])
BASEVALS = {
    "phone": SITE["phone_display"],
    "open": SITE["open"],
    "close": SITE["close"],
    "lunch_from": SITE["lunch_from"],
    "lunch_to": SITE["lunch_to"],
    "lunch_price": LUNCH_PRICES.pop() if len(LUNCH_PRICES) == 1 else min(LUNCH_PRICES),
    "lunch_count": str(len(LUNCH["items"])),
    "count": str(COUNT),
    "count_plus": f"{COUNT // 10 * 10}+",
    "langs": str(len(LANGS)),
    "date": FETCHED.strftime("%m/%Y"),
}
LTR_VALUES = {"phone", "lunch_price", "price", "price2", "date"}


def tr(lang, key, rich=True, raw=None, **extra):
    """Übersetzung holen, Platzhalter füllen. rich=True liefert HTML, sonst reinen Text."""
    s = T[lang].get(key, T["de"][key])
    vals = {**BASEVALS, **extra}
    raw = raw or {}
    if rich:
        s = esc(s).replace("&lt;br&gt;", "<br>").replace("&lt;em&gt;", "<em>").replace("&lt;/em&gt;", "</em>")

    def rep(m):
        k = m.group(1)
        if k in raw:
            return raw[k] if rich else re.sub(r"<[^>]+>", "", raw[k])
        v = vals[k]
        if not rich:
            return v
        v = esc(v)
        return f'<bdi dir="ltr">{v}</bdi>' if lang in RTL and k in LTR_VALUES else v

    out = re.sub(r"\{(\w+)\}", rep, s)
    if not rich:
        out = re.sub(r"\s*<br>\s*", " ", out)
        out = re.sub(r"<[^>]+>", "", out)
    return out


def img(a, key, alt, sizes, cls="", loading="lazy", priority=False):
    m = IMG[key]
    widths = m["widths"]
    srcset = ", ".join(f"{a}img/{key}-{w}.webp {w}w" for w in widths)
    src = f"{a}img/{key}-{widths[1] if len(widths) > 1 else widths[0]}.webp"
    attrs = [f'src="{src}"', f'srcset="{srcset}"', f'sizes="{sizes}"', f'width="{m["w"]}"', f'height="{m["h"]}"',
             f'alt="{esc(alt)}"', 'decoding="async"']
    attrs.append('fetchpriority="high"' if priority else f'loading="{loading}"')
    if cls:
        attrs.insert(0, f'class="{cls}"')
    return f"<img {' '.join(attrs)}>"


ICONS = {
    "flame": '<path d="M12 2c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.2 1.7 1.1 2.8 2.1 3.3C11 8.5 11 5 12 2z"/>',
    "dish": '<path d="M4 3h2v8a2 2 0 0 0 2 2V3h2v10a2 2 0 0 0 2-2V3h2v8a4 4 0 0 1-4 4v6H8v-6a4 4 0 0 1-4-4V3zm14 0c1.7 0 3 2.7 3 6v4h-2v8h-2V3h1z"/>',
    "clock": '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l3.6 2.1-1 1.7L11 13.6V7h2z"/>',
    "globe": '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15.7 15.7 0 0 0-1.3-5.6A8 8 0 0 1 18.9 11zM12 4c.9 1.2 1.8 3.6 2 7h-4c.2-3.4 1.1-5.8 2-7zM9.4 5.4A15.7 15.7 0 0 0 8.1 11h-3a8 8 0 0 1 4.3-5.6zM5.1 13h3a15.7 15.7 0 0 0 1.3 5.6A8 8 0 0 1 5.1 13zM12 20c-.9-1.2-1.8-3.6-2-7h4c-.2 3.4-1.1 5.8-2 7zm2.6-1.4a15.7 15.7 0 0 0 1.3-5.6h3a8 8 0 0 1-4.3 5.6z"/>',
    "phone": '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/>',
    "pin": '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
    "star": '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z"/>',
    "search": '<path d="M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>',
}


def icon(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'


def stars(n):
    full = round(n)
    return "".join(icon("star", "on" if i < full else "off") for i in range(5))


def fmt_rating(v, lang):
    s = f"{v:.1f}"
    return s.replace(".", ",") if lang in DECIMAL_COMMA else s


# ---------------------------------------------------------------- Seitenrahmen
CSS_V = fingerprint("assets/css/styles.css")
JS_V = fingerprint("assets/js/site.js")
CSP = ("default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; "
       "frame-src https://www.google.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'")
HINTS = json.dumps({l: [T[l]["hint_text"], T[l]["hint_go"], T[l]["hint_close"]] for l in LANGS},
                   ensure_ascii=False, separators=(",", ":"))


def header(lang, here, current, alternates):
    a = rel(here, "")
    links = []
    for p in ("menu", "reservation", "reviews", "contact"):
        cur = ' aria-current="page"' if current == p else ""
        links.append(f'<a href="{rel(here, page_path(lang, p))}"{cur}>{esc(T[lang]["nav_" + p])}</a>')
    langs = []
    for l in LANGS:
        if l not in alternates:
            continue
        cur = ' aria-current="true"' if l == lang else ""
        langs.append(f'<li><a href="{rel(here, alternates[l])}" hreflang="{hreflang(l)}" lang="{hreflang(l)}"{cur}>'
                     f'<span class="lang__code">{l.upper()}</span> {esc(T[l]["lang_name"])}</a></li>')
    return f"""<a class="skip" href="#main">{esc(T[lang]["skip"])}</a>
<header class="nav" id="top">
  <div class="nav__inner">
    <a class="brand" href="{a}" aria-label="Divan Ocakbaşı – {esc(T[lang]["nav_home"])}">
      <span class="brand__name">Divan</span><span class="brand__sub">Ocakbaşı</span>
    </a>
    <nav class="nav__links" id="nav-links" aria-label="{esc(T[lang]["nav_label"])}">
      {"".join(links)}
      <a class="btn btn--gold btn--sm nav__cta" href="{rel(here, page_path(lang, "reservation"))}">{esc(T[lang]["nav_cta"])}</a>
    </nav>
    <div class="nav__right">
      <details class="lang">
        <summary aria-label="{esc(T[lang]["lang_label"])}">{icon("globe")}<span>{lang.upper()}</span></summary>
        <ul class="lang__list">{"".join(langs)}</ul>
      </details>
      <button class="burger" type="button" aria-controls="nav-links" aria-expanded="false" aria-label="{esc(T[lang]["nav_open"])}">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>"""


def footer(lang, here):
    t = T[lang]
    nav = " · ".join(f'<a href="{rel(here, page_path(lang, p))}">{esc(t["nav_" + p])}</a>'
                     for p in ("menu", "reservation", "reviews", "contact"))
    legal = (f'<a href="{rel(here, legal_path("impressum", lang))}">{esc(t["footer_legal"])}</a> · '
             f'<a href="{rel(here, legal_path("datenschutz", lang))}">{esc(t["footer_privacy"])}</a>')
    phone = f'<a href="tel:{SITE["phone_e164"]}"><bdi dir="ltr">{esc(SITE["phone_display"])}</bdi></a>'
    return f"""<footer class="footer">
  <div class="footer__inner">
    <div class="brand brand--footer"><span class="brand__name">Divan</span><span class="brand__sub">Ocakbaşı</span></div>
    <p class="footer__addr"><bdi>{esc(SITE["street"])} · {esc(SITE["zip"])} {esc(SITE["city"])}</bdi> · {phone}<br>{tr(lang, "footer_hours")}</p>
    <p class="footer__nav">{nav}</p>
    <p class="footer__nav footer__nav--legal">{legal}</p>
    <p class="footer__small">© {TODAY.year} {esc(SITE["name"])} ·
      <a href="{SITE["instagram"]}" rel="noopener" target="_blank">Instagram</a> ·
      {esc(t["footer_made"])} <a href="{SITE["agency_url"]}" rel="noopener" target="_blank">{esc(SITE["agency_name"])}</a></p>
  </div>
</footer>
<a class="fab" href="tel:{SITE["phone_e164"]}" aria-label="{esc(tr(lang, "hero_call", rich=False))}">{icon("phone")}</a>"""


def shell(lang, here, page, title, desc, body, jsonld, alternates, robots="index, follow, max-image-preview:large"):
    a = rel(here, "assets/")
    links = [f'<link rel="canonical" href="{absurl(here)}">']
    if len(alternates) > 1:
        for l in LANGS:
            if l in alternates:
                links.append(f'<link rel="alternate" hreflang="{hreflang(l)}" href="{absurl(alternates[l])}">')
        links.append(f'<link rel="alternate" hreflang="x-default" href="{absurl(alternates["de"])}">')
    og_alt = "".join(f'\n<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">'
                     for l in LANGS if l in alternates and l != lang)
    preload = ""
    if lang in LATIN:
        preload = (f'<link rel="preload" href="{a}fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>\n'
                   f'<link rel="preload" href="{a}fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>\n')
    ld = "".join(f'<script type="application/ld+json">{json.dumps(j, ensure_ascii=False, separators=(",", ":"))}</script>\n'
                 for j in jsonld)
    dir_attr = ' dir="rtl"' if lang in RTL else ""
    return f"""<!DOCTYPE html>
<html lang="{hreflang(lang)}"{dir_attr} class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="{robots}">
{chr(10).join(links)}
<meta name="theme-color" content="#1c0f0c">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(SITE["name"])}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{absurl(here)}">
<meta property="og:image" content="{absurl("assets/img/og.jpg")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(T[lang]["alt_hero"])}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">{og_alt}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{a}img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{a}img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="{a}img/apple-touch-icon.png">
<link rel="manifest" href="{rel(here, "site.webmanifest")}">
{preload}<link rel="stylesheet" href="{a}css/styles.css?v={CSS_V}">
<script src="{a}js/site.js?v={JS_V}" defer></script>
{ld}</head>
<body class="page-{page}">
{header(lang, here, page, alternates)}
<main id="main">
{body}
</main>
{footer(lang, here)}
<script type="application/json" id="lang-hints">{HINTS}</script>
</body>
</html>
"""


# ---------------------------------------------------------------- Strukturierte Daten
def restaurant_ld(lang):
    addr = {"@type": "PostalAddress", "streetAddress": SITE["street"], "postalCode": SITE["zip"],
            "addressLocality": SITE["city"], "addressRegion": SITE["region"], "addressCountry": SITE["country"]}
    d = {
        "@type": "Restaurant",
        "@id": f"{URL}/#restaurant",
        "name": SITE["name"],
        "alternateName": "Divan Freiburg",
        "description": tr(lang, "home_desc", rich=False),
        "url": f"{URL}/",
        "telephone": "+49 761 2927151",
        "image": [absurl("assets/img/og.jpg"), absurl("assets/img/h-hero-1000.webp")],
        "logo": absurl("assets/img/icon-512.png"),
        "address": addr,
        "servesCuisine": SITE["cuisine"],
        "priceRange": SITE["price_range"],
        "currenciesAccepted": "EUR",
        "acceptsReservations": absurl(page_path(lang, "reservation")),
        "hasMenu": absurl(page_path(lang, "menu")),
        "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": SITE["open"], "closes": SITE["close"]}],
        "hasMap": SITE["maps_cid_url"],
        "sameAs": [SITE["instagram"], SITE["maps_cid_url"]],
        "availableLanguage": [hreflang(l) for l in LANGS],
    }
    if SITE.get("email"):
        d["email"] = SITE["email"]
    if SITE.get("geo"):
        d["geo"] = {"@type": "GeoCoordinates", "latitude": SITE["geo"][0], "longitude": SITE["geo"][1]}
    return d


def page_ld(lang, here, title, desc, crumbs=None, extra=None):
    graph = [
        restaurant_ld(lang),
        {"@type": "WebSite", "@id": f"{URL}/#website", "url": f"{URL}/", "name": SITE["name"],
         "inLanguage": [hreflang(l) for l in LANGS], "publisher": {"@id": f"{URL}/#restaurant"}},
        {"@type": "WebPage", "@id": absurl(here) + "#webpage", "url": absurl(here), "name": title,
         "description": desc, "inLanguage": hreflang(lang), "isPartOf": {"@id": f"{URL}/#website"},
         "about": {"@id": f"{URL}/#restaurant"}},
    ]
    if crumbs:
        graph.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": absurl(p)} for i, (n, p) in enumerate(crumbs)]})
    graph.extend(extra or [])
    return [{"@context": "https://schema.org", "@graph": graph}]


# ---------------------------------------------------------------- Bausteine
def phero(lang, here, name, h1_key, intro_html):
    return f"""<section class="phero">
  <div class="phero__inner">
    <nav class="crumbs" aria-label="{esc(T[lang]["breadcrumb"])}"><ol>
      <li><a href="{rel(here, page_path(lang, "home"))}">{esc(T[lang]["nav_home"])}</a></li>
      <li aria-current="page">{esc(name)}</li>
    </ol></nav>
    <h1>{tr(lang, h1_key)}</h1>
    <p class="phero__lead">{intro_html}</p>
  </div>
</section>"""


def status(lang):
    return (f'<p class="status" data-status data-open="{SITE["open"]}" data-close="{SITE["close"]}" '
            f'data-t-open="{esc(tr(lang, "status_open", rich=False))}" '
            f'data-t-closed="{esc(tr(lang, "status_closed", rich=False))}" hidden></p>')


def visit_list(lang, with_email=False):
    t = T[lang]
    email = ""
    if with_email and SITE.get("email"):
        email = (f'<div><dt>{esc(t["contact_email"])}</dt><dd><a href="mailto:{esc(SITE["email"])}">'
                 f'{esc(SITE["email"])}</a></dd></div>')
    return f"""<dl class="visit__list">
  <div><dt>{esc(t["visit_address"])}</dt><dd><bdi>{esc(SITE["street"])}<br>{esc(SITE["zip"])} {esc(SITE["city"])}</bdi></dd></div>
  <div><dt>{esc(t["visit_phone"])}</dt><dd><a href="tel:{SITE["phone_e164"]}"><bdi dir="ltr">{esc(SITE["phone_display"])}</bdi></a></dd></div>
  <div><dt>{esc(t["visit_hours"])}</dt><dd>{tr(lang, "visit_hours_d")}<small>{tr(lang, "visit_hours_note")}</small></dd></div>
  <div><dt>Instagram</dt><dd><a href="{SITE["instagram"]}" rel="noopener" target="_blank"><bdi dir="ltr">@divanfreiburg</bdi></a></dd></div>
  {email}
</dl>"""


def rating_block(lang):
    if not REVIEWS.get("rating"):
        return ""
    t = T[lang]
    count = tr(lang, "reviews_count", n=str(REVIEWS["count"])) if REVIEWS.get("count") else ""
    asof = tr(lang, "reviews_asof", date=REVIEWS["as_of"]) if REVIEWS.get("as_of") else ""
    return f"""<div class="rating">
  <span class="rating__num">{fmt_rating(REVIEWS["rating"], lang)}</span>
  <span class="stars" role="img" aria-label="{esc(tr(lang, "reviews_stars", rich=False, n=fmt_rating(REVIEWS["rating"], lang)))}">{stars(REVIEWS["rating"])}</span>
  <span class="rating__meta">{esc(t["reviews_rating"])} · {count}<small>{asof}</small></span>
</div>"""


# ---------------------------------------------------------------- Seiten
def home(lang):
    here = page_path(lang, "home")
    t = T[lang]
    a = rel(here, "assets/")
    menu = rel(here, page_path(lang, "menu"))
    title, desc = tr(lang, "home_title", rich=False), tr(lang, "home_desc", rich=False)

    cards = []
    for sid, num, key in SPECIALS:
        it = item(sid, num)
        name = item_name(it, lang)
        cards.append(f"""<article class="dish reveal">
  <div class="dish__img">{img(a, key, name, "(max-width: 600px) 100vw, (max-width: 960px) 50vw, 380px")}</div>
  <div class="dish__body">
    <span class="dish__tag">{esc(loc(sec(sid)["title"], lang))}</span>
    <h3>{esc(name)}</h3>
    <p>{esc(loc(it["desc"], lang))}</p>
    <p class="dish__price"><bdi dir="ltr">{esc(it["price"])}</bdi></p>
  </div>
</article>""")

    fsid, fnum, fnum2, fkey = FEATURE
    f1, f2 = item(fsid, fnum), item(fsid, fnum2)
    tiles = "".join(
        f'<a class="cat reveal" href="{menu}#{slugify(sec(sid)["title"]["de"])}">'
        f'{img(a, key, "", "(max-width: 600px) 50vw, (max-width: 960px) 33vw, 240px")}'
        f'<span>{esc(loc(sec(sid)["title"], lang))}</span></a>' for sid, key in TILES)
    chips = "".join(f'<li><a href="{menu}#{slugify(s["title"]["de"])}">{esc(loc(s["title"], lang))}</a></li>'
                    for s in MENU["sections"])

    faq_items, faq_ld = [], []
    for i in range(1, 8):
        q, ans = tr(lang, f"faq_q{i}"), tr(lang, f"faq_a{i}")
        faq_items.append(f'<details class="faq__item"><summary>{q}</summary><p>{ans}</p></details>')
        faq_ld.append({"@type": "Question", "name": tr(lang, f"faq_q{i}", rich=False),
                       "acceptedAnswer": {"@type": "Answer", "text": tr(lang, f"faq_a{i}", rich=False)}})

    body = f"""<section class="hero">
  <div class="hero__bg">{img(a, "h-hero", t["alt_hero"], "100vw", priority=True)}</div>
  <div class="hero__shade"></div>
  <div class="hero__content">
    <p class="eyebrow">{tr(lang, "hero_eyebrow")}</p>
    <h1>{tr(lang, "hero_title")}</h1>
    <p class="hero__lead">{tr(lang, "hero_lead")}</p>
    <div class="hero__actions">
      <a class="btn btn--gold" href="{menu}">{tr(lang, "hero_menu")}</a>
      <a class="btn btn--ghost" href="tel:{SITE["phone_e164"]}">{tr(lang, "hero_call")}</a>
    </div>
    {status(lang)}
  </div>
</section>

<section class="facts" aria-label="{esc(t["facts_label"])}">
  <div class="facts__item">{icon("flame")}<strong>{tr(lang, "facts_1_t")}</strong><span>{tr(lang, "facts_1_d")}</span></div>
  <div class="facts__item">{icon("dish")}<strong>{tr(lang, "facts_2_t")}</strong><span>{tr(lang, "facts_2_d")}</span></div>
  <div class="facts__item">{icon("clock")}<strong>{tr(lang, "facts_3_t")}</strong><span>{tr(lang, "facts_3_d")}</span></div>
  <div class="facts__item">{icon("globe")}<strong>{tr(lang, "facts_4_t")}</strong><span>{tr(lang, "facts_4_d")}</span></div>
</section>

<section class="about section" id="about">
  <div class="about__media reveal">
    {img(a, "h-adana", t["alt_about_a"], "(max-width: 960px) 60vw, 380px", "about__img about__img--a")}
    {img(a, "h-koefte-pilav", t["alt_about_b"], "(max-width: 960px) 45vw, 300px", "about__img about__img--b")}
  </div>
  <div class="about__text reveal">
    <p class="eyebrow eyebrow--red">{tr(lang, "about_eyebrow")}</p>
    <h2>{tr(lang, "about_title")}</h2>
    <div class="ornament ornament--start" aria-hidden="true"><span></span><i></i><span></span></div>
    <p>{tr(lang, "about_p1")}</p>
    <p>{tr(lang, "about_p2")}</p>
    <a class="link-arrow" href="#specialties">{tr(lang, "about_cta")}</a>
  </div>
</section>

<section class="specialties section" id="specialties">
  <header class="section__head reveal">
    <p class="eyebrow eyebrow--gold">{tr(lang, "spec_eyebrow")}</p>
    <h2>{tr(lang, "spec_title")}</h2>
    <p class="section__intro">{tr(lang, "spec_intro")}</p>
  </header>
  <div class="dishes">{"".join(cards)}</div>
</section>

<section class="feature">
  <div class="feature__img reveal">{img(a, fkey, item_name(f1, lang), "(max-width: 960px) 100vw, 55vw")}</div>
  <div class="feature__text reveal">
    <p class="eyebrow eyebrow--gold">{tr(lang, "feat_eyebrow")}</p>
    <h2>{esc(item_name(f1, lang))}</h2>
    <p>{esc(loc(f1["desc"], lang))}</p>
    <p class="feature__price"><bdi dir="ltr">{esc(f1["price"])}</bdi> · {tr(lang, "feat_for_two", price2=f2["price"])}</p>
    <a class="btn btn--gold" href="{menu}#{slugify(sec(fsid)["title"]["de"])}">{tr(lang, "feat_cta")}</a>
  </div>
</section>

<section class="menu section" id="menu">
  <header class="section__head reveal">
    <p class="eyebrow eyebrow--red">{tr(lang, "cats_eyebrow")}</p>
    <h2>{tr(lang, "cats_title")}</h2>
    <p class="section__intro section__intro--dark">{tr(lang, "cats_intro")}</p>
  </header>
  <div class="cats">{tiles}</div>
  <ul class="chips reveal">{chips}</ul>
  <div class="menu__cta reveal"><a class="btn btn--red" href="{menu}">{tr(lang, "cats_cta")}</a></div>
</section>

<section class="lunch" id="lunch">
  <div class="lunch__inner reveal">
    <p class="eyebrow eyebrow--gold">{tr(lang, "lunch_eyebrow")}</p>
    <h2>{tr(lang, "lunch_title")}</h2>
    <p>{tr(lang, "lunch_p")}</p>
    <a class="btn btn--ghost" href="{menu}#{slugify(LUNCH["title"]["de"])}">{tr(lang, "lunch_cta")}</a>
  </div>
</section>

<section class="revteaser section" id="reviews">
  <div class="revteaser__inner reveal">
    <p class="eyebrow eyebrow--red">{tr(lang, "rev_eyebrow")}</p>
    <h2>{tr(lang, "rev_title")}</h2>
    {rating_block(lang)}
    <p class="section__intro section__intro--dark">{tr(lang, "rev_intro")}</p>
    <div class="btnrow">
      <a class="btn btn--red" href="{SITE["google_reviews_url"]}" rel="noopener" target="_blank">{tr(lang, "rev_read")}</a>
      <a class="btn btn--outline" href="{SITE["google_write_review_url"]}" rel="noopener" target="_blank">{tr(lang, "rev_write")}</a>
    </div>
    <a class="link-arrow" href="{rel(here, page_path(lang, "reviews"))}">{tr(lang, "rev_more")}</a>
  </div>
</section>

<section class="visit section" id="visit">
  <div class="visit__card reveal">
    <p class="eyebrow eyebrow--red">{tr(lang, "visit_eyebrow")}</p>
    <h2>{tr(lang, "visit_title")}</h2>
    <div class="ornament ornament--start" aria-hidden="true"><span></span><i></i><span></span></div>
    {visit_list(lang)}
    <div class="visit__actions">
      <a class="btn btn--red" href="{SITE["maps_url"]}" rel="noopener" target="_blank">{tr(lang, "visit_route")}</a>
      <a class="btn btn--outline" href="{rel(here, page_path(lang, "reservation"))}">{tr(lang, "visit_reserve")}</a>
    </div>
  </div>
  <div class="visit__photo reveal">
    {img(a, "h-pohca", t["alt_visit_a"], "(max-width: 960px) 55vw, 330px")}
    {img(a, "h-pide", t["alt_visit_b"], "(max-width: 960px) 40vw, 230px")}
  </div>
</section>

<section class="faq section" id="faq">
  <header class="section__head reveal">
    <p class="eyebrow eyebrow--red">{tr(lang, "faq_eyebrow")}</p>
    <h2>{tr(lang, "faq_title")}</h2>
  </header>
  <div class="faq__list reveal">{"".join(faq_items)}</div>
</section>"""
    ld = page_ld(lang, here, title, desc, extra=[{"@type": "FAQPage", "@id": absurl(here) + "#faq", "mainEntity": faq_ld}])
    return here, title, desc, body, ld


def menu_page(lang):
    here = page_path(lang, "menu")
    t = T[lang]
    a = rel(here, "assets/")
    title, desc = tr(lang, "menu_title", rich=False), tr(lang, "menu_desc", rich=False)
    labels = MENU["ui"][lang]["labels"]
    lab_contains = t.get("menu_contains", labels.get("contains", "Enthält"))
    lab_add = t.get("menu_additives", labels.get("additives", "Zusatzstoffe"))

    nav, secs, ld_secs = [], [], []
    for s in MENU["sections"]:
        sid = slugify(s["title"]["de"])
        name = loc(s["title"], lang)
        nav.append(f'<a href="#{sid}">{esc(name)}</a>')
        hours = f'<small class="msec__hours">{esc(loc(s["hours_label"], lang))}</small>' if s["hours_label"] else ""
        note = f'<p class="msec__note">{esc(loc(s["note"], lang))}</p>' if s["note"] else ""
        lis, ld_items = [], []
        for it in s["items"]:
            nm = loc(it["name"], lang)
            d = loc(it["desc"], lang)
            meta = []
            if it["contains"]:
                meta.append(f'{esc(lab_contains)}: {esc(", ".join(loc(it["contains"], lang)))}')
            if it["additives"]:
                meta.append(f'{esc(lab_add)}: {esc(", ".join(loc(it["additives"], lang)))}')
            search = " ".join(x for x in (nm, it["name"]["de"], it["name"].get("tr", ""), d) if x)
            pic = ""
            if it["img"]:
                key = "m-" + os.path.splitext(os.path.basename(it["img"]))[0]
                m = IMG[key]
                pic = (f'<img class="mitem__img" src="{a}img/{key}-{m["widths"][0]}.webp" width="{m["widths"][0]}" '
                       f'height="{round(m["h"] * m["widths"][0] / m["w"])}" alt="{esc(nm)}" loading="lazy" decoding="async">')
            num = f'<span class="mitem__num">{esc(it["num"])}</span>' if it["num"] else ""
            lis.append(f"""<li class="mitem{' has-img' if pic else ''}" data-search="{esc(search.lower())}">{pic}<div class="mitem__body">
<div class="mitem__row"><h3 class="mitem__name">{num}{esc(nm)}</h3><span class="mitem__dots" aria-hidden="true"></span><span class="mitem__price"><bdi dir="ltr">{esc(it["price"])}</bdi></span></div>
{f'<p class="mitem__desc">{esc(d)}</p>' if d else ''}{f'<p class="mitem__meta">{" · ".join(meta)}</p>' if meta else ''}
</div></li>""")
            mi = {"@type": "MenuItem", "name": nm}
            if d:
                mi["description"] = d
            pn = price_num(it["price"])
            if pn:
                mi["offers"] = {"@type": "Offer", "price": pn, "priceCurrency": "EUR"}
            ld_items.append(mi)
        secs.append(f"""<section class="msec" aria-labelledby="{sid}">
<h2 id="{sid}">{esc(name)}{hours}</h2>{note}
<ul class="mlist">{"".join(lis)}</ul>
</section>""")
        ld_secs.append({"@type": "MenuSection", "name": name, "hasMenuItem": ld_items})

    body = f"""{phero(lang, here, t["nav_menu"], "menu_h1", tr(lang, "menu_intro"))}
<div class="mtools">
  <div class="mtools__inner">
    <label class="msearch">{icon("search")}<span class="sr-only">{esc(t["menu_search_label"])}</span>
      <input type="search" id="menu-search" placeholder="{esc(t["menu_search"])}" autocomplete="off" enterkeyhint="search">
    </label>
    <nav class="mnav" aria-label="{esc(t["menu_jump"])}">{"".join(nav)}</nav>
  </div>
</div>
<div class="mwrap">
  <p class="mnote mnote--top">{tr(lang, "menu_prices")}</p>
  {"".join(secs)}
  <p class="mempty" id="menu-empty" hidden>{esc(t["menu_noresults"])}</p>
  <div class="mnote">
    <p>{tr(lang, "menu_allergen_note")}</p>
    <p>{tr(lang, "menu_prices")} {tr(lang, "menu_digital")}</p>
  </div>
</div>"""
    menu_ld = {"@type": "Menu", "@id": absurl(here) + "#menu", "name": title, "inLanguage": hreflang(lang),
               "url": absurl(here), "hasMenuSection": ld_secs}
    ld = page_ld(lang, here, title, desc, crumbs=[(t["nav_home"], page_path(lang, "home")), (t["nav_menu"], here)],
                 extra=[menu_ld])
    return here, title, desc, body, ld


def reservation_page(lang):
    here = page_path(lang, "reservation")
    t = T[lang]
    title, desc = tr(lang, "res_title", rich=False), tr(lang, "res_desc", rich=False)
    body = f"""{phero(lang, here, t["nav_reservation"], "res_h1", tr(lang, "res_intro"))}
<section class="section res">
  <div class="res__call reveal">
    <a class="btn btn--red btn--lg" href="tel:{SITE["phone_e164"]}">{icon("phone")} {tr(lang, "res_call")}</a>
    {status(lang)}
  </div>
  <div class="info-grid">
    <article class="info reveal">{icon("clock")}<h2>{esc(t["res_when_t"])}</h2><p>{tr(lang, "res_when_d")}</p></article>
    <article class="info reveal">{icon("dish")}<h2>{esc(t["res_groups_t"])}</h2><p>{tr(lang, "res_groups_d")}</p></article>
    <article class="info reveal">{icon("flame")}<h2>{esc(t["res_lunch_t"])}</h2><p>{tr(lang, "res_lunch_d")}</p></article>
  </div>
  <p class="res__note reveal">{tr(lang, "res_note")}</p>
</section>
<section class="visit visit--compact section">
  <div class="visit__card reveal">{visit_list(lang)}
    <div class="visit__actions">
      <a class="btn btn--red" href="{SITE["maps_url"]}" rel="noopener" target="_blank">{tr(lang, "visit_route")}</a>
      <a class="btn btn--outline" href="{rel(here, page_path(lang, "menu"))}">{tr(lang, "hero_menu")}</a>
    </div>
  </div>
</section>"""
    ld = page_ld(lang, here, title, desc, crumbs=[(t["nav_home"], page_path(lang, "home")), (t["nav_reservation"], here)])
    return here, title, desc, body, ld


def contact_page(lang):
    here = page_path(lang, "contact")
    t = T[lang]
    title, desc = tr(lang, "contact_title", rich=False), tr(lang, "contact_desc", rich=False)
    privacy = f'<a href="{rel(here, legal_path("datenschutz", lang))}">{esc(t["footer_privacy"])}</a>'
    body = f"""{phero(lang, here, t["nav_contact"], "contact_h1", tr(lang, "contact_intro"))}
<section class="section contact">
  <div class="visit__card reveal">
    {visit_list(lang, with_email=True)}
    {status(lang)}
    <div class="visit__actions">
      <a class="btn btn--red" href="{SITE["maps_url"]}" rel="noopener" target="_blank">{tr(lang, "visit_route")}</a>
      <a class="btn btn--outline" href="{rel(here, page_path(lang, "reservation"))}">{tr(lang, "visit_reserve")}</a>
    </div>
  </div>
  <div class="map reveal" data-map>
    <div class="map__consent">
      {icon("pin", "map__pin")}
      <p>{tr(lang, "map_note", raw={"privacy": privacy})}</p>
      <button class="btn btn--red" type="button" data-map-src="{esc(SITE["maps_embed_url"])}" data-map-title="Google Maps – {esc(SITE["name"])}">{esc(t["map_load"])}</button>
      <a class="link-arrow" href="{SITE["maps_cid_url"]}" rel="noopener" target="_blank">{esc(t["map_open"])}</a>
    </div>
  </div>
</section>"""
    ld = page_ld(lang, here, title, desc, crumbs=[(t["nav_home"], page_path(lang, "home")), (t["nav_contact"], here)])
    return here, title, desc, body, ld


def reviews_page(lang):
    here = page_path(lang, "reviews")
    t = T[lang]
    title, desc = tr(lang, "reviews_title", rich=False), tr(lang, "reviews_desc", rich=False)
    cards = []
    for r in REVIEWS.get("reviews", []):
        link = (f' · <a href="{esc(r["url"])}" rel="noopener nofollow" target="_blank">Google</a>'
                if r.get("url") else " · Google")
        cards.append(f"""<figure class="rev reveal">
  <span class="stars" role="img" aria-label="{esc(tr(lang, "reviews_stars", rich=False, n=str(r["rating"])))}">{stars(r["rating"])}</span>
  <blockquote lang="{esc(r.get("lang", "de"))}"><p>{esc(r["text"])}</p></blockquote>
  <figcaption>{esc(r["author"])} · {esc(r.get("date", ""))}{link}</figcaption>
</figure>""")
    grid = f'<div class="revgrid">{"".join(cards)}</div>' if cards else ""
    source = f'<p class="reviews__source">{tr(lang, "reviews_source")}</p>' if cards else ""
    body = f"""{phero(lang, here, t["nav_reviews"], "reviews_h1", tr(lang, "reviews_intro"))}
<section class="section reviews">
  {rating_block(lang)}
  {grid}
  <div class="revcta reveal">
    {icon("star", "revcta__icon")}
    <h2>{esc(t["reviews_cta_t"])}</h2>
    <p>{tr(lang, "reviews_cta_d")}</p>
    <div class="btnrow">
      <a class="btn btn--gold" href="{SITE["google_write_review_url"]}" rel="noopener" target="_blank">{tr(lang, "rev_write")}</a>
      <a class="btn btn--ghost" href="{SITE["google_reviews_url"]}" rel="noopener" target="_blank">{tr(lang, "rev_read")}</a>
    </div>
  </div>
  {source}
</section>"""
    ld = page_ld(lang, here, title, desc, crumbs=[(t["nav_home"], page_path(lang, "home")), (t["nav_reviews"], here)])
    return here, title, desc, body, ld


TODO_LABELS = {
    "owner": "Vor- und Nachname der Inhaberin / des Inhabers",
    "legal_form": "Rechtsform, z. B. Einzelunternehmen oder GmbH",
    "register": "Handelsregister, Registergericht und Nummer – oder: „Kein Registereintrag“",
    "vat_id": "USt-IdNr. (falls vorhanden), sonst Zeile streichen",
    "supervisory_authority": "Erlaubnisbehörde Gaststätte (z. B. Stadt Freiburg, Amt für öffentliche Ordnung) – prüfen",
    "email": "E-Mail-Adresse",
    "photo_credit": "Fotograf/in bzw. „Divan Ocakbaşı“",
    "reservation_deletion": "Löschfrist, z. B. „nach dem Besuch, spätestens nach 30 Tagen“",
    "reservation_deletion_en": "deletion period, e.g. “after your visit, at the latest after 30 days”",
}


def legal_page(kind, lang):
    here = LEGAL[kind][lang]
    with open(os.path.join(ROOT, "src", "legal", f"{kind}.{lang}.html"), encoding="utf-8") as f:
        src = f.read()
    vals = {k: SITE[k] for k in ("name", "street", "zip", "city", "phone_e164", "agency_name", "agency_url")}
    vals.update({k: v for k, v in SITE["legal"].items()})
    vals["phone"] = SITE["phone_display"]
    vals["email"] = SITE.get("email")
    vals["date"] = TODAY.strftime("%d.%m.%Y") if lang == "de" else TODAY.isoformat()

    def rep(m):
        k = m.group(1)
        if k == "de_url":
            return rel(here, LEGAL[kind]["de"])
        v = vals.get(k)
        if v:
            if k == "email":
                return f'<a href="mailto:{esc(v)}">{esc(v)}</a>'
            return esc(v)
        WARNINGS.append(f"{here}: Angabe fehlt – {k}")
        return f'<mark class="todo">[[{esc(TODO_LABELS.get(k, k))}]]</mark>'

    content = re.sub(r"\{\{(\w+)\}\}", rep, src)
    names = {"impressum": {"de": "Impressum", "en": "Legal notice"},
             "datenschutz": {"de": "Datenschutzerklärung", "en": "Privacy policy"}}
    name = names[kind][lang]
    title = f"{name} – {SITE['name']}"
    body = f"""<section class="phero phero--small"><div class="phero__inner">
  <nav class="crumbs" aria-label="{esc(T[lang]["breadcrumb"])}"><ol>
    <li><a href="{rel(here, page_path(lang, "home"))}">{esc(T[lang]["nav_home"])}</a></li><li aria-current="page">{esc(name)}</li>
  </ol></nav>
  <h1>{esc(name)}</h1>
</div></section>
<section class="section legal">{content}</section>"""
    return here, title, name, body, []


def redirect_stub(old, target):
    """Weiterleitung für alte Adressen (GitHub Pages kennt keine 301; Google wertet Meta-Refresh 0 als dauerhaft)."""
    href = esc(rel(f"{old}/", target))
    return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8">
<title>{esc(SITE["name"])}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{absurl(target)}">
<meta http-equiv="refresh" content="0; url={href}">
</head><body><p><a href="{href}">{esc(SITE["name"])}</a></p></body></html>
"""


def not_found():
    b = BASE_PATH if BASE_PATH.endswith("/") else BASE_PATH + "/"
    links = " · ".join(f'<a href="{b}{page_path(l, "home")}" lang="{hreflang(l)}">{esc(T[l]["lang_name"])}</a>' for l in LANGS)
    return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(T["de"]["nf_title"])} – {esc(SITE["name"])}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="{b}assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{b}assets/css/styles.css?v={CSS_V}">
</head><body class="page-404">
<main class="nf">
  <a class="brand brand--footer" href="{b}"><span class="brand__name">Divan</span><span class="brand__sub">Ocakbaşı</span></a>
  <h1>{esc(T["de"]["nf_title"])} <small lang="en">{esc(T["en"]["nf_title"])}</small></h1>
  <p>{esc(T["de"]["nf_text"])}</p>
  <p class="btnrow">
    <a class="btn btn--gold" href="{b}">{esc(T["de"]["nav_home"])}</a>
    <a class="btn btn--ghost" href="{b}{page_path("de", "menu")}">{esc(T["de"]["nav_menu"])}</a>
    <a class="btn btn--ghost" href="{b}{page_path("de", "reservation")}">{esc(T["de"]["nav_reservation"])}</a>
  </p>
  <p class="nf__langs">{links}</p>
</main></body></html>
"""


# ---------------------------------------------------------------- Ausgabe
def write(path, content):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)


def sitemap(entries):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for path, alternates in entries:
        out.append(f"  <url>\n    <loc>{absurl(path)}</loc>\n    <lastmod>{TODAY.isoformat()}</lastmod>")
        for l in LANGS:
            if l in alternates:
                out.append(f'    <xhtml:link rel="alternate" hreflang="{hreflang(l)}" href="{absurl(alternates[l])}"/>')
        out.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{absurl(alternates["de"])}"/>')
        out.append("  </url>")
    out.append("</urlset>\n")
    return "\n".join(out)


def llms_txt():
    t = T["de"]
    lines = [
        f"# {SITE['name']} – Freiburg im Breisgau",
        "",
        f"> {tr('de', 'home_desc', rich=False)}",
        "",
        f"- Adresse: {SITE['street']}, {SITE['zip']} {SITE['city']}",
        f"- Telefon und Reservierung: {SITE['phone_display']}",
        f"- Öffnungszeiten: täglich {SITE['open']}–{SITE['close']} Uhr; Mittagsmenü {SITE['lunch_from']}–{SITE['lunch_to']} Uhr ({BASEVALS['lunch_count']} Gerichte je {BASEVALS['lunch_price']})",
        f"- Küche: türkisch-anatolisch, Holzkohlegrill (Ocakbaşı); {COUNT} Gerichte und Getränke",
        f"- Speisekarte in {len(LANGS)} Sprachen: " + ", ".join(T[l]["lang_name"] for l in LANGS),
        "",
        "## Seiten",
        f"- [{t['nav_menu']}]({absurl(page_path('de', 'menu'))}): vollständige Karte mit Preisen und Allergenen",
        f"- [{t['nav_reservation']}]({absurl(page_path('de', 'reservation'))})",
        f"- [{t['nav_contact']}]({absurl(page_path('de', 'contact'))})",
        f"- [{t['nav_reviews']}]({absurl(page_path('de', 'reviews'))})",
        f"- [English menu]({absurl(page_path('en', 'menu'))}), [Türkçe menü]({absurl(page_path('tr', 'menu'))})",
        "",
    ]
    return "\n".join(lines)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(OUT, "assets"),
                    ignore=shutil.ignore_patterns("manifest.json"))

    renderers = {"home": home, "menu": menu_page, "reservation": reservation_page,
                 "contact": contact_page, "reviews": reviews_page}
    entries = []
    for p in PAGES:
        alternates = {l: page_path(l, p) for l in LANGS}
        for lang in LANGS:
            here, title, desc, body, ld = renderers[p](lang)
            if len(title) > 70:
                WARNINGS.append(f"{here}: Titel {len(title)} Zeichen")
            write(here + "index.html", shell(lang, here, p, title, desc, body, ld, alternates))
        entries.append((page_path("de", p), alternates))
        entries.extend((page_path(l, p), alternates) for l in LANGS if l != "de")

    for kind in LEGAL:
        for lang in ("de", "en"):
            here, title, desc, body, ld = legal_page(kind, lang)
            write(here + "index.html", shell(lang, here, "legal", title, desc, body, ld, LEGAL[kind],
                                             robots="noindex, follow"))

    for old, target in OLD_URLS.items():
        write(f"{old}/index.html", redirect_stub(old, target))
    write("404.html", not_found())
    write("sitemap.xml", sitemap(entries))
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {URL}/sitemap.xml\n")
    write("llms.txt", llms_txt())
    write(".nojekyll", "")
    write("site.webmanifest", json.dumps({
        "name": SITE["name"], "short_name": "Divan", "start_url": "./", "display": "minimal-ui",
        "background_color": "#1c0f0c", "theme_color": "#1c0f0c", "lang": "de",
        "icons": [{"src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "assets/img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
    }, ensure_ascii=False, indent=1))
    # Für Netlify / Cloudflare Pages: echte 301-Weiterleitungen und Sicherheits-Header
    write("_redirects", "".join(f"/{o}  /{t}  301\n" for o, t in OLD_URLS.items()))
    write("_headers", "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
                      "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()\n"
                      "  Strict-Transport-Security: max-age=31536000; includeSubDomains\n"
                      "/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n")

    n = sum(1 for _, _, fs in os.walk(OUT) for f in fs if f.endswith(".html"))
    print(f"{n} HTML-Seiten in {OUT} ({len(LANGS)} Sprachen, {COUNT} Positionen der Karte)")
    if WARNINGS:
        print(f"\n{len(WARNINGS)} Hinweise (offene Angaben für Impressum/Datenschutz usw.):")
        for w in sorted(set(WARNINGS)):
            print("  -", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
