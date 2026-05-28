const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

const orchestrator = require(
  path.join(__dirname, "src", "main", "orchestrator"),
);
const store = require(
  path.join(__dirname, "src", "main", "core", "StateStore"),
);

let mainWindow = null;
let tray = null;
let isQuitting = false;

const configPath = path.join(app.getPath("userData"), "config.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUserData() {
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
      console.error("[Config] Erro ao ler config.json");
    }
  }
  return { atemIp: "127.0.0.1" };
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

// ---------------------------------------------------------------------------
// Janela principal
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 680,
    resizable: false,
    maximizable: false,
    title: "Tally Cloud Admin",
    icon: path.join(__dirname, "assets/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "src/main/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src/renderer/index.html"));

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// ---------------------------------------------------------------------------
// System Tray
// ---------------------------------------------------------------------------

function createTray() {
  const iconPath = path.join(__dirname, "assets/icon.ico");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Abrir Painel", click: () => mainWindow.show() },
    { type: "separator" },
    {
      label: "Encerrar Tally",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Tally Cloud Admin");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// IPC Handlers
// ---------------------------------------------------------------------------

// 1. Configurações salvas
ipcMain.handle("get-config", () => getUserData());

// 2. Iniciar transmissão
//    Fluxo: salva config → conecta ATEM → manda "peer-init" ao renderer
//    O renderer inicializa o PeerJS (WebRTC nativo do Chromium) e confirma
//    via "peer:ready". A partir daí, tally-changed → webContents.send →
//    renderer → peerProvider.broadcast() → celulares.
ipcMain.handle("app:start-transmission", async (_, { atemIp, sessionCode }) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify({ atemIp }, null, 2));

    // Listener de inputs: renderer exibe contagem e os celulares recebem
    // via PeerJS logo após conectar (PeerProvider envia _lastInputs ao abrir canal)
    const onInputs = (inputs) => {
      orchestrator.off("inputs-updated", onInputs);
      console.log(`[Main] ${inputs.length} câmeras recebidas.`);
      sendToRenderer("atem-inputs", inputs);
    };
    orchestrator.on("inputs-updated", onInputs);

    // Conecta hardware e inicia fluxo de tally
    orchestrator.connectHardware(atemIp);
    orchestrator.startTallyFlow();

    // Repassa cada corte ao renderer para broadcast P2P
    orchestrator.removeAllListeners("tally-changed");
    orchestrator.on("tally-changed", (data) => {
      sendToRenderer("tally-update", data);
    });

    // Pede ao renderer para inicializar o PeerJS com o session code
    sendToRenderer("peer-init", { sessionCode });

    return { success: true };
  } catch (error) {
    console.error("[Main] Erro ao iniciar transmissão:", error);
    return { success: false, error: error.message };
  }
});

// 3. Parar transmissão
ipcMain.handle("app:stop-transmission", async () => {
  try {
    orchestrator.cleanup();
    return { success: true };
  } catch (error) {
    console.error("[Main] Erro ao parar transmissão:", error);
    return { success: false, error: error.message };
  }
});

// ---------------------------------------------------------------------------
// Eventos de estado: Main → Renderer
// ---------------------------------------------------------------------------

store.on("statusChange", (online) => {
  sendToRenderer("status-update", { type: "atem", connected: online });
});

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async (event) => {
  if (isQuitting) return;
  event.preventDefault();
  isQuitting = true;
  try {
    orchestrator.cleanup();
  } catch (e) {
    console.error("[Main] Erro no cleanup:", e.message);
  } finally {
    app.quit();
  }
});
