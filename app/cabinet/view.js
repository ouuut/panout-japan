/* japan.ouuut.com · Cabinet view (single-page mount)
 * Source: sites/cabinet/index.html (read-only rollback anchor, 895 lines).
 * Frozen verbatim: I18N dict + checkI18n block + helpers(fmtMonth/fmtLatest) +
 *   VARIANT_CHART palettes + RANGES + bucket/series/tooltip/markLine/dataZoom math.
 * Stripped shell chrome: topbar/site-nav/theme-dropdown/lang-group/foot meta writes.
 * Namespace: cab- prefix. Mount box contract: #v-cabinet-viewport > #cab-chart.
 * Theme map (ouuut shell -> chart variant): mono/sage -> editorial, dark -> tactical.
 * Data: ./app/cabinet/data.json on mount only (fallback ../ for preview/ dev).
 * ECharts: dynamic import (jsdelivr primary, unpkg fallback), no static script tag.
 * API: mountCabinet(root, {lang, theme}) / unmountCabinet() /
 *      setCabinetLang(l) / setCabinetTheme(t) / setCabinetRange(id) / getCabinetSummary()
 */
'use strict';

const DATA_CANDIDATES = ["./app/cabinet/data.json","../app/cabinet/data.json"];
let cabForcedBase = null; // shell opts.base wins
const ECHARTS_URLS = [
  "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js",
  "https://unpkg.com/echarts@5.5.1/dist/echarts.min.js"
];
const THEME_MAP = { mono: "editorial", sage: "editorial", dark: "tactical", tactical: "tactical", editorial: "editorial" };
const CAB_CSS = "#v-cabinet-viewport,#cab-chart{width:100%}\n#cab-chart{height:100%;min-height:340px}\n.cab-host{display:flex;flex-direction:column;height:100%;min-height:0}\n.cab-host>#cab-chart{order:0;flex:1 1 auto;height:auto;min-height:0}\n.cab-host>.cab-controls{order:-1;flex:0 0 auto;height:auto;min-height:0;padding:8px 12px 0}\n.cab-host>.cab-meta{height:auto;top:8px;right:12px}\n.cab-viewport{position:relative}\n.cab-meta{position:absolute;top:10px;right:12px;z-index:5;display:flex;align-items:center;gap:8px;pointer-events:none;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.06em}\n.cab-latest{display:none}\n.cab-range{color:var(--muted);white-space:nowrap}\n.cab-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}\n.cab-legend{display:flex;flex-wrap:wrap;align-items:center;gap:4px;max-width:100%}\n.cab-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border:0;border-radius:999px;background:transparent;color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;line-height:1.4;font-family:inherit}\n.cab-pill:hover{color:var(--ink);background:var(--surface)}\n.cab-pill .cab-dot{width:6px;height:6px;border-radius:50%;background:var(--faint);flex-shrink:0}\n.cab-pill.cab-focused{background:var(--accent);color:#fff;font-weight:700}\n.cab-pill.cab-focused .cab-dot{background:#fff !important}\n.cab-pill.cab-exit-focus{background:var(--accent-soft);color:var(--accent-ink);font-weight:700}\n.cab-pill.cab-exit-focus:hover{background:var(--accent);color:#fff}\n.cab-fail{display:flex;align-items:center;justify-content:center;min-height:240px;color:var(--muted);font-size:13px;padding:24px;text-align:center}\n@media(max-width:640px){.cab-meta{top:8px;right:8px;font-size:10px}#cab-chart{min-height:300px}}";

function syncVariantAttr() {
  try { if (refs.viewport) refs.viewport.dataset.cabVariant = currentVariant; } catch (e) {}
}

