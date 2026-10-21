// 住宅 —— 町名（地区名）粒度の平均価格を塗る。
// 官方成約データの最小定位单位は「市区町村 + 地区名（町名）」。
// 不做面积筛选、不算中位数、不做 70㎡ 换算：每个町 = その町の成約価格の平均。

const HSG_LEAFLET_JS = ["/app/housing/vendor/leaflet.js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
const HSG_LEAFLET_CSS = ["/app/housing/vendor/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];

const CSS = `
#hsg-root{position:absolute;inset:0;overflow:hidden;background:var(--bg);font-family:var(--font-sans);color:var(--ink)}
#hsg-map{position:absolute;inset:0;z-index:0}
#hsg-map .leaflet-container{background:var(--bg);font-family:var(--font-sans)}
#hsg-map .leaflet-tile-pane{filter:saturate(.16) contrast(.94)}
html[data-theme="dark"] #hsg-map .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.7) contrast(1.2);opacity:.42}
#hsg-map .leaflet-control-zoom a{background:color-mix(in srgb,var(--bg) 90%,transparent);color:var(--ink);border-bottom-color:rgba(127,127,127,.28);backdrop-filter:blur(8px)}
#hsg-map .leaflet-control-zoom a:hover{background:color-mix(in srgb,var(--bg) 72%,var(--ink) 8%)}
#hsg-map .leaflet-control-attribution{background:color-mix(in srgb,var(--bg) 74%,transparent);color:var(--muted);font-size:10px;padding:2px 6px;border-radius:4px}
#hsg-map .leaflet-control-attribution a{color:var(--muted)}

#hsg-head{position:absolute;left:20px;top:12px;z-index:800;width:auto;height:auto;max-width:min(430px,calc(100% - 40px));padding:12px 16px;border-radius:12px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px) saturate(1.05);-webkit-backdrop-filter:blur(10px) saturate(1.05);box-shadow:0 1px 2px rgba(0,0,0,.1)}
#hsg-head h2{margin:0;font-family:var(--title-font,var(--ja-sans));font-size:15px;font-weight:700;letter-spacing:.01em;color:var(--ink)}
#hsg-head .hsg-basis{margin:5px 0 0;font-size:11px;letter-spacing:.02em;color:var(--muted);font-family:var(--font-num)}
#hsg-source{margin-top:6px;max-width:74ch;font-size:10px;line-height:1.5;color:var(--muted);opacity:.82}
#hsg-source a{color:inherit}

#hsg-legend{position:absolute;left:20px;bottom:20px;z-index:795;width:auto;height:auto;padding:9px 11px;border-radius:10px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);box-shadow:0 1px 2px rgba(0,0,0,.1)}
#hsg-legend .lg-t{font-size:10px;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;font-family:var(--font-num)}
#hsg-legend .lg-row{display:flex;align-items:center;gap:6px;font-family:var(--font-num);font-size:10.5px;color:var(--muted);line-height:1.5}
#hsg-legend .lg-sw{width:18px;height:8px;border-radius:4px;flex:none}
#hsg-legend .lg-credit{display:none}

#hsg-tip{position:absolute;z-index:900;width:auto;height:auto;pointer-events:none;padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);box-shadow:0 6px 20px rgba(0,0,0,.28);font-size:11.5px;line-height:1.5;color:var(--ink);max-width:280px;opacity:0;transition:opacity .1s}
#hsg-tip.on{opacity:1}
#hsg-tip .t-head{margin-bottom:4px;font-size:12.5px}
#hsg-tip .t-row{display:flex;justify-content:space-between;gap:14px}
#hsg-tip .t-mut{color:var(--muted)}
#hsg-tip b{font-family:var(--font-num);font-weight:600}

#hsg-card{position:absolute;right:20px;top:12px;z-index:820;width:300px;height:auto;padding:14px 16px 16px;border-radius:12px;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(14px);box-shadow:0 6px 24px rgba(0,0,0,.18);display:none}
#hsg-card.on{display:block}
#hsg-card .c-name{font-family:var(--title-font,var(--ja-sans));font-size:19px;font-weight:700;color:var(--ink);line-height:1.25}
#hsg-card .c-ward{font-size:11px;color:var(--muted);letter-spacing:.04em}
#hsg-card .c-big{margin:10px 0 2px;font-family:var(--font-num);font-size:30px;font-weight:600;letter-spacing:-.02em;color:var(--ink);line-height:1}
#hsg-card .c-big small{font-size:11px;font-weight:400;color:var(--muted);margin-left:4px}
#hsg-card .c-rows{margin-top:10px}
#hsg-card .c-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;font-size:12px;color:var(--muted);border-top:1px solid color-mix(in srgb,var(--ink) 9%,transparent)}
#hsg-card .c-row:first-child{border-top:0}
#hsg-card .c-row b{font-family:var(--font-num);font-weight:500;color:var(--ink)}
#hsg-card .c-close{position:absolute;right:10px;top:8px;border:0;background:none;color:var(--muted);font-size:16px;cursor:pointer;padding:4px 6px;line-height:1}

@media (max-width:760px){
  #hsg-head{left:12px;top:8px;max-width:calc(100% - 24px);padding:9px 12px;border-radius:10px}
  #hsg-head h2{font-size:13px}
  #hsg-source{display:none}
  #hsg-legend{left:12px;bottom:12px;padding:7px 9px}
  #hsg-legend .lg-row{font-size:9.5px}
  #hsg-legend .lg-credit{display:block;margin-top:5px;font-size:9px;color:var(--muted);opacity:.85}
  #hsg-map .leaflet-control-zoom{display:none}
  #hsg-map .leaflet-control-attribution{display:none}
  #hsg-card{left:12px;right:12px;top:auto;bottom:12px;width:auto;max-height:44vh;overflow-y:auto}
  #hsg-tip{display:none}
}
`;

const I18N = {
  ja: {
    title: "東京23区 中古マンション成約価格",
    basis: (n, t) => `町名ごとの平均 · ${n} 件 · ${t} · 中古マンション等`,
    legend: "平均㎡単価（万円/㎡）",
    source: "出典：国土交通省 不動産情報ライブラリ「不動産取引価格情報／成約価格情報」（PDL 1.0）。町名（地区名）単位で集計。本ページは当サイトが加工して作成したものであり、国が作成・公表したものではありません。",
    price: "平均成約価格", area: "平均面積", unit: "平均㎡単価", deals: "成約件数",
    ward: "区", noData: "データなし", close: "閉じる", wan: "万円", perM2: "万円/㎡", m2: "㎡",
    tipHint: "町をタップで内訳",
  },
  zh: {
    title: "东京23区 二手公寓成交价",
    basis: (n, t) => `按町名平均 · ${n} 笔 · ${t} · 二手公寓等`,
    legend: "平均㎡单价（万日元/㎡）",
    source: "来源：日本国土交通省「不动产情报图书馆」（PDL 1.0）。按町名（地区名）汇总。本页由本站加工制作，并非日本政府发布。",
    price: "平均成交价", area: "平均面积", unit: "平均㎡单价", deals: "成交笔数",
    ward: "区", noData: "无数据", close: "关闭", wan: "万日元", perM2: "万日元/㎡", m2: "㎡",
    tipHint: "点击町看明细",
  },
  en: {
    title: "Tokyo 23 wards — used flat sale prices",
    basis: (n, t) => `Mean by town · ${n} deals · ${t} · used flats`,
    legend: "Mean price per m² (¥10k/m²)",
    source: "Source: MLIT Real Estate Information Library (PDL 1.0). Aggregated by town (district). Compiled by this site; not a government publication.",
    price: "Mean sale price", area: "Mean area", unit: "Mean price/m²", deals: "Deals",
    ward: "Ward", noData: "No data", close: "Close", wan: "¥10k", perM2: "¥10k/m²", m2: "m²",
    tipHint: "Tap a town for the breakdown",
  },
};

let rootEl = null;
let map = null;
let layer = null;
let data = null;
let curLang = "ja";
let curTheme = "sage";
let C = { accent: "#2F6B4F", ink: "#17211A", bg: "#E9EDE3", muted: "#56635A" };
let mounted = false;
let selected = -1;
let RAMP = [0.14, 0.26, 0.38, 0.52, 0.66, 0.82];
let SCALE = null;

const $ = (id) => (rootEl && rootEl.querySelector ? rootEl.querySelector("#" + id) : null);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (n == null || isNaN(n) ? "—" : Math.round(n).toLocaleString("en-US"));
const t = () => I18N[curLang] || I18N.ja;

function themeColors() {
  let accent = "#2F6B4F", ink = "#17211A", bg = "#E9EDE3", muted = "#56635A";
  try {
    const cs = getComputedStyle(document.documentElement);
    accent = cs.getPropertyValue("--accent").trim() || accent;
    ink = cs.getPropertyValue("--ink").trim() || ink;
    bg = cs.getPropertyValue("--bg").trim() || bg;
    muted = cs.getPropertyValue("--muted").trim() || muted;
  } catch (e) {}
  return { accent, ink, bg, muted };
}

function hexToRgb(h) {
  h = (h || "").trim();
  if (h.startsWith("rgb")) {
    const m = h.match(/(\d+(?:\.\d+)?)/g) || [];
    return [+m[0] || 0, +m[1] || 0, +m[2] || 0];
  }
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}

function rgba(hex, a) {
  const c = hexToRgb(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function buildScale() {
  const vals = data.towns.filter((x) => x.unit).map((x) => Math.log10(x.unit)).sort((a, b) => a - b);
  const q = (p) => {
    const i = (vals.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return vals[lo] + (vals[hi] - vals[lo]) * (i - lo);
  };
  const raw = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map((p) => Math.pow(10, q(p)));
  const breaks = [raw[0]];
  for (let i = 1; i < raw.length; i++) if (raw[i] > breaks[breaks.length - 1] * 1.004) breaks.push(raw[i]);
  SCALE = { breaks };
}

function bucket(v) {
  const b = SCALE.breaks.map(Math.log10);
  const lv = Math.log10(v);
  for (let i = 1; i < b.length; i++) if (lv <= b[i]) return i - 1;
  return b.length - 2;
}

function rampFor(i, n) {
  if (n <= 1) return RAMP[RAMP.length - 1];
  return RAMP[Math.round((i * (RAMP.length - 1)) / (n - 1))];
}

function fillFor(town) {
  if (!town || !town.unit) return rgba(C.muted, 0.12);
  const n = SCALE.breaks.length - 1;
  const i = bucket(town.unit);
  const t = n <= 1 ? 1 : i / (n - 1);
  return mix(C.bg, C.accent, 0.14 + 0.78 * Math.pow(t, 0.85));
}

function mountDom() {
  rootEl.innerHTML = `
    <div id="hsg-map"></div>
    <div id="hsg-head"><h2></h2><p class="hsg-basis"></p><div id="hsg-source"></div></div>
    <div id="hsg-legend"></div>
    <div id="hsg-tip"></div>
    <div id="hsg-card"><button class="c-close" type="button" aria-label="${esc(t().close)}">×</button><div class="c-body"></div></div>`;
  const st = document.createElement("style");
  st.textContent = CSS;
  rootEl.appendChild(st);
}

function renderHead() {
  const h = $("hsg-head");
  if (!h) return;
  h.querySelector("h2").textContent = t().title;
  h.querySelector(".hsg-basis").textContent = t().basis(fmt(data.n), data.basis);
  $("hsg-source").innerHTML = `${esc(t().source)} <a href="https://www.reinfolib.mlit.go.jp/" rel="noopener" target="_blank">reinfolib.mlit.go.jp</a>`;
}

function renderLegend() {
  const el = $("hsg-legend");
  if (!el) return;
  const b = SCALE.breaks, n = b.length - 1;
  let rows = "";
  for (let i = 0; i < n; i++) {
    const lo = b[i] / 1e4, hi = b[i + 1] / 1e4;
    const label = i === n - 1 ? `${Math.round(lo)} +` : `${Math.round(lo)}–${Math.round(hi)}`;
    rows += `<div class="lg-row"><span class="lg-sw" style="background:${mix(C.bg, C.accent, 0.14 + 0.78 * Math.pow(n <= 1 ? 1 : i / (n - 1), 0.85))}"></span>${label}</div>`;
  }
  el.innerHTML = `<div class="lg-t">${esc(t().legend)}</div>${rows}<div class="lg-credit">© 国土地理院 · Leaflet</div>`;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("script " + src));
    document.head.appendChild(s);
  });
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (!document.getElementById("hsg-leaflet-css")) {
    const lk = document.createElement("link");
    lk.id = "hsg-leaflet-css"; lk.rel = "stylesheet"; lk.href = HSG_LEAFLET_CSS[0];
    document.head.appendChild(lk);
  }
  return loadScript(HSG_LEAFLET_JS[0]).catch(() => loadScript(HSG_LEAFLET_JS[1]));
}

function styleFor(f) {
  const town = data.towns[f.properties.i];
  const sel = f.properties.i === selected;
  return {
    color: sel ? C.ink : rgba(C.ink, curTheme === "dark" ? 0.18 : 0.16),
    weight: sel ? 2.2 : 0.55,
    fillColor: fillFor(town),
    fillOpacity: sel ? 0.98 : 0.88,
  };
}

function initMap() {
  map = L.map($("hsg-map"), {
    center: [35.69, 139.74], zoom: 11, zoomControl: true, attributionControl: true,
    preferCanvas: true, minZoom: 9, maxZoom: 17, zoomSnap: 0,
  });
  L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
    maxZoom: 18, attribution: "© 国土地理院",
  }).addTo(map);

  const feats = data.geo.features.filter((f) => (data.towns[f.properties.i] || {}).n > 0);
  layer = L.geoJSON({ type: "FeatureCollection", features: feats }, {
    style: styleFor,
    onEachFeature: (f, l) => {
      l.on("mouseover", (e) => {
        const town = data.towns[f.properties.i];
        l.setStyle({ weight: 1.4, color: rgba(C.ink, 0.45) });
        showTip(town, e);
      });
      l.on("mouseout", () => {
        l.setStyle(styleFor(f));
        hideTip();
      });
      l.on("click", (e) => {
        selected = f.properties.i;
        layer.setStyle(styleFor);
        renderCard(selected);
        L.DomEvent.stopPropagation(e);
      });
    },
  }).addTo(map);

  const fit = () => map.fitBounds(layer.getBounds(), { paddingTopLeft: [20, 96], paddingBottomRight: [20, 24] });
  fit();
  setTimeout(() => { try { map.invalidateSize(); fit(); } catch (e) {} }, 160);
  map.on("click", () => closeCard());
}

