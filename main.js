const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { dialog } = require("electron");

const { ipcMain, shell } = require("electron");
const fs = require("fs");
const os = require("os");

const log = require("electron-log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "debug";


function createWindow() {
  const win = new BrowserWindow({
    // Enable fullscreen mode
    icon: path.join(__dirname, "src/assets/img/tradewest-mobile-full.ico"), // Set the icon (replace 'icon.png' with your image file)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Allow access to Node.js modules in the renderer process
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.maximize();
  win.show();

  win.loadFile(path.join(__dirname, "dist", "index.html"));

  // win.once("ready-to-show", () => {
  //   autoUpdater.checkForUpdatesAndNotify();
  // });

  app.on("ready", () => {
  createWindow();
  console.log("📦 App ready. Checking for updates...");
  autoUpdater.checkForUpdatesAndNotify();
});
}

ipcMain.on("save-and-open-pdf", (event, uint8Array, fileName) => {
  const buffer = Buffer.from(uint8Array);
  const filePath = path.join(os.tmpdir(), fileName);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("Failed to save PDF:", err);
      return;
    }
    shell.openPath(filePath);
  });
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

autoUpdater.on("checking-for-update", () => {
  console.log("🕵️ Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  console.log("✅ Update available:", info);
});

autoUpdater.on("update-not-available", (info) => {
  console.log("🚫 No update available:", info);
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`⬇️ Downloaded ${progress.percent.toFixed(2)}%`);
  console.log(`💾 Speed: ${progress.bytesPerSecond} bytes/sec`);
});

autoUpdater.on("error", (err) => {
  console.error("❌ Update error:", err);
});


autoUpdater.on("update-downloaded", () => {
  const result = dialog.showMessageBoxSync({
    type: "info",
    buttons: ["Restart", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update Ready",
    message:
      "A new version has been downloaded. Restart now to install the update?",
  });

  if (result === 0) {
    autoUpdater.quitAndInstall();
  }
});
