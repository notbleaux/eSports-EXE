import React, { useState, useEffect } from 'react';
import { useTeamData } from '../../../../main-repo/packages/shared/axiom-esports-data/visualization/sator-square/hooks/useTeamData';
import { fetchWithRetry } from '../../../../main-repo/packages/shared/axiom-esports-data/visualization/sator-square/hooks/fetchWithRetry';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function MatchPredictor() {
  const [teamA, setTeamA] = useState('9'); // Sentinels default
  const [teamB, setTeamB] = useState('2'); // Cloud9 default
  const [winProbability, setWinProbability] = useState(65.5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real match data using API hooks
  const { data: teamAData, loading: teamALoading, error: teamAError } = useTeamData(teamA);
  const { data: teamBData, loading: teamBLoading, error: teamBError } = useTeamData(teamB);

  // Fetch upcoming matches for selection
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetchWithRetry(`${API_BASE_URL}/v2/matches/upcoming`);
        
        if (response.data?.matches?.length > 0) {
          setMatchData(response.data.matches[0]);
          // Use real team IDs if available
          if (response.data.matches[0].team1_id) {
            setTeamA(response.data.matches[0].team1_id);
          }
          if (response.data.matches[0].team2_id) {
            setTeamB(response.data.matches[0].team2_id);
          }
        }
      } catch (err) {
        console.warn('API unavailable, using fallback data:', err);
        setError('API connection failed - using demo data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const runSimulation = () => {
    setIsSimulating(true);
    
    // Generate simulation points based on team ratings
    const teamARating = teamAData?.rating || 1847;
    const teamBRating = teamBData?.rating || 1623;
    const ratingDiff = teamARating - teamBRating;
    const teamABias = Math.min(Math.max(0.5 + (ratingDiff / 1000), 0.3), 0.7);
    
    const points = [];
    for (let i = 0; i < 50; i++) {
      points.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        team: Math.random() > (1 - teamABias) ? 'A' : 'B'
      });
    }
    setSimulationData(points);

    // Calculate probability based on ratings
    const baseProb = 50 + (ratingDiff / 50);
    const finalProb = Math.min(Math.max(baseProb, 20), 80);

    setTimeout(() => {
      setWinProbability(finalProb + (Math.random() * 10 - 5));
      setIsSimulating(false);
    }, 1500);
  };

  useEffect(() => {
    if (!teamALoading && !teamBLoading) {
      runSimulation();
    }
  }, [teamALoading, teamBLoading, teamAData, teamBData]);

  const teamAName = teamAData?.name || matchData?.team1 || 'Team Alpha';
  const teamBName = teamBData?.name || matchData?.team2 || 'Team Beta';
  const teamAWinRate = teamAData?.win_rate || 72;
  const teamBWinRate = teamBData?.win_rate || 58;
  const teamARating = teamAData?.rating || 1847;
  const teamBRating = teamBData?.rating || 1623;

  if (loading || teamALoading || teamBLoading) {
    return (
      <div className="match-predictor loading">
        <div className="predictor-loading">
          <span className="loading-spinner"></span>
          <p>Loading match data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="match-predictor">
      {error && (
        <div className="api-warning">
          <span className="warning-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="predictor-teams">
        <div className="team team-a">
          <div className="team-badge">A</div>
          <span className="team-name">{teamAName}</span>
          <div className="team-stats">
            <span>Win Rate: {teamAWinRate}%</span>
            <span>Rating: {teamARating}</span>
          </div>
        </div>

        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        <div className="team team-b">
          <div className="team-badge">B</div>
          <span className="team-name">{teamBName}</span>
          <div className="team-stats">
            <span>Win Rate: {teamBWinRate}%</span>
            <span>Rating: {teamBRating}</span>
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