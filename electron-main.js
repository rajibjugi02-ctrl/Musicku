const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#070709",
    title: "Musicku — Liquid Audio Streaming",
    icon: path.join(__dirname, "public", "logo.png"),
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const appUrl = process.env.APP_URL || "https://musickus.vercel.app";
  win.loadURL(appUrl);

  // Open external links (e.g. Spotify external links) in system default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://accounts.spotify.com") || url.startsWith("https://accounts.google.com")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
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

