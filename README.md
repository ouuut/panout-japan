# Pan Out Japan · 日本本土信息汇聚

`japan.ouuut.com` —— 地震 / 犯罪率 / 内阁支持率 /（未来）日本本土新闻聚合，常驻 ouuut.com 的产品。

> 状态：**立项 bootstrap**（2026-10-12 登记，生产根 `F:/projects/panout-japan`）
> 命名拍板：产品名 **Pan Out Japan**（pan out = 拉远看全景 + 结果如人意；pan = パン/Japan 尾音，不懂日本文化的人看站内解释）；域名直球 **`japan.ouuut.com`**（URL 一眼日本）；仓 `nakamotosai/panout-japan`（ouuut 组织建仓权限不足，先个人仓顶上，slug 中性方便以后 transfer）。
> 详情：见 `HANDOFF.md`；里程碑见 `TRACK_TREE.md`；当轮 spec 见 `SPEC.md`。

## 为什么做

- 地震地图（`3d.saaaai.com`）、犯罪率地图（`crime.saaaai.com`）、内阁支持率（`japan.saaaai.com`）三站各活各的，都是日本本土信息，缺一个汇聚门面。
- 未来还要模仿 cnjpv5 做日本本土新闻聚合站，一并收进本项目（预留 `news/`）。
- 落到 ouuut 品牌下做常驻产品（ouuut 家族 `xxx out` 梗：`find out` / `chill out` / 本站 `pan out`），个人项目才放 saaaai.com。

## 当前进度

| | |
|---|---|
| **已完成** | 单页三合一上线（`f8b2f04b`）+ **上线缺陷修复轮**（`6a5fe864`，2026-10-13）：shell 占位 chrome 不再与真视图重叠（quake 移除 `.hud-top/.controls/.spec`）、`.stage` 占位样式不再泄漏（`.stage > span`）、crime 补 `#crm-root` 挂载盒（整套皮肤 token 恢复：卡片 `--bg-card`/`--text-main` 生效）、cabinet `.cab-latest` 恢复白字压橙底、主题删 mono 只留 sage/dark（默认 sage）、quake 加加载遮罩（画布画出震点才撤） |
| **唯一 next** | 地球仪 idle 自转/镜头漂移使日本震点离开视野（实测 live 16s 亮点 5.44% → 50s 2.21%；待拍板是否关默认自转）+ GSC/Bing 验证 + 看门狗探针 + ouuut.com Products 加条 + M2 新闻聚合 |
git log --oneline -5
git remote -v
```

## 已知阻塞

- ouuut 组织建仓权限不足（`nakamotosai cannot create a repository for ouuut`），Gitea 镜像惯例待确认（`sai/find-out` 等 scope 全探不到，疑为旧体系记录）。
