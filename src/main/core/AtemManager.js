const { Atem } = require("atem-connection");
const store = require("./StateStore");

class AtemManager {
  constructor() {
    this.atem = new Atem();
    this.onStateChange = null; // Callback para cortes (Program/Preview)
    this.onInputsReceived = null; // NOVO: Callback para nomes das câmeras

    // Monitoramento de Conexão
    this.atem.on("connected", () => {
      console.log("ATEM Conectado!");
      store.setAtemStatus(true);

      // Assim que conecta, vamos ler os inputs disponíveis
      setTimeout(() => {
        this.refreshInputs();
      }, 1000);
    });

    this.atem.on("disconnected", () => {
      console.log("ATEM Desconectado!");
      store.setAtemStatus(false);
    });

    // Monitoramento de Mudança de Estado (Cortes)
    this.atem.on("stateChanged", (state) => {
      // 1. Verificar se houve mudança nos nomes das câmeras (Inputs)
      if (state.inputs && this.onInputsReceived) {
        this.refreshInputs();
      }

      // 2. Verificar cortes de vídeo
      if (state.video && state.video.mixEffects) {
        const me = state.video.mixEffects[0];
        if (me) {
          const data = {
            program: me.programInput,
            preview: me.previewInput,
          };

          if (this.onStateChange) {
            this.onStateChange(data);
          }
        }
      }
    });
  }

  // Método para extrair e formatar os nomes das câmeras
  refreshInputs() {
    if (!this.atem.state || !this.atem.state.inputs) return;

    // Filtra apenas os inputs que são câmeras ou entradas físicas (evita Color Bars, Black, etc, se desejar)
    const rawInputs = this.atem.state.inputs;
    const formattedInputs = Object.keys(rawInputs)
      .map((key) => {
        const input = rawInputs[key];
        return {
          id: input.inputId,
          name: input.longName || `Cam ${input.inputId}`,
        };
      })
      .filter((input) => input.id > 0 && input.id <= 20); // Ajuste o range conforme seu ATEM

    if (this.onInputsReceived) {
      this.onInputsReceived(formattedInputs);
    }
  }

  connect(ip) {
    console.log(`Tentando conectar ao ATEM em: ${ip}`);
    this.atem.connect(ip);
  }
}

module.exports = new AtemManager();
