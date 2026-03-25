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

// Configuração de caminhos
const configPath = process.argv[2] || path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ atemIp: "127.0.0.1" }));
}

const io = new Server(server, { cors: { origin: "*" } });

// --- FUNÇÕES AUXILIARES ---
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", (err) => {
      if (err.code === "EADDRINUSE") resolve(findAvailablePort(startPort + 1));
      else reject(err);
    });
    s.once("listening", () => s.close(() => resolve(startPort)));
    s.listen(startPort, "0.0.0.0"); // 0.0.0.0 para aceitar conexões da rede
  });
}

function getSavedIp() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data).atemIp;
  } catch (err) {
    return "127.0.0.1";
  }
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

// --- LÓGICA DO ATEM ---
myAtem.on("connected", () => {
  console.log("✅ Conectado ao ATEM!");
  io.emit("status-atem", { connected: true, ip: getSavedIp() });
});

myAtem.on("disconnected", () => {
  console.log("❌ Desconectado do ATEM.");
  io.emit("status-atem", { connected: false });
});

let lastTally = { program: 0, preview: 0 };
myAtem.on("stateChanged", (state) => {
  const me = state.video && state.video.mixEffects[0];
  if (me) {
    const newTally = { program: me.programInput, preview: me.previewInput };
    if (
      newTally.program !== lastTally.program ||
      newTally.preview !== lastTally.preview
    ) {
      lastTally = newTally;
      io.emit("tallyUpdate", newTally);
    }
  }
});

// --- SERVINDO O FRONTEND E SOCKETS ---
io.on("connection", (socket) => {
  console.log("📱 Dispositivo conectado.");

  socket.emit("current-ip", getSavedIp());
  socket.emit("server-ip", getLocalIp());
  socket.emit(
    "server-port",
    server.address() ? server.address().port : DEFAULT_PORT,
  );

  const emitAtemStatus = () => {
    const isRealConnected = myAtem.status === 2; // 2 é o código para 'Connected' funcional
    io.emit("status-atem", {
      connected: isRealConnected,
      message: isRealConnected ? "CONECTADO ✅" : "DESCONECTADO ❌",
    });
  };

  // O bloco de update deve ficar APENAS aqui dentro
  socket.on("update-atem-ip", (newIp) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIp)) return;
    fs.writeFileSync(configPath, JSON.stringify({ atemIp: newIp }));
    io.emit("current-ip", newIp);
    io.emit("status-atem", { connected: false, message: "Reconectando..." });
    myAtem
      .disconnect()
      .then(() => myAtem.connect(newIp))
      .catch(() => myAtem.connect(newIp));
  });
});

const frontendPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(frontendPath));

// --- ROTA DE TESTE (Simulação de Câmera) ---
app.get("/teste/:cam", (req, res) => {
  const camNumber = parseInt(req.params.cam);

  // Simula o envio de um novo estado de Tally via Socket
  io.emit("tallyUpdate", {
    program: camNumber,
    preview: 0,
  });

  console.log(`🧪 Simulação: Câmera ${camNumber} colocada em PROGRAM`);
  res.send(`Simulando Câmera ${camNumber} no AR.`);
});

app.get("*", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send("Build não encontrado.");
});

// --- START ---
findAvailablePort(DEFAULT_PORT).then((port) => {
  server.listen(port, "0.0.0.0", () => {
    console.log(
      `🚀 Tally v${VERSION} rodando em http://${getLocalIp()}:${port}`,
    );
    myAtem.connect(getSavedIp());
    if (process.send) process.send({ type: "SERVER_READY", port: port });
  });
});
