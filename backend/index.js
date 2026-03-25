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

// Configuração de caminhos e persistência
const configPath = process.argv[2] || path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ atemIp: "192.168.1.240" }));
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
    s.listen(startPort, "0.0.0.0");
  });
}

function getSavedIp() {
  try {
    const data = fs.readFileSync(configPath);
    return JSON.parse(data).atemIp;
  } catch (err) {
    return "192.168.1.240";
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

myAtem.connect(getSavedIp());

myAtem.on("connected", () => {
  console.log("✅ Conectado ao ATEM!");
  io.emit("status-atem", { connected: true, ip: getSavedIp() });
});

myAtem.on("disconnected", () => {
  console.log("❌ Desconectado do ATEM.");
  io.emit("status-atem", { connected: false });
});

myAtem.on("stateChanged", (state) => {
  if (state.video && state.video.mixEffects[0]) {
    io.emit("tallyUpdate", {
      program: state.video.mixEffects[0].programInput,
      preview: state.video.mixEffects[0].previewInput,
    });
  }
});

// --- SERVINDO O FRONTEND E SOCKETS ---

// 1. Unificando os eventos de Socket em um único lugar
io.on("connection", (socket) => {
  console.log("📱 Dispositivo conectado.");

  // Envia dados iniciais
  socket.emit("current-ip", getSavedIp());
  socket.emit("server-ip", getLocalIp());

  // Escuta atualização de IP
  socket.on("update-atem-ip", (newIp) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(newIp)) return;

    fs.writeFileSync(configPath, JSON.stringify({ atemIp: newIp }));
    myAtem.disconnect().catch(() => {});
    myAtem.connect(newIp);
    io.emit("current-ip", newIp);
  });
});

// 2. Configura o Express para servir o build do React (Para o .exe final)
const frontendPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(frontendPath));

app.get("/teste/:cam", (req, res) => {
  io.emit("tallyUpdate", { program: parseInt(req.params.cam) });
  res.send(`Simulando Câmera ${req.params.cam}`);
});

// Rota padrão para o React (deve ser a última)
app.get("*", (req, res) => {
  if (fs.existsSync(path.join(frontendPath, "index.html"))) {
    res.sendFile(path.join(frontendPath, "index.html"));
  } else {
    res.send(
      "Frontend build não encontrado. Rode 'npm run build' no frontend.",
    );
  }
});

// --- START ---

findAvailablePort(DEFAULT_PORT).then((port) => {
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Tally rodando em http://${getLocalIp()}:${port}`);
    // Avisa a porta para quem já estiver conectado (opcional)
    io.emit("server-port", port);
    if (process.send) {
      process.send({ type: "SERVER_READY", port: port });
    }
  });
});
