#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py — render the whole japan.ouuut.com MPA into site/.

Single source of truth:
  app/quake/data/*      USGS hypocentres + coastline
  app/crime/data/*      Tokyo chome counts + polygons + population
  app/cabinet/data.json polls + cabinets
  src/*.css, src/shell.js

Output: 104 pre-rendered pages + assets + CSV + sitemap + headers.
"""
import csv
import hashlib
import html
import json
import math
import re
import shutil
import sys
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import svgkit as S
import home_plates as HP

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
SRC = ROOT / "src"
SITE_URL = "https://japan.ouuut.com"
BRAND = "japan.ouuut.com"
WM = '<span class="wm-main">japan</span><span class="wm-tld">.ouuut.com</span>'
BUILD_DATE = "2026-10-19"
BUILD_STAMP = datetime.now().strftime("%Y-%m-%d %H:%M")

# ---------------------------------------------------------------- data
Q = json.loads((ROOT / "app/quake/data/quakes.json").read_text(encoding="utf-8"))
OUTLINE = json.loads((ROOT / "app/quake/data/japan-outline.json").read_text(encoding="utf-8"))
CAB = json.loads((ROOT / "app/cabinet/data.json").read_text(encoding="utf-8"))
MUNI = json.loads((ROOT / "app/crime/data/muni.json").read_text(encoding="utf-8"))
POINTS = json.loads((ROOT / "app/crime/data/points.json").read_text(encoding="utf-8"))
CHOME = json.loads((ROOT / "app/crime/data/chome_poly.json").read_text(encoding="utf-8"))
MUNI_POLY = json.loads((ROOT / "app/crime/data/muni_poly.json").read_text(encoding="utf-8"))

MUNI_BY = {m["ward"]: m for m in MUNI}
CAB_BY = {c["pm"]: c for c in CAB["cabinets"]}
POLLS = CAB["polls"]


def energy(mag):
    return 10 ** (1.5 * float(mag) + 4.8)


TOTAL_E = sum(energy(x["mag"]) for x in Q)

QY = defaultdict(list)
QM = defaultdict(list)
for x in Q:
    QY[x["time"][:4]].append(x)
    QM[x["time"][:7]].append(x)
YEARS = sorted(QY)
YEAR_E = {y: sum(energy(x["mag"]) for x in v) for y, v in QY.items()}
MAX_ENERGY = max(YEAR_E.values())

# crime ward aggregates
WARD_RATE = {}
for m in MUNI:
    pop = m.get("pop") or 0
    tot = (m.get("R7") or {}).get("total", 0)
    WARD_RATE[m["ward"]] = (tot / pop * 1000) if pop else None
WARD_RANK = {w: i + 1 for i, (w, r) in enumerate(
    sorted(((w, r) for w, r in WARD_RATE.items() if r is not None), key=lambda t: -t[1]))}

TOTAL_CRIME = sum((m.get("R7") or {}).get("total", 0) for m in MUNI)
CHOME_RATES = sorted(
    (p.get("t") or 0) / p["pop"] * 1000
    for p in POINTS if (p.get("pop") or 0) >= 200)
CHOME_MEDIAN = CHOME_RATES[len(CHOME_RATES) // 2]
CHOME_MAX = CHOME_RATES[-1]
TOTAL_POP = sum((m.get("pop") or 0) for m in MUNI)
CHOME_COUNT = len(POINTS)

# cabinet series
CAB_MONTHS = {}
for c in CAB["cabinets"]:
    buckets = defaultdict(lambda: [0.0, 0])
    for p in POLLS:
        if p["pm"] != c["pm"]:
            continue
        b = buckets[p["date"][:7]]
        b[0] += p["value"]
        b[1] += 1
    CAB_MONTHS[c["pm"]] = [(ym, v / n) for ym, (v, n) in sorted(buckets.items())]

ALL_MONTHS = sorted({p["date"][:7] for p in POLLS})
MONTH_MEAN = {}
for ym in ALL_MONTHS:
    vs = [p["value"] for p in POLLS if p["date"][:7] == ym]
    MONTH_MEAN[ym] = sum(vs) / len(vs)

CAB_BUCKETS = defaultdict(int)
for p in POLLS:
    CAB_BUCKETS[(p["pm"], p["date"][:7])] += 1
N_BUCKETS = len(CAB_BUCKETS)
N_SINGLE = sum(1 for v in CAB_BUCKETS.values() if v == 1)

# ---------------------------------------------------------------- helpers


def esc(s):
    return html.escape(str(s), quote=True)


def n(x):
    return f"{int(round(x)):,}"


def f1(x):
    return f"{x:.1f}"


def pct(x, d=1):
    return f"{x * 100:.{d}f}"


def jfmt(j):
    if j >= 1e18:
        return f"{j / 1e18:.2f}×10¹⁸"
    if j >= 1e15:
        return f"{j / 1e15:.2f}×10¹⁵"
    return f"{j / 1e12:.1f}×10¹²"


def slug_ward(w):
    for f in MUNI_POLY["features"]:
        if f["properties"]["ward_ja"] == w:
            return f["properties"]["ward_en"].lower().replace(" ", "-").replace(".", "")
    return re.sub(r"\W+", "-", w)


def ward_by_slug(s):
    for w in MUNI_BY:
        if slug_ward(w) == s:
            return w
    return None


def bar_svg(vals, labels=None, w=1000, h=250, accent_class="bar", highlight=None):
    pad_l, pad_b, pad_t, pad_r = 46, 26, 14, 6
    n_ = len(vals)
    maxv = max(vals) or 1
    bw = (w - pad_l - pad_r) / n_
    out = [f'<svg class="chart" viewBox="0 0 {w} {h}" role="img" preserveAspectRatio="xMidYMid meet">']
    for i, v in enumerate(vals):
        bh = (h - pad_b - pad_t) * (v / maxv)
        x = pad_l + i * bw + bw * 0.14
        cls = accent_class + (" hot" if highlight is not None and i == highlight else "")
        out.append(f'<rect class="{cls}" x="{x:.1f}" y="{h - pad_b - bh:.1f}" '
                   f'width="{bw * 0.72:.1f}" height="{bh:.1f}" rx="1"/>')
    out.append(f'<line x1="{pad_l}" y1="{h - pad_b}" x2="{w - pad_r}" y2="{h - pad_b}" '
               f'class="axis"/>')
    out.append(f'<text x="{pad_l - 8}" y="{pad_t + 6}" text-anchor="end">{n(maxv)}</text>')
    out.append(f'<text x="{pad_l - 8}" y="{h - pad_b}" text-anchor="end">0</text>')
    if labels:
        step = 1 if n_ <= 14 else 2
        for i, lab in enumerate(labels):
            if i % step:
                continue
            out.append(f'<text x="{pad_l + i * bw + bw / 2:.1f}" y="{h - 8}" '
                       f'text-anchor="middle">{lab}</text>')
    out.append("</svg>")
    return "".join(out)


def line_svg(series, w=1000, h=320, ymin=0, ymax=100, labels=True, auto=False):
    """series: [(label, value)]"""
    if not series:
        return ""
    if auto:
        vals = [v for _, v in series]
        ymin = max(0, int(math.floor(min(vals) / 10) * 10) - 10)
        ymax = min(100, int(math.ceil(max(vals) / 10) * 10) + 10)
        if ymax - ymin < 20:
            ymax = min(100, ymin + 20)
    pad_l, pad_b, pad_t, pad_r = 42, 26, 14, 10
    n_ = len(series)
    xs = [pad_l + (w - pad_l - pad_r) * (i / max(1, n_ - 1)) for i in range(n_)]
    ys = [pad_t + (h - pad_t - pad_b) * (1 - (v - ymin) / (ymax - ymin)) for _, v in series]
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))
    area = f"{xs[0]:.1f},{h - pad_b:.1f} " + pts + f" {xs[-1]:.1f},{h - pad_b:.1f}"
    out = [f'<svg class="chart" viewBox="0 0 {w} {h}" role="img" preserveAspectRatio="xMidYMid meet">']
    out.append(f'<polygon class="area" points="{area}"/>')
    out.append(f'<polyline class="line" points="{pts}"/>')
    for gy in (ymin, (ymin + ymax) / 2, ymax):
        yy = pad_t + (h - pad_t - pad_b) * (1 - (gy - ymin) / (ymax - ymin))
        out.append(f'<line x1="{pad_l}" y1="{yy:.1f}" x2="{w - pad_r}" y2="{yy:.1f}" class="grid"/>')
        out.append(f'<text x="{pad_l - 8}" y="{yy + 3:.1f}" text-anchor="end">{gy:.0f}</text>')
    if labels:
        step = max(1, n_ // 6)
        for i in range(0, n_, step):
            lab = series[i][0]
            out.append(f'<text x="{xs[i]:.1f}" y="{h - 8}" text-anchor="middle">{lab}</text>')
    out.append("</svg>")
    return "".join(out)


def quake_poster(w=1000, h=900):
    bbox = (120.5, 22.0, 151.5, 47.5)
    proj = S.Proj(bbox, w, h, 12)
    segs = S.clip_lines(OUTLINE["features"], bbox, 0.03)
    coast = "".join(S.path(s, proj) for s in segs)

    cell = 0.5
    bins = defaultdict(int)
    for x in Q:
        lon, lat = x["lon"], x["lat"]
        if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
            continue
        bins[(int((lon - bbox[0]) / cell), int((lat - bbox[1]) / cell))] += 1
    maxc = max(bins.values()) or 1
    levels = 6
    buckets = defaultdict(list)
    for (ix, iy), c in bins.items():
        if c < 3:
            continue
        lv = min(levels - 1, int((c / maxc) ** 0.45 * levels))
        x0, y0 = proj.xy(bbox[0] + ix * cell, bbox[1] + iy * cell)
        x1, y1 = proj.xy(bbox[0] + (ix + 1) * cell, bbox[1] + (iy + 1) * cell)
        ww, hh = abs(x1 - x0), abs(y1 - y0)
        buckets[lv].append((x0, y1, ww, hh))
    out = [f'<svg class="poster poster-quake" viewBox="0 0 {w} {h}" role="img" '
           f'aria-label="日本周辺の震源密度">']
    for lv in sorted(buckets):
        op = 0.07 + 0.155 * lv
        d = "".join(f"M{x:.1f} {y:.1f}h{ww:.1f}v{hh:.1f}h{-ww:.1f}z"
                    for x, y, ww, hh in buckets[lv])
        out.append(f'<path d="{d}" fill="var(--accent)" opacity="{op:.2f}"/>')
    out.append(f'<path d="{coast}" fill="none" stroke="var(--ink)" stroke-width="1.1" '
               f'opacity="0.85" stroke-linejoin="round"/>')
    mx, my = proj.xy(142.37, 38.30)
    out.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="7" fill="none" '
               f'stroke="var(--accent)" stroke-width="1.6"/>')
    out.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="2.2" fill="var(--accent)"/>')
    out.append(f'<text x="{mx + 13:.1f}" y="{my + 4:.1f}" class="poster-lab" '
               f'paint-order="stroke" stroke="var(--stage)" stroke-width="4" '
               f'stroke-linejoin="round">2011-03-11 · M9.1</text>')
    out.append("</svg>")
    return "".join(out)


def crime_poster(w=1000, h=513):
    bbox = (138.96, 35.48, 139.97, 35.90)
    proj = S.Proj(bbox, w, h, 14)
    buckets = defaultdict(list)
    for p in POINTS:
        lon, lat = p.get("lng"), p.get("lat")
        if lon is None or lat is None:
            continue
        if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
            continue
        t = p.get("t") or 0
        lv = 0 if t <= 2 else (1 if t <= 6 else (2 if t <= 15 else 3))
        x, y = proj.xy(lon, lat)
        buckets[lv].append((x, y))
    widths = [1.5, 2.3, 3.1, 4.0]
    ops = [0.30, 0.42, 0.55, 0.68]
    out = [f'<svg class="poster poster-crime" viewBox="0 0 {w} {h}" role="img" '
           f'aria-label="東京都の町丁別認知件数">']
    for lv in sorted(buckets):
        d = "".join(f"M{x:.0f} {y:.0f}h0" for x, y in buckets[lv])
        out.append(f'<path d="{d}" stroke="var(--accent)" stroke-width="{widths[lv]}" '
                   f'stroke-linecap="round" opacity="{ops[lv]}"/>')
    out.append("</svg>")
    return "".join(out)


def ward_map(ward, w=900, h=640):
    feats = [f for f in CHOME["features"]
             if f["properties"].get("ward") == ward and f.get("geometry")]
    if not feats:
        return ""
    minx = miny = 1e9
    maxx = maxy = -1e9
    from shapely.geometry import shape
    gs = []
    for f in feats:
        try:
            g = shape(f["geometry"])
        except Exception:
            continue
        gs.append((g, f["properties"]))
        x0, y0, x1, y1 = g.bounds
        minx, miny = min(minx, x0), min(miny, y0)
        maxx, maxy = max(maxx, x1), max(maxy, y1)
    if not gs:
        return ""
    pad = (maxx - minx) * 0.03 + 0.002
    bb = (minx - pad, miny - pad, maxx + pad, maxy + pad)
    # match the viewBox to the ward's Mercator aspect so the map fills the frame
    span_x = math.radians(bb[2] - bb[0])
    span_y = S.merc(bb[3]) - S.merc(bb[1])
    aspect = span_x / span_y if span_y else 1.0
    h = max(380, min(820, round(w / aspect)))
    proj = S.Proj(bb, w, h, 10)
    out = [f'<svg class="wardmap" viewBox="0 0 {w} {h}" role="img" aria-label="{esc(ward)}の町丁別犯罪率">']
    for g, pr in gs:
        pop = pr.get("pop") or 0
        t = pr.get("t") or 0
        if pop >= 200:
            rate = t / pop * 1000
            lv = 0 if rate < 2 else (1 if rate < 4 else (2 if rate < 6 else (3 if rate < 10 else 4)))
            op = [0.16, 0.3, 0.45, 0.62, 0.8][lv]
            fill = f'fill="var(--accent)" fill-opacity="{op}"'
        else:
            fill = 'fill="var(--faint)" fill-opacity="0.14"'
        d = S.rings_path(g, proj, 0.0004)
        if d:
            out.append(f'<path d="{d}" {fill} stroke="var(--bg)" stroke-width="0.5"/>')
    out.append("</svg>")
    return "".join(out)


def quake_thumb(w=300, h=140):
    bbox = (128.0, 30.0, 146.0, 43.0)
    proj = S.Proj(bbox, w, h, 4)
    segs = S.clip_lines(OUTLINE["features"], bbox, 0.08)
    d = "".join(S.path(s, proj) for s in segs)
    cell = 0.8
    bins = defaultdict(int)
    for x in Q:
        if x["time"][:4] != "2011":
            continue
        lon, lat = x["lon"], x["lat"]
        if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
            continue
        bins[(int((lon - bbox[0]) / cell), int((lat - bbox[1]) / cell))] += 1
    heat = []
    if bins:
        mx = max(bins.values())
        for (ix, iy), c in bins.items():
            x0, y0 = proj.xy(bbox[0] + ix * cell, bbox[1] + iy * cell)
            x1, y1 = proj.xy(bbox[0] + (ix + 1) * cell, bbox[1] + (iy + 1) * cell)
            ww, hh = abs(x1 - x0), abs(y1 - y0)
            op = 0.12 + 0.6 * (c / mx) ** 0.6
            heat.append(f'<rect x="{x0:.1f}" y="{y1:.1f}" width="{ww:.1f}" '
                        f'height="{hh:.1f}" fill="var(--accent)" opacity="{op:.2f}"/>')
    return (f'<svg class="thumb-svg" viewBox="0 0 {w} {h}" role="img" aria-hidden="true">'
            + "".join(heat)
            + f'<path d="{d}" fill="none" stroke="var(--faint)" stroke-width="0.7"/></svg>')


def crime_thumb(w=300, h=140):
    from shapely.geometry import shape
    from shapely.ops import unary_union
    from shapely.validation import make_valid
    gs = [make_valid(shape(f["geometry"])) for f in MUNI_POLY["features"]
          if f.get("geometry") and f["properties"]["area_ja"] == "都区部"]
    if not gs:
        return ""
    u = unary_union(gs)
    proj = S.Proj((139.56, 35.52, 139.94, 35.82), w, h, 4)
    d = S.rings_path(u, proj, 0.002)
    return (f'<svg class="thumb-svg" viewBox="0 0 {w} {h}" role="img" aria-hidden="true">'
            f'<path d="{d}" fill="var(--accent)" fill-opacity="0.16" stroke="var(--accent)" '
            f'stroke-width="1" stroke-opacity="0.5"/></svg>')


def cabinet_thumb(w=300, h=140):
    s = [(ym, MONTH_MEAN[ym]) for ym in ALL_MONTHS]
    pad = 6
    xs = [pad + (w - 2 * pad) * i / (len(s) - 1) for i in range(len(s))]
    ys = [pad + (h - 2 * pad) * (1 - v / 100) for _, v in s]
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))
    area = f"{xs[0]:.1f},{h - pad:.1f} " + pts + f" {xs[-1]:.1f},{h - pad:.1f}"
    return (f'<svg class="thumb-svg" viewBox="0 0 {w} {h}" role="img" aria-hidden="true">'
            f'<polygon points="{area}" fill="var(--accent)" opacity="0.12"/>'
            f'<polyline points="{pts}" fill="none" stroke="var(--accent)" stroke-width="1.4"/></svg>')


# ---------------------------------------------------------------- copy
COPY = {
    "nav.quake": ("地震", "地震", "Quakes"),
    "nav.crime": ("犯罪", "犯罪", "Crime"),
    "nav.cabinet": ("内閣", "内阁", "Cabinet"),
    "nav.method": ("方法", "方法", "Method"),
    "ui.theme": ("配色を変える", "切换配色", "Change palette"),
    "ui.lang": ("言語", "语言", "Language"),
    "ui.launch": ("起動する", "启动", "Launch"),
    "ui.launching": ("読み込み中…", "加载中…", "Loading…"),
    "ui.failed": ("読み込み失敗", "加载失败", "Failed to load"),
    "ui.close": ("閉じる", "关闭", "Close"),
    "skip": ("本文へ", "跳到正文", "Skip to content"),
    "crumb.home": ("表紙", "封面", "Cover"),

    "cover.kicker": ("JAPAN.OUUUT.COM · 2000—2026", "JAPAN.OUUUT.COM · 2000—2026", "JAPAN.OUUUT.COM · 2000—2026"),
    "cover.title": ("日本を、<br><em>三つの尺度</em>で見る。", "用<em>三种尺度</em>，<br>看日本。", "Japan, at<br><em>three scales</em>."),
    "cover.lede": ("引いて見る地震、寄って見る犯罪、通して見る内閣。同じ国土を、別々の時間で測る。",
                   "拉远看地震，凑近看犯罪，拉长看内阁。同一片国土，三种时间。",
                   "Pull back for earthquakes, zoom in for crime, stretch out for cabinets. One land, three kinds of time."),
    "cover.cta": ("三つの章へ", "进入三个章节", "Enter the chapters"),
    "cover.method": ("方法と出典", "方法与来源", "Method & sources"),
    "cover.section.eyebrow": ("THREE SCALES / 三つの章", "THREE SCALES / 三个章节", "THREE SCALES / THREE CHAPTERS"),
    "cover.section.h": ("同じ国土を、三つの時間で。", "同一片国土，三种时间。", "One land, three kinds of time."),
    "cover.section.sub": ("数字はすべて一次資料から静的に生成。年を切り、町丁に寄り、内閣を並べる。",
                          "所有数字由一次资料静态生成。切年、入町丁、排内阁。",
                          "Every number is statically generated from primary sources. Cut by year, zoom into districts, line up cabinets."),
    "ui.theme.sage": ("Sage", "浅色", "Sage"),
    "ui.theme.dark": ("Dark", "深色", "Dark"),
    "prod.open": ("開く", "打开", "Open"),
    "cover.scale.quake": ("列島 · 27年", "列岛 · 27年", "Archipelago · 27 yrs"),
    "cover.scale.crime": ("東京 · 62区市町村", "东京 · 62区市町村", "Tokyo · 62 wards"),
    "cover.scale.cabinet": ("内閣 · 14", "内阁 · 14", "Cabinets · 14"),
    "card.quake.unit": ("M4+ 震源 / 27年", "M4+ 震源 / 27年", "M4+ events / 27 yrs"),
    "card.quake.title": ("引いて見る", "拉远看", "Pull back"),
    "card.quake.claim": ("2011年は回数で14.6%、エネルギーで86.7%。",
                         "2011年按次数占14.6%，按能量占86.7%。",
                         "In 2011: 14.6% of events, 86.7% of energy."),
    "card.crime.unit": ("町丁 / 1年", "町丁 / 1年", "Neighbourhoods / 1 yr"),
    "card.crime.title": ("寄って見る", "凑近看", "Zoom in"),
    "card.crime.claim": ("5,234の町丁。中央値4.4‰、最大1,332‰。",
                         "5,234个町丁。中位数4.4‰，最高1,332‰。",
                         "5,234 neighbourhoods. Median 4.4‰, max 1,332‰."),
    "card.cabinet.unit": ("内閣 / 28年", "内阁 / 28年", "Cabinets / 28 yrs"),
    "card.cabinet.title": ("通して見る", "拉长看", "Stretch out"),
    "card.cabinet.claim": ("14内閣、331か月。最大の月変動は+20.5。",
                           "14届内阁、331个月。最大单月变动+20.5。",
                           "14 cabinets, 331 months. Largest monthly swing +20.5."),

    "q.eyebrow": ("01 / 引いて見る", "01 / 拉远看", "01 / Pull back"),
    "q.h1": ("地震 — <em>40,079</em>の震源", "地震 — <em>40,079</em>个震源", "Earthquakes — <em>40,079</em> hypocentres"),
    "q.lede": ("2000年から2026年7月まで、M4以上の震源を一点ずつ。年を切ると、同じ海が別の顔になる。",
               "2000年至2026年7月，M4以上震源逐点记录。按年切开，同一片海换了面孔。",
               "Every M4+ hypocentre from 2000 to July 2026, one point at a time. Cut by year, the same sea changes face."),
    "q.stat.count": ("震源数", "震源数", "Hypocentres"),
    "q.stat.strong": ("M6以上", "M6以上", "M6+"),
    "q.stat.max": ("最大", "最大", "Largest"),
    "q.stat.energy": ("2011年のエネルギー", "2011年能量占比", "2011 energy share"),
    "q.beat1.t": ("回数より、エネルギー", "比起次数，更看能量", "Energy, not counts"),
    "q.beat1.p": ("2011年は件数で14.6%、エネルギーでは86.7%。同じ年でも、数える尺度を変えると景色が変わる。",
                  "2011年按件数占14.6%，按能量占86.7%。同一年，换一种计量，风景就变了。",
                  "2011 holds 14.6% of events and 86.7% of energy. Change the measure and the picture changes."),
    "q.beat2.t": ("深さは、色", "深度即颜色", "Depth is colour"),
    "q.beat2.p": ("七段の深さ階調。赤い点ほど浅く、海溝の形が浮かぶ。",
                  "七级深度色阶。越红越浅，海沟的形状浮出来。",
                  "A seven-stop depth ramp. Redder is shallower; the trench surfaces as a shape."),
    "q.beat3.t": ("起動すると、地球儀", "启动后，是地球仪", "Launch the globe"),
    "q.beat3.p": ("静止画の上で「起動」を押すと、WebGLの地球が読み込まれる。回して、拡大して、年を切る。",
                  "在静态图上点「启动」，加载 WebGL 地球。旋转、放大、按年切片。",
                  "Press launch on the still image to load the WebGL globe. Rotate, zoom, slice by year."),
    "q.index.title": ("27年を、一年ずつ", "27年，一年一页", "Twenty-seven years, one by one"),
    "q.index.sub": ("各年の震源数・最大マグニチュード・月別分布・主な地震。",
                    "每年的震源数、最大震级、月度分布与主要地震。",
                    "Counts, largest magnitude, monthly distribution and notable events."),

    "c.eyebrow": ("02 / 寄って見る", "02 / 凑近看", "02 / Zoom in"),
    "c.h1": ("犯罪 — <em>5,234</em>の町丁", "犯罪 — <em>5,234</em>个町丁", "Crime — <em>5,234</em> neighbourhoods"),
    "c.lede": ("2025年の警視庁認知件数。東京都内の町丁を、人口あたりの率で並べる。",
               "2025年警视厅认知件数。把东京都内的町丁按人均率排列。",
               "Tokyo Metropolitan Police recorded incidents for 2025, ranked per capita across neighbourhoods."),
    "c.stat.total": ("認知件数", "认知件数", "Incidents"),
    "c.stat.wards": ("区市町村", "区市町村", "Wards"),
    "c.stat.median": ("中央値", "中位数", "Median"),
    "c.stat.max": ("最大", "最高", "Maximum"),
    "c.beat1.t": ("率で見る", "按率来看", "Read the rate"),
    "c.beat1.p": ("件数は人口に比例する。人口1,000人あたりに直すと、町丁の性格が見える。",
                  "件数随人口走。换算成每千人，町丁的性格才显出来。",
                  "Counts follow population. Per thousand people, neighbourhood character appears."),
    "c.beat2.t": ("小さい分母", "小分母", "Small denominators"),
    "c.beat2.p": ("人口200人未満の町丁は率が暴れる。地図では薄く扱い、表では件数も併記する。",
                  "人口不足200人的町丁，率会失控。地图上淡化处理，表里同时列件数。",
                  "Below 200 residents the rate explodes. Those are dimmed on the map; the table keeps counts alongside."),
    "c.beat3.t": ("起動すると、街区", "启动后，是街区", "Launch the blocks"),
    "c.beat3.p": ("Leafletの地図で、町丁の境界と件数を重ねる。検索も効く。",
                  "用 Leaflet 地图叠加町丁边界与件数，可搜索。",
                  "A Leaflet map with neighbourhood boundaries and counts, searchable."),
    "c.index.title": ("62の区市町村", "62个区市町村", "Sixty-two wards"),
    "c.index.sub": ("人口・件数・率・町丁別の上位。", "人口、件数、率与町丁排行。",
                    "Population, counts, rate and top neighbourhoods."),

    "b.eyebrow": ("03 / 通して見る", "03 / 拉长看", "03 / Stretch out"),
    "b.h1": ("内閣 — <em>331</em>か月", "内阁 — <em>331</em>个月", "Cabinet — <em>331</em> months"),
    "b.lede": ("1998年から2026年まで、月ごとの支持率。内閣をまたいで、一本の線にする。",
               "1998年至2026年，逐月支持率。跨过内阁，连成一条线。",
               "Monthly approval from 1998 to 2026, joined across cabinets into one line."),
    "b.stat.polls": ("調査", "调查", "Polls"),
    "b.stat.months": ("月", "月", "Months"),
    "b.stat.cabinets": ("内閣", "内阁", "Cabinets"),
    "b.stat.swing": ("最大月変動", "最大单月变动", "Largest swing"),
    "b.beat1.t": ("月に一度の点", "每月一点", "One point a month"),
    "b.beat1.p": ("同じ月に複数の調査があれば、平均する。線は途切れない。",
                  "同月有多项调查就取平均。线不断。",
                  "Several polls in a month are averaged. The line never breaks."),
    "b.beat2.t": ("内閣の切れ目", "内阁的接缝", "Cabinet seams"),
    "b.beat2.p": ("一本の線に、14の内閣が連なる。切れ目は、支持率の跳び。",
                  "一条线串起14届内阁。接缝处，是支持率的跳变。",
                  "One line, fourteen cabinets. The seams are the jumps."),
    "b.beat3.t": ("起動すると、年表", "启动后，是年表", "Launch the timeline"),
    "b.beat3.p": ("内閣を選ぶと、その月だけを拡大する。",
                  "选一届内阁，就放大那一段。",
                  "Pick a cabinet and the chart expands to its months."),
    "b.index.title": ("14の内閣", "14届内阁", "Fourteen cabinets"),
    "b.index.sub": ("在任期間・平均・最高・最低。", "任期、平均、最高、最低。",
                    "Term, mean, high and low."),

    "d.year.months": ("月別の震源数", "月度震源数", "Events by month"),
    "d.year.top": ("主な地震", "主要地震", "Notable events"),
    "d.year.energy": ("エネルギー", "能量", "Energy"),
    "d.year.share": ("年間シェア", "年度占比", "Share of all"),
    "d.year.note": ("USGS ComCat、M4以上、日本周辺。2026年は7月15日まで。",
                    "USGS ComCat，M4以上，日本周边。2026年截至7月15日。",
                    "USGS ComCat, M4+, Japan region. 2026 through 15 July."),
    "d.col.date": ("日付", "日期", "Date"),
    "d.col.place": ("場所", "地点", "Place"),
    "d.col.mag": ("M", "M", "M"),
    "d.col.depth": ("深さ", "深度", "Depth"),

    "d.ward.map": ("町丁別の犯罪率", "町丁犯罪率", "Rate by neighbourhood"),
    "d.ward.top": ("件数の多い町丁", "件数最多的町丁", "Neighbourhoods by count"),
    "d.ward.rank": ("62区市町村中", "62区市町村中", "of 62 wards"),
    "d.ward.r8": ("2026年累計", "2026年累计", "2026 cumulative"),
    "d.ward.note": ("人口200人未満は率を出さず、地図では灰色。件数は令和7年（2025）年計。",
                    "人口不足200人不计率，地图上为灰色。件数为令和7年（2025）全年。",
                    "Rates omitted below 200 residents (grey on map). Counts are full-year 2025."),
    "d.col.name": ("町丁", "町丁", "Neighbourhood"),
    "d.col.count": ("件数", "件数", "Count"),
    "d.col.pop": ("人口", "人口", "Population"),
    "d.col.rate": ("率 ‰", "率 ‰", "Rate ‰"),

    "d.pm.series": ("月次支持率", "月度支持率", "Monthly approval"),
    "d.pm.high": ("高かった月", "最高月份", "Highest months"),
    "d.pm.low": ("低かった月", "最低月份", "Lowest months"),
    "d.pm.term": ("在任", "任期", "Term"),
    "d.pm.mean": ("平均", "平均", "Mean"),
    "d.pm.max": ("最高", "最高", "High"),
    "d.pm.min": ("最低", "最低", "Low"),
    "d.pm.months": ("月数", "月数", "Months"),
    "d.pm.note": ("月内の全調査の算術平均。実測月のみを結ぶ。",
                  "月内全部调查的算术平均，只连实测月。",
                  "Arithmetic mean of all polls in the month; only measured months are joined."),

    "m.h1": ("方法と出典", "方法与出处", "Method and sources"),
    "m.lede": ("数字は、どう数えたかで意味が変わる。ここに口径を全部書く。",
               "数字的意义取决于怎么数。这里把口径全部写下。",
               "Numbers change meaning with the counting rule. Every rule is written here."),
    "m.data.h": ("データ", "数据", "Data"),
    "m.q.h": ("地震", "地震", "Earthquakes"),
    "m.q.p": ("USGS ANSS Comprehensive Catalog（ComCat）から、2000年1月1日—2026年7月15日、日本周辺（東経122–150度、北緯20–50度）、M4.0以上の震源40,079点。",
              "取自 USGS ANSS Comprehensive Catalog（ComCat），2000年1月1日—2026年7月15日，日本周边（东经122–150度、北纬20–50度），M4.0以上震源40,079点。",
              "USGS ANSS Comprehensive Catalog (ComCat), 1 Jan 2000 – 15 Jul 2026, Japan region (122–150°E, 20–50°N), M4.0+, 40,079 hypocentres."),
    "m.c.h": ("犯罪", "犯罪", "Crime"),
    "m.c.p": ("警視庁「区市町村の町丁別、罪種別及び手口別認知件数」令和7年（2025）年計、および令和8年月次累計。人口は住民基本台帳（令和8年1月1日）。東京都内5,234町丁、62区市町村。",
              "警视厅《区市町村町丁别、罪种别及手口别认知件数》令和7年（2025）全年及令和8年月度累计。人口取自住民基本台帐（令和8年1月1日）。东京都内5,234个町丁、62个区市町村。",
              "Tokyo Metropolitan Police, incidents by neighbourhood and offence type, full-year 2025 plus 2026 monthly cumulative. Population from the Basic Resident Register (1 Jan 2026). 5,234 neighbourhoods, 62 wards."),
    "m.b.h": ("内閣", "内阁", "Cabinet"),
    "m.b.p": ("NHK放送文化研究所の月例政治意識調査（2000–2017）、NHK選挙WEB（2018–2026）、日経・朝日・時事・読売・JNN・共同の各社世論調査。644点、331か月、14内閣。",
              "NHK放送文化研究所月度政治意识调查（2000–2017）、NHK选举WEB（2018–2026），以及日经、朝日、时事、读卖、JNN、共同各社舆论调查。644点、331个月、14届内阁。",
              "NHK Broadcasting Culture Research Institute monthly surveys (2000–2017), NHK election web (2018–2026), plus Nikkei, Asahi, Jiji, Yomiuri, JNN and Kyodo polls. 644 polls, 331 months, 14 cabinets."),
    "m.cal.h": ("口径", "口径", "Definitions"),
    "m.cal.q": ("エネルギーは log₁₀E = 1.5M + 4.8（ジュール）。年の合計は単純和。",
                "能量按 log₁₀E = 1.5M + 4.8（焦耳）。年度合计为简单相加。",
                "Energy from log₁₀E = 1.5M + 4.8 (joules). Year totals are simple sums."),
    "m.cal.c": ("犯罪率は 件数 ÷ 人口 × 1,000。人口200人未満の町丁は率を出さず、地図では薄く表示する。",
                "犯罪率 = 件数 ÷ 人口 × 1,000。人口不足200人的町丁不计率，地图上淡化显示。",
                "Rate = incidents ÷ population × 1,000. Neighbourhoods under 200 residents get no rate and are dimmed on the map."),
    "m.cal.b": ("支持率は月内の全調査の算術平均。同じ月に複数の調査があれば全部入れる。線は実測月だけを結び、補間しない。",
                "支持率为月内全部调查的算术平均。同月多项调查全部计入。线只连实测月，不做插值。",
                "Approval is the arithmetic mean of every poll in the month. All polls count. The line joins measured months only; no interpolation."),
    "m.err.h": ("既知の誤差", "已知误差", "Known error"),
    "m.err.1": ("NHKの2008年・2009年は、年度表の「9月」と「9月(緊)」を取り違え、10–12月が一つ右へずれていた。8行を削除し、10行を補って修正した（v8.3）。",
                "NHK 2008、2009年度的「9月」与「9月(緊)」两列被错取，10–12月整体右移一格。已删8行、补10行修正（v8.3）。",
                "For NHK 2008 and 2009 the annual table's September and September (emergency) columns were swapped, shifting October–December one column right. Fixed by dropping 8 rows and adding 10 (v8.3)."),
    "m.err.2": ("日経の同月二値は重複ではなく、「定例」と「緊急」の別調査。両方を残した。",
                "日经同月两个数值不是重复，而是「定例」与「紧急」两场不同调查。两条都保留。",
                "The two Nikkei values in one month are separate regular and emergency surveys, not duplicates. Both are kept."),
    "m.err.3": ("2011年3月のNHKは原表が「-」。時事の18.9のみ。",
                "2011年3月NHK原表为「-」，仅有时事18.9。",
                "NHK has no value for March 2011 in the source table; only Jiji (18.9)."),
    "m.err.4": ("単一ソースの月が{{B}}月中{{S}}。", "{{B}}个月中有{{S}}个只有单一来源。",
                "{{S}} of {{B}} cabinet-months rest on a single source."),
    "m.err.5": ("地震カタログの検知能力は時代で変わる。2000年代初頭は小さい地震の取りこぼしがある。",
                "地震目录的检测能力随年代变化。2000年代初期会漏掉小震。",
                "Catalogue completeness varies by era; small events are under-recorded in the early 2000s."),
    "m.err.6": ("犯罪の「g」列は表示に使っていない。K=2000の縮小（経験ベイズ）は行っていない。",
                "犯罪的「g」列未用于显示，也未做 K=2000 的经验贝叶斯收缩。",
                "The crime `g` field is unused, and no empirical-Bayes shrinkage (K=2000) is applied."),
    "m.upd.h": ("更新", "更新", "Updates"),
    "m.upd.p": ("HTMLはビルド時に事前生成。データを更新したら再ビルドする。",
                "HTML 在构建时预生成。数据更新后重新构建。",
                "HTML is pre-rendered at build time. Update the data, then rebuild."),
    "m.dl.h": ("ダウンロード", "下载", "Download"),
    "m.dl.p": ("同じ数値をCSVで。", "同样的数值，CSV 格式。", "The same numbers as CSV."),
    "m.lic.h": ("ライセンス", "许可", "Licence"),
    "m.lic.p": ("データは各出典のライセンスに従う。本站の文と図は CC BY 4.0。",
                "数据遵循各来源的许可。本站文字与图表为 CC BY 4.0。",
                "Data follows each source's licence. Text and figures here are CC BY 4.0."),
    "m.src.h": ("出典", "来源", "Sources"),

    "nf.code": ("404", "404", "404"),
    "nf.h1": ("この頁は、ない。", "这一页不存在。", "This page is not here."),
    "nf.p": ("URLが変わったか、まだ作っていない頁。三つの章から辿り直せる。",
             "网址变了，或这一页还没做。可以从三个章节重新找。",
             "The URL changed, or the page was never built. Start again from the three chapters."),
    "nf.home": ("表紙へ戻る", "回到封面", "Back to the cover"),

    "foot.tag": ("引いて見る・寄って見る・通して見る",
                 "拉远看 · 凑近看 · 拉长看",
                 "Pull back · zoom in · stretch out"),
    "foot.method": ("方法と出典", "方法与出处", "Method & sources"),
    "foot.built": ("静的生成", "静态生成", "Statically generated"),
}


def ja(key):
    return COPY[key][0]


def tattr(key):
    return f' data-t="{key}"'


PAGES = []
CSS_VER = "__CSS_VER__"
JS_VER = "__JS_VER__"
FONT_VER = "__FONT_VER__"


def head(title, desc, path, jsonld=None, extra_head=""):
    u = SITE_URL + path
    alts = "".join(
        f'<link rel="alternate" hreflang="{code}" href="{u}{"" if code == "ja" else "?lang=" + code}">'
        for code in ("ja", "zh", "en"))
    alts += f'<link rel="alternate" hreflang="x-default" href="{u}">'
    ld = ""
    if jsonld:
        ld = '<script type="application/ld+json">' + json.dumps(jsonld, ensure_ascii=False) + "</script>"
    boot = ("<script>try{var d=document.documentElement;d.classList.add('js');"
            "var t=null;try{t=localStorage.getItem('pj-theme')}catch(e){}"
            "if(t!=='sage'&&t!=='dark'){var h=new Date().getHours();t=(h>=6&&h<18)?'sage':'dark';}"
            "d.dataset.theme=t;"
            "var l=localStorage.getItem('pj-lang');if(l)d.lang=l;"
            "}catch(e){}</script>")
    return f"""<!doctype html>
<html lang="ja" data-theme="sage">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{u}">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{u}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#E9EDE3">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/noto-serif-jp-700.woff2?v=__FONT_VER__" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/outfit-800.woff2?v=__FONT_VER__" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/app.css?v=__CSS_VER__">
{boot}
{ld}
{extra_head}
</head>
<body>
<a class="skip" href="#main"{tattr('skip')}>{ja('skip')}</a>
<div class="grain" aria-hidden="true"></div>
<div class="scroll-progress" aria-hidden="true"></div>
"""


THEME_DOTS = """<div class="theme-switcher" role="group" aria-label="Theme">
<button class="theme-dot" type="button" data-theme-set="sage" aria-pressed="true" aria-label="Sage" title="Sage" style="--td-bg:#E9EDE3;--td-accent:#2F6B4F"><span class="td-dot"><span class="td-core"></span></span></button>
<button class="theme-dot" type="button" data-theme-set="dark" aria-pressed="false" aria-label="Dark" title="Dark" style="--td-bg:#0E0E0C;--td-accent:#FF6A3D"><span class="td-dot"><span class="td-core"></span></span></button>
</div>"""

LANG_NAV = """<div class="lang-nav" role="group" aria-label="Language">
<button type="button" data-lang="en" aria-pressed="false">EN</button><span class="lang-sep">·</span><button type="button" data-lang="ja" aria-pressed="true">日本語</button><span class="lang-sep">·</span><button type="button" data-lang="zh" aria-pressed="false">中文</button>
</div>"""


def mast(active=""):
    def link(href, key, ch):
        cur = ' aria-current="page"' if ch == active else ""
        return f'<a href="{href}"{cur}{tattr(key)}>{ja(key)}</a>'

    return f"""<header class="masthead"><div class="wrap masthead-in">
<a class="wordmark" href="/" aria-label="{BRAND}">{WM}</a>
<nav class="chapters" aria-label="Chapters">
{link('/quake/', 'nav.quake', 'quake')}
{link('/crime/', 'nav.crime', 'crime')}
{link('/cabinet/', 'nav.cabinet', 'cabinet')}
{link('/method/', 'nav.method', 'method')}
</nav>
<div class="tools">
{THEME_DOTS}
{LANG_NAV}
<button class="burger" type="button" data-burger aria-expanded="false" aria-controls="mobile-menu" aria-label="Menu"><span></span><span></span></button>
</div>
</div></header>
<div class="mobile-menu" id="mobile-menu">
<nav class="mobile-nav-links" aria-label="Chapters">
{link('/quake/', 'nav.quake', 'quake')}
{link('/crime/', 'nav.crime', 'crime')}
{link('/cabinet/', 'nav.cabinet', 'cabinet')}
{link('/method/', 'nav.method', 'method')}
</nav>
<div class="mobile-foot">
{LANG_NAV}
{THEME_DOTS}
</div>
</div>
"""


def foot():
    return f"""<footer class="foot"><div class="wrap foot-in">
<div class="foot-top">
<a class="wordmark" href="/" aria-label="{BRAND}">{WM}</a>
<a href="/method/"{tattr('foot.method')}>{ja('foot.method')}</a>
</div>
<div class="foot-products">
<a href="/quake/"{tattr('nav.quake')}>{ja('nav.quake')}</a>
<a href="/crime/"{tattr('nav.crime')}>{ja('nav.crime')}</a>
<a href="/cabinet/"{tattr('nav.cabinet')}>{ja('nav.cabinet')}</a>
<a href="/method/"{tattr('nav.method')}>{ja('nav.method')}</a>
</div>
<div class="foot-bottom">
<span>{BRAND} — <span{tattr('foot.tag')}>{ja('foot.tag')}</span></span>
<span><a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a> · <span{tattr('foot.built')}>{ja('foot.built')}</span> · {BUILD_DATE}</span>
</div>
</div></footer>
<script src="/assets/shell.js?v=__JS_VER__" defer></script>
</body></html>"""


def page(path, title, desc, body, active="", jsonld=None, register=True, head_extra=""):
    body = body.replace('<table class="data-table">', '<div class="table-scroll"><table class="data-table">')
    body = body.replace('</table>', '</table></div>')
    html_doc = head(title, desc, path, jsonld, head_extra) + mast(active) + body + foot()
    if register:
        PAGES.append((path, title, desc))
    return html_doc


def stats(items):
    out = ['<dl class="stats rv">']
    for label_key, value, unit in items:
        u = f"<small>{esc(unit)}</small>" if unit else ""
        out.append(f'<div><dt{tattr(label_key)}>{ja(label_key)}</dt>'
                   f'<dd>{value}{u}</dd></div>')
    out.append("</dl>")
    return "".join(out)


def pager(prev_href, prev_label, next_href, next_label):
    a = f'<a href="{prev_href}">← {esc(prev_label)}</a>' if prev_href else "<span></span>"
    b = f'<a href="{next_href}">{esc(next_label)} →</a>' if next_href else "<span></span>"
    return f'<nav class="pager">{a}<span class="spacer"></span>{b}</nav>'


# ---------------------------------------------------------------- pages
def build_cover():
    sp_rows = []
    qvals = [len(QY[y]) / max(len(v) for v in QY.values()) for y in YEARS]
    sp_rows.append(("cover.scale.quake", qvals, f"{n(len(Q))}", "quake"))
    cvals = [(WARD_RATE[m["ward"]] or 0) / max(r for r in WARD_RATE.values() if r) for m in MUNI]
    sp_rows.append(("cover.scale.crime", cvals, n(CHOME_COUNT), "crime"))
    bvals = [sum(v for _, v in CAB_MONTHS[c["pm"]]) / max(1, len(CAB_MONTHS[c["pm"]])) / 100
             for c in CAB["cabinets"]]
    sp_rows.append(("cover.scale.cabinet", bvals, n(len(CAB["cabinets"])), "cabinet"))
    spine = "".join(
        f'<div class="spine-row"><span class="spine-lbl"{tattr(k)}>{ja(k)}</span>'
        f'<span class="spine-bars" aria-hidden="true">'
        + "".join(f'<i style="--v:{v:.3f}"></i>' for v in vals)
        + f'</span><span class="spine-val">{val}</span></div>'
        for k, vals, val, _ in sp_rows)

    rows = [
        ("01", "/quake/", "QUAKE", "40,079", "card.quake.unit", "card.quake.title",
         "card.quake.claim", "USGS ComCat · 2000—2026.07", quake_thumb()),
        ("02", "/crime/", "CRIME", "5,234", "card.crime.unit", "card.crime.title",
         "card.crime.claim", "警視庁 · 2025", crime_thumb()),
        ("03", "/cabinet/", "CABINET", "331", "card.cabinet.unit", "card.cabinet.title",
         "card.cabinet.claim", "NHK / 日経 / 共同 · 1998—2026", cabinet_thumb()),
    ]
    prod_rows = "".join(
        f"""<a class="prod-row rv" href="{href}">
<div class="prod-num">{num}</div>
<div class="prod-body">
<div class="prod-main">
<h2 class="prod-name"{tattr(tk)}>{ja(tk)}</h2>
<p class="prod-domain"><span class="prod-count">{count}</span><span{tattr(uk)}>{ja(uk)}</span></p>
<p class="prod-tagline"{tattr(ck)}>{ja(ck)}</p>
<p class="prod-note">{note}</p>
</div>
<div class="prod-meta">
<span class="prod-kw">{kw}</span>
<span class="prod-status live"><span class="status-dot"></span>LIVE DATA</span>
<span class="prod-action"><span{tattr('prod.open')}>{ja('prod.open')}</span> ↗</span>
</div>
</div>
<div class="prod-visual">{thumb}</div>
</a>"""
        for num, href, kw, count, uk, tk, ck, note, thumb in rows)

    body = f"""<main id="main">
<section class="wrap cover">
<div class="hero-grid">
<div class="hero-content">
<p class="eyebrow rv"{tattr('cover.kicker')}>{ja('cover.kicker')}</p>
<h1 class="rv"{tattr('cover.title')}>{ja('cover.title')}</h1>
<p class="lede rv"{tattr('cover.lede')}>{ja('cover.lede')}</p>
<div class="hero-actions rv">
<a class="btn-primary" href="#chapters"><span{tattr('cover.cta')}>{ja('cover.cta')}</span> ↓</a>
<a class="btn-secondary" href="/method/"><span{tattr('cover.method')}>{ja('cover.method')}</span> ↗</a>
</div>
</div>
<aside class="hero-panel rv" aria-label="Three scales">
<div class="panel-head"><span>FIG. 01</span><span>THREE SCALES</span></div>
<div class="spine">{spine}</div>
<p class="panel-cap">2000—2026 · 40,079 / 5,234 / 331</p>
</aside>
</div>
<div class="hero-wordmark-bottom rv" aria-hidden="true">
<div class="datum-rail datum-rail-top"><span>{BRAND.upper()}</span><span>2000—2026</span><span>THREE SCALES</span></div>
<div class="hero-wordmark-text">{WM}</div>
<div class="datum-rail datum-rail-bottom"><span>35.68°N 139.69°E</span><span>QUAKE / CRIME / CABINET</span><span>JAPAN</span></div>
</div>
</section>
<section class="wrap products-sec" id="chapters">
<div class="section-label">
<p class="eyebrow"{tattr('cover.section.eyebrow')}>{ja('cover.section.eyebrow')}</p>
<h2 class="section-title"{tattr('cover.section.h')}>{ja('cover.section.h')}</h2>
<p class="section-sub"{tattr('cover.section.sub')}>{ja('cover.section.sub')}</p>
</div>
<div class="prod-table">{prod_rows}</div>
</section>
</main>"""
    jsonld = {
        "@context": "https://schema.org", "@type": "WebSite",
        "name": BRAND, "url": SITE_URL + "/",
        "inLanguage": ["ja", "zh", "en"],
        "description": "地震・犯罪・内閣支持率を三つの尺度で見る、静的に生成されたデータサイト。",
    }
    return page("/", f"{BRAND} — 日本を、三つの尺度で見る",
                "40,079の震源、5,234の町丁、331か月の内閣支持率。同じ国土を、引いて・寄って・通して見る。",
                body, "", jsonld)


def build_home_preview():
    """Local-only home prototype: three direct entry panels, one click each."""
    css = (SRC / "home-preview.css").read_text(encoding="utf-8")

    rows = [
        ("quake", "01", "/quake/", "card.quake.title", "nav.quake", "40,079",
         "card.quake.unit", "card.quake.claim", "USGS ComCat · 2000—2026.07",
         HP.quake_svg(Q, OUTLINE, YEARS)),
        ("crime", "02", "/crime/", "card.crime.title", "nav.crime", "5,234",
         "card.crime.unit", "card.crime.claim", "警視庁 · 2025",
         HP.crime_svg(POINTS, MUNI_POLY, WARD_RATE)),
        ("cabinet", "03", "/cabinet/", "card.cabinet.title", "nav.cabinet", "331",
         "card.cabinet.unit", "card.cabinet.claim", "NHK / Nikkei / Kyodo · 1998—2026",
         HP.cabinet_svg(ALL_MONTHS, MONTH_MEAN, CAB)),
    ]

    entries = []
    for key, num, href, verb, topic, count, unit, claim, source, svg in rows:
        entries.append(f"""<a class="hp-entry" href="{href}">
<div class="hp-entry-head"><span class="hp-num">{num}</span><span class="hp-verb" data-t="{verb}">{ja(verb)}</span><span class="hp-topic" data-t="{topic}">{ja(topic)}</span></div>
<div class="hp-entry-visual" aria-hidden="true">{svg}</div>
<div class="hp-entry-body">
<p class="hp-count"><b>{count}</b><small data-t="{unit}">{ja(unit)}</small></p>
<p class="hp-claim" data-t="{claim}">{ja(claim)}</p>
<div class="hp-entry-foot"><span class="hp-source">{source}</span><span class="hp-enter"><span data-t="prod.open">{ja('prod.open')}</span> ↗</span></div>
</div>
</a>""")

    body = f"""<main id="main" class="hp">
<section class="wrap hp-intro">
<p class="eyebrow" data-t="cover.kicker">{ja('cover.kicker')}</p>
<div class="hp-intro-row">
<h1 data-t="cover.title">{ja('cover.title')}</h1>
<p class="hp-lede" data-t="cover.lede">{ja('cover.lede')}</p>
</div>
</section>
<section class="wrap hp-band" aria-label="Three scales">
{''.join(entries)}
</section>
<section class="wrap hp-method">
<p class="hp-method-k">METHOD / SOURCES</p>
<p class="hp-method-p" data-t="cover.section.sub">{ja('cover.section.sub')}</p>
<a class="hp-method-link" href="/method/"><span data-t="cover.method">{ja('cover.method')}</span> ↗</a>
</section>
</main>"""

    return page("/preview/", f"{BRAND} — 三つの尺度（preview）",
                "Three direct entries: earthquakes, crime, cabinets.",
                body, "", None, register=False,
                head_extra='<meta name="robots" content="noindex">\n<style>\n' + css + '\n</style>')


def build_quake():
    m6 = sum(1 for x in Q if x["mag"] >= 6)
    mx = max(Q, key=lambda x: x["mag"])
    e2011 = YEAR_E["2011"] / TOTAL_E
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <span{tattr('q.eyebrow')}>{ja('q.eyebrow')}</span></p>
<h1{tattr('q.h1')}>{ja('q.h1')}</h1>
<p class="lede"{tattr('q.lede')}>{ja('q.lede')}</p>
{stats([('q.stat.count', n(len(Q)), ''), ('q.stat.strong', n(m6), ''),
            ('q.stat.max', 'M' + f"{mx['mag']:.1f}", ''), ('q.stat.energy', pct(e2011) + '%', '')])}
</section>
<section class="wrap rv">
<div class="stage" data-live="0" data-view="quake">
<div class="stage-poster">{quake_poster()}</div>
<p class="stage-caption">M4+ · {n(len(Q))} hypocentres · 2000–2026.07 · USGS ComCat</p>
<button class="launch" data-launch="quake"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg><span{tattr('ui.launch')}>{ja('ui.launch')}</span></button>
<div class="stage-live" id="v-quake-viewport"></div>
</div>
</section>
<section class="wrap beats rv">
<div class="beat"><div class="n">01</div><h3{tattr('q.beat1.t')}>{ja('q.beat1.t')}</h3><p{tattr('q.beat1.p')}>{ja('q.beat1.p')}</p></div>
<div class="beat"><div class="n">02</div><h3{tattr('q.beat2.t')}>{ja('q.beat2.t')}</h3><p{tattr('q.beat2.p')}>{ja('q.beat2.p')}</p></div>
<div class="beat"><div class="n">03</div><h3{tattr('q.beat3.t')}>{ja('q.beat3.t')}</h3><p{tattr('q.beat3.p')}>{ja('q.beat3.p')}</p></div>
</section>
<section class="wrap rv">
<h2 class="section-title"{tattr('q.index.title')}>{ja('q.index.title')}</h2>
<p class="section-sub"{tattr('q.index.sub')}>{ja('q.index.sub')}</p>
<div class="year-index">""" + "".join(
        f'<a href="/quake/{y}/">{y}<span>{n(len(QY[y]))}</span></a>' for y in YEARS
    ) + f"""</div>
</section>
</main>"""
    jsonld = {
        "@context": "https://schema.org", "@type": "Dataset",
        "name": "Japan M4+ hypocentres 2000–2026",
        "description": "USGS ComCat hypocentres M4.0+ in the Japan region.",
        "temporalCoverage": "2000-01-01/2026-07-15",
        "spatialCoverage": "Japan region (122–150E, 20–50N)",
        "license": "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
        "creator": {"@type": "Organization", "name": "USGS"},
        "url": SITE_URL + "/quake/",
    }
    return page("/quake/", f"地震 — 40,079の震源 | {BRAND}",
                "2000年から2026年7月までのM4以上震源40,079点。年別・月別・深さ・エネルギーで見る。",
                body, "quake", jsonld)


def build_year(y):
    ys = QY[y]
    cnt = len(ys)
    m6 = sum(1 for x in ys if x["mag"] >= 6)
    mx = max(ys, key=lambda x: x["mag"])
    e = YEAR_E[y]
    share = e / TOTAL_E
    months = [sum(1 for x in ys if x["time"][5:7] == f"{m:02d}") for m in range(1, 13)]
    top = sorted(ys, key=lambda x: (x["mag"], x["time"]))[-10:][::-1]
    rows = "".join(
        f'<tr><td class="date">{esc(x["time"][:10])}</td><td>{esc(x["place"])}</td>'
        f'<td class="num">{x["mag"]:.1f}</td><td class="num">{x["depthKm"]:.0f} km</td></tr>'
        for x in top)
    idx = YEARS.index(y)
    prev_y = YEARS[idx - 1] if idx else None
    next_y = YEARS[idx + 1] if idx + 1 < len(YEARS) else None
    lede = (f"{y}年は{n(cnt)}点。全記録の{pct(cnt / len(Q))}%、"
            f"エネルギーでは{pct(share)}%。最大はM{mx['mag']:.1f}。")
    if y == "2026":
        lede += "2026年は7月15日までの集計。"
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <a href="/quake/"{tattr('nav.quake')}>{ja('nav.quake')}</a> / {y}</p>
<h1>{y}<span class="h1-sub">年</span></h1>
<p class="lede">{esc(lede)}</p>
{stats([('q.stat.count', n(cnt), ''), ('q.stat.strong', n(m6), ''),
            ('q.stat.max', 'M' + f"{mx['mag']:.1f}", ''), ('d.year.energy', jfmt(e) + ' J', '')])}
</section>
<section class="wrap rv">
<figure class="figure">
{bar_svg(months, [str(m) for m in range(1, 13)], highlight=int(mx["time"][5:7]) - 1 if mx["time"][:4] == y else None)}
<figcaption><span{tattr('d.year.months')}>{ja('d.year.months')}</span> · {y} · USGS</figcaption>
</figure>
<h2 class="section-title"{tattr('d.year.top')}>{ja('d.year.top')}</h2>
<table class="data-table">
<thead><tr><th{tattr('d.col.date')}>{ja('d.col.date')}</th><th{tattr('d.col.place')}>{ja('d.col.place')}</th><th class="num"{tattr('d.col.mag')}>{ja('d.col.mag')}</th><th class="num"{tattr('d.col.depth')}>{ja('d.col.depth')}</th></tr></thead>
<tbody>{rows}</tbody></table>
<p class="section-sub" style="margin-top:18px"{tattr('d.year.note')}>{ja('d.year.note')}</p>
{pager(f"/quake/{prev_y}/" if prev_y else "", f"{prev_y}年" if prev_y else "",
           f"/quake/{next_y}/" if next_y else "", f"{next_y}年" if next_y else "")}
</section>
</main>"""
    return page(f"/quake/{y}/", f"{y}年の地震 — {n(cnt)}点 | {BRAND}",
                f"{y}年のM4以上震源{n(cnt)}点、最大M{mx['mag']:.1f}。月別分布と主な地震。",
                body, "quake")


def build_crime():
    rates = [r for r in WARD_RATE.values() if r]
    rates_sorted = sorted(rates)
    med = rates_sorted[len(rates_sorted) // 2]
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <span{tattr('c.eyebrow')}>{ja('c.eyebrow')}</span></p>
<h1{tattr('c.h1')}>{ja('c.h1')}</h1>
<p class="lede"{tattr('c.lede')}>{ja('c.lede')}</p>
{stats([('c.stat.total', n(TOTAL_CRIME), ''), ('c.stat.wards', n(len(MUNI)), ''),
            ('c.stat.median', f1(CHOME_MEDIAN) + '‰', ''), ('c.stat.max', n(CHOME_MAX) + '‰', '')])}
</section>
<section class="wrap rv">
<div class="stage stage-crime" data-live="0" data-view="crime">
<div class="stage-poster">{crime_poster()}</div>
<p class="stage-caption">1 dot = 1 町丁 · 本土 {n(len([p for p in POINTS if p.get("lng") and 138.9 <= p["lng"] <= 139.96 and 35.46 <= p["lat"] <= 35.92]))} chome（島嶼部は枠外）· 2025 · 警視庁</p>
<button class="launch" data-launch="crime"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg><span{tattr('ui.launch')}>{ja('ui.launch')}</span></button>
<div class="stage-live"></div>
</div>
</section>
<section class="wrap beats rv">
<div class="beat"><div class="n">01</div><h3{tattr('c.beat1.t')}>{ja('c.beat1.t')}</h3><p{tattr('c.beat1.p')}>{ja('c.beat1.p')}</p></div>
<div class="beat"><div class="n">02</div><h3{tattr('c.beat2.t')}>{ja('c.beat2.t')}</h3><p{tattr('c.beat2.p')}>{ja('c.beat2.p')}</p></div>
<div class="beat"><div class="n">03</div><h3{tattr('c.beat3.t')}>{ja('c.beat3.t')}</h3><p{tattr('c.beat3.p')}>{ja('c.beat3.p')}</p></div>
</section>
<section class="wrap rv">
<h2 class="section-title"{tattr('c.index.title')}>{ja('c.index.title')}</h2>
<p class="section-sub"{tattr('c.index.sub')}>{ja('c.index.sub')}</p>
<table class="data-table">
<thead><tr><th class="idx">#</th><th{tattr('d.col.name')}>{ja('d.col.name')}</th><th class="num"{tattr('d.col.count')}>{ja('d.col.count')}</th><th class="num"{tattr('d.col.pop')}>{ja('d.col.pop')}</th><th class="num"{tattr('d.col.rate')}>{ja('d.col.rate')}</th></tr></thead>
<tbody>""" + "".join(
        f'<tr><td class="idx num muted">{WARD_RANK.get(m["ward"], "")}</td>'
        f'<td><a href="/crime/{slug_ward(m["ward"])}/">{esc(m["ward"])}</a></td>'
        f'<td class="num">{n((m.get("R7") or {}).get("total", 0))}</td>'
        f'<td class="num muted">{n(m.get("pop") or 0)}</td>'
        f'<td class="num">{f1(WARD_RATE[m["ward"]]) if WARD_RATE[m["ward"]] else "—"}</td></tr>'
        for m in sorted(MUNI, key=lambda x: WARD_RANK.get(x["ward"], 999))) + f"""</tbody>
</table>
</section>
</main>"""
    jsonld = {
        "@context": "https://schema.org", "@type": "Dataset",
        "name": "Tokyo crime by neighbourhood, 2025",
        "description": "Tokyo Metropolitan Police recorded incidents by chome, 2025.",
        "temporalCoverage": "2025",
        "spatialCoverage": "Tokyo",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "creator": {"@type": "Organization", "name": "警視庁"},
        "url": SITE_URL + "/crime/",
    }
    return page("/crime/", f"犯罪 — 5,234の町丁 | {BRAND}",
                "2025年の東京都内5,234町丁の認知件数。人口あたりの率で62区市町村を並べる。",
                body, "crime", jsonld)


def build_ward(slug):
    w = ward_by_slug(slug)
    if not w:
        return None
    m = MUNI_BY[w]
    pop = m.get("pop") or 0
    tot = (m.get("R7") or {}).get("total", 0)
    rate = WARD_RATE[w]
    rank = WARD_RANK.get(w)
    r8 = (m.get("R8cum") or {}).get("total", 0)
    feats = [f["properties"] for f in CHOME["features"] if f["properties"].get("ward") == w]
    feats = [p for p in feats if (p.get("pop") or 0) >= 200 and p.get("t")]
    top = sorted(feats, key=lambda p: -(p.get("t") or 0))[:12]
    rows = "".join(
        f'<tr><td>{esc(p["name"])}</td><td class="num">{n(p.get("t") or 0)}</td>'
        f'<td class="num muted">{n(p.get("pop") or 0)}</td>'
        f'<td class="num">{f1((p.get("t") or 0) / p["pop"] * 1000)}</td></tr>'
        for p in top)
    lede = (f"{w}の2025年認知件数は{n(tot)}件、人口{n(pop)}人。"
            f"人口1,000人あたり{f1(rate)}件。62区市町村中{rank}位。")
    idx = sorted(MUNI, key=lambda x: WARD_RANK.get(x["ward"], 999))
    i = [x["ward"] for x in idx].index(w)
    prev_w = idx[i - 1]["ward"] if i else None
    next_w = idx[i + 1]["ward"] if i + 1 < len(idx) else None
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <a href="/crime/"{tattr('nav.crime')}>{ja('nav.crime')}</a> / {esc(w)}</p>
<h1>{esc(w)}</h1>
<p class="lede">{esc(lede)}</p>
{stats([('c.stat.total', n(tot), ''), ('d.col.pop', n(pop), ''),
            ('d.col.rate', f1(rate) + '‰', ''), ('d.ward.r8', n(r8), '')])}
</section>
<section class="wrap rv">
<figure class="figure">
{ward_map(w)}
<figcaption><span{tattr('d.ward.map')}>{ja('d.ward.map')}</span> · 2025 · 警視庁</figcaption>
</figure>
<h2 class="section-title"{tattr('d.ward.top')}>{ja('d.ward.top')}</h2>
<table class="data-table">
<thead><tr><th{tattr('d.col.name')}>{ja('d.col.name')}</th><th class="num"{tattr('d.col.count')}>{ja('d.col.count')}</th><th class="num"{tattr('d.col.pop')}>{ja('d.col.pop')}</th><th class="num"{tattr('d.col.rate')}>{ja('d.col.rate')}</th></tr></thead>
<tbody>{rows}</tbody></table>
<p class="section-sub" style="margin-top:18px"{tattr('d.ward.note')}>{ja('d.ward.note')}</p>
{pager(f"/crime/{slug_ward(prev_w)}/" if prev_w else "", prev_w or "",
           f"/crime/{slug_ward(next_w)}/" if next_w else "", next_w or "")}
</section>
</main>"""
    return page(f"/crime/{slug}/", f"{w}の犯罪 — 2025年 | {BRAND}",
                f"{w}の2025年認知件数{n(tot)}件、人口1,000人あたり{f1(rate)}件。町丁別の内訳。",
                body, "crime")


def build_cabinet():
    means = {c["pm"]: (sum(v for _, v in CAB_MONTHS[c["pm"]]) / max(1, len(CAB_MONTHS[c["pm"]])))
             for c in CAB["cabinets"]}
    overall = sum(v for _, v in MONTH_MEAN.items()) / len(MONTH_MEAN)
    diffs = []
    for c in CAB["cabinets"]:
        ks = [ym for ym, _ in CAB_MONTHS[c["pm"]]]
        mm = dict(CAB_MONTHS[c["pm"]])
        for a, b in zip(ks, ks[1:]):
            ya, ma = map(int, a.split("-"))
            yb, mb = map(int, b.split("-"))
            if (yb * 12 + mb) - (ya * 12 + ma) == 1:
                diffs.append((mm[b] - mm[a], b))
    diffs.sort()
    swing = diffs[-1][0]
    rows = "".join(
        f'<tr><td class="idx num muted">{k + 1}</td>'
        f'<td><a href="/cabinet/{c["id"]}/">{esc(c["pm"])}</a></td>'
        f'<td class="muted">{esc(c["start"])} – {esc(c["end"])}</td>'
        f'<td class="num">{len(CAB_MONTHS[c["pm"]])}</td>'
        f'<td class="num">{f1(means[c["pm"]])}</td></tr>'
        for k, c in enumerate(CAB["cabinets"]))
    series = [(ym[2:], v) for ym, v in sorted(MONTH_MEAN.items())]
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <span{tattr('b.eyebrow')}>{ja('b.eyebrow')}</span></p>
<h1{tattr('b.h1')}>{ja('b.h1')}</h1>
<p class="lede"{tattr('b.lede')}>{ja('b.lede')}</p>
{stats([('b.stat.polls', n(len(POLLS)), ''), ('b.stat.months', n(len(MONTH_MEAN)), ''),
            ('b.stat.cabinets', n(len(CAB["cabinets"])), ''),
            ('b.stat.swing', ('+' if swing > 0 else '') + f1(swing), 'pt')])}
</section>
<section class="wrap rv">
<div class="stage stage-flow" data-live="0" data-view="cabinet">
<div class="stage-poster">
<figure class="figure" style="margin:0">
{line_svg(series)}
<figcaption>1998–2026 · monthly mean · {n(len(POLLS))} polls</figcaption>
</figure>
</div>
<button class="launch" data-launch="cabinet"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z" fill="currentColor"/></svg><span{tattr('ui.launch')}>{ja('ui.launch')}</span></button>
<div class="stage-live"></div>
</div>
</section>
<section class="wrap beats rv">
<div class="beat"><div class="n">01</div><h3{tattr('b.beat1.t')}>{ja('b.beat1.t')}</h3><p{tattr('b.beat1.p')}>{ja('b.beat1.p')}</p></div>
<div class="beat"><div class="n">02</div><h3{tattr('b.beat2.t')}>{ja('b.beat2.t')}</h3><p{tattr('b.beat2.p')}>{ja('b.beat2.p')}</p></div>
<div class="beat"><div class="n">03</div><h3{tattr('b.beat3.t')}>{ja('b.beat3.t')}</h3><p{tattr('b.beat3.p')}>{ja('b.beat3.p')}</p></div>
</section>
<section class="wrap rv">
<h2 class="section-title"{tattr('b.index.title')}>{ja('b.index.title')}</h2>
<p class="section-sub"{tattr('b.index.sub')}>{ja('b.index.sub')}</p>
<table class="data-table">
<thead><tr><th class="idx">#</th><th>内閣</th><th>在任</th><th class="num"{tattr('d.pm.months')}>{ja('d.pm.months')}</th><th class="num"{tattr('d.pm.mean')}>{ja('d.pm.mean')}</th></tr></thead>
<tbody>{rows}</tbody></table>
</section>
</main>"""
    jsonld = {
        "@context": "https://schema.org", "@type": "Dataset",
        "name": "Japanese cabinet approval, 1998–2026",
        "description": "Monthly cabinet approval ratings aggregated from NHK, Nikkei, Asahi, Jiji, Yomiuri, JNN and Kyodo polls.",
        "temporalCoverage": "1998-07/2026-10",
        "spatialCoverage": "Japan",
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "url": SITE_URL + "/cabinet/",
    }
    return page("/cabinet/", f"内閣 — 331か月の支持率 | {BRAND}",
                "1998年から2026年までの内閣支持率644調査。月次平均331か月、14内閣。",
                body, "cabinet", jsonld)


def build_pm(cid):
    c = next((x for x in CAB["cabinets"] if x["id"] == cid), None)
    if not c:
        return None
    series = CAB_MONTHS[c["pm"]]
    vals = [v for _, v in series]
    mean = sum(vals) / len(vals)
    hi = max(series, key=lambda t: t[1])
    lo = min(series, key=lambda t: t[1])
    polls_n = sum(1 for p in POLLS if p["pm"] == c["pm"])
    chart = line_svg([(ym[2:], v) for ym, v in series], auto=True)
    ranked = sorted(series, key=lambda t: -t[1])
    def rows(items):
        return "".join(f'<tr><td class="num">{ym}</td><td class="num">{f1(v)}</td></tr>' for ym, v in items)
    idx = [x["id"] for x in CAB["cabinets"]].index(cid)
    prev_c = CAB["cabinets"][idx - 1] if idx else None
    next_c = CAB["cabinets"][idx + 1] if idx + 1 < len(CAB["cabinets"]) else None
    body = f"""<main id="main">
<section class="wrap chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <a href="/cabinet/"{tattr('nav.cabinet')}>{ja('nav.cabinet')}</a> / {esc(c['pm'])}</p>
<h1>{esc(c['pm'])}</h1>
<p class="lede">{esc(c['start'])} — {esc(c['end'])}。月次支持率の平均は{f1(mean)}。最高{f1(hi[1])}（{hi[0]}）、最低{f1(lo[1])}（{lo[0]}）。</p>
{stats([('d.pm.term', esc(c['start'][:4]) + '–' + esc(c['end'][:4]), ''),
            ('d.pm.months', n(len(series)), ''), ('b.stat.polls', n(polls_n), ''),
            ('d.pm.mean', f1(mean), '')])}
</section>
<section class="wrap rv">
<figure class="figure">
{chart}
<figcaption><span{tattr('d.pm.series')}>{ja('d.pm.series')}</span> · {esc(c['pm'])} · 月次平均</figcaption>
</figure>
<div class="two-col">
<div><h2 class="section-title"{tattr('d.pm.high')}>{ja('d.pm.high')}</h2>
<table class="data-table"><thead><tr><th>月</th><th class="num">%</th></tr></thead><tbody>{rows(ranked[:5])}</tbody></table></div>
<div><h2 class="section-title"{tattr('d.pm.low')}>{ja('d.pm.low')}</h2>
<table class="data-table"><thead><tr><th>月</th><th class="num">%</th></tr></thead><tbody>{rows(ranked[-5:][::-1])}</tbody></table></div>
</div>
<p class="section-sub" style="margin-top:18px"{tattr('d.pm.note')}>{ja('d.pm.note')}</p>
{pager(f"/cabinet/{prev_c['id']}/" if prev_c else "", prev_c["pm"] if prev_c else "",
           f"/cabinet/{next_c['id']}/" if next_c else "", next_c["pm"] if next_c else "")}
</section>
</main>"""
    return page(f"/cabinet/{cid}/", f"{c['pm']}内閣の支持率 | {BRAND}",
                f"{c['pm']}内閣（{c['start']}–{c['end']}）の月次支持率。平均{f1(mean)}、最高{f1(hi[1])}、最低{f1(lo[1])}。",
                body, "cabinet")


def fill_copy(s):
    return s.replace("{{B}}", str(N_BUCKETS)).replace("{{S}}", str(N_SINGLE))


def build_method():
    dls = [("/data/quakes.csv", "quakes.csv", n(len(Q)) + " 行"),
           ("/data/crime.csv", "crime.csv", n(CHOME_COUNT) + " 行"),
           ("/data/cabinet.csv", "cabinet.csv", n(len(POLLS)) + " 行")]
    dl_html = "".join(f'<a href="{u}" download>{esc(name)}<span>{esc(sub)}</span></a>'
                      for u, name, sub in dls)
    body = f"""<main id="main">
<section class="wrap narrow chapter-head rv">
<p class="eyebrow"><a href="/"{tattr('crumb.home')}>{ja('crumb.home')}</a> / <span{tattr('nav.method')}>{ja('nav.method')}</span></p>
<h1{tattr('m.h1')}>{ja('m.h1')}</h1>
<p class="lede"{tattr('m.lede')}>{ja('m.lede')}</p>
</section>
<section class="wrap narrow prose rv">
<h2{tattr('m.data.h')}>{ja('m.data.h')}</h2>
<h3{tattr('m.q.h')}>{ja('m.q.h')}</h3><p{tattr('m.q.p')}>{ja('m.q.p')}</p>
<h3{tattr('m.c.h')}>{ja('m.c.h')}</h3><p{tattr('m.c.p')}>{ja('m.c.p')}</p>
<h3{tattr('m.b.h')}>{ja('m.b.h')}</h3><p{tattr('m.b.p')}>{ja('m.b.p')}</p>
<h2{tattr('m.cal.h')}>{ja('m.cal.h')}</h2>
<p{tattr('m.cal.q')}>{ja('m.cal.q')}</p>
<p{tattr('m.cal.c')}>{ja('m.cal.c')}</p>
<p{tattr('m.cal.b')}>{ja('m.cal.b')}</p>
<h2{tattr('m.err.h')}>{ja('m.err.h')}</h2>
<div class="note">
<p{tattr('m.err.1')}>{ja('m.err.1')}</p>
<p{tattr('m.err.2')}>{ja('m.err.2')}</p>
<p{tattr('m.err.3')}>{ja('m.err.3')}</p>
<p{tattr('m.err.4')}>{ja('m.err.4')}</p>
<p{tattr('m.err.5')}>{ja('m.err.5')}</p>
<p{tattr('m.err.6')}>{ja('m.err.6')}</p>
</div>
<h2{tattr('m.upd.h')}>{ja('m.upd.h')}</h2>
<p{tattr('m.upd.p')}>{ja('m.upd.p')} <code>python src/build.py</code> · {BUILD_STAMP}</p>
<h2 id="download"{tattr('m.dl.h')}>{ja('m.dl.h')}</h2>
<p{tattr('m.dl.p')}>{ja('m.dl.p')}</p>
<div class="dl-list">{dl_html}</div>
<h2{tattr('m.lic.h')}>{ja('m.lic.h')}</h2>
<p{tattr('m.lic.p')}>{ja('m.lic.p')}</p>
<h2{tattr('m.src.h')}>{ja('m.src.h')}</h2>
<ul>
<li><a href="https://www.usgs.gov/programs/earthquake-hazards" rel="noopener">USGS Earthquake Hazards Program</a> — ComCat, public domain</li>
<li><a href="https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html" rel="noopener">警視庁 犯罪統計</a> — CC BY</li>
<li><a href="https://www.nhk.or.jp/bunken/yoron/political/" rel="noopener">NHK放送文化研究所 世論調査</a></li>
<li><a href="https://www.nhk.or.jp/senkyo/shijiritsu/" rel="noopener">NHK選挙WEB 内閣支持率</a></li>
<li><a href="https://vdata.nikkei.com/newsgraphics/cabinet-approval-rating/" rel="noopener">日本経済新聞 内閣支持率データ</a></li>
<li><a href="https://www.asahi.com/" rel="noopener">朝日新聞</a> · <a href="https://www.jiji.com/" rel="noopener">時事通信</a> · <a href="https://www.yomiuri.co.jp/" rel="noopener">読売新聞</a> · <a href="https://news.tbs.co.jp/" rel="noopener">JNN</a> · <a href="https://www.kyodo.co.jp/" rel="noopener">共同通信</a></li>
</ul>
</section>
</main>"""
    body = fill_copy(body)
    return page("/method/", f"方法と出典 | {BRAND}",
                "地震・犯罪・内閣支持率のデータ源、口径、既知の誤差、CSVダウンロード。",
                body, "method")


def build_404():
    body = f"""<main id="main"><section class="wrap notfound">
<div class="code">404</div>
<h1{tattr('nf.h1')}>{ja('nf.h1')}</h1>
<p{tattr('nf.p')}>{ja('nf.p')}</p>
<div class="links">
<a href="/quake/"{tattr('nav.quake')}>{ja('nav.quake')}</a>
<a href="/crime/"{tattr('nav.crime')}>{ja('nav.crime')}</a>
<a href="/cabinet/"{tattr('nav.cabinet')}>{ja('nav.cabinet')}</a>
<a href="/"{tattr('nf.home')}>{ja('nf.home')}</a>
</div>
</section></main>"""
    return page("/404.html", f"404 — この頁は、ない | {BRAND}",
                "この頁は存在しない。三つの章から辿り直す。", body, "")


# ---------------------------------------------------------------- main
def main():
    global CSS_VER, JS_VER, FONT_VER
    files = {}

    files["/"] = build_cover()
    files["/preview/"] = build_home_preview()
    files["/quake/"] = build_quake()
    for y in YEARS:
        files[f"/quake/{y}/"] = build_year(y)
    files["/crime/"] = build_crime()
    for m in MUNI:
        s = slug_ward(m["ward"])
        h = build_ward(s)
        if h:
            files[f"/crime/{s}/"] = h
    files["/cabinet/"] = build_cabinet()
    for c in CAB["cabinets"]:
        h = build_pm(c["id"])
        if h:
            files[f"/cabinet/{c['id']}/"] = h
    files["/method/"] = build_method()
    files["/404.html"] = build_404()

    # i18n dictionary (only the three languages; ja already in HTML)
    dic = {k: {"ja": fill_copy(v[0]), "zh": fill_copy(v[1]), "en": fill_copy(v[2])}
           for k, v in COPY.items()}
    i18n_json = json.dumps(dic, ensure_ascii=False, separators=(",", ":"))
    files["/assets/i18n.json"] = i18n_json

    css = (SRC / "tokens.css").read_text(encoding="utf-8") + "\n" + \
          (SRC / "app.css").read_text(encoding="utf-8")
    js = (SRC / "shell.js").read_text(encoding="utf-8")

    css_bytes = css.encode("utf-8")
    js_bytes = js.encode("utf-8")
    CSS_VER = hashlib.sha1(css_bytes).hexdigest()[:8]
    # The shell stamps its own ?v= onto every lazy /app/ module URL, so it must
    # change whenever any app code (view/vendor) changes, not just shell.js.
    app_code = b""
    for ap in sorted((ROOT / "app").rglob("*")):
        if ap.is_file() and "/data/" not in ap.as_posix() and ap.suffix in (".js", ".css"):
            app_code += ap.read_bytes()
    JS_VER = hashlib.sha1(js_bytes + app_code).hexdigest()[:8]

    # fonts first (needs the charset), then CSS can reference the version
    charset = collect_chars(files, i18n_json)
    font_meta = build_fonts(charset)
    FONT_VER = font_meta["ver"]
    css = css.replace("__FONT_VER__", FONT_VER)
    if font_meta.get("faces"):
        css = css.replace("/*__FONT_FACES__*/", font_meta["faces"])
    css_bytes = css.encode("utf-8")
    CSS_VER = hashlib.sha1(css_bytes).hexdigest()[:8]
    files["/assets/app.css"] = css
    files["/assets/shell.js"] = js

    # HTML was rendered before CSS_VER existed — patch placeholders now.
    for k, v in list(files.items()):
        if isinstance(v, str) and v.startswith("<!doctype html>"):
            files[k] = v.replace("__CSS_VER__", CSS_VER).replace("__JS_VER__", JS_VER) \
                        .replace("__FONT_VER__", FONT_VER)

    write_site(files)
    write_data()
    write_meta(font_meta)
    print("pages:", len([p for p in PAGES]))
    print("css", CSS_VER, len(css_bytes), "js", JS_VER, len(js_bytes))
    print("charset", len(charset))


