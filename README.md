# Pan Out Japan · 日本本土信息汇聚

`japan.ouuut.com` —— 拉远看地震，凑近看犯罪，拉长看内阁。同一片国土，三种时间。

> 状态：**M4.1 总入口改版预览**（2026-10-21）。生产根 `F:/projects/panout-japan`，仓 `ouuut/panout-japan`。
> 命名：**Pan Out Japan**（pan out = 拉远看全景 + 结果如人意；pan = パン/Japan 尾音），域名直球 `japan.ouuut.com`。
> 线上：`https://japan.ouuut.com`（Cloudflare Pages `panout-site`，M4 commit `fff7e76`）。
> 本地改版预览：`http://127.0.0.1:8900/preview/`（构建后 `cd site && python -m http.server 8900`）。

## 架构

**一仓一构建一部署**：`python src/build.py` 从 `src/` + `app/{quake,crime,cabinet}/data` 生成整个 `site/`（109 个静态页），
`site/` 原样部署到 Cloudflare Pages。没有运行时拼页、没有 hash 路由、没有客户端数据渲染。

```
src/
  build.py      # 唯一构建入口：三语字典、页面模板、静态图表 SVG、CSV/i18n/sitemap/headers
  home_plates.py# 总入口预览的三张构建期数据板（地震/犯罪/内阁）
  home-preview.css / home-preview.js # 总入口比例尺原型（仅 /preview/）
  svgkit.py     # Web Mercator、海岸线裁剪、SVG path
  fonts.py      # Outfit 800 + Noto Serif/Sans JP/SC 700/500 子集化 → site/assets/fonts (11 文件 ~1.1MB)
  fix_cabinet.py# 内阁数据修正（NHK 2008/09 列错位、同月双调查标注）
  fetch_fonts.py# 字体源下载
  patch_vendor.py # quake bundle 的品牌字符串补丁（域名/出典/重载文案）
  slim_quake_data.py # 海岸线 0.05° 简化 + 震点数值精度收敛（原文件备份 .cache/quake-orig）
app/
  quake/        # 3D 地球（WebGL）+ 瓦片数据，只在章节页点「起動する」后懒挂
  crime/        # Leaflet 町丁目地图，同一懒挂机制
  cabinet/      # ECharts 支持率长轴，同一懒挂机制
site/           # 构建产物，gitignore
```

页面：封面 1 + 地震 27 年页 + 犯罪 3 章 + 62 区页 + 内阁 14 任 + 方法论 + 404，共 **109 页**。
详情页全部是静态数据页（表格、SVG 海报、CSV 下载）；交互视图在章节页通过 `.stage` 懒加载，闭合后 DOM 恢复海报。

### 当前改版预览

`/preview/` 是总入口的**比例尺**原型：左侧为三章读数，右侧为构建期生成的数据板，底部三条刻度可 hover/focus 预览、点击直接进入章节。它使用 `src/home_plates.py` + `src/home-preview.css/js`，不注册 sitemap，不改动 109 页生产页。下一步待方向确认后，才展开三个章节入口。

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
