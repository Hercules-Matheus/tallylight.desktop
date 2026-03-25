import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import io from "socket.io-client";
import NoSleep from "nosleep.js";
import { QRCodeCanvas } from "qrcode.react";
import { VERSION } from "./version";

// Configuração do Socket
const currentPort = window.location.port;
const SOCKET_PORT =
  currentPort === "3001" || !currentPort ? "58000" : currentPort;
const SOCKET_SERVER = `http://${window.location.hostname}:${SOCKET_PORT}`;
const socket = io(SOCKET_SERVER, { transports: ["websocket"] });

function App() {
  const [programCam, setProgramCam] = useState(null);
  const [serverIp, setServerIp] = useState("");
  const [serverPort, setServerPort] = useState(58000);
  const [atemIp, setAtemIp] = useState("");
  const [atemStatus, setAtemStatus] = useState(false);

  useEffect(() => {
    socket.on("tallyUpdate", (data) => setProgramCam(data.program));
    socket.on("current-ip", (ip) => setAtemIp(ip));
    socket.on("server-ip", (ip) => setServerIp(ip));
    socket.on("server-port", (port) => setServerPort(port));

    // VALIDAÇÃO REAL: O backend envia o status real do hardware
    socket.on("status-atem", (data) => {
      if (data.connected === true) {
        setAtemStatus(true);
      } else {
        setAtemStatus(false);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("tallyUpdate");
      socket.off("current-ip");
      socket.off("server-ip");
      socket.off("server-port");
      socket.off("status-atem");
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <TallyScreen programCam={programCam} atemStatus={atemStatus} />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminScreen
              atemIp={atemIp}
              setAtemIp={setAtemIp}
              atemStatus={atemStatus}
              serverIp={serverIp}
              serverPort={serverPort}
            />
          }
        />
      </Routes>
    </Router>
  );
}

// --- TELA DO CINEGRAFISTA ---
const TallyScreen = ({ programCam, atemStatus }) => {
  const [myCam, setMyCam] = useState(1);
  const noSleep = useRef(new NoSleep());
  const isOnAir = programCam === parseInt(myCam);

  return (
    <div
      style={{
        ...styles.containerTally,
        backgroundColor: isOnAir ? "#d32f2f" : "#2c2c2c",
      }}
    >
      <div style={styles.header}>
        <h2 style={{ opacity: 0.6, margin: 0, fontSize: "1rem" }}>
          CINEGRAFISTA
        </h2>
        <Link to="/admin" style={styles.btnSettings}>
          ⚙️
        </Link>
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

      <h1 style={{ fontSize: "5rem" }}>{isOnAir ? "ON AIR" : "OFF AIR"}</h1>

      <button
        onClick={() => {
          noSleep.current.enable();
          alert("Tela Bloqueada!");
        }}
        style={styles.btnNoSleep}
      >
        Manter Tela Ligada
      </button>

      <footer style={styles.footer}>
        Status: {atemStatus ? "Conectado" : "Desconectado"} | v{VERSION}
      </footer>
    </div>
  );
};

// --- TELA ADMIN ---
const AdminScreen = ({
  atemIp,
  setAtemIp,
  atemStatus,
  serverIp,
  serverPort,
}) => {
  const [localIp, setLocalIp] = useState(atemIp);
  const [isUpdating, setIsUpdating] = useState(false); // Trava de UI
  const isTyping = useRef(false);

  // Sincroniza o campo apenas quando a prop mudar e o usuário NÃO estiver digitando
  useEffect(() => {
    if (!isTyping.current) {
      setLocalIp(atemIp);
      setIsUpdating(false); // Libera o input quando o IP atualizado chegar do servidor
    }
  }, [atemIp]);

  const handleSaveIp = () => {
    if (!localIp) return alert("Digite um IP válido!");

    setIsUpdating(true); // Bloqueia o formulário
    setAtemIp(localIp);
    socket.emit("update-atem-ip", localIp);

    // Timeout de segurança: libera após 5s se o backend não responder
    setTimeout(() => setIsUpdating(false), 5000);
  };

  const handleReset = () => {
    setLocalIp(atemIp);
    isTyping.current = false;
    setIsUpdating(false);
  };

  return (
    <div style={styles.containerAdmin}>
      <h2>⚙️ CONFIGURAÇÃO</h2>
      <div style={{ ...styles.card, opacity: isUpdating ? 0.7 : 1 }}>
        <p
          style={{
            fontWeight: "bold",
            color: isUpdating ? "#ff9800" : atemStatus ? "#4caf50" : "#f44336",
          }}
        >
          {isUpdating
            ? "🔄 RECONECTANDO..."
            : atemStatus
              ? "CONECTADO ✅"
              : "DESCONECTADO ❌"}
        </p>

        <input
          style={{
            ...styles.input,
            cursor: isUpdating ? "not-allowed" : "text",
          }}
          value={localIp}
          disabled={isUpdating} // Impede interação durante o "lag"
          onFocus={() => (isTyping.current = true)}
          onBlur={() => (isTyping.current = false)}
          onChange={(e) => setLocalIp(e.target.value)}
          placeholder="IP do ATEM (ex: 127.0.0.1)"
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSaveIp}
            disabled={isUpdating}
            style={{
              ...styles.btnSave,
              backgroundColor: isUpdating ? "#666" : "#2e7d32",
              flex: 2,
            }}
          >
            {isUpdating ? "Aguarde..." : "Atualizar IP"}
          </button>

          <button
            onClick={handleReset}
            style={{ ...styles.btnSave, backgroundColor: "#555", flex: 1 }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={styles.accessBox}>
        <QRCodeCanvas value={`http://${serverIp}:${serverPort}`} size={128} />
        <code style={styles.linkCode}>
          http://{serverIp}:{serverPort}
        </code>
      </div>

      <Link to="/" style={styles.btnBack}>
        Voltar ao Tally
      </Link>
    </div>
  );
};

const styles = {
  containerTally: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    position: "relative",
  },
  containerAdmin: {
    height: "100vh",
    backgroundColor: "#1a1a1a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
    zIndex: 999,
  },
  btnSettings: { textDecoration: "none", fontSize: "2rem" },
  card: {
    background: "#333",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  btnSave: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
  },
  accessBox: {
    marginTop: "20px",
    textAlign: "center",
    background: "white",
    padding: "15px",
    borderRadius: "10px",
    color: "black",
  },
  linkCode: {
    display: "block",
    marginTop: "10px",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  btnBack: { color: "white", marginTop: "20px", textDecoration: "underline" },
  select: { fontSize: "1.5rem", padding: "10px" },
  btnNoSleep: { marginTop: "20px", padding: "10px 20px" },
  footer: { position: "absolute", bottom: 20, opacity: 0.5 },
};

export default App;
