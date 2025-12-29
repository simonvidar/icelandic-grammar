$chunkSize = 5000
$root = (Get-Location).Path
$input = Join-Path $root "output.csv"
$outDir = Join-Path $root "assets\data\chunks"

Remove-Item $outDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $outDir | Out-Null

$lines = [System.IO.File]::ReadAllLines($input, [System.Text.Encoding]::UTF8)
$lines = $lines | Sort-Object { Get-Random }

$chunkIndex = 0

for ($i = 0; $i -lt $lines.Length; $i += $chunkSize) {

    $end = [Math]::Min($i + $chunkSize - 1, $lines.Length - 1)
    $chunk = $lines[$i..$end]

    $rows = foreach ($line in $chunk) {
        $p = $line -split ';'
        '["{0}","{1}"]' -f $p[0], $p[1]
    }

    $json = "[`n" + ($rows -join ",`n") + "`n]"
    $file = Join-Path $outDir ("chunk_{0:D3}.json" -f $chunkIndex)

    [System.IO.File]::WriteAllText(
        $file,
        $json,
        [System.Text.UTF8Encoding]::new($false)
    )

    $chunkIndex++
}

"Created $chunkIndex chunks"