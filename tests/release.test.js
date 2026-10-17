const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { fileURLToPath } = require("node:url");
const { actions } = require("../src/model");
const { resolveArtwork } = require("../src/artwork");
const { inspect } = require("../scripts/check-release");
test("Missing external artwork uses a bundled placeholder for every action", () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "pet-art-test-"));
  try {
    for (const a of actions)
      assert.equal(
        path.basename(fileURLToPath(resolveArtwork(a.id, empty))),
        "placeholder.svg",
      );
  } finally {
    fs.rmdirSync(empty);
  }
});
test("User-supplied artwork resolves safely; path traversal is rejected", () => {
  const local = fs.mkdtempSync(path.join(os.tmpdir(), "pet-art-test-"));
  const candidate = path.join(local, "heart.gif");
  try {
    fs.writeFileSync(candidate, "test fixture");
    assert.equal(fileURLToPath(resolveArtwork("heart", local)), candidate);
    assert.throws(() => resolveArtwork("../private", local));
  } finally {
    if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
    fs.rmdirSync(local);
  }
});
test("Release inspection rejects media, bundles, and local asset folders", () => {
  for (const name of [
    "assets-local/heart.gif",
    "src/assets/puppy.png",
    "Puppy.exe",
    "app.asar",
    "demo.mp4",
  ])
    assert(inspect([name], () => Buffer.from("fixture")).length > 0);
  assert.deepEqual(
    inspect(["src/assets/placeholder.svg", "README.md", "src/main.js"], () =>
      Buffer.from("text"),
    ),
    [],
  );
});
