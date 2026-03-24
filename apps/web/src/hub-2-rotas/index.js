/**
 * ROTAS Hub - Module exports
 * The Harmonic Layer - Analytics and Predictions
 * [Ver002.000] - Consolidated exports
 */

import RotasHub from './index.jsx';
import AnalyticsWidget from './components/AnalyticsWidget';
import PredictionCard from './components/PredictionCard';
import useRotasData from './hooks/useRotasData';

// ML Integration Components
import MLAnalyticsPanel from './MLAnalyticsPanel';
import PredictionHistory from './PredictionHistory';
import ModelPerformanceCharts from './ModelPerformanceCharts';

// Main component
export { RotasHub };
export default RotasHub;

// Components
export { AnalyticsWidget, PredictionCard };

// ML Integration Components
export { MLAnalyticsPanel, PredictionHistory, ModelPerformanceCharts };

// Hooks  
export { useRotasData };
