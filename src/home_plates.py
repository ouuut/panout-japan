# -*- coding: utf-8 -*-
"""Home-preview data plates.

These are deliberately build-time SVGs: the first screen must render without
waiting for WebGL, Leaflet or ECharts. Every mark is derived from the same
data files as the three chapter pages.
"""
import math
from collections import defaultdict

import svgkit as S


def _svg(w, h, label, body):
    return (f'<svg class="hp-svg" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="{label}" preserveAspectRatio="xMidYMid meet">'
            f'<title>{label}</title>{body}</svg>')


def quake_svg(quakes, outline, years, w=1000, h=760):
    bbox = (121.0, 23.0, 151.0, 48.0)
    proj = S.Proj(bbox, w, h, 10)

    segs = S.clip_lines(outline["features"], bbox, 0.03)
    coast = "".join(S.path(seg, proj) for seg in segs)

    cell = 0.45
    bins = defaultdict(int)
    for q in quakes:
        lon, lat = q["lon"], q["lat"]
        if bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]:
            bins[(int((lon - bbox[0]) / cell), int((lat - bbox[1]) / cell))] += 1
    maxc = max(bins.values()) or 1

    levels = 6
    buckets = defaultdict(list)
    for (ix, iy), count in bins.items():
        if count < 2:
            continue
        level = min(levels - 1, int((count / maxc) ** 0.45 * levels))
        x0, y0 = proj.xy(bbox[0] + ix * cell, bbox[1] + iy * cell)
        x1, y1 = proj.xy(bbox[0] + (ix + 1) * cell, bbox[1] + (iy + 1) * cell)
        buckets[level].append((x0, y1, abs(x1 - x0), abs(y1 - y0)))

    out = []
    for level in sorted(buckets):
        opacity = 0.06 + 0.17 * level
        d = "".join(
            f"M{x:.1f} {y:.1f}h{ww:.1f}v{hh:.1f}h{-ww:.1f}z"
            for x, y, ww, hh in buckets[level]
        )
        out.append(f'<path d="{d}" fill="var(--accent)" opacity="{opacity:.2f}"/>')

    out.append(f'<path d="{coast}" fill="none" stroke="var(--ink)" stroke-width="1.2" '
               f'opacity="0.9" stroke-linejoin="round"/>')

    mx, my = proj.xy(142.37, 38.30)
    out.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="9" fill="none" '
               f'stroke="var(--accent)" stroke-width="1.7"/>')
    out.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="2.4" fill="var(--accent)"/>')
    out.append(f'<text x="{mx + 15:.1f}" y="{my + 5:.1f}" class="note halo ink">'
               f'2011-03-11 · M9.1</text>')

    # A 27-year ruler, not decoration: one tick per year in the catalogue.
    pad = 54
    base = h - 54
    for i, year in enumerate(years):
        x = pad + (w - 2 * pad) * i / max(1, len(years) - 1)
        hot = year == "2011"
        out.append(f'<rect x="{x:.1f}" y="{base - (16 if hot else 8):.1f}" width="1.2" '
                   f'height="{16 if hot else 8}" fill="var(--accent)" '
                   f'opacity="{0.9 if hot else 0.32}"/>')
    for i, year in enumerate(years):
        if year not in ("2000", "2011", "2026"):
            continue
        x = pad + (w - 2 * pad) * i / max(1, len(years) - 1)
        cls = "note accent" if year == "2011" else "micro"
        anchor = "end" if year == "2026" else "middle"
        out.append(f'<text x="{x:.1f}" y="{base + 30}" text-anchor="{anchor}" '
                   f'class="{cls}">{year}</text>')

    return _svg(w, h, "日本周辺のM4以上震源密度、2000年から2026年", "".join(out))


