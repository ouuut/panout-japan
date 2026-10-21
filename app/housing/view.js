// 住宅 —— 与犯罪率地图同一套模板（工具栏 / 右侧卡片 / 左下分布仪 / 缩放条）。
// 数据粒度 = 官方最小定位单位「町名（地区名）」；数值 = 该町成約価格の平均。
// 不做面积筛选、不算中位数、不做 70㎡ 换算。

const HSG_LEAFLET_JS = ["/app/housing/vendor/leaflet.js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
const HSG_LEAFLET_CSS = ["/app/housing/vendor/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];
const HSG_CSS_HREF = "/app/housing/app.css";

const SKELETON = `
<div id="hsg-app-loader" role="progressbar" aria-label="loading"><div class="loader-inner"><div class="loader-radar"><div class="radar-sweep"></div><div class="radar-dot"></div></div><div class="loader-title" id="hsg-loader-title"></div><div class="loader-status" id="hsg-loader-status"></div></div></div>
<div id="hsg-map"></div>
<div id="hsg-drop"></div>
<div id="hsg-zoom-slider"><span class="zs-cap" id="hsg-zsPlus" title="+">+</span><div class="zs-track" id="hsg-zsTrack"><div class="zs-fill" id="hsg-zsFill"></div><div class="zs-thumb" id="hsg-zsThumb"></div></div><span class="zs-cap" id="hsg-zsMinus" title="-">-</span></div>
<aside id="hsg-legend-instrument"><div class="inst-header"><span class="inst-title" id="hsg-inst-title"></span><span class="inst-readout" id="hsg-inst-readout"></span></div><div class="inst-hist-wrap"><svg id="hsg-hist-svg" viewBox="0 0 332 22" preserveAspectRatio="none"></svg><div id="hsg-hist-cursor"></div></div><div class="inst-bar" id="hsg-legendBarDiv"></div><div class="inst-ticks" id="hsg-legendTicks"></div></aside>
<aside id="hsg-card"></aside>
<svg id="hsg-lx-svg"></svg><div id="hsg-lx-capsule"></div>`;

const I18N = {
  ja: {
    loadingTitle: "住宅価格を読み込み中", loadingStatus: "国土交通省 不動産情報ライブラリ", loaderAria: "読み込み中",
    metrics: { unit: "平均㎡単価", total: "平均成約価格" },
    modes: { muni: "区市町村", chome: "町名" },
    searchPh: "町名で検索…", tooltipMetric: "指標を切り替え",
    levelChome: "町名", levelWard: "区市町村",
    unitRate: "万円/㎡", unitTotal: "万円",
    deals: "成約件数", meanTotal: "平均成約価格", meanUnit: "平均㎡単価",
    breakdown: "内訳", backTo: "← 戻る", top5TownTitle: "区内で高い町", top5WardTitle: "東京で高い区市町村",
    byValueDesc: "平均㎡単価の高い順", noTownData: "データなし",
    instTitle: "町名の分布", instMedian: "東京中央値", instMax: "以上",
    rankExtreme: "最高水準", rankHigh: "高水準", rankNormal: "標準",
    metaTitle: "データ", metaL1: "国土交通省 不動産情報ライブラリ「不動産取引価格情報／成約価格情報」（PDL 1.0）。", metaL2: "町名（地区名）単位で平均。本ページは当サイトが加工して作成したものであり、国が作成・公表したものではありません。",
    faqTitle: "読み方", faqSub: "FAQ",
    faq: [
      { q: "なぜ町名までしか分かれないのですか？", a: "公式データの位置情報は「市区町村＋地区名（町名）」までで、丁目や座標は含まれません。" },
      { q: "平均はどう計算していますか？", a: "その町の成約1件ごとの㎡単価（総額÷面積）を平均しています。面積の絞り込みはしていません。" },
    ],
    siteBy: "japan.ouuut.com", navQuake: "地震", navCabinet: "内閣", navCrime: "犯罪",
  },
  zh: {
    loadingTitle: "正在加载房价", loadingStatus: "国土交通省 不动产情报图书馆", loaderAria: "加载中",
    metrics: { unit: "平均㎡单价", total: "平均成交价" },
    modes: { muni: "区市町村", chome: "町名" },
    searchPh: "搜索町名…", tooltipMetric: "切换指标",
    levelChome: "町名", levelWard: "区市町村",
    unitRate: "万日元/㎡", unitTotal: "万日元",
    deals: "成交笔数", meanTotal: "平均成交价", meanUnit: "平均㎡单价",
    breakdown: "明细", backTo: "← 返回", top5TownTitle: "区内最贵的町", top5WardTitle: "东京最贵的区市町村",
    byValueDesc: "按平均㎡单价排序", noTownData: "无数据",
    instTitle: "町名分布", instMedian: "东京中位数", instMax: "以上",
    rankExtreme: "最高档", rankHigh: "高档", rankNormal: "标准",
    metaTitle: "数据", metaL1: "国土交通省 不动产情报图书馆（PDL 1.0）。", metaL2: "按町名（地区名）平均。本页由本站加工制作，并非日本政府发布。",
    faqTitle: "怎么读", faqSub: "FAQ",
    faq: [
      { q: "为什么只到町名？", a: "官方数据的位置只到「市区町村 + 地区名（町名）」，不含丁目和坐标。" },
      { q: "平均怎么算？", a: "对该町每笔成交的㎡单价（总价÷面积）取平均，不筛面积。" },
    ],
    siteBy: "japan.ouuut.com", navQuake: "地震", navCabinet: "内阁", navCrime: "犯罪",
  },
  en: {
    loadingTitle: "Loading housing prices", loadingStatus: "MLIT Real Estate Information Library", loaderAria: "Loading",
    metrics: { unit: "Mean price/m²", total: "Mean sale price" },
    modes: { muni: "City", chome: "Town" },
    searchPh: "Search a town…", tooltipMetric: "Switch metric",
    levelChome: "Town", levelWard: "Municipality",
    unitRate: "¥10k/m²", unitTotal: "¥10k",
    deals: "Deals", meanTotal: "Mean sale price", meanUnit: "Mean price/m²",
    breakdown: "Breakdown", backTo: "← Back", top5TownTitle: "Priciest towns in ward", top5WardTitle: "Priciest municipalities",
    byValueDesc: "by mean price per m²", noTownData: "No data",
    instTitle: "Town distribution", instMedian: "Tokyo median", instMax: "+",
    rankExtreme: "top tier", rankHigh: "high", rankNormal: "typical",
    metaTitle: "Data", metaL1: "MLIT Real Estate Information Library (PDL 1.0).", metaL2: "Averaged by town (district). Compiled by this site; not a government publication.",
    faqTitle: "How to read", faqSub: "FAQ",
    faq: [
      { q: "Why only to town level?", a: "The official records locate a deal to municipality + town (district) only; no chome, no coordinates." },
      { q: "How is the mean computed?", a: "Mean of each deal's price per m² (price ÷ area) inside the town; no area filter." },
    ],
    siteBy: "japan.ouuut.com", navQuake: "Quakes", navCabinet: "Cabinet", navCrime: "Crime",
  },
};

const THEME_MAP = { mono: "editorial", sage: "editorial", dark: "tactical", editorial: "editorial", tactical: "tactical" };
const RAMP = {
  tactical: ["#1A120E", "#2A1710", "#4A2014", "#6B2A18", "#8C351C", "#AD4020", "#CE4B24", "#EF5629", "#FF6A3D"],
  editorial: ["#E2E8DC", "#DCE4D9", "#C6D6C8", "#AFC8B6", "#97B9A3", "#7FAA91", "#679B7E", "#4F8C6B", "#2F6B4F"],
};
const BOUNDS23 = [[35.52, 138.94], [35.90, 139.94]];

let L = null;
let map = null;
let rootEl = null, controlsRoot = null;
let townsDoc = null, TOWNS = [], MUNI_POLY = null, BY_WARD = {}, BY_NAME = {};
let townLayer = null, wardLayer = null, labelLayer = null, parentLayer = null;
let curLang = "ja", curVariant = "editorial";
let metric = "unit", mode = "chome";
let selTown = null, selWard = null;
let SCALE = null;
let mounted = false, bootSeq = 0, aborter = null;
let zsDragging = false;

const $el = (id) => { try { return (rootEl && rootEl.querySelector("#" + id)) || document.getElementById(id); } catch (e) { return null; } };
const $qa = (sel) => { const out = []; try { (rootEl || document).querySelectorAll(sel).forEach((e) => out.push(e)); } catch (e) {} return out; };
const t = () => I18N[curLang] || I18N.ja;
const fmt = (n, d = 0) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function loadCss() {
  if (document.getElementById("hsg-style")) return;
  const lk = document.createElement("link");
  lk.id = "hsg-style"; lk.rel = "stylesheet"; lk.href = HSG_CSS_HREF;
  document.head.appendChild(lk);
}
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error("script " + src));
    document.head.appendChild(s);
  });
}
async function loadLeaflet() {
  if (globalThis.L && globalThis.L.map) return globalThis.L;
  if (!document.getElementById("hsg-leaflet-css")) {
    const lk = document.createElement("link");
    lk.id = "hsg-leaflet-css"; lk.rel = "stylesheet"; lk.href = HSG_LEAFLET_CSS[0];
    document.head.appendChild(lk);
  }
  let err = null;
  for (const u of HSG_LEAFLET_JS) {
    try { await loadScript(u); if (globalThis.L && globalThis.L.map) return globalThis.L; } catch (e) { err = e; }
  }
  throw err || new Error("leaflet load failed");
}

