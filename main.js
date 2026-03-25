const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  Notification,
} = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let tray = null;
let backendProcess;

function createTray() {
  const iconPath = path.join(__dirname, "icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Abrir Painel Tally", click: () => mainWindow.show() },
    { type: "separator" },
    {
      label: "Reiniciar Backend",
      click: () => {
        if (backendProcess) backendProcess.kill();
        backendProcess = fork(path.join(__dirname, "backend", "index.js"));
      },
    },
    {
      label: "Encerrar Tudo",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Tally System - Ativo");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function createWindow() {
  backendProcess = fork(path.join(__dirname, "backend", "index.js"));

  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
  } else {
    // Quando estiver no .exe, ele lê a pasta build
    mainWindow.loadFile(path.join(__dirname, "frontend/build/index.html"));
  }

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.on("ready", () => {
  createTray(); // Primeiro criamos o Tray
  createWindow(); // Depois a Janela

  // Usando a API de Notificação moderna (mais estável que Balloon)
  if (Notification.isSupported()) {
    new Notification({
      title: "Tally System",
      body: "🚀 Sistema iniciado em segundo plano!",
    }).show();
  }
});
