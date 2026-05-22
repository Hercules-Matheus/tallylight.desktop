const EventEmitter = require("events");

class StateStore extends EventEmitter {
  constructor() {
    super();
    this.state = {
      atemConnected: false,
      tally: { program: 0, preview: 0 },
    };
  }

  setAtemStatus(online) {
    this.state.atemConnected = online;
    this.emit("statusChange", online);
  }

  setTally(data) {
    this.state.tally = data;
    this.emit("tallyUpdate", data);
  }
}

module.exports = new StateStore();