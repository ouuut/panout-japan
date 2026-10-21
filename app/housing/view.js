/**
 * app/housing/view.js — /housing/ 东京 23 区房价地图（中古マンション成約価格）
 *
 * API: mountHousing(el,{base,lang,theme}) / unmountHousing() / setHousingLang / setHousingTheme
 *      / selectHousingWard(code) / resetHousingView() / isHousingMounted() / getHousingLegend()
 *
 * 数据：/app/housing/data/wards.json（区级统计）、wards_poly.json（23 区边界）
 * 口径：中古マンション等 · 成約価格 · 60–80㎡ · ㎡単価中位数 → 70㎡換算
 * 出典：国土交通省 不動産情報ライブラリ（PDL 1.0，加工して作成）
 */

const HSG_CSS = `
#hsg-root{position:absolute;inset:0;overflow:hidden;--font-sans:var(--ja-sans);--font-num:var(--mono);--panel-w:352px}
#hsg-map{position:absolute;inset:0;background:var(--bg)}
#hsg-map .leaflet-container{background:var(--bg);font-family:var(--font-sans)}
#hsg-map .leaflet-tile-pane{transition:filter .4s var(--ease,ease),opacity .4s var(--ease,ease)}
#hsg-map .leaflet-tile-pane{filter:saturate(.16) contrast(.94)}
@media (min-width:761px){#hsg-map .leaflet-bottom.leaflet-right{margin-right:392px}}
#hsg-map .leaflet-control-attribution{background:color-mix(in srgb,var(--bg) 74%,transparent);color:var(--muted);font-size:10px;padding:2px 6px;border-radius:4px;backdrop-filter:blur(6px)}
#hsg-map .leaflet-control-attribution a{color:var(--muted)}
#hsg-map .leaflet-control-zoom a{background:color-mix(in srgb,var(--bg) 90%,transparent);color:var(--ink);border-bottom-color:rgba(127,127,127,.28);backdrop-filter:blur(8px)}
#hsg-map .leaflet-control-zoom a:hover{background:color-mix(in srgb,var(--bg) 72%,var(--ink) 8%)}
html[data-theme="dark"] #hsg-map .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.7) contrast(1.2);opacity:.45}
#hsg-head{position:absolute;left:20px;top:12px;z-index:800;max-width:min(470px,calc(100% - 40px));padding:12px 16px;border-radius:12px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px) saturate(1.05);-webkit-backdrop-filter:blur(10px) saturate(1.05);box-shadow:0 1px 2px rgba(0,0,0,.1)}
#hsg-head h2{margin:0;font-family:var(--title-font,var(--ja-sans));font-size:15px;font-weight:700;letter-spacing:.01em;color:var(--ink)}
#hsg-head .hsg-basis{margin-top:2px;font-family:var(--font-num);font-size:11px;letter-spacing:.06em;color:var(--muted)}
#hsg-legend{position:absolute;left:20px;bottom:20px;z-index:800;padding:10px 12px;border-radius:4px;background:color-mix(in srgb,var(--bg) 86%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
#hsg-legend .lg-t{font-size:10px;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;font-family:var(--font-num)}
#hsg-legend .lg-row{display:flex;align-items:center;gap:6px;font-family:var(--font-num);font-size:10.5px;color:var(--muted);line-height:1.5}
#hsg-legend .lg-sw{width:22px;height:9px;border-radius:1px;flex:none}
#hsg-legend .lg-credit{display:none}
#hsg-panel{position:absolute;right:20px;top:20px;bottom:20px;width:var(--panel-w);z-index:820;display:flex;flex-direction:column;gap:10px;overflow:hidden}
#hsg-card{background:color-mix(in srgb,var(--bg) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:4px;padding:16px 16px 14px}
#hsg-card .c-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
#hsg-card .c-name{font-family:var(--title-font,var(--ja-sans));font-size:22px;font-weight:700;color:var(--ink);line-height:1.2}
#hsg-card .c-rank{font-family:var(--font-num);font-size:10px;letter-spacing:.08em;color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 42%,transparent);border-radius:2px;padding:2px 6px;white-space:nowrap}
#hsg-card .c-big{margin-top:12px;display:flex;align-items:baseline;gap:6px}
#hsg-card .c-big b{font-family:var(--font-num);font-size:34px;font-weight:600;letter-spacing:-.02em;color:var(--ink);line-height:1}
#hsg-card .c-big small{font-family:var(--font-sans);font-size:12px;color:var(--muted)}
#hsg-card .c-sub{margin-top:3px;font-size:11px;color:var(--muted);line-height:1.5}
#hsg-card .c-rows{margin-top:12px;display:grid;gap:6px}
#hsg-card .c-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12px;color:var(--muted);border-top:1px solid color-mix(in srgb,var(--ink) 8%,transparent);padding-top:6px}
#hsg-card .c-row b{font-family:var(--font-num);font-weight:500;color:var(--ink);font-size:13px;letter-spacing:-.01em}
#hsg-card .c-note{margin-top:10px;font-size:10.5px;line-height:1.55;color:var(--muted);opacity:.9}
#hsg-list{flex:1 1 auto;min-height:0;overflow:auto;background:color-mix(in srgb,var(--bg) 92%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:4px;padding:6px}
#hsg-list .l-row{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;padding:5px 8px;border-radius:2px;cursor:pointer;font-size:12px;color:var(--muted)}
#hsg-list .l-row:hover{background:var(--surface);color:var(--ink)}
#hsg-list .l-row.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--ink)}
#hsg-list .l-rk{font-family:var(--font-num);font-size:10px;opacity:.6;text-align:right}
#hsg-list .l-bar{position:relative;height:3px;border-radius:2px;background:color-mix(in srgb,var(--ink) 7%,transparent);margin-top:4px;overflow:hidden}
#hsg-list .l-bar i{position:absolute;inset:0 auto 0 0;background:var(--accent);opacity:.72}
#hsg-list .l-val{font-family:var(--font-num);font-size:12px;color:var(--ink)}
#hsg-list .l-unit{font-size:9.5px;color:var(--muted);margin-left:2px}
#hsg-toggle{display:none}
#hsg-source{margin-top:6px;max-width:74ch;font-size:10px;line-height:1.5;color:var(--muted);opacity:.82;pointer-events:auto}
#hsg-source a{color:inherit;text-decoration:underline;text-underline-offset:2px}
#hsg-loader{position:absolute;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:var(--bg)}
#hsg-loader .ld-t{margin-top:10px;font-family:var(--font-num);font-size:11px;letter-spacing:.1em;color:var(--muted);text-transform:uppercase}
#hsg-loader .ld-box{text-align:center;transition:opacity .4s var(--ease,ease)}
#hsg-loader.fade{opacity:0;visibility:hidden}
#hsg-loader .ld-bar{width:120px;height:2px;background:color-mix(in srgb,var(--accent) 18%,transparent);overflow:hidden;margin:0 auto}
#hsg-loader .ld-bar i{display:block;height:100%;width:40%;background:var(--accent);animation:hsg-slide 1.1s var(--ease,ease) infinite}
@keyframes hsg-slide{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
@media (max-width:760px){
  #hsg-head{left:12px;top:8px;max-width:calc(100% - 96px);padding:9px 12px;border-radius:10px}
  #hsg-head h2{font-size:13px}
  #hsg-panel{left:12px;right:12px;top:auto;bottom:12px;width:auto;max-height:54vh;overflow-y:auto;-webkit-overflow-scrolling:touch}
  #hsg-map .leaflet-control-zoom{display:none}
  #hsg-map .leaflet-control-attribution{display:none}
  #hsg-legend .lg-credit{display:block;margin-top:5px;font-size:9px;letter-spacing:.02em;color:var(--muted);opacity:.85}
  #hsg-card{padding:12px}
  #hsg-card .c-name{font-size:18px}
  #hsg-card .c-big b{font-size:26px}
  #hsg-list{display:none}
  #hsg-panel.open #hsg-list{display:block;max-height:24vh}
  #hsg-legend{left:12px;bottom:calc(54vh + 22px);padding:7px 9px}
  #hsg-legend .lg-row{font-size:9.5px}
  #hsg-source{display:none}
  #hsg-toggle{display:inline-flex;position:absolute;right:12px;top:8px;z-index:830;align-items:center;gap:6px;height:30px;padding:0 12px;border:0;border-radius:2px;background:var(--surface);color:var(--ink);font:inherit;font-size:12px;cursor:pointer}
}
`;

