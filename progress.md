# progress · Pan Out Japan 会话流水（只增不改）

## 2026-10-12 · 立项 bootstrap（建仓轮）

- 命名三轮收敛：scout/watch/map（否：URL 看不出日本）→ pan（`pan.ouuut.com` 空闲）+ jp/japan → 用户拍板：**产品 Pan Out Japan / 域 `japan.ouuut.com` / 仓个人顶上**（ouuut 组织建仓 403）。
- GitHub `nakamotosai/panout-japan`（public）已建；本地 `F:/projects/panout-japan` git init + origin 已接。
- 十真相源骨架落地：README / PROJECT_CONSTITUTION / AGENTS / TRACK_TREE / SPEC(M0) / PLAN(M0) / design-lock / MASTER-CHECKLIST(59 项裁剪) / progress(本条) / HANDOFF。
- 阻塞记 README：ouuut 组织权限、Gitea 镜像惯例（`sai/find-out` 等 scope 全探不到）。
- 待下轮：INDEX.md 补行 → 项目本 PARA-Projects 登记（降级流程）→ 首 commit + push。

## 2026-10-12 · M0 合仓+统风（三面 task 并行）

- 合仓：ouuut 三空仓方向作废（删不动，无 admin 权，闲置；删仓走网页）；三站源码 cp 进 sites/（quake/crime/cabinet），瘦身 369M→66M（去 node_modules/dist/75M 瓦片/lod_cache/raw/嵌套.git→archive）。
- 统风：token 冻 docs/THEME-TOKENS.md（crime tactical 深色）；quake 改风（build 过）/cabinet 改风+三语（data.json 未动）/门面 site/ 新建（4 件，静态自测）；crime 只读参照。
- 对账：crime site/data 缺 3 件系 head 截断虚惊；老仓 earthquake CLAUDE.md 的 M 与本轮无关。
- 验收：hub/cabinet/crime 本地 200 + quake build exit 0；`f896044` 双推同 SHA。
- 唯一 next：M0 上线（CF Pages + 綁域 + GSC/Bing + 冒烟）。

## 2026-10-13 · M0 单页上线（本番装配轮）

- 装配：`site/assemble.mjs` 重写（preview 壳去 preview 文案 + SEO 头注入 + app 13 文件显式直装 + 旧三子路径清场 + sitemap 单页化 + llms 改 hash 门），`--check` 幂等。
- 修：crime remount 双 invalidateSize（60ms rAF + 1500ms 兜底）+ label zoom 门（<10 藏）+ loadLeaflet CSS 先补后 return；quake 手机菜单收窄；SEO 头（canonical/hreflang/OG/Twitter/JSON-LD/favicon）进 preview。
- 部署：CF Pages `panout-site`（`f8b2f04b`，ouuut token），`japan.ouuut.com`（已绑）+ 部署域三视图全验（quake 3D/crime 58 tiles+62 label/cabinet chart，零 error；手机 390 全过）。
-  A1–A7：A1 robots+sitemap ✅ A2 单 canonical ✅ A3 canonical ✅ A4 hreflang 闭环 ✅ A5 三语 title ✅ A6 单 active h1 ✅ A7 无 noindex ✅。
- 唯一 next：GSC/Bing 验证 + 看门狗探针 + ouuut.com Products 加条 + M2 新闻聚合。

## 2026-10-13 · 上线缺陷修复轮（`6a5fe864`）

用户报线上 4 类 bug，逐条取证 + 修：