// ---- values -------------------------------------------------------------
function townVal(x) { return metric === "unit" ? (x.unit || 0) / 1e4 : (x.total || 0); }
function wardVal(name) {
  const list = BY_WARD[name] || [];
  let n = 0, s = 0;
  for (const x of list) { if (!x.n) continue; n += x.n; s += townVal(x) * x.n; }
  return n ? s / n : null;
}
function townName(x) { return x.ward + x.town; }

// ---- scale --------------------------------------------------------------
function buildScale() {
  const vals = (mode === "muni" ? Object.keys(BY_WARD).map((k) => wardVal(k)) : TOWNS.filter((x) => x.n).map(townVal))
    .filter((v) => v != null && v > 0).sort((a, b) => a - b);
  if (!vals.length) return;
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const hi = q(0.99);
  const L0 = Math.log1p(vals[0]), L1 = Math.log1p(hi);
  const breaks = [];
  for (let k = 1; k < 8; k++) breaks.push(Math.expm1(L0 + (L1 - L0) * (k / 8)));
  breaks.push(hi);
  for (let i = 1; i < breaks.length; i++) if (breaks[i] <= breaks[i - 1]) breaks[i] = breaks[i - 1] + 1e-6;
  SCALE = { vals, breaks, hi, ramp: RAMP[curVariant] || RAMP.editorial };
}

