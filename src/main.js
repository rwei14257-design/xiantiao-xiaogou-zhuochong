const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { actions, normalize, clampBounds } = require("./model");
const { withArtwork, createTrayIcon } = require("./artwork");
const artwork = withArtwork();
const artifactsPath = path.resolve(__dirname, "../artifacts");
const smoke = process.argv.includes("--smoke-test");
app.setName("小狗陪伴");
app.setPath(
  "userData",
  path.join(
    app.getPath("appData"),
    smoke ? "PuppyCompanion-Code-Smoke" : "PuppyCompanion-Code",
  ),
);
app.setAppUserModelId("local.puppy.companion.code");
const settingsPath = path.join(app.getPath("userData"), "settings.json");
let state;
try {
  state = normalize(JSON.parse(fs.readFileSync(settingsPath, "utf8")));
} catch {
  state = normalize();
}
let pet,
  panel,
  tray,
  dragTimer,
  dragOffset,
  autoTimer,
  saveTimer,
  ignoreMouse = false;
let quitting = false;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error("保存设置失败:", e.message);
    }
  }, 150);
}
function snapshot() {
  return {
    ...state,
    actions: artwork,
    visible: Boolean(pet?.isVisible()),
    version: app.getVersion(),
  };
}
function publish() {
  for (const w of [pet, panel])
    if (w && !w.isDestroyed()) w.webContents.send("state", snapshot());
}
function action(id) {
  if (!actions.some((a) => a.id === id)) return snapshot();
  state.action = id;
  publish();
  save();
  return snapshot();
}
function setMouse(ignore) {
  if (!pet || pet.isDestroyed() || dragTimer || ignoreMouse === ignore) return;
  ignoreMouse = ignore;
  pet.setIgnoreMouseEvents(ignore, { forward: true });
}
function boundsFor(position, size = state.size) {
  const area = position
    ? screen.getDisplayNearestPoint(position).workArea
    : screen.getPrimaryDisplay().workArea;
  return clampBounds(
    {
      x: position?.x ?? area.x + area.width - size - 36,
      y: position?.y ?? area.y + area.height - size - 110,
      width: size + 32,
      height: size + 92,
    },
    area,
  );
}
function resetPosition() {
  const b = boundsFor(null);
  pet.setBounds(b);
  state.position = { x: b.x, y: b.y };
  showPet();
  save();
}
function showPet() {
  pet.showInactive();
  setMouse(false);
  publish();
}
function hidePet() {
  stopDrag();
  pet.hide();
  publish();
}
function updateSettings(patch) {
  if (!patch || typeof patch !== "object") return snapshot();
  const safe = Object.fromEntries(
    ["size", "auto", "topmost", "bubbles"]
      .filter((k) => k in patch)
      .map((k) => [k, patch[k]]),
  );
  const old = state.size;
  state = normalize({ ...state, ...safe });
  if (old !== state.size) {
    const b = pet.getBounds();
    const next = boundsFor({
      x: b.x + Math.round((old - state.size) / 2),
      y: b.y + old - state.size,
    });
    pet.setBounds(next);
    state.position = { x: next.x, y: next.y };
  }
  pet.setAlwaysOnTop(state.topmost, "floating");
  publish();
  save();
  return snapshot();
}
function menu() {
  return Menu.buildFromTemplate([
    { label: "小狗陪伴 · PUPPY TIME", enabled: false },
    { label: "打开小狗的小屋", click: openPanel },
    { type: "separator" },
    {
      label: "换个心情",
      submenu: actions.map((a) => ({
        label: a.name,
        type: "radio",
        checked: state.action === a.id,
        click: () => action(a.id),
      })),
    },
    {
      label: "小狗大小",
      submenu: [
        [160, "小小只"],
        [220, "刚刚好"],
        [300, "大抱抱"],
      ].map(([size, label]) => ({
        label,
        type: "radio",
        checked: state.size === size,
        click: () => updateSettings({ size }),
      })),
    },
    {
      label: "自动换动作",
      type: "checkbox",
      checked: state.auto,
      click: (item) => updateSettings({ auto: item.checked }),
    },
    {
      label: "始终在最上面",
      type: "checkbox",
      checked: state.topmost,
      click: (item) => updateSettings({ topmost: item.checked }),
    },
    { type: "separator" },
    {
      label: pet?.isVisible() ? "暂时藏起来" : "叫小狗回来",
      click: () => (pet.isVisible() ? hidePet() : showPet()),
    },
    { label: "回到屏幕右下角", click: resetPosition },
    { type: "separator" },
    { label: "退出小狗陪伴", click: () => app.quit() },
  ]);
}
function secure(w) {
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  w.webContents.on("will-navigate", (e) => e.preventDefault());
}
function openPanel() {
  if (panel && !panel.isDestroyed()) {
    panel.show();
    panel.focus();
    return;
  }
  panel = new BrowserWindow({
    width: 860,
    height: 850,
    minWidth: 720,
    minHeight: 630,
    show: false,
    backgroundColor: "#f7f6f2",
    title: "小狗的小屋",
    autoHideMenuBar: true,
    icon: createTrayIcon(nativeImage),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  secure(panel);
  panel.loadFile(path.join(__dirname, "panel.html"));
  panel.once("ready-to-show", () => panel.show());
  panel.on("closed", () => {
    panel = null;
  });
}
function stopDrag() {
  if (!dragTimer) return;
  clearInterval(dragTimer);
  dragTimer = null;
  const b = pet.getBounds(),
    next = boundsFor({ x: b.x, y: b.y });
  pet.setBounds(next);
  state.position = { x: next.x, y: next.y };
  save();
}
function trusted(event) {
  return [pet, panel].some(
    (w) => w && !w.isDestroyed() && w.webContents === event.sender,
  );
}
ipcMain.handle("state", (e) => (trusted(e) ? snapshot() : null));
ipcMain.handle("action", (e, id) => (trusted(e) ? action(id) : null));
ipcMain.handle("settings", (e, patch) =>
  trusted(e) ? updateSettings(patch) : null,
);
ipcMain.on("panel", (e) => {
  if (trusted(e)) openPanel();
});
ipcMain.on("menu", (e) => {
  if (trusted(e)) {
    stopDrag();
    menu().popup({ window: pet });
  }
});
ipcMain.on("hide", (e) => {
  if (trusted(e)) hidePet();
});
ipcMain.on("close-panel", (e) => {
  if (trusted(e)) {
    showPet();
    panel?.close();
  }
});
ipcMain.on("mouse", (e, value) => {
  if (e.sender === pet?.webContents) setMouse(value === true);
});
ipcMain.on("drag", (e, phase) => {
  if (e.sender !== pet?.webContents) return;
  if (phase !== "start") {
    stopDrag();
    return;
  }
  stopDrag();
  setMouse(false);
  const p = screen.getCursorScreenPoint(),
    b = pet.getBounds();
  dragOffset = { x: p.x - b.x, y: p.y - b.y };
  dragTimer = setInterval(() => {
    const p = screen.getCursorScreenPoint();
    pet.setPosition(p.x - dragOffset.x, p.y - dragOffset.y, false);
  }, 16);
});
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    showPet();
    openPanel();
  });
  app
    .whenReady()
    .then(async () => {
      Menu.setApplicationMenu(null);
      pet = new BrowserWindow({
        ...boundsFor(state.position),
        show: false,
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",
        alwaysOnTop: state.topmost,
        skipTaskbar: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        hasShadow: false,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          backgroundThrottling: false,
        },
      });
      secure(pet);
      pet.setAlwaysOnTop(state.topmost, "floating");
      pet.on("blur", stopDrag);
      pet.on("close", (e) => {
        if (!quitting) {
          e.preventDefault();
          hidePet();
        }
      });
      tray = new Tray(createTrayIcon(nativeImage));
      tray.setToolTip("小狗陪伴 · 右键管理，双击打开小屋");
      tray.on("right-click", () => menu().popup());
      tray.on("double-click", () => {
        showPet();
        openPanel();
      });
      tray.on("click", showPet);
      await pet.loadFile(path.join(__dirname, "pet.html"));
      showPet();
      screen.on("display-removed", () => {
        const b = boundsFor(state.position);
        pet.setBounds(b);
        state.position = { x: b.x, y: b.y };
        save();
      });
      autoTimer = setInterval(() => {
        if (!state.auto || !pet.isVisible() || dragTimer) return;
        const hour = new Date().getHours();
        const pool =
          hour >= 23 || hour < 7
            ? ["sleep", "read"]
            : ["hello", "read", "drink", "good", "jump"];
        const choices = pool.filter((id) => id !== state.action);
        action(choices[Math.floor(Math.random() * choices.length)]);
      }, 45000);
      if (smoke) {
        try {
          await require("./smoke-test")({
            pet,
            openPanel,
            getPanel: () => panel,
            action,
            updateSettings,
            hidePet,
            showPet,
            resetPosition,
            snapshot,
          });
        } catch (e) {
          fs.mkdirSync(artifactsPath, { recursive: true });
          fs.writeFileSync(
            path.join(artifactsPath, "smoke-error.txt"),
            e.stack,
          );
          process.exitCode = 1;
        }
        app.quit();
      }
    })
    .catch((e) => {
      console.error(e);
      app.exit(1);
    });
}
app.on("window-all-closed", () => {});
app.on("before-quit", () => {
  quitting = true;
  clearInterval(autoTimer);
  clearInterval(dragTimer);
  clearTimeout(saveTimer);
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(state, null, 2));
  } catch {}
  tray?.destroy();
});
