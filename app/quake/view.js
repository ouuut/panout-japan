/* japan.ouuut.com · Quake view (single-page mount)
 * Source: sites/quake/dist/assets/index-*.js + dist/data/*.json (read-only rollback anchor).
 * Vendor (app/quake/vendor/quake-core.js) is the dist bundle with deterministic
 * string patches ONLY (no logic edits):
 *   - mount root `#app` -> `#v-quake-viewport` (1x)
 *   - eq-topbar block stripped (shell owns header + i18n + theme dots)
 *   - data paths `./data/...` -> `${window.__QK_DATA__||'./app/quake/data'}/...` (4x)
 *   - documentElement theme/eq-var writes -> #v-quake-viewport first (6 sites)
 *   - SW register gated behind window.__QK_ENABLE_SW__ (single page: no SW)
 * Frozen verbatim: depth 7-stop palette (484984/4556168/8627608/14129441/
 *   16678937/16468276/10289158 + legend gradient), 632 pts n/a (quake),
 *   tile thresholds/manifest+legacy-quakes.json fallback chain.
 * Theme map (ouuut shell -> viewport-scoped vars in quake-core.css):
 *   mono/sage/dark -> viewport tokens; depth gradient + globe palette frozen.
 * Data: ./app/quake/data/*.json on mount only (fallback ../ for preview/ dev).
 * API: mountQuake(root, {lang, theme}) / unmountQuake() /
 *      setQuakeLang(l) / setQuakeTheme(t) / getQuakeSummary()
 */
'use strict';

const DATA_CANDIDATES = ['./app/quake/data', '../app/quake/data'];
let forcedBase = null; // shell opts.base wins (./ at site root, ../ under preview/)
const VENDOR_CANDIDATES = [
  './app/quake/vendor/quake-core.js',
  '../app/quake/vendor/quake-core.js',
];
const CSS_CANDIDATES = [
  './app/quake/vendor/quake-core.css',
  '../app/quake/vendor/quake-core.css',
];
const THEME_MAP = { sage: 'sage', dark: 'dark', mono: 'sage', tactical: 'dark' };

let mounted = false;
let bootToken = 0;
let vendorState = 'idle'; // idle | loading | ready | failed
let vendorPromise = null;
let vendorError = null;
let hostEl = null;
let viewportEl = null;
let ro = null;
let mo = null;
let rafKickTimer = 0;
let currentLang = 'ja';
let currentTheme = 'sage';
let summary = null;

function detectLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q) {
      const s = q.toLowerCase();
      if (s.startsWith('ja')) return 'ja';
      if (s.startsWith('en')) return 'en';
      if (s.startsWith('zh')) return 'zh';
    }
    const saved =
      localStorage.getItem('pp-lang') || localStorage.getItem('eq-lang');
    if (saved) {
      const s = saved.toLowerCase();
      if (s.startsWith('ja')) return 'ja';
      if (s.startsWith('en')) return 'en';
      if (s.startsWith('zh')) return 'zh';
    }
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('en')) return 'en';
  } catch (e) {}
  return 'ja';
}

function detectTheme() {
  try {
    const t = localStorage.getItem('pp-theme');
    if (t === 'sage' || t === 'dark') return t;
  } catch (e) {}
  const de = document.documentElement.getAttribute('data-theme');
  if (de === 'sage' || de === 'dark') return de;
  return 'sage';
}

function injectCss() {
  if (document.getElementById('qk-style')) return Promise.resolve();
  const libs = forcedBase ? [forcedBase + 'app/quake/vendor/quake-core.css'] : CSS_CANDIDATES.slice();
  return new Promise((resolve) => {
    const next = () => {
      const u = libs.shift();
      if (!u) return resolve(); // CSS is progressive enhancement; never block
      const l = document.createElement('link');
      l.id = 'qk-style';
      l.rel = 'stylesheet';
      const ver = (typeof window !== 'undefined' && window.__PP_BUILD__) ? String(window.__PP_BUILD__) : '';
      l.href = ver ? (u + (u.indexOf('?') >= 0 ? '&' : '?') + 'v=' + ver) : u;
      l.onload = () => resolve();
      l.onerror = () => {
        try { l.remove(); } catch (e) {}
        next();
      };
      document.head.appendChild(l);
    };
    next();
  });
}

