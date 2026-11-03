const fs = require("fs"),
  path = require("path"),
  cp = require("child_process");
const out = path.resolve("build-input");
fs.mkdirSync(out, { recursive: true });
if (process.platform === "win32") {
  const csc = path.join(
    process.env.SystemRoot,
    "Microsoft.NET",
    "Framework64",
    "v4.0.30319",
    "csc.exe",
  );
  cp.execFileSync(
    csc,
    [
      "/nologo",
      "/optimize+",
      "/out:" + path.join(out, "happy-input.exe"),
      path.resolve("native/InputSignals.cs"),
    ],
    { stdio: "inherit" },
  );
} else if (process.platform === "darwin") {
  cp.execFileSync(
    "xcrun",
    [
      "swiftc",
      "-O",
      "native/InputSignals.swift",
      "-o",
      path.join(out, "happy-input"),
    ],
    { stdio: "inherit" },
  );
} else throw Error("Windows or macOS is required");
