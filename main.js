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
  const userDataPath = app.getPath("userData");
  const configPath = path.join(userDataPath, "config.json");

  backendProcess = fork(path.join(__dirname, "backend", "index.js"), [
    configPath,
  ]);

  mainWindow = new BrowserWindow({
    width: 450, // Aumentado levemente para o QR Code respirar
    height: 700, // Aumentado para acomodar a tela de admin com scroll se necessário
    show: false,
    alwaysOnTop: true, // Dica de UX: Tally no PC geralmente fica sobre o vMix/OBS
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Listener para o backend avisar que subiu o servidor
  backendProcess.on("message", (msg) => {
    if (msg.type === "SERVER_READY") {
      const serverUrl = `http://localhost:${msg.port}`;
      console.log(`Conectando Electron na porta: ${msg.port}`);

      // Carrega a URL e só mostra a janela quando o React estiver pronto
      mainWindow.loadURL(serverUrl);
      mainWindow.once("ready-to-show", () => {
        mainWindow.show();
      });
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
    // mainWindow.webContents.openDevTools(); // Você decide se deixa aberto
  }

  // --- TRATAMENTO PARA REACT ROUTER ---
  // Se o usuário atualizar a página em uma rota como /admin, o Electron
  // precisa redirecionar para o index.html para o Router reassumir.
  mainWindow.webContents.on("did-fail-load", () => {
    if (!isDev) {
      console.log("Falha no load, recuperando rota principal...");
      // Aqui você poderia forçar o reload da porta do backend se necessário
    }
  });

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
