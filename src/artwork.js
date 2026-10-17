const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { actions } = require("./model");
const localRoot = path.resolve(__dirname, "../assets-local");
const extensions = ["gif", "png", "webp"];
function resolveArtwork(id, root = localRoot) {
  if (!actions.some((a) => a.id === id)) throw new Error("未知动作");
  for (const ext of extensions) {
    const candidate = path.join(root, `${id}.${ext}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
      return pathToFileURL(candidate).href;
  }
  return pathToFileURL(path.join(__dirname, "assets/placeholder.svg")).href;
}
function withArtwork() {
  return actions.map((a) => ({ ...a, src: resolveArtwork(a.id) }));
}
// Generated pixels, not a third-party image or character icon.
function createTrayIcon(nativeImage) {
  const size = 32,
    pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const p = (y * size + x) * 4;
      const inside = Math.hypot(x - 15.5, y - 15.5) < 14;
      const eye =
        Math.hypot(x - 10, y - 13) < 2 || Math.hypot(x - 21, y - 13) < 2;
      const smile = y >= 20 && y <= 21 && x >= 12 && x <= 19;
      pixels[p] = eye || smile ? 71 : 205;
      pixels[p + 1] = eye || smile ? 99 : 233;
      pixels[p + 2] = eye || smile ? 82 : 220;
      pixels[p + 3] = inside ? 255 : 0;
    }
  return nativeImage.createFromBitmap(pixels, {
    width: size,
    height: size,
    scaleFactor: 1,
  });
}
module.exports = { resolveArtwork, withArtwork, createTrayIcon };
