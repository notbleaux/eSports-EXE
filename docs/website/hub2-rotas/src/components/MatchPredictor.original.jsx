import React, { useState, useEffect } from 'react';

function MatchPredictor() {
  const [teamA, setTeamA] = useState('Team Alpha');
  const [teamB, setTeamB] = useState('Team Beta');
  const [winProbability, setWinProbability] = useState(65.5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState([]);

  const runSimulation = () => {
    setIsSimulating(true);
    
    // Generate simulation points
    const points = [];
    for (let i = 0; i < 50; i++) {
      points.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        team: Math.random() > 0.35 ? 'A' : 'B'
      });
    }
    setSimulationData(points);

    // Animate probability change
    setTimeout(() => {
      setWinProbability(50 + Math.random() * 40);
      setIsSimulating(false);
    }, 1500);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="match-predictor">
      <div className="predictor-teams">
        <div className="team team-a">
          <div className="team-badge">A</div>
          <span className="team-name">{teamA}</span>
          <div className="team-stats">
            <span>Win Rate: 72%</span>
            <span>Rating: 1847</span>
          </div>
        </div>

        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        <div className="team team-b">
          <div className="team-badge">B</div>
          <span className="team-name">{teamB}</span>
          <div className="team-stats">
            <span>Win Rate: 58%</span>
            <span>Rating: 1623</span>
          </div>
        </div>
      </div>

      <div className="predictor-visualization">
        <div className="probability-distribution">
          <div className="dist-bar">
            <div 
              className="dist-fill team-a-fill"
              style={{ width: `${winProbability}%` }}
            >
              <span className="dist-label">{winProbability.toFixed(1)}%</span>
            </div>
            <div 
              className="dist-fill team-b-fill"
              style={{ width: `${100 - winProbability}%` }}
            >
              <span className="dist-label">{(100 - winProbability).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className={`simulation-field ${isSimulating ? 'simulating' : ''}`}>
          {simulationData.map((point, index) => (
            <div
              key={index}
              className={`sim-point team-${point.team.toLowerCase()}`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                animationDelay: `${index * 20}ms`
              }}
            ></div>
          ))}
          
          <div className="field-center">
            <span className="center-x">×</span>
          </div>
        </div>
      </div>

      <div className="predictor-actions">
        <button 
          className={`simulate-btn ${isSimulating ? 'loading' : ''}`}
          onClick={runSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <>
              <span className="btn-spinner"></span>
              Simulating...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default MatchPredictor;