function loadVendorOnce() {
  if (vendorState === 'ready') return Promise.resolve();
  if (vendorState === 'failed') return Promise.reject(vendorError);
  if (vendorPromise) return vendorPromise;
  vendorState = 'loading';
  // Remount needs a FRESH vendor run (bundle self-executes on import only; cached
  // module won't rebuild the scene). Bust with a query stamp; disk-cache hit, zero network.
  const stamp = (typeof bootToken !== 'undefined' ? bootToken : 0) + '-' + Date.now();
  const vendorList = forcedBase ? [forcedBase + 'app/quake/vendor/quake-core.js?t=' + stamp] : VENDOR_CANDIDATES.slice();
  vendorPromise = (async () => {
    let lastErr = null;
    for (const u of vendorList) {
      try {
        await import(/* @vite-ignore */ new URL(u, document.baseURI).href);
        vendorState = 'ready';
        return;
      } catch (e) { lastErr = e; }
    }
    vendorState = 'failed';
    vendorError = lastErr;
    throw lastErr;
  })();
  return vendorPromise;
}

function readSummaryFromDom() {
  try {
    const vp = viewportEl;
    if (!vp) return null;
    const canvas = vp.querySelector('#eq-canvas');
    const foot = vp.querySelector('#eq-footer');
    return {
      canvas: !!canvas,
      w: canvas ? canvas.clientWidth || canvas.width : 0,
      h: canvas ? canvas.clientHeight || canvas.height : 0,
      footer: foot ? (foot.textContent || '').slice(0, 80) : '',
    };
  } catch (e) { return null; }
}

async function boot(token) {
  if (token !== bootToken || !mounted) return null;
  try {
    await loadVendorOnce();
  } catch (e) {
    console.error('[quake] vendor load failed', e);
    if (viewportEl && token === bootToken) {
      try { const v = hostEl && hostEl.querySelector('.qk-veil'); if (v && v.parentNode) v.parentNode.removeChild(v); } catch (e2) {}
      viewportEl.innerHTML =
        '<div class="qk-fail">3D 地球仪加载失败 / failed to load globe vendor. ' +
        String((e && e.message) || e) + '</div>';
    }
    return null;
  }
  if (token !== bootToken || !mounted) return null;
  // Vendor runs synchronously on import against #v-quake-viewport (already in DOM).
  summary = readSummaryFromDom();
  localizeDock();
  [600, 1800].forEach(function (ms) {
    setTimeout(function () { if (token === bootToken && mounted) localizeDock(); }, ms);
  });
  if (!summary || !summary.canvas) {
    console.error('[quake] vendor ran but #eq-canvas missing');
    try { const v = hostEl && hostEl.querySelector('.qk-veil'); if (v && v.parentNode) v.parentNode.removeChild(v); } catch (e) {}
    return null;
  }
  // 遮罩撤除：等画布真正画出震点（亮点占比超阈值）且至少 2.6s；暗色画布阈值可能偏低，4.4s 兜底
  try {
    const v = hostEl && hostEl.querySelector('.qk-veil');
    if (v) {
      const t0 = Number(v.dataset.t0 || Date.now());
      const cv = viewportEl && viewportEl.querySelector('#eq-canvas');
      let tries = 0;
      const done = () => {
        try {
          if (v) {
            v.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
            v.style.opacity = '0';
            setTimeout(() => {
              try { if (v.parentNode) v.parentNode.removeChild(v); } catch (e) {}
            }, 650);
          }
        } catch (e) {}
      };
      const tick = () => {
        tries++;
        let dotsOk = false;
        try {
          if (cv && cv.width) {
            const c2 = document.createElement('canvas');
            c2.width = 320; c2.height = Math.max(1, Math.round(320 * cv.height / cv.width));
            const cx = c2.getContext('2d'); cx.drawImage(cv, 0, 0, c2.width, c2.height);
            const d = cx.getImageData(0, 0, c2.width, c2.height).data;
            let n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] > 60 || d[i+1] > 60 || d[i+2] > 60) n++; }
            dotsOk = n / (c2.width * c2.height) > 0.035;
          }
        } catch (e) {}
        if ((dotsOk && Date.now() - t0 >= 2600) || tries > 8) return done();
        setTimeout(tick, 500);
      };
      setTimeout(tick, 400);
    }
  } catch (e) {}
  // Nudge resize so renderer picks up the real box (shell .stage may settle late).
  try {
    window.dispatchEvent(new Event('resize'));
  } catch (e) {}
  if (rafKickTimer) { try { clearTimeout(rafKickTimer); } catch (e) {} rafKickTimer = 0; }
  rafKickTimer = setTimeout(() => {
    summary = readSummaryFromDom();
  }, 1200);
  return summary;
}