const I18N = {
  ja: {
    htmlLang: 'ja', ogLocale: 'ja_JP',
    h1: '内閣支持率 2000→｜NHK 月次世論調査',
    title: '内閣支持率 2000→｜NHK 月次世論調査',
    metaDesc: '2000年から2026年までのNHK月次世論調査に基づく内閣支持率・不支持率の推移グラフ。NHK放送文化研究所・NHK選挙WEBを主軸に日経・朝日・時事・読売・JNN・共同通信各社調査を統合し、月平均でプロット。',
    eyebrow: 'CABINET APPROVAL · NHK MONTHLY POLLS',
    wmMain: '内閣支持率',
    navAria: '姉妹サイト',
    nav: { home: 'トップ', quake: '地震', crime: '犯罪率', cabinet: '内閣支持率' },
    langAria: '言語切り替え',
    themeLabel: 'テーマ',
    variants: { tactical: '戦術·琥珀', editorial: '紙感·朱砂' },
    srcLine: '2000 年 1 月以降の NHK 月次世論調査（放送文化研究所 + 選挙WEB）・多社平均。縦線 = 首相交代 / 同色 = 同一首相。',
    ranges: { '3m': '3ヶ月', '1y': '1年', '2y': '2年', '5y': '5年', '10y': '10年', 'all': '全期間' },
    exitFocus: '✕ 全部表示', exitTitle: 'クリックで全首相の線を元に戻す',
    pillTitle: 'クリックでこの首相の線にフォーカス',
    yName: '支持率 (%)', avgWord: '平均', corpAvg: '社平均',
    footRights: '© japan.ouuut.com',
    footSources: 'データ：USGS · 警視庁 · NHK ｜ CC BY 公開統計',
    footHome: '← トップへ戻る',
    chartFail: 'グラフライブラリの読み込みに失敗しました。ネットワークと CDN フォールバックを確認してください。'
  },
  zh: {
    htmlLang: 'zh-CN', ogLocale: 'zh_CN',
    h1: '日本内阁支持率 2000→｜NHK 月度舆论调查',
    title: '日本内阁支持率 2000→｜NHK 月度舆论调查',
    metaDesc: '基于2000年至2026年NHK月度舆论调查的日本内阁支持率/不支持率走势图。以NHK放送文化研究所与NHK选举WEB为主，整合日经、朝日、时事、读卖、JNN、共同社等各社调查，按月平均绘制。',
    eyebrow: 'CABINET APPROVAL · NHK MONTHLY POLLS',
    wmMain: '内阁支持率',
    navAria: '姊妹站点',
    nav: { home: '门面', quake: '地震', crime: '犯罪率', cabinet: '内阁支持率' },
    langAria: '切换界面语言',
    themeLabel: '主题',
    variants: { tactical: '战术·琥珀', editorial: '纸感·朱砂' },
    srcLine: '2000年1月以来的NHK月度舆论调查（放送文化研究所＋选举WEB）·多社平均。竖线＝首相交接／同色＝同一首相。',
    exitFocus: '✕ 显示全部', exitTitle: '点击恢复全部首相曲线',
    pillTitle: '点击聚焦该首相曲线',
    ranges: { '3m': '3个月', '1y': '1年', '2y': '2年', '5y': '5年', '10y': '10年', 'all': '全期间' },
    yName: '支持率 (%)', avgWord: '平均', corpAvg: '家媒体平均',
    footRights: '© japan.ouuut.com',
    footSources: '数据：USGS · 警视厅 · NHK ｜ CC BY 公开统计',
    footHome: '← 返回门面',
    chartFail: '图表库加载失败，请检查网络与 CDN 备用链路。'
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US',
    h1: 'Japan Cabinet Approval 2000→｜NHK Monthly Polls',
    title: 'Japan Cabinet Approval 2000→｜NHK Monthly Polls',
    metaDesc: 'Japan cabinet approval/disapproval trends from NHK monthly opinion polls, 2000–2026. Anchored on the NHK Broadcasting Culture Research Institute and NHK Election WEB, merged with Nikkei, Asahi, Jiji, Yomiuri, JNN and Kyodo polls as monthly averages.',
    eyebrow: 'CABINET APPROVAL · NHK MONTHLY POLLS',
    wmMain: 'Cabinet Approval',
    navAria: 'Sister sites',
    nav: { home: 'Home', quake: 'Quakes', crime: 'Crime', cabinet: 'Approval' },
    langAria: 'Switch interface language',
    themeLabel: 'Theme',
    variants: { tactical: 'Tactical Amber', editorial: 'Paper Cinnabar' },
    srcLine: 'NHK monthly opinion polls since Jan 2000 (Broadcasting Culture Research Institute + Election WEB), multi-poll average. Vertical line = PM change / same colour = same PM.',
    ranges: { '3m': '3M', '1y': '1Y', '2y': '2Y', '5y': '5Y', '10y': '10Y', 'all': 'All' },
    exitFocus: '✕ Show all', exitTitle: 'Click to restore all PM lines',
    pillTitle: 'Click to focus this PM’s line',
    yName: 'Approval (%)', avgWord: 'avg', corpAvg: 'poll avg',
    footRights: '© japan.ouuut.com',
    footSources: 'Data: USGS · MPD Tokyo · NHK ｜ CC BY open statistics',
    footHome: '← Back to home',
    chartFail: 'Failed to load the chart library. Check your network and the CDN fallback.'
  }
};

