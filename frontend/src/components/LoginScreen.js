import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Acesso negado. Verifique suas credenciais.");
      setLoading(false);
    } else {
      // Sucesso! O onAuthStateChange do App.js cuidará do restante
      if (onLoginSuccess) onLoginSuccess(data.user);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h2 style={styles.title}>Tally Cloud Admin</h2>
        <p style={styles.subtitle}>Acesso restrito a coordenadores</p>

        {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

        <input
          type="email"
          placeholder="Seu e-mail"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Sua senha"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Autenticando..." : "ENTRAR NO PAINEL"}
        </button>
      </form>
      <footer style={styles.footer}>v1.4.0 - Acesso Interno</footer>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a", // Dark Blue profissional
    fontFamily: "sans-serif",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  title: { color: "#f8fafc", margin: "0 0 10px 0" },
  subtitle: { color: "#94a3b8", fontSize: "0.9rem", marginBottom: "30px" },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#ea580c", // Laranja vibrante
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
  },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    color: "#fecaca",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "0.85rem",
  },
  footer: { marginTop: "20px", color: "#475569", fontSize: "0.8rem" },
};