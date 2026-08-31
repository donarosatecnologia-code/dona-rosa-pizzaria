# Deploy de migrations no Supabase remoto (Windows / PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

$Cli = Join-Path $Root "scripts\supabase-cli.ps1"

Write-Host "=== Migration status ===" -ForegroundColor Cyan
& $Cli migration list
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Applying pending migrations ===" -ForegroundColor Cyan
& $Cli db push --yes --include-all
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Regenerating TypeScript types ===" -ForegroundColor Cyan
npm run db:types
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Banco remoto sincronizado." -ForegroundColor Green
