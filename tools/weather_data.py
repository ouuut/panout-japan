#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch and normalize the official JMA forecast snapshot used by /weather/.

This is the production data path. It deliberately does not fetch Natural Earth
or rebuild geo.js: the 47-prefecture geometry is static and only changes when
the map itself is reworked.

The output contract is exactly window.WEATHER_DATA, consumed by
src/weather/app.js. Keep the shape stable; app.js and the no-JS fallback both
depend on it.
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import hashlib
import json
import time
import urllib.request
from collections import Counter
from pathlib import Path

JMA = "https://www.jma.go.jp/bosai"
AREA_URL = f"{JMA}/common/const/area.json"
UA = "PanOutJapan-WeatherRefresh/1.0 (+https://japan.ouuut.com/weather/)"
JST = dt.timezone(dt.timedelta(hours=9))

ZH = {
    "01": "北海道", "02": "青森县", "03": "岩手县", "04": "宫城县", "05": "秋田县",
    "06": "山形县", "07": "福岛县", "08": "茨城县", "09": "栃木县", "10": "群马县",
    "11": "埼玉县", "12": "千叶县", "13": "东京都", "14": "神奈川县", "15": "新潟县",
    "16": "富山县", "17": "石川县", "18": "福井县", "19": "山梨县", "20": "长野县",
    "21": "岐阜县", "22": "静冈县", "23": "爱知县", "24": "三重县", "25": "滋贺县",
    "26": "京都府", "27": "大阪府", "28": "兵库县", "29": "奈良县", "30": "和歌山县",
    "31": "鸟取县", "32": "岛根县", "33": "冈山县", "34": "广岛县", "35": "山口县",
    "36": "德岛县", "37": "香川县", "38": "爱媛县", "39": "高知县", "40": "福冈县",
    "41": "佐贺县", "42": "长崎县", "43": "熊本县", "44": "大分县", "45": "宫崎县",
    "46": "鹿儿岛县", "47": "冲绳县",
}
REGION_JA_BY_CENTER = {
    "010100": "北海道", "010200": "東北", "010300": "関東",
    "010400": "中部", "010500": "中部", "010600": "近畿",
    "010700": "中国", "010800": "四国", "010900": "九州",
    "011000": "九州", "011100": "沖縄",
}
DISPLAY_NAME = {
    "01": ("北海道", "Hokkaido"),
    "46": ("鹿児島県", "Kagoshima"),
    "47": ("沖縄県", "Okinawa"),
}
CATEGORIES = {"clear", "cloud", "rain", "snow", "thunder"}
OFFICE_OVERRIDES = {"01": "016000", "46": "460100", "47": "471000"}


def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def today_jst() -> str:
    return dt.datetime.now(JST).date().isoformat()


def fetch(name: str, url: str, cache_dir: Path, refresh: bool = True) -> dict:
    """Fetch one JSON resource, or reuse a validated cache entry.

    Cache is evidence and an offline test aid; production runs use refresh=True
    and therefore always obtain a current JMA product.
    """
    target = cache_dir / name
    if not refresh and target.exists():
        raw = target.read_bytes()
        json.loads(raw)
        return {"name": name, "url": url, "bytes": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(), "cached": True}

    error = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as response:
                raw = response.read()
            json.loads(raw)
            target.write_bytes(raw)
            return {"name": name, "url": url, "bytes": len(raw),
                    "sha256": hashlib.sha256(raw).hexdigest(), "cached": False}
        except Exception as exc:  # network, HTTP, or malformed JSON
            error = exc
            if attempt < 2:
                time.sleep(1.0 * (2 ** attempt))
    raise RuntimeError(f"Failed after 3 attempts: {url}: {error}")


def number(value):
    if value is None or value == "":
        return None
    return int(value)


def category(code: str) -> str:
    if not code or not code.isdigit():
        raise ValueError(f"Missing/invalid official weather code: {code!r}")
    if code in {"350", "450"}:
        return "thunder"
    return {"1": "clear", "2": "cloud", "3": "rain", "4": "snow"}.get(code[0], "")


def area_by_code(series: dict, code: str) -> dict:
    for area in series.get("areas", []):
        if area["area"]["code"] == code:
            return area
    raise ValueError(f"Area {code} absent from time series")


