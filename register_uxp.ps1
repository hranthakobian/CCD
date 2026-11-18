$ErrorActionPreference = "Stop"

$infoPath = Join-Path $env:APPDATA "Adobe\UXP\PluginsInfo\v1\ID.json"
$extPath = Join-Path $env:APPDATA "Adobe\UXP\Plugins\External\com.calendar.generator"

$dir = Split-Path $infoPath -Parent
if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$plugins = @()
if (Test-Path $infoPath) {
    try {
        $raw = Get-Content -Path $infoPath -Raw -Encoding UTF8
        $obj = $raw | ConvertFrom-Json
        if ($obj -and $obj.plugins) {
            foreach ($p in $obj.plugins) {
                if ($p.pluginId -ne "com.calendar.generator") {
                    $plugins += $p
                }
            }
        }
    } catch {
        $plugins = @()
    }
}

$newEntry = [PSCustomObject]@{
    versionString  = "1.3.0"
    type           = "UXP"
    hostMinVersion = "18.5.0"
    pluginId       = "com.calendar.generator"
    name           = "Օրացույցի Ստեղծիչ"
    versionId      = "00000000-0000-0000-0000-000000000002"
    versionUuid    = "00000000-0000-0000-0000-000000000002"
    path           = $extPath
    status         = "enabled"
    host           = "ID"
}

$plugins += $newEntry
$resultObj = [PSCustomObject]@{
    plugins = @($plugins)
}

$json = $resultObj | ConvertTo-Json -Depth 6
# IMPORTANT: Write with UTF-8 BOM ($true) so InDesign 21.x upic triggers the External plugins folder loader
$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($infoPath, $json, $utf8WithBom)
