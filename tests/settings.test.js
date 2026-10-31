const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const { writeSettings } = require("../src/settings");

for (const failure of [null, "write", "rename"]) {
  test(`Settings replacement preserves valid JSON (${failure || "success"})`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "happy-settings-"));
    const file = path.join(root, "settings.json");
    const original = '{"size":160,"auto":true}';
    fs.writeFileSync(file, original);
    try {
      if (!failure) {
        writeSettings(file, { size: 300, auto: false });
        assert.deepEqual(JSON.parse(fs.readFileSync(file)), {
          size: 300,
          auto: false,
        });
      } else {
        const error = new Error("Simulated disk failure");
        const fakeFs = { ...fs };
        if (failure === "write")
          fakeFs.writeFileSync = (target) => {
            fs.writeFileSync(target, '{"size":');
            throw error;
          };
        else
          fakeFs.renameSync = () => {
            throw error;
          };
        const sandbox = {
          module: { exports: {} },
          require: (name) => (name === "node:fs" ? fakeFs : require(name)),
        };
        vm.runInNewContext(
          fs.readFileSync(path.join(__dirname, "../src/settings.js"), "utf8"),
          sandbox,
        );
        assert.throws(
          () => sandbox.module.exports.writeSettings(file, { size: 300 }),
          (e) => e === error,
        );
        assert.equal(fs.readFileSync(file, "utf8"), original);
      }
      assert.equal(fs.existsSync(file + ".tmp"), false);
    } finally {
      fs.rmSync(file + ".tmp", { force: true });
      fs.unlinkSync(file);
      fs.rmdirSync(root);
    }
  });
}
