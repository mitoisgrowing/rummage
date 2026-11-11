// shots.js — plugin artwork capture engine (Windows)
// Own implementation: enumerates real windows, captures them with PrintWindow,
// falls back to a screen grab when the app draws with a GPU surface.
// No third-party binaries, no shell hacks: one PowerShell host + Win32 calls.
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PS = 'powershell.exe';

// Shared C# surface, compiled inside the PowerShell host on every call.
const TYPES = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class RW {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassNameW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  public struct RECT { public int Left, Top, Right, Bottom; }
}
'@
`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function run(script, timeout = 30000) {
  const b64 = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise((resolve, reject) => {
    execFile(PS, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', b64],
      { timeout, windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err && !String(stdout).trim()) return reject(Object.assign(err, { stderr }));
        resolve(String(stdout || '').trim());
      });
  });
}

// All visible top-level windows, with owner process, title, class and rect.
async function listWindows(timeout = 20000) {
  const script = TYPES + `
$script:res = New-Object System.Collections.ArrayList
$cb = [RW+EnumProc]{
  param($h,$l)
  if ([RW]::IsWindowVisible($h) -and -not [RW]::IsIconic($h)) {
    $sb = New-Object System.Text.StringBuilder 512
    [RW]::GetWindowTextW($h,$sb,512) | Out-Null
    $cb2 = New-Object System.Text.StringBuilder 256
    [RW]::GetClassNameW($h,$cb2,256) | Out-Null
    $wpid = 0
    [RW]::GetWindowThreadProcessId($h,[ref]$wpid) | Out-Null
    $r = New-Object RW+RECT
    [RW]::GetWindowRect($h,[ref]$r) | Out-Null
    $null = $script:res.Add([pscustomobject]@{
      h=$h.ToInt64(); pid=[int]$wpid; title=$sb.ToString(); cls=$cb2.ToString();
      x=$r.Left; y=$r.Top; w=($r.Right-$r.Left); hh=($r.Bottom-$r.Top)
    })
  }
  return $true
}
[RW]::EnumWindows($cb,[IntPtr]::Zero) | Out-Null
ConvertTo-Json -InputObject @($script:res) -Compress -Depth 3
`;
  const out = await run(script, timeout);
  if (!out) return [];
  try {
    const j = JSON.parse(out);
    return (Array.isArray(j) ? j : [j]).filter(Boolean);
  } catch { return []; }
}

// Captures one window to a PNG. Returns { ok, width, height, method }.
// PrintWindow first (works for GDI/UiKit editors); if the result is blank,
// brings the window forward and grabs the screen region instead.
async function captureWindow(handle, outPng, timeout = 30000) {
  const script = TYPES + `
$h = [IntPtr]::new(${Number(handle)})
$out = '${String(outPng).replace(/'/g, "''")}'
$r = New-Object RW+RECT
[RW]::GetWindowRect($h,[ref]$r) | Out-Null
$w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
if ($w -lt 40 -or $ht -lt 40) { '{"ok":false,"reason":"tiny"}'; exit }
$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
$ok = [RW]::PrintWindow($h, $hdc, 2)
$g.ReleaseHdc($hdc); $g.Dispose()
# blank detection: count distinct sampled colours
$seen = New-Object 'System.Collections.Generic.HashSet[int]'
for ($y = 0; $y -lt $ht; $y += [Math]::Max(1,[int]($ht/24))) {
  for ($x = 0; $x -lt $w; $x += [Math]::Max(1,[int]($w/24))) {
    $null = $seen.Add($bmp.GetPixel($x,$y).ToArgb())
  }
}
$distinct = $seen.Count
$method = 'printwindow'
if (-not $ok -or $distinct -lt 6) {
  $bmp.Dispose()
  [RW]::ShowWindow($h, 9) | Out-Null
  [RW]::SetForegroundWindow($h) | Out-Null
  Start-Sleep -Milliseconds 320
  [RW]::GetWindowRect($h,[ref]$r) | Out-Null
  $w = $r.Right - $r.Left; $ht = $r.Bottom - $r.Top
  $bmp = New-Object System.Drawing.Bitmap $w, $ht
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $ht))
  $g.Dispose()
  $method = 'screen'
}
$dir = Split-Path -Parent $out
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
'{"ok":true,"width":' + $w + ',"height":' + $ht + ',"method":"' + $method + '"}'
`;
  const out = await run(script, timeout);
  try { return JSON.parse(out.split('\n').pop()); } catch { return { ok: false, reason: 'parse' }; }
}

// Politely closes an editor window (WM_CLOSE).
async function closeWindow(handle, timeout = 8000) {
  await run(TYPES + `[RW]::PostMessage([IntPtr]::new(${Number(handle)}), 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null; 'ok'`, timeout);
}

// Sends one keystroke chord to the foreground window through SendKeys.
async function sendKeys(keys, timeout = 15000) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -Milliseconds 120
[System.Windows.Forms.SendKeys]::SendWait(${JSON.stringify(keys).replace(/^"|"$/g, "'")})
'ok'`;
  await run(script, timeout);
}

