import "./App.css";
import { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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
  const [previewCam, setPreviewCam] = useState(null);
  const [serverIp, setServerIp] = useState("");
  const [serverPort, setServerPort] = useState(58000);
  const [atemIp, setAtemIp] = useState("");
  const [atemStatus, setAtemStatus] = useState(false);
  const [availableInputs, setAvailableInputs] = useState([]);
  const [allIps, setAllIps] = useState([]);

  useEffect(() => {
    socket.on("tallyUpdate", (data) => {
      setProgramCam(data.program);
      setPreviewCam(data.preview);
    });
    socket.on("current-ip", (ip) => setAtemIp(ip));
    socket.on("server-ip", (ip) => setServerIp(ip));
    socket.on("server-port", (port) => setServerPort(port));
    socket.on("available-inputs", (inputs) => setAvailableInputs(inputs));
    socket.on("all-server-ips", (ips) => setAllIps(ips));
    socket.on("status-atem", (data) => setAtemStatus(!!data.connected));

    return () => {
      socket.off("tallyUpdate");
      socket.off("current-ip");
      socket.off("server-ip");
      socket.off("server-port");
      socket.off("status-atem");
      socket.off("available-inputs");
      socket.off("all-server-ips");
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <TallyScreen
              programCam={programCam}
              previewCam={previewCam}
              atemStatus={atemStatus}
              availableInputs={availableInputs}
            />
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
              setServerIp={setServerIp}
              allIps={allIps}
            />
          }
        />
      </Routes>
    </Router>
  );
}

// --- TELA DO CINEGRAFISTA ---
const TallyScreen = ({
  programCam,
  previewCam,
  atemStatus,
  availableInputs,
}) => {
  const [myCam, setMyCam] = useState(1);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const noSleep = useRef(new NoSleep());

  // Refs de Áudio
  const audioProgram = useRef(new Audio("/sounds/program.mp3"));
  const audioPreview = useRef(new Audio("/sounds/preview.mp3"));
  const audioOff = useRef(new Audio("/sounds/off.mp3"));

  // Lógica de Comparação
  const isOnProgram = parseInt(programCam) === parseInt(myCam);
  const isOnPreview = parseInt(previewCam) === parseInt(myCam);

  // Referência para detectar MUDANÇA de estado (evita repetição de som)
  const prevStatus = useRef({ program: false, preview: false });

  useEffect(() => {
    if (!isAudioEnabled) return;

    // Função auxiliar para tocar áudio do zero (limpa os outros antes)
    const playAudio = (audioRef) => {
      [audioProgram, audioPreview, audioOff].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
      audioRef.current.play().catch((e) => console.log("Erro ao tocar:", e));
    };

    // 1. Entrou em PROGRAM (No Ar)
    if (isOnProgram && !prevStatus.current.program) {
      playAudio(audioProgram); // <--- Usando a função auxiliar agora
    }
    // 2. Entrou em PREVIEW (Preview)
    else if (isOnPreview && !prevStatus.current.preview) {
      playAudio(audioPreview); // <--- Usando a função auxiliar agora
    }
    // 3. Saiu do AR (Fora do Ar)
    else if (
      (prevStatus.current.program || prevStatus.current.preview) &&
      !isOnProgram &&
      !isOnPreview
    ) {
      playAudio(audioOff); // <--- Usando a função auxiliar agora
    }

    // Salva o estado atual para a próxima comparação
    prevStatus.current = { program: isOnProgram, preview: isOnPreview };
  }, [isOnProgram, isOnPreview, isAudioEnabled]);

  const getBackgroundColor = () => {
    if (isOnProgram) return "#d32f2f";
    if (isOnPreview) return "#2e7d32";
    return "#2c2c2c";
  };

  const handleStartSession = () => {
    noSleep.current.enable();
    setIsAudioEnabled(true);
    // Toca um som de teste silencioso apenas para destravar o áudio no mobile
    audioOff.current.play().catch(() => {});
  };

  return (
    <div
      style={{
        ...styles.containerTally,
        backgroundColor: getBackgroundColor(),
        transition: "background-color 0.2s ease",
      }}
    >
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ opacity: 0.6, margin: 0, fontSize: "0.8rem" }}>
            CINEGRAFISTA
          </h2>
          {isAudioEnabled && (
            <span style={{ fontSize: "0.7rem", color: "#4caf50" }}>
              🔊 ÁUDIO ATIVO
            </span>
          )}
        </div>
        <Link to="/admin" style={styles.btnSettings}>
          ⚙️
        </Link>
      </div>

      <select
        value={myCam}
        onChange={(e) => setMyCam(e.target.value)}
        style={styles.select}
      >
        {availableInputs.length > 0 ? (
          availableInputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.label}
            </option>
          ))
        ) : (
          <option value="">Buscando câmeras...</option>
        )}
      </select>

      <h1 style={{ fontSize: "5rem", textAlign: "center" }}>
        {isOnProgram ? "ON AIR" : isOnPreview ? "PREVIEW" : "OFF AIR"}
      </h1>

      {!isAudioEnabled ? (
        <button onClick={handleStartSession} style={styles.btnNoSleepActive}>
          ATIVAR TALLY (TELA + SOM)
        </button>
      ) : (
        <button
          onClick={() => {
            noSleep.current.disable();
            setIsAudioEnabled(false);
          }}
          style={styles.btnNoSleep}
        >
          Desativar Modo Produção
        </button>
      )}

      <footer style={styles.footer}>
        Status: {atemStatus ? "Conectado ✅" : "Desconectado ❌"} | v{VERSION}
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
  setServerIp,
  allIps,
}) => {
  const [localIp, setLocalIp] = useState(atemIp);
  const [isUpdating, setIsUpdating] = useState(false);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
      setLocalIp(atemIp);
      setIsUpdating(false);
    }
  }, [atemIp]);

  const handleSaveIp = () => {
    if (!localIp) return alert("Digite um IP válido!");
    setIsUpdating(true);
    setAtemIp(localIp);
    socket.emit("update-atem-ip", localIp);
    setTimeout(() => setIsUpdating(false), 5000);
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
          disabled={isUpdating}
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
            onClick={() => {
              setLocalIp(atemIp);
              isTyping.current = false;
              setIsUpdating(false);
            }}
            style={{ ...styles.btnSave, backgroundColor: "#555", flex: 1 }}
          >
            Reset
          </button>
        </div>
      </div>

      <select
        value={serverIp}
        onChange={(e) => setServerIp(e.target.value)}
        style={styles.selectNetwork}
      >
        {allIps.map((ip) => (
          <option key={ip.address} value={ip.address}>
            {ip.name}: {ip.address} {ip.isTailscale ? "(VPN/Tailscale)" : ""}
          </option>
        ))}
      </select>

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
    overflow: "hidden",
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
    borderRadius: "5px",
    border: "none",
  },
  btnSave: {
    width: "100%",
    padding: "10px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  accessBox: {
    marginTop: "20px",
    textAlign: "center",
    background: "white",
    padding: "15px",
    borderRadius: "10px",
    color: "black",
  },
  selectNetwork: {
    width: "300px",
    marginTop: "20px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "white",
    fontSize: "0.9rem",
  },
  linkCode: {
    display: "block",
    marginTop: "10px",
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  btnBack: { color: "white", marginTop: "20px", textDecoration: "underline" },
  select: {
    fontSize: "1.5rem",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "#333", // Use cor sólida em vez de rgba para o PC
    color: "white",
    border: "1px solid #555",
    width: "250px", // Largura fixa evita que ele "estique" no PC
    cursor: "pointer",
    outline: "none",
    WebkitAppearance: "menulist", // Força o visual de lista no Desktop
  },
  btnNoSleep: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#ffffff33",
    border: "1px solid white",
    color: "white",
    borderRadius: "20px",
  },
  btnNoSleepActive: {
    marginTop: "20px",
    padding: "15px 30px",
    backgroundColor: "#ff9800",
    border: "none",
    color: "white",
    borderRadius: "30px",
    fontWeight: "bold",
    fontSize: "1rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    opacity: 0.5,
    fontSize: "0.8rem",
  },
};

export default App;
