# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea `sai/panout-japan`. Brand: `japan.ouuut.com`.
- Production release: Cloudflare Pages `panout-site`, deployment `1ca63cf9-e8f4-4f71-a9c8-41900ca9cf74`, 2026-10-26 JST. Live at `https://japan.ouuut.com/`; weather chapter at `https://japan.ouuut.com/weather/`.
- Home: six plates; weather, quake, crime, cabinet and housing are live links; news is the only preview. C+A provenance now lists five chapters and the author signature remains. Three localized masthead logos, 12-second cycle: JA `六つの尺度で日本を見る`, ZH `六种尺度看日本`, EN `Six scales of Japan`; static domain remains the accessible/no-JS/reduced-motion fallback.
- Weather: `src/weather/` is the production runtime (JMA snapshot, 47-prefecture map, `app.js`, weather CSS). Build emits `/weather/` plus versioned `/assets/weather/{app.js,data.js,geo.js,weather.css}?v=40145957`. The page shows 47 prefectures, 46 main-map places plus the Okinawa inset, today/tomorrow and seven days, and a 47-row no-JS fallback. The JMA snapshot is `generatedAt 2026-10-25T23:01:29Z`, issued `2026-10-26 05:00 JST`; it is a static snapshot, not live observations.
- Final source commit `692d5e9 feat: publish weather chapter` (docs closeout commit follows). Build: 6 content pages, CSS `39c895b0`, JS `a78b2c26`, fonts `5d02f1ac`, charset 2244. Both source remotes to be pushed and re-fetched at 0/0 after docs.
- Localized top-level 404 is generated but excluded from the sitemap; production unknown URLs return 404 rather than the homepage. Dictionary requests carry a content hash, so immutable caching cannot retain old translations. Homepage has WebSite + Organization JSON-LD; the five chapter pages carry Dataset JSON-LD.

## Commands run

- `python src/build.py`, `python -m py_compile src/build.py`, `node --check src/shell.js`, `node --check src/weather/app.js`, `git diff --check`: passed. Build: 6 pages, 191 i18n keys, six sitemap URLs, no failures.
- Cloudflare: uploaded `site/` to `panout-site` (23 new files, 54 existing); `_headers` and `_redirects` uploaded. Deployment URL `https://1ca63cf9.panout-site.pages.dev`, production `https://japan.ouuut.com/`.
- Local headed Chromium: 1440/390/320/768, JA/ZH/EN. Weather page renders 47 regions and 47 map features, 46 main-map places plus the Okinawa inset; selected Tokyo by default; real pin click selects `471000`, label `那覇`/`那霸`; language switch updates `冲绳县` and canonical; picker opens 47 options; day toggle and table row work. No-JS shows 47 fallback rows and one H1. Horizontal overflow 0 on all tested widths.
- Homepage: weather card is now an `<a href="/weather/">` with `開く ↗`; five live entries, one news preview, five provenance sources. `/weather` redirects to `/weather/`.
- Production browser: `/weather/` 200 with title and 47 regions; real Okinawa selection and ZH label; canonical `?lang=zh`; mobile 390 card 200×200, overflow 0, menu includes weather. Home weather card click reaches `/weather/`. Unknown URL is a true 404 with `no-store` and a weather link. All four existing chapters still mount (quake WebGL, crime/housing Leaflet, cabinet chart), nav has five links.
- Headers/assets: weather HTML `max-age=0, must-revalidate`; `/assets/weather/*` 200 with `max-age=31536000, immutable`; sitemap six URLs; `llms.txt` lists five chapters; robots 200 with `Allow: /` and sitemap.
- Live performance probe (390px mobile, no cache): LCP 240ms, CLS 0, one 133ms long task, no overflow. Lighthouse was not rerun for the weather page (no local Chrome installation); the prior homepage Lighthouse remains 97/100/100/100.
- Monitoring: existing `/home/ubuntu/vps-ops/scripts/panout_watch.py` still checks homepage markers, robots/sitemap/llms and TLS; its `panout-japan-watch/1.0` UA returns 200 against production. Kuma `panout-japan-check` id 53, hourly cron minute 23, heartbeat `/home/ubuntu/watchdog/heartbeats/panout-japan.ok`.
- Evidence: `.review/weather-lab/` (production screenshots, live tests, performance probe, source handoff) and `.review/release/` (prior release). Backup of pre-weather source and old deployment metadata: `F:/archive/20261026-125659-panout-weather/`.

## Not verified

- The weather page is a static JMA snapshot; no scheduler or refresh job is attached. Forecast values will age until the snapshot is replaced.
- No Lighthouse rerun for `/weather/` (no local Chrome installation). Live PerformanceObserver on 390px gave LCP 240ms, CLS 0 and one 133ms long task; that is not a substitute for Lighthouse.
- No full cross-browser matrix or full-site axe audit; this release used headed Chromium and targeted contrast/focus/reduced-motion checks. Contrast readings during a theme transition are not stable endpoints; final sage navigation is 4.9:1, dark 7.76:1.
- No Search Console/Bing submission, Facebook/LinkedIn/Telegram share-preview validation, custom OG image, analytics/event tracking, enforced CSP, or domain-registrar renewal check. Pages supplies its own Web Analytics beacon; that was not independently audited.
- No rollback was executed against production (avoiding unnecessary live switching). The exact API rollback endpoint and prior deployment are recorded below; <5-minute restoration was not timed live.
- CDN `Purge Everything` was not run: HTML is max-age=0 and production already served the final bytes; versioned assets are immutable.

## Next safe action

- Observe the scheduled monitor and real traffic for 24h. For the next release, choose between a weather snapshot refresh/scheduler and the news feed; do not describe the news preview as a live product. Re-run Lighthouse on `/weather/` when a Chrome installation is available.

## Rollback

- Previous production deployment before this release: `b9b0c617-0a3f-49a8-8d05-ac6e8cd72c96`, saved in `F:/archive/20261026-panout-production/` and `F:/archive/20261026-125659-panout-weather/cloudflare-before-weather.json`.
- Restore through the Cloudflare dashboard “Rollback to this deployment”, or POST `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/panout-site/deployments/b9b0c617-0a3f-49a8-8d05-ac6e8cd72c96/rollback` using the existing ouuut account token. Do not deploy an unverified directory as a rollback.
- Source before weather integration is backed up in `F:/archive/20261026-125659-panout-weather/` (`build.py`, `shell.js`, docs, old `site/index.html`, headers/redirects/sitemap/llms). Reverting source alone does not change production; rebuild and deploy only after verification.

## Confidence

4/5 — production content, five chapters, weather page, localized layouts, real 404, headers/cache and monitoring UA were exercised. Weather refresh scheduling, Lighthouse for the new page, external platform registrations, full browser matrix and a live timed rollback remain unverified.
