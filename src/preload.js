const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("puppy", {
  surprise: () => ipcRenderer.invoke("surprise"),
  toggleFocus: () => ipcRenderer.invoke("toggle-focus"),
  getState: () => ipcRenderer.invoke("state"),
  react: (id) => ipcRenderer.invoke("action", id, true),
  action: (id) => ipcRenderer.invoke("action", id),
  settings: (patch) => ipcRenderer.invoke("settings", patch),
  resume: () => ipcRenderer.invoke("resume-schedule"),
  importAssets: () => ipcRenderer.invoke("import-assets"),
  openAssets: () => ipcRenderer.invoke("open-assets"),
  hover: (value) => ipcRenderer.send("hover", value),
  gesture: (id) => ipcRenderer.send("gesture", id),
  resize: (n) => ipcRenderer.send("resize-pet", n),
  panel: () => ipcRenderer.send("panel"),
  menu: () => ipcRenderer.send("menu"),
  drag: (phase) => ipcRenderer.send("drag", phase),
  mouse: (ignore) => ipcRenderer.send("mouse", ignore),
  hide: () => ipcRenderer.send("hide"),
  closePanel: () => ipcRenderer.send("close-panel"),
  onState: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on("state", listener);
    return () => ipcRenderer.removeListener("state", listener);
  },
});
