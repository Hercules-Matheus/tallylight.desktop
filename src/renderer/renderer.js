// ---------------------------------------------------------------------------
// Navegação entre telas
// ---------------------------------------------------------------------------

const AppNavigation = {
  screens: {
    auth: document.getElementById("screen-auth"),
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
// Alternância entre auth-form e reset-form
// ---------------------------------------------------------------------------

function switchAuthForm(showId, hideId, focusSelector) {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  document.getElementById(hideId).style.display = "none";
  document.getElementById(showId).style.display = "flex";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector(focusSelector);
      if (el) el.focus();
    });
  });
}

document.getElementById("btn-forgot").addEventListener("click", () => {
  switchAuthForm("reset-form", "auth-form", "#reset-email");
});

document.getElementById("btn-back-login").addEventListener("click", () => {
  switchAuthForm("auth-form", "reset-form", "#login-email");
});

// ---------------------------------------------------------------------------
// Reset de senha
// ---------------------------------------------------------------------------

document
  .getElementById("btn-send-reset")
  .addEventListener("click", async () => {
    const email = document.getElementById("reset-email").value.trim();
    const btn = document.getElementById("btn-send-reset");

    if (!email) return (status.innerText = "Informe o e-mail cadastrado.");

    btn.disabled = true;
    btn.innerText = "Enviando...";
    status.innerText = "";

    const res = await window.api.resetPassword(email);

    if (res.success) {
      status.style.color = "#4caf50";
      status.innerText =
        "Se este e-mail estiver cadastrado, você receberá as instruções em breve.";
      btn.innerText = "E-mail Enviado";
    } else {
      status.style.color = "#e53935";
      status.innerText = "Erro: " + res.error;
      btn.disabled = false;
      btn.innerText = "ENVIAR INSTRUÇÕES";
    }
  });

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-pass").value;
  const btn = document.getElementById("btn-login");

  if (!email || !pass) return alert("Preencha todos os campos!");

  btn.disabled = true;
  btn.innerText = "Verificando...";

  const res = await window.api.login({ email, password: pass });

  if (res.success) {
    const config = await window.api.getConfig();
    document.getElementById("atem-ip").value = config.atemIp || "";
    AppNavigation.goTo("setup");
  } else {
    alert("Erro: " + res.error);
    btn.disabled = false;
    btn.innerText = "ACESSAR PAINEL";
  }
});

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
