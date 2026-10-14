$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$secretFile = Join-Path $projectRoot '.dev.vars'
if (Test-Path -LiteralPath $secretFile) { throw 'Ya existe .dev.vars. Revísalo localmente; no se sobrescribe.' }
$secret = Read-Host 'Clave NUEVA de DeepSeek (entrada oculta, no se enviará al chat)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($plain -notmatch '^sk-[A-Za-z0-9_-]{16,}$') { throw 'Formato de clave no admitido.' }
  [IO.File]::WriteAllText($secretFile, 'DEEPSEEK_API_KEY="' + $plain + '"' + [Environment]::NewLine)
  $acl = Get-Acl -LiteralPath $secretFile
  $acl.SetAccessRuleProtection($true, $false)
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
  $acl.SetAccessRule([Security.AccessControl.FileSystemAccessRule]::new($identity, 'FullControl', 'Allow'))
  Set-Acl -LiteralPath $secretFile -AclObject $acl
  'clave_local_configurada=ok (no se ha probado ni consumido la API)'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $plain = $null
}
