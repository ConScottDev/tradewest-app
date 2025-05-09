const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({ // Enable fullscreen mode
    icon: path.join(__dirname, 'src/assets/img/tradewest-mobile-full.ico'),  // Set the icon (replace 'icon.png' with your image file)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  // Allow access to Node.js modules in the renderer process
    },
  });
  win.maximize();
win.show();

  win.loadURL("https://tradewest-c870e.web.app/"); // Replace with your Firebase URL

  win.once("ready-to-show", () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
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

// Listen for updates
autoUpdater.on("update-available", () => {
  console.log("Update available");
});

autoUpdater.on("update-downloaded", () => {
  console.log("Update downloaded");
});
