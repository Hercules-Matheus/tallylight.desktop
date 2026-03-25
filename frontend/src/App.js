import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import NoSleep from "nosleep.js";
import { QRCodeCanvas } from "qrcode.react";

// 1. Descobre em qual porta o navegador abriu o site
const currentPort = window.location.port;

// 2. Se não houver porta (ex: rodando via file://) ou se for 3001 (React Dev),
// usamos a 58000 como fallback. Caso contrário, usamos a porta atual da URL.
const SOCKET_PORT =
  currentPort === "3001" || !currentPort ? "58000" : currentPort;

const SOCKET_SERVER = `http://${window.location.hostname}:${SOCKET_PORT}`;

// 3. Inicializa o socket
const socket = io(SOCKET_SERVER, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  timeout: 10000,
});

function App() {
  // Estados do Tally (Cinegrafista)
  const [programCam, setProgramCam] = useState(null);
  const [myCam, setMyCam] = useState(1);
  const [connected, setConnected] = useState(false);
  const noSleep = useRef(new NoSleep());
  const [serverIp, setServerIp] = useState("");

  // Estados de Configuração (Admin)
  const [isAdmin, setIsAdmin] = useState(false); // Alterna entre Telas
  const [atemIp, setAtemIp] = useState("");
  const [atemStatus, setAtemStatus] = useState("Desconhecido");
  const [serverPort, setServerPort] = useState(58000); // Porta base

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("tallyUpdate", (data) => setProgramCam(data.program));

    // Escuta o IP vindo do backend
    socket.on("current-ip", (ip) => setAtemIp(ip));

    // Escuta o status real do ATEM
    socket.on("status-atem", (data) => {
      setAtemStatus(data.connected ? "Conectado ✅" : "Erro na Conexão ❌");
    });

    socket.on("server-ip", (ip) => {
      setServerIp(ip);
    });

    socket.on("server-port", (port) => {
      setServerPort(port);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("tallyUpdate");
      socket.off("current-ip");
      socket.off("status-atem");
      socket.off("server-ip");
      socket.off("server-port");
    };
  }, []);

  const handleSaveIp = () => {
    // Validação básica de formato de IP (0.0.0.0 até 255.255.255.255)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

    if (ipRegex.test(atemIp) && atemIp) {
      socket.emit("update-atem-ip", atemIp);
      alert("IP enviado com sucesso!");
    } else {
      alert("Por favor, digite um endereço IP válido (ex: 192.168.1.240)");
    }
  };

  const handleEnableNoSleep = () => {
    noSleep.current.enable();
    alert("Modo Tally Ativado: A tela não irá apagar.");
  };

  const isOnAir = programCam === parseInt(myCam);

  // --- TELA DE CONFIGURAÇÃO (ADMIN) ---
  if (isAdmin) {
    return (
      <div style={styles.containerAdmin}>
        <h2>⚙️ CONFIGURAÇÃO ATEM</h2>
        <div style={styles.card}>
          <p>Status: {atemStatus}</p>
          <input
            type="text"
            value={atemIp}
            placeholder="IP do ATEM (Ex: 192.168.1.240)"
            onChange={(e) => setAtemIp(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleSaveIp} style={styles.btnSave}>
            Atualizar IP
          </button>
        </div>
        <div style={styles.accessBox}>
          <p style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: "5px" }}>
            ACESSO PARA CINEGRAFISTAS:
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <QRCodeCanvas
              value={`http://${serverIp}:${serverPort}`}
              size={128}
              bgColor={"#000"}
              fgColor={"#4fc3f7"}
              level={"L"}
              style={{
                marginBottom: "10px",
                border: "5px solid #fff",
                borderRadius: "4px",
              }}
            />
            <code style={styles.linkCode}>
              http://{serverIp}:{serverPort}
            </code>
          </div>
          <p
            style={{ fontSize: "0.7rem", marginTop: "10px", color: "#ff9800" }}
          >
            ⚠️ Certifique-se de que o celular está no mesmo Wi-Fi.
          </p>
        </div>
        <button onClick={() => setIsAdmin(false)} style={styles.btnBack}>
          Voltar para Tally
        </button>
      </div>
    );
  }

  // --- TELA DO CINEGRAFISTA (TALLY) ---
  return (
    <div
      style={{
        ...styles.containerTally,
        backgroundColor: isOnAir ? "#d32f2f" : "#2c2c2c",
      }}
    >
      <div style={styles.header}>
        <h2 style={{ opacity: 0.6, margin: 0 }}>CINEGRAFISTA</h2>
        <button onClick={() => setIsAdmin(true)} style={styles.btnSettings}>
          ⚙️
        </button>
      </div>

      <select
        value={myCam}
        onChange={(e) => setMyCam(e.target.value)}
        style={styles.select}
      >
        {[1, 2, 3, 4].map((n) => (
          <option key={n} value={n}>
            Câmera {n}
          </option>
        ))}
      </select>

      <h1 style={{ fontSize: "5rem", margin: "10px 0" }}>
        {isOnAir ? "ON AIR" : "OFF AIR"}
      </h1>

      <button onClick={handleEnableNoSleep} style={styles.btnNoSleep}>
        Manter Tela Ligada
      </button>

      <footer style={styles.footer}>
        Status: {connected ? "Conectado ao Server" : "Desconectado"} | IP:{" "}
        {window.location.hostname}
      </footer>
    </div>
  );
}

// Estilos básicos para manter tudo organizado
const styles = {
  containerTally: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    transition: "background-color 0.3s ease",
    fontFamily: "sans-serif",
    textAlign: "center",
  },
  containerAdmin: {
    height: "100vh",
    backgroundColor: "#1a1a1a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  header: {
    position: "absolute",
    top: 20,
    width: "90%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#333",
    padding: "20px",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "300px",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    boxSizing: "border-box",
    fontSize: "1rem",
  },
  select: {
    fontSize: "1.5rem",
    padding: "10px",
    margin: "20px 0",
    borderRadius: "5px",
  },
  btnSave: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnBack: {
    marginTop: "20px",
    background: "none",
    border: "1px solid white",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  btnSettings: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  btnNoSleep: {
    marginTop: "30px",
    padding: "15px 25px",
    borderRadius: "50px",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    fontSize: "0.8rem",
    opacity: 0.5,
  },
  accessBox: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#000",
    borderRadius: "8px",
    border: "1px dashed #444",
  },
  linkCode: {
    fontSize: "1.2rem",
    color: "#4fc3f7",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
};

export default App;
