============================================================
           TALLYCONTROL - ATEM BLACKMAGIC (v1.1.0)
============================================================

O TallyControl é um sistema que transforma smartphones em 
sinalizadores de Tally (Program/Preview) para switchers ATEM.

------------------------------------------------------------
1. COMO USAR (EXECUTÁVEL)
------------------------------------------------------------
- Abra o TallyControl.exe.
- O sistema iniciará minimizado na bandeja (perto do relógio).
- Clique no ícone e selecione "Abrir Painel Tally".
- No painel, digite o IP do seu Switcher ATEM e clique em 
  "Atualizar IP".
- Peça para os cinegrafistas lerem o QR Code com o celular 
  (devem estar no mesmo Wi-Fi).

------------------------------------------------------------
2. ESTRUTURA DO PROJETO (DESENVOLVIMENTO)
------------------------------------------------------------
/tally-app
  ├── main.js             (Processo Electron)
  ├── package.json        (Scripts e Dependências)
  ├── /backend
  │    └── index.js       (Servidor Node + Conexão ATEM)
  └── /frontend
       └── /build         (Arquivos estáticos do React)

------------------------------------------------------------
3. SCRIPTS DE COMANDO
------------------------------------------------------------
- Instalar tudo:       npm install && cd frontend && npm install
- Rodar (Dev):         npm start
- Gerar Build (Front): cd frontend && npm run build
- Gerar .exe:          npm run dist

------------------------------------------------------------
4. REQUISITOS TÉCNICOS & QA
------------------------------------------------------------
- Rede: O PC e os Celulares DEVEM estar na mesma sub-rede.
- Firewall: Permita o acesso do Node.js nas redes privadas.
- Portas: O sistema busca portas livres automaticamente 
  começando em 58000.
- Persistência: O IP do ATEM fica salvo em AppData/config.json.

------------------------------------------------------------
5. TECNOLOGIAS UTILIZADAS
------------------------------------------------------------
- Electron (Desktop Shell)
- Node.js (Backend & IPC)
- React (Frontend UI)
- Socket.io (Comunicação em tempo real)
- Atem-Connection (Protocolo Blackmagic)

------------------------------------------------------------
Desenvolvido por: Hercules (2026)
============================================================