# Pan Out Japan · 日本本土信息汇聚

`japan.ouuut.com` —— 拉远看地震，凑近看犯罪，拉长看内阁。同一片国土，三种时间。

> 状态：**M3 静态重建**（2026-10-19）。生产根 `F:/projects/panout-japan`，仓 `ouuut/panout-japan`。
> 命名：**Pan Out Japan**（pan out = 拉远看全景 + 结果如人意；pan = パン/Japan 尾音），域名直球 `japan.ouuut.com`。

## 架构

**一仓一构建一部署**：`python src/build.py` 从 `src/` + `app/{quake,crime,cabinet}/data` 生成整个 `site/`（109 个静态页），
`site/` 原样部署到 Cloudflare Pages。没有运行时拼页、没有 hash 路由、没有客户端数据渲染。

```
src/
  build.py      # 唯一构建入口：三语字典、页面模板、静态图表 SVG、CSV/i18n/sitemap/headers
  svgkit.py     # Web Mercator、海岸线裁剪、SVG path
  fonts.py      # Noto Sans/Serif JP 子集化 → site/assets/fonts (8 文件 ~490KB)
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

## 构建与发布

```bash
python src/build.py                        # 生成 site/（约 26s）
cd site && python -m http.server 8900      # 本地预览
npx wrangler pages deploy site --project-name=panout-site --branch=main
```

构建产出 `_headers` / `_redirects` / `sitemap.xml` / `robots.txt` / `llms.txt` / `data/*.csv`，
全部由构建生成，不手改 `site/`。

## 数据

| 章 | 口径 | 源 |
|---|---|---|
| 地震 | 27 年（2000–2026.07），M4+，40,079 次；2011 年按次数 14.6% / 按能量 86.7% | USGS ComCat |
| 犯罪 | 2023 全年，5,234 町丁，中位 4.4‰，最高 1,332‰ | 都道府県警察 町丁目別犯罪統計 |
| 内阁 | 14 任 331 个月，644 次调查；最大单月变动 +20.5 | 各社世论调查汇总（NHK/日经/共同/时事/朝日/读卖） |

修正记录见 `src/fix_cabinet.py` 与 `app/cabinet/data.json` 的 `_meta`。

## 文档

- `progress.md` —— 逐轮流水（只增不改）
- `MASTER-CHECKLIST.md` —— 发布验收清单
- `docs/UPGRADE-DIRECTIONS.md` —— 三个子站的后续升级方向
- `AGENTS.md` —— 本仓门规（备份、提交、发布）
