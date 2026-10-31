#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build app/population/data/population.json from primary sources.

Sources
  * 2025 Census, population basic tabulation (published 2026-09-29)
      1-1  population / households / area / density / 2020 change, municipality
      2-7  age (5-year and 3 categories), municipality
      49-1 nationality, municipality
  * IPSS "Regional population projections 2023" (medium variant)
      kekkahyo1.xlsx  total population 2020-2050, municipality
      1-9a.xlsx       5-year age, national, 2050

The script caches the original xlsx under .cache/population/.  The processed
JSON is committed; the raw files are not.

Run: python tools/build_population_data.py [--refresh]
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "population"
OUT = ROOT / "app" / "population" / "data" / "population.json"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

SOURCES = {
    "census_pop": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040506423&fileKind=0",
    "census_age": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040506431&fileKind=0",
    "census_foreign": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040506619&fileKind=0",
    "ipss_total": "https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/2gaiyo_hyo/kekkahyo1.xlsx",
    "ipss_age": "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/db_zenkoku2023/s_tables/1-9a.xlsx",
}

PREF_ORDER = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
    "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
    "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36",
    "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47",
]

AGE_BINS = ["0–4", "5–9", "10–14", "15–19", "20–24", "25–29", "30–34",
            "35–39", "40–44", "45–49", "50–54", "55–59", "60–64", "65–69",
            "70–74", "75–79", "80–84", "85–89", "90–94", "95–99", "100+"]


def download(name: str, url: str, refresh: bool) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / (name + ".xlsx")
    if path.exists() and not refresh:
        return path
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Referer": "https://www.ipss.go.jp/" if "ipss.go.jp" in url else "https://www.e-stat.go.jp/",
    })
    with urllib.request.urlopen(req, timeout=120) as r, path.open("wb") as f:
        f.write(r.read())
    print("downloaded", name, path.stat().st_size)
    return path


def num(v, default=None):
    if v is None:
        return default
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip().replace(",", "")
    if not s or s in ("-", "…", "－", "x", "X"):
        return default
    try:
        return float(s)
    except ValueError:
        return default


def code5(v) -> str:
    try:
        return f"{int(v):05d}"
    except (TypeError, ValueError):
        return ""


def name_of(v) -> str:
    s = str(v or "")
    return s.split("_", 1)[1] if "_" in s else s


