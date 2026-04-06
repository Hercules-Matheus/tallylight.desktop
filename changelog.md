============================================================
CHANGELOG - TALLY CONTROL SYSTEM
============================================================
Versão: 2.0.0
Data: 2026-04-06
Desenvolvedor: Hercules Matheus
============================================================

[2.0.0] - 2026-04-06

## 🚀 ADICIONADO (MAJOR REFATORAÇÃO)

- ARQUITETURA EVENT-DRIVEN (ORCHESTRATOR): Reescrita total do
  núcleo do sistema utilizando EventEmitter. Garante que a
  comunicação entre ATEM, Electron e Supabase seja fluida e
  sem erros de concorrência.
- SYNC DINÂMICO DE LABELS (JSONB): Integração real com o
  hardware. Os nomes das câmeras editados no ATEM Software
  Control agora são enviados para a nuvem e atualizam os
  botões dos cinegrafistas instantaneamente.
- INTERFACE "GRID DE PRODUÇÃO": Substituição definitiva do
  antigo menu 'select' por uma grade de botões grandes.
  Melhoria drástica na UX para dispositivos touch em
  ambientes de baixa luz.
- MODO PRODUÇÃO "ONE-CLICK": Botão unificado que ativa o
  NoSleep.js (trava tela) e o Audio Context (voz) com um
  único toque inicial do usuário.

## 🔐 SEGURANÇA E BANCO DE DADOS

- POLÍTICAS RLS (ROW LEVEL SECURITY): Implementação de
  políticas granulares de INSERT e UPDATE no Supabase.
  Apenas o administrador da sessão pode alterar os dados
  da sala.
- LÓGICA DE UPSERT SEGURO: Garantia de que a sessão é criada
  antes de qualquer tentativa de atualização de inputs,
  eliminando erros de integridade.
- CLEANUP DE SESSÃO: Encerramento automático da sala
  (is_active: false) ao fechar o App Desktop (before-quit).

## 🎨 INTERFACE E UX

- BRANDING CONSOLIDADO V2: Padronização de ícones e títulos
  no Executável, Tray (bandeja), Processos e Navegador.
- SELECT VIS
