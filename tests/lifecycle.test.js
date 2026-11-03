const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");
const model = require("../src/model");
const schedule = require("../src/schedule");

function boot(ownsInstance = true) {
  const app = new EventEmitter();
  let now = new Date("2026-10-19T10:29:30").getTime();
  const messages = [],
    writes = [];
  let calculations = 0;
  Object.assign(app, {
    setName() {},
    setPath() {},
    setAppUserModelId() {},
    getPath: () => "test-profile",
    getVersion: () => "test",
    requestSingleInstanceLock: () => ownsInstance,
    quit() {},
    // Keep native startup pending; exercise the real lifecycle and tick code.
    whenReady: () => new Promise(() => {}),
  });
  const ipcMain = new EventEmitter();
  ipcMain.handle = () => {};
  const electron = { app, ipcMain };
  const context = vm.createContext({
    require(name) {
      if (name === "electron") return electron;
      if (name === "fs")
        return {
          readFileSync: () => "{}",
          mkdirSync() {},
          writeFileSync: (...args) => writes.push(args),
        };
      if (name === "path") return path;
      if (name === "./input-signals")
        return { gestures: { task: "celebrate" }, watchInput: () => () => {} };
      if (name === "./media-watch") return { watchMedia: () => () => {} };
      if (name === "./companion") return require("../src/companion");
      if (name === "./model") return model;
      if (name === "./settings")
        return { writeSettings: (...args) => writes.push(args) };
      if (name === "./artwork") return { withArtwork: () => [] };
      if (name === "./schedule")
        return {
          ...schedule,
          getActivity(...args) {
            calculations++;
            return schedule.getActivity(...args);
          },
        };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    __dirname: path.resolve(__dirname, "../src"),
    process: { argv: [], platform: "win32" },
    console,
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [now]));
      }
      static now() {
        return now;
      }
    },
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    testWindow: {
      isDestroyed: () => false,
      isVisible: () => true,
      setAlwaysOnTop() {},
      webContents: { send: (_, value) => messages.push(value) },
    },
  });
  vm.runInContext(
    fs.readFileSync(path.resolve(__dirname, "../src/main.js"), "utf8"),
    context,
  );
  return {
    app,
    messages,
    writes,
    run: (code) => vm.runInContext(code, context),
    at: (time) => {
      now = new Date(`2026-10-19T${time}`).getTime();
    },
    calculations: () => calculations,
  };
}

test("A rejected second instance never overwrites the saved profile", () => {
  const second = boot(false);
  second.app.emit("before-quit");
  assert.equal(second.writes.length, 0);
  const primary = boot();
  primary.app.emit("before-quit");
  assert.equal(primary.writes.length, 1);
});

test("An early second launch waits until the native pet window exists", () => {
  const app = boot();
  assert.doesNotThrow(() => app.app.emit("second-instance"));
  assert.equal(app.run("openOnReady"), true);
});

test("Fixed actions still refresh upcoming events; ticks reuse the current minute", () => {
  const app = boot();
  app.run("pet = testWindow; state.auto = false; tick()");
  assert.equal(app.messages.at(-1).activity.next.time, "10:30");
  const before = app.calculations();
  app.at("10:29:59");
  app.run("tick()");
  assert.equal(app.calculations(), before);
  app.at("10:30:00");
  app.run("tick()");
  assert.equal(app.messages.at(-1).activity.next.time, "10:40");
  assert.equal(app.messages.at(-1).activity.mode, "fixed");
});

test("Manual mode expires inside a minute and broadcasts one shared snapshot", () => {
  const app = boot();
  app.run("pet = testWindow; panel = testWindow; action('heart'); tick()");
  app.at("10:29:34");
  app.run("action('good', true)");
  app.at("10:29:38");
  app.run("tick()");
  assert.equal(app.messages.at(-1).activity.mode, "manual");
  app.at("10:29:39");
  app.run("tick()");
  assert.equal(app.messages.at(-1).activity.mode, "schedule");
  assert.equal(app.messages.at(-1).action, "read");
  assert.equal(app.messages.at(-1), app.messages.at(-2));
});

test("Pausing the schedule keeps the visible action instead of an old selection", () => {
  const app = boot();
  app.at("10:30:00");
  app.run("pet = testWindow; updateSettings({auto:false})");
  assert.equal(app.messages.at(-1).action, "drink");
  assert.equal(app.messages.at(-1).activity.mode, "fixed");
  app.run(
    "updateSettings({auto:true}); action('heart'); updateSettings({auto:false})",
  );
  assert.equal(app.messages.at(-1).action, "heart");
});

test("Petting a fixed pet restores its selected action after five seconds", () => {
  const app = boot();
  app.run(
    "pet=testWindow; state.auto=false; action('sleep'); action('heart',true)",
  );
  assert.equal(app.messages.at(-1).action, "heart");
  app.at("10:29:35");
  app.run("tick()");
  assert.equal(app.messages.at(-1).action, "sleep");
  assert.equal(app.messages.at(-1).activity.mode, "fixed");
});

test("Focus sessions celebrate once on time and never replay a stale celebration after sleep", () => {
  const app = boot();
  app.run("pet=testWindow;focusUntil=Date.now()+1000;tick()");
  assert.equal(app.messages.at(-1).activity.mode, "focus");
  app.at("10:29:31");
  app.run("tick()");
  assert.equal(app.messages.at(-1).action, "celebrate");
  app.run("endInteraction();focusUntil=Date.now()+1000");
  app.at("11:00:00");
  app.run("tick(true)");
  assert.equal(app.run("focusUntil"), 0);
  assert.equal(app.messages.at(-1).activity.mode, "schedule");
});
