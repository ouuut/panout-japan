import urllib.request, os

os.makedirs('.cache/fonts', exist_ok=True)
urls = {
 'NotoSansJP-VF.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
 'NotoSerifJP-VF.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifjp/NotoSerifJP%5Bwght%5D.ttf',
}
for name, u in urls.items():
    p = '.cache/fonts/' + name
    if os.path.exists(p) and os.path.getsize(p) > 1_000_000:
        print('have', name, os.path.getsize(p)); continue
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=180) as r, open(p, 'wb') as f:
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        print('ok', name, os.path.getsize(p))
    except Exception as e:
        print('fail', name, e)
