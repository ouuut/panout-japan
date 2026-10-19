#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fonts.py — subset CJK variable fonts to the site's own character set.

Inputs : .cache/fonts/NotoSansJP-VF.ttf, NotoSerifJP-VF.ttf
Output : site/assets/fonts/*.woff2 + @font-face CSS
Latin   : reused from ouuut-v2 assets/fonts (already small subsets)
"""
import hashlib
import shutil
from pathlib import Path

LATIN_DIR = Path("F:/projects/ouuut-v2/assets/fonts")

CJK = [
    ("noto-sans-jp-400", "NotoSansJP-VF.ttf", 400, "Noto Sans JP"),
    ("noto-serif-jp-400", "NotoSerifJP-VF.ttf", 400, "Noto Serif JP"),
]

LATIN = [
    ("InstrumentSerif-400-normal.woff2", "instrument-serif-400", "Instrument Serif", 400, "normal"),
    ("InstrumentSerif-400-italic.woff2", "instrument-serif-400i", "Instrument Serif", 400, "italic"),
    ("Geist-400-normal.woff2", "geist-400", "Geist", 400, "normal"),
    ("Geist-500-normal.woff2", "geist-500", "Geist", 500, "normal"),
    ("JetBrainsMono-400-normal.woff2", "jetbrains-mono-400", "JetBrains Mono", 400, "normal"),
    ("JetBrainsMono-500-normal.woff2", "jetbrains-mono-500", "JetBrains Mono", 500, "normal"),
]


def _subset_cjk(src, dst, text, weight):
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools import subset

    f = TTFont(str(src))
    if "fvar" in f:
        instantiateVariableFont(f, {"wght": weight}, inplace=True, updateFontNames=False)
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.drop_tables += ["DSIG", "SVG "]
    ss = subset.Subsetter(options=opts)
    ss.populate(text=text)
    ss.subset(f)
    f.flavor = "woff2"
    f.save(str(dst))


def build(charset, out_dir, cache_dir):
    out_dir = Path(out_dir)
    cache_dir = Path(cache_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = []
    faces = []
    for name, src_name, weight, family in CJK:
        src = cache_dir / src_name
        dst = out_dir / (name + ".woff2")
        if not src.exists():
            raise FileNotFoundError(str(src))
        _subset_cjk(src, dst, charset, weight)
        files.append(dst)
        faces.append((family, weight, "normal", dst.name))

    for src_name, name, family, weight, style in LATIN:
        src = LATIN_DIR / src_name
        if not src.exists():
            continue
        dst = out_dir / (name + ".woff2")
        shutil.copyfile(src, dst)
        files.append(dst)
        faces.append((family, weight, style, dst.name))

    h = hashlib.sha1()
    for p in files:
        h.update(p.read_bytes())
    ver = h.hexdigest()[:8]

    css = []
    for family, weight, style, fname in faces:
        css.append(
            "@font-face{font-family:'%s';font-style:%s;font-weight:%d;font-display:swap;"
            "src:url('/assets/fonts/%s?v=%s') format('woff2')}"
            % (family, style, weight, fname, ver))
    total = sum(p.stat().st_size for p in files)
    print("fonts:", len(files), "files,", total // 1024, "KB, ver", ver)
    return {"ver": ver, "faces": "\n".join(css), "total": total}
