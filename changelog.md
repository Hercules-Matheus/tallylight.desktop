============================================================
CHANGELOG - TALLY CONTROL SYSTEM
============================================================
Versão: 2.1.0
Desenvolvedor: Hercules Matheus
============================================================

## [2.1.0] - 2026-06-10

### Added

- New logs
- New transition auto/manual dissolver maped to display both cams on air while transitioning

### Changed

- Solve the IP not autocompleting

### Removed

- Remove audio on switching cameras


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