def aligned_temperatures(block: dict, weekly_dates: list[str]) -> tuple[dict, dict, dict]:
    weather_series, temp_series = block["timeSeries"][:2]
    code = weather_series["areas"][0]["area"]["code"]
    weather_area = area_by_code(weather_series, code)
    temp_area = area_by_code(temp_series, temp_series["areas"][0]["area"]["code"])
    dates = [value[:10] for value in weather_series["timeDefines"]]
    if dates != weekly_dates:
        raise ValueError(f"Weekly weather/temp date axes differ: {dates} != {weekly_dates}")
    temps = {date: {"high": None, "low": None} for date in dates}
    for date, high, low in zip(dates, temp_area.get("tempsMax", []), temp_area.get("tempsMin", [])):
        temps[date] = {"high": number(high), "low": number(low)}
    return temps, weather_area, temp_area


def short_temperatures(block: dict, preferred_station: str) -> tuple[dict, dict]:
    temp_series = next((ts for ts in block["timeSeries"] if "temps" in ts.get("areas", [{}])[0]), None)
    if not temp_series:
        return {}, {}
    station = area_by_code(temp_series, preferred_station)
    result = {}
    values = station.get("temps", [])
    # JMA's own Short.Table renderer maps a 05/11 JST report to today's high
    # (temps[0]) and tomorrow's low/high (temps[2]/[3]); a 17 JST report maps
    # today's low/high to temps[0]/[1]. Never infer positions from intuition.
    report = dt.datetime.fromisoformat(block["reportDatetime"])
    report_hour = report.hour
    day = report.date()
    if report_hour >= 17 or report_hour < 5:
        if len(values) >= 2:
            result[day.isoformat()] = {"high": number(values[1]), "low": number(values[0])}
    else:
        if values:
            result[day.isoformat()] = {"high": number(values[0]), "low": None}
        if len(values) >= 4:
            result[(day + dt.timedelta(days=1)).isoformat()] = {"high": number(values[3]), "low": number(values[2])}
    return result, station


def current_pop(block: dict, subarea: str) -> dict:
    pop_series = next((ts for ts in block["timeSeries"] if "pops" in ts.get("areas", [{}])[0]), None)
    if not pop_series:
        return {"value": None, "start": None, "end": None}
    area = area_by_code(pop_series, subarea)
    report = dt.datetime.fromisoformat(block["reportDatetime"])
    selected = None
    for index, timestamp in enumerate(pop_series["timeDefines"]):
        instant = dt.datetime.fromisoformat(timestamp)
        if instant.date().isoformat() != report.date().isoformat():
            continue
        # At 05 JST the 06-12 period is the next useful human-facing interval.
        # Later products use the report's current six-hour interval.
        if instant <= report:
            selected = index
        elif selected is None:
            selected = index
    if selected is None:
        return {"value": None, "start": None, "end": None}
    start = pop_series["timeDefines"][selected]
    if selected + 1 < len(pop_series["timeDefines"]):
        end = pop_series["timeDefines"][selected + 1]
    else:
        end = (dt.datetime.fromisoformat(start) + dt.timedelta(hours=6)).isoformat()
    return {"value": number(area["pops"][selected]), "start": start, "end": end}


