# Weather snapshot

Generated at **2026-10-26T04:30:06Z**; this is a static JMA forecast snapshot, not live observations.

## Fetch

- 95 JMA resources requested; downloaded **95**, reused cache **0**.
- Short-range report timestamps: **2026-10-26T11:00:00+09:00** through **2026-10-26T12:00:00+09:00** (JST offsets preserved).
- The static map geometry in `geo.js` is not refetched by the daily job.

## Validation

- Regions **47**, geometries **47**, categories `{"clear": 2, "cloud": 7, "rain": 38}`.
- Missing values: `{"todayHigh": 0, "todayLow": 47, "todayPop": 0, "weekHigh": 47, "weekLow": 47, "weekPop": 47, "weekReliability": 94, "emptyOverviewText": 0, "missingTomorrowJa": 0}`.
- `null` means JMA did not issue the value. No temperature, precipitation probability, reliability, observation or overview is invented.
- The 05:00 JST short-range product does not publish today's minimum; `todayLow` is therefore normally null.
- Source: 気象庁 (JMA) forecast JSON; attribution and source links are rendered on `/weather/`.
