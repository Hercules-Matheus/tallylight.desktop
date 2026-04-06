const EventEmitter = require("events");
const atem = require("./core/AtemManager");
const cloud = require("./providers/SupabaseProvider");

class Orchestrator extends EventEmitter {
  constructor() {
    super(); // Inicializa o emissor de eventos
  }

  connectHardware(ip) {
    // Configura o listener de inputs ANTES de conectar
    atem.onInputsReceived = (inputs) => {
      // Dispara o evento que o main.js está esperando (.once)
      this.emit("inputs-updated", inputs);
    };

    atem.connect(ip);
  }

  startTallyFlow(sessionCode) {
    // Callback acionado a cada corte no ATEM
    atem.onStateChange = async (data) => {
      // 'data' contém { program, preview }
      await cloud.updateTally(data.program, data.preview);
    };
  }
}

// Exporta uma instância da classe, assim ela possui os métodos .on() e .once()
module.exports = new Orchestrator();
