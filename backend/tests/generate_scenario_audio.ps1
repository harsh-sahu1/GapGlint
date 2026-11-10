$voice = New-Object -ComObject SAPI.SpVoice

function MakeWav($filename, $text) {
    $stream = New-Object -ComObject SAPI.SpFileStream
    $wavPath = Join-Path $PSScriptRoot $filename
    $stream.Open($wavPath, 3, $false)
    $voice.AudioOutputStream = $stream
    $voice.Speak($text)
    $stream.Close()
    Write-Host "Created: $wavPath"
}

MakeWav "resident_interview.wav" "As a local resident living along Highway 48, I can confirm that construction is significantly delayed. No work has happened for two months and the road is completely blocked."
MakeWav "official_interview.wav" "I am the project engineer for Highway 48. Although the directive specified December 2026, due to monsoon damage and supply issues, project completion may extend to March 2027."
MakeWav "hinglish_interview.wav" "Road construction project ka kaam bahut slow chal raha hai, and deadline extend hone ke chances hain."

Write-Host "All synthetic scenario audio generated successfully."

