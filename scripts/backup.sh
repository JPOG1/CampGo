#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/campgo"
DB_NAME="${DB_NAME:-campgo}"
DB_USER="${DB_USER:-campgo}"
DB_HOST="${DB_HOST:-localhost}"

mkdir -p "$BACKUP_DIR"

pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

gzip "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

find "$BACKUP_DIR" -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump.gz"
