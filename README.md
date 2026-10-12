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
| **已完成** | 单页三合一上线：`preview` 壳 + `app/` 三视图（mount/unmount+懒加载+单基址）→ `site/assemble.mjs` 直装 13 文件 → CF Pages `panout-site`（`f8b2f04b`），`japan.ouuut.com#/quake|crime|cabinet` 全活（桌面+手机+remount 全验，零 error）|
| **唯一 next** | GSC/Bing 验证 + 看门狗探针 + ouuut.com Products 加条 + M2 新闻聚合 |
git log --oneline -5
git remote -v
```

## 已知阻塞

- ouuut 组织建仓权限不足（`nakamotosai cannot create a repository for ouuut`），Gitea 镜像惯例待确认（`sai/find-out` 等 scope 全探不到，疑为旧体系记录）。