function showTip(town, e) {
  const tip = $("hsg-tip");
  if (!tip) return;
  tip.innerHTML = townHtml(town);
  tip.classList.add("on");
  const rect = rootEl.getBoundingClientRect();
  const x = e.originalEvent.clientX - rect.left, y = e.originalEvent.clientY - rect.top;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let tx = x + 14, ty = y + 14;
  if (tx + w > rootEl.clientWidth - 8) tx = x - w - 14;
  if (ty + h > rootEl.clientHeight - 8) ty = y - h - 14;
  tip.style.left = Math.max(8, tx) + "px";
  tip.style.top = Math.max(8, ty) + "px";
}

function hideTip() {
  const tip = $("hsg-tip");
  if (tip) tip.classList.remove("on");
}

function townHtml(town) {
  const rows = [
    [t().deals, `${fmt(town.n)}`],
    [t().unit, town.unit ? `${fmt(town.unit / 1e4)} ${t().perM2}` : t().noData],
    [t().price, town.total ? `${fmt(town.total)} ${t().wan}` : t().noData],
  ];
  return `<div class="t-head"><b>${esc(town.town)}</b> <span class="t-mut">${esc(town.ward)}</span></div>` +
    rows.map((r) => `<div class="t-row"><span class="t-mut">${esc(r[0])}</span> <b>${esc(r[1])}</b></div>`).join("");
}

