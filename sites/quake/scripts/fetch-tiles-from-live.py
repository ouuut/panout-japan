import json, os, urllib.request, time

BASE = "https://3d.saaaai.com/data/quakes"
OUT = r"F:/projects/panout-japan/app/quake/data/quakes"
os.makedirs(os.path.join(OUT, "tiles"), exist_ok=True)

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

man = json.loads(get(BASE + "/manifest.json"))
deg = man.get("tileDeg", 20)
# 日本视野（含列岛+近海+千岛/台湾/马里亚纳边）：lon 118..158, lat 12..52
LON0, LON1, LAT0, LAT1 = 118, 158, 12, 52
keep = []
for t in man["tiles"]:
    lon0, lat0 = t["lon0"], t["lat0"]
    if lon0 + deg > LON0 and lon0 < LON1 and lat0 + deg > LAT0 and lat0 < LAT1:
        keep.append(t)
keys = {t["key"] for t in keep}
boot = [k for k in man.get("japanBootstrapKeys", []) if k not in keys]
for k in boot:
    for t in man["tiles"]:
        if t["key"] == k:
            keep.append(t); keys.add(k)
print("tiles kept:", len(keep), "of", len(man["tiles"]))

total = 0
got = 0
for t in keep:
    for pre, flag in (("r", "hasRecent"), ("a", "hasArchive")):
        if not t.get(flag):
            continue
        u = f"{BASE}/tiles/{pre}_{t['key']}.json"
        try:
            b = get(u)
            open(os.path.join(OUT, "tiles", f"{pre}_{t['key']}.json"), "wb").write(b)
            total += len(b); got += 1
        except Exception as e:
            print("MISS", u, e)
man2 = dict(man)
man2["tiles"] = keep
man2["totals"] = {"note": "trimmed to Japan region for panout single-page", "tiles": len(keep)}
json.dump(man2, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("tile files:", got, "bytes:", total, "=", round(total/1048576, 1), "MB")
