# Wrapper Windows: usa o binário Go nativo (@supabase/cli-windows-x64), evitando Bun/npx no login.
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CliArgs
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$NativeExe = Join-Path $Root "node_modules\@supabase\cli-windows-x64\bin\supabase.exe"

if (-not (Test-Path $NativeExe)) {
  Write-Error "Binário não encontrado. Rode: npm install"
  exit 1
}

& $NativeExe @CliArgs
exit $LASTEXITCODE
