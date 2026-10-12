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
