# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea `sai/panout-japan`. Brand: `japan.ouuut.com`.
- Production release: Cloudflare Pages `panout-site`, deployment `e16a2b8e-fcc9-4f5b-81d0-c9c744814c16`, 2026-10-26 JST. Live at `https://japan.ouuut.com/`; weather chapter at `https://japan.ouuut.com/weather/`. Daily refresh is attached on `vps-jp`.
- Home: six plates; weather, quake, crime, cabinet and housing are live links; news is the only preview. C+A provenance now lists five chapters and the author signature remains. Three localized masthead logos, 12-second cycle: JA `六つの尺度で日本を見る`, ZH `六种尺度看日本`, EN `Six scales of Japan`; static domain remains the accessible/no-JS/reduced-motion fallback.
- Weather: `src/weather/` is the production runtime (JMA snapshot, 47-prefecture map, `app.js`, weather CSS). Build emits `/weather/` plus versioned `/assets/weather/{app.js,data.js,geo.js,weather.css}?v=ca022ab1`. The page shows 47 prefectures, 46 main-map places plus the Okinawa inset, today/tomorrow and seven days, and a 47-row no-JS fallback. The current JMA snapshot is `generatedAt 2026-10-26T05:07:02Z`, with short-range reports from `2026-10-26 11:00` to `12:00 JST`; it is a static snapshot, not live observations. The scheduled 06:10 JST run uses the 05:00–06:00 JST products, whose `todayLow` is normally null.
- Daily refresh: `vps-jp:/home/ubuntu/panout-japan`, systemd user timer `panout-weather-refresh.timer` at 06:10 JST (`Persistent=true`), entry `tools/panout_weather_refresh.sh`, state `/home/ubuntu/.cache/panout-weather/state.json`, secrets `/home/ubuntu/.config/panout/weather.env` (600). It fetches 95 JMA resources, validates 47 regions, builds all six pages, deploys, verifies production, then commits/pushes both remotes. Runbook: `docs/WEATHER-REFRESH.md`.
- Final source commit `ec09254 feat: add external weather refresh watchdog`; weather data `6d37d1b weather: refresh 2026-10-26`; app fix `b8e45d6 fix: align weather week dates with today`; earlier `02402f2 fix: resolve weather deployment id after upload`, docs closeout `1f0d211 docs: document daily weather refresh`. Both source remotes were pushed and re-fetched at 0/0. Build on VPS: 6 content pages, CSS `998c0206`, JS `54848846`, fonts `d101a362`, charset 2243, weather `ca022ab1`.
- Localized top-level 404 is generated but excluded from the sitemap; production unknown URLs return 404 rather than the homepage. Dictionary requests carry a content hash, so immutable caching cannot retain old translations. Homepage has WebSite + Organization JSON-LD; the five chapter pages carry Dataset JSON-LD.

## Commands run

- `python src/build.py`, `python -m py_compile src/build.py`, `node --check src/shell.js`, `node --check src/weather/app.js`, `git diff --check`: passed. Build: 6 pages, 191 i18n keys, six sitemap URLs, no failures.
- Cloudflare: uploaded `site/` to `panout-site`; `_headers` and `_redirects` uploaded. Latest deployment URL `https://e16a2b8e.panout-site.pages.dev`, production `https://japan.ouuut.com/`.
- Daily refresh: `bash tools/panout_weather_refresh.sh --force` on `vps-jp` fetched 95 JMA resources, validated 47 regions, built six pages, deployed, verified production, committed and pushed GitHub/Gitea. Final forced run at 14:07 JST produced `generatedAt 2026-10-26T05:07:02Z`, deployment `e16a2b8e-fcc9-4f5b-81d0-c9c744814c16`, commit `6d37d1b`. A run without `--force` skipped idempotently; `systemctl --user start panout-weather-refresh.service` also exited 0. VPS build: CSS `998c0206`, JS `54848846`, fonts `d101a362`, charset 2243, weather `ca022ab1`.
- Production browser (ego-browser): `/weather/?lang=ja` renders 47 regions, 47 table rows, default Tokyo `130000`, `generatedAt 2026-10-26T05:07:02Z`, overflow 0, H1 `日本の天気`, dateline `10月26日(月)`, seven cards `10/26–11/01` with today first. Screenshot `.review/weather-lab/live-date-fix-1440-ja.png`.
- Local headed Chromium: 1440/390/320/768, JA/ZH/EN. Weather page renders 47 regions and 47 map features, 46 main-map places plus the Okinawa inset; selected Tokyo by default; real pin click selects `471000`, label `那覇`/`那霸`; language switch updates `冲绳县` and canonical; picker opens 47 options; day toggle and table row work. No-JS shows 47 fallback rows and one H1. Horizontal overflow 0 on all tested widths.
- Homepage: weather card is now an `<a href="/weather/">` with `開く ↗`; five live entries, one news preview, five provenance sources. `/weather` redirects to `/weather/`.
- Production browser: `/weather/` 200 with title and 47 regions; real Okinawa selection and ZH label; canonical `?lang=zh`; mobile 390 card 200×200, overflow 0, menu includes weather. Home weather card click reaches `/weather/`. Unknown URL is a true 404 with `no-store` and a weather link. All four existing chapters still mount (quake WebGL, crime/housing Leaflet, cabinet chart), nav has five links.
- Headers/assets: weather HTML `max-age=0, must-revalidate`; `/assets/weather/*` 200 with `max-age=31536000, immutable`; sitemap six URLs; `llms.txt` lists five chapters; robots 200 with `Allow: /` and sitemap.
- Live performance probe (390px mobile, no cache): LCP 240ms, CLS 0, one 133ms long task, no overflow. Lighthouse was not rerun for the weather page (no local Chrome installation); the prior homepage Lighthouse remains 97/100/100/100.
- Monitoring: `/home/ubuntu/vps-ops/scripts/panout_watch.py` checks homepage markers, robots/sitemap/llms and TLS hourly at minute 23; Kuma `panout-japan-check` id 53, heartbeat `/home/ubuntu/watchdog/heartbeats/panout-japan.ok`. Weather pipeline: Kuma `panout-weather-refresh` id 54, push interval 93600s, one retry / 120s, notification 1; external probe `/home/ubuntu/vps-ops/scripts/panout_weather_watch.py` (source `deploy/vps/panout_weather_watch.py`) runs at minute 45, checks `state.json` (success by 06:40 JST, failure marker, 26h age) and reconciles production `data.js` (`generatedAt`, 47 regions, report dates, `week[0]`, immutable cache). Registry item `panout-japan.weather`, cron `panout-weather-watch`, heartbeat `panout-weather-refresh.ok`, token in `kuma_tokens.json`. The refresh script also records `last_failure_at` and pushes DOWN on failure. systemd timer `panout-weather-refresh.timer` next run 2026-10-27 06:10 JST.
- Evidence: `.review/weather-lab/` (production screenshots, live tests, performance probe, source handoff) and `.review/release/` (prior release). Backup of pre-weather source and old deployment metadata: `F:/archive/20261026-125659-panout-weather/`.

