# AGENTS · panout-japan 门规

## 备份

- 动核心文件（`index.html` / 生成器 / 数据）先备份到 `F:\archive\<时间戳>-panout-japan\`。

## 提交纪律

- 开发改动验证通过**当轮即 git commit**（仅 commit，push 留给收口），不许攒多轮。
- 含 version 字段的随提交同步抬版本。
- README 进度节每轮收尾必刷（状态 + 最近已完成 1-2 条 + 唯一 next）。

## 老站纪律

- `3d/crime/japan.saaaai.com` 三老站是回滚锚：本项目只做聚合门面 + 跳转，不动老站代码与部署。
- 摘老线必须先并跑验收，用户点头才摘。

## 双账号纪律（ouuut 系，2026-10-12 夜审 P1-4 待固化）

- 身份：GH + CF 全走 ouuut（nkmtsai@gmail.com）。CF token：`python C:\Users\sai\.omp\agent\scripts\secrets_manager.py read custom ouuut_cf_api_token`，输出 JSON **取 `.value`**；account 用同命令读 `ouuut_cf_account_id`（cf9d7aabc983abab99b5e3fdd080ec4d）。GH 用 `custom.ouuut_github_token`（凭据库 `git:https://github.com` username=ouuut）。
- CF Pages 项目：`panout-site`（`*-site` 惯例）。门面发布：`CLOUDFLARE_API_TOKEN=<tok> CLOUDFLARE_ACCOUNT_ID=cf9d7a... npx wrangler pages deploy site --project-name=panout-site --branch=main`（wrangler 4.149+ 仅建项目加 `--force`，部署不加；无 domain 子命令，自定义域走 API `POST /accounts/<acct>/pages/projects/panout-site/domains`）。
- 仓：`ouuut/panout-japan`（canonical，origin 已切）；个人 `nakamotosai/panout-japan` 残留待删；Gitea `sai/panout-japan` 镜像。

## 构建

- `python src/build.py` 生成 `site/`，`site/` 是产物不入库、不手改。
- 预览：`cd site && python -m http.server 8900`。

## 发布（网站类，MASTER-CHECKLIST.md 为验收载体）

- 发布前逐项打勾，**A1–A7 任一不过即阻断**。
- 回滚：DNS 下线即回（M0 门面无状态）；老站三域独立不受影响。
