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

// --- CONFIGURAÇÃO DE AMBIENTE ---
const isDev = !app.isPackaged;
const envPath = isDev
  ? path.join(__dirname, ".env")
  : path.join(process.resourcesPath, ".env");

require("dotenv").config({ path: envPath });

// --- IMPORTAÇÃO DE MÓDULOS INTERNOS ---
const orchestrator = require("./src/main/index");
const store = require("./src/main/core/StateStore");
const cloud = require("./src/main/providers/SupabaseProvider");

// Variáveis Globais (Essencial declarar aqui para evitar Garbage Collection)
let mainWindow = null;
let tray = null;
let isQuitting = false;

const configPath = path.join(app.getPath("userData"), "config.json");

/**
 * Gerencia a persistência de configurações locais (IP e Sala)
 */
function getUserData() {
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
      console.error("Erro ao ler config.json, resetando...");
    }
  }
  return { atemIp: "127.0.0.1", sessionCode: "" };
}

/**
 * Cria a interface principal do sistema
 */
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

  // No Windows, ao fechar a janela principal, apenas escondemos para a Tray
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

/**
 * Cria o ícone na bandeja do sistema (System Tray)
 */
function createTray() {
  const iconPath = path.join(__dirname, "assets/icon.ico");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir Painel",
      click: () => mainWindow.show(),
    },
    { type: "separator" },
    {
      label: "Encerrar Tally",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Tally Cloud Admin - Operacional");
  tray.setContextMenu(contextMenu);

  // Toggle exibir/esconder ao clicar no ícone da bandeja
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// --- IPC HANDLERS (Comunicação com o Frontend) ---

// 1. Login Administrativo
ipcMain.handle("auth:login", async (_, { email, password }) => {
  try {
    const user = await cloud.login(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 2. Recuperar configurações salvas
ipcMain.handle("get-config", () => {
  return getUserData();
});

// 3. Iniciar fluxo ATEM -> Cloud
ipcMain.handle("app:start-transmission", async (_, { atemIp, sessionCode }) => {
  try {
    // 1. Persiste as configurações locais e inicia a sessão no Supabase
    fs.writeFileSync(
      configPath,
      JSON.stringify({ atemIp, sessionCode }, null, 2),
    );
    await cloud.startSession(sessionCode);

    // 2. NOVO: Captura os inputs do ATEM e envia para o Supabase
    // Usamos .once para não ficar repetindo isso a cada pequena mudança de nome
    orchestrator.once("inputs-updated", async (inputs) => {
      console.log("Enviando lista de câmeras para a nuvem...");
      await cloud.saveAtemInputs(sessionCode, inputs);

      // Opcional: Avisa o Admin Desktop que os nomes chegaram
      if (mainWindow) {
        mainWindow.webContents.send("atem-inputs-data", inputs);
      }
    });

    // 3. Conecta ao hardware (ATEM)
    orchestrator.connectHardware(atemIp);

    // 4. Inicia o fluxo de dados
    orchestrator.startTallyFlow(sessionCode);

    return { success: true };
  } catch (error) {
    console.error("Erro ao iniciar transmissão:", error);
    return { success: false, error: error.message };
  }
});

// --- EVENTOS DE ESTADO (Main -> Renderer) ---

// Repassa mudanças de conexão do ATEM para a interface visual
store.on("statusChange", (online) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("status-update", {
      type: "atem",
      connected: online,
    });
  }
});

// --- CICLO DE VIDA DO APP ---

app.whenReady().then(() => {
  createWindow();
  createTray();
});

// Garante que o processo seja encerrado corretamente no Windows/Linux
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup antes de sair (encerra a sessão no Supabase para não deixar lixo no banco)
app.on("before-quit", async () => {
  try {
    isQuitting = true;
    await cloud.stopSession();
  } catch (e) {
    console.error("Erro no logout final");
  }
});
