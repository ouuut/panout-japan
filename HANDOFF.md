# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea `sai/panout-japan`. Brand: `japan.ouuut.com`.
- Production release: Cloudflare Pages `panout-site`, deployment `b9b0c617-0a3f-49a8-8d05-ac6e8cd72c96`, 2026-10-26 JST. Live at `https://japan.ouuut.com/`.
- Home: six plates, four live chapter links, two clearly labelled previews; C+A provenance and author signature. Three localized masthead logos, 12-second cycle: JA `六つの尺度で日本を見る`, ZH `六种尺度看日本`, EN `Six scales of Japan`; static domain remains the accessible/no-JS/reduced-motion fallback.
- Final source commit `63262ef feat: add localized 404 and versioned dictionary`; both source remotes were pushed and re-fetched at 0 ahead/0 behind. Build: 5 content pages, CSS `d417da71`, JS `10eb08f4`, fonts `12f06251`, charset 2192.
- Localized top-level 404 is generated but excluded from the sitemap; production unknown URLs return 404 rather than the homepage. Dictionary requests carry `?v=98c95ae6`, so immutable caching cannot retain old translations. Homepage has WebSite + Organization JSON-LD.

## Commands run

- `python src/build.py`, `python -m py_compile src/build.py`, `node --check src/shell.js`, `git diff --check`: passed. Candidate metadata: 5 pages, 185 i18n keys, five sitemap URLs, no failures.
- Cloudflare: uploaded `site/` to `panout-site` (17 new files, 55 existing); `_headers` and `_redirects` uploaded. Final deployment URL `https://b9b0c617.panout-site.pages.dev`.
- Production browser, 1440/390/320 × JA/ZH/EN: localized logos visible one at a time, no overflow, no clipped glyphs. Correct logo widths at desktop 237.03/205.63/140.74px inside 250.81px wordmark. Four chapters mounted live: quake WebGL (2 canvases), crime/housing Leaflet maps, cabinet chart; zero failed mounts.
- Timeline: 12000ms; JA phrase fully visible at 7100–10400ms at >0.99; domain and logo never visible together. No-JS/reduced-motion static domain confirmed.
- Production unknown URL: HTTP 404, `no-store`, Japanese error page with home/four chapters/contact; three local 404 language variants checked at desktop/mobile. Homepage Organization + WebSite JSON-LD and versioned i18n checked live.
- Production Lighthouse mobile: performance 97, accessibility 100, best-practices 100, SEO 100; LCP 2.1s, FCP 1.9s, CLS 0, TBT 0ms. Local baseline performance 58 was caused by uncompressed Python preview; it is not the production result.
- TLS: 76 days remaining, expiry 2027-01-10 GMT. robots/sitemap/llms and versioned static resources returned 200. No-index is confined to the intentional 404/preview paths, not content pages.
- Monitoring: `/home/ubuntu/vps-ops/scripts/panout_watch.py` on vps-jp, hourly cron `panout-japan-watch` (minute 23), registry `/home/ubuntu/watchdog/registry.json`, heartbeat `/home/ubuntu/watchdog/heartbeats/panout-japan.ok`, Kuma `panout-japan-check` id 53, interval 5400s. Notification binding id 1. Latest recorded status UP after the homepage JSON-LD was deployed. Database backup `/home/ubuntu/vps-ops/backups/kuma.db.pre-20261025-155727`; shared file backups `/home/ubuntu/archive/20261026-panout-monitoring/`.
- `git push origin main`, `git push gitea main`, then fetch and compare both: 0/0. Evidence `.review/release/` (production, chapters, final-production, http, headers, Lighthouse and screenshots).

## Not verified

- No full cross-browser matrix or full-site axe audit; this release used headed Chromium and targeted contrast/focus/reduced-motion checks. Contrast readings during a theme transition are not stable endpoints; final sage navigation is 4.9:1, dark 7.76:1.
- No Search Console/Bing submission, Facebook/LinkedIn/Telegram share-preview validation, custom OG image, analytics/event tracking, enforced CSP, or domain-registrar renewal check. Pages supplies its own Web Analytics beacon; that was not independently audited.
- No rollback was executed against production (avoiding unnecessary live switching). The exact API rollback endpoint and prior deployment are recorded below; <5-minute restoration was not timed live.
- CDN `Purge Everything` was not run: HTML is max-age=0 and production already served the final bytes; versioned assets are immutable.

## Next safe action

- Observe the scheduled monitor and real traffic for 24h. If a separate release is requested, choose between the remaining growth/SEO work (Search Console/Bing and OG/social previews) and the weather/news data feeds; do not describe those preview cards as live products.

## Rollback

- Previous production deployment before this release: `efaf451f-dd9a-4aa7-a7e8-3f0c594aa887`, saved in `F:/archive/20261026-panout-production/` with Cloudflare project/deployment JSON and old homepage HTML.
- Restore through the Cloudflare dashboard “Rollback to this deployment”, or POST `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/panout-site/deployments/efaf451f-dd9a-4aa7-a7e8-3f0c594aa887/rollback` using the existing ouuut account token. Do not deploy an unverified directory as a rollback.
- Source before final 404/cache patch is backed up in `F:/archive/20261026-panout-production/source-before-final/`. Reverting source alone does not change production; rebuild and deploy only after verification.

## Confidence

4/5 — production content, all chapters, localized layouts, real 404, Lighthouse, headers/TLS and monitor were exercised. External platform registrations, full browser matrix and a live timed rollback remain unverified.
