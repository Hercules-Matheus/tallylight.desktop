============================================================
CHANGELOG - TALLY CONTROL SYSTEM
============================================================
Versão: 2.0.0
Desenvolvedor: Hercules Matheus
============================================================

## [2.0.0] - 2026-05-26

### Added

- New PeerProvider for direct administrator P2P communication
- PeerJS integration for WebRTC connectivity
- Centralized orchestrator.js for main process management

### Changed

- Migrated orchestration logic from index.js to dedicated orchestrator
- Enhanced StateStore synchronization between main/renderer processes
- Updated preload script with new IPC channels

### Removed

- Deprecated index.js from main process
