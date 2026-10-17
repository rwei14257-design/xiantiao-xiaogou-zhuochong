const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalize, clampBounds } = require("../src/model");
test("Corrupt settings recover safe defaults", () => {
  const actual = normalize({
    size: -1,
    auto: "false",
    topmost: null,
    action: "../file",
    position: { x: Infinity, y: 2 },
  });
  assert.equal(actual.size, 220);
  assert.equal(actual.auto, true);
  assert.equal(actual.topmost, true);
  assert.equal(actual.action, "hello");
  assert.equal(actual.position, null);
});
test("Negative-coordinate displays and out-of-range windows remain reachable", () => {
  assert.deepEqual(
    clampBounds(
      { x: -3000, y: 2000, width: 252, height: 312 },
      { x: -1920, y: 0, width: 1920, height: 1040 },
    ),
    { x: -1920, y: 728, width: 252, height: 312 },
  );
  assert.deepEqual(
    clampBounds(
      { x: 100, y: 100, width: 252, height: 312 },
      { x: 0, y: 0, width: 200, height: 200 },
    ),
    { x: 0, y: 0, width: 252, height: 312 },
  );
});