def collect_chars(files, i18n_json):
    chars = set()
    for p, h in files.items():
        if isinstance(h, str):
            chars.update(h)
    chars.update(i18n_json)
    for m in MUNI:
        chars.update(m["ward"])
    for c in CAB["cabinets"]:
        chars.update(c["pm"])
    for p in POINTS:
        chars.update(p.get("name") or "")
    for y in YEARS:
        chars.update(y)
    # Interactive views carry their own Japanese/Chinese UI strings. Strip JS
    # comments first (the skill's lesson: comments alone can be 5x the visible
    # CJK), then feed every remaining string character into the subset.
    for js in (ROOT / "app").rglob("*.js"):
        if not js.is_file():
            continue
        try:
            src = js.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
        src = re.sub(r"(?m)//.*$", "", src)
        chars.update(src)
    # ASCII + common punctuation + arrows/units
    chars.update(chr(i) for i in range(32, 127))
    chars.update("　、。・「」『』（）—–…‰×÷±→←↑↓▶●○■□◆◇①②③④⑤⑥⑦⑧⑨⑩"
                 "₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺")
    return "".join(sorted(c for c in chars if c.isprintable() or c in "\u3000"))


def build_fonts(charset):
    try:
        import fonts
        return fonts.build(charset, SITE / "assets/fonts", ROOT / ".cache/fonts")
    except Exception as e:
        print("fonts: skipped", e)
        return {"ver": "0", "faces": ""}


