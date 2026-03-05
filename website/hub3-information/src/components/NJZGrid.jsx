import { useState, useEffect, useRef } from 'react';
import { zones } from '../data/zones';

function NJZGrid() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [visibleZones, setVisibleZones] = useState(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const gridRef = useRef(null);
  const observerRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show all zones immediately if reduced motion is preferred
      setVisibleZones(new Set(zones.map(z => z.id)));
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const zoneId = parseInt(entry.target.dataset.zoneId);
            setVisibleZones((prev) => new Set([...prev, zoneId]));
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      }
    );

    const zoneElements = gridRef.current?.querySelectorAll('.grid-zone');
    zoneElements?.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [prefersReducedMotion, viewMode]);

  // Toggle view mode handler
  const handleViewToggle = (mode) => {
    setViewMode(mode);
    // Reset visible zones for animation when switching views
    if (!prefersReducedMotion) {
      setVisibleZones(new Set());
      // Small delay to allow DOM update before observing
      setTimeout(() => {
        const zoneElements = gridRef.current?.querySelectorAll('.grid-zone');
        zoneElements?.forEach((el) => observerRef.current?.observe(el));
      }, 50);
    }
  };

  return (
    <section id="grid" className="njz-grid-section">
      <div className="section-header">
        <h2 className="section-title">NJZ Directory Matrix</h2>
        <p className="section-subtitle">Navigate through 25 professional eSports zones</p>
      </div>
      
      {/* Mobile View Toggle */}
      <div className="grid-view-toggle">
        <button 
          className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => handleViewToggle('grid')}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
        >
          <span>⊞</span>
          <span>Grid</span>
        </button>
        <button 
          className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => handleViewToggle('list')}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
        >
          <span>☰</span>
          <span>List</span>
        </button>
      </div>
      
      <div 
        ref={gridRef}
        className={`njz-grid ${viewMode === 'list' ? 'list-view' : ''}`}
        role="navigation"
        aria-label="NJZ Directory Zones"
      >
        {zones.map((zone) => (
          <a 
            key={zone.id} 
            href={zone.href} 
            className={`grid-zone ${!prefersReducedMotion ? 'animate-on-scroll' : ''} ${visibleZones.has(zone.id) ? 'visible' : ''}`}
            data-zone={zone.id}
            data-zone-id={zone.id}
            aria-label={`${zone.name} zone${zone.badge ? ` - ${zone.badge}` : ''}`}
          >
            <span className="zone-icon" aria-hidden="true">{zone.icon}</span>
            <span className="zone-name">{zone.name}</span>
            {zone.badge && (
              <span className="zone-badge" aria-label={`${zone.badge} status`}>
                {zone.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

export default NJZGrid;