const I18N = {
  ja: {
    title: "東京23区 中古マンション価格",
    basisP: "成約価格",
    medianUnit: "㎡単価（中央値）",
    p70: "70㎡換算",
    totalMed: "総額（中央値）",
    totalMean: "総額（平均）",
    deals: "成約件数",
    allUnits: "全サイズの㎡単価",
    band: "60–80㎡の帯",
    rank: "23区中",
    note: "中央値は「真ん中の取引」。平均は高額取引に引っ張られるため、地図と代表値は中央値を使用。",
    legend: "㎡単価（万円/㎡）",
    listHead: "23区 一覧",
    loading: "読み込み中",
    source: "出典：国土交通省 不動産情報ライブラリ（PDL 1.0）／本ページの区別集計は当サイトが加工した参考情報であり、国が作成・公表したものではありません。",
    wan: "万円",
    perM2: "万円/㎡",
    noData: "データなし",
    toggle: "一覧",
    thin: "参考",
  },
  zh: {
    title: "东京23区 二手房（公寓）价格",
    basisP: "成约价格",
    medianUnit: "㎡单价（中位数）",
    p70: "70㎡换算",
    totalMed: "总价（中位数）",
    totalMean: "总价（平均）",
    deals: "成约件数",
    allUnits: "全部面积㎡单价",
    band: "60–80㎡ 区间",
    rank: "23区排名",
    note: "中位数是「中间那笔交易」；平均会被豪宅抬高，因此地图与代表值用中位数。",
    legend: "㎡单价（万日元/㎡）",
    listHead: "23区 一览",
    loading: "加载中",
    source: "数据来源：日本国土交通省「不动产情报图书馆」（PDL 1.0）；本页各区数值为本站加工的参考统计，并非日本政府发布。",
    wan: "万日元",
    perM2: "万日元/㎡",
    noData: "无数据",
    toggle: "一览",
    thin: "参考",
  },
  en: {
    title: "Tokyo 23 wards — used apartment prices",
    basisP: "closed prices",
    medianUnit: "Price per m² (median)",
    p70: "70 m² equivalent",
    totalMed: "Total (median)",
    totalMean: "Total (mean)",
    deals: "Closed deals",
    allUnits: "All sizes, per m²",
    band: "60–80 m² band",
    rank: "of 23 wards",
    note: "The median is the middle transaction; the mean is pulled up by high-end deals, so the map and headline use the median.",
    legend: "¥10k per m²",
    listHead: "All 23 wards",
    loading: "Loading",
    source: "Source: MLIT Real Estate Information Library (PDL 1.0). Ward figures are statistics compiled by this site, not official government publications.",
    wan: "¥10k",
    perM2: "¥10k/m²",
    noData: "No data",
    toggle: "List",
    thin: "low n",
  },
};

