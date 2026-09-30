#!/bin/sh
# The SQLite directory is a host bind mount in production, so the image's build-time
# chown does not apply. Deployments from before the image ran as `node` created it (and
# fairshare.db) as root, which makes every write fail with SQLITE_READONLY. Start as
# root only long enough to hand the database directory to `node`, then drop privileges.
# POSIX sh on purpose: the Alpine runtime image does not ship bash.

db_path=${DB_PATH:-/app/database/fairshare.db}
db_dir=$(dirname "$db_path")

if [ "$(id -u)" = '0' ]; then
  mkdir -p "$db_dir" || exit 1
  # SQLite creates -journal/-wal files beside the database, so the directory itself must
  # be writable too. Only touch entries that are not already owned by node.
  find "$db_dir" -maxdepth 1 ! -user node -exec chown node:node {} + || exit 1
  exec su-exec node "$@"
fi

exec "$@"
