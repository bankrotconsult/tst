#!/bin/bash
set -e

cd "$(dirname "$0")"

docker compose build bk-chat-node
docker compose up -d --no-deps bk-chat-node