function colorFor(v) {
  if (v == null) return "rgba(127,127,127,0.18)";
  const b = SCALE.breaks;
  for (let i = 0; i < b.length; i++) if (v <= b[i]) return SCALE.ramp[i];
  return SCALE.ramp[8];
}

// ---- map ----------------------------------------------------------------
function polyLabelPos(geom) {
  if (!geom) return null;
  let rings = [];
  if (geom.type === "Polygon") rings = geom.coordinates;
  else if (geom.type === "MultiPolygon") rings = geom.coordinates.map((p) => p[0]);
  let best = null, bestArea = 0;
  for (const ring of rings) {
    if (!ring || ring.length < 4) continue;
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    a = Math.abs(a / 2);
    if (a > bestArea) { bestArea = a; best = ring; }
  }
  if (!best) return null;
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < best.length - 1; i++) {
    const x0 = best[i][0], y0 = best[i][1], x1 = best[i + 1][0], y1 = best[i + 1][1];
    const a = x0 * y1 - x1 * y0;
    area += a; cx += (x0 + x1) * a; cy += (y0 + y1) * a;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) return null;
  return [cy / (6 * area), cx / (6 * area)];
}

function styleTown(f) {
  const p = f && f.properties;
  if (!p) return {};
  const x = TOWNS[p.i];
  const v = x && x.n ? townVal(x) : null;
  const sel = selTown && selTown.properties && selTown.properties.i === p.i;
  return {
    color: sel ? "#FF6A3D" : (curVariant === "tactical" ? "rgba(255,244,232,0.10)" : "rgba(24,22,20,0.10)"),
    weight: sel ? 2.4 : 0.55,
    fillColor: colorFor(v),
    fillOpacity: sel ? 1 : 0.9,
  };
}
function styleWard(f) {
  const p = f && f.properties;
  if (!p) return {};
  const v = wardVal(p.ward_ja);
  const sel = selWard === p.ward_ja;
  return {
    color: sel ? "#FF6A3D" : (curVariant === "tactical" ? "rgba(255,244,232,0.14)" : "rgba(24,22,20,0.14)"),
    weight: sel ? 2.2 : 0.8,
    fillColor: colorFor(v),
    fillOpacity: sel ? 0.98 : 0.88,
  };
}

function initMap() {
  map = L.map("hsg-map", { zoomControl: false, preferCanvas: true, zoomSnap: 0.25, zoomDelta: 0.5 }).setView([35.685, 139.75], 11);
  L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© 国土地理院" }).addTo(map);
  L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

  const feats = townsDoc.geo.features.filter((f) => (TOWNS[f.properties.i] || {}).n > 0);
  townLayer = L.geoJSON({ type: "FeatureCollection", features: feats }, {
    style: styleTown,
    onEachFeature: (f, layer) => {
      layer.on("mouseover", () => { const x = TOWNS[f.properties.i]; if (x && x.n) moveHistCursor(townVal(x), townName(x)); });
      layer.on("mouseout", () => { if (!selTown) hideHistCursor(); });
      layer.on("click", (e) => { selectTown(f.properties.i); L.DomEvent.stopPropagation(e); });
    },
  });

  wardLayer = L.geoJSON({ type: "FeatureCollection", features: MUNI_POLY.features }, {
    style: styleWard,
    onEachFeature: (f, layer) => {
      layer.on("mouseover", () => { const v = wardVal(f.properties.ward_ja); if (v != null) moveHistCursor(v, f.properties.ward_ja); });
      layer.on("mouseout", () => { if (!selWard) hideHistCursor(); });
      layer.on("click", (e) => { selectWardByName(f.properties.ward_ja); L.DomEvent.stopPropagation(e); });
    },
  });

  labelLayer = L.layerGroup();
  for (const f of MUNI_POLY.features) {
    const nm = f.properties.ward_ja;
    const pos = polyLabelPos(f.geometry);
    if (!nm || !pos) continue;
    const icon = L.divIcon({ className: "map-ward-label", html: `<span>${nm}</span>`, iconSize: [80, 20], iconAnchor: [40, 10] });
    L.marker(pos, { icon, interactive: false }).addTo(labelLayer);
  }
  labelLayer.addTo(map);
  const gate = () => { try { const z = map.getZoom(); if (z < 10.5) { if (map.hasLayer(labelLayer)) map.removeLayer(labelLayer); } else if (!map.hasLayer(labelLayer)) labelLayer.addTo(map); } catch (e) {} };
  map.on("zoomend", gate); gate();

  applyMode();
  fitTokyo23();
  setTimeout(() => { try { map.invalidateSize(); fitTokyo23(); } catch (e) {} }, 180);
}

