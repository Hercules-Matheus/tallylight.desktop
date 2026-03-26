# Changelog - Tally Control System

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O projeto adere ao Versionamento Semântico (https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-26

### Adicionado
- **Suporte a Tally de Preview (Luz Verde):** Implementada a lógica de estado secundário no Frontend. O sistema agora sinaliza "PREVIEW" (Verde) para a câmera selecionada no barramento de prévia, permitindo antecipação do cinegrafista.
- **Seletor de Interface de Rede (Multi-IP):** Adicionado dropdown na tela Admin que lista todas as placas de rede do host (Wi-Fi, Ethernet, Tailscale). Permite alternar o IP do QR Code manualmente em tempo real.
- **Detecção Inteligente de VPN/Tailscale:** O backend agora identifica interfaces virtuais e prioriza IPs de rede local (192.168.x.x ou 10.x.x.x) para o QR Code inicial, evitando falhas de conexão em dispositivos fora da VPN.
- **Sincronização "Hot-Connect":** Novos clientes recebem instantaneamente o último estado de Tally (`lastTally`) e a lista de câmeras (`lastInputs`) ao conectar, eliminando o estado de espera "Buscando...".
- **Script de Inicialização Bash:** Criado utilitário `start_tally.sh` com suporte a reinicialização automática e gerenciamento de diretório de execução.

### Corrigido
- **Filtro de Entradas Físicas:** Refinação do filtro `internalPortType` para garantir que apenas fontes de vídeo reais (entradas HDMI/SDI) apareçam na lista de seleção.
- **Conflito de Reconexão:** Implementado `async/await` no processo de troca de IP do ATEM para garantir que a instância anterior seja encerrada antes da nova tentativa.
- **Zumbi de Processo (Electron):** Garantia de encerramento do processo filho (backend) através do evento `before-quit` do Electron.
- **Remoção de Código Órfão:** Exclusão da função redundante `emitAtemStatus` em favor da lógica centralizada `broadcastAtemState`.

### Alterado
- **Arquitetura de Broadcast:** Centralização da atualização de estado em um único fluxo, garantindo consistência entre o que o ATEM reporta e o que o Socket.io distribui.
- **UX de Tally:** Adição de cores de status (Vermelho/Verde) no texto de visualização e suavização de transição de cores de fundo (ease-transition).

---

## [1.1.1] - 2026-03-25

### Adicionado
- **Automação de Sincronia de Versão:** Script 'sync-version' que espelha a versão do package.json raiz para o diretório 'src/' do frontend.
- **Gestão de Versão Centralizada:** Versão definida em um único local refletida em todo o ecossistema (Electron, Backend e Web).
- **Restauração da Rota de Teste:** Reativado endpoint 'GET /teste/:cam' para simulação via browser.
- **Loading State (Admin):** Trava visual 'isUpdating' para evitar cliques duplicados durante a reconexão.
- **Botão de Reset:** Atalho para restaurar o último IP estável no formulário de configuração.

### Corrigido
- **Bypass de Restrição do CRA:** Resolvido erro de 'Module not found' fora do diretório 'src/'.
- **Validação de Hardware:** O indicador de conexão agora depende estritamente do handshake bem-sucedido (Status 2).
- **Input Freeze:** Resolvido problema de teclado indisponível no Electron através da desvinculação entre estados de digitação e rede.

### Segurança / QA
- **Trava de Tally Offline:** Validação de conectividade antes de permitir a mudança de cor para o estado "ON AIR".
- **Estabilidade:** Refatoração do gerenciamento de instâncias do Socket.io para evitar quedas em uso prolongado.