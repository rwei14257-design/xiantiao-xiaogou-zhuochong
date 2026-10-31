const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { fileURLToPath } = require("node:url");
const { resolveArtwork, withArtwork } = require("../src/artwork");

test("Invalid user artwork falls back to bundled artwork without losing valid overrides", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "happy-art-"));
  const user = path.join(root, "user"),
    bundled = path.join(root, "bundled");
  fs.mkdirSync(user);
  fs.mkdirSync(bundled);
  const gif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );
  try {
    fs.writeFileSync(path.join(bundled, "hello.gif"), gif);
    fs.writeFileSync(path.join(user, "hello.gif"), "not a gif");
    assert.equal(
      fileURLToPath(resolveArtwork("hello", [user, bundled])),
      path.join(bundled, "hello.gif"),
    );
    fs.writeFileSync(path.join(user, "hello.gif"), gif);
    assert.equal(
      fileURLToPath(resolveArtwork("hello", [user, bundled])),
      path.join(user, "hello.gif"),
    );
    fs.truncateSync(path.join(user, "hello.gif"), 16 * 1024 * 1024);
    assert.equal(
      fileURLToPath(resolveArtwork("hello", [user, bundled])),
      path.join(bundled, "hello.gif"),
    );
    fs.writeFileSync(path.join(user, "heart.gif"), "");
    fs.mkdirSync(path.join(user, "heart.png"));
    const heart = withArtwork([user, bundled]).find((a) => a.id === "heart");
    assert.equal(heart.supplied, false);
    assert(heart.src.endsWith("heart.svg"));
    assert.doesNotThrow(() =>
      resolveArtwork("hello", path.join(root, "missing")),
    );
  } finally {
    fs.rmdirSync(path.join(user, "heart.png"));
    for (const dir of [user, bundled]) {
      for (const name of fs.readdirSync(dir))
        fs.unlinkSync(path.join(dir, name));
      fs.rmdirSync(dir);
    }
    fs.rmdirSync(root);
  }
});
