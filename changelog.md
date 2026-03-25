# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-br/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-25

### Adicionado
- **Arquitetura Multi-Processo:** Uso de `child_process.fork` para isolar o Backend (Node.js) da interface (Electron), evitando que falhas de rede travem a aplicação principal.
- **Tally em Tempo Real:** Integração completa com a biblioteca `atem-connection` para monitoramento dos estados de Program e Preview.
- **Interface Mobile Responsiva:** Web app otimizado para smartphones, permitindo que voluntários usem seus próprios dispositivos como Tally Lights.
- **QR Code Dinâmico:** Geração automática de QR Code no painel administrativo com o IP e porta reais da rede local.
- **Modo NoSleep:** Implementação da biblioteca `nosleep.js` para impedir que o navegador do celular apague a tela durante a operação.
- **System Tray (Bandeja):** Ícone de sistema com menu de contexto para abrir, reiniciar o backend ou encerrar o app.
- **Notificações Nativas:** Alertas de sistema para confirmar a inicialização correta do servidor em segundo plano.

### Modificado
- **Lógica de Portas:** Substituição de portas fixas por uma busca dinâmica (iniciando em 58000), garantindo que o app abra mesmo se a porta padrão estiver ocupada.
- **Persistência de Dados:** O arquivo `config.json` agora é salvo na pasta de dados do usuário do sistema (`AppData`), preservando o IP do ATEM entre atualizações do executável.
- **Fluxo de Carregamento:** O Electron agora aguarda o sinal `SERVER_READY` via IPC para carregar a interface, eliminando erros de "página não encontrada" no boot.

### Segurança / QA
- **Validação de Input:** Adicionada verificação por Regex para endereços IP no frontend e backend, prevenindo crashes por caracteres inválidos.
- **Tratamento de Erros:** Melhoria na captura de exceções em caso de perda de conexão física com o switcher ATEM.

---

### [0.1.0] - 2026-02-15
- Versão beta inicial para testes de latência e prova de conceito.
- Implementação básica de Socket.io.

---