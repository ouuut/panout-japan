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

## 2026-10-13 · dock 按钮挤压修复（`9ade1810`）

用户贴图：顶左 dock「震级/震级筛/年份」互相压着。根因：vendor 的 dock 按钮全靠 `--eq-dock-w/h/gap/radius` 定宽高，而这四个 token 只存在于原站 `sites/quake/src/style.css` 的 `:root` 块里——**抽成 vendor 文件时 `:root` 没一起带，production css 里定义是 0 个，用了 29 处** → 宽高塌成 auto → 互相挤。同类全量审计（prod css 用到的每个 `var(--x)` 必须有定义：prod 自身/shell `:root`/运行时）再抓出 `--bg2`（famous-reopen 边框用它）也丢了。
修：`--eq-dock-w:52px; --eq-dock-h:calc(w/2); --eq-dock-gap:8px; --eq-dock-radius:6px; --bg2:rgba(255,244,232,.14)` 落到 `#v-quake-viewport` 基座规则里（原站同值），审计脚本复跑 `ALL DEFINED ✔`。
验：本地 headed 5 个 item 全 52×26、x 坐标 128/188/248/308/368 等距无叠；线上 build `2815aba8e6` 同样 52×26 + 震点在。

## 2026-10-13 · 查bug轮（workflowz 五路 fanout + headed 实测，`683b34f`）

- 用户报地震图"菜单挤叠+常驻Loading+UI全崩"。实测结论：线上 BUILD 2815aba8e6 本身正常——菜单52px/震点/veil全好，用户截图系旧缓存快照（本地复现：旧CSS 30846B vs 新30969B，http-server缓存头+`?v=`旧戳导致）。
- 五路取证：IntroVeil（入场Ix序列完整在，veil 9条退出路径，P5 vendor失败盖报错/P7 remount复用旧veil/P8 tick无token/P9自转漂移致12s兜底）/ MenuCss（--eq-rotate-len无回退确认，legend-len排除，壳遮挡排除，`(width<=640px)`无空格疑似未测）/ TileData（调用链+降级矩阵全，断档：coverageEnd 2026-08-10后静态无新点、legacy下1970-1999空、日本区外天然无点）/ ShellTheme（vendor `I_()`写死tactical+`data-quake-theme`无人消费、壳boot无mono白名单）/ LiveVerify（线上三视图+390+三轮切换+零errors/零失败请求，用户三报障全排除，唯一确认轻微：title不随语言）。
- 修（5）：① P5 vendor失败先摘veil再写.qk-fail；② `--eq-rotate-len/--eq-legend-len` 补168px默认值；③ 壳boot mono白名单（旧mono收敛sage）；④ view.js detectTheme回退sage+THEME_MAP mono→sage；⑤ TITLES三语+setLang刷新title。本地 headed 全验：mono收敛/title三语/轮切零错/cabinet EN正常。
- 部署：未推线上（门规：commit当轮做，push留收口）。线上仍 2815aba8e6，本轮 `7d940fe282` 待发布。
- 遗留未修（有意）：`(width<=640px)` 无空格待真机matchMedia取证；autoRotate镜头漂移待拍板（默认开）；vendor CJK不跟三语（设计现状）；`I_()`写死tactical（vendor冻结，不动）。

## 2026-10-13 · 进站即日本（`c1a35f7`，已上线 `2bde87d50a`）

- 用户要：进站直接日本构图，取消3s飞行，改完直接推。
- 改：`sites/quake/src/main.js` init 开场 `INTRO_SPACE_VIEW`→`homeViewForDevice()` 瞬切 + `flyP animate:false`（岸线径向3.4s+点场溶解1.85s保留，数据一到直接推）。
- 管线：`vite build`（新 dist `index-CUFc_M9I.js`）+ 新建 `sites/quake/scripts/build-vendor.mjs`（14处 assert-guarded patches：mount1+missing1+topbar1+data4+var4+theme2+sw1；变量名漂移用内容锚/正则；theme处1整吞`,ad(X);`处2分号单换——首版`,`残留致 Unexpected token，已修+`node --check` 门）。
- 验：本地硬刷 t=5s 2.1%→8s veil撤；线上 `2bde87d50a` 9s 9.2%+零错。截图：进站即日本列岛+震点，无太空帧。

## 2026-10-19 · M3 静态预渲染重建（全站 109 页）

