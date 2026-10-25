# HANDOFF · panout-japan

## Current

- Production source: `F:/projects/panout-japan`; GitHub `ouuut/panout-japan`, Gitea mirror. Brand/domain: `japan.ouuut.com`.
- Current local milestone: the user selected C+A for the homepage closing on 2026-10-25. `src/build.py` generates six cards → C provenance → A single-line statement → compact footer; `src/home-preview.css` holds the closing styles. Only「六种尺度」in「六种尺度看日本。」is accent-coloured. JA/EN use equivalent one-line titles.
- `site/` is generated, not tracked and never edited directly. Local preview: `http://127.0.0.1:8900/?lang=zh`. The retired four-option lab and source backups are at `F:/archive/20261025-ca-hybrid-panout/`.
- No production deployment or remote push has been made for this change. Production status remains the separately recorded Cloudflare Pages release, not this local work.

## Commands run

- `python src/build.py` → latest run passed: 5 pages, CSS `0a49e2d9`, JS `06db0ba6`, 2189 charset characters.
- Headed ego-browser at `http://127.0.0.1:8900/`: 27 width/language combinations (1440/1280/1000/768/640/390/375/360/320 × JA/ZH/EN), one statement line and zero document/body overflow in every case; 6 cards / 4 chapter links / 4 source links / 1 H1; full masthead controls fit.
- Keyboard `<details>` close/reopen → content visibility false/true; actual mobile EN/ZH switch passed; dark accent `#FF6A3D` passed; JS-disabled static JA provenance and title remain visible. Report: `F:/projects/panout-japan/.review/ca-hybrid/report.json`; screenshots alongside it.
- `python -m py_compile src/build.py`, design-lock JSON parse, `git diff --check` → passed. C+A retain readback doc `a3c64fb2`.

## Not verified

- Full-site legacy accessibility/axe audit, all non-home chapter regressions, and cross-browser rendering were not run; the closing's measured contrast and keyboard/JS-disabled checks are not a substitute for a full audit.
- Cloudflare production, cache purge, remote branch parity and deployment checklist were not run.

## Next safe action

- Wait for the independent read-only review, address any reproducible blocker, then let the user approve deployment. Do not publish merely because the local page is ready.

## Rollback

- Pre-change `src/build.py`, `src/home-preview.css`, `src/app.css`, `site/index.html`, README/design lock and this handoff are backed up at `F:/archive/20261025-ca-hybrid-panout/`. The previous four-option preview is preserved there as `closing-options/`.

## Confidence

4/5 — actual generated page and real headed interactions were exercised locally; independent review and production deployment are separate.
