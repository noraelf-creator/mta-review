param([switch]$Publish)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
node ./update_mta_review.cjs
if ($LASTEXITCODE -ne 0) { throw 'Site validation failed. Nothing was pushed.' }
if ($Publish) {
  git add --all
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { git commit -m 'Update MTA author review'; if ($LASTEXITCODE -ne 0) { throw 'Commit failed' } }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw 'Push failed' }
}
