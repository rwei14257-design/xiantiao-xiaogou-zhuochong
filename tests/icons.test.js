const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function dimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
test("Windows and macOS icon containers have valid bounds and required image resolutions", () => {
  const ico = fs.readFileSync(path.join(root, "resources/icons/icon.ico"));
  assert.equal(ico.readUInt16LE(2), 1);
  const sizes = [];
  for (let n = 0; n < ico.readUInt16LE(4); n++) {
    const p = 6 + n * 16,
      size = ico[p] || 256,
      length = ico.readUInt32LE(p + 8),
      start = ico.readUInt32LE(p + 12);
    assert(
      start >= 6 + ico.readUInt16LE(4) * 16 && start + length <= ico.length,
    );
    assert.deepEqual(dimensions(ico.subarray(start, start + length)), [
      size,
      size,
    ]);
    sizes.push(size);
  }
  for (const size of [16, 32, 48, 256]) assert(sizes.includes(size));
  const icns = fs.readFileSync(path.join(root, "resources/icons/icon.icns"));
  assert.equal(icns.subarray(0, 4).toString(), "icns");
  assert.equal(icns.readUInt32BE(4), icns.length);
  const entries = new Map();
  let offset = 8;
  while (offset < icns.length) {
    const name = icns.subarray(offset, offset + 4).toString(),
      length = icns.readUInt32BE(offset + 4);
    assert(length > 8 && offset + length <= icns.length);
    entries.set(name, dimensions(icns.subarray(offset + 8, offset + length)));
    offset += length;
  }
  assert.equal(offset, icns.length);
  assert.deepEqual(entries.get("ic09"), [512, 512]);
  assert.deepEqual(entries.get("ic10"), [1024, 1024]);
  for (const [file, size] of [
    ["app-icon.png", 256],
    ["tray-icon.png", 32],
  ])
    assert.deepEqual(
      dimensions(fs.readFileSync(path.join(root, "src/assets", file))),
      [size, size],
    );
});
