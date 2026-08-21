Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\kev\OneDrive\Documents\myacc_project_audit.docx')
$entry = $zip.GetEntry('word/document.xml')
$reader = new-object System.IO.StreamReader($entry.Open())
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$xml = [xml]$xmlContent
$xml.SelectNodes('//*[local-name()="t"]') | ForEach-Object { $_.'#text' }
