import "./App.css";

import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import NoSleep from "nosleep.js";

const SOCKET_SERVER = `http://${window.location.hostname}:3000`;

function App() {
  const [programCam, setProgramCam] = useState(null);
  const [myCam, setMyCam] = useState(1);
  const [connected, setConnected] = useState(false);
  const noSleep = useRef(new NoSleep());

  useEffect(() => {
    const socket = io(SOCKET_SERVER, { transports: ["websocket"] });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("tallyUpdate", (data) => {
      setProgramCam(data.program);
    });

    return () => socket.disconnect();
  }, []);

  const handleEnableNoSleep = () => {
    noSleep.current.enable();
    alert("Modo Tally Ativado: A tela não irá apagar.");
  };

  const isOnAir = programCam === parseInt(myCam);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isOnAir ? "#d32f2f" : "#2c2c2c",
        color: "white",
        transition: "background-color 0.3s ease",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <h2 style={{ opacity: 0.6 }}>CINEGRAFISTA</h2>

      <select
        value={myCam}
        onChange={(e) => setMyCam(e.target.value)}
        style={{ fontSize: "1.2rem", padding: "10px", margin: "20px 0" }}
      >
        {[1, 2].map((n) => (
          <option key={n} value={n}>
            Câmera {n}
          </option>
        ))}
      </select>

      <h1 style={{ fontSize: "4rem" }}>{isOnAir ? "ON AIR" : "OFF AIR"}</h1>

      <button
        onClick={handleEnableNoSleep}
        style={{ marginTop: "30px", padding: "10px" }}
      >
        Manter Tela Ligada
      </button>

      <footer
        style={{
          position: "absolute",
          bottom: 20,
          fontSize: "0.8rem",
          opacity: 0.5,
        }}
      >
        Status: {connected ? "Conectado" : "Desconectado"} | IP:{" "}
        {window.location.hostname}
      </footer>
    </div>
  );
}

export default App;
