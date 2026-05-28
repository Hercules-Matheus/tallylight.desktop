const EventEmitter = require("events");
const path = require("path");

const atem = require(path.join(__dirname, "core", "AtemManager"));
const store = require(path.join(__dirname, "core", "StateStore"));

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