function renderCard(i) {
  const card = $("hsg-card");
  const town = data.towns[i];
  if (!card || !town) return;
  card.classList.add("on");
  card.querySelector(".c-body").innerHTML = `
    <div class="c-name">${esc(town.town)}</div>
    <div class="c-ward">${esc(town.ward)}</div>
    <div class="c-big">${town.unit ? fmt(town.unit / 1e4) : "—"}<small>${esc(t().perM2)}</small></div>
    <div class="c-rows">
      <div class="c-row"><span>${esc(t().price)}</span><b>${town.total ? fmt(town.total) + " " + t().wan : t().noData}</b></div>
      <div class="c-row"><span>${esc(t().deals)}</span><b>${fmt(town.n)}</b></div>
    </div>`;
  card.querySelector(".c-close").onclick = closeCard;
}

function closeCard() {
  selected = -1;
  const card = $("hsg-card");
  if (card) card.classList.remove("on");
  if (layer) layer.setStyle(styleFor);
}

// ---- lifecycle ---------------------------------------------------------
export async function mountHousing(root, opts) {
  rootEl = root;
  rootEl.id = "hsg-root";
  curLang = (opts && opts.lang) || "ja";
  curTheme = (opts && opts.theme) || "sage";
  C = themeColors();
  mountDom();

  const base = (opts && opts.base) || "/";
  const res = await fetch(base + "app/housing/data/towns.json", { cache: "force-cache" });
  if (!res.ok) throw new Error("towns.json " + res.status);
  data = await res.json();
  if (!data || !data.towns || !data.geo) throw new Error("towns empty");
  buildScale();
  renderHead();
  renderLegend();

  await loadLeaflet();
  initMap();
  mounted = true;
  return true;
}

export function unmountHousing() {
  try { if (map) map.remove(); } catch (e) {}
  map = null; layer = null; data = null;
  if (rootEl) rootEl.innerHTML = "";
  mounted = false;
}

export function setHousingLang(lang) {
  if (!I18N[lang]) return false;
  curLang = lang;
  if (!data) return true;
  hideTip();
  renderHead(); renderLegend();
  if (selected >= 0) renderCard(selected);
  return true;
}

export function setHousingTheme() {
  C = themeColors();
  if (layer) layer.setStyle(styleFor);
  renderLegend();
  return true;
}

export function isHousingMounted() { return mounted; }
export function resetHousingView() { if (layer && map) map.fitBounds(layer.getBounds(), { paddingTopLeft: [20, 96], paddingBottomRight: [20, 24] }); }
export function getHousingLegend() { return SCALE ? SCALE.breaks.slice() : []; }
