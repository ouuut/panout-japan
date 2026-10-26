# Weather refresh runbook

## What runs

The VPS refreshes the official JMA forecast snapshot once a day and redeploys the static site.

- Host: `vps-jp`, user `ubuntu`
- Checkout: `/home/ubuntu/panout-japan`
- Entry: `/home/ubuntu/panout-japan/tools/panout_weather_refresh.sh`
- Timer: `panout-weather-refresh.timer` (systemd user unit)
- Schedule: `06:10 JST` daily, `Persistent=true` so a missed run catches up after boot
- Data: `src/weather/data.js` + `src/weather/DATA-NOTES.md`
- State: `/home/ubuntu/.cache/panout-weather/state.json`
- Secrets: `/home/ubuntu/.config/panout/weather.env` (mode 600)
- Kuma: `panout-weather-refresh` push monitor, id 54, interval 93600s, notification 1
- Production: Cloudflare Pages `panout-site`, branch `main`

The 06:10 run uses JMA's 05:00 short-range product. That product does not publish
today's minimum temperature, so `todayLow` is normally `null`; this is an official
data gap, not a fetch failure. The daily job does not fetch Natural Earth and does
not rebuild `geo.js`.

## Manual commands

```bash
# inspect timer
systemctl --user list-timers --all | grep panout
systemctl --user status panout-weather-refresh.timer

# fetch + validate only; no repo or production changes
cd /home/ubuntu/panout-japan
bash tools/panout_weather_refresh.sh --dry-run

# build and verify without deploying or committing
bash tools/panout_weather_refresh.sh --no-deploy --no-commit

# force a real run (ignores today's success state)
bash tools/panout_weather_refresh.sh --force

# run through the timer unit
systemctl --user start panout-weather-refresh.service
journalctl --user -u panout-weather-refresh.service -n 80 --no-pager
```

The script is idempotent: if `state.json` says today's refresh succeeded, a second
run exits 0 without fetching or deploying. Use `--force` only for a deliberate
manual refresh.

## What the job checks

1. 95 JMA resources: `area.json`, 47 short/weekly forecasts, 47 overviews.
2. All 47 short-range `reportDatetime` dates are today in JST.
3. 47 unique regions match the 47 features in `geo.js`; Hokkaido `016000`,
   Kagoshima `460100`, Okinawa `471000`.
4. Seven unique week dates; valid weather categories; high >= low when both exist;
   valid precipitation period; required metadata.
5. Completeness floors: at most 7 missing `todayHigh`, at most 7 missing
   `todayPop`, at most 2 empty overviews.
6. Full build: 6 pages, 47 no-JS weather rows, current `data.js?v=` hash, no
   unresolved placeholders.
7. Production: `/weather/` 200, the referenced `data.js` parses, `generatedAt`
   matches, 47 regions, immutable cache policy.
8. Source: commit `src/weather/data.js` and `src/weather/DATA-NOTES.md`, push to
   GitHub and Gitea, fetch and require `0 ahead / 0 behind`.

Any failure before deployment restores the previous `data.js`. A post-deploy
verification failure attempts a rollback to the previous production deployment.
If source push fails after a verified deployment, the production snapshot is
kept and the monitor goes red; the next run retries the source update.

## Recovery

```bash
# current deployment and previous deployment
cat /home/ubuntu/.cache/panout-weather/state.json

# production rollback (previous deployment id from state)
curl -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/panout-site/deployments/<previous-id>/rollback"
```

To stop the daily job:

```bash
systemctl --user disable --now panout-weather-refresh.timer
```

To re-enable:

```bash
systemctl --user enable --now panout-weather-refresh.timer
```

## Local development

The daily commit lands on `main`. Before editing locally:

```bash
git pull --ff-only origin main
```

`tools/weather_data.py` is the production normalization module; it is data-only
and does not need shapely. `src/fonts.py` accepts `PANOUT_LATIN_FONTS`,
`PANOUT_SC_FONTS` and `PANOUT_OUTFIT_FONT`; the VPS font cache is
`/home/ubuntu/panout-fonts/`, with the JP variable fonts in
`/home/ubuntu/panout-japan/.cache/fonts/`.

Do not edit `site/` or deploy an unverified directory. Do not commit the raw JMA
cache or Cloudflare tokens.
