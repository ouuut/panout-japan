#!/usr/bin/env node
// 装配：preview 壳 + app 三视图 → site/（生产发布件，一次部署上 japan.ouuut.com）
// 用法：node site/assemble.mjs [--check]
// --check：只比对（不一致即 exit 1），不写盘
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SITE = HERE;
const checkOnly = process.argv.includes("--check");
let dirty = 0;
const syncFile = (src, dst) => {
  const cur = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  const nxt = fs.readFileSync(src);
  if (cur && cur.equals(nxt)) return "same";
  if (checkOnly) { console.error(`[assemble] DIFF: ${path.relative(ROOT, dst)}`); dirty++; return "diff"; }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return "wrote";
};
// 0) app 文件清单 + 版本戳（视图 JS / quake CSS 的 ?v= 用它；内容一变缓存即失效）
const APP_FILES = [
  "quake/view.js", "quake/vendor/quake-core.js", "quake/vendor/quake-core.css",
  "quake/data/japan-outline.json", "quake/data/quakes.json",
  "crime/view.js", "crime/data/points.json", "crime/data/muni_poly.json",
  "crime/data/chome_poly.json", "crime/data/muni.json", "crime/data/meta.json",
  "cabinet/view.js", "cabinet/data.json",
];
const crypto = await import("crypto");
const _hh = crypto.createHash("sha1");
for (const f of APP_FILES) _hh.update(fs.readFileSync(path.join(ROOT, "app", f)));
const BUILD = _hh.digest("hex").slice(0, 10);
// 1) 壳：preview/index.html → site/index.html（去 preview 文案 + 注入版本戳）
let shell = fs.readFileSync(path.join(ROOT, "preview/index.html"), "utf8");
shell = shell.replace(/__PP_BUILD_HASH__/g, BUILD);
shell = shell.replace(/<title>Pan Out Japan — preview<\/title>/, "<title>Pan Out Japan — 日本本土情報の門面 | 地震・犯罪率・内閣支持率</title>");
shell = shell.replace(/<span>preview — 框架占位 · 无真实数据<\/span>/, "<span>© 2026 Pan Out Japan · ouuut</span>");
const shellDst = path.join(SITE, "index.html");
if (checkOnly) {
  const cur = fs.existsSync(shellDst) ? fs.readFileSync(shellDst, "utf8") : "";
  if (cur !== shell) { console.error("[assemble] DIFF: site/index.html"); dirty++; }
} else {
  fs.writeFileSync(shellDst, shell);
}
// 2) 三视图：app/<view>/{view.js,vendor/,data/,data.json} → site/app/…（显式列文件，不整目录梭）
for (const f of APP_FILES) {
  const r = syncFile(path.join(ROOT, "app", f), path.join(SITE, "app", f));
  if (!checkOnly) console.log(`[assemble] app/${f}: ${r}`);
}
// 2b) 震源瓦片数据：app/quake/data/quakes/**（manifest + tiles）整目录同步
const walkDir = (dir, base) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkDir(p, base));
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out;
};
const QK_DIR = path.join(ROOT, "app/quake/data/quakes");
if (fs.existsSync(QK_DIR)) {
  for (const rel of walkDir(QK_DIR, QK_DIR)) {
    const r = syncFile(path.join(QK_DIR, rel), path.join(SITE, "app/quake/data/quakes", rel));
    if (!checkOnly) console.log(`[assemble] app/quake/data/quakes/${rel}: ${r}`);
  }
} else {
  console.error("[assemble] FAIL: 缺 app/quake/data/quakes/（震源瓦片数据）");
  process.exit(1);
}
// 3) 旧三子路径清场（单页后 /quake/ /crime/ /cabinet/ 不再存在）
for (const d of ["quake", "crime", "cabinet"]) {
  const p = path.join(SITE, d);
  if (fs.existsSync(p)) {
    if (checkOnly) { console.error(`[assemble] STALE: site/${d}/ 仍在`); dirty++; }
    else { fs.rmSync(p, { recursive: true, force: true }); console.log(`[assemble] rm site/${d}/`); }
  }
}
// 4) sitemap：单页只有根（旧三子路径条目删掉）
const sm = path.join(SITE, "sitemap.xml");
let xml = fs.readFileSync(sm, "utf8");
let xml2 = xml.replace(/\s*<url><loc>https:\/\/japan\.ouuut\.com\/(quake|crime|cabinet)\/<\/loc><changefreq>weekly<\/changefreq><\/url>\n?/g, "");
if (xml2 !== xml) { if (checkOnly) { console.error("[assemble] DIFF: sitemap.xml 仍含旧子路径"); dirty++; } else fs.writeFileSync(sm, xml2); }
// 5) llms.txt：门改成单页 hash 路由
const ll = path.join(SITE, "llms.txt");
let txt = fs.readFileSync(ll, "utf8");
const txt2 = txt.replace(/## Gates（外链跳转，老站现行 URL）/, "## Gates（本站 hash 路由，单页三视图）")
  .replace(/\(https:\/\/3d\.saaaai\.com\/\)/g, "(https://japan.ouuut.com/#/quake)")
  .replace(/\(https:\/\/crime\.saaaai\.com\/\)/g, "(https://japan.ouuut.com/#/crime)")
  .replace(/\(https:\/\/japan\.saaaai\.com\/\)/g, "(https://japan.ouuut.com/#/cabinet)");
if (txt2 !== txt) { if (checkOnly) { console.error("[assemble] DIFF: llms.txt 门未更新"); dirty++; } else fs.writeFileSync(ll, txt2); }
// 6) 校验：根 index + app 13 文件都在
const need = ["index.html", ...APP_FILES.map(f => "app/" + f)];
for (const f of need) {
  if (!fs.existsSync(path.join(SITE, f))) { console.error(`[assemble] FAIL: 缺 ${f}`); process.exit(1); }
}
if (checkOnly) { console.log(dirty ? `[assemble] CHECK FAIL: ${dirty} 处不一致` : "[assemble] CHECK OK"); process.exit(dirty ? 1 : 0); }
console.log("[assemble] OK: 壳+app13文件齐，旧子路径已清，sitemap/llms 已改单页门");
