#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""svgkit.py — projections, path building, small chart primitives.

All output is static SVG (no JS). Coordinates are rounded to 2 decimals to
keep payloads small; the pages are pre-rendered so this runs once per build.
"""
import math

try:
    from shapely.geometry import LineString, Polygon, MultiPolygon, box as shp_box
    from shapely.ops import unary_union
except Exception:  # pragma: no cover
    LineString = None


def merc(lat):
    lat = max(-85.0, min(85.0, lat))
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


class Proj:
    """Web-Mercator fitted into a w*h box with padding, centered."""

    def __init__(self, bbox, w, h, pad=0.0):
        lon0, lat0, lon1, lat1 = bbox
        self.w, self.h, self.pad = w, h, pad
        x0, x1 = math.radians(lon0), math.radians(lon1)
        y0, y1 = merc(lat0), merc(lat1)
        sx = (w - 2 * pad) / (x1 - x0)
        sy = (h - 2 * pad) / (y1 - y0)
        self.s = min(sx, sy)
        self.ox = pad + ((w - 2 * pad) - (x1 - x0) * self.s) / 2 - x0 * self.s
        self.oy = pad + ((h - 2 * pad) - (y1 - y0) * self.s) / 2 + y1 * self.s

    def xy(self, lon, lat):
        return (math.radians(lon) * self.s + self.ox,
                self.oy - merc(lat) * self.s)

    def pts(self, coords):
        out = []
        for c in coords:
            x, y = self.xy(c[0], c[1])
            out.append((x, y))
        return out


def _fmt(v):
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def path(coords, proj, close=False, simplify=0.0):
    """coords: [(lon,lat),...] -> SVG path d."""
    if simplify and LineString is not None and len(coords) > 4:
        try:
            g = LineString(coords).simplify(simplify, preserve_topology=False)
            coords = list(g.coords)
        except Exception:
            pass
    p = proj.pts(coords)
    if not p:
        return ""
    d = "M" + _fmt(p[0][0]) + " " + _fmt(p[0][1])
    px, py = p[0]
    for x, y in p[1:]:
        dx, dy = x - px, y - py
        if abs(dx) < 0.05 and abs(dy) < 0.05:
            continue
        d += "l" + _fmt(dx) + " " + _fmt(dy)
        px, py = x, y
    if close:
        d += "z"
    return d


def rings_path(poly, proj, simplify=0.0):
    """Polygon / MultiPolygon -> single path with even-odd exterior+hole rings."""
    if poly is None or poly.is_empty:
        return ""
    geoms = []
    stack = list(poly.geoms) if hasattr(poly, "geoms") else [poly]
    while stack:
        g = stack.pop()
        if g.is_empty:
            continue
        if g.geom_type == "Polygon":
            geoms.append(g)
        elif hasattr(g, "geoms"):
            stack.extend(g.geoms)
    d = []
    for g in geoms:
        if simplify:
            g = g.simplify(simplify, preserve_topology=True)
        if g.is_empty or g.geom_type != "Polygon":
            continue
        d.append(path(list(g.exterior.coords), proj, close=True))
        for r in g.interiors:
            d.append(path(list(r.coords), proj, close=True))
    return "".join(x for x in d if x)


def clip_lines(features, bbox, simplify=0.0):
    """Clip LineString features to bbox; returns list of coord lists."""
    bx = shp_box(*bbox)
    out = []
    for f in features:
        g = f.get("geometry") or {}
        if g.get("type") != "LineString":
            continue
        try:
            ln = LineString(g["coordinates"])
            if not ln.intersects(bx):
                continue
            inter = ln.intersection(bx)
            if inter.is_empty:
                continue
            geoms = list(inter.geoms) if hasattr(inter, "geoms") else [inter]
            for seg in geoms:
                if getattr(seg, "geom_type", "") != "LineString" or len(seg.coords) < 2:
                    continue
                cs = list(seg.coords)
                if simplify:
                    cs = list(LineString(cs).simplify(simplify, preserve_topology=False).coords)
                if len(cs) >= 2:
                    out.append(cs)
        except Exception:
            continue
    return out


def pct(v, digits=1):
    return ("%." + str(digits) + "f") % v


def fmt_int(n):
    return f"{n:,}"


def fmt_j(j):
    """Joules -> readable Japanese unit."""
    if j >= 1e18:
        return f"{j / 1e18:.2f}×10¹⁸"
    if j >= 1e15:
        return f"{j / 1e15:.1f}×10¹⁵"
    if j >= 1e12:
        return f"{j / 1e12:.0f}×10¹²"
    return f"{j:.2e}"
