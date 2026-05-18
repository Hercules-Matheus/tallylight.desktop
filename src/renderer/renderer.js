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

// ---------------------------------------------------------------------------
// Reset de Senha
// Fluxo: usuário clica "Esqueci senha" → digita email → Supabase envia email
// com link para o Vercel → usuário redefine no browser → loga normalmente.
// ---------------------------------------------------------------------------

document.getElementById("btn-forgot").addEventListener("click", () => {
  // Alterna visibilidade entre o form de login e o form de reset
  const authForm = document.getElementById("auth-form");
  const resetForm = document.getElementById("reset-form");
  authForm.style.display = "none";
  resetForm.style.display = "flex";
});

document.getElementById("btn-back-login").addEventListener("click", () => {
  document.getElementById("reset-form").style.display = "none";
  document.getElementById("auth-form").style.display = "flex";
  document.getElementById("reset-status").innerText = "";
});

document.getElementById("btn-send-reset").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value.trim();
  const btn = document.getElementById("btn-send-reset");
  const status = document.getElementById("reset-status");

  if (!email) return (status.innerText = "Informe o e-mail cadastrado.");

  btn.disabled = true;
  btn.innerText = "Enviando...";
  status.innerText = "";

  const res = await window.api.resetPassword(email);

  if (res.success) {
    // Não confirmamos se o email existe por segurança (evita user enumeration)
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
    document.getElementById("session-code").value = config.sessionCode || "";
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

document.getElementById("btn-start").addEventListener("click", async () => {
  const btn = document.getElementById("btn-start");
  const atemIp = document.getElementById("atem-ip").value.trim();
  const sessionCode = document
    .getElementById("session-code")
    .value.trim()
    .toUpperCase();

  if (!atemIp || !sessionCode) return alert("Preencha o IP e o código da sessão!");

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

// ---------------------------------------------------------------------------
// Parar Transmissão
// ---------------------------------------------------------------------------

// CORREÇÃO: antes chamava window.location.reload() direto, sem avisar o main
// de encerrar a sessão no Supabase. Agora chama stopTransmission e só recarrega
// após a confirmação, garantindo is_active: false no banco.
document.getElementById("btn-stop").addEventListener("click", async () => {
  const btn = document.getElementById("btn-stop");
  btn.disabled = true;
  btn.innerText = "Encerrando...";

  await window.api.stopTransmission();
  window.location.reload();
});

// ---------------------------------------------------------------------------
// Status do ATEM (Online / Offline)
// ---------------------------------------------------------------------------

window.api.onStatusUpdate((status) => {
  const el = document.getElementById("status-atem");
  if (!el || status.type !== "atem") return;
  el.innerHTML = `ATEM: <b class="${status.connected ? "on" : "off"}">${
    status.connected ? "ONLINE" : "OFFLINE"
  }</b>`;
});

// ---------------------------------------------------------------------------
// Câmeras sincronizadas
// ---------------------------------------------------------------------------

// CORREÇÃO: o canal emitido pelo main era "atem-inputs-data" mas o preload
// ouvia "atem-inputs". Agora ambos usam "atem-inputs" (corrigido no main.js).
window.api.onAtemInputs((inputs) => {
  const syncEl = document.getElementById("sync-status");
  if (!syncEl) return;
  syncEl.innerText = `${inputs.length} câmeras sincronizadas com a nuvem.`;
  syncEl.style.color = "#4caf50";
});