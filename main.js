const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { dialog } = require("electron");

const { ipcMain, shell } = require("electron");
const fs = require("fs");
const os = require("os");

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

  win.loadFile(path.join(__dirname, "dist/tradewest/index.html"));

  win.once("ready-to-show", () => {
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

// app.whenReady().then(() => {
//   createWindow();

//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createWindow();
//     }
//   });
// });
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Listen for updates
autoUpdater.on("update-available", () => {
  console.log("Update available");
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
