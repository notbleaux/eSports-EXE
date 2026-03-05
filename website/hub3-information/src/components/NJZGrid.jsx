import { zones } from '../data/zones';

function NJZGrid() {
  return (
    <section id="grid" className="njz-grid-section">
      <div className="section-header">
        <h2 className="section-title">NJZ Directory Matrix</h2>
        <p className="section-subtitle">Navigate through 25 professional eSports zones</p>
      </div>
      
      <div className="njz-grid">
        {zones.map((zone) => (
          <a 
            key={zone.id} 
            href={zone.href} 
            className="grid-zone"
            data-zone={zone.id}
          >
            <span className="zone-icon">{zone.icon}</span>
            <span className="zone-name">{zone.name}</span>
            {zone.badge && <span className="zone-badge">{zone.badge}</span>}
          </a>
        ))}
      </div>
    </section>
  );
}

export default NJZGrid;