function fitTokyo23() {
  const vw = window.innerWidth;
  const pad = vw > 900
    ? { paddingTopLeft: [64, 16], paddingBottomRight: [($el("hsg-card").offsetWidth || 310) + 28, 24] }
    : { paddingTopLeft: [8, 8], paddingBottomRight: [8, Math.round(window.innerHeight * 0.42)] };
  const b = L.latLngBounds(BOUNDS23);
  map.fitBounds(b, { ...pad, animate: false });
}

function applyMode() {
  if (!map) return;
  if (mode === "muni") {
    if (map.hasLayer(townLayer)) map.removeLayer(townLayer);
    if (!map.hasLayer(wardLayer)) wardLayer.addTo(map);
  } else {
    if (map.hasLayer(wardLayer)) map.removeLayer(wardLayer);
    if (!map.hasLayer(townLayer)) townLayer.addTo(map);
  }
}

function highlightParent(ward) {
  if (parentLayer) { map.removeLayer(parentLayer); parentLayer = null; }
  const feat = MUNI_POLY.features.find((f) => f.properties.ward_ja === ward);
  if (!feat) return;
  const stroke = getComputedStyle(rootEl || document.documentElement).getPropertyValue("--accent").trim() || "#FF6A3D";
  parentLayer = L.geoJSON(feat, {
    style: { color: stroke, weight: 3, fill: true, fillColor: stroke, fillOpacity: 0.06, opacity: 0.9, className: "sel-parent-glow" },
    interactive: false,
  }).addTo(map);
}

// ---- zoom slider --------------------------------------------------------
const ZMIN = 9, ZMAX = 18;
function initZoomSlider() {
  const track = $el("hsg-zsTrack"), fill = $el("hsg-zsFill"), thumb = $el("hsg-zsThumb");
  if (!track || !fill || !thumb) return;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const frac = () => clamp((map.getZoom() - ZMIN) / (ZMAX - ZMIN));
  const render = () => { const f = frac(); fill.style.height = f * 100 + "%"; thumb.style.bottom = f * 100 + "%"; };
  const fromY = (y) => { const r = track.getBoundingClientRect(); return clamp(1 - (y - r.top) / r.height); };
  const apply = (f) => map.setZoom(ZMIN + f * (ZMAX - ZMIN), { animate: false });
  track.addEventListener("pointerdown", (e) => { e.preventDefault(); track.setPointerCapture(e.pointerId); zsDragging = true; apply(fromY(e.clientY)); render(); });
  track.addEventListener("pointermove", (e) => { if (!zsDragging) return; apply(fromY(e.clientY)); render(); });
  const stop = (e) => { zsDragging = false; try { track.releasePointerCapture(e.pointerId); } catch (_) {} };
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
  const plus = $el("hsg-zsPlus"), minus = $el("hsg-zsMinus");
  if (plus) plus.addEventListener("click", () => map.zoomIn());
  if (minus) minus.addEventListener("click", () => map.zoomOut());
  map.on("zoom zoomend", render);
  render();
}

// ---- legend + histogram -------------------------------------------------
function updateLegendBar() {
  if (!SCALE) return;
  const bar = $el("hsg-legendBarDiv");
  if (bar) bar.innerHTML = SCALE.ramp.map((c) => `<div style="background:${c}"></div>`).join("");
  const ticks = $el("hsg-legendTicks");
  if (ticks) {
    const b = SCALE.breaks;
    const u = metric === "unit" ? 1 : 1;
    const f = (v) => fmt(v * u, 0);
    ticks.innerHTML = `<span>${f(b[0])}</span><span>${f(b[1])}</span><span>${f(b[3])}</span><span>${f(b[5])}</span><span>${f(SCALE.hi)}+</span>`;
  }
}