- 架构切换：弃「单壳 + hash 路由 + 运行时数据渲染」，改为 `src/build.py` 静态预渲染 MPA；`site/` 整目录部署，零运行时拼页。
- 页面：封面 + 27 年页 + 3 章 + 62 区 + 14 任内阁 + method + 404 = 109；每页 canonical/hreflang/OG/JSON-LD 齐全，三语（ja/zh/en）。
- 图表全部构建期生成为内联 SVG（地震/犯罪海报、内阁长轴、年度条带），首屏不再等 JS。
- 懒挂：章节页 `.stage` 点「起動する」才挂 WebGL/Leaflet/ECharts，闭合后恢复海报 DOM；三主题 mono/sage/dark。
- 数据修正：NHK 2008/09 列错位（-8/+10 列）与日经同月双调查标注 → 644 polls / 331 月；犯罪章改用町丁级口径（中位 4.4‰、最高 1,332‰）；最大月变动统一口径 +20.5。
- 体积：封面 raw 36KB / br 9KB；地震章 56/18KB；犯罪章 69/24KB；区页 33/9KB。海岸线 0.05° 简化 3.8MB→1.9MB，震点数值精度收敛 14MB→13MB。
- 字体：Noto Sans/Serif JP VF 实例化 400 + 子集，8 文件 490KB，自托管。
- 验收：109 页本地 200；三主题 × ja/zh/en 实渲染；375px 无横向溢出；404 直开正常；globe/Leaflet/ECharts 懒挂与闭合恢复通过。
- 残留：`site/` 未提交（构建产物）；globe 首次加载本地 ~10s（线上 brotli 后更快）；zh 标题沿用 JP 字形（系统回退兜底）。

## 2026-10-19 · 收尾验收（移动端 0 溢出、载荷实测）

- 修封面 375px 横向溢出：`.spine-row` 的 `1fr` 被 min-content 撑开（手机 356 vs 320），改 `minmax(0,1fr)` 后 scrollWidth=clientWidth=360，7 条路由复测全部 0 溢出。
- 载荷实测（gzip，brotli 更低）：封面 35.4KB→8.7KB、地震章 52.1/15.6、犯罪章 67.4/22.6、内阁章 16.9/5.1；CSS 22.1/5.4；shell.js 6.0/1.9；i18n 18.6/7.6；字体 8 文件 491KB（unicode-range 按需）。
- a11y 底线：109 页 h1 唯一（0 违例）、`:focus-visible` 有；移动端按钮 40px 高、导航链 38px（>WCAG 24px）。
- 残留：部署待 CF 凭据（`wrangler whoami` 未认证、本机无 token）。

## 2026-10-21 · M4 ouuut 视觉对齐（全站 109 页）

