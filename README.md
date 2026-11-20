# Divan Ocakbaşı – Homepage

Statische Homepage des Divan Ocakbaşı, Bertoldstraße 54, 79098 Freiburg im Breisgau.
Reines HTML/CSS/JS ohne Build, 15 Sprachen (DE, EN, TR, FR, ES, IT, EL, RU, AR, FA, KU, UR, HI, KO, ZH).

- `index.html` – Seite (Deutsch)
- `styles.css` – Gestaltung (inkl. RTL für AR/FA/UR)
- `script.js` – Sprachumschaltung, Navigation, Einblendungen
- `fx.js` – Feuer-Effekte (WebGL-Flammen, Funken, Scroll-Animationen)
- `i18n/xx.js` – Übersetzungen, werden erst bei Bedarf geladen
- `restaurant-freiburg/`, `mittagstisch-freiburg/`, `faq/`, … und `en/…` – SEO-Seiten (DE/EN), **generiert**: Inhalte in `tools/seo-content.js`, Erzeugung mit `node tools/build-seo.js` (schreibt auch `sitemap.xml` und `robots.txt`). Domain wechseln = `SITE` in `tools/seo-content.js` ändern und neu erzeugen.
- `page.css`, `page.js` – Gestaltung/Menü der SEO-Seiten
- `img/` – eigene Fotos des Hauses
- `vid/` – kurze stumme Video-Loops mit Standbild für die Ambiente-Galerie (`#ambiente`)

Live: https://oeztuerkhamza.github.io/divan-freiburg/

Jede Änderung auf `main` wird per GitHub Actions auf den Branch `gh-pages` gespiegelt,
den GitHub Pages ausliefert.
