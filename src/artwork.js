const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { actions } = require("./model");
const localRoot = path.resolve(__dirname, "../assets-local");
const extensions = ["gif", "png", "webp"];
const ALIASES = {
  hello: ["turn on"],
  dance: ["music-dance"],
  eat: ["mealtime"],
  read: ["morning-reading"],
  drink: ["morning-drink"],
  offwork: ["after-work"],
  sleepy: ["sleepy2"],
  celebrate: ["special"],
};
function resolveArtwork(id, root = localRoot) {
  if (!actions.some((a) => a.id === id)) throw new Error("未知动作");
  for (const directory of Array.isArray(root) ? root : [root]) {
    for (const ext of extensions) {
      const candidate = path.join(directory, `${id}.${ext}`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return pathToFileURL(candidate).href;
    }
  }
  const illustration = path.join(__dirname, "assets/states", `${id}.svg`);
  return pathToFileURL(
    fs.existsSync(illustration)
      ? illustration
      : path.join(__dirname, "assets/placeholder.svg"),
  ).href;
}
function withArtwork(roots) {
  return actions.map((a) => {
    const src = resolveArtwork(a.id, roots);
    return { ...a, src, supplied: !src.endsWith(".svg") };
  });
}
function isImage(bytes, ext) {
  return ext === "gif"
    ? ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))
    : ext === "png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : ext === "webp" &&
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP";
}
function importArtwork(source, destination) {
  if (path.resolve(source) === path.resolve(destination))
    return { imported: [], skipped: [], unchanged: true };
  const plan = [],
    skipped = [];
  for (const action of actions) {
    let found = false;
    for (const name of [action.id, ...(ALIASES[action.id] || [])]) {
      for (const ext of extensions) {
        const candidate = path.join(source, `${name}.${ext}`);
        if (!fs.existsSync(candidate)) continue;
        const stat = fs.lstatSync(candidate);
        if (!stat.isFile() || stat.size > 15 * 1024 * 1024) {
          skipped.push(`${name}.${ext}`);
          continue;
        }
        const bytes = fs.readFileSync(candidate);
        if (!isImage(bytes, ext)) {
          skipped.push(`${name}.${ext}`);
          continue;
        }
        plan.push({ id: action.id, ext, bytes });
        found = true;
        break;
      }
      if (found) break;
    }
  }
  fs.mkdirSync(destination, { recursive: true });
  for (const item of plan) {
    const target = path.join(destination, `${item.id}.${item.ext}`);
    fs.writeFileSync(target + ".tmp", item.bytes);
    try {
      fs.renameSync(target + ".tmp", target);
    } catch (error) {
      if (error.code !== "EXDEV") throw error;
      // Some encrypted or redirected Windows folders cannot rename atomically.
      fs.copyFileSync(target + ".tmp", target);
      fs.unlinkSync(target + ".tmp");
    }
    for (const ext of extensions)
      if (ext !== item.ext)
        fs.rmSync(path.join(destination, `${item.id}.${ext}`), { force: true });
  }
  return { imported: plan.map((p) => p.id), skipped, unchanged: false };
}
// App identity artwork is registered separately from user-provided animation assets.
function createAppIcon(nativeImage) {
  return nativeImage.createFromPath(
    path.join(__dirname, "assets/app-icon.png"),
  );
}
function createTrayIcon(nativeImage) {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "assets/tray-icon.png"),
  );
  const size = process.platform === "darwin" ? 18 : 32;
  return icon.resize({ width: size, height: size });
}
module.exports = {
  resolveArtwork,
  withArtwork,
  createTrayIcon,
  createAppIcon,
  importArtwork,
  isImage,
  ALIASES,
};