def rows_of(path: Path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    return list(ws.iter_rows(values_only=True))


def parse_census_pop(path: Path) -> dict:
    rows = rows_of(path)
    start = next(i for i, r in enumerate(rows) if r[0] == "a")
    out = {}
    for r in rows[start:]:
        if r[0] not in ("1", "2", "3"):
            continue
        code = code5(r[5])
        if not code:
            continue
        pop = num(r[7])
        pop20 = num(r[10])
        if pop20 is None:
            pop20 = 0
        out[code] = {
            "code": code,
            "type": int(r[0]),
            "pref": str(r[4])[:2],
            "name": name_of(r[6]),
            "pop": int(pop) if pop is not None else None,
            "pop2020": int(pop20) if pop20 is not None else None,
            "change": int(num(r[11], 0)) if pop20 else None,
            "rate": round(float(num(r[12], 0)), 5) if pop20 else None,
            "area": round(float(num(r[14], 0)), 2),
            "density": round(float(num(r[15], 0)), 1),
            "households": int(num(r[17], 0)),
            "hhMembers": int(num(r[23], 0)),
        }
    return out


def parse_census_age(path: Path):
    rows = rows_of(path)
    munis, national = {}, {}
    for r in rows:
        if r[0] != "0_国籍総数" or r[2] not in ("a", "0", "1", "2", "3"):
            continue
        code = code5(r[7])
        sex = str(r[1])
        rec = {
            "age0": int(num(r[32], 0)),
            "age15": int(num(r[33], 0)),
            "age65": int(num(r[34], 0)),
            "unknown": int(num(r[31], 0)),
            "bins": [int(num(x, 0)) for x in r[10:31]],
        }
        if r[2] == "a" and code == "00000":
            national[sex] = rec
        elif r[2] in ("1", "2", "3"):
            munis[code] = rec
    return munis, national


def parse_foreign(path: Path) -> dict:
    rows = rows_of(path)
    out = {}
    for r in rows:
        if r[0] != "0_総数" or r[1] not in ("1", "2", "3"):
            continue
        code = code5(str(r[3]).split("_", 1)[0])
        if not code:
            continue
        out[code] = {
            "total": int(num(r[4], 0)),
            "foreign": int(num(r[5], 0)),
            "japanese": int(num(r[30], 0)),
            "unknown": int(num(r[31], 0)),
        }
    return out


def parse_ipss_total(path: Path) -> dict:
    rows = rows_of(path)
    data = rows[5:]
    out = {}
    for r in data:
        t = str(r[1])
        if t not in ("a", "0", "1", "2", "3", "9"):
            continue
        code = code5(r[0])
        series = [int(num(x, 0)) for x in r[4:11]]
        out[code] = {
            "type": t,
            "pref": str(r[2]) if t == "a" else None,
            "name": str(r[3] or ""),
            "series": series,
        }
    return out


def parse_ipss_age(path: Path) -> dict:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["表1-9A(4)"]  # 2050 first block
    rows = list(ws.iter_rows(values_only=True))
    male, female = [], []
    for r in rows[7:28]:
        male.append(int(round(num(r[2], 0) * 1000)))
        female.append(int(round(num(r[3], 0) * 1000)))
    total = int(round(num(rows[6][1], 0) * 1000))
    return {"total": total, "male": male, "female": female}


def squarify(values: list[tuple[str, float]], x: float, y: float,
             w: float, h: float) -> dict:
    """Squarified treemap. values = [(key, area)]; returns key -> (x,y,w,h)."""
    items = sorted(values, key=lambda kv: -kv[1])
    total = sum(v for _, v in items) or 1.0
    scale = (w * h) / total
    areas = [(k, v * scale) for k, v in items]
    out = {}

    def lay(row, rx, ry, rw, rh):
        s = sum(a for _, a in row)
        if rw >= rh:
            col_w = s / rh
            yy = ry
            for k, a in row:
                hh = a / col_w
                out[k] = (rx, yy, col_w, hh)
                yy += hh
            return rx + col_w, ry, rw - col_w, rh
        row_h = s / rw
        xx = rx
        for k, a in row:
            ww = a / row_h
            out[k] = (xx, ry, ww, row_h)
            xx += ww
        return rx, ry + row_h, rw, rh - row_h

    def aspect(row, side):
        s = sum(a for _, a in row)
        mx = max(a for _, a in row)
        mn = min(a for _, a in row)
        return max((side * side * mx) / (s * s), (s * s) / (side * side * mn))

    def rec(rest, rx, ry, rw, rh):
        if not rest:
            return
        if rw <= 0 or rh <= 0:
            for k, _ in rest:
                out[k] = (rx, ry, 0, 0)
            return
        side = min(rw, rh)
        row = [rest.pop(0)]
        while rest:
            cand = row + [rest[0]]
            if aspect(cand, side) <= aspect(row, side):
                row.append(rest.pop(0))
            else:
                break
        nx, ny, nw, nh = lay(row, rx, ry, rw, rh)
        rec(rest, nx, ny, nw, nh)

    rec(areas, x, y, w, h)
    return out


def build(refresh: bool = False):
    paths = {k: download(k, u, refresh) for k, u in SOURCES.items()}
    census = parse_census_pop(paths["census_pop"])
    age, age_nat = parse_census_age(paths["census_age"])
    foreign = parse_foreign(paths["census_foreign"])
    ipss = parse_ipss_total(paths["ipss_total"])
    ipss_age = parse_ipss_age(paths["ipss_age"])

    # 特別区部 (13100) is not a row in the IPSS table: sum the 23 wards.
    ward_codes = [f"13{i:03d}" for i in range(101, 124)]
    ward_series = [ipss[c]["series"] for c in ward_codes if c in ipss and ipss[c]["type"] == "0"]
    tokyo_series = [sum(s[i] for s in ward_series) for i in range(7)] if ward_series else None

    prefs = {}
    munis = []
    missing_proj = []
    for code in sorted(census, key=lambda c: (census[c]["pref"], -census[c]["pop"], c)):
        m = census[code]
        a = age.get(code, {})
        f = foreign.get(code, {})
        proj = ipss.get(code)
        if code == "13100" and tokyo_series:
            proj = {"type": "1", "series": tokyo_series, "name": "特別区部"}
        series = None
        if proj:
            series = [m["pop2020"], m["pop"]] + [int(x) for x in proj["series"][2:]]
        else:
            missing_proj.append(code)
        rec = {
            "code": code,
            "pref": m["pref"],
            "name": m["name"],
            "pop": m["pop"],
            "pop2020": m["pop2020"],
            "change": m["change"],
            "rate": m["rate"],
            "age0": a.get("age0", 0),
            "age15": a.get("age15", 0),
            "age65": a.get("age65", 0),
            "ageUnknown": a.get("unknown", 0),
            "foreign": f.get("foreign", 0),
            "households": m["households"],
            "hhMembers": m["hhMembers"],
            "area": m["area"],
            "density": m["density"],
            "series": series,
            "pop2050": series[-1] if series else None,
            "index2050": round(series[-1] / m["pop2020"] * 100, 1) if series and m["pop2020"] else None,
        }
        known = rec["age0"] + rec["age15"] + rec["age65"]
        rec["age65Share"] = round(rec["age65"] / known * 100, 1) if known else None
        rec["foreignShare"] = round(rec["foreign"] / rec["pop"] * 100, 2) if rec["pop"] else None
        munis.append(rec)
        p = prefs.setdefault(m["pref"], {
            "code": m["pref"], "name": "", "pop": 0, "pop2020": 0, "change": 0,
            "age0": 0, "age15": 0, "age65": 0, "foreign": 0, "households": 0,
            "area": 0.0, "n": 0,
        })
        p["pop"] += rec["pop"] or 0
        p["pop2020"] += rec["pop2020"] or 0
        p["change"] += rec["change"] or 0
        p["age0"] += rec["age0"]
        p["age15"] += rec["age15"]
        p["age65"] += rec["age65"]
        p["foreign"] += rec["foreign"]
        p["households"] += rec["households"]
        p["area"] += rec["area"]
        p["n"] += 1

    # prefecture names + IPSS prefecture 2050
    pref_names = {}
    for r in rows_of(paths["census_pop"]):
        if r[0] == "a" and r[4] and str(r[4])[:2] in PREF_ORDER:
            pref_names[str(r[4])[:2]] = name_of(r[6])
    pref_list = []
    for pc in PREF_ORDER:
        p = prefs[pc]
        p["name"] = pref_names.get(pc, pc)
        p["rate"] = round(p["change"] / p["pop2020"] * 100, 3) if p["pop2020"] else None
        known = p["age0"] + p["age15"] + p["age65"]
        p["age65Share"] = round(p["age65"] / known * 100, 1) if known else None
        p["density"] = round(p["pop"] / p["area"], 1) if p["area"] else None
        pref_proj = ipss.get(pc + "000")
        p["pop2050"] = pref_proj["series"][-1] if pref_proj else None
        p["index2050"] = round(p["pop2050"] / p["pop2020"] * 100, 1) if p["pop2050"] and p["pop2020"] else None
        pref_list.append(p)

    # grid: 54 x 32, prefecture order, population descending
    cols, rows_n = 54, 32
    for i, m in enumerate(munis):
        m["gx"] = i % cols
        m["gy"] = i // cols
    start = 0
    for p in pref_list:
        p["start"] = start
        start += p["n"]

    # treemap: population weighted
    tree = squarify([(m["code"], max(m["pop"], 1)) for m in munis], 0, 0, 1000, 620)
    for m in munis:
        m["tx"], m["ty"], m["tw"], m["th"] = [round(v, 3) for v in tree[m["code"]]]
        # remove helper aliases in output later

    # national
    nat = {
        "pop": sum(m["pop"] for m in munis),
        "pop2020": sum(m["pop2020"] for m in munis),
        "households": sum(m["households"] for m in munis),
        "hhMembers": sum(m["hhMembers"] for m in munis),
        "age0": sum(m["age0"] for m in munis),
        "age15": sum(m["age15"] for m in munis),
        "age65": sum(m["age65"] for m in munis),
        "ageUnknown": sum(m["ageUnknown"] for m in munis),
        "foreign": sum(m["foreign"] for m in munis),
        "area": round(sum(m["area"] for m in munis), 2),
        "pop2050": sum(p["pop2050"] or 0 for p in pref_list),
    }
    nat["area"] = 377979.67
    nat["density"] = 329.7
    nat["change"] = nat["pop"] - nat["pop2020"]
    nat["rate"] = round(nat["change"] / nat["pop2020"] * 100, 2)
    known = nat["age0"] + nat["age15"] + nat["age65"]
    nat["age65Share"] = round(nat["age65"] / known * 100, 1)
    # the national row is the authoritative count for age and households
    nat["age0"] = int(num(age_nat["0_総数"]["age0"], nat["age0"]))
    nat["age15"] = int(num(age_nat["0_総数"]["age15"], nat["age15"]))
    nat["age65"] = int(num(age_nat["0_総数"]["age65"], nat["age65"]))
    nat["ageUnknown"] = int(num(age_nat["0_総数"]["unknown"], nat["ageUnknown"]))
    known = nat["age0"] + nat["age15"] + nat["age65"]
    nat["age65Share"] = round(nat["age65"] / known * 100, 1)
    nat["age0Share"] = round(nat["age0"] / known * 100, 1)
    nat["age15Share"] = round(nat["age15"] / known * 100, 1)
    nat["age0Share"] = round(nat["age0"] / known * 100, 1)
    nat["age15Share"] = round(nat["age15"] / known * 100, 1)
    nat["avgHousehold"] = round(nat["hhMembers"] / nat["households"], 2)
    nat["density"] = 329.7  # published census density; the national area includes unassigned territory
    nat["index2050"] = round(nat["pop2050"] / nat["pop2020"] * 100, 1)
    nat["growing"] = sum(1 for m in munis if m["rate"] is not None and m["rate"] >= 0)
    nat["declining"] = sum(1 for m in munis if m["rate"] is not None and m["rate"] < 0)
    nat["flat"] = sum(1 for m in munis if m["rate"] is None)
    nat["growingPop"] = sum(m["pop"] for m in munis if m["rate"] is not None and m["rate"] >= 0)
    nat["decliningPop"] = sum(m["pop"] for m in munis if m["rate"] is not None and m["rate"] < 0)
    nat["growingShare"] = round(nat["growingPop"] / nat["pop"] * 100, 1)
    nat["decliningShare"] = round(nat["decliningPop"] / nat["pop"] * 100, 1)
    top10 = sorted(munis, key=lambda m: -m["pop"])[:10]
    nat["top10Share"] = round(sum(m["pop"] for m in top10) / nat["pop"] * 100, 1)

    top = {
        "gain": sorted(munis, key=lambda m: -(m["change"] if m["change"] is not None else 0))[:10],
        "loss": sorted(munis, key=lambda m: (m["change"] if m["change"] is not None else 0))[:10],
        "rateGain": sorted((m for m in munis if m["rate"] is not None), key=lambda m: -m["rate"])[:10],
        "rateLoss": sorted((m for m in munis if m["rate"] is not None), key=lambda m: m["rate"])[:10],
    }

    # age pyramid: 2025 census actual, 2050 IPSS medium
    age_2025 = {
        "male": [int(x) for x in age_nat["1_男"]["bins"]],
        "female": [int(x) for x in age_nat["2_女"]["bins"]],
    }
    age_2050 = {"male": ipss_age["male"], "female": ipss_age["female"]}

    doc = {
        "meta": {
            "built": "2026-10-31",
            "censusDate": "2025-10-01",
            "censusPublished": "2026-09-29",
            "projection": "国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」",
            "projectionDate": "2023-12-22",
            "projectionBase": "2020-10-01",
            "n": len(munis),
            "prefs": len(pref_list),
            "missingProjection": missing_proj,
            "sources": {
                "census": "https://www.stat.go.jp/data/kokusei/2025/index.html",
                "estat": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&lid=000001491012",
                "ipss": "https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp",
            },
            "national": nat,
        },
        "prefs": pref_list,
        "munis": munis,
        "age": {"bins": AGE_BINS, "y2025": age_2025, "y2050": age_2050},
        "top": top,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT, OUT.stat().st_size, "bytes")
    print("munis", len(munis), "prefs", len(pref_list), "missing projection", len(missing_proj))
    print("national", nat)
    print("top gain", [(m["name"], m["change"]) for m in top["gain"][:5]])
    print("top loss", [(m["name"], m["change"]) for m in top["loss"][:5]])
    return doc


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true")
    build(ap.parse_args().refresh)
