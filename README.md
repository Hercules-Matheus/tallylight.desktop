============================================================
🎥 TALLY LIGHT - ATEM BLACKMAGIC (v2.0.0)
============================================================
Desenvolvido por: Hercules Matheus (2026)
Status: Versão Estável de Produção

1. O SALTO PARA A VERSÃO 2.0.0 (MAJOR UPDATE)

---

A versão 2.0.0 marca a maturidade do sistema, focando em
estabilidade de rede, UX intuitiva e sincronização total
entre o hardware físico e a nuvem.

PRINCIPAIS IMPLEMENTAÇÕES:

- ARQUITETURA EVENT-DRIVEN: Orchestrator reescrito como
  EventEmitter para eliminar erros de sincronia e funções
  indefinidas.
- GRID DE SELEÇÃO DINÂMICA: Substituição total do seletor
  'select' por uma interface de botões (Grid) no celular,
  resolvendo problemas de visibilidade e legibilidade.
- SYNC AUTOMÁTICO DE LABELS: Nomes das câmeras definidos no
  ATEM Software Control são enviados via JSONB para o
  Supabase e refletidos nos botões dos cinegrafistas.
- SEGURANÇA RLS CONSOLIDADA: Políticas de Row Level Security
  (INSERT/UPDATE) ajustadas para permitir upserts seguros
  vinculados ao ID do administrador.
- PRODUÇÃO "ONE-CLICK": Ativação simultânea de NoSleep,
  Audio Context e Tally Flow ao entrar na sessão.

2. NOVIDADES TÉCNICAS

---

- Latência: Reduzida para <100ms via WebSockets e
  Supabase Realtime.
- Persistência Local: IP e Sessão salvos automaticamente
  em %AppData%/config.json.
- Locução de Voz: Avisos automáticos de status ("No Ar",
  "Preview") para operação sem necessidade de olhar a tela.
- Gerenciamento de Tray: Execução silenciosa na barra de
  tarefas do Windows para evitar fechamento acidental.

3. ESTABILIDADE E CORREÇÕES (v2.0.0)

---

- RACE CONDITION NO SYNC DE INPUTS: O listener de câmeras
  agora é registrado antes de connectHardware(), garantindo
  que nenhum evento "inputs-updated" seja perdido mesmo em
  conexões rápidas.
- ENCERRAMENTO DE SESSÃO GARANTIDO: before-quit agora aguarda
  a Promise de stopSession() antes de fechar o processo,
  evitando sessões presas como is_active: true no banco.
  O botão "Encerrar" no painel também chama stopSession()
  explicitamente via IPC antes de recarregar a tela.
- CANAL IPC UNIFICADO: Comunicação de inputs entre main e
  renderer padronizada no canal "atem-inputs" (era divergente
  entre preload e main, causando silêncio no renderer).
- LISTENERS SEM VAZAMENTO: preload.js usa removeAllListeners()
  antes de registrar callbacks de status, evitando acúmulo
  em hot-reload e re-renderizações.
- REFRESH DE INPUTS CONTROLADO: AtemManager só re-sincroniza
  nomes de câmeras quando pathKeys indica mudança real em
  "inputs.*", não a cada corte de vídeo.

4. COMANDOS DE OPERAÇÃO (NPM)

---

- npm run release : [MASTER] Limpa, compila e gera o .exe final.
- npm run sync-version: Sincroniza a versão entre o core e o front.
- npm start : Inicia o ambiente de desenvolvimento.

5. REQUISITOS DE SISTEMA

---

- Hardware: Switchers Blackmagic ATEM (Todos os modelos).
- Rede: Conexão via cabo (Ethernet) recomendada para o PC
  Admin e Wi-Fi estável (ou 4G/5G) para os celulares.
- Cloud: Projeto configurado no Supabase com Realtime ativado.

6. GUIA DE CAMPO PARA O CINEGRAFISTA

---

1. Escaneie o QR Code no painel do Admin.
2. Clique em "ATIVAR MODO PRODUÇÃO" (Libera som e trava a tela).
3. Escolha sua câmera no Grid (ex: CAM 01).
4. Cores de Sinalização:
   - VERMELHO : Você está no ar (PROGRAM).
   - VERDE : Você é a próxima câmera (PREVIEW).
   - CINZA : Standby / Fora do ar.

============================================================
🎥 TALLY LIGHT - ATEM BLACKMAGIC (v2.0.0)
============================================================