def build_regions(area: dict, forecasts: dict, overviews: dict) -> list[dict]:
    # 016000 is 石狩地方 (Sapporo/Ishikari), the mainland Hokkaido reference.
    # 460100 explicitly excludes Amami; 460040 must never stand in for Kagoshima.
    selected = dict(OFFICE_OVERRIDES)
    for office in area["offices"]:
        selected.setdefault(office[:2], office)
    if set(selected) != set(ZH):
        raise ValueError(f"JMA prefecture mapping changed: {set(selected) ^ set(ZH)}")

    regions = []
    for prefix in sorted(selected):
        office_code = selected[prefix]
        office_meta = area["offices"][office_code]
        forecast = forecasts[office_code]
        if len(forecast) < 2:
            raise ValueError(f"No weekly forecast block for {office_code}")
        short, weekly = forecast[0], forecast[1]
        subarea = short["timeSeries"][0]["areas"][0]["area"]
        subarea_code = subarea["code"]
        if subarea_code not in office_meta["children"] and subarea_code not in area.get("class10s", {}):
            raise ValueError(f"Unaligned first subarea {subarea_code} for {office_code}")

        weather_series = short["timeSeries"][0]
        weather_area = area_by_code(weather_series, subarea_code)
        official_code = weather_area["weatherCodes"][0]
        weather_category = category(official_code)
        if not weather_category:
            raise ValueError(f"Uncategorized official code {official_code} for {office_code}")

        weekly_weather_series, _weekly_temp_series = weekly["timeSeries"][:2]
        weekly_area_code = weekly_weather_series["areas"][0]["area"]["code"]
        if weekly_area_code[:2] != office_code[:2]:
            raise ValueError(f"Short-range subarea {subarea_code} is not aligned with weekly area {weekly_area_code} for {office_code}")
        dates = [value[:10] for value in weekly_weather_series["timeDefines"]]
        if len(dates) != 7 or len(set(dates)) != 7:
            raise ValueError(f"Expected seven unique dates for {office_code}: {dates}")

        temps, weekly_weather, weekly_station = aligned_temperatures(weekly, dates)
        short_temps, short_station = short_temperatures(short, weekly_station["area"]["code"])
        today_date = short["reportDatetime"][:10]
        today = short_temps.get(today_date, {}).copy()
        # Prefer short-range station forecasts; use date-aligned weekly values
        # only when the short-range series explicitly lacks that day's value.
        today_high_source, today_low_source = short_station, short_station
        if today_date in temps:
            for kind in ("high", "low"):
                if today.get(kind) is None and temps[today_date][kind] is not None:
                    today[kind] = temps[today_date][kind]
                    if kind == "high":
                        today_high_source = weekly_station
                    else:
                        today_low_source = weekly_station
        today.setdefault("high", None)
        today.setdefault("low", None)

        week = []
        for index, date in enumerate(dates):
            code = weekly_weather["weatherCodes"][index]
            normalized = category(code)
            if not normalized:
                raise ValueError(f"Uncategorized weekly code {code} for {office_code}")
            week.append({
                "date": date, "code": normalized, "codeOfficial": code,
                "pop": number(weekly_weather.get("pops", [None] * 7)[index]),
                "high": temps[date]["high"], "low": temps[date]["low"],
                "reliability": weekly_weather.get("reliabilities", [""] * 7)[index] or None,
            })

        overview = overviews[office_code]
        center = area["centers"][office_meta["parent"]]
        display_name_ja, display_name_en = DISPLAY_NAME.get(prefix, (office_meta["name"], office_meta["enName"]))
        pop_period = current_pop(short, subarea_code)
        tomorrow_date = (dt.datetime.fromisoformat(short["reportDatetime"]).date() + dt.timedelta(days=1)).isoformat()
        regions.append({
            "id": office_code, "name": display_name_ja, "nameJa": display_name_ja,
            "nameEn": display_name_en, "nameZh": ZH[prefix],
            "forecastAreaName": office_meta["name"], "forecastAreaNameEn": office_meta["enName"],
            "region": center["enName"], "regionJa": REGION_JA_BY_CENTER[office_meta["parent"]],
            "sourceRegionJa": center["name"],
            "reportDatetime": short["reportDatetime"], "office": short["publishingOffice"],
            "sourceUrl": f"{JMA}/forecast/data/forecast/{office_code}.json",
            "areaName": subarea["name"], "sourceAreaCode": subarea_code,
            "weatherCode": weather_category, "weatherCodeOfficial": official_code,
            "weatherJa": weather_area["weathers"][0],
            "summaryJa": weather_area["weathers"][0],
            "tomorrowJa": weather_area["weathers"][1] if len(weather_area["weathers"]) > 1 else None,
            "tomorrowCodeOfficial": weather_area["weatherCodes"][1] if len(weather_area["weatherCodes"]) > 1 else None,
            "tomorrow": short_temps.get(tomorrow_date) or temps.get(tomorrow_date) or {"high": None, "low": None},
            "pop": pop_period["value"], "popPeriod": {"start": pop_period["start"], "end": pop_period["end"]},
            "today": today,
            "todaySourceAreaName": today_high_source.get("area", {}).get("name"),
            "todaySourceAreaCode": today_high_source.get("area", {}).get("code"),
            "todayLowSourceAreaName": today_low_source.get("area", {}).get("name"),
            "todayLowSourceAreaCode": today_low_source.get("area", {}).get("code"),
            "weekSourceWeatherAreaName": weekly_weather["area"]["name"],
            "weekSourceWeatherAreaCode": weekly_weather["area"]["code"],
            "week": week, "weekReportDatetime": weekly["reportDatetime"],
            "weekSourceAreaName": weekly_station["area"]["name"],
            "weekSourceAreaCode": weekly_station["area"]["code"],
            "overview": overview.get("text", ""),
            "overviewHeadline": overview.get("headlineText", ""),
            "overviewReportDatetime": overview["reportDatetime"],
            "overviewPublishingOffice": overview["publishingOffice"],
            "overviewSourceUrl": f"{JMA}/forecast/data/overview_forecast/{office_code}.json",
        })
    return regions