function updateHistogram() {
  if (!SCALE) return;
  const vals = SCALE.vals, nBins = 28, maxV = SCALE.hi * 1.05;
  const counts = new Array(nBins).fill(0);
  for (const v of vals) {
    if (v >= maxV) counts[nBins - 1]++;
    else counts[Math.max(0, Math.min(nBins - 1, Math.floor((v / maxV) * nBins)))]++;
  }
  const maxC = Math.max(...counts, 1), W = 332, H = 22, bw = W / nBins;
  let bars = "";
  for (let i = 0; i < nBins; i++) {
    const h = (counts[i] / maxC) * (H - 2);
    bars += `<rect class="hist-bar" x="${i * bw + 0.5}" y="${H - h}" width="${bw - 1}" height="${h}" rx="1"/>`;
  }
  const svg = $el("hsg-hist-svg");
  if (svg) svg.innerHTML = bars;
  const title = $el("hsg-inst-title");
  if (title) title.textContent = `${t().metrics[metric]} · ${t().instTitle}`;
  resetReadout();
}

function resetReadout() {
  if (!SCALE) return;
  const el = $el("hsg-inst-readout");
  if (!el) return;
  const med = SCALE.vals[Math.floor(SCALE.vals.length / 2)];
  el.textContent = `${t().instMedian}: ${fmt(med, 1)} ${metric === "unit" ? t().unitRate : t().unitTotal}`;
}

function moveHistCursor(val, label) {
  const cur = $el("hsg-hist-cursor");
  if (!cur || !SCALE) return;
  cur.style.left = Math.max(0, Math.min(100, (val / (SCALE.hi * 1.05)) * 100)) + "%";
  cur.style.opacity = "1";
  const ro = $el("hsg-inst-readout");
  if (ro) ro.textContent = `${label} · ${fmt(val, 1)} ${metric === "unit" ? t().unitRate : t().unitTotal}`;
}
function hideHistCursor() {
  const cur = $el("hsg-hist-cursor");
  if (cur) cur.style.opacity = "0";
  resetReadout();
}

// ---- cards --------------------------------------------------------------
function rankBadge(v, vals) {
  if (v == null || !vals.length) return "";
  let i = 0;
  while (i < vals.length && vals[i] <= v) i++;
  const top = +(100 - (i / vals.length) * 100).toFixed(1);
  if (top <= 5) return `<span class="rank-badge danger">Top ${top}% ${t().rankExtreme}</span>`;
  if (top <= 20) return `<span class="rank-badge danger">Top ${top}% ${t().rankHigh}</span>`;
  return `<span class="rank-badge neutral">${t().rankNormal}</span>`;
}

function rowsHtml(rows) {
  const maxV = Math.max(...rows.map((r) => r.v || 0), 1);
  return rows.map((r) => {
    const pct = Math.round(((r.v || 0) / maxV) * 100);
    return `<div class="crime-row">
      <span class="crime-label">${esc(r.n)}</span>
      <div class="crime-bar-wrap"><div class="crime-bar-fill" style="width:${pct}%"></div></div>
      <span class="crime-count">${esc(r.s)}</span>
    </div>`;
  }).join("");
}

function townCardHtml(i) {
  const x = TOWNS[i];
  const v = x.n ? townVal(x) : null;
  const wv = wardVal(x.ward);
  return `
    <span class="card-level lv-chome">${t().levelChome}</span>
    <div class="card-head">
      <div>
        <h2>${esc(x.town)}</h2>
        <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px">${esc(x.ward)} · ${t().deals} ${fmt(x.n)}</div>
      </div>
      ${rankBadge(v, SCALE ? SCALE.vals : [])}
    </div>
    <div class="metric-grid-2col">
      <div class="mg-col">
        <div class="mg-val big-val">${v != null ? fmt(v, metric === "unit" ? 0 : 0) : "—"}</div>
        <div class="mg-lbl">${t().meanUnit}</div>
      </div>
      <div class="mg-col">
        <div class="mg-val">${x.total ? fmt(x.total) : "—"}</div>
        <div class="mg-lbl">${t().meanTotal} (${t().unitTotal})</div>
      </div>
    </div>
    <div class="breakdown-section">
      <div class="section-title">${t().breakdown}</div>
      ${rowsHtml([
        { n: t().meanUnit, v: v, s: `${fmt(v, 1)} ${t().unitRate}` },
        { n: t().meanTotal, v: x.total, s: `${fmt(x.total)} ${t().unitTotal}` },
        { n: t().deals, v: x.n, s: `${fmt(x.n)}` },
      ])}
    </div>
    <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
      <button data-hsg-ward="${esc(x.ward)}" style="background:var(--bg-card-sub);border:1px solid var(--line-main);color:var(--text-main);padding:4px 8px;border-radius:var(--radius-inner);font-size:12px;cursor:pointer;font-weight:350">
        ${t().backTo} ${esc(x.ward)}
      </button>
      <span style="font-size:11px;color:var(--text-faint);font-family:var(--font-num)">MLIT</span>
    </div>`;
}

