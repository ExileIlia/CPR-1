const { contextBridge, ipcRenderer } = require("electron");

// Expose safe API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  onCpu: (callback) => ipcRenderer.on("cpu", (_event, data) => callback(data)),
  onMem: (callback) => ipcRenderer.on("mem", (_event, data) => callback(data)),
  onTotalMem: (callback) =>
    ipcRenderer.on("total-mem", (_event, data) => callback(data)),
});
