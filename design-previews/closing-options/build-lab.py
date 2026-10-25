"""Build an isolated design lab from the actual generated homepage.

This never edits the production generator or site/index.html. It publishes an
isolated lab under site/design-previews/ so the real site assets are reused.
All six plates, their translations, fonts, navigation and links are cloned
from site/index.html. Only the region below .hp-band and the footer vary.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / "site" / "design-previews" / "closing-options"
SOURCE_HERE = Path(__file__).resolve().parent
LAB_VERSION = hashlib.sha256(
    (SOURCE_HERE / "lab.css").read_bytes() + (SOURCE_HERE / "lab.js").read_bytes()
).hexdigest()[:12]
HERE.mkdir(parents=True, exist_ok=True)
source = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
dictionary = json.loads((ROOT / "site" / "assets" / "i18n.json").read_text(encoding="utf-8"))
by_key = {key: [value[lang] for lang in ("ja", "zh", "en")] for key, value in dictionary.items()}
assert all(set(value) == {"ja", "zh", "en"} for value in dictionary.values()), "Expected every source key to carry ja, zh and en."
required = ["<main", "hp-band", "hp-scales", "hp-method", 'class="foot"', "/assets/shell.js"]
assert all(item in source for item in required), "The generated homepage contract changed; rebuild the lab after mapping it."


def grab(pattern: str) -> str:
    match = re.search(pattern, source, re.S)
    assert match, f"Missing production fragment: {pattern}"
    return match.group(0)


def balanced(start_pattern: str, tag: str) -> str:
    start = re.search(start_pattern, source, re.S)
    assert start, f"Missing production fragment: {start_pattern}"
    depth = 0
    for match in re.finditer(rf'<(/?){tag}\b[^>]*>', source[start.start():], re.S):
        depth += -1 if match.group(1) else (0 if match.group(0).endswith('/>') else 1)
        if depth == 0:
            return source[start.start():start.start() + match.end()]
    raise AssertionError(f"Unclosed production fragment: {start_pattern}")


mast = grab(r'<header class="masthead">.*?</header>') + balanced(r'<div class="mobile-menu"', 'div')
band = grab(r'<section class="wrap hp-band".*?</section>')
scales = grab(r'<section class="wrap hp-scales">.*?</section>')
method = grab(r'<section class="wrap hp-method">.*?</section>')
footer = grab(r'<footer class="foot">.*?</footer>')
wordmark = grab(r'<a class="wordmark".*?</a>')
build_date = re.search(r'<span data-t="foot.built">.*?</span> · ([^<]+)</span>', footer).group(1)
cards = []
starts = list(re.finditer(r'<(?:a|div) class="hp-entry(?: hp-entry-soon)?"[^>]*>', band))
assert len(starts) == 6, "The six-plate production contract changed."
for start in starts:
    depth = 0
    end = None
    for tag in re.finditer(r'<(/?)(a|div)\b[^>]*>', band[start.start():]):
        closing, name = tag.group(1), tag.group(2)
        depth += -1 if closing else (0 if tag.group(0).endswith('/>') else 1)
        if depth == 0:
            end = start.start() + tag.end()
            break
    assert end, f"Unclosed card at {start.start()}"
    fragment = band[start.start():end]
    num = re.search(r'class="hp-num">(.*?)</span>', fragment).group(1)
    verb = re.search(r'class="hp-verb" data-t="([^"]+)">(.*?)</span>', fragment)
    topic = re.search(r'class="hp-topic" data-t="([^"]+)">(.*?)</span>', fragment)
    href = re.match(r'<a class="hp-entry" href="([^"]+)"', fragment)
    cards.append({
        "num": num, "verb": verb.group(1), "topic": topic.group(1),
        "href": href.group(1) if href else None,
    })
assert len(cards) == 6 and sum(bool(c["href"]) for c in cards) == 4

extra = {
    "lab.method": ["方法と出典", "方法与出处", "Method & sources"],
    "lab.details": ["出典と計算方法", "出处与计算方法", "Sources and counting rules"],
    "lab.definitions": ["計算方法", "计算方法", "Counting rules"],
    "lab.definitions.copy": [
        "地震はM4以上・27年分、犯罪率は人口1,000人当たり、支持率は月内全調査の算術平均。住宅は町名ごとの平均㎡単価。補間や面積での絞り込みはしない。",
        "地震取 M4 以上、27 年；犯罪率按每千人；支持率取月内全部调查的算术平均；住宅按町名计算平均㎡单价。不插值，也不按面积筛选。",
        "Earthquakes are M4+ over 27 years. Crime is per 1,000 residents; cabinet approval is the arithmetic mean of all polls in a month. Housing is mean price per square metre by town. No interpolation or area filter.",
    ],
    "lab.quake.title": ["地震", "地震", "Earthquakes"],
    "lab.quake.source": ["USGS ComCat", "USGS ComCat", "USGS ComCat"],
    "lab.quake.copy": ["2000年からM4以上、40,145の震源。", "2000 年至今 M4 以上，共 40,145 个震源。", "40,145 M4+ hypocentres since 2000."],
    "lab.crime.title": ["犯罪", "犯罪", "Crime"],
    "lab.crime.source": ["警視庁", "警视厅", "Tokyo Metropolitan Police"],
    "lab.crime.copy": ["2025年、東京62区市町村・5,234町丁。", "2025 年，东京 62 区市町村、5,234 町丁。", "2025; 62 municipalities, 5,234 Tokyo neighbourhoods."],
    "lab.cabinet.title": ["内閣", "内阁", "Cabinet"],
    "lab.cabinet.source": ["NHK・各社世論調査", "NHK・各社民调", "NHK and media polls"],
    "lab.cabinet.copy": ["14内閣、331か月、644の調査。", "14 届内阁、331 个月、644 次调查。", "14 cabinets, 331 months, 644 polls."],
    "lab.housing.title": ["住宅", "住宅", "Housing"],
    "lab.housing.source": ["国土交通省 PDL 1.0", "国土交通省 PDL 1.0", "MLIT / PDL 1.0"],
    "lab.housing.copy": ["2025Q2–2026Q1、東京の中古マンション等の成約26,416件。", "2025Q2–2026Q1，东京二手公寓等共 26,416 笔成交。", "26,416 used-flat transactions in Tokyo, 2025Q2–2026Q1."],
    "lab.c.lede": [
        "数字の意味は、数え方で変わる。出典と集計の前提を、各章と合わせて示す。",
        "数字的意义取决于怎么数。这里说明出处与统计前提，细则见各章。",
        "Numbers change meaning with the counting rule. Sources and assumptions are summarised here; each chapter documents the details.",
    ],
    "lab.compiled": ["出典は各章に記載。本站が一次資料から加工・静的生成。", "各章列出出处。本站根据一次资料加工并静态生成。", "Sources are named in each chapter. Compiled from primary sources and statically generated."],
}


def text(key: str, value: dict[str, list[str]] = by_key) -> str:
    assert key in value, f"Missing source key {key}"
    return f'<span data-t="{key}">{value[key][0]}</span>'


def title(extra_class: str, level: str = "h1", key: str = "cover.title") -> str:
    return f'<{level} class="{extra_class}" data-t="{key}">{by_key[key][0]}</{level}>'


def provenance(modifier: str, details_heading: bool) -> str:
    sources = []
    for key in ("quake", "crime", "cabinet", "housing"):
        sources.append(
            f'<article class="oc-source"><h2>{text(f"lab.{key}.title", extra)}'
            f'<span>—</span>{text(f"lab.{key}.source", extra)}</h2>'
            f'<p>{text(f"lab.{key}.copy", extra)}</p></article>'
        )
    heading = f'<h2 class="oc-kicker">{text("lab.definitions", extra)}</h2>' if details_heading else ""
    return (
        f'<div class="oc-method {modifier}">'
        f'<p class="oc-kicker">{text("lab.method", extra)}</p>'
        f'<p class="oc-method-copy">{text("cover.section.sub")}</p>'
        f'<div class="oc-sources">'
        f'<button class="oc-disclosure" type="button" aria-expanded="false" aria-controls="sources-{modifier}">{text("lab.details", extra)}<span class="oc-details-icon" aria-hidden="true">+</span></button>'
        f'<div class="oc-sources-content" id="sources-{modifier}" hidden>'
        f'<div class="oc-sources-list">{"".join(sources)}</div>'
        f'<div class="oc-source oc-definitions">{heading}'
        f'<p>{text("lab.definitions.copy", extra)}</p><p>{text("lab.compiled", extra)}</p></div>'
        f'</div></div></div>'
    )


scale_rows = []
for card in cards:
    action = '<span class="oc-scale-action">↗</span>' if card["href"] else f'<span class="oc-scale-action">{text("card.soon")}</span>'
    row = (
        f'<span class="oc-scale-num">{card["num"]}</span>'
        f'<span class="oc-scale-name"><span class="oc-scale-verb">{text(card["verb"])}</span>'
        f'<span class="oc-scale-topic">{text(card["topic"])}</span></span>'
        f'{action}'
    )
    tag = "a" if card["href"] else "div"
    href = f' href="{card["href"]}"' if card["href"] else ""
    scale_rows.append(f'<{tag} class="oc-scale"{href}>{row}</{tag}>')


def closing_footer(variant: str) -> str:
    return (
        f'<footer class="foot lab-footer lab-footer-variant" data-footer-variant="{variant}">'
        f'<div class="wrap foot-in"><div class="foot-top">{wordmark}</div>'
        f'<div class="foot-bottom">'
        f'<span><a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>'
        f' · {text("foot.built")} · {build_date}</span></div></div></footer>'
    )


variants = {
    "current": scales + method + footer,
    "a": (
        f'<section class="oc-close oc-a wrap" data-design="a">{title("oc-a-title")}{provenance("a", False)}</section>'
        + closing_footer("a")
    ),
    "b": (
        f'<section class="oc-close oc-b wrap" data-design="b"><div class="oc-b-intro">'
        f'<p class="oc-kicker">SIX SCALES / JAPAN</p>{title("oc-b-title")}</div>'
        f'<div class="oc-b-index"><nav aria-label="Six scales">{"".join(scale_rows)}</nav>{provenance("b", False)}</div></section>'
        + closing_footer("b")
    ),
    "c": (
        f'<section class="oc-close oc-c wrap" data-design="c"><div class="oc-c-panel">'
        f'<div><p class="oc-kicker">PRIMARY SOURCES / STATIC BUILD</p>{title("oc-c-title", key="m.h1")}'
        f'<p class="oc-c-lede">{text("lab.c.lede", extra)}</p></div>'
        f'<div class="oc-c-method"><div class="oc-sources">'
        f'<button class="oc-disclosure" type="button" aria-expanded="true" aria-controls="sources-c">{text("lab.details", extra)}<span class="oc-details-icon" aria-hidden="true">×</span></button>'
        f'<div class="oc-sources-content" id="sources-c">'
        f'<div class="oc-sources-list">'
        + "".join(
            f'<article class="oc-source"><h2>{text(f"lab.{key}.title", extra)}<span>—</span>'
            f'<a href="/{key}/">{text(f"lab.{key}.source", extra)} ↗</a></h2>'
            f'<p>{text(f"lab.{key}.copy", extra)}</p></article>'
            for key in ("quake", "crime", "cabinet", "housing")
        )
        + f'</div><div class="oc-source oc-definitions"><h2 class="oc-kicker">{text("lab.definitions", extra)}</h2>'
        f'<p>{text("lab.definitions.copy", extra)}</p><p>{text("lab.compiled", extra)}</p></div></div></div></div></div></section>'
        + closing_footer("c")
    ),
    "d": (
        f'<section class="oc-close oc-d wrap" data-design="d">'
        f'{title("oc-d-title")}{provenance("d", True)}</section>'
        + closing_footer("d")
    ),
}
for key, markup in variants.items():
    variants[key] = f'<div class="lab-design" data-variant="{key}" hidden>' + markup + "</div>"

# Start after the boot script so the saved theme applies before the toolbar paints.
prefix = source.split('<header class="masthead">', 1)[0]
prefix = prefix.replace('</head>', f'<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="/design-previews/closing-options/lab.css?v={LAB_VERSION}">\n</head>')
toolbar = """
<div class="lab-toolbar" role="region" aria-label="设计方案对照工具">
  <div class="lab-toolbar-top">
    <div class="lab-toolbar-title">六张卡片以下 / 设计方案</div>
    <div class="lab-options" role="group" aria-label="选择方案">
      <button class="lab-option" type="button" data-select-variant="current" aria-pressed="false">现状</button>
      <button class="lab-option" type="button" data-select-variant="a" aria-pressed="true">A 编辑宣言</button>
      <button class="lab-option" type="button" data-select-variant="b" aria-pressed="false">B 六尺度目录</button>
      <button class="lab-option" type="button" data-select-variant="c" aria-pressed="false">C 方法与出典</button>
      <button class="lab-option" type="button" data-select-variant="d" aria-pressed="false">D 一体收束</button>
    </div>
    <div class="lab-view-toggle" role="group" aria-label="预览宽度">
      <button class="lab-view-button" type="button" data-select-width="desktop" aria-pressed="true">桌面</button>
      <button class="lab-view-button" type="button" data-select-width="mobile" aria-pressed="false">390</button>
    </div>
  </div>
  <div class="lab-toolbar-sub"><span id="lab-description">只留一个大标题；方法说明与可展开出典安静退到右侧。</span><span class="lab-toolbar-hint">0–4 切方案 · ← → 顺序切换</span></div>
</div>
<div class="lab-stage"><div class="lab-viewport" id="lab-viewport">
"""
doc = (
    prefix + toolbar + mast + '<main id="main" class="hp">' + band
    + "".join(variants.values())
    + '</main></div></div>'
    + '<script type="application/json" id="lab-dictionary">'
    + json.dumps({key: {lang: value[i] for i, lang in enumerate(("ja", "zh", "en"))} for key, value in {**by_key, **extra}.items()}, ensure_ascii=False).replace("</", "<\\/")
    + '</script>\n<script>\n' + (SOURCE_HERE / "lab.js").read_text(encoding="utf-8") + '\n</script>\n'
    + '<script>\n' + (ROOT / "src" / "shell.js").read_text(encoding="utf-8") + '\n</script>\n</body></html>'
)
for asset in ("lab.css", "lab.js"):
    (HERE / asset).write_text((SOURCE_HERE / asset).read_text(encoding="utf-8"), encoding="utf-8")
(HERE / "index.html").write_text(doc, encoding="utf-8")
print(f"Built {HERE / 'index.html'}: {len(doc):,} chars, 6 real plates, 5 options including baseline.")
