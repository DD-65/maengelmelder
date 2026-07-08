#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/d_cairoli23/maengelmelder}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-maengelmelder}"

cd "$APP_DIR"

if [ -z "${XDG_RUNTIME_DIR:-}" ]; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
fi

if [ -s "$HOME/.nvm/nvm.sh" ]; then
    set +u
  . "$HOME/.nvm/nvm.sh"
  nvm use --silent
  set -u
fi

if [ ! -d .git ]; then
  echo "Deployment directory is not a git checkout: $APP_DIR" >&2
  exit 1
fi

git fetch origin "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"

if [ -f database/app.db ]; then
  mkdir -p database/backups
  backup_file="database/backups/app-$(date +%Y%m%d-%H%M%S).db"

  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 database/app.db ".backup '$backup_file'"
  else
    cp database/app.db "$backup_file"
  fi
fi

npm ci
npm run build

if systemctl --user is-active --quiet "$SERVICE_NAME" || systemctl --user is-enabled --quiet "$SERVICE_NAME"; then
  systemctl --user restart "$SERVICE_NAME"
else
  sudo systemctl restart "$SERVICE_NAME"
fi

echo "$DEPLOY_BRANCH has been deployed ($APP_DIR), restarted $SERVICE_NAME."
