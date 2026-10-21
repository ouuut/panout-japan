#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_housing_towns.py — 町名（地区名）粒度的均价 + 町名多边形。

官方成約 CSV 的最小定位单位是「市区町村 + 地区名（町名）」。
这里按町名汇总：平均㎡単価、平均総額、件数。不做面积筛选、不算中位数、不做 70㎡ 换算。
几何来自 crime 章节的町丁目边界，按町名合并 + 简化。

用法：
  python tools/build_housing_towns.py --csv .cache/housing-probe/tokyo_all.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "housing" / "data"
CHOME = ROOT / "app" / "crime" / "data" / "chome_poly.json"

WARDS = {
    "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区",
    "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区",
    "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区",
}
TYPES = "中古マンション等"
CATEGORY = "成約価格情報"


def norm(s: str) -> str:
    return (s or "").strip().replace("ケ", "ヶ").replace(" ", "").replace("\u3000", "")


def town_of(name: str):
    m = re.match(r"^(.+?区)(.+?)(\d+丁目)?$", name)
    if not m:
        return None
    return m.group(1), norm(re.sub(r"\d+丁目$", "", m.group(2)))


def num(s):
    s = (s or "").strip().replace(",", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def round_coords(obj, nd=5):
    if isinstance(obj, (list, tuple)):
        return [round_coords(x, nd) for x in obj]
    if isinstance(obj, float):
        return round(obj, nd)
    return obj


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", type=Path, required=True)
    ap.add_argument("--simplify", type=float, default=0.00018)
    args = ap.parse_args()

    raw = args.csv.read_bytes()
    for enc in ("utf-8-sig", "cp932", "utf-8"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise SystemExit("cannot decode csv")
    rows = list(csv.DictReader(text.splitlines()))

    # 1) 町名 -> 合并多边形
    groups = defaultdict(list)
    chome = json.loads(CHOME.read_text(encoding="utf-8"))["features"]
    for f in chome:
        p = f.get("properties", {})
        if p.get("ward") not in WARDS or not f.get("geometry"):
            continue
        t = town_of(p.get("name", ""))
        if t:
            groups[t].append(shape(f["geometry"]))

    # 2) 町名 -> 统计
    stats = defaultdict(lambda: {"n": 0, "u": [], "p": []})
    for r in rows:
        if r.get("種類") != TYPES or r.get("価格情報区分") != CATEGORY:
            continue
        ward = r.get("市区町村名", "").strip()
        if ward not in WARDS:
            continue
        key = (ward, norm(r.get("地区名", "")))
        price = num(r.get("取引価格（総額）"))
        area = num(r.get("面積（㎡）"))
        if not price or not area:
            continue
        s = stats[key]
        s["n"] += 1
        s["u"].append(price / area)
        s["p"].append(price / 1e4)

    towns, feats = [], []
    keys = sorted(set(groups) | set(stats))
    for i, key in enumerate(keys):
        ward, name = key
        s = stats.get(key)
        rec = {
            "i": i, "ward": ward, "town": name,
            "n": s["n"] if s else 0,
            "unit": round(sum(s["u"]) / len(s["u"])) if s and s["u"] else None,
            "total": round(sum(s["p"]) / len(s["p"])) if s and s["p"] else None,
        }
        towns.append(rec)
        if key not in groups:
            continue
        g = unary_union([x.buffer(0) for x in groups[key]])
        if g.is_empty:
            continue
        g = g.simplify(args.simplify, preserve_topology=True)
        feats.append({
            "type": "Feature",
            "properties": {"i": i},
            "geometry": {"type": g.geom_type, "coordinates": round_coords(mapping(g)["coordinates"])},
        })

    doc = {
        "basis": "2025Q2–2026Q1",
        "type": TYPES,
        "category": CATEGORY,
        "wards": 23,
        "n": sum(t["n"] for t in towns),
        "towns": towns,
        "geo": {"type": "FeatureCollection", "features": feats},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    p = OUT / "towns.json"
    p.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    have = sum(1 for t in towns if t["n"])
    print(f"towns {len(towns)} (with data {have}) · deals {doc['n']} · polys {len(feats)}")
    print(f"wrote {p} {p.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
