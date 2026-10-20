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
