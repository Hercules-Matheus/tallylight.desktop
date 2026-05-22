// PeerProvider.js — processo RENDERER (Chromium)
// WebRTC está disponível nativamente aqui, sem dependências nativas Node.
//
// Carregado pelo index.html após peerjs.min.js — a classe Peer já existe
// como global quando este arquivo executa.
//
// Expõe window.peerProvider para uso pelo renderer.js.

function sessionToPeerId(sessionCode) {
  return "tally-" + sessionCode.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
}

class PeerProvider {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map(); // remotePeerId → DataConnection
    this._lastTally = null;
    this._lastInputs = null;
  }

  // Inicializa o Peer com ID derivado do session code.
  // Retorna Promise<peerId>.
  init(sessionCode) {
    return new Promise((resolve, reject) => {
      // Destrói peer anterior se existir (re-inicialização segura)
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      const id = sessionToPeerId(sessionCode);

      this.peer = new Peer(id, {
        host: "0.peerjs.com",
        port: 443,
        secure: true,
        path: "/",
        debug: 0,
      });

      this.peer.on("open", (assignedId) => {
        this.peerId = assignedId;
        console.log(`[Peer] Aberto: ${assignedId}`);
        resolve(assignedId);
      });

      // Aceita conexões dos celulares
      this.peer.on("connection", (conn) => {
        const remote = conn.peer;
        console.log(`[Peer] Celular conectando: ${remote}`);

        conn.on("open", () => {
          this.connections.set(remote, conn);
          console.log(`[Peer] Canal aberto: ${remote} (total: ${this.connections.size})`);

          // Envia estado atual imediatamente ao celular que acabou de conectar
          // para evitar tela cinza até o próximo corte
          if (this._lastTally) conn.send({ type: "tally", ...this._lastTally });
          if (this._lastInputs) conn.send({ type: "inputs", inputs: this._lastInputs });
        });

        conn.on("close", () => {
          this.connections.delete(remote);
          console.log(`[Peer] Fechado: ${remote} (total: ${this.connections.size})`);
        });

        conn.on("error", (err) => {
          console.error(`[Peer] Erro canal ${remote}:`, err.message);
          this.connections.delete(remote);
        });
      });

      this.peer.on("disconnected", () => {
        console.warn("[Peer] Desconectado do servidor de sinalização. Reconectando...");
        if (this.peer && !this.peer.destroyed) this.peer.reconnect();
      });

      this.peer.on("error", (err) => {
        console.error("[Peer] Erro:", err.type, err.message);
        if (err.type === "unavailable-id") {
          reject(new Error("Sessão já ativa em outro dispositivo."));
        } else {
          reject(err);
        }
      });
    });
  }

  // Envia tally para todos os celulares conectados
  broadcastTally(program, preview) {
    const payload = { type: "tally", program, preview, ts: Date.now() };
    this._lastTally = { program, preview };
    this._send(payload);
    console.log(`[Peer] Tally → program:${program} preview:${preview} (${this.connections.size} peers)`);
  }

  // Envia lista de câmeras para todos os celulares conectados
  broadcastInputs(inputs) {
    const payload = { type: "inputs", inputs };
    this._lastInputs = inputs;
    this._send(payload);
    console.log(`[Peer] Inputs → ${inputs.length} câmeras (${this.connections.size} peers)`);
  }

  _send(payload) {
    this.connections.forEach((conn, remotePeerId) => {
      if (conn.open) {
        conn.send(payload);
      } else {
        this.connections.delete(remotePeerId);
      }
    });
  }

  destroy() {
    if (!this.peer) return;
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peer.destroy();
    this.peer = null;
    this.peerId = null;
    this._lastTally = null;
    this._lastInputs = null;
    console.log("[Peer] Encerrado.");
  }
}

window.peerProvider = new PeerProvider();