function wardCardHtml(name) {
  const v = wardVal(name);
  const list = (BY_WARD[name] || []).filter((x) => x.n).sort((a, b) => townVal(b) - townVal(a)).slice(0, 5);
  const totalDeals = (BY_WARD[name] || []).reduce((s, x) => s + x.n, 0);
  const tops = list.map((x) => `<div class="top-item" data-hsg-town="${x.i}"><span class="tname">${esc(x.town)}</span><span class="trate">${fmt(townVal(x), 0)} ${metric === "unit" ? t().unitRate : t().unitTotal}</span></div>`).join("");
  return `
    <span class="card-level lv-ward">${t().levelWard}</span>
    <div class="card-head">
      <div>
        <h2>${esc(name)}</h2>
        <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px">${t().deals} ${fmt(totalDeals)}</div>
      </div>
      <span class="rank-badge neutral">${t().levelWard}</span>
    </div>
    <div class="metric-grid-2col">
      <div class="mg-col">
        <div class="mg-val big-val">${v != null ? fmt(v, 0) : "—"}</div>
        <div class="mg-lbl">${t().meanUnit}</div>
      </div>
      <div class="mg-col">
        <div class="mg-val">${fmt(totalDeals)}</div>
        <div class="mg-lbl">${t().deals}</div>
      </div>
    </div>
    <div class="tops-box">
      <div class="section-title">${t().top5TownTitle}</div>
      ${tops || `<div style="font-size:12px;color:var(--text-muted)">${t().noTownData}</div>`}
    </div>`;
}

function rankingHtml() {
  const list = Object.keys(BY_WARD).map((k) => ({ ward: k, v: wardVal(k) })).filter((x) => x.v != null).sort((a, b) => b.v - a.v).slice(0, 5);
  const max = list[0] ? list[0].v : 1;
  return `
    <div class="panel-card">
      <div class="card-head" style="margin-bottom:4px">
        <div style="font-size:13px;font-weight:var(--fw-mid);color:var(--text-main)">${t().top5WardTitle}</div>
        <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-num)">${t().byValueDesc}</span>
      </div>
      <div class="rank-card-list">
        ${list.map((x, i) => `
          <div class="rank-card-item" data-hsg-ward="${esc(x.ward)}">
            <span class="rci-idx">0${i + 1}</span>
            <span class="rci-name">${esc(x.ward)}</span>
            <div class="rci-bar-wrap"><div class="rci-bar-fill" style="width:${Math.round((x.v / max) * 100)}%"></div></div>
            <span class="rci-val">${fmt(x.v, 0)}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

function metaHtml() {
  const faq = (t().faq || []).map((x) => `<details class="faq-item"><summary>${esc(x.q)}</summary><div class="faq-a">${esc(x.a)}</div></details>`).join("");
  return `
    <div class="panel-card" style="padding:12px 14px;background:var(--surface);border:0;box-shadow:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:11px;font-weight:var(--fw-mid);color:var(--text-main);letter-spacing:0.5px">${t().metaTitle}</span>
        <span style="font-size:11px;color:var(--text-faint);font-family:var(--font-num)">MLIT / PDL 1.0</span>
      </div>
      <div style="font-size:11px;color:var(--text-muted);line-height:1.4">${t().metaL1}<br>${t().metaL2}</div>
      <div class="faq-block"><div class="faq-head"><span class="faq-title">${t().faqTitle}</span><span class="faq-sub">${t().faqSub}</span></div>${faq}</div>
      <div class="faq-source">${t().siteBy} · <a href="../" style="color:var(--accent)">japan.ouuut.com</a> · <a href="../quake/" style="color:var(--accent)">${t().navQuake}</a> · <a href="../crime/" style="color:var(--accent)">${t().navCrime}</a></div>
    </div>`;
}

function renderCard() {
  const card = $el("hsg-card");
  if (!card) return;
  if (mode === "muni" && selWard) {
    card.innerHTML = `<div class="panel-card">${wardCardHtml(selWard)}</div>` + rankingHtml() + metaHtml();
  } else if (selTown != null) {
    const x = TOWNS[selTown];
    card.innerHTML = `<div class="panel-card">${townCardHtml(selTown)}</div>` + `<div class="panel-card">${wardCardHtml(x.ward)}</div>` + rankingHtml() + metaHtml();
  } else {
    card.innerHTML = rankingHtml() + metaHtml();
  }
}

function selectTown(i, fly) {
  selTown = i; selWard = null; mode = "chome";
  $qa("[data-hsg-mode]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-hsg-mode") === "chome"));
  applyMode();
  townLayer.setStyle(styleTown);
  highlightParent(TOWNS[i].ward);
  renderCard();
  const x = TOWNS[i];
  if (x.n) moveHistCursor(townVal(x), townName(x));
  if (fly && map) {
    const f = townsDoc.geo.features.find((y) => y.properties.i === i);
    if (f) map.fitBounds(L.geoJSON(f).getBounds(), { padding: [60, 60], maxZoom: 15 });
  }
}

