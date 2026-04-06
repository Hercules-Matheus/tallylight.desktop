const ConnectionUI = {
  async handleStart() {
    const atemIp = document.getElementById("atem-ip").value;
    const sessionCode = document.getElementById("session-code").value;

    const result = await window.api.startTransmission({ atemIp, sessionCode });
    if (result.success) {
      DashboardUI.render(sessionCode);
    }
  },
};
