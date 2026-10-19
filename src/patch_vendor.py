#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""patch_vendor.py — deterministic string patches on the frozen quake bundle.

The vendor file is the original dist bundle with a documented set of literal
replacements (see app/quake/view.js header). This script applies the shell-level
branding fixes that cannot be done from outside the bundle.
"""
from pathlib import Path

P = Path(__file__).resolve().parent.parent / "app/quake/vendor/quake-core.js"

REPLACEMENTS = [
    ("quake.japan.ouuut.com", "japan.ouuut.com", 2),
    ("数据来源", "出典", 1),
    ("刷新网页重新开始", "ページを再読み込み", 1),
]


def main():
    s = P.read_text(encoding="utf-8")
    for old, new, expect in REPLACEMENTS:
        n = s.count(old)
        if n != expect:
            print("skip %r: found %d, expected %d" % (old, n, expect))
            continue
        s = s.replace(old, new)
        print("patched %r -> %r" % (old, new))
    P.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    main()
