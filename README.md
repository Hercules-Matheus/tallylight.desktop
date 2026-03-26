# 🎥 Tally Light - ATEM BLACKMAGIC (v1.2.1)

O Tally Light é um ecossistema de baixa latência que transforma smartphones em
sinalizadores de Tally (Program/Preview) para switchers Blackmagic ATEM.

---

1. NOVIDADES DA VERSÃO 1.2.0

---

- **Tally de Preview:** Suporte a luz verde (Preview) além da luz vermelha (Program).
- **Multi-Interface IP:** Seletor de rede no Admin (Wi-Fi, Ethernet, Tailscale).
- **Hot-Connect:** Sincronização instantânea de câmeras e status ao conectar o celular.
- **Inteligência de Rede:** Priorização automática de IPs locais (192.168.x.x) no QR Code.
- **Auto-Sync Version:** Versão centralizada no package.json raiz refletida em todo o app.

---

2. COMO USAR (EXECUTÁVEL)

---

- **Inicialização:** Abra o `Tally Light.exe`. O sistema inicia na bandeja do sistema.
- **Configuração:** Clique no ícone da bandeja > "Abrir Painel Tally".
- **Conexão ATEM:** Digite o IP da sua mesa ATEM e clique em "Atualizar IP".
- **Interface de Rede:** No painel Admin, escolha a placa de rede correta (ex: Wi-Fi) para gerar o QR Code.
- **Cinegrafistas:** Peça para os cinegrafistas lerem o QR Code. Eles devem estar na mesma rede do PC (ou na mesma rede Tailscale).

---

3. ESTRUTURA DO PROJETO (DESENVOLVIMENTO)

---

/tally-app
├── main.js # Processo Principal (Electron Shell)
├── package.json # Scripts globais, bump de versão e dependências
├── /backend
│ └── index.js # Servidor Node + Conexão ATEM (Socket.io)
├── /frontend
│ ├── /src # Código-fonte React (TallyScreen & AdminScreen)
│ └── /build # Produção estática servida pelo backend
└── start_tally.sh # Script Bash para execução rápida via terminal

---

4. SCRIPTS DE COMANDO (NPM)

---

- `npm install` # Instala dependências do Core e Backend
- `npm run setup-all` # Instala dependências da Raiz e do Frontend
- `npm run sync-version` # Espelha a versão do package.json para o código-fonte
- `npm start` # Inicia o ambiente de desenvolvimento
- `npm run build-front` # Gera o build do React e sincroniza versões
- `npm run dist` # Empacota o sistema em um executável (.exe)

---

5. REQUISITOS TÉCNICOS & QA

---

- **Latência:** Comunicação via WebSockets (Socket.io) para resposta < 100ms.
- **Persistência:** O IP do ATEM é salvo em `%AppData%/Tally Light/config.json`.
- **Prevenção de Sono:** Utiliza NoSleep.js para impedir que o celular bloqueie a tela.
- **Rede Virtual:** Suporte nativo para Tailscale, permitindo Tally remoto via VPN.
- **Portas:** Busca automática de portas livres iniciando em `58000`.

---

6. TECNOLOGIAS UTILIZADAS

---

- **Electron:** Desktop Shell e gerenciamento de processos.
- **Node.js:** Backend para protocolo UDP ATEM.
- **React:** UI reativa para dispositivos móveis.
- **Socket.io:** Distribuição de estado em tempo real.
- **Atem-Connection:** Implementação do protocolo Blackmagic.
- **Tailscale Ready:** Otimizado para redes mesh e VPNs.

---

# Desenvolvido por: Hercules (2026)
