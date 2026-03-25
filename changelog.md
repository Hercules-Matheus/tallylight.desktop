# Changelog - Tally Control System

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.
O projeto adere ao Versionamento Semântico (https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-03-25

### Adicionado

- Automação de Sincronia de Versão: Implementado script 'sync-version' que espelha a versão do package.json raiz para o diretório 'src/' do frontend antes de cada build.
- Gestão de Versão Centralizada: A versão do sistema agora é definida em um único local (package.json raiz) e refletida automaticamente no Electron, Backend e Mobile Web App.
- Restauração da Rota de Teste: Reativado o endpoint 'GET /teste/:cam' para validação de disparos de Tally via browser.
- Loading State (Admin): Implementada trava visual 'isUpdating' que desativa o formulário durante a troca de IP, evitando cliques duplicados e indicando o processamento de reconexão.
- Botão de Reset: Adicionado atalho para restaurar o último IP estável no campo de entrada em caso de erro de digitação ou travamento.

### Corrigido

- Bypass de Restrição do CRA: Resolvido o erro 'Module not found' (outside of src/) através da geração dinâmica de um arquivo JSON interno ao diretório de origem do React.
- Validação de Hardware ATEM: Correção do falso positivo no status "Conectado". O indicador agora depende estritamente do evento de handshake bem-sucedido com a mesa de corte.
- Limpeza de Build: Ajustado o script 'clean' para garantir que versões antigas (v1.1.0) não interfiram no empacotamento da v1.1.1.
- Input Freeze: Resolvido o problema de teclado indisponível através da desvinculação entre o estado de digitação e as atualizações de rede (isTyping + local state).
- Status Preciso: O indicador de conexão agora aguarda o handshake real do ATEM (Status 2), eliminando falsas confirmações em IPs malformatados.

### Segurança / QA

- Trava de Tally Offline: A tela do cinegrafista (TallyScreen) agora valida a conectividade com o ATEM antes de permitir a mudança de cor para o estado "ON AIR".
- Estabilidade de Processo: Refatoração do gerenciamento de instâncias do Socket.io para evitar quedas silenciosas do backend durante o uso prolongado.
