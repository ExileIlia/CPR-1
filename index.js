const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, Menu } = require("electron");
const path = require("path");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    title: "Simple Screen Recorder",
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
};

app.whenReady().then(() => {
  // ---- IPC HANDLERS ----

  // Get available screen/window sources
  ipcMain.handle("get-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 300, height: 200 },
    });
    // Return serializable data (no NativeImage)
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
    }));
  });

  // Show context menu with sources
  ipcMain.handle("show-sources-menu", async (event, sources) => {
    return new Promise((resolve) => {
      const menu = Menu.buildFromTemplate(
        sources.map((source) => ({
          label: source.name,
          click: () => resolve(source),
        }))
      );
      const win = BrowserWindow.fromWebContents(event.sender);
      menu.popup({ window: win, callback: () => resolve(null) });
    });
  });

  // Show save dialog
  ipcMain.handle("show-save-dialog", async () => {
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: "Зберегти відео",
      defaultPath: `recording-${Date.now()}.webm`,
      filters: [{ name: "WebM Video", extensions: ["webm"] }],
    });
    return filePath || null;
  });

  // Show open dialog
  ipcMain.handle("show-open-dialog", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      buttonLabel: "Відкрити відео",
      title: "Виберіть відеофайл",
      filters: [
        { name: "Video Files", extensions: ["webm", "mp4", "mkv", "avi"] },
      ],
      properties: ["openFile"],
    });
    return filePaths && filePaths.length > 0 ? filePaths[0] : null;
  });

  // Write file to disk
  ipcMain.handle("write-file", async (event, { filePath, buffer }) => {
    const fs = require("fs");
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, Buffer.from(buffer), (err) => {
        if (err) reject(err.message);
        else resolve(true);
      });
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
