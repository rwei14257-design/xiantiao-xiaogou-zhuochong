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
  assert.equal(
    await api.pet.webContents.executeJavaScript(
      'document.querySelector("button") === null && document.body.innerText.trim() === ""',
    ),
    true,
  );
  results.push("All twelve state images load without dialogue");
  api.updateSettings({ auto: false });
  api.action("sleep");
  await api.pet.webContents.executeJavaScript(
    'document.querySelector("#pet").dispatchEvent(new KeyboardEvent("keydown",{key:" "}))',
  );
  await wait(100);
  const reaction = api.snapshot().activity;
  assert.equal(reaction.mode, "manual");
  assert.equal(reaction.action, "heart");
  await wait(Math.max(0, reaction.until - Date.now()) + 150);
  assert.equal(
    await api.pet.webContents.executeJavaScript(
      'document.querySelector("#pet").alt',
    ),
    "呼呼大睡",
  );
  api.updateSettings({ auto: true });
  await api.pet.webContents.executeJavaScript(
    "window.puppy.resize(237);window.puppy.gesture('undo')",
  );
  await wait(160);
  assert.equal(api.snapshot().size, 237);
  assert.equal(api.snapshot().activity.gesture, "undo");
  assert(
    await api.pet.webContents.executeJavaScript(
      'document.querySelector("#pet").naturalWidth>0',
    ),
  );
  results.push(
    "Continuous sizing and gesture playback work through the desktop window",
  );
  results.push(
    "Click reaction expires and the pet window displays its fixed action again",
  );
  const hitAreas = await api.pet.webContents.executeJavaScript(`(async () => {
    const image = document.querySelector('#pet');
    const oldSource = image.src;
    image.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="black"/></svg>');
    await image.decode();
    sampleHitArea();
    const r = image.getBoundingClientRect();
    const at = (x,y) => opaqueAt({clientX:r.left+r.width*x,clientY:r.top+r.height*y});
    const result = { top: at(.5,.1), middle: at(.5,.5), bottom: at(.5,.9) };
    image.src = oldSource;
    await image.decode();
    sampleHitArea();
    return result;
  })()`);
  assert.deepEqual(hitAreas, { top: false, middle: true, bottom: false });
  results.push("Wide images preserve click-through in letterbox margins");
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
  api.updateSettings({ topmost: false, auto: false });
  assert.equal(api.pet.isAlwaysOnTop(), false);
  assert.equal(api.snapshot().auto, false);
  api.updateSettings({ topmost: true, auto: true });
  for (let n = 0; n < 20 && !api.pet.isAlwaysOnTop(); n++) await wait(50);
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
    `({ cards: document.querySelectorAll('.action-card').length, loaded: [...document.images].every(i => i.complete && i.naturalWidth > 0), width: innerWidth, scrollWidth: document.documentElement.scrollWidth, footer: document.querySelector('footer').getBoundingClientRect().bottom, height: innerHeight, scrollHeight: document.documentElement.scrollHeight })`,
  );
  assert.equal(layout.cards, 12);
  assert.equal(layout.loaded, true);
  assert(layout.scrollWidth <= layout.width);
  assert(layout.footer <= layout.scrollHeight + 1, JSON.stringify(layout));
  await panel.webContents.executeJavaScript(
    'window.originalTimelineStop = document.querySelector(".timeline-stop")',
  );
  await panel.webContents.executeJavaScript(
    'document.querySelector("[data-action=heart]").click()',
  );
  await wait(180);
  assert.equal(api.snapshot().action, "heart");
  assert.equal(
    await panel.webContents.executeJavaScript(
      'window.originalTimelineStop === document.querySelector(".timeline-stop")',
    ),
    true,
  );
  await panel.webContents.executeJavaScript(
    `document.querySelector('[data-size="160"]').click()`,
  );
  await wait(180);
  assert(Math.abs(api.pet.getBounds().width - 192) <= 4);
  results.push(
    "Panel renders twelve cards with vertical scrolling and no horizontal overflow; action and size buttons work through IPC",
  );
  await panel.webContents.executeJavaScript(
    `document.querySelector('input[name="lunch"]').value='12:35'; document.querySelector('#times-form').requestSubmit();`,
  );
  await wait(150);
  assert.equal(api.snapshot().times.lunch, "12:35");
  await panel.webContents.executeJavaScript(
    `document.querySelector('#resume').click()`,
  );
  await wait(150);
  assert.equal(api.snapshot().activity.mode, "schedule");
  await panel.webContents.executeJavaScript(
    'document.querySelector("#focus").click()',
  );
  await wait(180);
  assert.equal(api.snapshot().activity.mode, "focus");
  await panel.webContents.executeJavaScript(
    'document.querySelector("#surprise").click()',
  );
  await wait(180);
  assert.ok(api.snapshot().activity.effect);
  assert.equal(
    await api.pet.webContents.executeJavaScript(
      'document.querySelector("#stage").dataset.effect',
    ),
    api.snapshot().activity.effect,
  );
  await panel.webContents.executeJavaScript(
    'document.querySelector("#focus").click()',
  );
  await wait(180);
  assert.equal(api.snapshot().focusUntil, 0);
  results.push(
    "Focus start/stop and surprise particle reactions work through IPC",
  );
  api.updateSettings({ times: require("./schedule").DEFAULT_TIMES });
  results.push(
    "Custom schedule form saves and resume button returns to current local-time state",
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
  if (process.argv.includes("--capture-guide")) {
    const client = panel.webContents.debugger;
    client.attach();
    try {
      await client.sendCommand("Emulation.setDeviceMetricsOverride", {
        width: 1000,
        height: 2200,
        deviceScaleFactor: 1.5,
        mobile: false,
      });
      await wait(250);
      const rect = await panel.webContents.executeJavaScript(
        '(()=>{const r=document.querySelector(".moods").getBoundingClientRect();return {x:r.left,y:r.top+scrollY,width:r.width,height:r.height}})()',
      );
      for (const [name, clip] of [
        ["home", { x: 0, y: 0, width: 1000, height: Math.floor(rect.y) }],
        ["states", rect],
      ]) {
        const shot = await client.sendCommand("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { ...clip, scale: 1 },
        });
        fs.writeFileSync(
          path.join(root, "preview-" + name + ".png"),
          Buffer.from(shot.data, "base64"),
        );
      }
    } finally {
      client.detach();
    }
  }
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