function selectWardByName(name) {
  selWard = name; selTown = null; mode = "muni";
  $qa("[data-hsg-mode]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-hsg-mode") === "muni"));
  applyMode();
  wardLayer.setStyle(styleWard);
  if (parentLayer) { map.removeLayer(parentLayer); parentLayer = null; }
  renderCard();
  const v = wardVal(name);
  if (v != null) moveHistCursor(v, name);
}

// ---- controls -----------------------------------------------------------
function controlsHtml() {
  const t0 = t();
  const opts = Object.entries(t0.metrics).map(([k, n]) => `<option value="${k}"${k === metric ? " selected" : ""}>${esc(n)}</option>`).join("");
  return `<select id="hsg-metric" class="hsg-sel" title="${esc(t0.tooltipMetric)}">${opts}</select>`
    + `<div class="seg" role="group"><button data-hsg-mode="muni" class="${mode === "muni" ? "on" : ""}">${esc(t0.modes.muni)}</button><button data-hsg-mode="chome" class="${mode === "chome" ? "on" : ""}">${esc(t0.modes.chome)}</button></div>`
    + `<input id="hsg-q" class="hsg-q" type="search" placeholder="${esc(t0.searchPh)}" autocomplete="off">`;
}

function mountControls(box) {
  const label = curLang === "zh" ? "筛选" : curLang === "en" ? "Filter" : "絞り込み";
  box.innerHTML = `<button type="button" class="hsg-ctl-toggle" aria-expanded="false" aria-label="${label}"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 4h12M4 8h8M6.5 12h3"/></svg><span>${label}</span></button>`
    + `<div class="hsg-ctl">${controlsHtml()}</div>`;
  const tg = box.querySelector(".hsg-ctl-toggle");
  if (tg) tg.addEventListener("click", () => { const open = box.classList.toggle("is-open"); tg.setAttribute("aria-expanded", String(open)); });
  bindControls();
}

function bindControls() {
  const m = $el("hsg-metric");
  if (m && !m.__hsgBound) {
    m.__hsgBound = true;
    m.addEventListener("change", (e) => {
      metric = e.target.value;
      buildScale(); updateLegendBar(); updateHistogram();
      if (mode === "muni") wardLayer.setStyle(styleWard); else townLayer.setStyle(styleTown);
      renderCard();
    });
  }
  $qa("[data-hsg-mode]").forEach((b) => {
    if (b.__hsgBound) return; b.__hsgBound = true;
    b.addEventListener("click", () => {
      const m0 = b.getAttribute("data-hsg-mode");
      $qa("[data-hsg-mode]").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      mode = m0;
      if (mode === "muni") { selTown = null; applyMode(); wardLayer.setStyle(styleWard); renderCard(); }
      else { selWard = null; applyMode(); townLayer.setStyle(styleTown); renderCard(); }
      buildScale(); updateLegendBar(); updateHistogram();
    });
  });
  const q = $el("hsg-q");
  if (q && !q.__hsgBound) {
    q.__hsgBound = true;
    q.addEventListener("input", onSearch);
    q.addEventListener("blur", () => setTimeout(() => { const d = $el("hsg-drop"); if (d) d.style.display = "none"; }, 150));
  }
}

function onSearch(e) {
  const drop = $el("hsg-drop");
  const q = (e.target.value || "").trim();
  if (!drop) return;
  if (!q) { drop.style.display = "none"; return; }
  const hits = TOWNS.filter((x) => x.n && (townName(x).includes(q) || x.town.includes(q))).slice(0, 10);
  if (!hits.length) { drop.style.display = "none"; return; }
  const host = rootEl.getBoundingClientRect(), ri = e.target.getBoundingClientRect();
  drop.style.left = ri.left - host.left + "px";
  drop.style.top = ri.bottom - host.top + 4 + "px";
  drop.style.width = ri.width + "px";
  drop.style.display = "block";
  drop.innerHTML = hits.map((h) => `<div data-i="${h.i}">${esc(h.ward + h.town)}</div>`).join("");
  drop.querySelectorAll("div").forEach((d) => d.addEventListener("click", () => {
    const i = +d.getAttribute("data-i");
    selectTown(i, true);
    drop.style.display = "none";
    try { e.target.value = townName(TOWNS[i]); } catch (err) {}
  }));
}

function onCardClick(e) {
  if (!e.target || !e.target.closest) return;
  const w = e.target.closest("[data-hsg-ward]");
  if (w) { selectWardByName(w.getAttribute("data-hsg-ward")); return; }
  const tn = e.target.closest("[data-hsg-town]");
  if (tn) selectTown(+tn.getAttribute("data-hsg-town"), true);
}

