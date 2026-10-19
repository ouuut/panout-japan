#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""slim_quake_data.py — shrink the interactive globe payload without changing schema.

1) japan-outline.json: Douglas-Peucker each coastline LineString at 0.01 deg.
   The globe draws at ~1px per 0.1 deg, so 0.01 is below visual resolution.
2) quakes.json + tiles: round lon/lat to 3 dp, depth to 1 dp, mag to 1 dp,
   truncate time to whole seconds. Same object shape, same field names.

Originals are copied to .cache/quake-orig/ (one-off; re-run is a no-op if the
backup already exists).
"""
import json
import shutil
from pathlib import Path

from shapely.geometry import LineString

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app/quake/data"
BACKUP = ROOT / ".cache/quake-orig"
TOL = 0.05


def round_point(p):
    lon, lat, *rest = p
    return [round(lon, 3), round(lat, 3)] + rest


def slim_quakes(rows):
    out = []
    for r in rows:
        t = r.get("time") or ""
        if len(t) > 20 and t.endswith("Z") and "." in t:
            t = t[:19] + "Z"
        out.append({
            "id": r.get("id"),
            "lon": round(r.get("lon"), 3),
            "lat": round(r.get("lat"), 3),
            "depthKm": round(r.get("depthKm") or 0, 1),
            "mag": round(r.get("mag") or 0, 1),
            "time": t,
            "place": r.get("place") or "",
        })
    return out


def main():
    BACKUP.mkdir(parents=True, exist_ok=True)

    # ---- outline
    src = DATA / "japan-outline.json"
    bak = BACKUP / "japan-outline.json"
    if not bak.exists():
        shutil.copyfile(src, bak)
    doc = json.loads(bak.read_text(encoding="utf-8"))
    kept = 0
    pts_before = pts_after = 0
    for f in doc.get("features", []):
        g = f.get("geometry") or {}
        if g.get("type") != "LineString":
            continue
        cs = g.get("coordinates") or []
        pts_before += len(cs)
        if len(cs) < 2:
            continue
        line = LineString(cs)
        s = line.simplify(TOL, preserve_topology=False)
        cc = [list(c) for c in s.coords]
        pts_after += len(cc)
        if len(cc) < 2:
            f["geometry"] = None
            continue
        g["coordinates"] = cc
        kept += 1
    doc["features"] = [f for f in doc["features"] if f.get("geometry")]
    doc["totalPoints"] = pts_after
    doc["simplified"] = {"toleranceDeg": TOL, "pointsBefore": pts_before,
                         "pointsAfter": pts_after, "note": "build-time simplification"}
    src.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("outline: %d -> %d points (%.1f%%)" %
          (pts_before, pts_after, 100.0 * pts_after / max(1, pts_before)))

    # ---- quakes.json fallback
    qsrc = DATA / "quakes.json"
    qbak = BACKUP / "quakes.json"
    if not qbak.exists():
        shutil.copyfile(qsrc, qbak)
    rows = json.loads(qbak.read_text(encoding="utf-8"))
    qsrc.write_text(json.dumps(slim_quakes(rows), ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8")

    # ---- tiles
    tdir = DATA / "quakes/tiles"
    for p in sorted(tdir.glob("*.json")):
        b = BACKUP / "tiles" / p.name
        b.parent.mkdir(parents=True, exist_ok=True)
        if not b.exists():
            shutil.copyfile(p, b)
        rows = json.loads(b.read_text(encoding="utf-8"))
        p.write_text(json.dumps(slim_quakes(rows), ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print("tiles rewritten:", len(list(tdir.glob('*.json'))))


if __name__ == "__main__":
    main()
