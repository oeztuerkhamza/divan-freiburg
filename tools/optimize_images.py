#!/usr/bin/env python3
"""Erzeugt optimierte Bilder für die Website aus den Originalfotos.

photos/home/*.jpg  -> assets/img/h-<name>-<breite>.webp
photos/menu/*.jpg  -> assets/img/m-<name>-<breite>.webp
Zusätzlich: Social-Media-Bild (og.jpg, 1200x630) und Icons (favicon, Apple, PWA).
assets/img/manifest.json hält Maße und Breiten fest; build.py liest sie für
width/height/srcset (verhindert Layout-Verschiebungen, CLS).

    pip install pillow
    python3 tools/optimize_images.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "photos")
OUT = os.path.join(ROOT, "assets", "img")
WIDTHS = (360, 720, 1000)
QUALITY = 74          # kleine Bilder
QUALITY_LARGE = 64    # ab 720 px; Streifen-Tischdecke erzeugt viel Detail

RED, GOLD, INK = (142, 27, 27), (227, 194, 122), (28, 15, 12)


def save_variants(path, prefix):
    name = os.path.splitext(os.path.basename(path))[0]
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    w, h = im.size
    widths = sorted({min(x, w) for x in WIDTHS})
    for tw in widths:
        th = round(h * tw / w)
        im.resize((tw, th), Image.LANCZOS).save(
            os.path.join(OUT, f"{prefix}-{name}-{tw}.webp"), "WEBP", quality=QUALITY if tw < 720 else QUALITY_LARGE, method=6)
    return f"{prefix}-{name}", {"w": w, "h": h, "widths": widths}


def serif_font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def icon(size, maskable=False):
    im = Image.new("RGB", (size, size), RED if maskable else INK)
    d = ImageDraw.Draw(im)
    if not maskable:
        r = round(size * 0.22)
        d.rounded_rectangle((0, 0, size - 1, size - 1), r, fill=RED)
    font = serif_font(round(size * (0.5 if maskable else 0.62)))
    d.text((size / 2, size / 2), "D", font=font, fill=GOLD, anchor="mm")
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        os.remove(os.path.join(OUT, old))
    manifest = {}
    for folder, prefix in (("home", "h"), ("menu", "m")):
        for f in sorted(os.listdir(os.path.join(SRC, folder))):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                key, meta = save_variants(os.path.join(SRC, folder, f), prefix)
                manifest[key] = meta

    # Social-Media-Vorschau 1200x630 (Open Graph / WhatsApp / Facebook)
    hero = Image.open(os.path.join(SRC, "home", "hero.jpg")).convert("RGB")
    ImageOps.fit(hero, (1200, 630), Image.LANCZOS).save(
        os.path.join(OUT, "og.jpg"), "JPEG", quality=82, optimize=True, progressive=True)

    # Icons
    icon(32).save(os.path.join(OUT, "favicon-32.png"))
    icon(180).save(os.path.join(OUT, "apple-touch-icon.png"))
    icon(192).save(os.path.join(OUT, "icon-192.png"))
    icon(512).save(os.path.join(OUT, "icon-512.png"))
    icon(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))

    with open(os.path.join(OUT, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" '
                'fill="#8e1b1b"/><text x="32" y="45" font-family="Georgia,serif" font-size="38" text-anchor="middle" '
                'fill="#e3c27a">D</text></svg>\n')

    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1, sort_keys=True)
    total = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT))
    print(f"{len(manifest)} Fotos, {len(os.listdir(OUT))} Dateien, {total // 1024} KB in {OUT}")


if __name__ == "__main__":
    main()