1. **quake 左下/右下重叠** —— 根因：shell 的**占位** `.controls`(72,677→405,722) 与 quake 自己的 `.eq-bottom-left`(68,612→322,728) 在左下叠着。修：`mountView` 里 quake 挂载前移除 `.hud-top/.controls/.spec`；shell `#shell-foot` 在 quake 视图隐藏（quake 自带版权行）。
2. **quake 小地球位置歪** —— 根因：HUD `top:60px` 是为原站 54px 头留的，嵌进 shell 后无头可让，浮在中间。修：`quake-core.css` HUD 顶行 60→12（drawer 120→72；手机 56→12）；`#v-quake-viewport` 底色 `var(--stage)`→`var(--bg0)`（消除浅色闪）。
3. **crime 右侧面板全透明、字看不见** —— 根因：crime 的整套 CSS 挂在 `#crm-root` 下（28 处 token/variant 选择器），但挂载元素 id 是 `#v-crime` → **皮肤规则一条都没生效**；卡片 bg 回退透明、文字继承 shell `--ink`（dark 主题下 `#EDEBE4`）→ 浅色地图上全看不见。修：`mountCrime` 建 `<div id="crm-root">` 挂载盒并把 variant/accent 属性挂它上面；unmount 连盒移除。实测 dark 下 `--bg-card: rgba(27,25,23,.62)` / `--text-main:#f5f0e8` 恢复。
4. **cabinet 橙药丸灰字** —— 根因：shell 占位规则 `.stage span{color:var(--muted)}`（(0,1,1)）压过 `.cab-latest{color:#fff}`（(0,1,0)）。修：占位样式改子选择器 `.stage > b` / `.stage > span`。实测 `#cab-latest` col=`rgb(255,255,255)` / bg=`rgb(255,106,61)`。
5. **主题第三项 mono** —— 删 mono（CSS 块 + 圆点 + 按钮 + 映射 + 默认）；默认 `sage`，白名单 `{sage,dark}`。
6. **quake 震点"消失"** —— 加加载遮罩（`.qk-veil`），采样画布亮点占比 >3.5% 且 ≥2.6s 才撤（12s 兜底）。另实测 **live 16s 亮点 5.44% → 50s 2.21%**：地球仪 idle 自转（`userWantsAutoRotate=true`，30s/圈）+ 镜头漂移把日本震点带出视野 —— 待拍板是否关默认自转。

验证：`site/assemble.mjs --check` OK；本地 Chromium 实渲染 4 项全过（quake 亮点 6.30%、无重叠、小地球 y=96；crime `#crm-root` 在且可读；cabinet 白字）；线上 `index.html`/`app/crime/view.js`/`app/quake/view.js` 回读确认新版字节已上。

## 2026-10-13 · 震点根因修复（瓦片数据缺失，`a5dadbff`）

用户复测仍无震点。逐层定位：
- 原站 `3d.saaaai.com` 请求日志：`/data/quakes/manifest.json` + `/data/quakes/tiles/r_15_5.json` …（20° 瓦片，共 154 片）。
- panout 装配件只有 `app/quake/data/quakes.json`（legacy 平面文件），`quakes/manifest.json` **404**、无 tiles。
- vendor 源码 `main.js:3980` 的 legacy 回退只 `loadJson` 数据；而显示路径 `quakeTiles.sync()` 无 manifest 直接 `return false`（`quakeTiles.js:267`）→ **getDisplayQuakes 恒空 → 0 点**。
- 对照实验：同机 headed 浏览器下原站亮点 7.62%，panout 2.12%（只剩海岸线）；本地 headless 因 SwiftShader 偶然画出点，掩盖了问题（headed/真 GPU 才是用户实际）。

修：从原站拉日本区 9 片瓦片（recent+archive 共 18 文件 / 13.4MB）+ 裁剪版 manifest，落 `app/quake/data/quakes/`；`site/assemble.mjs` 新增 `quakes/**` 整目录递归同步 + 缺失即 fail。脚本留档 `sites/quake/scripts/fetch-tiles-from-live.py`。
验：本地 headed 亮点 6.99%；线上 `japan.ouuut.com` build `2d273e7982` 亮点 6.88%、8 瓦片全 200、零 404；crime `#crm-root` 在/面板 `rgba(255,255,255,.6)`+深字；cabinet 药丸 `display:none`。全部 headed 实机截图取证。

遗留：quake 的 `.eq-left-dock` 默认 `is-open`（工具条默认展开）；地球仪 idle 自转把镜头带离日本（`userWantsAutoRotate=true`）——待拍板。
