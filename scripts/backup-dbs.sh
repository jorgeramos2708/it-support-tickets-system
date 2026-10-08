#!/bin/sh
# Respaldos periódicos de las 7 bases de datos TickITFlow.
# Corre en el sidecar db-backup: pg_dump | gzip a /backups con rotación.
# Restaurar: gunzip -c <base>-<ts>.sql.gz | psql -h <host> -U tickit -d <base>
set -eu

DBS="auth:auth-db incidents:incidents-db problems:problems-db changes:changes-db cmdb:cmdb-db kb:kb-db notifications:notifications-db"
INTERVAL_H="${BACKUP_INTERVAL_HOURS:-6}"
RETENTION="${BACKUP_RETENTION:-4}"

while true; do
  ts="$(date +%Y%m%d-%H%M%S)"
  ok="0"
  for pair in $DBS; do
    db="${pair%%:*}"
    host="${pair##*:}"
    tmp="/backups/.tmp-${db}-${ts}.sql"
    echo "[backup] $db ($host)…"
    # pg_dump a archivo temporal: si falla, no deja un .gz vacío contando como OK
    if pg_dump -h "$host" -U tickit -d "$db" > "$tmp"; then
      gzip -c "$tmp" > "/backups/${db}-${ts}.sql.gz"
      rm -f "$tmp"
      echo "[backup] $db OK"
      ok="$((ok + 1))"
    else
      rm -f "$tmp"
      echo "[backup] $db FALLÓ"
    fi
  done
  echo "[backup] ciclo completo: $ok/7 bases respaldadas"

  # Rotación: conservar los últimos RETENTION respaldos por base
  for pair in $DBS; do
    db="${pair%%:*}"
    ls -1t "/backups/${db}-"*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | while IFS= read -r f; do
      rm -f "$f"
    done
  done

  echo "[backup] siguiente ciclo en ${INTERVAL_H} h"
  sleep "$((INTERVAL_H * 3600))"
done
