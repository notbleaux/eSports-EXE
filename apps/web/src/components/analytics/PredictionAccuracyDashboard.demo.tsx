/**
 * PredictionAccuracyDashboard Demo
 * 
 * Example usage of the PredictionAccuracyDashboard component
 * 
 * [Ver001.000]
 */

// import React from 'react';
import { PredictionAccuracyDashboard } from './PredictionAccuracyDashboard';
import { CompactAnalyticsCard, AnalyticsSection } from '@/hub-1-sator/components/AnalyticsSection';

/**
 * Demo page showcasing the PredictionAccuracyDashboard
 */
export function PredictionAccuracyDashboardDemo() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Full Dashboard */}
        <section>
          <h1 className="text-2xl font-bold text-white mb-6">
            Full Prediction Accuracy Dashboard
          </h1>
          <AnalyticsSection />
        </section>

        {/* Compact Card */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            Compact Card (for grids)
          </h2>
          <div className="max-w-sm">
            <CompactAnalyticsCard onExpand={() => console.log('Expand clicked')} />
          </div>
        </section>

        {/* Standalone Dashboard */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            Standalone Dashboard
          </h2>
          <PredictionAccuracyDashboard />
        </section>
      </div>
    </div>
  );
}

export default PredictionAccuracyDashboardDemo;
