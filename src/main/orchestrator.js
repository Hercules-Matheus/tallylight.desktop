const EventEmitter = require("events");
const atem = require("./core/AtemManager");
const store = require("./core/StateStore");

class Orchestrator extends EventEmitter {
  constructor() {
    super();
  }

  connectHardware(ip) {
    atem.onInputsReceived = (inputs) => {
      this.emit("inputs-updated", inputs);
    };
    atem.connect(ip);
  }

  startTallyFlow() {
    store.removeAllListeners("tallyUpdate");
    store.on("tallyUpdate", (data) => {
      // main.js captura este evento e repassa ao renderer via webContents.send
      this.emit("tally-changed", data);
    });
  }

  cleanup() {
    store.removeAllListeners("tallyUpdate");
    this.removeAllListeners("tally-changed");
    atem.cleanup();
  }
}

module.exports = new Orchestrator();