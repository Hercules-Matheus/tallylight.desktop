const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const { app } = require("electron").remote || require("electron"); // Garante acesso ao app

// --- LÓGICA DE AMBIENTE (REFORÇADA) ---
const isDev = !app.isPackaged;

// // No Electron packegeado, o .env fica em 'resources' se configurado no extraResources
// const envPath = isDev
//   ? path.join(__dirname, "../../../.env") // Ajuste conforme a profundidade da pasta
//   : path.join(process.resourcesPath, ".env");

// require("dotenv").config({ path: envPath });

const SUPABASE_URL = "https://bsufvzxmfxhhxsgiydlw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdWZ2enhtZnhoaHhzZ2l5ZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjE4ODYsImV4cCI6MjA5MDUzNzg4Nn0.5s01KAmM-8AFHkm2sz59Fx10uvuWHNUFHzFIc-TWxFA";

class SupabaseProvider {
  constructor() {
    // Adicionamos um log interno (visível no terminal do VS Code) para debug
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error(
        "ERRO: Variáveis do Supabase não encontradas no path:",
        envPath,
      );
    }

    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.currentSession = null;
    this.userId = null;
  }

  async login(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.userId = data.user.id;
    return data.user;
  }

  async saveAtemInputs(sessionCode, inputs) {
    if (!this.client || !sessionCode) return;

    const { error } = await this.client
      .from("tally_sessions")
      .update({
        atem_inputs: inputs, // Certifique-se que a coluna no Supabase é do tipo JSONB
        updated_at: new Date().toISOString(),
      })
      .eq("session_code", sessionCode);

    if (error) {
      console.error("Erro ao sincronizar inputs com Supabase:", error.message);
    }
  }

  async startSession(sessionCode) {
    this.currentSession = sessionCode.trim().toUpperCase();

    const { error } = await this.client.from("tally_sessions").upsert(
      {
        session_code: this.currentSession,
        is_active: true,
        user_id: this.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_code" },
    );

    if (error) throw error;
    return this.currentSession;
  }

  async updateTally(program, preview) {
    if (!this.currentSession) return;

    await this.client
      .from("tally_sessions")
      .update({
        program_cam: program,
        preview_cam: preview,
        updated_at: new Date().toISOString(),
      })
      .eq("session_code", this.currentSession);
  }

  async stopSession() {
    if (!this.currentSession) return;
    try {
      await this.client
        .from("tally_sessions")
        .update({ is_active: false })
        .eq("session_code", this.currentSession);
    } catch (e) {
      console.error("Erro ao fechar sessão no Supabase");
    }
  }
}

module.exports = new SupabaseProvider();
