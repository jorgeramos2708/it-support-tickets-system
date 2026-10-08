$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$projRoot = Split-Path $scriptDir -Parent

# 1) Cargar credenciales (TOKEN separado, no en el repo/zip)
. (Join-Path $scriptDir '.respaldo.env.ps1')

# 2) Ejecutar el respaldo pg_dump (node usa el cwd del proyecto)
$logDir = Join-Path $projRoot 'respaldos\logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$logFile = Join-Path $logDir ("respaldo_" + (Get-Date -Format 'yyyyMMdd_HHmm') + ".log")

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando respaldo pg_dump..."
Push-Location $projRoot
try {
  node (Join-Path $scriptDir 'backup-pgdump.mjs') 2>&1 | Tee-Object -FilePath $logFile
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo el respaldo (exit $LASTEXITCODE). Log: $logFile"
    exit 1
  }
} finally {
  Pop-Location
}

# 3) Limpiar respaldos con mas de 7 dias
$cutoff = (Get-Date).AddDays(-7)
$removed = @()
$sqlFiles = Get-ChildItem (Join-Path $projRoot 'respaldos\pg_dump') -Filter '*.sql' -ErrorAction SilentlyContinue
foreach ($f in $sqlFiles) {
  if ($f.LastWriteTime -lt $cutoff) {
    Remove-Item -LiteralPath $f.FullName -Force
    $removed += $f.Name
  }
}
$jsonDirs = Get-ChildItem (Join-Path $projRoot 'respaldos\backup_*') -Directory -ErrorAction SilentlyContinue
foreach ($d in $jsonDirs) {
  if ($d.LastWriteTime -lt $cutoff) {
    Remove-Item -LiteralPath $d.FullName -Recurse -Force
    $removed += $d.Name
  }
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Respaldo OK."
if ($removed.Count) {
  Write-Host "  Borrados (>7 dias): $($removed -join ', ')"
  Add-Content -LiteralPath $logFile -Value "Borrados de mas de 7 dias: $($removed -join ', ')"
} else {
  Add-Content -LiteralPath $logFile -Value "Nada que borrar (nada supera 7 dias)."
}