// ---- theme/lang ---------------------------------------------------------
function applyVariant(v) {
  curVariant = v;
  if (rootEl) rootEl.setAttribute("data-hsg-variant", v);
  if (map) {
    buildScale(); updateLegendBar(); updateHistogram();
    if (townLayer) townLayer.setStyle(styleTown);
    if (wardLayer) wardLayer.setStyle(styleWard);
  }
}

// ---- boot ---------------------------------------------------------------
export async function mountHousing(el, opts) {
  opts = opts || {};
  if (mounted) unmountHousing();
  const my = ++bootSeq;
  rootEl = el;
  el.innerHTML = '<div id="hsg-root"></div>';
  rootEl = el.querySelector("#hsg-root");
  try { rootEl.style.cssText = "position:absolute;inset:0"; } catch (e) {}
  rootEl.innerHTML = SKELETON;
  curLang = I18N[opts.lang] ? opts.lang : "ja";
  curVariant = THEME_MAP[opts.theme] || "editorial";
  rootEl.setAttribute("data-hsg-variant", curVariant);
  loadCss();

  const ldr = $el("hsg-app-loader");
  if (ldr) { $el("hsg-loader-title").textContent = t().loadingTitle; $el("hsg-loader-status").textContent = t().loadingStatus; }

  if (!controlsRoot || !controlsRoot.isConnected) {
    const host = document.createElement("div");
    host.id = "hsg-ctl-host";
    rootEl.appendChild(host);
    controlsRoot = host;
  }
  mountControls(controlsRoot);

  aborter = new AbortController();
  try {
    L = await loadLeaflet();
    const base = (opts.base || "/") + "app/housing/data/";
    const [townsRes, muniRes] = await Promise.all([
      fetch(base + "towns.json", { signal: aborter.signal, cache: "no-cache" }),
      fetch((opts.base || "/") + "app/crime/data/muni_poly.json", { signal: aborter.signal, cache: "no-cache" }),
    ]);
    if (!townsRes.ok) throw new Error("towns.json " + townsRes.status);
    townsDoc = await townsRes.json();
    TOWNS = townsDoc.towns;
    const muni = muniRes.ok ? await muniRes.json() : { features: [] };
    MUNI_POLY = { type: "FeatureCollection", features: muni.features.filter((f) => f.properties && f.properties.ward_ja) };
    BY_WARD = {};
    BY_NAME = {};
    for (const x of TOWNS) { (BY_WARD[x.ward] = BY_WARD[x.ward] || []).push(x); BY_NAME[x.ward + x.town] = x; }
    if (my !== bootSeq) return false;

    buildScale(); updateLegendBar(); updateHistogram();
    initMap();
    initZoomSlider();
    $el("hsg-card").addEventListener("click", onCardClick);
    setLanguage(curLang);
    try {
      const top = TOWNS.filter((x) => x.n).sort((a, b) => townVal(b) - townVal(a))[0];
      if (top) selectTown(top.i, false);
    } catch (e) {}
    renderCard();

    if (ldr) { ldr.classList.add("fade-out"); setTimeout(() => { if (ldr.parentNode) ldr.remove(); }, 700); }
    mounted = true;
    return true;
  } catch (e) {
    if (ldr) { ldr.classList.add("fade-out"); setTimeout(() => { if (ldr.parentNode) ldr.remove(); }, 500); }
    throw e;
  }
}

export function unmountHousing() {
  bootSeq++;
  if (aborter) { try { aborter.abort(); } catch (e) {} aborter = null; }
  try { if (map) { map.remove(); } } catch (e) {}
  map = null; townLayer = null; wardLayer = null; labelLayer = null; parentLayer = null;
  if (rootEl) { try { rootEl.innerHTML = ""; } catch (e) {} }
  const st = document.getElementById("hsg-style"); if (st) st.remove();
  const lk = document.getElementById("hsg-leaflet-css"); if (lk) lk.remove();
  rootEl = null; controlsRoot = null; mounted = false;
}

export function setHousingLang(lang) { if (!I18N[lang]) return false; curLang = lang; if (rootEl) setLanguage(lang); return true; }
export function setHousingTheme(th) { applyVariant(THEME_MAP[th] || "editorial"); return curVariant; }
export function isHousingMounted() { return mounted; }
export function resetHousingView() { if (map) fitTokyo23(); }
export function getHousingLegend() { return SCALE ? { breaks: SCALE.breaks.slice(), hi: SCALE.hi } : null; }
export function selectHousingTown(name) { const x = BY_NAME[name]; if (x) { selectTown(x.i, true); return true; } return false; }

function setLanguage(lang) {
  if (!I18N[lang]) return;
  curLang = lang;
  if (rootEl) rootEl.lang = lang;
  if (controlsRoot) mountControls(controlsRoot);
  if (SCALE) { updateLegendBar(); updateHistogram(); renderCard(); }
}
