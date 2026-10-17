const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports = async function test(api) {
  const results = [],
    errors = [];
  const root = path.resolve(__dirname, "../artifacts");
  fs.mkdirSync(root, { recursive: true });
  for (const name of ["smoke-error.txt", "验证结果.json"])
    fs.rmSync(path.join(root, name), { force: true });
  api.pet.webContents.on("console-message", (_e, details, message) => {
    if (details?.level === "error" || details >= 3)
      errors.push(details?.message ?? message);
  });
  await wait(600);
  assert(
    await api.pet.webContents.executeJavaScript(
      'document.querySelector("#pet").naturalWidth > 0',
    ),
  );
  assert.equal(
    await api.pet.webContents.executeJavaScript("typeof window.require"),
    "undefined",
  );
  results.push("Default artwork loads; renderer has no Node access");
  for (const a of api.snapshot().actions) {
    api.action(a.id);
    await wait(120);
    assert(
      await api.pet.webContents.executeJavaScript(
        'document.querySelector("#pet").complete && document.querySelector("#pet").naturalWidth > 0',
      ),
      a.id,
    );
  }
  results.push("All ten actions load using distributable fallback artwork");
  const sizeChecks = [];
  for (const size of [160, 300, 220]) {
    api.updateSettings({ size });
    await wait(180);
    sizeChecks.push({
      size,
      bounds: api.pet.getBounds(),
      contentSize: api.pet.getContentSize(),
    });
  }
  assert(
    sizeChecks[1].bounds.width > sizeChecks[2].bounds.width &&
      sizeChecks[2].bounds.width > sizeChecks[0].bounds.width,
  );
  api.updateSettings({ topmost: false, auto: false, bubbles: false });
  assert.equal(api.pet.isAlwaysOnTop(), false);
  assert.equal(api.snapshot().auto, false);
  api.updateSettings({ topmost: true, auto: true, bubbles: true });
  assert.equal(api.pet.isAlwaysOnTop(), true);
  results.push("Size, always-on-top and preference toggles update");
  api.hidePet();
  assert.equal(api.pet.isVisible(), false);
  api.showPet();
  assert.equal(api.pet.isVisible(), true);
  api.resetPosition();
  results.push("Hide, show, and position reset work");
  api.action("hello");
  api.openPanel();
  const panel = api.getPanel();
  panel.webContents.on("console-message", (_e, details, message) => {
    if (details?.level === "error" || details >= 3)
      errors.push(details?.message ?? message);
  });
  if (panel.webContents.isLoading())
    await new Promise((resolve) =>
      panel.webContents.once("did-finish-load", resolve),
    );
  await wait(900);
  const layout = await panel.webContents.executeJavaScript(
    `({ cards: document.querySelectorAll('.action-card').length, loaded: [...document.images].every(i => i.complete && i.naturalWidth > 0), width: innerWidth, scrollWidth: document.documentElement.scrollWidth, footer: document.querySelector('footer').getBoundingClientRect().bottom, height: innerHeight })`,
  );
  assert.equal(layout.cards, 10);
  assert.equal(layout.loaded, true);
  assert(layout.scrollWidth <= layout.width);
  assert(layout.footer <= layout.height, JSON.stringify(layout));
  await panel.webContents.executeJavaScript(
    'document.querySelector("[data-action=heart]").click()',
  );
  await wait(180);
  assert.equal(api.snapshot().action, "heart");
  await panel.webContents.executeJavaScript(
    `document.querySelector('[data-size="160"]').click()`,
  );
  await wait(180);
  assert(Math.abs(api.pet.getBounds().width - 192) <= 4);
  results.push(
    "Panel renders ten cards without overflow; action and size buttons work through IPC",
  );
  api.updateSettings({ size: 220 });
  api.action("hello");
  await wait(400);
  await fs.promises.writeFile(
    path.join(root, "小狗的小屋预览.png"),
    (await panel.webContents.capturePage()).toPNG(),
  );
  await fs.promises.writeFile(
    path.join(root, "桌宠预览.png"),
    (await api.pet.webContents.capturePage()).toPNG(),
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    path.join(root, "验证结果.json"),
    JSON.stringify(
      {
        passed: true,
        electron: process.versions.electron,
        checks: results,
        sizeChecks,
        layout,
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
};
