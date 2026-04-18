#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DEPLOY_HOST:-}" || -z "${DEPLOY_USER:-}" || -z "${DEPLOY_PATH:-}" ]]; then
  echo "DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PATH are required"
  exit 1
fi

if [[ ! -f release.tgz ]]; then
  echo "release.tgz not found in current directory"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"

ssh ${SSH_OPTS} "${REMOTE}" "mkdir -p '${DEPLOY_PATH}'"
scp ${SSH_OPTS} release.tgz "${REMOTE}:${DEPLOY_PATH}/release.tgz"

ssh ${SSH_OPTS} "${REMOTE}" "
  set -e
  cd '${DEPLOY_PATH}'
  tar -xzf release.tgz
  rm -f release.tgz
  if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo 'Created .env from .env.example. Update secrets for production.'
  fi
  if [ ! -f backend/.env ] && [ -f backend/.env.example ]; then
    cp backend/.env.example backend/.env
    echo 'Created backend/.env from backend/.env.example. Update secrets for production.'
  fi
  docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
  docker image prune -f
"

echo "Deployment completed on ${DEPLOY_HOST}"
