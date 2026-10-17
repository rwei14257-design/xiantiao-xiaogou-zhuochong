const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importArtwork, resolveArtwork } = require("../src/artwork");
test("Import maps legacy names, rejects disguised files, and replaces old formats", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pet-import-"));
  const source = path.join(root, "source"),
    target = path.join(root, "target");
  fs.mkdirSync(source);
  fs.mkdirSync(target);
  try {
    const gif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64",
    );
    fs.writeFileSync(path.join(source, "turn on.gif"), gif);
    fs.writeFileSync(
      path.join(source, "heart.gif"),
      "<script>invalid</script>",
    );
    fs.writeFileSync(path.join(target, "hello.png"), "previous format");
    const result = importArtwork(source, target);
    assert.deepEqual(result.imported, ["hello"]);
    assert.deepEqual(result.skipped, ["heart.gif"]);
    assert(fs.readFileSync(path.join(target, "hello.gif")).equals(gif));
    assert(!fs.existsSync(path.join(target, "hello.png")));
    assert(resolveArtwork("hello", target).endsWith("/hello.gif"));
    assert.equal(importArtwork(target, target).unchanged, true);
  } finally {
    for (const folder of [source, target]) {
      for (const name of fs.readdirSync(folder))
        fs.unlinkSync(path.join(folder, name));
      fs.rmdirSync(folder);
    }
    fs.rmdirSync(root);
  }
});
