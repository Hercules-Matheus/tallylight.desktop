const { contextBridge, ipcRenderer } = require("electron");

// Remove listener anterior antes de registrar novo — evita acúmulo em
// re-renderizações e hot-reload.
function safeOn(channel, callback) {
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

  // --- Main → Renderer ---
  onStatusUpdate: (callback) => safeOn("status-update", callback),
  onAtemInputs: (callback) => safeOn("atem-inputs", callback),
  onPeerInit: (callback) => safeOn("peer-init", callback), // main pede para inicializar PeerJS
  onTallyUpdate: (callback) => safeOn("tally-update", callback), // main repassa cortes do ATEM
});