const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtMonth(lang, y, m) {
  if (lang === 'en') return EN_MONTHS[m - 1] + ' ' + y;
  return y + '年' + m + '月';
}
function fmtLatest(lang, y, m, avg, n) {
  const t = I18N[lang];
  if (lang === 'en') return 'Latest: ' + fmtMonth(lang, y, m) + ' · ' + avg + '% (' + n + '-' + t.corpAvg + ')';
  if (lang === 'zh') return '最新 ' + fmtMonth(lang, y, m) + ' ' + avg + '%（' + n + t.corpAvg + '）';
  return '最新 ' + fmtMonth(lang, y, m) + ' ' + avg + '%（' + n + t.corpAvg + '）';
}
/* 缺键阻断自查：以 ja 为基准，zh/en 逐键比对；缺键/类型不一致即阻断渲染 */
function checkI18n() {
  const problems = [];
  const walk = (base, cand, path) => {
    for (const k of Object.keys(base)) {
      const p = path + '.' + k;
      const bv = base[k];
      const cv = cand ? cand[k] : undefined;
      if (cv === undefined) { problems.push('missing ' + p); continue; }
      if (bv && typeof bv === 'object' && !Array.isArray(bv)) {
        if (!cv || typeof cv !== 'object' || Array.isArray(cv)) problems.push('type-mismatch ' + p);
        else walk(bv, cv, p);
      } else if (typeof bv !== typeof cv) {
        problems.push('type-mismatch ' + p);
      }
    }
  };
  for (const lang of ['zh', 'en']) walk(I18N.ja, I18N[lang], lang);
  return problems;
}

/* ============================================================
   Variant（tactical 默认深色 / editorial 纸白可切）
   ECharts 收敛到 tactical：曲线主色 accent，网格/文字按 token
   ============================================================ */
const VARIANTS = [
  { id: 'tactical',   swatch: '#FF6A3D' },
  { id: 'editorial',  swatch: '#2F6B4F' }
];
function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
const VARIANT_CHART = {
  tactical: {
    palette: [
      '#E09F67', '#94A3B8', '#34D399', '#F87171', '#C084FC',
      '#FBBF24', '#38BDF8', '#60A5FA', '#818CF8', '#FF6A3D',
      '#4ADE80', '#FB923C', '#A78BFA', '#F472B6'
    ],
    chart: {
      gridBorder: 'transparent',
      tooltipBg: 'rgba(16,14,12,0.95)', tooltipBorder: 'rgba(255,244,232,0.18)',
      tooltipText: '#EDEBE4', tooltipMuted: '#A09E96', tooltipDim: '#6F6D66',
      axisLine: 'rgba(237,235,228,0.18)', axisLabel: '#A09E96',
      splitLine: 'rgba(237,235,228,0.08)', splitLineType: 'dashed',
      zoomBorder: 'rgba(237,235,228,0.14)', zoomBg: '#141412', zoomFill: 'rgba(255,106,61,0.18)', zoomHandle: '#FF6A3D', zoomText: '#A09E96',
      markLabelBg: 'rgba(20,20,18,0.92)', pointBorder: '#0E0E0C'
    }
  },
  editorial: {
    palette: [
      '#8A5A36', '#5E6B73', '#1E6B52', '#A34828', '#685B79',
      '#9E7B34', '#2A6F97', '#3F88C5', '#1D4E89', '#C14953',
      '#4B7F52', '#D06A2A', '#6C5B7B', '#B53471'
    ],
    chart: {
      gridBorder: 'transparent',
      tooltipBg: 'rgba(250,252,248,0.97)', tooltipBorder: 'rgba(23,33,26,0.16)',
      tooltipText: '#17211A', tooltipMuted: '#56635A', tooltipDim: '#88948B',
      axisLine: 'rgba(23,33,26,0.22)', axisLabel: '#56635A',
      splitLine: 'rgba(23,33,26,0.07)', splitLineType: 'dashed',
      zoomBorder: 'rgba(23,33,26,0.14)', zoomBg: '#DFE5D8', zoomFill: 'rgba(47,107,79,0.16)', zoomHandle: '#2F6B4F', zoomText: '#56635A',
      markLabelBg: 'rgba(255,255,255,0.95)', pointBorder: '#FFFFFF'
    }
  }
};
let chart = null;
let rawData = null;
let activeRange = "10y";
let focusCabinet = null;
let lastSummary = null;
let mounted = false;
let bootToken = 0;
let refs = {};
let hostEl = null;
let controlsEl = null;
let createdControls = false;
let prevControlsHTML = "";
let ro = null;

/* ---------- 语言：?lang= > localStorage > navigator > 默认 ja ---------- */
function detectInitialLang() {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q) {
    const s = q.toLowerCase();
    if (s === 'ja' || s === 'ja-jp') return 'ja';
    if (s === 'zh' || s === 'zh-cn' || s === 'zh-tw') return 'zh';
    if (s === 'en' || s === 'en-us') return 'en';
  }
  const saved = localStorage.getItem('cabinet-lang');
  if (saved && I18N[saved]) return saved;
  const navs = navigator.languages || [navigator.language || ''];
  for (const l of navs) {
    const s = (l || '').toLowerCase();
    if (s.startsWith('ja')) return 'ja';
    if (s.startsWith('zh')) return 'zh';
    if (s.startsWith('en')) return 'en';
  }
  return 'ja';
}
let currentLang = 'ja';
try { currentLang = detectInitialLang(); } catch (e) {}

