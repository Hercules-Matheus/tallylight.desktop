============================================================
CHANGELOG - TALLY CONTROL SYSTEM
============================================================
Versão: 2.0.0
Desenvolvedor: Hercules Matheus
============================================================

[2.0.0] - 2026-05-04

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
- CLEANUP DE SESSÃO (DUPLA GARANTIA): Encerramento automático
  da sala (is_active: false) em dois pontos: via IPC ao
  clicar em "Encerrar" no painel e via before-quit ao fechar
  o app, ambos aguardando a Promise antes de prosseguir.

## 🎨 INTERFACE E UX

- BRANDING CONSOLIDADO V2: Padronização de ícones e títulos
  no Executável, Tray (bandeja), Processos e Navegador.
- SELECT SUBSTITUÍDO POR GRID: Eliminação do elemento
  <select> no frontend mobile. O novo Grid de botões resolve
  problemas de legibilidade em telas escuras e ambientes
  com iluminação controlada (estúdio, palco).
- FEEDBACK DE SYNC VISUAL: Após conexão com o ATEM, o painel
  Admin exibe a contagem de câmeras sincronizadas com a nuvem.

## 🐛 CORREÇÕES DE ESTABILIDADE

- RACE CONDITION NO LISTENER DE INPUTS: O callback
  "inputs-updated" era registrado com .once() após
  connectHardware(), criando uma janela onde o evento
  podia ser emitido antes do listener existir. Corrigido
  com registro antecipado via .on() e cleanup manual com
  .off() após o primeiro disparo.
- BEFORE-QUIT NÃO AGUARDAVA PROMISE: O handler async de
  before-quit não bloqueava o fechamento do Electron,
  fazendo stopSession() ser abortado antes de completar.
  Corrigido com event.preventDefault() + await + app.quit()
  em sequência garantida.
- CANAL IPC DIVERGENTE (atem-inputs): main.js enviava no
  canal "atem-inputs-data" enquanto preload.js ouvia
  "atem-inputs". O renderer nunca recebia os nomes das
  câmeras. Ambos padronizados para "atem-inputs".
- HANDLER IPC AUSENTE (app:stop-transmission): O preload
  expunha stopTransmission() mas não havia ipcMain.handle
  correspondente no main.js. Qualquer chamada retornava
  erro silencioso. Handler adicionado com stopSession() e
  cleanup do AtemManager.
- ACÚMULO DE LISTENERS NO PRELOAD: ipcRenderer.on() em
  onStatusUpdate() e onAtemInputs() acumulava listeners
  a cada chamada sem remover os anteriores. Corrigido com
  helper safeOn() que chama removeAllListeners() antes de
  registrar o novo callback.
- REFRESH DE INPUTS EXCESSIVO (AtemManager): stateChanged
  disparava refreshInputs() a cada evento de estado (cortes,
  áudio, etc.) porque apenas verificava se state.inputs
  existia no objeto. Corrigido para verificar pathKeys e
  só re-sincronizar quando há mudança real em "inputs.*".
- BTN-STOP SEM CLEANUP: O botão de encerramento chamava
  window.location.reload() diretamente, sem notificar o
  main process de fechar a sessão no Supabase. Corrigido
  para aguardar a resposta de stopTransmission() antes de
  recarregar.

============================================================
[1.x.x] - Histórico anterior não incluso neste arquivo.
Consulte o repositório Git para versões anteriores.
============================================================