/* Mount: host = section#v-quake (or any ancestor). Viewport contract:
 * host.querySelector('#v-quake-viewport') || host.querySelector('.stage') || host.
 * Lazy: CSS + vendor JS + data all fetch only here (never on first paint).
 */
function mountQuake(root, opts) {
  opts = opts || {};
  if (opts.base) forcedBase = opts.base;
  if (mounted) unmountQuake();
  vendorState = 'idle'; vendorPromise = null; vendorError = null;
  const host = typeof root === 'string' ? document.querySelector(root) : root;
  if (!host) throw new Error('qk: mount root missing');
  hostEl = host;

  let viewport =
    host.querySelector('#v-quake-viewport') ||
    host.querySelector('.stage') ||
    host;
  // If the shell placeholder .stage holds placeholder <b>/<span>, clear it so the
  // globe owns the box. Otherwise (already a viewport) keep content and let the
  // vendor append; duplicate-mount guard clears leftovers below.
  if (viewport !== host && viewport.id !== 'v-quake-viewport') {
    viewport.id = 'v-quake-viewport';
  }
  if (!viewport.querySelector('#eq-canvas')) viewport.innerHTML = '';
  viewportEl = viewport;
  // 加载遮罩：vendor 画布出现前挡住空舞台（防慢网/冷缓存下"地图全空"）
  try {
    if (!host.querySelector('.qk-veil')) {
      const veil = document.createElement('div');
      veil.className = 'qk-veil';
      veil.textContent = '読み込み中 · Loading…';
      veil.style.cssText = 'position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;background:#12100d;color:#8a8478;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;pointer-events:none';
      veil.dataset.t0 = String(Date.now());
      host.appendChild(veil);
      setTimeout(() => { try { if (veil.parentNode) veil.parentNode.removeChild(veil); } catch (e) {} }, 30000);
    }
  } catch (e) {}

  currentLang = opts.lang || detectLang();
  currentTheme = (opts.theme && THEME_MAP[opts.theme]) ? opts.theme : detectTheme();
  try { viewportEl.setAttribute('data-quake-theme', THEME_MAP[currentTheme] || 'mono'); } catch (e) {}
  try {
    localStorage.setItem('eq-lang', currentLang);
  } catch (e) {}

  // Data base for this mount: shell opts.base wins, else probe.
  let base = forcedBase ? forcedBase + 'app/quake/data' : DATA_CANDIDATES[0];
  try {
    const u = new URL(VENDOR_CANDIDATES[0], document.baseURI).href;
    void u;
  } catch (e) {}
  // Probe (only when shell did not give base): prefer the candidate whose outline fetches.
  const probe = forcedBase ? (async () => { try { window.__QK_DATA__ = base; } catch (e) {} })() : (async () => {
    for (const c of DATA_CANDIDATES) {
      try {
        const r = await fetch(c + '/japan-outline.json', { method: 'HEAD' });
        if (r.ok) { base = c; break; }
      } catch (e) {}
    }
    try { window.__QK_DATA__ = base; } catch (e) {}
  })();

  injectCss();
  try { window.__QK_ENABLE_SW__ = false; } catch (e) {}

  mounted = true;
  const token = ++bootToken;

  if (typeof ResizeObserver !== 'undefined') {
    try {
      ro = new ResizeObserver(() => {
        try { window.dispatchEvent(new Event('resize')); } catch (e) {}
      });
      ro.observe(viewportEl);
    } catch (e) { ro = null; }
  }
  // Keep viewport theme attr in sync if the shell flips data-theme while mounted.
  try {
    mo = new MutationObserver(() => {
      try {
        const t = document.documentElement.getAttribute('data-theme');
        if (t && THEME_MAP[t]) viewportEl.setAttribute('data-quake-theme', THEME_MAP[t]);
      } catch (e) {}
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) { mo = null; }

  return probe.then(() => boot(token));
}

function teardownDom() {
  if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
  if (mo) { try { mo.disconnect(); } catch (e) {} mo = null; }
  if (rafKickTimer) { try { clearTimeout(rafKickTimer); } catch (e) {} rafKickTimer = 0; }
  if (viewportEl) {
    try {
      // Vendor owns: canvas + eq-* UI + WebGL context + rAF loop (self-perpetuating
      // inside module scope; no exported dispose). Remove every node it created,
      // force-context-loss to free the GPU, then empty the box so a remount
      // starts clean. The module stays cached (zero re-download on remount).
      const nodes = viewportEl.querySelectorAll('canvas');
      nodes.forEach((c) => {
        try {
          const gl = c.getContext('webgl2') || c.getContext('webgl');
          const ext = gl && gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        } catch (e) {}
      });
      viewportEl.innerHTML = '';
      viewportEl.removeAttribute('data-quake-theme');
    } catch (e) {}
  }
  summary = null;
  hostEl = null;
  viewportEl = null;
}

function unmountQuake() {
  bootToken++;
  mounted = false;
  teardownDom();
}

const DOCK_LABELS = {
  'eq-menu': { ja: 'メニュー', zh: '菜单', en: 'Menu' },
  'eq-size-mode': { ja: '規模', zh: '震级', en: 'Size' },
  'eq-btn-mag': { ja: '最小M', zh: '震级筛', en: 'Min mag' },
  'eq-btn-year': { ja: '年', zh: '年份', en: 'Year' },
  'eq-btn-depth': { ja: '深さ', zh: '深度', en: 'Depth' },
};
const DOCK_TITLES = {
  'eq-menu': { ja: 'ツールを開閉', zh: '展开/收起工具', en: 'Toggle tools' },
  'eq-size-mode': { ja: '点の大きさ：規模', zh: '点大小：按震级', en: 'Point size: magnitude' },
  'eq-btn-mag': { ja: '最小規模', zh: '最小震级', en: 'Minimum magnitude' },
  'eq-btn-year': { ja: '年範囲', zh: '年份区间', en: 'Year range' },
  'eq-btn-depth': { ja: '深さの強調', zh: '深度夸张', en: 'Depth exaggeration' },
};
function localizeDock() {
  if (!viewportEl) return;
  for (const id of Object.keys(DOCK_LABELS)) {
    const el = viewportEl.querySelector('#' + id);
    if (!el) continue;
    const l = DOCK_LABELS[id][currentLang] || DOCK_LABELS[id].en;
    const t = DOCK_TITLES[id][currentLang] || DOCK_TITLES[id].en;
    if (el.textContent.trim() !== l) el.textContent = l;
    if (el.title !== t) el.title = t;
  }
  const pwa = viewportEl.querySelector('#eq-pwa-install');
  if (pwa) pwa.style.display = 'none';
}

function setQuakeLang(l) {
  if (l !== 'ja' && l !== 'zh' && l !== 'en') return false;
  currentLang = l;
  try { localStorage.setItem('eq-lang', l); } catch (e) {}
  // Vendor UI is zh-first and frozen; localize the visible dock labels here.
  localizeDock();
  return true;
}

function setQuakeTheme(t) {
  const id = THEME_MAP[t] || 'sage';
  currentTheme = t;
  try {
    if (viewportEl) viewportEl.setAttribute('data-quake-theme', id);
  } catch (e) {}
  try {
    if (typeof window !== 'undefined' && typeof window.__setQuakeTheme === 'function') {
      window.__setQuakeTheme(id);
    }
  } catch (e) {}
  return id;
}

function getQuakeSummary() { return summary; }

export { mountQuake, unmountQuake, setQuakeLang, setQuakeTheme, getQuakeSummary };
