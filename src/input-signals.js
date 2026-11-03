const fs = require("fs"),
  path = require("path"),
  { spawn } = require("child_process");
const gestures = {
  save: "good",
  send: "heart",
  delete: "good",
  undo: "hello",
  scroll: "jump",
  task: "celebrate",
};
function watchInput(onGesture, onStatus) {
  const name = process.platform === "win32" ? "happy-input.exe" : "happy-input";
  const files = [
    path.join(process.resourcesPath, "inputs", name),
    path.join(__dirname, "../build-input", name),
  ];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) {
    onStatus("unavailable");
    return () => {};
  }
  const child = spawn(file, [String(process.pid)], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  });
  let closed = false,
    buf = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (s) => {
    if (closed) return;
    const lines = (buf + s).split(/\r?\n/);
    buf = lines.pop();
    for (const line of lines) {
      if (line === "ready") onStatus("ready");
      else if (Object.hasOwn(gestures, line) && line !== "task")
        onGesture(line);
    }
  });
  const failed = () => {
    if (!closed) onStatus("unavailable");
  };
  child.on("error", failed);
  child.on("close", failed);
  return () => {
    closed = true;
    child.kill();
  };
}
module.exports = { gestures, watchInput };
