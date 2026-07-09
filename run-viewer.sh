#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
  echo "[run-viewer] node_modules が無いので npm install を実行します..."
  npm install
fi

# 起動 port を決定（--port / --port= / PORT を考慮、無ければ 3020）
TARGET_PORT="${PORT:-3020}"
prev_arg=""
for arg in "$@"; do
  if [ "$prev_arg" = "--port" ]; then TARGET_PORT="$arg"; fi
  case "$arg" in
    --port=*) TARGET_PORT="${arg#--port=}" ;;
  esac
  prev_arg="$arg"
done

# 同じ port を握っている既存サーバがあれば停止する（他プロセスなら中断）
# Linux は ss、macOS は lsof を使う
find_pid_on_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null \
      | awk -v p=":${port}\$" '$4 ~ p { if (match($0, /pid=[0-9]+/)) { print substr($0, RSTART+4, RLENGTH-4); exit } }'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true
  fi
  return 0
}

existing_pid="$(find_pid_on_port "$TARGET_PORT")"
if [ -n "$existing_pid" ]; then
  if ps -p "$existing_pid" -o args= 2>/dev/null | grep -q "server.js"; then
    echo "[run-viewer] port $TARGET_PORT を握っている既存サーバ (PID $existing_pid) を停止します..."
    kill "$existing_pid" 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      sleep 0.3
      if [ -z "$(find_pid_on_port "$TARGET_PORT")" ]; then
        break
      fi
    done
  else
    echo "[run-viewer] port $TARGET_PORT はこのサーバ以外 (PID $existing_pid) が使用中です。先に停止してください。" >&2
    exit 1
  fi
fi

exec env PORT="$TARGET_PORT" node server.js