def write_site(files):
    for path, content in files.items():
        if path.endswith("/"):
            dest = SITE / path.strip("/") / "index.html"
        else:
            dest = SITE / path.lstrip("/")
        dest.parent.mkdir(parents=True, exist_ok=True)
        enc = content if isinstance(content, bytes) else content.encode("utf-8")
        dest.write_bytes(enc)

    # app runtime (views + vendor + data) — copied verbatim
    for ch in ("quake", "crime", "cabinet"):
        src = ROOT / "app" / ch
        dst = SITE / "app" / ch
        if src.exists():
            shutil.copytree(src, dst, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "*.map"))

    # favicon
    fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
           f'<rect width="64" height="64" fill="#E9EDE3"/>'
           f'<text x="31" y="48" text-anchor="middle" font-family="Outfit,Helvetica,Arial,sans-serif" '
           f'font-weight="800" font-size="46" fill="#2F6B4F">J</text></svg>')
    (SITE / "assets/favicon.svg").write_text(fav, encoding="utf-8")


def write_data():
    d = SITE / "data"
    d.mkdir(parents=True, exist_ok=True)
    with (d / "quakes.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["time", "lon", "lat", "depth_km", "mag", "place"])
        for x in sorted(Q, key=lambda r: r["time"]):
            w.writerow([x["time"], x["lon"], x["lat"], x["depthKm"], x["mag"], x["place"]])
    with (d / "crime.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ward", "chome", "pop", "total", "violent", "rough", "breakin",
                    "nonbreakin", "other", "rate_per_1000"])
        for p in sorted(POINTS, key=lambda r: (r["w"], r["n"])):
            pop = p.get("pop") or 0
            t = p.get("t") or 0
            w.writerow([p["w"], p["n"], pop, t, p.get("v", 0), p.get("r", 0),
                        p.get("bi", 0), p.get("nb", 0), p.get("o", 0),
                        f"{t / pop * 1000:.2f}" if pop else ""])
    with (d / "cabinet.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["date", "pm", "value", "source", "kind"])
        for p in sorted(POLLS, key=lambda r: r["date"]):
            w.writerow([p["date"], p["pm"], p["value"], p["source"], p.get("kind", "")])
    # monthly means
    with (d / "cabinet-monthly.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["month", "mean", "n"])
        for ym in sorted(MONTH_MEAN):
            vs = [p["value"] for p in POLLS if p["date"][:7] == ym]
            w.writerow([ym, f"{sum(vs) / len(vs):.2f}", len(vs)])


def write_meta(font_meta):
    urls = [SITE_URL + p for p, _, _ in PAGES]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p, _, _ in PAGES:
        if p == "/404.html":
            continue
        pri = "1.0" if p == "/" else ("0.8" if p.count("/") <= 2 else "0.5")
        sm.append(f"<url><loc>{SITE_URL}{p}</loc><lastmod>{BUILD_DATE}</lastmod>"
                  f"<changefreq>weekly</changefreq><priority>{pri}</priority></url>")
    sm.append("</urlset>")
    (SITE / "sitemap.xml").write_text("\n".join(sm), encoding="utf-8")

    (SITE / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE_URL, encoding="utf-8")

    (SITE / "_headers").write_text(
        "/*\n"
        "  X-Content-Type-Options: nosniff\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  X-Frame-Options: DENY\n"
        "  Permissions-Policy: geolocation=(), microphone=(), camera=()\n"
        "  Cache-Control: public, max-age=0, must-revalidate\n"
        "\n"
        "/assets/*\n"
        "  Cache-Control: public, max-age=31536000, immutable\n"
        "\n"
        "/app/*\n"
        "  Cache-Control: public, max-age=86400\n"
        "\n"
        "/data/*\n"
        "  Cache-Control: public, max-age=86400\n", encoding="utf-8")

    (SITE / "_redirects").write_text(
        "/quake /quake/ 301\n/crime /crime/ 301\n/cabinet /cabinet/ 301\n"
        "/method /method/ 301\n", encoding="utf-8")

    (SITE / "llms.txt").write_text(f"""# {BRAND}

> 日本を三つの尺度で見る静的データサイト。地震（引いて見る）、犯罪（寄って見る）、内閣（通して見る）。

- [地震](/quake/): 2000–2026.07、M4以上の震源40,079点。年別・月別・エネルギー。
- [犯罪](/crime/): 2025年、東京都内5,234町丁、62区市町村。人口あたりの率。
- [内閣](/cabinet/): 1998–2026、644調査、331か月、14内閣。
- [方法と出典](/method/): 口径・既知の誤差・CSV。

Build: {BUILD_STAMP}. Sources: USGS ComCat, 警視庁, NHK, 日経, 朝日, 時事, 読売, JNN, 共同.
""", encoding="utf-8")


if __name__ == "__main__":
    main()
