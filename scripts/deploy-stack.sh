#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-cloud-skeleton}"

docker stack deploy -c docker/docker-stack.yml "${STACK_NAME}"

