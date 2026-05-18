const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const { app } = require("electron");

const SUPABASE_URL = "https://bsufvzxmfxhhxsgiydlw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdWZ2enhtZnhoaHhzZ2l5ZGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjE4ODYsImV4cCI6MjA5MDUzNzg4Nn0.5s01KAmM-8AFHkm2sz59Fx10uvuWHNUFHzFIc-TWxFA";

class SupabaseProvider {
  constructor() {
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

  // ---------------------------------------------------------------------------
  // Reset de Senha
  // Envia o email de redefinição com redirectTo apontando para a página
  // /reset-password do frontend Vercel. O Supabase injeta o token na URL
  // automaticamente como hash fragment (#access_token=...&type=recovery).
  // ---------------------------------------------------------------------------
  async resetPassword(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://tallylight-frontend.vercel.app/reset-password",
    });
    if (error) throw error;
  }

  async saveAtemInputs(sessionCode, inputs) {
    if (!this.client || !sessionCode) return;

    const { error } = await this.client
      .from("tally_sessions")
      .update({
        atem_inputs: inputs,
        updated_at: new Date().toISOString(),
      })
      .eq("session_code", sessionCode);

    if (error) {
      console.error("[Supabase] Erro ao sincronizar inputs:", error.message);
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
      console.error("[Supabase] Erro ao fechar sessão:", e.message);
    }
  }
}

module.exports = new SupabaseProvider();