/* ---------- 主题：?theme= > localStorage > 旧键迁移 > 默认 tactical ---------- */
function detectInitialVariant() {
  const q = new URLSearchParams(window.location.search).get('theme');
  const norm = (v) => {
    if (v === 'tactical' || v === 'gruvbox-dark' || v === 'saaaai-mono') return 'tactical';
    if (v === 'editorial' || v === 'paper-editorial' || v === 'claude-cream') return 'editorial';
    return null;
  };
  if (q && norm(q)) return norm(q);
  const saved = localStorage.getItem('cabinet-variant');
  if (saved && VARIANTS.some(v => v.id === saved)) return saved;
  const legacy = localStorage.getItem('cabinet-theme');
  if (legacy && norm(legacy)) return norm(legacy);
  return 'tactical';
}
let currentVariant = 'tactical';
try { currentVariant = detectInitialVariant(); } catch (e) {}

function variantName(id) {
  const t = I18N[currentLang] || I18N.ja;
  return t.variants[id] || id;
}

function setCabinetLang(lang) {
  if (!I18N[lang]) return false;
  currentLang = lang;
  if (!rawData) return true;
  renderZoomSeg();
  buildLegend();
  renderChart();
  return true;
}

function setCabinetTheme(t) {
  const id = THEME_MAP[t] || 'tactical';
  currentVariant = id;
  syncVariantAttr();
  if (chart && rawData) renderChart();
  return id;
}

function setCabinetRange(id) {
  if (!RANGE_WINDOW_MONTHS.hasOwnProperty(id)) return false;
  activeRange = id;
  focusCabinet = null;
  if (!rawData) return true;
  renderZoomSeg();
  buildLegend();
  renderChart();
  return true;
}

function getCabinetSummary() { return lastSummary; }

function ensureEcharts() {
  const g = (typeof window !== 'undefined') ? window : globalThis;
  if (g.echarts) return Promise.resolve(g.echarts);
  const viaImport = async () => {
    for (const u of ECHARTS_URLS) {
      try { await import(/* @vite-ignore */u); if (g.echarts) return g.echarts; } catch (e) {}
    }
    throw new Error('echarts import failed');
  };
  const viaScript = () => new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('echarts: no dom'));
    const libs = ECHARTS_URLS.slice();
    const next = () => {
      const u = libs.shift();
      if (!u) return reject(new Error('echarts CDN failed'));
      const s = document.createElement('script');
      s.src = u; s.async = true;
      s.onload = () => { if (g.echarts) resolve(g.echarts); else { try { s.remove(); } catch (e) {} next(); } };
      s.onerror = () => { try { s.remove(); } catch (e) {} next(); };
      document.head.appendChild(s);
    };
    next();
  });
  return viaImport().catch(viaScript);
}

const RANGES = [
  { id: '3m' }, { id: '1y' }, { id: '2y' },
  { id: '5y' }, { id: '10y' }, { id: 'all' }
];
const RANGE_WINDOW_MONTHS = { '3m': 3, '1y': 12, '2y': 24, '5y': 60, '10y': 120, 'all': 0 };

function renderZoomSeg() {
  const t = I18N[currentLang] || I18N.ja;
  refs.zoom.innerHTML = '';
  RANGES.forEach(r => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.ranges[r.id];
    b.classList.toggle('on', r.id === activeRange);
    b.addEventListener('click', () => {
      activeRange = r.id;
      focusCabinet = null;
      renderZoomSeg();
      buildLegend();
      renderChart();
    });
    refs.zoom.appendChild(b);
  });
}

function tchart() { return VARIANT_CHART[currentVariant].chart; }
function cabColors() { return VARIANT_CHART[currentVariant].palette; }

function injectCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cab-style')) return;
  const st = document.createElement('style');
  st.id = 'cab-style';
  st.textContent = CAB_CSS;
  document.head.appendChild(st);
}

function onCabResize() { if (chart) { try { chart.resize(); } catch (e) {} } }