def crime_svg(points, muni_poly, ward_rate, w=1000, h=760):
    from shapely.geometry import shape
    from shapely.validation import make_valid

    bbox = (139.51, 35.52, 139.95, 35.87)
    proj = S.Proj(bbox, w, h, 10)
    out = []

    features = [f for f in muni_poly["features"]
                if f.get("geometry") and f["properties"].get("area_ja") == "都区部"]
    wards = {f["properties"]["ward_ja"] for f in features}
    max_rate = max((ward_rate.get(f["properties"]["ward_ja"]) or 0) for f in features) or 1
    chome_n = sum(1 for p in points if p.get("w") in wards)
    for f in features:
        g = make_valid(shape(f["geometry"]))
        rate = ward_rate.get(f["properties"]["ward_ja"]) or 0
        opacity = 0.11 + 0.39 * math.sqrt(max(0.0, rate) / max_rate)
        d = S.rings_path(g, proj, 0.0004)
        if d:
            out.append(f'<path d="{d}" fill="var(--accent)" fill-opacity="{opacity:.3f}" '
                       f'stroke="var(--bg)" stroke-width="0.8" stroke-opacity="0.8"/>')

    groups = {0: [], 1: [], 2: [], 3: []}
    for p in points:
        lon, lat = p.get("lng"), p.get("lat")
        if lon is None or lat is None:
            continue
        if p.get("w") not in wards:
            continue
        if not (bbox[0] <= lon <= bbox[2] and bbox[1] <= lat <= bbox[3]):
            continue
        total = p.get("t") or 0
        level = 0 if total <= 2 else (1 if total <= 6 else (2 if total <= 15 else 3))
        x, y = proj.xy(lon, lat)
        groups[level].append((x, y))

    widths = [1.2, 1.8, 2.6, 3.6]
    opacities = [0.30, 0.40, 0.52, 0.66]
    for level, pts in groups.items():
        if not pts:
            continue
        d = "".join(f"M{x:.1f} {y:.1f}h0" for x, y in pts)
        out.append(f'<path d="{d}" stroke="var(--accent)" stroke-width="{widths[level]}" '
                   f'stroke-linecap="round" opacity="{opacities[level]}"/>')

    # The lens is the chapter's promise: a municipality is not the end scale.
    lx, ly = proj.xy(139.735, 35.690)
    out.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="88" fill="none" '
               f'stroke="var(--accent)" stroke-width="2" opacity="0.9"/>')
    out.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="2.6" fill="var(--accent)"/>')
    for dx, dy in ((0, -96), (0, 96), (-96, 0), (96, 0)):
        out.append(f'<rect x="{lx + dx - 0.7:.1f}" y="{ly + dy - 6:.1f}" width="1.4" '
                   f'height="12" fill="var(--accent)" opacity="0.9"/>')
    out.append(f'<text x="{lx:.1f}" y="{ly - 104:.1f}" text-anchor="middle" '
               f'class="note halo ink">23区 / {chome_n:,}町丁</text>')

    labels = [
        ("千代田", 139.7536, 35.6938, 8, -10, "start"),
        ("世田谷", 139.6463, 35.6461, -8, 22, "end"),
        ("足立", 139.8048, 35.7750, 8, -8, "start"),
    ]
    for name, lon, lat, dx, dy, anchor in labels:
        x, y = proj.xy(lon, lat)
        out.append(f'<text x="{x + dx:.1f}" y="{y + dy:.1f}" text-anchor="{anchor}" '
                   f'class="ward halo ink">{name}</text>')

    # Rate key, flat blocks only.
    ky = h - 56
    out.append(f'<text x="54" y="{ky}" class="legend">RATE / 1,000</text>')
    for i, op in enumerate((0.10, 0.22, 0.36, 0.52)):
        out.append(f'<rect x="{54 + i * 24}" y="{ky + 14}" width="16" height="16" '
                   f'fill="var(--accent)" opacity="{op}"/>')
    out.append(f'<text x="{54 + 4 * 24 + 8}" y="{ky + 27}" class="legend">LOW → HIGH</text>')
    out.append(f'<text x="{w - 54}" y="{ky}" text-anchor="end" class="legend">'
               f'23区 / {chome_n:,} CHOME</text>')

    return _svg(w, h, "東京都心の町丁別犯罪率と認知件数", "".join(out))