def build_snapshot(cache_dir: Path, refresh: bool = True) -> tuple[dict, dict]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    area_result = fetch("area.json", AREA_URL, cache_dir, refresh)
    area = json.loads((cache_dir / "area.json").read_text("utf-8"))

    selected = dict(OFFICE_OVERRIDES)
    for office in area["offices"]:
        selected.setdefault(office[:2], office)
    if set(selected) != set(ZH):
        raise ValueError("JMA office metadata does not map to 47 prefectures")
    office_codes = [selected[key] for key in sorted(selected)]

    jobs = [(f"forecast-{code}.json", f"{JMA}/forecast/data/forecast/{code}.json") for code in office_codes]
    jobs += [(f"overview-{code}.json", f"{JMA}/forecast/data/overview_forecast/{code}.json") for code in office_codes]
    results = [area_result]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(fetch, name, url, cache_dir, refresh) for name, url in jobs]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
    if len(results) != 95:
        raise ValueError(f"Unexpected resource count {len(results)}")

    forecasts = {code: json.loads((cache_dir / f"forecast-{code}.json").read_text("utf-8")) for code in office_codes}
    overviews = {code: json.loads((cache_dir / f"overview-{code}.json").read_text("utf-8")) for code in office_codes}
    generated_at = now_utc()
    regions = build_regions(area, forecasts, overviews)
    data = {"generatedAt": generated_at, "regions": regions}
    manifest = {
        "generatedAt": generated_at, "requested": len(results),
        "downloaded": sum(not item["cached"] for item in results),
        "cached": sum(item["cached"] for item in results),
        "resources": sorted(results, key=lambda item: item["name"]),
    }
    return data, manifest


def parse_js_object(path: Path, namespace: str) -> dict:
    text = path.read_text("utf-8")
    prefix, suffix = f"window.{namespace}=", ";\n"
    if not text.startswith(prefix) or not text.endswith(suffix):
        raise ValueError(f"Unexpected JavaScript wrapper in {path.name}")
    return json.loads(text[len(prefix):-len(suffix)])


def load_geo(path: Path) -> dict:
    geo = parse_js_object(path, "WEATHER_GEO")
    features = geo.get("features", [])
    if len(features) != 47 or len({f.get("id") for f in features}) != 47:
        raise ValueError("geo.js does not contain 47 unique prefecture features")
    return geo


