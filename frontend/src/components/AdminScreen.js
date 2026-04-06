import React from "react";
import { supabase } from "../supabaseClient";
import { VERSION } from "../version";

export default function AdminDashboard({ user }) {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div style={adminStyles.container}>
      <header style={adminStyles.header}>
        <h2>Painel Tally Cloud</h2>
        <span>v{VERSION}</span>
      </header>

      <main style={adminStyles.main}>
        <div style={adminStyles.card}>
          <h3>Bem-vindo, {user.email}</h3>
          <p>Sua infraestrutura de Tally Cloud está operacional.</p>
        </div>

        {/* Espaço para futura geração de QR Code e lista de sessões */}
        <div style={adminStyles.card}>
          <h4>Minhas Câmeras</h4>
          <p>Status: 🟢 Supabase Realtime Ativo</p>
        </div>

        <button onClick={handleLogout} style={adminStyles.logoutBtn}>
          SAIR DO SISTEMA
        </button>
      </main>
    </div>
  );
}

const adminStyles = {
  container: {
    height: "100vh",
    backgroundColor: "#0f172a",
    color: "white",
    fontFamily: "sans-serif",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #334155",
    paddingBottom: "10px",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "40px",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "500px",
    marginBottom: "20px",
  },
  logoutBtn: {
    backgroundColor: "#334155",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
  },
};