async function boot(token) {
  const problems = checkI18n();
  if (problems.length) {
    console.error('i18n missing keys (render blocked):', problems);
    refs.box.innerHTML = '<div class="cab-fail">i18n missing keys: ' + problems.join(', ') + '</div>';
    return null;
  }
  try {
    await ensureEcharts();
  } catch (e) {
    const t = I18N[currentLang] || I18N.ja;
    console.error('echarts load failed', e);
    refs.box.innerHTML = '<div class="cab-fail">' + t.chartFail + '</div>';
    return null;
  }
  if (!rawData) {
    let lastErr = null;
    const dataList = cabForcedBase ? [cabForcedBase + 'app/cabinet/data.json'] : DATA_CANDIDATES;
    for (const u of dataList) {
      try {
        const resp = await fetch(u);
        if (!resp.ok) throw new Error('http ' + resp.status);
        rawData = await resp.json();
        lastErr = null;
        break;
      } catch (e) { lastErr = e; }
    }
    if (!rawData) {
      console.error('data.json load failed', lastErr);
      return null;
    }
  }
  if (token !== bootToken || !mounted) return null;
  renderZoomSeg();
  buildLegend();
  renderChart();
  return lastSummary;
}

function mountCabinet(root, opts) {
  opts = opts || {};
  if (opts.base) cabForcedBase = opts.base;
  if (mounted) unmountCabinet();
  const host = typeof root === 'string' ? document.querySelector(root) : root;
  if (!host) throw new Error('cab: mount root missing');
  hostEl = host;
  host.classList.add('cab-host');
  injectCss();

  const viewport = host.querySelector('#v-cabinet-viewport') || host.querySelector('.stage') || host;
  if (!viewport.querySelector('#cab-chart')) viewport.innerHTML = '';
  viewport.classList.add('cab-viewport');
  refs.viewport = viewport;
  const box = document.createElement('div');
  box.id = 'cab-chart';
  viewport.appendChild(box);
  refs.box = box;
  const meta = document.createElement('div');
  meta.className = 'cab-meta';
  const latest = document.createElement('span');
  latest.className = 'cab-latest';
  latest.id = 'cab-latest';
  const range = document.createElement('span');
  range.className = 'cab-range';
  range.id = 'cab-range';
  meta.appendChild(latest);
  meta.appendChild(range);
  viewport.appendChild(meta);
  refs.latest = latest;
  refs.range = range;

  controlsEl = host.querySelector('.controls');
  if (controlsEl) {
    prevControlsHTML = controlsEl.innerHTML;
    controlsEl.innerHTML = '';
    createdControls = false;
  } else {
    controlsEl = document.createElement('div');
    controlsEl.className = 'controls cab-controls';
    host.appendChild(controlsEl);
    prevControlsHTML = '';
    createdControls = true;
  }
  const zoom = document.createElement('div');
  zoom.className = 'seg cab-zoom';
  zoom.id = 'cab-zoom';
  const legend = document.createElement('div');
  legend.className = 'cab-legend';
  legend.id = 'cab-legend';
  controlsEl.appendChild(zoom);
  controlsEl.appendChild(legend);
  refs.zoom = zoom;
  refs.legend = legend;

  currentLang = (opts.lang && I18N[opts.lang]) ? opts.lang : detectInitialLang();
  currentVariant = (opts.theme && THEME_MAP[opts.theme]) ? THEME_MAP[opts.theme] : detectInitialVariant();
  syncVariantAttr();

  mounted = true;
  const token = ++bootToken;
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', onCabResize);
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => onCabResize());
    try { ro.observe(box); } catch (e) {}
  }
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => onCabResize());
  return boot(token);
}

function unmountCabinet() {
  bootToken++;
  mounted = false;
  if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('resize', onCabResize);
  if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
  if (chart) { try { chart.dispose(); } catch (e) {} chart = null; }
  lastSummary = null;
  if (refs.viewport) {
    try {
      if (refs.box && refs.box.parentNode) refs.box.parentNode.removeChild(refs.box);
      const metaEl = refs.viewport.querySelector('.cab-meta');
      if (metaEl && metaEl.parentNode) metaEl.parentNode.removeChild(metaEl);
      if (refs.viewport.classList) refs.viewport.classList.remove('cab-viewport');
    } catch (e) {}
  }
  if (controlsEl) {
    try {
      if (createdControls) {
        if (controlsEl.parentNode) controlsEl.parentNode.removeChild(controlsEl);
      } else {
        controlsEl.innerHTML = prevControlsHTML;
      }
    } catch (e) {}
  }
  if (hostEl) { try { hostEl.classList.remove('cab-host'); } catch (e) {} }
  refs = {};
  hostEl = null;
  controlsEl = null;
  createdControls = false;
  prevControlsHTML = '';
}

