#!/usr/bin/env node
// build-vendor.mjs — dist bundle -> app/quake/vendor/quake-core.js
// 用法: node sites/quake/scripts/build-vendor.mjs [dist-js-path]
// 6 类 deterministic string patches（每处 assert-guarded，命中数不对即 fail）：
//   1. mount root `#app` -> `#v-quake-viewport`（2x）
//   2. eq-topbar 整块 strip（shell 接管 header+i18n）
//   3. data 路径 `./data/...` -> `${window.__QK_DATA__||'./app/quake/data'}/...`（4x）
//   4. documentElement theme/var 写 -> viewport 优先（6x，data-theme 除外）
//   5. SW register 门控 window.__QK_ENABLE_SW__
//   6. [panout] dock/rotate/legend 默认值（原站 :root 遗落的，25bd246 同值）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QUAKE = path.resolve(HERE, '..');
const ROOT = path.resolve(QUAKE, '..', '..');
const OUT = path.join(ROOT, 'app', 'quake', 'vendor', 'quake-core.js');

const arg = process.argv[2];
const distDir = path.join(QUAKE, 'dist', 'assets');
const src = arg ?? fs.readdirSync(distDir).filter((f) => f.startsWith('index-') && f.endsWith('.js')).map((f) => path.join(distDir, f))[0];
if (!src || !fs.existsSync(src)) {
  console.error('[vendor] FAIL: dist js not found, run `vite build` in sites/quake first');
  process.exit(1);
}
let s = fs.readFileSync(src, 'utf8');
let n;
const must = (name, find, repl, expect = 1) => {
  n = s.split(find).length - 1;
  if (n !== expect) {
    console.error(`[vendor] FAIL: patch ${name}: expect ${expect}x, got ${n}x`);
    process.exit(1);
  }
  s = s.split(find).join(repl);
  console.log(`[vendor] patch ${name}: ${n}x ok`);
};
// 1. mount root
must('mount-root', 'document.querySelector(`#app`)', 'document.querySelector(`#v-quake-viewport`)', 1);
must('mount-missing', 'throw Error(`#app missing`)', 'throw Error(`#v-quake-viewport missing`)', 1);
// 2. topbar strip: header 创建 -> lang 接线 try/catch -> 下一个 aside 创建，整段删（变量名随构建漂移，用内容锚定）
{
  const startMark = 'document.createElement(`header`)';
  const hi = s.indexOf(startMark);
  if (hi < 0) {
    console.error('[vendor] FAIL: patch topbar-strip: header create missing');
    process.exit(1);
  }
  // 回退到行内 var 起点
  const varStart = s.lastIndexOf('var ', hi);
  const asideMark = 'document.createElement(`aside`)';
  let ai = s.indexOf(asideMark, hi);
  if (ai < 0) {
    console.error('[vendor] FAIL: patch topbar-strip: next aside missing');
    process.exit(1);
  }
  const varAside = s.lastIndexOf('var ', ai);
  // 中间必须含 eq-topbar 模板与 appendChild，否则切错
  const cut = s.slice(varStart, varAside);
  if (!cut.includes('eq-topbar') || !cut.includes('appendChild')) {
    console.error('[vendor] FAIL: patch topbar-strip: cut region mismatch');
    process.exit(1);
  }
  s = s.slice(0, varStart) + '/* [panout] eq-topbar stripped: shell provides header/i18n */' + s.slice(varAside);
  console.log('[vendor] patch topbar-strip: 1x ok');
}

// 3. data paths
must('data-manifest', '`./data/quakes/manifest.json`', "`${window.__QK_DATA__||`./app/quake/data`}/quakes/manifest.json`", 1);
must('data-tiles', '`./data/quakes/tiles/`', "`${window.__QK_DATA__||`./app/quake/data`}/quakes/tiles/`", 1);
must('data-outline', '`./data/japan-outline.json`', "`${window.__QK_DATA__||`./app/quake/data`}/japan-outline.json`", 1);
must('data-legacy', '`./data/quakes.json`', "`${window.__QK_DATA__||`./app/quake/data`}/quakes.json`", 1);
// 4. CSS var writes -> viewport first
must('var-legend-grad', 'document.documentElement.style.setProperty(`--eq-legend-grad`', '(document.querySelector(`#v-quake-viewport`)||document.documentElement).style.setProperty(`--eq-legend-grad`', 1);
must('var-rotate-len', 'document.documentElement.style.setProperty(`--eq-rotate-len`', '(document.querySelector(`#v-quake-viewport`)||document.documentElement).style.setProperty(`--eq-rotate-len`', 1);
must('var-legend-len', 'document.documentElement.style.setProperty(`--eq-legend-len`', '(document.querySelector(`#v-quake-viewport`)||document.documentElement).style.setProperty(`--eq-legend-len`', 1);
must('var-coast', 'document.documentElement.style.setProperty(`--eq-coast`', '(document.querySelector(`#v-quake-viewport`)||document.documentElement).style.setProperty(`--eq-coast`', 1);
// 4e. data-theme writes (2x) -> viewport data-quake-theme（两处尾巴形态不同，分别处理）
{
  // 处1: `setAttribute(`data-theme`,X),ad(X);` 整段吞（ad 恒等调用无副作用）
  const re1 = /document\.documentElement\.setAttribute\(`data-theme`,([A-Za-z_$][\w$]*)\),ad\(\1\);/g;
  const h1 = [...s.matchAll(re1)];
  if (h1.length !== 1) {
    console.error(`[vendor] FAIL: patch var-quake-theme/1: expect 1x, got ${h1.length}x`);
    process.exit(1);
  }
  s = s.replace(re1, 'try{document.querySelector(`#v-quake-viewport`)?.setAttribute(`data-quake-theme`,$1)}catch(e){};');
  console.log('[vendor] patch var-quake-theme/1: 1x ok');
  // 处2: `setAttribute(`data-theme`,X);` 分号语句，单换
  const re2 = /document\.documentElement\.setAttribute\(`data-theme`,([A-Za-z_$][\w$]*)\);/g;
  const h2 = [...s.matchAll(re2)];
  if (h2.length !== 1) {
    console.error(`[vendor] FAIL: patch var-quake-theme/2: expect 1x, got ${h2.length}x`);
    process.exit(1);
  }
  s = s.replace(re2, 'try{document.querySelector(`#v-quake-viewport`)?.setAttribute(`data-quake-theme`,$1)}catch(e){};');
  console.log('[vendor] patch var-quake-theme/2: 1x ok');
}

// 5. SW gate（调用函数名随构建漂移，用 `serviceWorker`in navigator` 锚定）
{
  const mark = ',`serviceWorker`in navigator)';
  const idx = s.indexOf(mark);
  if (idx < 0) {
    console.error('[vendor] FAIL: patch sw-gate: anchor missing');
    process.exit(1);
  }
  // 往前找同行内上一个 ), 插入 window.__QK_ENABLE_SW__&&
  const prev = s.lastIndexOf('),', idx);
  if (prev < 0 || idx - prev > 60) {
    console.error('[vendor] FAIL: patch sw-gate: call anchor mismatch');
    process.exit(1);
  }
  s = s.slice(0, prev + 2) + 'window.__QK_ENABLE_SW__&&' + s.slice(prev + 2);
  console.log('[vendor] patch sw-gate: 1x ok');
}

fs.writeFileSync(OUT, s.replace(/\n/g, '\r\n'));
console.log(`[vendor] wrote ${OUT} (${s.length} bytes)`);
