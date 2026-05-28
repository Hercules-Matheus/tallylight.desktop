const { Atem } = require("atem-connection");
const path = require("path");

const store = require(path.join(__dirname, "StateStore"));

const TALLY_DEBOUNCE_MS = 300;

class AtemManager {
  constructor() {
    this.atem = new Atem();
    this.onInputsReceived = null;
    this._inputsRefreshed = false;
    this._tallyDebounceTimer = null;
    this._transitionInProgress = false;

    this.atem.on("connected", () => {
      console.log("[ATEM] Conectado!");
      store.setAtemStatus(true);
      this._inputsRefreshed = false;
      this._transitionInProgress = false;

      setTimeout(() => {
        this.refreshInputs();
        this._inputsRefreshed = true;
      }, 1000);
    });

    this.atem.on("disconnected", () => {
      console.log("[ATEM] Desconectado!");
      store.setAtemStatus(false);
      this._inputsRefreshed = false;
      this._transitionInProgress = false;
      if (this._tallyDebounceTimer) {
        clearTimeout(this._tallyDebounceTimer);
        this._tallyDebounceTimer = null;
      }
    });

    this.atem.on("stateChanged", (state, pathKeys) => {
      // 1. Refresh de inputs só quando há mudança real
      const inputsChanged =
        pathKeys && pathKeys.some((k) => k.startsWith("inputs."));
      if (inputsChanged && this.onInputsReceived) {
        this._inputsRefreshed = false;
        this.refreshInputs();
      }

      // 2. Tally com debounce robusto para cortes, autos e dissolves manuais
      const me = state.video?.mixEffects?.[0];
      if (!me) return;

      const tallyChanged =
        pathKeys &&
        pathKeys.some(
          (k) =>
            k.startsWith("video.mixEffects.0.programInput") ||
            k.startsWith("video.mixEffects.0.previewInput") ||
            k.startsWith("video.mixEffects.0.transitionPosition"),
        );

      if (!tallyChanged) return;

      if (this._tallyDebounceTimer) {
        clearTimeout(this._tallyDebounceTimer);
        this._tallyDebounceTimer = null;
      }

      const position = me.transitionPosition ?? 0;
      const isTransitioning = position > 0 && position < 9999;
      const program = me.programInput;
      const preview = me.previewInput;

      if (!isTransitioning) {
        // Hard cut ou transição concluída
        this._transitionInProgress = false;
        this._tallyDebounceTimer = setTimeout(() => {
          this._tallyDebounceTimer = null;
          console.log(`[ATEM] Tally → program:${program} preview:${preview}`);
          store.setTally({ program, preview });
        }, TALLY_DEBOUNCE_MS);
      } else {
        // Dissolve em progresso — aguarda estabilizar
        this._transitionInProgress = true;
        this._tallyDebounceTimer = setTimeout(() => {
          this._tallyDebounceTimer = null;
          this._transitionInProgress = false;
          console.log(
            `[ATEM] Dissolve parado → program:${program} preview:${preview}`,
          );
          store.setTally({ program, preview });
        }, 800);
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
      .filter((input) => input.id >= 1 && input.id <= 20);

    console.log(`[ATEM] ${formattedInputs.length} inputs encontrados.`);
    if (this.onInputsReceived) {
      this.onInputsReceived(formattedInputs);
    }
  }

  connect(ip) {
    console.log(`[ATEM] Conectando em: ${ip}`);
    this.atem.connect(ip);
  }

  cleanup() {
    if (this._tallyDebounceTimer) {
      clearTimeout(this._tallyDebounceTimer);
      this._tallyDebounceTimer = null;
    }
    this.onInputsReceived = null;
    this._inputsRefreshed = false;
    this._transitionInProgress = false;
  }
}

module.exports = new AtemManager();
