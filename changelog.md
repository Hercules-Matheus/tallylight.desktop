# Changelog - Tally Control System

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O projeto adere ao Versionamento Semântico (https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-03-30

### Adicionado

- **Locução de Status (TTS Masculino):** Implementação de avisos sonoros com voz masculina profissional para os estados "No Ar" (Program), "Preview" e "Fora do Ar".
- **Interface de Seleção em Grid:** Substituição do componente 'select' nativo por uma grade de botões de acesso direto. Melhora a agilidade do cinegrafista e elimina bugs de renderização em navegadores Desktop.
- **Modo Produção Unificado:** Fluxo de ativação em um único clique que combina a funcionalidade 'NoSleep' com o desbloqueio de áudio (unmute) exigido por navegadores mobile.
- **Indicador de Áudio Ativo:** Feedback visual na interface do cinegrafista confirmando que o sistema de som está operacional e autorizado pelo navegador.

### Alterado

- **Gerenciamento de Fluxo Sonoro:** Lógica de interrupção instantânea (Reset de Buffer) para evitar sobreposição de vozes em cortes rápidos de câmera no switcher.
- **Otimização de QR Code (iOS):** Implementação de margem de segurança (quiet zone) e elevação do nível de correção de erro para "High" (H), garantindo leitura instantânea em iPhones.
- **Arquitetura de Conexão Relativa:** Ajuste nas constantes de rede para suportar acessos via domínios externos (DNS) ou túneis de rede (Cloudflare/Ngrok), preparando o sistema para deploy SaaS.
- **Estilização Sólida:** Substituição de cores baseadas em opacidade (rgba) por cores sólidas em elementos críticos para evitar o erro de "dropdown fantasma" no Windows/Chrome.

### Corrigido

- **Persistência de Conexão no iOS:** Adicionado listener de 'visibilitychange' para forçar a reconexão automática do Socket.io quando o Safari volta para o primeiro plano.
- **Bug de Renderização Desktop:** Resolvido o problema onde o menu de seleção de câmeras perdia o fundo ou ficava transparente em resoluções de monitor PC.
- **Remoção de Feedback Tátil:** Desativação completa de chamadas ao 'navigator.vibrate' para priorizar a estabilidade do feedback sonoro e visual em dispositivos Android.

---

## [1.2.1] - 2026-03-26

### Adicionado

- **Branding Consolidado (Desktop):** Implementação de ícone personalizado na Barra de Tarefas, Janela e Área de Notificação (Tray) utilizando ativos dedicados em `/assets`.
- **Identidade Visual Mobile (PWA):** Atualização do `manifest.json` e substituição dos ícones de sistema (`logo192`, `logo512`) para que o app exiba a logo correta ao ser "instalado" na tela inicial do Android/iOS.
- **Customização de Título Dinâmico:** O título da janela Electron agora reflete o nome oficial do produto e a versão atual, com trava de atualização para evitar que o título padrão do React (index.html) sobrescreva a marca.
- **Configuração de Build Profissional:** Adicionada a propriedade `productName` no `package.json` para garantir que o executável (.exe) e o processo no Gerenciador de Tarefas sejam identificados como "TallyControl".

### Alterado

- **Estrutura de Ativos:** Migração do ícone mestre de pastas temporárias de build (`dist/.icon-ico/`) para uma pasta de recursos persistente (`/assets`) na raiz do projeto.
- **Estética de Status (Mobile):** Ajuste do `theme_color` no manifesto web para alinhar a barra de status do navegador com a paleta de cores do sistema Tally.
- **Hierarquia de Títulos:** Padronização do nome "TallyControl - Hercules" em todas as instâncias de interface.

### Corrigido

- **Persistência de Ícone:** Resolvido o problema onde o ícone da barra de tarefas voltava ao padrão do Electron após o empacotamento.
- **Sobreposição de Nome de Janela:** Implementado o listener `page-title-updated` para manter o branding do app consistente durante a navegação entre as telas Tally e Admin.

---

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
