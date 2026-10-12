#!/usr/bin/env node
// 装配：门面 site/ + 三站子路径 → 一次部署上 japan.ouuut.com
// 用法：node site/assemble.mjs [--skip-quake-build]
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SITE = HERE;
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit", shell: true });

const skipQuake = process.argv.includes("--skip-quake-build");

for (const d of ["quake", "crime", "cabinet"]) {
  fs.rmSync(path.join(SITE, d), { recursive: true, force: true });
}

fs.cpSync(path.join(ROOT, "sites/crime/site"), path.join(SITE, "crime"), { recursive: true });
fs.cpSync(path.join(ROOT, "sites/cabinet/dist"), path.join(SITE, "cabinet"), { recursive: true });

if (!skipQuake) {
  const q = path.join(ROOT, "sites/quake");
  sh("npm install --no-audit --no-fund", q);
  sh("npm run build", q);
  const manifest = path.join(q, "dist/data/quakes/manifest.json");
  if (!fs.existsSync(manifest)) console.warn("[assemble] WARN: quake 瓦片缺失，先占位，跑 npm run fetch-data 补全");
}
fs.cpSync(path.join(ROOT, "sites/quake/dist"), path.join(SITE, "quake"), { recursive: true });

fs.rmSync(path.join(ROOT, "sites/quake/node_modules"), { recursive: true, force: true });
fs.rmSync(path.join(SITE, "quake/node_modules"), { recursive: true, force: true });

const sm = path.join(SITE, "sitemap.xml");
let xml = fs.readFileSync(sm, "utf8");
for (const p of ["quake/", "crime/", "cabinet/"]) {
  const loc = `https://japan.ouuut.com/${p}`;
  if (!xml.includes(loc)) {
    xml = xml.replace("</urlset>", `  <url><loc>${loc}</loc><changefreq>weekly</changefreq></url>\n</urlset>`);
  }
}
fs.writeFileSync(sm, xml);

for (const f of ["index.html", "quake/index.html", "crime/index.html", "cabinet/index.html"]) {
  if (!fs.existsSync(path.join(SITE, f))) { console.error(`[assemble] FAIL: 缺 ${f}`); process.exit(1); }
}
console.log("[assemble] OK: 四页齐，sitemap 已补子路径");
