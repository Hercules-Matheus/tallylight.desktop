const { contextBridge, ipcRenderer } = require("electron");

// Helper para registrar listeners IPC de forma segura,
// evitando acúmulo de listeners em hot-reload / re-renderizações.
function safeOn(channel, callback) {
  // Remove listener anterior do mesmo canal antes de adicionar
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (_event, value) => callback(value));
}

contextBridge.exposeInMainWorld("api", {
  // --- Auth ---
  login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
  resetPassword: (email) => ipcRenderer.invoke("auth:reset-password", email),

  // --- Config ---
  getConfig: () => ipcRenderer.invoke("get-config"),

  // --- Transmissão ---
  startTransmission: (data) =>
    ipcRenderer.invoke("app:start-transmission", data),
  stopTransmission: () => ipcRenderer.invoke("app:stop-transmission"),

  // --- Listeners de status (ATEM online/offline) ---
  // Corrigido: era .on acumulativo; agora remove o anterior antes de registrar.
  onStatusUpdate: (callback) => safeOn("status-update", callback),

  // --- Listener de inputs do ATEM (câmeras sincronizadas) ---
  // NOVO: estava faltando no preload original, causando erro silencioso no renderer.
  onAtemInputs: (callback) => safeOn("atem-inputs", callback),
});