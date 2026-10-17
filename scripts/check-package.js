const fs = require("node:fs");
const path = require("node:path");
const { listPackage } = require("@electron/asar");
function findArchives(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? findArchives(path.join(dir, e.name))
        : e.name === "app.asar"
          ? [path.join(dir, e.name)]
          : [],
    );
}
const archives = findArchives("dist");
if (!archives.length) throw new Error("No packaged application archive found");
for (const archive of archives) {
  const paths = listPackage(archive).map((p) => p.replaceAll("\\", "/"));
  const appIcons = new Set([
    "/src/assets/app-icon.png",
    "/src/assets/tray-icon.png",
  ]);
  const forbidden = paths.filter(
    (p) =>
      (/\.(gif|png|webp|jpg|jpeg|ico|mp4|mp3)$/i.test(p) && !appIcons.has(p)) ||
      /assets-local|pet-assets|artifacts/.test(p),
  );
  if (forbidden.length)
    throw new Error(
      `Unexpected bundled artwork in ${archive}: ${forbidden.join(", ")}`,
    );
  if (!paths.some((p) => p.endsWith("/src/schedule.js")))
    throw new Error("Missing schedule module");
  if (!paths.some((p) => p.endsWith("/NOTICE.md")))
    throw new Error("Missing rights notice");
  for (const icon of appIcons)
    if (!paths.includes(icon)) throw new Error(`Missing app icon: ${icon}`);
  console.log(
    `PASS: ${archive}, only registered app icons; no animation pack bundled.`,
  );
}
