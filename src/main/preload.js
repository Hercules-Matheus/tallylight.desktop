const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
  getConfig: () => ipcRenderer.invoke("get-config"),
  startTransmission: (data) =>
    ipcRenderer.invoke("app:start-transmission", data),

  // Receber atualizações de status (ATEM ON/OFF)
  onStatusUpdate: (callback) =>
    ipcRenderer.on("status-update", (event, value) => callback(value)),
});
