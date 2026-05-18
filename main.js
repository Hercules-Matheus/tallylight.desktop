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

// Variáveis Globais (declaradas aqui para evitar Garbage Collection)
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
      console.error("[Config] Erro ao ler config.json, resetando...");
    }
  }
  return { atemIp: "127.0.0.1", sessionCode: "" };
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

  // No Windows, fechar a janela apenas esconde para a Tray
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

  tray.setToolTip("Tally Cloud Admin - Operacional");
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

// 1. Login
ipcMain.handle("auth:login", async (_, { email, password }) => {
  try {
    const user = await cloud.login(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 2. Reset de senha
// Chama resetPasswordForEmail() no Supabase. O usuário receberá um email
// com link para https://tallylight-frontend.vercel.app/reset-password
ipcMain.handle("auth:reset-password", async (_, email) => {
  try {
    await cloud.resetPassword(email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 3. Configurações salvas
ipcMain.handle("get-config", () => getUserData());

// 3. Iniciar transmissão ATEM → Cloud
ipcMain.handle("app:start-transmission", async (_, { atemIp, sessionCode }) => {
  try {
    // Persiste config local
    fs.writeFileSync(
      configPath,
      JSON.stringify({ atemIp, sessionCode }, null, 2)
    );

    // Inicia sessão no Supabase
    await cloud.startSession(sessionCode);

    // Registra o listener de inputs ANTES de conectar, e remove após o primeiro
    // disparo para não acumular. Usa wrapper nomeado para poder remover com segurança.
    //
    // CORREÇÃO: antes usava .once() registrado DEPOIS do connectHardware,
    // o que criava uma race condition se o ATEM conectasse rapidamente.
    // Agora o listener é registrado primeiro, e o cleanup é explícito.
    const onInputs = async (inputs) => {
      orchestrator.off("inputs-updated", onInputs); // cleanup manual e seguro

      console.log(`[Main] ${inputs.length} câmeras recebidas, enviando para a nuvem...`);
      await cloud.saveAtemInputs(sessionCode, inputs);

      // CORREÇÃO: canal era "atem-inputs-data" aqui mas preload ouvia "atem-inputs".
      // Agora ambos usam "atem-inputs".
      sendToRenderer("atem-inputs", inputs);
    };

    orchestrator.on("inputs-updated", onInputs);

    // Conecta ao hardware e inicia fluxo de cortes
    orchestrator.connectHardware(atemIp);
    orchestrator.startTallyFlow(sessionCode);

    return { success: true };
  } catch (error) {
    console.error("[Main] Erro ao iniciar transmissão:", error);
    return { success: false, error: error.message };
  }
});

// 4. Parar transmissão (chamado pelo btn-stop no renderer)
//
// CORREÇÃO: esse handler não existia. O renderer chamava window.location.reload()
// diretamente, deixando a sessão como is_active: true no Supabase em caso de
// crash ou fechamento pelo tray.
ipcMain.handle("app:stop-transmission", async () => {
  try {
    await cloud.stopSession();
    orchestrator.cleanup?.(); // limpa callbacks do AtemManager se disponível
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
// Ciclo de vida do app
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// CORREÇÃO: before-quit com async não aguarda a Promise — o Electron sai antes
// do stopSession completar. O padrão correto é: prevenir o quit, aguardar a
// Promise e só então chamar app.quit() de novo com isQuitting = true.
app.on("before-quit", async (event) => {
  if (isQuitting) return; // segunda passagem: deixa sair
  event.preventDefault();
  isQuitting = true;

  try {
    await cloud.stopSession();
    console.log("[Main] Sessão encerrada com sucesso.");
  } catch (e) {
    console.error("[Main] Erro ao encerrar sessão:", e.message);
  } finally {
    app.quit(); // agora sai de verdade (isQuitting = true, não vai entrar aqui de novo)
  }
});