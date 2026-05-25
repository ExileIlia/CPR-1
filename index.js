const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os-utils");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 400,
    title: "CPU Monitor",
    backgroundColor: "#222",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Hide DevTools in production
  mainWindow.webContents.on("devtools-opened", () => {
    mainWindow.webContents.closeDevTools();
  });

  // Send system stats every second
  setInterval(() => {
    os.cpuUsage(function (v) {
      const cpuPercent = (v * 100).toFixed(2);
      const memPercent = (os.freememPercentage() * 100).toFixed(2);
      const totalMem = (os.totalmem() / 1024).toFixed(2);

      mainWindow.webContents.send("cpu", cpuPercent);
      mainWindow.webContents.send("mem", memPercent);
      mainWindow.webContents.send("total-mem", totalMem);
    });
  }, 1000);
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
