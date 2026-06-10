const { Atem } = require("atem-connection");
const path = require("path");

const store = require(path.join(__dirname, "StateStore"));

const TALLY_DEBOUNCE_MS = 100;

class AtemManager {
  constructor() {
    this.atem = new Atem();
    this.onInputsReceived = null;
    this._inputsRefreshed = false;
    this._tallyDebounceTimer = null;

    this.atem.on("connected", () => {
      console.log("[ATEM] Conectado!");
      store.setAtemStatus(true);
      this._inputsRefreshed = false;

      setTimeout(() => {
        this.refreshInputs();
        this._inputsRefreshed = true;
      }, 1000);
    });

    this.atem.on("disconnected", () => {
      console.log("[ATEM] Desconectado!");
      store.setAtemStatus(false);
      this._inputsRefreshed = false;
      if (this._tallyDebounceTimer) {
        clearTimeout(this._tallyDebounceTimer);
        this._tallyDebounceTimer = null;
      }
    });

    this.atem.on("stateChanged", (state, pathKeys) => {
      const inputsChanged =
        pathKeys && pathKeys.some((k) => k.startsWith("inputs."));
      if (inputsChanged && this.onInputsReceived) {
        this._inputsRefreshed = false;
        this.refreshInputs();
      }

      const me = state.video?.mixEffects?.[0];
      if (!me) return;

      const tallyChanged =
        pathKeys &&
        pathKeys.some(
          (k) =>
            k.startsWith("video.mixEffects.0.programInput") ||
            k.startsWith("video.mixEffects.0.previewInput") ||
            k.startsWith("video.mixEffects.0.inTransition") ||
            k.startsWith("video.mixEffects.0.transitionPosition"),
        );

      if (!tallyChanged) return;

      if (this._tallyDebounceTimer) {
        clearTimeout(this._tallyDebounceTimer);
        this._tallyDebounceTimer = null;
      }

      const program = me.programInput;
      const preview = me.previewInput;

      const isTransitioning =
        me.inTransition === true ||
        (me.transitionPosition > 0 && me.transitionPosition < 9999);

      if (isTransitioning) {
        console.log(
          `[ATEM] [TRANSIÇÃO] Ambas On Air → Cam ${program} & Cam ${preview}`,
        );
        store.setTally({
          program: [program, preview],
          preview: 0,
        });
      } else {
        this._tallyDebounceTimer = setTimeout(() => {
          this._tallyDebounceTimer = null;
          console.log(
            `[ATEM] Tally Estabilizado → program:${program} preview:${preview}`,
          );
          store.setTally({ program, preview });
        }, TALLY_DEBOUNCE_MS);
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
  }
}

module.exports = new AtemManager();
