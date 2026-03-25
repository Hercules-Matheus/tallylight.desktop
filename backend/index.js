const { Atem } = require("atem-connection");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");

const myAtem = new Atem();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// 1. Conexão com o ATEM (Simulador ou Real)
myAtem.connect("127.0.0.1");

myAtem.on("connected", () => {
  console.log("✅ Conectado ao ATEM!");
});

// 2. Evento de mudança de estado
myAtem.on("stateChanged", (state) => {
  if (state.video && state.video.mixEffects[0]) {
    const program = state.video.mixEffects[0].programInput;
    const preview = state.video.mixEffects[0].previewInput;

    console.log(`ON AIR: ${program} | PREVIEW: ${preview}`);

    // Envia para todos os celulares conectados
    io.emit("tallyUpdate", {
      program: program,
      preview: preview,
    });
  }
});

app.get("/teste/:cam", (req, res) => {
  const cam = parseInt(req.params.cam);
  console.log(`Simulando via Web: Câmera ${cam}`);
  io.emit("tallyUpdate", { program: cam });
  res.send(`Simulando Câmera ${cam} no AR!`);
});

server.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Servidor Tally pronto!");
  console.log("Teste no navegador: http://localhost:3000/teste/1");
});