function buildLegend() {
  if (!rawData) return;
  const t = I18N[currentLang] || I18N.ja;
  const el = refs.legend;
  el.innerHTML = '';

  if (focusCabinet) {
    const exitBtn = document.createElement('button');
    exitBtn.type = 'button';
    exitBtn.className = 'cab-pill cab-exit-focus';
    exitBtn.textContent = t.exitFocus;
    exitBtn.title = t.exitTitle;
    exitBtn.addEventListener('click', () => {
      focusCabinet = null;
      buildLegend();
      renderChart();
    });
    el.appendChild(exitBtn);
  }

  rawData.cabinets.forEach((c, i) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'cab-pill';
    pill.title = t.pillTitle;
    const color = cabColors()[i % cabColors().length];
    /* chip = 6px 色点 + 名（14px 灰字 hover 变亮，focus 显示 accent 底+白字） */
    const dot = document.createElement('span');
    dot.className = 'cab-dot';
    dot.style.background = color;
    pill.appendChild(dot);
    const name = document.createElement('span');
    name.textContent = c.pm;
    pill.appendChild(name);

    if (focusCabinet === c.id) pill.classList.add('cab-focused');
    pill.addEventListener('click', () => {
      focusCabinet = (focusCabinet === c.id) ? null : c.id;
      buildLegend();
      renderChart();
    });
    el.appendChild(pill);
  });
}

function pmByDate(dateStr) {
  const d = new Date(dateStr);
  for (let i = rawData.cabinets.length - 1; i >= 0; i--) {
    if (d >= new Date(rawData.cabinets[i].start)) return rawData.cabinets[i];
  }
  return rawData.cabinets[0];
}

