// ---------------------------------------------------------------------------
// Navegação entre telas
// ---------------------------------------------------------------------------

const AppNavigation = {
  screens: {
    setup: document.getElementById("screen-setup"),
    dash: document.getElementById("screen-dash"),
  },
  goTo(name) {
    if (!this.screens[name]) return;

    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }

    Object.values(this.screens).forEach((s) => {
      if (s) s.style.display = "none";
    });

    this.screens[name].style.display = "flex";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const firstInput = this.screens[name].querySelector(
          "input:not([disabled]):not([type='hidden'])",
        );
        if (firstInput) {
          firstInput.focus();
          const len = firstInput.value.length;
          firstInput.setSelectionRange(len, len);
        }
      });
    });
  },
};

// ---------------------------------------------------------------------------
// Iniciar Transmissão
// ---------------------------------------------------------------------------

// Gera um código de sessão aleatório de 6 caracteres alfanuméricos.
// Não precisa ser memorável — os cinegrafistas chegam via QR Code.
function generateSessionCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0/I/1 para evitar confusão
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

document.getElementById("btn-start").addEventListener("click", async () => {
  const btn = document.getElementById("btn-start");
  const atemIp = document.getElementById("atem-ip").value.trim();

  if (!atemIp) return alert("Informe o IP do ATEM!");

  // Gera o session code aqui — o celular vai receber via QR, não precisa digitar
  const sessionCode = generateSessionCode();

  btn.disabled = true;
  btn.innerText = "Conectando ao ATEM...";

  const res = await window.api.startTransmission({ atemIp, sessionCode });

  if (res.success) {
    document.getElementById("display-session").innerText = sessionCode;
    AppNavigation.goTo("dash");
  } else {
    alert("Falha: " + res.error);
    btn.disabled = false;
    btn.innerText = "INICIAR TRANSMISSÃO";
  }
});

// ---------------------------------------------------------------------------
// Parar Transmissão
// ---------------------------------------------------------------------------

document.getElementById("btn-stop").addEventListener("click", async () => {
  const btn = document.getElementById("btn-stop");
  btn.disabled = true;
  btn.innerText = "Encerrando...";
  window.peerProvider?.destroy();
  await window.api.stopTransmission();
  window.location.reload();
});

// ---------------------------------------------------------------------------
// Status do ATEM
// ---------------------------------------------------------------------------

window.api.onStatusUpdate((status) => {
  const el = document.getElementById("status-atem");
  if (!el || status.type !== "atem") return;
  el.innerHTML = `ATEM: <b class="${status.connected ? "on" : "off"}">${
    status.connected ? "ONLINE" : "OFFLINE"
  }</b>`;
});

// ---------------------------------------------------------------------------
// Inputs do ATEM recebidos — exibe contagem e faz broadcast aos celulares
// ---------------------------------------------------------------------------

window.api.onAtemInputs((inputs) => {
  const syncEl = document.getElementById("sync-status");
  if (syncEl) {
    syncEl.innerText = `${inputs.length} câmeras sincronizadas.`;
    syncEl.style.color = "#4caf50";
  }
  // Envia lista de câmeras aos celulares já conectados via PeerJS
  window.peerProvider?.broadcastInputs(inputs);
});

// ---------------------------------------------------------------------------
// PeerJS — inicialização no renderer (WebRTC nativo do Chromium)
//
// Fluxo:
//   main.js → "peer-init"  → renderer chama peerProvider.init()
//   peer abre              → renderer gera QR Code
//   main.js → "tally-update" → renderer chama peerProvider.broadcastTally()
// ---------------------------------------------------------------------------

window.api.onPeerInit(async ({ sessionCode }) => {
  const syncEl = document.getElementById("sync-status");

  try {
    const peerId = await window.peerProvider.init(sessionCode);
    console.log("[Renderer] PeerJS pronto:", peerId);

    // Gera o QR Code após peer estar aberto e pronto para aceitar conexões
    const url = `https://tallylight-frontend.vercel.app/tally?session=${sessionCode}`;
    if (typeof QRCode !== "undefined") {
      QRCode.toCanvas(document.getElementById("qr-canvas"), url, {
        width: 200,
        margin: 2,
      });
    }

    if (syncEl && syncEl.innerText === "Aguardando câmeras...") {
      syncEl.innerText = "Aguardando cinegrafistas...";
      syncEl.style.color = "#888";
    }
  } catch (err) {
    console.error("[Renderer] Erro ao inicializar PeerJS:", err.message);
    if (syncEl) {
      syncEl.innerText = "Erro P2P: " + err.message;
      syncEl.style.color = "#e53935";
    }
  }
});

// Recebe tally do ATEM (via main) e faz broadcast P2P para os celulares
window.api.onTallyUpdate((data) => {
  window.peerProvider?.broadcastTally(data.program, data.preview);
});