- 用户令：japan.ouuut.com 各页设计语言与 ouuut.com 完全一致，含左上 logo 字体。
- 主题：删除 mono；sage/dark 两态按本地时间自动（6–17 sage，其余 dark），手动点选写 `pj-theme`；`theme-color` 随主题更新。
- 字标：Outfit 800 / 33px / accent，`pan out` + `japan` 45%；重子集 Outfit 800（10KB）覆盖 `panoutjapan` + ASCII；favicon 改 Outfit `p`。
- 字阶：EN Instrument 400、JA/ZH Noto Serif 700；正文 17px（EN 1.65 / CJK 1.8）；cover H1 EN 89.28/400/.96、JA 72/700/1.3、ZH 80.64/700/1.28；section 44.8/700；page H1 56/700；logo 33/800。
- 组件：页头 72px + 90% blur + scrolled；2 主题点（44px 命中）/文本语言链/移动汉堡+全屏菜单；首页两栏 hero + 三尺度面板 + Outfit 巨型字标 + 三条 ouuut 式索引行；stage 4px surface 无阴影；表格 15px + 单色顺序带 + 移动横向滚动；页脚品牌字标 + 12px 三行。
- 字体：Outfit 800 + Noto Serif/Sans JP 700/500 + Noto Serif/Sans SC 700/500 + Instrument/Geist/JetBrains，11 文件 1.06MB；CJK 子集并入 app/*.js 剥注释后的 UI 字符串（1230 字符）。
- 图表：crime 色阶改 sage/orange 单色顺序带；cabinet 14 任改 accent 顺序色；loader/面板变量对齐 token。
- 修复：移除 `startViewTransition`（relay 下旧主题快照卡住）；crime 全屏 `#crm-root/#crm-map` 高度 100%；cabinet stage-flow 去掉 62vh 空洞；移动表格 idx 列 42px；CJK `word-break:auto-phrase` 修 `同/じ` 断词；`#chapters` scroll-margin 避吸顶页头。
- 验：sitemap 108 页本地 200、h1 唯一 0 违例；1440/768/390/320 × ja/zh/en 0 横向溢出；12 个字体面 loaded；home/chapter/year/method 可见边框 0；无 JS 内容可见；reduced-motion 内容可见且 grain 关闭；ouuut.com 实测 sage/dark token 与 logo 33/800 逐值一致。
- 部署：commit `fff7e76` → `wrangler pages deploy site --project-name=panout-site --branch=main`，线上 `https://japan.ouuut.com/` 已验：12 字体面 loaded、outfit 字标、JA/EN 切换、sage/dark 切换、390px 0 溢出；preview `https://bd1b2c86.panout-site.pages.dev`。
- 线上核对：`/assets/app.css?v=faddf900` 12 个 @font-face、`auto-phrase` 在；`/assets/shell.js?v=93852dd4` 无 `startViewTransition`、THEMES=sage/dark；9 条路由 200 + 唯一 h1；404 直开正常。

## 2026-10-21 · M4.1 总入口比例尺预览（本地 `/preview/`）

- 用户纠偏：M4 把 ouuut 的品牌站布局（巨型字标、产品行、hero panel）整套搬进了数据站；要的是同一主题/字体，不是同一信息架构。
- 方案：总入口改为「一把尺子，三个刻度」；只重做首页 + 三章入口，详情页保留。先出首页单页原型，不碰 109 页。
- 实现：`src/home_plates.py` 构建期生成三张数据板（地震密度/23区犯罪/331月内阁线）；`src/home-preview.css/js` 实现刻度选择、hover/focus 预览、键盘左右切换、无 JS 降级；`build.py` 新增 `/preview/` 路由（`register=False`，不进 sitemap）。
- 验：1440/1024/768/390/360/320 双主题三语无页面横向溢出；1440 `rulerBottom=867`、768 `rulerBottom=877`、390 `rulerBottom=786`、320 `rulerBottom=824`；hover/focus/click/键盘/无 JS/reduced-motion 全过；字体面加载、控制台零错误；preview HTML 166KB / gzip 50KB。
- 唯一 next：用户看首页预览，确认后展开三个章节入口（地震擦洗 / 犯罪放大镜 / 内阁时间带）。

## 2026-10-21 · M4.2 总入口改三入口直连（一次点击）

- 用户反馈：M4.1 的比例尺要先选尺度再开章，进三站需要两次点击，不合理，必须精简。
- 改：删除比例尺选择器与 `home-preview.js`；三块数据板同屏并排，**每块整块是 `<a>`**，点任意位置一次直接进入 `/quake/`、`/crime/`、`/cabinet/`；无选中态、无二次 OPEN、无 JS 拦截。
- 布局：1440 三栏 triptych（整块 band，无卡片边框/阴影）；≤1000 横向行；≤640 纵向。数据板按 416px 栏宽放大 SVG 注记，犯罪图改“浅填充 + 强点 + 区界”的点场。
- 验：1440/1024/768/390/320 × ja/zh/en × sage/dark 全 0 横向溢出、3 个入口齐全；1440 band 底部 887px 在首屏；桌面点 `/crime/`、390 点 `/cabinet/` 均一次跳转成功；`/preview/` 仍 noindex、不进 sitemap；无自定义交互脚本。
- 唯一 next：用户看总入口，确认后展开三个章节入口（地震擦洗 / 犯罪放大镜 / 内阁时间带）。

## 2026-10-21 · M4.3 品牌改为 japan.ouuut.com

- 用户纠偏：logo 与首页巨型字标仍是 Pan Out Japan；不是这个品牌，应该是域名 `japan.ouuut.com`。
- 改：`build.py` 增设 `BRAND` / `WM`；页头、页脚、首页巨型字标、封面 kicker、所有 title / og:site_name / WebSite schema / llms.txt 全部改为 `japan.ouuut.com`；favicon 字母 `p` → `J`；字标 `japan` + `.ouuut.com` 两段，去掉两段间 gap；≤340px 页头字标降为 26px，避免 320px 挤压。
- 验：`site/` 旧品牌 0 命中；1440 巨型字标 1,133px / 内容 1,430px，390 为 288 / 380，320 为 236 / 270；1440/1024/768/390/360/320 × ja/en/zh × sage/dark 0 横向溢出；320 页头 logo 128px、工具右缘 290px；390 一次点击 `/quake/` 成功；无 JS 时 logo/巨型字标仍为域名。
- 唯一 next：用户确认新字标；确认后展开三个章节入口（地震擦洗 / 犯罪放大镜 / 内阁时间带）。

## 2026-10-21 · M4.4 首页三图直接启动应用

- 用户要求：点首页三张图直接加载启动，不要跳到章节页再点「起動する」。
- 改：首页预览与本地根首页各加 3 个隐藏 `.home-stage`；面板/产品行加 `data-start-app`。点击由 `shell.js` 拦截：当前页全屏 stage、loading 层、直接 import `/app/<ch>/view.js` 并 mount；URL 不变，关闭按钮回首页并恢复面板文案。无 JS 时仍按 `<a href>` 回退到章节页。章节页原有 launch 保留。
- 修：quake stage 的 `.stage-live` 补 `id="v-quake-viewport"`；app 内旧品牌字符串（quake 页脚、crime 来源链接、cabinet 版权）改为 `japan.ouuut.com`。
- 验：预览 1440 点地震出 2 canvas + 地球，点犯罪出 Leaflet `#crm-map`，点内阁出 ECharts canvas；三者 URL 均保持 `/preview/`，关闭后 `stage-open` 移除、面板恢复「開く」；根首页产品行点犯罪同样当前页启动；章节 `/crime/` 原 launch 仍可用；390px 点面板图片启动内阁，关闭按钮 48px 落在视口内、无横向溢出；无 JS 点地震入口回退到 `/quake/`；站点用户可见旧品牌 0。
- 唯一 next：用户验收三图直启；确认后把 `/preview/` 切为根首页并展开章节细节。

## 2026-10-21 · M4.5 四页收口 + 三章交互修正

- 用户叫停并纠偏：一共只有 4 个页面，`/preview/` 总入口 + 地震 / 犯罪 / 内阁三章；`/` 不应再出旧首页，也不应再有方法页、年份页、区页、内阁任期页。此前构建实际 109 页，属于越界。
- 收口：`/` 直接使用总入口三入口版；`/preview/` 只做跳转别名；删除方法 / 年份 / 区 / 内阁任期 / 404 路由；章节页移除对应链接（年份索引删除，区/内阁表改为纯文本）；导航、页脚、llms、sitemap、`_redirects` 全部收口。旧 109 页站点归档到 `F:/archive/20261021-panout-109pages-site`。构建输出 `pages: 4`。
- 三章修正：全屏 stage 增加站点头（域名 / 主题 / 语言 / 关闭），主题和语言可直接在应用内切换；`syncVendorTheme` / `setLang` 选择器修正为 `.stage-live`，应用真正收到主题/语言；文档滚动条隐藏、内部滚动条主题化；内阁从 in-flow `stage-flow` 改为全屏，控件置顶、图表 flex 填满，dataZoom 改为主题色轨道，顶部内阁标签不再被裁切。
- 验：`/` 为新总入口，`/preview/` → `/`，`/method/`、`/quake/2011/`、`/crime/chiyoda/`、`/cabinet/abe1/` 均 404；sitemap 4 条；4 个内容页 + 1 个跳转别名；1440/390 无横向溢出；1440 chrome 52px、390 chrome 48px；内阁 1440 图表 974px / 控件 81px，390 图表 847px / 控件 142px；主题切换后 quake `data-quake-theme=dark`、crime `data-crm-variant=tactical`、cabinet dataZoom 切 tactical；文档 `scrollbar-width:none`，内部滚动条为 muted/accent 主题色；无白色滚动条。
- 唯一 next：用户验收四页收口与三章交互；线上未部署。

## 2026-10-21 · M4.6 独立页面 + 应用内嵌（去弹层）

- 用户指出三章右上角出现主题/语言/关闭按钮，质疑“页中页”。确认这是上一轮的全屏弹层 chrome：章节页本身是独立页面，但点击后在页内盖了一层 fixed 舞台，带关闭按钮，视觉上像 modal。
- 模式改为独立页面内嵌：三章 `/quake/`、`/crime/`、`/cabinet/` 直接把自己的应用挂在页面图区，滚动到图区由 IntersectionObserver 自动挂载；没有弹层、没有关闭按钮、没有 `body overflow:hidden`。首页三块数据板恢复为普通 `<a>`，直接进入章节页，不再原地全屏启动。
- 删除 `stage-chrome` / `stage-close` / `stage-launch` / home hidden stages 及相关 CSS/JS；保留站点 sticky header 的主题与语言控件；静态标题、数据表、beats 始终在 HTML 中，爬虫/AI 无需点击或执行 JS。
- 修 quake 内嵌加载遮罩：暗色画布亮点阈值可能不达标，兜底从 `tries > 40`（约 20s）降到 `tries > 8`（约 4.4s），避免图区长时间被“読み込み中”盖住。
- 验：`/` 无 `.stage`，三入口为普通链接；三章 `.stage[data-live=1]` 内嵌 canvas，`stage-chrome`/`stage-close`/`[data-launch]` 均为 0；1440 与移动端无横向溢出；页面可正常滚动，无 body 锁；header 主题/语言切换后 quake `data-quake-theme=dark`、crime `data-crm-variant=tactical`，中文 H1 生效；`/preview/` 仍跳 `/`，旧路由仍 404。
- 唯一 next：用户验收独立页面模式；线上未部署。

## 2026-10-21 · M4.7 吸顶 header + 全屏应用

- 用户再次纠偏：三章不要章节导语、统计块、beats、数据表这些“废话”，要吸顶 header 下直接全屏看地震/犯罪/内阁。
- 三章改为 `body.chapter-app` + `main.chapter-app-page`：header 保持 sticky，应用 stage 高度 `calc(100dvh - var(--nav-h))`，全宽、无圆角、无页边距；页面本身不滚动，交互全部在应用内部。
- 删除三章可见的 chapter-head / stats / beats / crime 区表 / cabinet 内阁表；footer 在章节页不再输出。title、description、JSON-LD 与 `sr-only` H1/lede 保留，作为 SEO/GEO 的最低保底；全屏 canvas 可见正文减少是明确的取舍。
- 构建加 `fullscreen=True` 分支：`<body class="chapter-app">`、跳过 footer、但仍输出 shell.js 与闭合标签；新增 `.sr-only`、`.chapter-app-page`、`body.chapter-app` 样式。
- 验：`/quake/`、`/crime/`、`/cabinet/` 均为 header + 全屏 stage，页面 `scrollHeight == innerHeight`，无章节导语/统计/beats/表格/footer；三章应用自动挂载；主题/语言在 header 切换；无弹层/关闭按钮；旧路由仍 404。
- 唯一 next：用户验收全屏模式；线上未部署。

## 2026-10-21 · M4.7a 全屏填充修正

- crime 应用会给 `.stage-live` 写 inline `min-height:70vh`，全屏时地图只占 70%。全屏页用 `.chapter-app-page .stage-live` 的 `!important` 覆盖为 `inset:0 / height:100%`，`#crm-root`、`#crm-map` 同步 100%，实测 1053px 全填。
- quake 震点在数据加载后不会自动重绘，手动 `resize` 后才出现。`mountStage` 增加 2.4s / 5s / 8s / 12s 的延迟 resize，保证数据到位后点云上屏。
- 验：1440 与移动端三章均 header + 全屏 stage，`scrollHeight == innerHeight`；crime map / cabinet chart 填满；quake 延迟后显示点云；无章节正文/footer/关闭按钮。

## 2026-10-21 · M4.8 三章深度视觉打磨与字形修复

- 用户指出三章细节问题：① 地震图浅色模式仍为黑底，缺少浅色设计，底部渐变黑遮罩遮挡地图，缺少入场淡入；② 犯罪率地图小标签中的“雷門”等字符日文/中文显示异常（与右侧面板不一致）；③ 内阁支持率折线图两种配色均单调难看，无法区分不同首相，需要完全重构外观，参考获奖级作品。
- 地震图浅色模式与入场动效：
  - `patch_vendor.py` 给 `quake-core.js` 打入真实的 `sage` 浅色配置（15330787 温润浅米绿纸底、1713436 深墨黑海岸线），解除只返回 `tactical` 的硬编码限制；
  - `app.css` 注入 `html[data-theme="sage"] #v-quake-viewport` 全套浅色 CSS 变量；
  - 彻底移除 `#v-quake-viewport .eq-bottom` 的底部渐变遮罩，西南诸岛与冲绳全貌清晰可见；
  - `view.js` 遮罩撤除改用 0.65s 平滑透明度渐变淡入，支持 `window.__setQuakeTheme` 实时重绘 WebGL 场景。
- 犯罪率地图小标签字形根治：
  - 定位根因：`src/build.py` 的 `collect_chars` 之前提取属性误写为 `p.get("name")`（实际为 `p.get("n")`），导致 5,234 个町丁中的 605 个汉字（包含“雷”、“門”等专属地名汉字）完全未打包进 Noto 子集字体，触发 Windows 劣质日文字体回退。
  - 修复 `collect_chars`，全量提取町丁名汉字（子集字符数从 1066 增至 1397）；
  - `app.css` 为 `#crm-lx-capsule .lx-name` 明确指定 `font-family: var(--title-font) !important; font-weight: 700 !important;`，与右侧面板彻底对齐。
- 内阁支持率折线图获奖级重构：
  - 彻底抛弃单色线条：为 14 位首相分别定制浅色模式（报刊醇厚墨色系）与深色模式（黑曜石高对比霓虹色系）两套独立调色盘，一眼区分不同首相；
  - 增加交替任期底色带（`markArea`），政权跨度与更迭一览无余；
  - 增加折线下垂面积渐变（`areaStyle`），山峦形态丰富，纵深立体；
  - 升级富文本 Tooltip：展示首相专属色标、首相名、大字支持率、调查机构明细；
  - 优化顶部区间切换器与首相名牌胶囊（带色点与高亮焦点）。
- 验：截图亲测 quake 浅色温润、深色璀璨，无底部黑遮罩，淡入平滑；crime 雷门2丁目小标签与右侧面板完全一致（纯正 Noto Serif）；cabinet 浅色/深色/移动端各首相色彩鲜明、底色带与面积渐变丰满、Tooltip 精美。

## 2026-10-21 · M4.9 全站四页交互动效与平滑过渡全面升级

- 用户要求：四个页面（一个总页面与三个分页面）全部都要有过度的入场与切换动效，拒绝瞬切弹出；主题切换、语言切换也要平滑过渡；所有可点击的按钮与交互控件全部加上时长更长（0.45s~0.75s）、更明显舒适的动画效果。
- 页面切换与全屏应用入场：
  - 配置跨文档原生 MPA `@view-transition`（`navigation: auto`，0.65s 柔和过渡）；
  - 全站 `main#main` 与 `.chapter-app-page` 添加 `0.72s cubic-bezier(0.16, 1, 0.3, 1)` 渐入动画，告别瞬弹；
  - 犯罪率地图：雷达加载器 0.75s 呼吸淡出，地图平滑落位淡入；
  - 内阁支持率图表：开启 ECharts 1100ms cubicOut 生长动画与 650ms 窗口切换插值，图表容器 0.85s 淡显。
- 全局主题与语言切换平滑流转：
  - 全站背景、文字、边框、阴影注入 0.65s 长过渡（`cubic-bezier(0.16, 1, 0.3, 1)`），深浅模式切换如光影流转般平滑显眼；
  - 语言切换增加 `.lang-switching` 呼吸遮罩（0.45s 墨水重印式淡出淡入），不再瞬切乱跳。
- 所有可交互控件与按钮手感强化：
  - 顶部导航链接：0.45s 平滑文字变色与微上浮，下划圆点弹性伸缩；
  - 主题切换双圆点：0.55s 悬停放大（1.22x）、点击回弹与光晕扩散；
  - 语言切换按钮：0.45s 胶囊高亮与微上浮；
  - 首页三入口数据板：0.55s 悬停上浮 4px、立体阴影、右下角 `↗` 箭头向外滑移动画；
  - 内阁时间范围切换按钮与首相名牌胶囊：0.48s 舒展过渡、hover 上浮 2px、active 缩放反馈。
- 验：总页面 `/` 与三章分页面 `/quake/`、`/crime/`、`/cabinet/` 均实测通过；无任何横向溢出与样式冲突。

## 2026-10-21 · M4.10 内阁支持率页面入场卡顿彻底根治与高质感过渡重做

- 问题根因定位（一手数据取证）：
  - 1. 外部 CDN 依赖与长任务阻塞：原代码依赖外部 jsdelivr/unpkg 实时下载 1MB 的 `echarts.min.js`，无本地 vendor 缓存，无 `<head>` 预加载，主线程连续触发 3 次 70ms~99ms 的 Long Task；
  - 2. 布局突变与 DOM 挤压（Layout Thrashing）：原静态 HTML 呈现简陋黑白 SVG 海报，活体化时直接 `display: none`，顶部控制栏突然插入把图表猛烈推挤下沉，引发剧烈布局跳跃；
  - 3. 频繁 Resize 洪泛打断动画：`shell.js` 在 60ms 和 350ms 硬发全局 `resize` 事件，直接掐断了 ECharts 刚开始计算的 1100ms 入场展开动画，导致 Canvas 清屏重绘、严重丢帧卡顿。
- 终态重做方案落地：
  - 1. **ECharts 依赖本地化与预加载**：下载 5.5.1 版本至 `app/cabinet/vendor/echarts.min.js`（本地同源 0 网络延迟），并在内阁页 `<head>` 中注入 `preload`（echarts 脚本 + data.json + modulepreload view.js）；
  - 2. **专属高质感平滑入场遮罩 (`.cab-veil`)**：
    - 设计极具数据新闻仪式感的主题同步动态脉冲波与多语种载入指示（`331か月の世論調査データを展開中…`）；
    - 与当前深浅主题完全同色，无缝衔接，消除黑白突变；
    - 首帧 Canvas 渲染完成后以 `0.65s cubic-bezier(0.16, 1, 0.3, 1)` 平滑淡出（cross-fade），图表优雅浮现；
  - 3. **零布局跳变（Zero Layout Shift）**：
    - 在 CSS 中锁定 `.stage-cabinet`、`.cab-host`、`.cab-controls`（`min-height: 44px`）和 `#cab-chart` 的弹性容器比例，首毫秒即确定绝对尺寸；
  - 4. **Resize 防抖与初始动画保护**：
    - `shell.js` 免除全屏应用页面的早期 resize 轰炸；
    - `view.js` 内部增加 `isInitialAnimating` 保护期与 `requestAnimationFrame` 防抖，首屏展开动画彻底不受打扰。
- 验：PerformanceObserver 实测 `longTasksCount: 0`（原 3 次）、`shiftsCount: 0`（完全零跳变），60 FPS 丝滑入场，深浅模式与语言流转皆实测通过。

## 2026-10-21 · M4.11 地震 3D 地球仪大圆球细描边（Limb Outline）实装

- 用户要求：http://127.0.0.1:8900/quake/ 给这个地球的整个大圆球加一个细描边。解决纯黑/纯白背景下地球与外部环境边界融合、无法辨识球体分界线的问题。
- 终态方案与几何实现：
  - 构建 360 段高精度相切地平线圆弧（`earth-limb-outline`，`LineSegments`，`renderOrder: 20`）；
  - 每帧在渲染循环 `hS()` 中动态计算视线切圆的几何位置与透视半径：
    - 切圆中心：$\mathbf{C} = \mathbf{p}_{	ext{cam}} \cdot (R^2 / D^2)$；
    - 切圆半径：$r_c = R \sqrt{1 - R^2 / D^2}$；
    - 朝向相机：`rm.lookAt(camPos)`；
    - 严谨的投影几何保证无论相机如何旋转、缩放、仰俯，该圆圈在屏幕上恒定贴合球体外边界，100% 严丝合缝；
  - 配色随主题自适应：
    - Dark 模式：采用微暖米白（`0xEDEBE4`，与海岸线同族），`opacity: 0.58`，勾勒出优雅精致的宇宙地平线细圈；
    - Sage 模式：采用深墨绿灰（`0x141A15`，与海岸线同族），`opacity: 0.42`，清晰界定浅色背景与地球实体。
- 验：在 Dark 和 Sage 两种主题下截图核验，并在鼠标拖拽旋转地球时全程跟踪切圆位置，实测 60 FPS 丝滑贴合，彻底消除纯黑/纯白背景分界不明的痛点。