function renderChart() {
  if (!window.echarts || !rawData) return;
  const t = I18N[currentLang] || I18N.ja;
  if (!chart) chart = echarts.init(refs.box, null, {renderer: 'canvas'});

  const polls = rawData.polls;
  const cabinets = rawData.cabinets;
  const C = cabColors();
  const T = tchart();
  const isNarrow = window.innerWidth <= 880;
  const gridL = isNarrow ? 44 : 64;
  const gridR = isNarrow ? 12 : 64;

  const buckets = {};
  polls.forEach(p => {
    if (p.derived) return;
    const cab = pmByDate(p.date);
    const ym = p.date.slice(0, 7);
    const key = cab.id + '|' + ym;
    if (!buckets[key]) buckets[key] = { cab, ym, sums: 0, n: 0, sources: [] };
    buckets[key].sums += p.value;
    buckets[key].n += 1;
    buckets[key].sources.push({ src: p.source, v: p.value, kind: p.kind || '' });
  });

  const markAreaData = cabinets.map((c, idx) => {
    const isEven = idx % 2 === 0;
    const bg = isEven
      ? (currentVariant === 'editorial' ? 'rgba(0,0,0,0.028)' : 'rgba(255,255,255,0.028)')
      : 'transparent';
    return [
      { xAxis: c.start, itemStyle: { color: bg } },
      { xAxis: c.end }
    ];
  });

  const series = [];
  cabinets.forEach((c, i) => {
    const color = C[i % C.length];
    const points = [];
    Object.keys(buckets).sort().forEach(key => {
      const rec = buckets[key];
      if (rec.cab.id !== c.id) return;
      const d = rec.ym + '-15';
      const avg = Math.round((rec.sums / rec.n) * 10) / 10;
      points.push([d, avg, rec.n, rec.sources]);
    });

    if (points.length > 0) {
      const focused = focusCabinet === c.id;
      series.push({
        name: c.pm,
        type: 'line',
        data: points,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: focused ? 8 : 5,
        smooth: 0.15,
        connectNulls: false,
        lineStyle: {
          color: color,
          width: focused ? 3.5 : 2.2,
          type: 'solid',
          opacity: focusCabinet ? (focused ? 1 : 0.18) : 0.95,
          shadowBlur: currentVariant === 'tactical' ? (focused ? 10 : 4) : 0,
          shadowColor: currentVariant === 'tactical' ? hexToRgba(color, 0.45) : 'transparent'
        },
        itemStyle: {
          color: color,
          borderColor: T.pointBorder,
          borderWidth: 1.5,
          opacity: focusCabinet ? (focused ? 1 : 0.18) : 1
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, currentVariant === 'editorial' ? 0.20 : 0.24) },
            { offset: 0.85, color: hexToRgba(color, 0.02) },
            { offset: 1, color: hexToRgba(color, 0.0) }
          ]),
          opacity: focusCabinet ? (focused ? 1 : 0.04) : 0.85
        },
        emphasis: { focus: 'series', scale: 1.5 },
        z: focused ? 6 : 3,
        markArea: i === 0 ? {
          silent: true,
          data: markAreaData
        } : undefined,
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          lineStyle: {
            color: currentVariant === 'editorial' ? 'rgba(23,33,26,0.18)' : 'rgba(237,235,228,0.16)',
            type: 'dashed',
            width: focused ? 2 : 1.2,
            opacity: focusCabinet ? (focused ? 0.95 : 0.12) : 0.65
          },
          label: {
            position: 'end',
            formatter: c.pm,
            color: color,
            fontSize: isNarrow ? 11 : 13,
            fontWeight: 700,
            fontFamily: 'var(--ja-sans), system-ui, sans-serif',
            padding: isNarrow ? [2, 5] : [3, 8],
            backgroundColor: T.markLabelBg,
            borderColor: hexToRgba(color, 0.45),
            borderWidth: 1.2,
            borderRadius: 6,
            distance: 8
          },
          labelLayout: { hideOverlap: true, moveOverlap: 'shiftX' },
          data: [{ xAxis: c.start }]
        }
      });
    }
  });

  const allDates = polls.map(p => p.date).sort();
  const startDate = allDates[0];
  const endDate = allDates[allDates.length - 1];
  // 最新月 bucket 画在 ym-15（如 2026-09-15），raw 末点（如 2026-09-11）比它早：
  // max 若用 raw 末点，9 月点会被裁在轴外。取两者较大者再向右垫 18 天，9 月点落在轴内。
  const bucketDates = Object.values(buckets).map(r => r.ym + '-15').sort();
  const lastBucket = bucketDates[bucketDates.length - 1];
  const axisMaxTime = Math.max(new Date(endDate).getTime(), new Date(lastBucket).getTime()) + 18 * 86400000;
  const axisMaxISO = new Date(axisMaxTime).toISOString().slice(0, 10);

  const wMonths = RANGE_WINDOW_MONTHS[activeRange];
  let zoomStart = 0;
  if (wMonths > 0) {
    const spanMs = new Date(endDate) - new Date(startDate);
    const winMs = wMonths * 30.44 * 86400000;
    zoomStart = Math.max(0, Math.round((1 - winMs / spanMs) * 1000) / 10);
  }

  const focusCab = focusCabinet ? rawData.cabinets.find(c => c.id === focusCabinet) : null;
  let focusWindow = null;
  if (focusCab && wMonths > 0) {
    const winMs = wMonths * 30.44 * 86400000;
    const tMin = new Date(startDate).getTime();
    const tMax = new Date(endDate).getTime();
    const cStart = new Date(focusCab.start).getTime();
    const cEnd = new Date(focusCab.end).getTime();
    const center = (cStart + cEnd) / 2;
    let ws = center - winMs / 2;
    let we = center + winMs / 2;
    if (ws < tMin) { ws = tMin; we = tMin + winMs; }
    if (we > tMax) { we = tMax; ws = tMax - winMs; }
    focusWindow = { startValue: new Date(ws), endValue: new Date(we) };
  }

  const sliderDZ = {
    type: 'slider', xAxisIndex: 0,
    left: gridL, right: gridR,
    height: 24, bottom: 18,
    borderRadius: 8,
    borderColor: T.zoomBorder,
    backgroundColor: T.zoomFill,
    fillerColor: T.zoomFill,
    handleSize: 14,
    brushSelect: false,
    dataBackground: { lineStyle: { color: 'rgba(0,0,0,0)' }, areaStyle: { color: 'rgba(0,0,0,0)' } },
    selectedDataBackground: { lineStyle: { color: 'rgba(0,0,0,0)' }, areaStyle: { color: 'rgba(0,0,0,0)' } },
    moveHandleSize: 0,
    handleIcon: 'path://M-8,-9h16a4,4 0 0 1 4,4v10a4,4 0 0 1 -4,4h-16a4,4 0 0 1 -4,-4v-10a4,4 0 0 1 4,-4z',
    handleStyle: {
      color: T.zoomHandle, borderColor: 'rgba(0,0,0,0.28)', borderWidth: 1,
      shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.35)', shadowOffsetY: 1.5
    },
    emphasis: { handleStyle: { color: T.zoomHandle, borderColor: T.zoomHandle, shadowBlur: 7 } },
    textStyle: { color: T.zoomText, fontSize: 10 }
  };
  if (focusWindow) {
    sliderDZ.startValue = focusWindow.startValue;
    sliderDZ.endValue = focusWindow.endValue;
  } else {
    sliderDZ.start = zoomStart;
    sliderDZ.end = 100;
  }

  const lang = currentLang;
  const option = {
    backgroundColor: 'transparent',
    grid: { left: gridL, right: gridR, top: 48, bottom: 100, borderColor: T.gridBorder },
    legend: { show: false },
    tooltip: {
      trigger: 'axis',
      backgroundColor: T.tooltipBg,
      borderColor: T.tooltipBorder,
      borderWidth: 1,
      padding: [10, 14],
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.18);backdrop-filter:blur(8px);',
      textStyle: { color: T.tooltipText, fontSize: 12 },
      formatter: function(params) {
        if (!params || params.length === 0) return '';
        const d = new Date(params[0].axisValue);
        const cab = pmByDate(params[0].axisValue);
        const ymStr = fmtMonth(lang, d.getFullYear(), d.getMonth() + 1);
        const p = params[0];
        const avg = p.data ? p.data[1] : null;
        const n = p.data ? p.data[2] : 0;
        const sources = p.data ? (p.data[3] || []) : [];
        const cabIdx = cab ? cabinets.findIndex(x => x.id === cab.id) : 0;
        const col = C[cabIdx % C.length] || '#FF6A3D';
        let html = '<div style="min-width:180px;font-family:var(--font-sans),system-ui,sans-serif">';
        html += '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">';
        html += '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + col + ';box-shadow:0 0 6px ' + hexToRgba(col, 0.6) + '"></span>';
        html += '<span style="font-weight:700;font-size:13.5px;color:' + T.tooltipText + '">' + (cab ? cab.pm : '') + ' 内阁</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ' + T.splitLine + '">';
        html += '<span style="color:' + T.tooltipMuted + ';font-size:11.5px;letter-spacing:.02em">' + ymStr + '</span>';
        html += '<span style="font-size:22px;font-weight:800;color:' + col + ';font-family:var(--mono),monospace;line-height:1">' + avg + '<small style="font-size:11px;font-weight:500">%</small></span>';
        html += '</div>';
        html += '<div style="color:' + T.tooltipMuted + ';font-size:10.5px;margin-bottom:6px;letter-spacing:.02em">' + n + ' ' + t.corpAvg + ' · ' + t.avgWord + '</div>';
        sources.forEach(s => {
          html += '<div style="display:flex;justify-content:space-between;font-size:11.5px;line-height:1.6;color:' + T.tooltipText + '">';
          html += '<span style="color:' + T.tooltipMuted + '">' + s.src + (s.kind ? ' (' + s.kind + ')' : '') + '</span>';
          html += '<span style="font-weight:600;font-family:var(--mono),monospace">' + s.v + '%</span>';
          html += '</div>';
        });
        html += '</div>';
        return html;
      }
    },
    xAxis: {
      type: 'time', min: startDate, max: axisMaxISO,
      axisLine: { lineStyle: { color: T.axisLine } },
      axisLabel: { color: T.axisLabel, fontSize: 11, hideOverlap: true },
      splitLine: { show: true, lineStyle: { color: T.splitLine, type: T.splitLineType } }
    },
    yAxis: {
      type: 'value', min: 0, max: 100, interval: 10,
      name: t.yName,
      nameTextStyle: { color: T.axisLabel, fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: T.axisLabel, formatter: '{value}%' },
      splitLine: { show: true, lineStyle: { color: T.splitLine, type: T.splitLineType } }
    },
    dataZoom: [
      sliderDZ,
      {
        type: 'inside', xAxisIndex: 0,
        start: focusWindow ? undefined : zoomStart,
        end: focusWindow ? undefined : 100,
        startValue: focusWindow ? focusWindow.startValue : undefined,
        endValue: focusWindow ? focusWindow.endValue : undefined,
        zoomOnMouseWheel: 'shift', moveOnMouseWheel: true
      }
    ],
    animation: true,
    animationDuration: 1100,
    animationDurationUpdate: 650,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    series: series
  };

  /* 最新月徽标：取 buckets 里最大 ym 的月平均，直接写"最新 2026年9月 57.8%"，不插值不手写 */
  const latestYM = Object.values(buckets).map(r => r.ym).sort().pop();
  const latestRecs = Object.values(buckets).filter(r => r.ym === latestYM);
  const latestSum = latestRecs.reduce((a, r) => a + r.sums, 0);
  const latestN = latestRecs.reduce((a, r) => a + r.n, 0);
  const latestAvg = Math.round((latestSum / latestN) * 10) / 10;
  const latestBadge = refs.latest;
  if (latestBadge && latestYM) {
    const [ly, lm] = latestYM.split('-');
    latestBadge.textContent = fmtLatest(lang, Number(ly), Number(lm), latestAvg, latestN);
  }

  chart.setOption(option, true);
  lastSummary = { ym: latestYM, avg: latestAvg, n: latestN, series: series.length,
    points: series.reduce((a, s) => a + (s.data ? s.data.length : 0), 0) };

  /* 同步副标题右侧"当前范围"提示 */
  const rn = refs.range;
  if (rn) {
    const rlabel = t.ranges[activeRange] || '';
    if (focusCabinet) {
      const fc = rawData.cabinets.find(c => c.id === focusCabinet);
      rn.textContent = (fc ? fc.pm + ' · ' : '') + rlabel;
    } else {
      rn.textContent = rlabel;
    }
  }
}
export { mountCabinet, unmountCabinet, setCabinetLang, setCabinetTheme, setCabinetRange, getCabinetSummary };
