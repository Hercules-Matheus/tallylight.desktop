const DashboardUI = {
  render(sessionCode) {
    document.getElementById("screen-setup").style.display = "none";
    document.getElementById("screen-dash").style.display = "flex";
    document.getElementById("display-session").innerText =
      sessionCode.toUpperCase();

    const url = `https://tally-frontend.vercel.app/tally?session=${sessionCode}`;
    const canvas = document.getElementById("qr-canvas");

    // Usa a lib qrcode.js que você importou no HTML
    QRCode.toCanvas(canvas, url, { width: 200, margin: 2 });
  },
};