const HSG_DATA_BASES = ["./app/housing/data/", "/app/housing/data/", "../app/housing/data/"];
const HSG_LEAFLET_JS = ["/app/housing/vendor/leaflet.js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
const HSG_LEAFLET_CSS = ["/app/housing/vendor/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];
const RAMP = [0.16, 0.28, 0.40, 0.54, 0.68, 0.84];

let L = null;
let rootEl = null, panelEl = null;
let map = null, layer = null;
let DATA = null, POLY = null;
let curWard = null, currentLang = "ja";
let mounted = false, bootSeq = 0, aborter = null, forcedBase = null;

const $ = (id) => (rootEl && rootEl.querySelector ? rootEl.querySelector("#" + id) : null);
const fmt = (n) => (n == null ? "—" : n.toLocaleString("ja-JP"));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function t() { return I18N[currentLang] || I18N.ja; }

function detectLang() {
  try { return I18N[document.documentElement.lang] ? document.documentElement.lang : "ja"; } catch (e) { return "ja"; }
}

function ensureCss() {
  if (document.getElementById("hsg-style")) return;
  const st = document.createElement("style");
  st.id = "hsg-style";
  st.textContent = HSG_CSS;
  document.head.appendChild(st);
}

async function loadLeaflet() {
  if (!document.getElementById("hsg-leaflet-css")) {
    const lk = document.createElement("link");
    lk.id = "hsg-leaflet-css"; lk.rel = "stylesheet"; lk.href = HSG_LEAFLET_CSS[0];
    lk.onerror = () => { lk.href = HSG_LEAFLET_CSS[1]; };
    document.head.appendChild(lk);
  }
  if (globalThis.L && globalThis.L.map) return globalThis.L;
  const inject = (url) => new Promise((res, rej) => {
    const el = document.createElement("script");
    el.src = url; el.async = true;
    el.onload = () => res();
    el.onerror = () => rej(new Error("script load failed: " + url));
    document.head.appendChild(el);
  });
  let err = null;
  for (const u of HSG_LEAFLET_JS) {
    try { await inject(u); if (globalThis.L && globalThis.L.map) return globalThis.L; }
    catch (e) { err = e; }
  }
  throw err || new Error("leaflet load failed");
}

async function fetchJson(name, signal) {
  let err = null;
  const bases = forcedBase ? [forcedBase.replace(/\/?$/, "/") + "app/housing/data/"] : HSG_DATA_BASES;
  for (const b of bases) {
    try {
      const r = await fetch(b + name, { signal });
      if (!r.ok) throw new Error(name + " " + r.status);
      return await r.json();
    } catch (e) { err = e; }
  }
  throw err || new Error("fetch failed: " + name);
}

// ---------------------------------------------------------------- scale
function unitOf(w) { return (w.band && w.band.unit) || w.unit || 0; }

function scaleOf(data) {
  const vals = data.wards.map(unitOf).filter(Boolean).map((v) => Math.log10(v));
  vals.sort((a, b) => a - b);
  const q = (p) => {
    const i = (vals.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return vals[lo] + (vals[hi] - vals[lo]) * (i - lo);
  };
  const raw = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1].map((p) => Math.pow(10, q(p)));
  const breaks = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i] > breaks[breaks.length - 1] * 1.004) breaks.push(raw[i]);
  }
  return { breaks };
}