def cabinet_svg(months, month_mean, cabinet_data, w=1000, h=760):
    n = len(months)
    index = {ym: i for i, ym in enumerate(months)}
    pad_l, pad_r = 56, 28
    x0, x1 = pad_l, w - pad_r

    def x_at(i):
        return x0 + (x1 - x0) * i / max(1, n - 1)

    out = []

    # Cabinet ribbon: width is time served, not an equal-width card row.
    ribbon_y, ribbon_h = 58, 34
    shortcuts = {"obuchi": "小渕", "koizumi": "小泉", "abe2": "安倍2", "takaichi": "高市"}
    for j, cab in enumerate(cabinet_data["cabinets"]):
        i0 = index.get(cab["start"][:7], 0)
        i1 = index.get(cab["end"][:7], n - 1)
        i0, i1 = max(0, min(i0, n - 1)), max(0, min(i1, n - 1))
        left, right = x_at(i0), x_at(i1)
        width = max(1.0, right - left - 1)
        opacity = 0.09 + 0.028 * (j % 5)
        out.append(f'<rect x="{left + 1:.1f}" y="{ribbon_y}" width="{width:.1f}" '
                   f'height="{ribbon_h}" rx="1" fill="var(--accent)" opacity="{opacity:.2f}"/>')
        if cab["id"] in shortcuts and width > 44:
            out.append(f'<text x="{left + width / 2:.1f}" y="{ribbon_y + 23}" '
                       f'text-anchor="middle" class="ribbon ink">{shortcuts[cab["id"]]}</text>')
    out.append(f'<text x="{x0}" y="{ribbon_y - 18}" class="micro">14 CABINETS / 331 MONTHS</text>')
    out.append(f'<text x="{x1}" y="{ribbon_y - 18}" text-anchor="end" class="micro">'
               f'ONE LINE, 1998—2026</text>')

    # Approval line. 0–100 is the shared scale, so the line is comparable.
    top, bottom = 150, 620
    base_y = bottom

    def y_at(v):
        return top + (bottom - top) * (1 - v / 100)

    for value in (0, 25, 50, 75, 100):
        y = y_at(value)
        out.append(f'<line x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}" '
                   f'stroke="var(--muted)" stroke-width="0.7" opacity="0.14"/>')
        out.append(f'<text x="{x0 - 10}" y="{y + 4:.1f}" text-anchor="end" '
                   f'class="micro">{value}</text>')

    points = []
    for i, ym in enumerate(months):
        if ym in month_mean:
            points.append((x_at(i), y_at(month_mean[ym])))
    if points:
        area = f"M{points[0][0]:.1f},{base_y:.1f} " + \
               " ".join(f"L{x:.1f},{y:.1f}" for x, y in points) + \
               f" L{points[-1][0]:.1f},{base_y:.1f} Z"
        line = " ".join(f"{x:.1f},{y:.1f}" for x, y in points)
        out.append(f'<path d="{area}" fill="var(--accent)" opacity="0.075"/>')
        out.append(f'<polyline points="{line}" fill="none" stroke="var(--accent)" '
                   f'stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>')

    # One seam worth naming; the ribbon already carries the other cabinets.
    for ym, label in (("2012-12", "2012 / 安倍2次"),):
        if ym not in index:
            continue
        x = x_at(index[ym])
        out.append(f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{bottom}" '
                   f'stroke="var(--accent)" stroke-width="0.8" opacity="0.28"/>')
        out.append(f'<text x="{x + 8:.1f}" y="{top - 8}" class="micro accent">{label}</text>')

    if points:
        last_x, last_y = points[-1]
        out.append(f'<circle cx="{last_x:.1f}" cy="{last_y:.1f}" r="5" fill="var(--accent)"/>')
        out.append(f'<text x="{last_x - 10:.1f}" y="{last_y - 14:.1f}" text-anchor="end" '
                   f'class="note accent">{month_mean[months[-1]]:.1f}%</text>')

    # Year labels are placed by month index, not eyeballed.
    for year in ("1998", "2005", "2012", "2019", "2026"):
        candidates = [i for i, ym in enumerate(months) if ym.startswith(year)]
        if not candidates:
            continue
        anchor = "end" if year == "2026" else "middle"
        out.append(f'<text x="{x_at(candidates[0]):.1f}" y="{bottom + 30}" '
                   f'text-anchor="{anchor}" class="micro">{year}</text>')

    out.append(f'<text x="{x0}" y="{top - 8}" class="micro">APPROVAL / %</text>')

    return _svg(w, h, "1998年から2026年までの内閣支持率、331か月", "".join(out))
