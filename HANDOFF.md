# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea mirror. Brand/domain: `japan.ouuut.com`.
- Local milestone, 2026-10-25: C+A homepage closing now carries an integrated author signature inside `.hp-statement` (after the single H1), plus a five-second animated masthead wordmark shared by all five pages.
- Author content: 中本蔡 / NAKAMOTO SAI; public bio: a Shanghai-born, Tokyo-based Chinese-language writer and independent AI creator. Links: `https://ouuut.com/` labelled independent projects, `https://saaaai.com/` neutrally labelled main site (live browser title is セイシン株式会社｜AIプロダクト・スタジオ, so it is not called a personal homepage), `mailto:sai@saaaai.com`, `https://x.com/saaaaicom`. No age, visa, family or other private biography.
- Masthead: accessible link name remains `japan.ouuut.com`. Visual layers alternate every 5000ms: domain glyphs appear left-to-right and fade, then `六种尺度看日本` does the same, then the domain returns. Pure CSS, opacity only; the stage reserves the old wordmark width. Reduced motion and no-JS show the static domain. The footer wordmark is static.
- `site/` is generated and never edited directly. Local preview: `http://127.0.0.1:8900/?lang=zh`. Old four-option lab: `F:/archive/20261025-ca-hybrid-panout/`. Pre-author backups and domain-card snapshots: `F:/archive/20261025-author-wordmark-panout/`.
- No production deployment or remote push has been made for this change.

## Commands run

- `python src/build.py` → 5 pages, CSS `3eba3c3c`, JS `664b7e9d`, fonts `d7a1a926`, charset 2192.
- `python -m py_compile src/build.py`, `node --check src/shell.js`, design-lock JSON parse, `git diff --check` → passed.
- Headed ego-browser, 27 width/language combinations (1440/1280/1000/768/640/390/375/360/320 × JA/ZH/EN): zero failures; one statement line, one H1, six cards, four chapter links, four source links, no document/body overflow, all author links inside their column.
- Frozen animation sampling: duration 5000ms; domain visible glyphs 0 at 0ms, 15 at 650ms, 0 at 2450ms; CJK 7 at 3000ms, 0 at 4800ms, 0 at 5000ms; tools shift 0px, wordmark width shift 0px.
- Shared masthead checked on `/`, `/quake/`, `/crime/`, `/cabinet/`, `/housing/` at 1440/768/390: 15 combinations, zero failures. Reduced-motion and JavaScript-disabled: static domain visible, stage hidden, no animation. Actual mobile EN→ZH switch passed.
- Contrast after theme transition: sage minimum 5.3:1, dark minimum 6.74:1. 320px: no horizontal overflow. Contact destinations returned 200 for ouuut.com, saaaai.com and x.com/saaaaicom.
- Evidence: `F:/projects/panout-japan/.review/author-wordmark/report.json` and screenshots alongside it.
- Independent review, first pass: no implementation defect; it flagged the stale `saaaai.com` personal-homepage label. Cache-disabled browser check confirmed the live title is「セイシン株式会社｜AIプロダクト・スタジオ」with visible H1 `nakamoto sai`. Commit `92811f4` changes the label to 主站 / Main site / メインサイト and makes the Shanghai-born detail consistent across all three bios.
- Independent review, second pass on `92811f4`: no defects. It verified nine 320/390/1440 × JA/ZH/EN combinations, four correct destinations, one H1 with the author block after it, no overflow, no animation regression, and served asset hashes CSS `3eba3c3c`, JS `664b7e9d`, fonts `d7a1a926`.

## Not verified

- Full-site axe/legacy accessibility audit and cross-browser rendering were not run; this round covers the changed masthead, homepage author block, two themes, three languages, reduced motion and no-JS.
- Cloudflare production, cache purge, remote branch parity and deployment checklist were not run. External destination status proves reachability, not their content.

## Next safe action

- Both independent reviews are complete and the second pass on `92811f4` found no defects. The only remaining action is user approval before deployment. Do not publish merely because the local page is ready.

## Rollback

- Last known good before this round: commit `58abed1`. Revert the source/doc commit and rebuild `python src/build.py`; `site/` is generated.
- Previous handoff and domain cards: `F:/archive/20261025-author-wordmark-panout/`. Previous closing implementation backup: `F:/archive/20261025-ca-hybrid-panout/`.

## Confidence

4/5 — real generated pages and headed browser interactions were exercised at desktop, tablet and mobile; independent review and production deployment remain separate.
