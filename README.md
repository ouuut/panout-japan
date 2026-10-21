# japan.ouuut.com · 日本本土信息汇聚

`japan.ouuut.com` —— 拉远看地震，凑近看犯罪，拉长看内阁。同一片国土，三种时间。

> 状态：**M4.13 全站五大视觉与体验精进：内阁全高维基档案面板、折线免隐藏、分割线大字标签及地震浅色同步与按钮对齐**（2026-10-21）。生产根 `F:/projects/panout-japan`，仓 `ouuut/panout-japan`。
> 命名：**japan.ouuut.com**。域名即品牌，旧字标已退役。
> 线上：`https://japan.ouuut.com`（Cloudflare Pages `panout-site`，M4 commit `fff7e76`）。
> 本地预览：`http://127.0.0.1:8900/`（构建后 `cd site && python -m http.server 8900`）；旧 `/preview/` 自动跳到 `/`。
> 视觉与交互打磨：内阁右侧面板全高重构，继承犯罪率面板的 MiSans VF 极细排版，补全 14 届内阁详实维基史料档案与三大核心政策；取消折线淡化保持全貌；分割线名字升至 97% 置顶且字号放大至 20px 醒目呈现；地震页彻底修复浅色模式 WebGL 主题同步与左上角按钮水平参差对齐。

## 架构

**一仓一构建一部署**：`python src/build.py` 从 `src/` + `app/{quake,crime,cabinet}/data` 生成整个 `site/`（**4 个内容页**），
`site/` 原样部署到 Cloudflare Pages。没有运行时拼页、没有 hash 路由、没有客户端数据渲染。

```
src/
  build.py      # 唯一构建入口：三语字典、页面模板、静态图表 SVG、CSV/i18n/sitemap/headers
  home_plates.py# 总入口预览的三张构建期数据板（地震/犯罪/内阁）
  home-preview.css # 总入口三入口同屏原型（/）
  svgkit.py     # Web Mercator、海岸线裁剪、SVG path
  fonts.py      # Outfit 800 + Noto Serif/Sans JP/SC 700/500 子集化 → site/assets/fonts (11 文件 ~1.1MB)
  fix_cabinet.py# 内阁数据修正（NHK 2008/09 列错位、同月双调查标注）
  fetch_fonts.py# 字体源下载
  patch_vendor.py # quake bundle 的品牌字符串补丁（域名/出典/重载文案）
  slim_quake_data.py # 海岸线 0.05° 简化 + 震点数值精度收敛（原文件备份 .cache/quake-orig）
app/
  quake/        # 3D 地球（WebGL）+ 瓦片数据，章节页全屏自动挂载
  crime/        # Leaflet 町丁目地图，同一全屏挂载机制
  cabinet/      # ECharts 支持率长轴，同一全屏挂载机制
site/           # 构建产物，gitignore
```

页面只有 **4 个内容页**：`/`（总入口）、`/quake/`、`/crime/`、`/cabinet/`。
年份、区市町村、内阁任期不再生成独立详情页；数据保留在章节页表格与图表内。`/preview/` 只是旧链接的跳转别名。

### 当前改版预览

`/` 是总入口：三块数据板同屏并排，每块本身是 `<a>`，直接进入对应章节页；没有弹层、没有“先选中、再打开”的中间状态。三章各自是独立 URL，进入后是吸顶 header + 全屏应用，页面本身不滚动，交互全部在应用内。SEO/GEO 以 title、description、JSON-LD 和 `sr-only` H1 保底；全屏 canvas 的可见正文较少，这是全屏取舍。它使用 `src/home_plates.py` + `src/home-preview.css`。

视觉系统与 `ouuut.com` 同源：sage/dark 两态自动主题（本地时间，手动可覆盖）、Outfit 800 字标、EN/JA/ZH 分流字阶、4px surface 块、零结构线条。

## 构建与发布

```bash
python src/build.py                        # 生成 site/（约 80s，含字体子集）
cd site && python -m http.server 8900      # 本地预览
npx wrangler pages deploy site --project-name=panout-site --branch=main
```

构建产出 `_headers` / `_redirects` / `sitemap.xml` / `robots.txt` / `llms.txt` / `data/*.csv`，
全部由构建生成，不手改 `site/`。

## 数据

| 章 | 口径 | 源 |
|---|---|---|
| 地震 | 27 年（2000–2026.07），M4+，40,079 次；2011 年按次数 14.6% / 按能量 86.7% | USGS ComCat |
| 犯罪 | 2025 全年，5,234 町丁，中位 4.4‰，最高 1,332‰ | 警視庁 町丁目別犯罪統計 |
| 内阁 | 14 任 331 个月，644 次调查；最大单月变动 +20.5 | 各社世论调查汇总（NHK/日经/共同/时事/朝日/读卖） |

修正记录见 `src/fix_cabinet.py` 与 `app/cabinet/data.json` 的 `_meta`。

## 文档

- `progress.md` —— 逐轮流水（只增不改）
- `MASTER-CHECKLIST.md` —— 发布验收清单
- `docs/UPGRADE-DIRECTIONS.md` —— 三个子站的后续升级方向
- `AGENTS.md` —— 本仓门规（备份、提交、发布）