def validate_snapshot(data: dict, geo: dict, expected_date: str | None = None) -> dict:
    regions, features = data["regions"], geo["features"]
    if len(regions) != 47 or len(features) != 47:
        raise ValueError(f"Expected 47 regions/features, got {len(regions)}/{len(features)}")
    if len({r["id"] for r in regions}) != 47 or len({f["id"] for f in features}) != 47:
        raise ValueError("Duplicate region or feature IDs")
    if {r["id"] for r in regions} != {f["id"] for f in features}:
        raise ValueError("Weather regions and geo features do not match")

    expected_date = expected_date or today_jst()
    stale = sorted({r["reportDatetime"][:10] for r in regions if r["reportDatetime"][:10] != expected_date})
    if stale:
        raise ValueError(f"Short-range reports are not for {expected_date}: {stale}")

    for region in regions:
        if region["weatherCode"] not in CATEGORIES:
            raise ValueError(f"Bad weather category for {region['id']}: {region['weatherCode']}")
        if len(region["week"]) != 7 or len({day["date"] for day in region["week"]}) != 7:
            raise ValueError(f"Bad seven-day axis for {region['id']}")
        if all(day["code"] not in CATEGORIES for day in region["week"]):
            raise ValueError(f"Bad weekly categories for {region['id']}")
        for day in region["week"]:
            if day["code"] not in CATEGORIES:
                raise ValueError(f"Bad weekly category for {region['id']}: {day['code']}")
            if day["high"] is not None and day["low"] is not None and day["high"] < day["low"]:
                raise ValueError(f"High < low for {region['id']} {day['date']}")
        today = region["today"]
        if today["high"] is not None and today["low"] is not None and today["high"] < today["low"]:
            raise ValueError(f"Today high < low for {region['id']}")
        period = region["popPeriod"]
        if period["start"] is None or period["end"] is None:
            raise ValueError(f"Missing pop period for {region['id']}")
        if dt.datetime.fromisoformat(period["end"]) <= dt.datetime.fromisoformat(period["start"]):
            raise ValueError(f"Bad pop period for {region['id']}")
        for key in ("nameJa", "nameEn", "nameZh", "reportDatetime", "overviewReportDatetime", "overviewPublishingOffice"):
            if not region.get(key):
                raise ValueError(f"Missing {key} for {region['id']}")

    if next(r for r in regions if r["id"][:2] == "01")["id"] != "016000":
        raise ValueError("Hokkaido office changed")
    if next(r for r in regions if r["id"][:2] == "46")["id"] != "460100":
        raise ValueError("Kagoshima office changed")
    if next(r for r in regions if r["id"][:2] == "47")["id"] != "471000":
        raise ValueError("Okinawa office changed")
    if next(r for r in regions if r["id"] == "016000")["nameJa"] != "北海道":
        raise ValueError("Hokkaido display name changed")

    missing = {
        "todayHigh": sum(r["today"]["high"] is None for r in regions),
        "todayLow": sum(r["today"]["low"] is None for r in regions),
        "todayPop": sum(r["pop"] is None for r in regions),
        "weekHigh": sum(day["high"] is None for r in regions for day in r["week"]),
        "weekLow": sum(day["low"] is None for r in regions for day in r["week"]),
        "weekPop": sum(day["pop"] is None for r in regions for day in r["week"]),
        "weekReliability": sum(day["reliability"] is None for r in regions for day in r["week"]),
        "emptyOverviewText": sum(not r["overview"] for r in regions),
        "missingTomorrowJa": sum(r.get("tomorrowJa") is None for r in regions),
    }
    # These are completeness floors, not attempts to invent missing JMA values.
    if missing["todayHigh"] > 7:
        raise ValueError(f"Too many missing todayHigh values: {missing['todayHigh']}")
    if missing["todayPop"] > 7:
        raise ValueError(f"Too many missing todayPop values: {missing['todayPop']}")
    if missing["emptyOverviewText"] > 2:
        raise ValueError(f"Too many empty overviews: {missing['emptyOverviewText']}")

    return {
        "generatedAt": data["generatedAt"], "regions": len(regions),
        "geometries": len(features), "weatherCategories": dict(Counter(r["weatherCode"] for r in regions)),
        "missing": missing,
    }


def write_data_js(data: dict, path: Path) -> None:
    payload = "window.WEATHER_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(payload, encoding="utf-8")
    tmp.replace(path)


def write_notes(data: dict, report: dict, manifest: dict, path: Path) -> None:
    times = [r["reportDatetime"] for r in data["regions"]]
    lines = [
        "# Weather snapshot", "",
        f"Generated at **{data['generatedAt']}**; this is a static JMA forecast snapshot, not live observations.", "",
        "## Fetch", "",
        f"- {manifest['requested']} JMA resources requested; downloaded **{manifest['downloaded']}**, reused cache **{manifest['cached']}**.",
        "- Short-range report timestamps: **" + min(times) + "** through **" + max(times) + "** (JST offsets preserved).",
        "- The static map geometry in `geo.js` is not refetched by the daily job.", "",
        "## Validation", "",
        f"- Regions **{report['regions']}**, geometries **{report['geometries']}**, categories `{json.dumps(report['weatherCategories'], ensure_ascii=False)}`.",
        f"- Missing values: `{json.dumps(report['missing'], ensure_ascii=False)}`.",
        "- `null` means JMA did not issue the value. No temperature, precipitation probability, reliability, observation or overview is invented.",
        "- `week[0]` is the day after the report date; the UI renders today from `today`/`pop` and the next six days from `week`.",
        "- Daytime short-range products (05:00–16:00 JST) do not publish today's minimum; `todayLow` is therefore normally null.",
        "- Source: 気象庁 (JMA) forecast JSON; attribution and source links are rendered on `/weather/`.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
