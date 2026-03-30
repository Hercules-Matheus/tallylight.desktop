# 🎥 Tally Light - ATEM BLACKMAGIC (v1.3.0)

O Tally Light é um ecossistema de baixa latência que transforma smartphones em
sinalizadores de Tally (Program/Preview) para switchers Blackmagic ATEM.

---

1. NOVIDADES DA VERSÃO 1.3.0 (MAIOR ESTABILIDADE)

---

- **Locução de Status (Voz):** Avisos sonoros profissionais para "No Ar", "Preview" e "Fora".
- **Interface em Grid:** Seleção de câmeras via botões diretos (fim do bug do 'select' no PC).
- **Modo Produção Unificado:** Ativação do NoSleep + Áudio em um único clique no celular.
- **Branding Consolidado:** Ícones personalizados na Barra de Tarefas e Tray (Área de Notificação).
- **Tally de Preview:** Suporte a luz verde (Preview) além da luz vermelha (Program).
- **Multi-Interface IP:** Seletor de rede no Admin (Wi-Fi, Ethernet, Tailscale).
- **Hot-Connect:** Sincronização instantânea de câmeras e status ao conectar o celular.
- **Auto-Sync Version:** Versão centralizada no package.json refletida em todo o app.

---

2. COMO USAR (EXECUTÁVEL)

---

- **Inicialização:** Abra o `Tally Control.exe`. O sistema inicia na bandeja do sistema (Tray).
- **Configuração:** Clique no ícone da bandeja > "Abrir Painel Tally".
- **Conexão ATEM:** Digite o IP da sua mesa ATEM e clique em "Atualizar IP".
- **Interface de Rede:** No painel Admin, escolha a placa de rede correta para gerar o QR Code.
- **Cinegrafistas:** Peça para os cinegrafistas lerem o QR Code.
  - **Dica:** Ao abrir o link, clique em "ATIVAR MODO PRODUÇÃO" para habilitar as vozes e impedir o bloqueio da tela.

---

3. SCRIPTS DE COMANDO (NPM)

---

- `npm start` # Inicia o Electron em modo desenvolvimento
- `npm run clean` # Remove as pastas /dist e /build antigas
- `npm run sync-version`# Sincroniza a versão do package.json com o frontend/src/version.js
- `npm run build-front` # Sincroniza a versão e gera o build estático do React
- `npm run build-app` # Empacota o executável (.exe) via electron-builder
- `npm run release` # [Mestre] Limpa, compila o front e gera o executável final
- `npm version minor` # Incrementa para v1.3.0 e cria a tag Git correspondente

---

4. REQUISITOS TÉCNICOS & QA

---

- **Latência:** Comunicação via WebSockets (Socket.io) para resposta < 100ms.
- **Mídia:** Suporte a reprodução de áudio em background (necessário interação inicial do usuário).
- **Persistência:** O IP do ATEM é salvo em `%AppData%/Tally Control/config.json`.
- **Prevenção de Sono:** Utiliza NoSleep.js para impedir que o celular bloqueie a tela.
- **Rede Virtual:** Suporte nativo para Tailscale, permitindo Tally remoto via VPN.

---

5. TECNOLOGIAS UTILIZADAS

---

- **Electron:** Desktop Shell e gerenciamento de processos.
- **Node.js:** Backend para protocolo UDP ATEM.
- **React:** UI reativa para dispositivos móveis com suporte a áudio.
- **Socket.io:** Distribuição de estado em tempo real.
- **Atem-Connection:** Implementação do protocolo Blackmagic.

---

# Desenvolvido por: Hercules Matheus (2026)
