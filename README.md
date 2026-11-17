# Divan Ocakbaşı – Website

Website des Divan Ocakbaşı, Bertoldstraße 54, 79098 Freiburg im Breisgau.
Statisch erzeugt (Python, keine Abhängigkeiten), in **15 Sprachen** – denselben wie die
digitale Speisekarte: Deutsch, English, Français, Türkçe, Kurdî, Español, Italiano, Ελληνικά,
العربية, فارسی, اردو, हिन्दी, Русский, 中文, 한국어.

Vorschau: https://oeztuerkhamza.github.io/divan-freiburg/

## Seiten

| Seite | Deutsch (Wurzel) | andere Sprachen |
|---|---|---|
| Startseite | `/` | `/en/`, `/tr/`, … |
| Speisekarte (alle 231 Positionen, Preise, Allergene) | `/menu/` | `/en/menu/`, `/fr/carte/`, `/es/carta/`, … |
| Reservierung | `/reservierung/` | `/en/reservations/`, `/tr/rezervasyon/`, … |
| Kontakt & Anfahrt (Karte erst nach Klick) | `/kontakt/` | `/en/contact/`, `/tr/iletisim/`, … |
| Bewertungen (Google) | `/bewertungen/` | `/en/reviews/`, `/tr/yorumlar/`, … |
| Impressum / Datenschutz | `/impressum/`, `/datenschutz/` | `/en/legal-notice/`, `/en/privacy/` |

Die Adressen der alten Website bleiben erhalten: `/menu`, `/reservierung` und `/kontakt` existieren
weiter, `/home`, `/kasse`, `/adressecheck` und `/speisekarte` leiten weiter (Meta-Refresh auf GitHub
Pages, echte 301 über `_redirects` bei Netlify/Cloudflare).

## Bauen und ansehen

```sh
python3 build.py                     # Python ≥ 3.12, erzeugt _site/
python3 -m http.server -d _site 8000 # http://localhost:8000
```

Bei jedem Push auf `main` baut GitHub Actions die Seite und veröffentlicht `_site/` auf `gh-pages`.

## Inhalte pflegen

| Was | Wo |
|---|---|
| Adresse, Telefon, Öffnungszeiten, Links, **Impressum-Angaben** | `data/site.json` |
| Speisekarte, Preise, Allergene, Übersetzungen der Gerichte | digitale Karte ändern, dann `python3 tools/fetch_menu.py` (braucht `beautifulsoup4`) |
| Google-Bewertungen (Note, Anzahl, ausgewählte Texte) | `data/reviews.json` |
| Texte der Website je Sprache | `src/i18n/<sprache>.json` |
| Impressum / Datenschutzerklärung | `src/legal/*.html` |
| Fotos | Original nach `photos/home` oder `photos/menu`, dann `python3 tools/optimize_images.py` (braucht `pillow`) |

Fehlende Pflichtangaben (z. B. Inhaber, E-Mail) erscheinen im Impressum gelb markiert, und
`build.py` listet sie am Ende auf.

## Technik

- Eigene URL je Sprache mit `hreflang` (inkl. `x-default`), Canonical, `sitemap.xml` mit Sprachvarianten
- Strukturierte Daten (JSON-LD): Restaurant, Öffnungszeiten, Speisekarte (Menu/MenuItem mit Preisen),
  FAQ, Breadcrumbs
- Keine Cookies, kein Tracking, keine externen Anfragen beim Laden (Schriften lokal, Google Maps erst
  nach Klick) – deshalb ist kein Cookie-Banner nötig
- Arabisch, Persisch und Urdu von rechts nach links; Bilder als WebP in mehreren Größen
- Content-Security-Policy, `robots.txt`, `llms.txt`, Web-App-Manifest, 404-Seite
