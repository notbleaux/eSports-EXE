/**
 * Hub 4: The Nexus - Games Hub
 * 
 * Main entry point for the Games Hub module.
 * This hub provides:
 * - Game download and management portal
 * - Live matchmaking and lobby system
 * - Mode selection via 3D star tetrahedron
 * - Real-time resonance visualization
 */

// Main Components
export { default as GamesHub } from './components/GamesHub';
export { default as TorusFlow } from './components/TorusFlow';
export { default as ResonantMatchmaking } from './components/ResonantMatchmaking';
export { default as TripleModeSelector } from './components/TripleModeSelector';
export { default as GameDownloadPortal } from './components/GameDownloadPortal';
export { default as LivePlatformLobby } from './components/LivePlatformLobby';

// Styles
import './styles/nexus-tokens.css';
import './styles/games-hub.css';
import './styles/torus-flow.css';
import './styles/resonant-matchmaking.css';
import './styles/triple-mode-selector.css';
import './styles/game-download-portal.css';
import './styles/live-platform-lobby.css';

// Version
export const VERSION = '4.2.1-alpha';
export const HUB_NAME = 'The Nexus';
export const HUB_ID = 'hub-4-games';
