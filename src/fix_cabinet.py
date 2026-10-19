#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fix_cabinet.py — 修正 NHK 2008/2009 交接月列错位 + 标注同月双调查。

输入：src/data-cabinet-v8.2-backup.json（原始 642 点）
输出：app/cabinet/data.json (v8.3)，并留 _meta.fix_log。

两处修正：

1) NHK 列错位（硬错误）。NHK 放送文化研究所年度表在政权交接月有
   「9月」与「9月(緊)」两列（2008/2009 共 13 列）。原抓取按 12 个月枚举，
   导致 9 月取到緊急值、10-12 月整体右移一位、真 12 月值丢失。
   实测：站点 2009-09 麻生=72（真值 15，72 是鳩山緊急调查）；
        2008-09 福田=48（真值 20）。
   修法：删 8 条错行，按真实调查起始日补 10 条（9 月常规与 9 月緊各成一点）。

2) 重复冲突行（10 组）。经日経官方数据源
   https://vdata.nikkei.com/assets/newsgraphics/cabinet-approval-rating-v2/data/historical.json
   核对：同月两个值 = 「定例世論調査」与「緊急世論調査」两场不同调查，均为真值。
   修法：不再删行，改为写入 kind 字段（定例/緊急）并保留两条。
"""
import json, io
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKUP = Path(__file__).resolve().parent / "data-cabinet-v8.2-backup.json"
DATA = ROOT / "app" / "cabinet" / "data.json"

DROP_NHK = {"2008-09", "2008-10", "2008-11", "2008-12",
            "2009-09", "2009-10", "2009-11", "2009-12"}

ADD_NHK = [
    ("2008-09-07", "福田康夫", 20, "9月通常 9/5-7"),
    ("2008-09-27", "麻生太郎", 48, "9月(緊) 9/26-28"),
    ("2008-10-12", "麻生太郎", 46, "10月 10/11-13"),
    ("2008-11-08", "麻生太郎", 49, "11月 11/7-9"),
    ("2008-12-06", "麻生太郎", 25, "12月 12/5-7"),
    ("2009-09-05", "麻生太郎", 15, "9月通常 9/4-6"),
    ("2009-09-19", "鳩山由紀夫", 72, "9月(緊) 9/18-20"),
    ("2009-10-11", "鳩山由紀夫", 70, "10月 10/10-12"),
    ("2009-11-07", "鳩山由紀夫", 65, "11月 11/6-8"),
    ("2009-12-12", "鳩山由紀夫", 56, "12月 12/11-13"),
]

# 同月双调查：date|pm → (kind, 官方两值)，来自日経 historical.json
NIKKEI_TWIN = {
    ("2004-09-01", "小泉純一郎"): ("日経3000人調査 / 日経緊急調査基本", [42.0, 44.0]),
    ("2005-08-01", "小泉純一郎"): ("日経緊急調査 / 日経緊急世論調査", [47.0, 49.0]),
    ("2008-05-01", "福田康夫"):   ("緊急世論調査5月 / 定例世論調査5月", [21.0, 24.0]),
    ("2008-08-01", "福田康夫"):   ("定例世論調査8月 ×2", [38.0, 29.0]),
    ("2009-07-01", "麻生太郎"):   ("緊急世論7月調査 / 緊急世論7月調査2", [21.0, 20.0]),
    ("2012-11-01", "野田佳彦"):   ("定例世論調査11月 / 緊急世論調査11月", [27.0, 23.0]),
    ("2014-09-01", "安倍晋三(2次)"): ("緊急世論調査9月 / 定例世論調査9月", [60.0, 53.0]),
    ("2015-10-01", "安倍晋三(2次)"): ("緊急世論調査10月 / 定例世論調査10月", [44.0, 41.0]),
    ("2016-05-01", "安倍晋三(2次)"): ("定例世論調査4月 / 定例世論調査5月", [53.0, 56.0]),
    ("2016-08-01", "安倍晋三(2次)"): ("緊急世論調査8月 / 定例世論調査8月", [58.0, 62.0]),
}


def main():
    doc = json.loads(io.open(BACKUP, encoding="utf-8").read())
    polls = doc["polls"]

    kept = [p for p in polls
            if not (p["source"] == "NHK世論調査" and p["date"][:7] in DROP_NHK)]
    dropped = len(polls) - len(kept)

    for dt, pm, val, note in ADD_NHK:
        kept.append({
            "date": dt, "pm": pm, "value": float(val),
            "source": "NHK世論調査",
            "url": "https://www.nhk.or.jp/bunken/yoron/political/%s.html" % dt[:4],
            "derived": False, "kind": "月次",
        })

    # 同月双调查：标注 kind（不再删行）
    twins = 0
    seen = {}
    for p in sorted(kept, key=lambda x: x["date"]):
        key = (p["date"], p["pm"])
        if p["source"] == "日経世論調査" and key in NIKKEI_TWIN:
            label, _v = NIKKEI_TWIN[key]
            seen[key] = seen.get(key, 0) + 1
            p["kind"] = label.split(" / ")[min(seen[key] - 1, 1)] if " / " in label else label
            p["twin"] = True
            twins += 1

    kept.sort(key=lambda x: x["date"])
    doc["polls"] = kept
    meta = doc.setdefault("_meta", {})
    meta["version"] = "8.3-nhk-column-fix"
    meta["real_source_count"] = len(kept)
    meta["description"] = ("日本内閣支持率 1998→ 月度线（多源按月平均）："
                           "NHK放送文化研究所 2000-2017（整数）+ NHK選挙WEB 2018-2026（小数）"
                           "+ 日経/朝日/時事/読売/JNN/共同 各社月次。"
                           "每月 = 当月所有已收录真实调查值的算术平均，禁断线。")
    meta.setdefault("fix_log", []).append({
        "date": "2026-10-19",
        "what": "NHK 2008/2009 交接月列错位修正；同日経同月双调查标注",
        "nhk_rows_dropped": dropped,
        "nhk_rows_added": len(ADD_NHK),
        "nikkei_twins_flagged": twins,
        "evidence_nhk": "NHK放送文化研究所 政治意識月例調査 2008/2009 年度表（9月 / 9月(緊) 双列）",
        "evidence_nikkei": ("https://vdata.nikkei.com/assets/newsgraphics/"
                            "cabinet-approval-rating-v2/data/historical.json"),
        "note": ("9月常规与9月(緊)各保留为独立调查点；10-12月回到真实列；真12月值恢复。"
                 "同月两条日経不是重复录入，而是定例+緊急两场不同调查，两条都计入当月平均。"),
    })

    io.open(DATA, "w", encoding="utf-8").write(
        json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print("rows: %d -> %d (nhk -%d +%d, nikkei twins %d)" %
          (len(polls), len(kept), dropped, len(ADD_NHK), twins))


if __name__ == "__main__":
    main()
