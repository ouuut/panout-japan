# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea mirror. Brand/domain: `japan.ouuut.com`.
- Local milestone, 2026-10-25: C+A homepage closing carries an integrated author signature inside `.hp-statement` (after the single H1), plus a twelve-second animated masthead wordmark shared by all five pages.
- Author content: 中本蔡 / NAKAMOTO SAI; public bio: a Shanghai-born, Tokyo-based Chinese-language writer and independent AI creator. Links: `https://ouuut.com/` labelled independent projects, `https://saaaai.com/` neutrally labelled main site (live browser title is セイシン株式会社｜AIプロダクト・スタジオ, so it is not called a personal homepage), `mailto:sai@saaaai.com`, `https://x.com/saaaaicom`. No age, visa, family or other private biography.
- Masthead: accessible link name remains `japan.ouuut.com`. Every 12000ms: the domain appears left-to-right, holds fully visible for about 3s, then fades; the active UI language's logo appears, holds about 3s, fades, and returns to the domain. Localized phrases: JA 六つの尺度で見る, ZH 六种尺度看日本, EN Six scales of Japan. JA/ZH weight 250 matches `.hp-verb`「抬头看」; EN uses the serif at 400. Only the active language layer is shown. Pure CSS, opacity only; the stage reserves the old wordmark width. Reduced motion and no-JS show the static domain. The footer wordmark is static.
- `site/` is generated and never edited directly. Local preview: `http://127.0.0.1:8900/?lang=zh`. Old four-option lab: `F:/archive/20261025-ca-hybrid-panout/`. Pre-author backups and domain-card snapshots: `F:/archive/20261025-author-wordmark-panout/`.
- No production deployment or remote push has been made for this change.

## Commands run

- `python src/build.py` → 5 pages, CSS `2e8c308d`, JS `664b7e9d`, fonts `1ae3f06e`, charset 2192.
- `python -m py_compile src/build.py`, `node --check src/shell.js`, design-lock JSON parse, `git diff --check` → passed.
- Headed ego-browser, 27 width/language combinations (1440/1280/1000/768/640/390/375/360/320 × JA/ZH/EN): zero failures; one statement line, one H1, six cards, four chapter links, four source links, no document/body overflow, all author links inside their column.
- Frozen animation sampling at 100ms: duration 12000ms; domain fully visible 1200–4100ms; ZH/JA phrase 7100–10400ms; EN phrase 7300–10400ms; no overlap; tools and wordmark width shift 0px. Exactly one localized layer is visible in each language; visible weights are 250 JA/ZH and 400 EN, matching `.hp-verb`. Ten page/width checks passed.
- Live EN/ZH/JA switches keep all phrase layers on the same timeline through `visibility` (not `display`): measured phase drift 0–14ms, and a full-cycle sample after each switch had zero frames with domain and phrase visible together.
- Shared masthead checked on `/`, `/quake/`, `/crime/`, `/cabinet/`, `/housing/` at 1440/768/390: 15 combinations, zero failures. Reduced-motion and JavaScript-disabled: static domain visible, stage hidden, no animation. Actual mobile EN→ZH switch passed.
- Contrast after theme transition: sage minimum 5.3:1, dark minimum 6.74:1. 320px: no horizontal overflow. Contact destinations returned 200 for ouuut.com, saaaai.com and x.com/saaaaicom.
- Evidence: `F:/projects/panout-japan/.review/author-wordmark/report.json` for the author block and `F:/projects/panout-japan/.review/wordmark-tuning/report.json` for the current localized twelve-second cycle; screenshots alongside both.
- Independent review, first pass: no implementation defect; it flagged the stale `saaaai.com` personal-homepage label. Cache-disabled browser check confirmed the live title is「セイシン株式会社｜AIプロダクト・スタジオ」with visible H1 `nakamoto sai`. Commit `92811f4` changes the label to 主站 / Main site / メインサイト and makes the Shanghai-born detail consistent across all three bios.
- Independent review, second pass on `92811f4`: no defects. It verified nine 320/390/1440 × JA/ZH/EN combinations, four correct destinations, one H1 with the author block after it, no overflow, no animation regression, and served asset hashes CSS `3eba3c3c`, JS `664b7e9d`, fonts `d7a1a926`.

## Not verified

- Full-site axe/legacy accessibility audit and cross-browser rendering were not run; this round covers the changed masthead, homepage author block, two themes, three languages, reduced motion and no-JS.
- Cloudflare production, cache purge, remote branch parity and deployment checklist were not run. External destination status proves reachability, not their content.

## Next safe action

- User requested slower holds, lighter JA/ZH type, and a separate logo for each language. The localized 12s cycle is implemented. The first review found a language-switch phase desync; commit `e4443ee` fixed it, and the second review found no defects. The only remaining action is user approval before deployment. Do not publish merely because the local page is ready.

## Rollback

- Last known good before this localized-motion round: commit `9bbbcbd`. Revert the source/doc commit and rebuild `python src/build.py`; `site/` is generated.
- Previous handoff and domain cards: `F:/archive/20261025-author-wordmark-panout/`. Previous closing implementation backup: `F:/archive/20261025-ca-hybrid-panout/`.

## Confidence

4/5 — real generated pages and headed browser interactions were exercised at desktop, tablet and mobile; independent review and production deployment remain separate.