// Host chrome: FL's VCL dialogs and Live's frame windows look like ordinary
// top-level windows, so they have to be told apart from real plugin editors.
const HOSTCHROME = /^(TFruity|TMIDI|TForm|TPanel|TApplication|TMessage|TAbout|Progman|WorkerW|Shell_TrayWnd|ApplicationFrameWindow|Windows\.UI|Chrome_|CEF-|HwndWrapper\[.*(Live|FL)|Ableton|LiveWindow|Msgr|Dwm|IME)/i;
const isHostChrome = w => HOSTCHROME.test(String(w.cls || ''));
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const titleMatch = (w, want) => {
  const a = norm(w.title), b = norm(want);
  if (!a || !b) return false;
  return a.includes(b.slice(0, Math.min(b.length, 10))) || b.includes(a.slice(0, Math.min(a.length, 10)));
};

// Waits for a window that appeared after `sinceMs`, owned by one of `pids`,
// at least minW x minH, not in `exclude`, and not part of the host's own UI.
async function waitForPluginWindow({ pids = [], exclude = [], sinceMs = Date.now(), minW = 180, minH = 120, timeout = 15000, match = '' } = {}) {
  const deadline = Date.now() + timeout;
  const seen = new Set(exclude);
  const allow = new Set(pids.map(Number).filter(Boolean));
  let fallback = null;
  while (Date.now() < deadline) {
    const ws = await listWindows(8000);
    const cand = ws.filter(w => {
      if (seen.has(w.h)) return false;
      if (allow.size && !allow.has(Number(w.pid))) return false;
      if (w.w < minW || w.hh < minH) return false;
      if (isHostChrome(w)) return false;
      return true;
    });
    const named = match ? cand.find(w => titleMatch(w, match)) : null;
    if (named) return named;
    if (!fallback && cand.length) fallback = cand[0];
    await sleep(350);
  }
  return fallback;
}

// Picks the newest plausible plugin-editor window right now (manual snap).
async function newestPluginWindow({ pids = [], exclude = [], minW = 180, minH = 120, match = '' } = {}) {
  const ws = await listWindows(8000);
  const allow = new Set(pids.map(Number).filter(Boolean));
  const skip = new Set(exclude);
  const cand = ws.filter(w => !skip.has(w.h) && !isHostChrome(w) && w.w >= minW && w.hh >= minH && (!allow.size || allow.has(Number(w.pid))));
  const named = match ? cand.find(w => titleMatch(w, match)) : null;
  if (named) return named;
  cand.sort((a, b) => (a.w * a.hh) - (b.w * b.hh));
  return cand.length ? cand[0] : null;
}

// Which Windows processes are running, so we can scope windows to the host DAW.
async function pidsFor(names) {
  const script = `Get-Process -ErrorAction SilentlyContinue | Where-Object { ${names.map(n => `$_.ProcessName -like '${n}'`).join(' -or ') || '$false'} } | Select-Object -ExpandProperty Id | ConvertTo-Json -Compress`;
  const out = await run(script, 12000);
  try { const j = JSON.parse(out); return (Array.isArray(j) ? j : [j]).map(Number); } catch { return []; }
}

module.exports = { listWindows, captureWindow, closeWindow, sendKeys, waitForPluginWindow, newestPluginWindow, pidsFor, run, TYPES, sleep };

// `node shots.js list` prints the live window list: used to verify the engine.
if (require.main === module) {
  const cmd = process.argv[2] || 'list';
  (async () => {
    if (cmd === 'list') {
      const ws = await listWindows();
      console.log(JSON.stringify(ws.slice(0, 60), null, 1));
    } else if (cmd === 'pids') {
      console.log(await pidsFor(process.argv.slice(3)));
    } else if (cmd === 'cap') {
      console.log(await captureWindow(Number(process.argv[3]), path.join(os.tmpdir(), 'rw-cap.png')));
    }
  })().catch(e => { console.error(e.message); process.exit(1); });
}
