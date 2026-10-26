#!/usr/bin/env bash
# Daily weather refresh entry point for the VPS systemd timer.
# Secrets live outside the repo in ~/.config/panout/weather.env (mode 600).
set -euo pipefail

ROOT="${PANOUT_ROOT:-/home/ubuntu/panout-japan}"
ENV_FILE="${PANOUT_ENV_FILE:-/home/ubuntu/.config/panout/weather.env}"
LOCK="${PANOUT_LOCK:-/tmp/panout-weather-refresh.lock}"

export PATH="/home/ubuntu/.n/bin:/usr/local/bin:/usr/bin:/bin"
export PYTHONUNBUFFERED=1
export GIT_TERMINAL_PROMPT=0

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd "$ROOT"
exec flock -n "$LOCK" python3 tools/refresh_weather.py "$@"