function bucket(v, breaks) {
  for (let i = 1; i < breaks.length; i++) if (v <= breaks[i]) return i - 1;
  return breaks.length - 2;
}

function rampFor(i, n) {
  if (n <= 1) return RAMP[RAMP.length - 1];
  return RAMP[Math.round((i * (RAMP.length - 1)) / (n - 1))];
}

function hexToRgba(col, a) {
  const c = String(col || "").trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isFinite(n)) return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const m = c.match(/[\d.]+/g);
  if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${a})`;
  return `rgba(47,107,79,${a})`;
}
function themeColors() {
  let accent = "#2F6B4F";
  try {
    accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
  } catch (e) {}
  const dark = (() => { try { return document.documentElement.dataset.theme === "dark"; } catch (e) { return false; } })();
  let ink = dark ? "#EDEBE4" : "#141A15";
  try {
    ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || ink;
  } catch (e) {}
  return { accent: accent, ink: ink, line: dark ? "rgba(237,235,228,0.16)" : "rgba(20,26,21,0.18)" };
}
function fillForUnit(v) {
  if (!v) return "transparent";
  const brk = SCALE.breaks.map(Math.log10);
  const b = bucket(Math.log10(v), brk);
  return hexToRgba(C.accent, rampFor(b, brk.length - 1));
}

let SCALE = { breaks: [] };
let C = { accent: "#2F6B4F", line: "rgba(20,26,21,0.18)" };

// ---------------------------------------------------------------- render
function renderHead() {
  const head = $("hsg-head");
  const d = DATA;
  if (!head) return;
  head.innerHTML = `<h2>${esc(t().title)}</h2>
    <p class="hsg-basis">${esc(t().basisP)} · ${esc(d.basis)} · ${d.totals.trades.toLocaleString("ja-JP")} ${esc(t().deals)}</p>`;
}

function renderLegend() {
  const el = $("hsg-legend");
  if (!el) return;
  const br = SCALE.breaks;
  const n = br.length - 1;
  let rows = "";
  for (let i = 0; i < n; i++) {
    const lo = br[i] / 10000, hi = br[i + 1] / 10000;
    const label = i === n - 1 ? `${lo.toFixed(0)} +` : `${lo.toFixed(0)}–${hi.toFixed(0)}`;
    rows += `<div class="lg-row"><span class="lg-sw" style="background:color-mix(in srgb,var(--accent) ${Math.round(rampFor(i, n) * 100)}%,transparent)"></span>${label}</div>`;
  }
  el.innerHTML = `<div class="lg-t">${esc(t().legend)}</div>${rows}<div class="lg-credit">© 国土地理院 · Leaflet</div>`;
}

function renderCard() {
  const el = $("hsg-card");
  if (!el) return;
  const w = DATA.wards.find((x) => x.ward === curWard) || DATA.wards[0];
  if (!w) { el.innerHTML = ""; return; }
  const b = w.band || {};
  el.innerHTML = `
    <div class="c-top"><span class="c-name">${esc(w.ward)}</span><span class="c-rank">${w.rank} / 23${(b.n || 0) < 100 ? " · " + esc(t().thin) : ""}</span></div>
    <div class="c-big"><b>${fmt(b.p70)}</b><small>${esc(t().wan)} · ${esc(t().p70)}</small></div>
    <p class="c-sub">${esc(t().band)} · n=${fmt(b.n)}</p>
    <div class="c-rows">
      <div class="c-row"><span>${esc(t().medianUnit)}</span><b>${fmt(Math.round(unitOf(w) / 10000 * 10) / 10)} ${esc(t().perM2)}</b></div>
      <div class="c-row"><span>${esc(t().totalMed)}</span><b>${fmt(b.total_med)} ${esc(t().wan)}</b></div>
      <div class="c-row"><span>${esc(t().totalMean)}</span><b>${fmt(b.total_mean)} ${esc(t().wan)}</b></div>
      <div class="c-row"><span>${esc(t().allUnits)}</span><b>${fmt(Math.round((w.unit || 0) / 10000 * 10) / 10)} ${esc(t().perM2)}</b></div>
      <div class="c-row"><span>${esc(t().deals)}</span><b>${fmt(w.n)}</b></div>
    </div>
    <p class="c-note">${esc(t().note)}</p>`;
}

function renderList() {
  const el = $("hsg-list");
  if (!el) return;
  const max = Math.max(...DATA.wards.map((w) => w.band.p70 || 0));
  el.innerHTML = DATA.wards.map((w) => {
    const pct = Math.max(3, Math.round(((w.band.p70 || 0) / max) * 100));
    return `<div class="l-row${w.ward === curWard ? " on" : ""}" data-ward="${esc(w.ward)}" tabindex="0" role="button">
      <span class="l-rk">${w.rank}</span>
      <span>${esc(w.ward)}<span class="l-bar"><i style="width:${pct}%"></i></span></span>
      <span class="l-val">${fmt(w.band.p70)}<span class="l-unit">${esc(t().wan)}</span></span>
    </div>`;
  }).join("");
  const on = el.querySelector(".l-row.on");
  if (on) {
    const top = on.offsetTop, bot = top + on.offsetHeight;
    if (top < el.scrollTop || bot > el.scrollTop + el.clientHeight) {
      el.scrollTop = Math.max(0, top - el.clientHeight / 2 + on.offsetHeight / 2);
    }
  }
  el.querySelectorAll(".l-row").forEach((row) => {
    const pick = () => selectByWard(row.dataset.ward, true);
    row.addEventListener("click", pick);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    row.addEventListener("mouseenter", () => setHover(row.dataset.ward));
    row.addEventListener("mouseleave", () => setHover(null));
  });
}

function renderSource() {
  const el = $("hsg-source");
  if (!el) return;
  el.innerHTML = `${esc(t().source)} <a href="${esc(DATA.source_url)}" rel="noopener" target="_blank">reinfolib.mlit.go.jp</a>`;
}

function renderHeadAll() {
  renderHead();
  const head = $("hsg-head");
  if (!head) return;
  if (!head.querySelector("#hsg-source")) {
    const src = document.createElement("div");
    src.id = "hsg-source";
    head.appendChild(src);
  }
  renderSource();
}

function setHover(ward) {
  if (!layer) return;
  layer.eachLayer((l) => {
    const f = l.feature && l.feature.properties;
    if (!f) return;
    const on = f.ward_ja === ward;
    l.setStyle({ weight: on ? 1.6 : 1, color: on ? C.accent : C.line });
  });
}

function selectByWard(ward, fly) {
  if (!DATA) return;
  curWard = ward;
  const w = DATA.wards.find((x) => x.ward === ward);
  if (layer) {
    layer.eachLayer((l) => {
      const f = l.feature && l.feature.properties;
      if (!f) return;
      const sel = f.ward_ja === ward;
      l.setStyle({
        weight: sel ? 2.4 : 1,
        color: sel ? C.ink : C.line,
        fillOpacity: sel ? 1 : 0.86,
      });
      if (sel && fly && w && l.getBounds) {
        map.flyToBounds(l.getBounds(), { padding: [48, 48], maxZoom: 13, duration: 0.7 });
      }
    });
  }
  renderCard();
  renderList();
}

// ---------------------------------------------------------------- map
function initMap() {
  map = L.map("hsg-map", { zoomControl: false, preferCanvas: true, zoomSnap: 0.25, zoomDelta: 0.5 })
    .setView([35.69, 139.75], 11);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png", {
    maxZoom: 18, attribution: "© 国土地理院",
  }).addTo(map);

  layer = L.geoJSON(POLY, {
    style: (f) => {
      const w = DATA.wards.find((x) => x.ward === f.properties.ward_ja);
      return {
        color: C.line,
        weight: 1,
        fillColor: fillForUnit(w && unitOf(w)),
        fillOpacity: 0.86,
      };
    },
    onEachFeature: (f, l) => {
      l.on("mouseover", () => setHover(f.properties.ward_ja));
      l.on("mouseout", () => setHover(null));
      l.on("click", () => selectByWard(f.properties.ward_ja, false));
    },
  }).addTo(map);

  const b = layer.getBounds();
  const vw = window.innerWidth;
  const pad = vw > 900
    ? { paddingTopLeft: [48, 48], paddingBottomRight: [($("hsg-panel") || {}).offsetWidth || 372, 48] }
    : { paddingTopLeft: [16, 56], paddingBottomRight: [16, Math.round(window.innerHeight * 0.46)] };
  map.fitBounds(b, { ...pad, animate: false });

  map.on("resize", () => { try { map.invalidateSize(); } catch (e) {} });
  window.addEventListener("resize", onWinResize);
}

function onWinResize() { try { if (map) map.invalidateSize(); } catch (e) {} }

// ---------------------------------------------------------------- boot
export async function mountHousing(el, opts) {
  opts = opts || {};
  if (opts.base) forcedBase = opts.base;
  if (mounted) unmountHousing();
  const my = ++bootSeq;
  rootEl = el;
  currentLang = opts.lang && I18N[opts.lang] ? opts.lang : detectLang();
  ensureCss();
  el.innerHTML = `<div id="hsg-root">
    <div id="hsg-loader"><div class="ld-box"><div class="ld-bar"><i></i></div><p class="ld-t">${esc(t().loading)}</p></div></div>
    <div id="hsg-map"></div>
    <div id="hsg-head"></div>
    <button id="hsg-toggle" type="button">${esc(t().toggle)}</button>
    <aside id="hsg-panel"><div id="hsg-card"></div><div id="hsg-list"></div></aside>
    <div id="hsg-legend"></div>
    <div id="hsg-source"></div>
  </div>`;
  rootEl = el.querySelector("#hsg-root");
  panelEl = el.querySelector("#hsg-panel");

  const tg = $("hsg-toggle");
  if (tg) tg.addEventListener("click", () => panelEl.classList.toggle("open"));

  window.setTimeout(() => {
    if (my !== bootSeq || mounted) return;
    const st = el.closest ? el.closest(".stage") : null;
    if (st) { st.classList.add("stage-failed"); st.dataset.live = "0"; }
  }, 15000);

  aborter = new AbortController();
  try {
    L = await loadLeaflet();
    if (my !== bootSeq) return false;
    const [data, poly] = await Promise.all([
      fetchJson("wards.json", aborter.signal),
      fetchJson("wards_poly.json", aborter.signal),
    ]);
    if (my !== bootSeq) return false;
    DATA = data; POLY = poly;
    C = themeColors();
    DATA.wards.slice().sort((a, b) => unitOf(b) - unitOf(a)).forEach((w, i) => { w.rank = i + 1; });
    DATA.wards.sort((a, b) => a.rank - b.rank);
    SCALE = scaleOf(DATA);
    renderHeadAll(); renderLegend();
    initMap();
    selectByWard(DATA.wards[0].ward, false);
    const ld = $("hsg-loader");
    if (ld) { ld.classList.add("fade"); setTimeout(() => { try { ld.remove(); } catch (e) {} }, 500); }
    mounted = true;
    try { requestAnimationFrame(() => setTimeout(() => { try { if (map) map.invalidateSize(); } catch (e) {} }, 80)); } catch (e) {}
    return true;
  } catch (e) {
    const ld = $("hsg-loader");
    if (ld) ld.remove();
    throw e;
  }
}

export function unmountHousing() {
  bootSeq++;
  if (aborter) { try { aborter.abort(); } catch (e) {} aborter = null; }
  try { window.removeEventListener("resize", onWinResize); } catch (e) {}
  try { if (map) { map.off(); map.remove(); } } catch (e) {}
  map = null; layer = null;
  const lk = document.getElementById("hsg-leaflet-css"); if (lk) lk.remove();
  const st = document.getElementById("hsg-style"); if (st) st.remove();
  const dead = rootEl;
  rootEl = null; panelEl = null; DATA = null; POLY = null; curWard = null;
  mounted = false;
  try { if (dead && dead.parentNode) dead.parentNode.removeChild(dead); } catch (e) {}
}

export function setHousingLang(lang) {
  if (!I18N[lang]) return false;
  currentLang = lang;
  if (!DATA) return true;
  renderHeadAll(); renderLegend(); renderCard(); renderList();
  try { document.documentElement.lang = lang; } catch (e) {}
  return true;
}

export function setHousingTheme() {
  // canvas 渲染读不到 CSS 变量：主题切换后重取 accent 并重涂，DOM 部分由 CSS 自动跟随
  C = themeColors();
  if (layer && DATA) {
    layer.eachLayer((l) => {
      const f = l.feature && l.feature.properties;
      if (!f) return;
      const w = DATA.wards.find((x) => x.ward === f.ward_ja);
      const sel = f.ward_ja === curWard;
      l.setStyle({
        color: sel ? C.ink : C.line,
        weight: sel ? 2.4 : 1,
        fillColor: fillForUnit(w && unitOf(w)),
        fillOpacity: sel ? 1 : 0.86,
      });
    });
  }
  return true;
}
export function isHousingMounted() { return mounted; }
export function resetHousingView() {
  if (!map || !layer) return;
  const b = layer.getBounds();
  const vw = window.innerWidth;
  const pad = vw > 900
    ? { paddingTopLeft: [48, 48], paddingBottomRight: [372, 48] }
    : { paddingTopLeft: [16, 56], paddingBottomRight: [16, Math.round(window.innerHeight * 0.46)] };
  map.fitBounds(b, { ...pad, animate: true });
}
export function selectHousingWard(ward) { selectByWard(ward, true); }
export function getHousingLegend() {
  return { breaks: SCALE.breaks.slice(), ramp: RAMP.slice(), basis: DATA ? DATA.basis : null };
}
