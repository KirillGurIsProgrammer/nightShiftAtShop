const { app, BrowserWindow } = require("electron");
const path = require("node:path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 780,
    minHeight: 620,
    backgroundColor: "#090b0d",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_START_URL) {
    window.loadURL(process.env.ELECTRON_START_URL);
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
