'use client';

export function TorusFlowHero() {
  return (
    <section className="torus-hero">
      <div className="flow-container">
        {/* Offline side */}
        <div className="flow-side offline">
          <h2>Offline</h2>
          <p>Simulation & Strategy</p>
          <div className="torus-ring top"></div>
        </div>
        
        {/* Flow indicator */}
        <div className="flow-center">
          <div className="flow-particles">
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
          </div>
          <span className="flow-label">Data Bridge</span>
        </div>
        
        {/* Online side */}
        <div className="flow-side online">
          <h2>Online</h2>
          <p>NJZ ¿!? Live Platform</p>
          <div className="torus-ring bottom"></div>
        </div>
      </div>
      
      <div className="hero-content">
        <h1>Games Hub</h1>
        <p>Seamless flow between offline strategy and live competition</p>
      </div>
    </section>
  );
}
