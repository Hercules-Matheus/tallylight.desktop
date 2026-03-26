const { Atem } = require("atem-connection");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const fs = require("fs");
const net = require("net");
const path = require("path");
const os = require("os");

const myAtem = new Atem();
const app = express();
const server = http.createServer(app);
const DEFAULT_PORT = 58000;

const packageInfo = require("../package.json");
const VERSION = packageInfo.version;

// --- CONFIGURAÇÃO E CAMINHOS ---
const configPath = process.argv[2] || path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ atemIp: "192.168.10.240" }));
}

const io = new Server(server, { cors: { origin: "*" } });

// --- FUNÇÕES AUXILIARES ---
function getSavedIp() {
  try {
    return JSON.parse(fs.readFileSync(configPath)).atemIp;
  } catch (err) {
    return "127.0.0.1";
  }
}

function getAllIps() {
  const interfaces = os.networkInterfaces();
  const foundIps = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        foundIps.push({
          name: name,
          address: iface.address,
          isTailscale:
            name.toLowerCase().includes("tailscale") ||
            iface.address.startsWith("100."),
        });
      }
    }
  }
  return foundIps;
}

function getLocalIp() {
  const ips = getAllIps();
  const realLocal = ips.find(
    (ip) =>
      !ip.isTailscale &&
      (ip.address.startsWith("192.168.") || ip.address.startsWith("10.")),
  );
  return realLocal ? realLocal.address : ips[0]?.address || "localhost";
}

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(findAvailablePort(startPort + 1)));
    s.once("listening", () => s.close(() => resolve(startPort)));
    s.listen(startPort, "0.0.0.0");
  });
}

// --- LÓGICA DO ATEM ---
let lastTally = { program: 0, preview: 0 };
let lastInputs = [];

const broadcastAtemState = () => {
  // Pega inputs físicos (tipo 0)
  if (myAtem.state && myAtem.state.inputs) {
    lastInputs = Object.values(myAtem.state.inputs)
      .filter((i) => i.internalPortType === 0)
      .map((i) => ({
        id: i.inputId,
        label: i.longName || `Câmera ${i.inputId}`,
      }));
  }

  io.emit("status-atem", { connected: myAtem.status === 2, ip: getSavedIp() });
  io.emit("available-inputs", lastInputs);
};

myAtem.on("connected", () => {
  console.log("✅ ATEM Conectado");
  broadcastAtemState();
});

myAtem.on("disconnected", () => {
  console.log("❌ ATEM Desconectado");
  io.emit("status-atem", { connected: false });
});

myAtem.on("stateChanged", (state) => {
  const me = state.video?.mixEffects[0];
  if (me) {
    const newTally = { program: me.programInput, preview: me.previewInput };
    if (JSON.stringify(newTally) !== JSON.stringify(lastTally)) {
      lastTally = newTally;
      io.emit("tallyUpdate", lastTally);
    }
  }
  // Se mudar nomes de câmeras no ATEM Software Control, atualiza o front
  if (state.inputs) broadcastAtemState();
});

// --- COMUNICAÇÃO (SOCKETS) ---
io.on("connection", (socket) => {
  console.log(`📱 Novo cliente: ${socket.id}`);

  // Envia TUDO o que o servidor já sabe de imediato
  socket.emit("current-ip", getSavedIp());
  socket.emit("server-ip", getLocalIp());
  socket.emit("server-port", server.address()?.port || DEFAULT_PORT);
  socket.emit("all-server-ips", getAllIps());
  socket.emit("status-atem", { connected: myAtem.status === 2 });
  socket.emit("tallyUpdate", lastTally);
  socket.emit("available-inputs", lastInputs);

  socket.on("update-atem-ip", async (newIp) => {
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(newIp)) return;
    fs.writeFileSync(configPath, JSON.stringify({ atemIp: newIp }));
    io.emit("current-ip", newIp);
    io.emit("status-atem", { connected: false, message: "Reconectando..." });
    try {
      await myAtem.disconnect();
    } catch (e) {}
    myAtem.connect(newIp);
  });
});

// --- EXPRESS / STATIC ---
const frontendPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(frontendPath));
app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

// --- START ---
findAvailablePort(DEFAULT_PORT).then((port) => {
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Tally v${VERSION} em http://${getLocalIp()}:${port}`);
    myAtem.connect(getSavedIp());
    if (process.send) process.send({ type: "SERVER_READY", port });
  });
});
