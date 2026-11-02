const { spawn, execFile } = require("node:child_process");
const path = require("node:path");

// Read transport state only. No titles, audio samples, microphone, or network.
const windowsProbe = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$type = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime]
$method=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\u00601' } | Select-Object -First 1
$task=$method.MakeGenericMethod($type).Invoke($null,@($type::RequestAsync()))
if (-not $task.Wait(8000)) { throw 'Media session timeout' }
$manager=$task.Result
while ($true) {
  $playing=$false
  foreach ($session in $manager.GetSessions()) {
    $info=$session.GetPlaybackInfo()
    if ($info.PlaybackStatus.ToString() -eq 'Playing' -and $info.PlaybackType -ne 'Video') { $playing=$true; break }
  }
  if ($playing) { [Console]::WriteLine('playing') } else { [Console]::WriteLine('idle') }
  Start-Sleep -Seconds 2
}
`;
const macProbe = `
var players=['com.apple.Music','com.spotify.client'], blocked=false, playing=false;
for (var id of players) {
  var player;
  try { player=Application(id); if (!player.running()) continue; } catch (_) { continue; }
  try { if(player.playerState()==='playing') {playing=true;break;} } catch (_) {blocked=true;}
}
playing?'playing':blocked?'unavailable':'idle';
`;
function watchMedia(report, platform = process.platform) {
  let stopped = false,
    child = null,
    timer = null,
    last;
  const emit = (s) => {
    if (!stopped && last !== s) {
      last = s;
      report(s);
    }
  };
  function probe() {
    if (stopped) return;
    if (platform === "darwin") {
      child = execFile(
        "/usr/bin/osascript",
        ["-l", "JavaScript", "-e", macProbe],
        { timeout: 4000 },
        (err, out) => {
          if (stopped) return;
          const s = String(out).trim();
          emit(!err && ["playing", "idle"].includes(s) ? s : "unavailable");
          timer = setTimeout(probe, last === "unavailable" ? 30000 : 3000);
        },
      );
    } else if (platform === "win32") {
      child = spawn(
        path.join(
          process.env.SystemRoot,
          "System32/WindowsPowerShell/v1.0/powershell.exe",
        ),
        ["-NoProfile", "-NonInteractive", "-Command", windowsProbe],
        { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] },
      );
      let pending = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (data) => {
        const lines = (pending + data).split(/\r?\n/);
        pending = lines.pop();
        for (const s of lines) if (s === "playing" || s === "idle") emit(s);
      });
      child.once("error", () => emit("unavailable"));
      child.once("close", () => {
        if (!stopped) {
          emit("unavailable");
          timer = setTimeout(probe, 30000);
        }
      });
    } else emit("unavailable");
  }
  probe();
  return () => {
    stopped = true;
    clearTimeout(timer);
    child?.kill();
  };
}
module.exports = { watchMedia };
