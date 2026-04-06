const AppNavigation = {
  screens: {
    auth: document.getElementById("screen-auth"),
    setup: document.getElementById("screen-setup"),
    dash: document.getElementById("screen-dash"),
  },
  goTo(name) {
    if (!this.screens[name]) return;
    Object.values(this.screens).forEach((s) => {
      if (s) s.style.display = "none";
    });
    this.screens[name].style.display = "flex";
  },
};

// --- Ação de Login ---
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-pass").value;
  const btn = document.getElementById("btn-login");

  if (!email || !pass) return alert("Preencha tudo!");

  btn.disabled = true;
  btn.innerText = "Verificando...";

  const res = await window.api.login({ email, password: pass });
  if (res.success) {
    const config = await window.api.getConfig();
    document.getElementById("atem-ip").value = config.atemIp || "";
    document.getElementById("session-code").value = config.sessionCode || "";
    AppNavigation.goTo("setup");
  } else {
    alert("Erro: " + res.error);
    btn.disabled = false;
    btn.innerText = "ACESSAR PAINEL";
  }
});

// --- Iniciar Transmissão ---
document.getElementById("btn-start").addEventListener("click", async () => {
  const btn = document.getElementById("btn-start");
  const atemIp = document.getElementById("atem-ip").value;
  const sessionCode = document
    .getElementById("session-code")
    .value.toUpperCase();

  btn.disabled = true;
  btn.innerText = "Conectando ao ATEM...";

  const res = await window.api.startTransmission({ atemIp, sessionCode });

  if (res.success) {
    document.getElementById("display-session").innerText = sessionCode;
    const url = `https://tally-frontend.vercel.app/tally?session=${sessionCode}`;

    if (typeof QRCode !== "undefined") {
      QRCode.toCanvas(document.getElementById("qr-canvas"), url, {
        width: 200,
        margin: 2,
      });
    }
    AppNavigation.goTo("dash");
  } else {
    alert("Falha: " + res.error);
    btn.disabled = false;
    btn.innerText = "INICIAR TRANSMISSÃO";
  }
});

// --- Status do ATEM ---
window.api.onStatusUpdate((status) => {
  const el = document.getElementById("status-atem");
  if (el && status.type === "atem") {
    el.innerHTML = `ATEM: <b class="${status.connected ? "on" : "off"}">${status.connected ? "ONLINE" : "OFFLINE"}</b>`;
  }
});

// --- Confirmação de Câmeras Sincronizadas ---
window.api.onAtemInputs((inputs) => {
  const syncEl = document.getElementById("sync-status");
  if (syncEl) {
    syncEl.innerText = `${inputs.length} câmeras sincronizadas com a nuvem.`;
    syncEl.style.color = "#4caf50";
  }
});

document
  .getElementById("btn-stop")
  .addEventListener("click", () => window.location.reload());
