const { Atem } = require("atem-connection");
const store = require("./StateStore");

class AtemManager {
  constructor() {
    this.atem = new Atem();
    this.onStateChange = null;
    this.onInputsReceived = null;

    // Flag para evitar refreshInputs redundante durante stateChanged.
    // stateChanged dispara para qualquer mudança (corte, áudio, etc).
    // Sem esse controle, sincronizávamos inputs com Supabase a cada corte.
    this._inputsRefreshed = false;

    this.atem.on("connected", () => {
      console.log("[ATEM] Conectado!");
      store.setAtemStatus(true);
      this._inputsRefreshed = false;

      // Aguarda o estado completo ser populado antes de ler inputs
      setTimeout(() => {
        this.refreshInputs();
        this._inputsRefreshed = true;
      }, 1000);
    });

    this.atem.on("disconnected", () => {
      console.log("[ATEM] Desconectado!");
      store.setAtemStatus(false);
      this._inputsRefreshed = false;
    });

    this.atem.on("stateChanged", (state, pathKeys) => {
      // 1. Refresh de inputs APENAS se ainda não foi feito após a conexão,
      //    ou se o pathKeys indicar mudança explícita nos inputs.
      //    Antes: qualquer stateChanged com state.inputs disparava refreshInputs.
      const inputsChanged =
        pathKeys && pathKeys.some((k) => k.startsWith("inputs."));

      if (inputsChanged && this.onInputsReceived) {
        this._inputsRefreshed = false; // Força re-leitura
        this.refreshInputs();
      }

      // 2. Mudanças de corte (Program / Preview)
      if (state.video && state.video.mixEffects) {
        const me = state.video.mixEffects[0];
        if (me && this.onStateChange) {
          this.onStateChange({
            program: me.programInput,
            preview: me.previewInput,
          });
        }
      }
    });
  }

  refreshInputs() {
    if (!this.atem.state || !this.atem.state.inputs) return;

    const rawInputs = this.atem.state.inputs;
    const formattedInputs = Object.keys(rawInputs)
      .map((key) => {
        const input = rawInputs[key];
        return {
          id: input.inputId,
          name: input.longName || `Cam ${input.inputId}`,
        };
      })
      // Range padrão de câmeras físicas no ATEM Mini/Pro (ajuste se necessário)
      .filter((input) => input.id >= 1 && input.id <= 20);

    console.log(`[ATEM] ${formattedInputs.length} inputs encontrados.`);

    if (this.onInputsReceived) {
      this.onInputsReceived(formattedInputs);
    }
  }

  connect(ip) {
    console.log(`[ATEM] Tentando conectar em: ${ip}`);
    this.atem.connect(ip);
  }

  // Limpa callbacks — útil ao reconectar sem recriar a instância
  cleanup() {
    this.onStateChange = null;
    this.onInputsReceived = null;
    this._inputsRefreshed = false;
  }
}

module.exports = new AtemManager();