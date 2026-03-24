/** [Ver001.000]
 * LandingPage Component
 * =====================
 * Main landing page for the 4NJZ4 TENET Platform.
 * 
 * Features:
 * - Pink Boitano-style hero with sharp geometry
 * - Bold typography with negative tracking
 * - Rotating geometric element
 * - Staggered hub cards at bottom
 * - Hub grid section
 * - Mascot showcase section
 * - Footer
 */

import { useEffect } from 'react';
import { HubGridV2 } from '@/components/hubs/HubGridV2';
import { MascotShowcase } from '@/components/mascots/MascotShowcase';

// ============================================================================
// Add rotation keyframe to document
// ============================================================================

const addRotationKeyframe = () => {
  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('landing-page-keyframes');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'landing-page-keyframes';
      style.textContent = `
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// ============================================================================
// Component
// ============================================================================

export function LandingPage() {
  useEffect(() => {
    addRotationKeyframe();
  }, []);

  return (
    <div className="min-h-screen bg-off-white">
      {/* HERO - PINK BACKGROUND, SHARP GEOMETRY */}
      <section className="min-h-screen bg-boitano-pink relative overflow-hidden">
        {/* Geometric background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border-8 border-black rotate-45" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border-8 border-black -rotate-12" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-black rotate-90" />
        </div>
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 p-6 mix-blend-difference">
          <div className="container mx-auto flex justify-between items-center text-white">
            <span className="text-2xl font-display font-bold tracking-tight">4NJZ4</span>
            <div className="flex gap-8">
              {['SATOR', 'ROTAS', 'AREPO', 'OPERA', 'TENET'].map(hub => (
                <a 
                  key={hub} 
                  href={`/${hub.toLowerCase()}`} 
                  className="text-sm uppercase tracking-widest hover:underline font-semibold"
                >
                  {hub}
                </a>
              ))}
            </div>
          </div>
        </nav>
        
        {/* Main content */}
        <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
          <div className="grid grid-cols-12 gap-4">
            {/* Large headline */}
            <div className="col-span-12">
              <h1 className="text-hero text-black uppercase">
                TENET
              </h1>
              <h2 className="text-hero text-black -mt-4 md:-mt-8">
                PLATFORM
              </h2>
            </div>
            
            {/* Subheadline */}
            <div className="col-span-12 md:col-span-6 mt-8">
              <p className="text-xl md:text-2xl font-body text-black max-w-lg">
                Navigate through five interconnected hubs. Each quadrant holds a universe of esports data, analytics, and intelligence.
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="col-span-12 mt-12">
              <a 
                href="/sator"
                className="inline-block bg-black text-white px-8 py-4 text-lg uppercase tracking-widest font-semibold
                           transform transition-all duration-300
                           hover:-translate-x-1 hover:-translate-y-1 hover:shadow-sharp"
              >
                ENTER PLATFORM
              </a>
            </div>
          </div>
          
          {/* Rotating geometric symbol */}
          <div className="absolute top-1/2 right-10 md:right-1/4 -translate-y-1/2 hidden md:block">
            <div 
              className="w-32 h-32 md:w-48 md:h-48 border-8 border-black"
              style={{ 
                animation: 'rotate 20s linear infinite',
                transform: 'rotate(45deg)'
              }}
            />
          </div>
        </div>
        
        {/* Hub preview cards at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="grid grid-cols-5 gap-4">
              {[
                { name: 'SATOR', color: 'bg-kunst-green', stat: '2.4M' },
                { name: 'ROTAS', color: 'bg-black text-white', stat: '99.9%' },
                { name: 'AREPO', color: 'bg-white text-black border-2 border-black', stat: '247' },
                { name: 'OPERA', color: 'bg-kunst-green', stat: '6' },
                { name: 'TENET', color: 'bg-black text-white', stat: 'CENTER' },
              ].map((hub, i) => (
                <a 
                  key={hub.name}
                  href={`/${hub.name.toLowerCase()}`}
                  className={`${hub.color} p-4 md:p-6 transform transition-transform duration-300 hover:-translate-y-2`}
                  style={{ marginTop: `${i * 10}px` }}
                >
                  <h3 className="text-xl md:text-2xl font-display font-bold">{hub.name}</h3>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{hub.stat}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* HUB GRID SECTION */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-display uppercase mb-4">Five Hubs</h2>
          <p className="text-gray-600 max-w-xl mb-16 text-lg">
            Each quadrant offers unique capabilities. Navigate between them to access the full platform.
          </p>
          <HubGridV2 />
        </div>
      </section>
      
      {/* MASCOT SHOWCASE */}
      <section className="py-20 md:py-32 bg-off-white">
        <div className="container mx-auto px-6">
          <h2 className="text-display uppercase mb-4">Platform Mascots</h2>
          <p className="text-gray-600 max-w-xl mb-16 text-lg">
            Meet our dual-style mascot system. Toggle between Dropout (full-color) and NJ (minimalist) aesthetics.
          </p>
          <MascotShowcase />
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6">
              <h3 className="text-4xl font-display font-bold">4NJZ4</h3>
              <p className="mt-4 text-gray-400">TENET Platform v2.0</p>
            </div>
            <div className="col-span-12 md:col-span-6 flex flex-wrap justify-start md:justify-end gap-6">
              {['SATOR', 'ROTAS', 'AREPO', 'OPERA', 'TENET'].map(hub => (
                <a 
                  key={hub} 
                  href={`/${hub.toLowerCase()}`} 
                  className="text-sm uppercase tracking-widest text-gray-400 hover:text-boitano-pink transition-colors"
                >
                  {hub}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
