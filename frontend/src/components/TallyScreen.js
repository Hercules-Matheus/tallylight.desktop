import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NoSleep from "nosleep.js";
import { VERSION } from "../version";

export default function TallyScreen() {
  const [searchParams] = useSearchParams();
  const session = searchParams.get("session");
  const camFromUrl = searchParams.get("cam") || "1";

  const [tally, setTally] = useState({ program: 0, preview: 0 });
  const [myCam, setMyCam] = useState(camFromUrl);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("connecting");
  const noSleep = useRef(new NoSleep());

  const audioProgram = useRef(new Audio("/sounds/program.mp3"));
  const audioPreview = useRef(new Audio("/sounds/preview.mp3"));
  const audioOff = useRef(new Audio("/sounds/off.mp3"));

  const playAudio = useCallback(
    (type) => {
      if (!isAudioEnabled) return;
      const audios = {
        program: audioProgram.current,
        preview: audioPreview.current,
        off: audioOff.current,
      };
      const target = audios[type];
      if (target) {
        Object.values(audios).forEach((a) => {
          a.pause();
          a.currentTime = 0;
        });
        target.play().catch((e) => console.warn("Erro ao tocar áudio:", e));
      }
    },
    [isAudioEnabled],
  );

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`tally_${session}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tally_sessions",
          filter: `session_code=eq.${session}`,
        },
        (payload) => {
          const newTally = {
            program: payload.new.program_cam,
            preview: payload.new.preview_cam,
          };
          const isNowProgram = parseInt(newTally.program) === parseInt(myCam);
          const isNowPreview = parseInt(newTally.preview) === parseInt(myCam);
          const wasInTally =
            parseInt(tally.program) === parseInt(myCam) ||
            parseInt(tally.preview) === parseInt(myCam);

          if (isNowProgram) playAudio("program");
          else if (isNowPreview) playAudio("preview");
          else if (wasInTally && !isNowProgram && !isNowPreview)
            playAudio("off");

          setTally(newTally);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setCloudStatus("connected");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, myCam, playAudio, tally]);

  const isOnProgram = parseInt(tally.program) === parseInt(myCam);
  const isOnPreview = parseInt(tally.preview) === parseInt(myCam);

  if (!session)
    return (
      <div style={styles.containerError}>
        <h2>⚠️ Link Inválido</h2>
        <footer style={styles.footer}>v{VERSION}</footer>
      </div>
    );
  if (cloudStatus === "connecting")
    return (
      <div style={styles.containerTally}>
        <p>Conectando à nuvem...</p>
      </div>
    );

  return (
    <div
      style={{
        ...styles.containerTally,
        backgroundColor: isOnProgram
          ? "#d32f2f"
          : isOnPreview
            ? "#2e7d32"
            : "#1a1a1a",
      }}
    >
      <h1 style={{ fontSize: "10rem", margin: 0 }}>{myCam}</h1>
      <h2 style={{ fontSize: "2rem", opacity: 0.8 }}>
        {isOnProgram ? "NO AR" : isOnPreview ? "PREVIEW" : "STANDBY"}
      </h2>
      {!isAudioEnabled && (
        <button
          onClick={() => {
            noSleep.current.enable();
            setIsAudioEnabled(true);
            audioOff.current.play().catch(() => {});
          }}
          style={styles.btnNoSleepActive}
        >
          ENTRAR NA SESSÃO
        </button>
      )}
      <select
        value={myCam}
        onChange={(e) => setMyCam(e.target.value)}
        style={styles.select}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <option key={n} value={n}>
            Câmera {n}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  containerTally: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    backgroundColor: "#1a1a1a",
    fontFamily: "sans-serif",
  },
  containerError: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    backgroundColor: "#d32f2f",
    textAlign: "center",
    padding: "20px",
  },
  btnNoSleepActive: {
    marginTop: "40px",
    padding: "20px 40px",
    backgroundColor: "#ff9800",
    border: "none",
    color: "white",
    borderRadius: "40px",
    fontWeight: "bold",
    fontSize: "1.2rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  },
  select: {
    marginTop: "50px",
    fontSize: "1.2rem",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    opacity: 0.5,
    fontSize: "0.8rem",
  },
};
