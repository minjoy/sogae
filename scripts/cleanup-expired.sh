#!/bin/bash
# 만료된 관상 분석 이미지 정리 크론잡
# 매일 새벽 3시에 실행 권장
# crontab -e 에서 아래 추가:
# 0 3 * * * /home/user/sogae/scripts/cleanup-expired.sh >> /home/user/sogae/logs/cleanup.log 2>&1

CRON_SECRET="${CRON_SECRET:-sogae-cron-2024}"
APP_URL="${APP_URL:-http://localhost:3000}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting cleanup..."

RESPONSE=$(curl -s -X POST "${APP_URL}/api/cron/cleanup" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: ${RESPONSE}"
