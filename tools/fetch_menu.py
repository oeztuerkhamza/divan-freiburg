#!/usr/bin/env python3
"""Liest die digitale Speisekarte (alle Sprachen) und schreibt data/menu.json.

Quelle: https://breisgau-digital.de/m/divan/karte?l=<sprache>
Die digitale Karte ist die einzige Quelle für Gerichte, Preise, Allergene und
Übersetzungen. Nach jeder Änderung der Karte dieses Skript ausführen und danach
build.py, damit Website und Tischkarte übereinstimmen.

    pip install beautifulsoup4
    python3 tools/fetch_menu.py            # live laden
    python3 tools/fetch_menu.py --dir DIR  # aus gespeicherten karte_<l>.html
"""
import argparse
import datetime
import json
import os
import re
import sys
import urllib.request

from bs4 import BeautifulSoup

URL = "https://breisgau-digital.de/m/divan/karte?l={}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "menu.json")


def load(lang, folder):
    if folder:
        with open(os.path.join(folder, f"karte_{lang}.html"), encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(URL.format(lang), headers={"User-Agent": "divan-site-build"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def split_label(text):
    """'Enthält: Milch, Eier' -> ('Enthält', ['Milch', 'Eier'])"""
    if ":" not in text:
        return None, [text.strip()]
    label, rest = text.split(":", 1)
    return label.strip(), [p.strip() for p in rest.split(",") if p.strip()]


def parse(html):
    s = BeautifulSoup(html, "html.parser")
    langs = [(a["href"].split("=", 1)[1], a.get_text(strip=True)) for a in s.select(".langs a")]
    actions = [a.get_text(" ", strip=True) for a in s.select(".actions a")]
    page = {
        "lang": s.html.get("lang"),
        "dir": s.html.get("dir") or "ltr",
        "languages": langs,
        "fnote": s.select_one(".fnote").get_text(" ", strip=True),
        "call": actions[0].split("·")[0].strip() if actions else "",
        "directions": actions[1].split("·")[0].strip() if len(actions) > 1 else "",
        "labels": {},
        "sections": [],
    }
    for sec in s.select("section"):
        h2 = sec.find("h2")
        hrs = h2.find("small")
        hrs_text = hrs.get_text(" ", strip=True) if hrs else None
        if hrs:
            hrs.extract()
        note = sec.select_one(".note")
        items = []
        for li in sec.select("li"):
            num = li.select_one(".num")
            num_text = num.get_text(strip=True) if num else None
            if num:
                num.extract()
            name = li.select_one(".name").get_text(" ", strip=True)
            desc = li.select_one(".desc")
            img = li.select_one("img.dish")
            contains, additives = [], []
            for p in li.select(".contains"):
                label, values = split_label(p.get_text(" ", strip=True))
                # Erste Zeile mit Allergenen trägt data-a, die zweite sind Zusatzstoffe.
                if li.get("data-a") and not contains and p is li.select(".contains")[0]:
                    contains = values
                    page["labels"].setdefault("contains", label)
                else:
                    additives = values
                    page["labels"].setdefault("additives", label)
            items.append({
                "num": num_text,
                "name": name,
                "price": li.select_one(".price").get_text(" ", strip=True),
                "desc": desc.get_text(" ", strip=True) if desc else None,
                "contains": contains,
                "additives": additives,
                "allergen_codes": (li.get("data-a") or "").split(),
                "img": img["src"].split("?")[0] if img else None,
            })
        page["sections"].append({
            "id": h2.get("id"),
            "title": h2.get_text(" ", strip=True),
            "hours": sec.get("data-hrs"),
            "hours_label": hrs_text,
            "note": note.get_text(" ", strip=True) if note else None,
            "items": items,
        })
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", help="Ordner mit karte_<lang>.html statt Live-Abruf")
    args = ap.parse_args()

    base = parse(load("de", args.dir))
    codes = [c for c, _ in base["languages"]]
    pages = {"de": base}
    for code in codes:
        if code != "de":
            pages[code] = parse(load(code, args.dir))

    # Struktur gegen Deutsch prüfen: gleiche Abschnitte, gleiche Anzahl Positionen.
    for code, p in pages.items():
        if [len(x["items"]) for x in p["sections"]] != [len(x["items"]) for x in base["sections"]]:
            sys.exit(f"Struktur von '{code}' weicht von Deutsch ab – bitte Karte prüfen.")

    out = {
        "source": URL.format("<lang>"),
        "fetched": datetime.date.today().isoformat(),
        "languages": [{"code": c, "name": n} for c, n in base["languages"]],
        "ui": {c: {k: p[k] for k in ("fnote", "call", "directions", "labels", "dir")} for c, p in pages.items()},
        "sections": [],
    }
    for i, sec in enumerate(base["sections"]):
        o = {
            "id": sec["id"],
            "hours": sec["hours"],
            "title": {c: pages[c]["sections"][i]["title"] for c in pages},
            "hours_label": {c: pages[c]["sections"][i]["hours_label"] for c in pages} if sec["hours_label"] else None,
            "note": {c: pages[c]["sections"][i]["note"] for c in pages} if sec["note"] else None,
            "items": [],
        }
        for j, it in enumerate(sec["items"]):
            o["items"].append({
                "num": it["num"],
                "price": it["price"],
                "img": it["img"],
                "allergen_codes": it["allergen_codes"],
                "name": {c: pages[c]["sections"][i]["items"][j]["name"] for c in pages},
                "desc": {c: pages[c]["sections"][i]["items"][j]["desc"] for c in pages} if it["desc"] else None,
                "contains": {c: pages[c]["sections"][i]["items"][j]["contains"] for c in pages} if it["contains"] else None,
                "additives": {c: pages[c]["sections"][i]["items"][j]["additives"] for c in pages} if it["additives"] else None,
            })
        out["sections"].append(o)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    n = sum(len(s["items"]) for s in out["sections"])
    print(f"{OUT}: {len(out['sections'])} Abschnitte, {n} Positionen, {len(pages)} Sprachen")


if __name__ == "__main__":
    main()
