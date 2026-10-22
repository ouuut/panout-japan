"""Rebuild app/quake/data/quakes.json from the vendored tile set.

The tiles (app/quake/data/quakes/tiles/r_*.json) are the dataset the live map
draws; quakes.json used to be a separate, older snapshot, so the page claimed
40,079 hypocentres up to 2026-07 while the map showed data into August.
This script derives the canonical catalog from the tiles so every number on
the site (headline, poster, CSV, copy) comes from one source.

Run: python tools/rebuild_quake_catalog.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TILES = ROOT / "app/quake/data/quakes/tiles"
OUT = ROOT / "app/quake/data/quakes.json"

LON_MIN, LON_MAX = 120.0, 150.0
LAT_MIN, LAT_MAX = 20.0, 50.0
MIN_MAG = 4.0
SINCE = "2000-01-01"
FIELDS = ("id", "lon", "lat", "depthKm", "mag", "time", "place")


def main() -> None:
    events: dict[str, dict] = {}
    for path in sorted(TILES.glob("r_*.json")):
        for e in json.loads(path.read_text(encoding="utf-8")):
            if not (LON_MIN <= e["lon"] <= LON_MAX and LAT_MIN <= e["lat"] <= LAT_MAX):
                continue
            if e["mag"] < MIN_MAG or e["time"] < SINCE:
                continue
            events[e["id"]] = {k: e[k] for k in FIELDS if k in e}
    rows = sorted(events.values(), key=lambda e: e["time"])
    OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(rows)} events, {rows[0]['time'][:10]} .. {rows[-1]['time'][:10]} -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