## Not verified

- The automatic 06:10 JST run has not been observed yet; the manual runs were at 13:36, 13:57 and 14:07 JST and used the 11:00 JMA product. The timer is enabled and next fires 2026-10-27 06:10 JST.
- No Lighthouse rerun for `/weather/` (no local Chrome installation). Live PerformanceObserver on 390px gave LCP 240ms, CLS 0 and one 133ms long task; that is not a substitute for Lighthouse.
- No full cross-browser matrix or full-site axe audit; this release used headed Chromium and targeted contrast/focus/reduced-motion checks. Contrast readings during a theme transition are not stable endpoints; final sage navigation is 4.9:1, dark 7.76:1.
- No Search Console/Bing submission, Facebook/LinkedIn/Telegram share-preview validation, custom OG image, analytics/event tracking, enforced CSP, or domain-registrar renewal check. Pages supplies its own Web Analytics beacon; that was not independently audited.
- No rollback was executed against production (avoiding unnecessary live switching). The exact API rollback endpoint and prior deployment are recorded below; <5-minute restoration was not timed live.
- CDN `Purge Everything` was not run: HTML is max-age=0 and production already served the final bytes; versioned assets are immutable.

## Next safe action

- Observe the first automatic refresh on 2026-10-27 06:10 JST: check `state.json`, `journalctl --user -u panout-weather-refresh.service`, production `generatedAt`, Kuma id 54, and the external probe log at 06:45. Then choose the news feed; do not describe the news preview as a live product. Re-run Lighthouse on `/weather/` when a Chrome installation is available.

## Rollback

- Current production deployment: `e16a2b8e-fcc9-4f5b-81d0-c9c744814c16`. Previous production deployment: `ca2cf008-5a36-4f16-a213-e921e3564d5b` (the first weather refresh), saved in `state.json` as `previous_deployment_id`; older release metadata is in `F:/archive/20261026-125659-panout-weather/`.
- Restore through the Cloudflare dashboard “Rollback to this deployment”, or POST `https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/panout-site/deployments/ca2cf008-5a36-4f16-a213-e921e3564d5b/rollback` using the existing ouuut account token. Do not deploy an unverified directory as a rollback.
- Daily source data commit is `6d37d1b` (`weather: refresh 2026-10-26`). To revert data, `git revert 6d37d1b` or restore `src/weather/data.js` from `b8e45d6`, rebuild, verify, and deploy. Reverting source alone does not change production.
- Older pre-weather source and deployment metadata remain in `F:/archive/20261026-125659-panout-weather/` (`build.py`, `shell.js`, docs, old `site/index.html`, headers/redirects/sitemap/llms).

## Confidence

4/5 — production content, five chapters, weather page, daily refresh (manual, idempotent, systemd service), localized layouts, real 404, headers/cache and Kuma wiring were exercised. The first automatic 06:10 run, Lighthouse for the new page, external platform registrations, full browser matrix and a live timed rollback remain unverified.
