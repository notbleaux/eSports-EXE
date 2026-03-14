/**
 * SATOR Hub - Module exports
 * The Observatory - Raw Data Ingestion
 * [Ver002.000] - Consolidated exports
 */

import { SatorHub } from './index.jsx';

// Main component
export { SatorHub };
export default SatorHub;

// Components (lazy loaded from subdirectories)
export { StatsGrid } from './components/StatsGrid';
export { PlayerWidget } from './components/PlayerWidget';

// Hooks
export { useSatorData } from './hooks/useSatorData';
