import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LineChart } from './components/charts/LineChart';
import { BarChart } from './components/charts/BarChart';
import { PieChart } from './components/charts/PieChart';
import { GaugeChart } from './components/charts/GaugeChart';
import { SimRatingPanel } from './components/widgets/SimRatingPanel';
import { RARCalculator } from './components/widgets/RARCalculator';
import { InvestmentGrade } from './components/widgets/InvestmentGrade';
import { KPICard } from './components/widgets/KPICard';
import { performanceHistory, comparativeStats, roleDistribution } from './data/mockData';
import { useDashboardStore } from './store/dashboardStore';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { selectedPlayer } = useDashboardStore();

  const renderDashboard = () => (
    <>
      {/* KPI Cards */}
      <section className="mb-6">
        <KPICard />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - SimRating Panel */}
        <div className="lg:col-span-1">
          <SimRatingPanel />
        </div>

        {/* Middle Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Chart */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Over Time</h3>
            <LineChart data={performanceHistory} height={300} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Team Performance</h3>
              <BarChart data={comparativeStats} height={250} />
            </div>

            {/* Pie Chart */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Role Distribution</h3>
              <PieChart data={roleDistribution} height={250} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RARCalculator />
        <InvestmentGrade />
      </div>
    </>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Detailed Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <GaugeChart value={87.5} title="Win Rate" />
          </div>
          
          <div className="glass-card p-6 text-center">
            <GaugeChart value={92.3} title="KDA Ratio" />
          </div>
          
          <div className="glass-card p-6 text-center">
            <GaugeChart value={78.9} title="Objective Control" />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
        <LineChart data={performanceHistory} height={400} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dash-bg overflow-hidden">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'players' && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-white mb-4">Player Management</h2>
              <p className="text-gray-400">Player management interface coming soon...</p>
            </div>
          )}
          {activeSection === 'rar' && (
            <div className="max-w-2xl mx-auto">
              <RARCalculator />
            </div>
          )}
          {activeSection === 'grades' && (
            <div className="max-w-4xl mx-auto">
              <InvestmentGrade />
            </div>
          )}
        </main>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => useDashboardStore.getState().setSelectedPlayer(null)}
        >
          <div 
            className="glass-panel max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={selectedPlayer.photo} 
                alt={selectedPlayer.name}
                className="w-20 h-20 rounded-full bg-dash-panel"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPlayer.name}</h2>
                <p className="text-gray-400">{selectedPlayer.team} • {selectedPlayer.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">SimRating™</p>
                <p className="text-3xl font-bold text-dash-teal">{selectedPlayer.simRating.toFixed(1)}</p>
              </div>
              
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400">Trend</p>
                <p className="text-3xl font-bold text-green-400">+
                  {((selectedPlayer.trend[selectedPlayer.trend.length - 1] - selectedPlayer.trend[0])).toFixed(1)}
                </p>
              </div>
            </div>

            <button
              onClick={() => useDashboardStore.getState().setSelectedPlayer(null)}
              className="w-full py-2 bg-dash-teal hover:bg-dash-teal/80 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
