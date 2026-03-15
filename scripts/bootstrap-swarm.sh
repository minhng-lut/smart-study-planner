#!/usr/bin/env bash
set -euo pipefail

if docker info --format '{{.Swarm.LocalNodeState}}' | grep -qx "active"; then
  echo "Docker Swarm already active"
  exit 0
fi

docker swarm init

