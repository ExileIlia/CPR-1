const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => ipcRenderer.invoke("get-sources"),
  showSourcesMenu: (sources) => ipcRenderer.invoke("show-sources-menu", sources),
  showSaveDialog: () => ipcRenderer.invoke("show-save-dialog"),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),
  writeFile: (filePath, buffer) => ipcRenderer.invoke("write-file", { filePath, buffer }),
});
