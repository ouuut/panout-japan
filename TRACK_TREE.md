# TRACK_TREE · Pan Out Japan 里程碑结构

| Milestone | 目标 | 状态 | 验收关键项 |
|---|---|---|---|
| M0 聚合门面 | `japan.ouuut.com` 首页六板块 + 三站跳转跑通 | ✅ 已完成 | 首页与五章已上线，三语 + 桌面/手机实测 |
| M1 三站迁入 | 地震/犯罪率/支持率以子路径或子域收进 japan.ouuut.com 体系 | ✅ 已完成 | 静态预渲染五章 `/weather/` `/quake/` `/crime/` `/cabinet/` `/housing/`；历史旧站保留，未摘线 |
| M2 新闻聚合 | 模仿 cnjpv5 的日本本土新闻聚合站（News Pan）上线并收编 | ⬜ 未开始 | 日更产线 + 归档 + RSS + 与 cnjpv5 同级质量 |
| M3 ouuut 收编 | ouuut.com 官网 Products 加 `japan.ouuut.com → pan out` 条目 | ⬜ 未开始 | 三语同步 + 线上可点达 |
| M4 住宅与首页整合 | 住宅章、天气章、六卡首页、C＋A 收尾、三语字标、真实 404 与监控 | ✅ 已完成 | 2026-10-26 生产 `1ca63cf9`，commit `692d5e9`，六页与移动端实测 |

当前阶段：M4 已发布并收口（含 `/weather/`）；未启动 M2 新闻聚合。下一项由用户选择：天气快照刷新/定时任务，或新闻聚合；不把预告卡视为已接数据。
