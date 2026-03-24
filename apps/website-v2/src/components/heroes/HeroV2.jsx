/**
 * HeroV2 Component - Bold Pink with Geometric Elements
 * Kunsthalle/Boitano Inspired Design
 * 
 * [Ver001.000]
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Geometric decoration component
const GeometricShape = ({ type, className, delay = 0 }) => {
  const shapes = {
    circle: (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        className={`rounded-full ${className}`}
      />
    ),
    square: (
      <motion.div
        initial={{ scale: 0, rotate: 90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        className={`${className}`}
      />
    ),
    triangle: (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        className={`w-0 h-0 border-l-transparent border-r-transparent border-b-current ${className}`}
        style={{ 
          borderLeftWidth: '40px',
          borderRightWidth: '40px',
          borderBottomWidth: '70px'
        }}
      />
    ),
    cross: (
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        className={`relative ${className}`}
      >
        <div className="absolute inset-0 w-full h-4 top-1/2 -translate-y-1/2 bg-current" />
        <div className="absolute inset-0 w-4 h-full left-1/2 -translate-x-1/2 bg-current" />
      </motion.div>
    ),
  };

  return shapes[type] || null;
};

export function HeroV2() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      className="relative min-h-screen bg-boitano-pink overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Geometric Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large circle top right */}
        <motion.div
          style={{ x: mousePosition.x * 0.5, y: mousePosition.y * 0.5 }}
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20"
        />
        
        {/* Square grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #000 1px, transparent 1px),
                linear-gradient(to bottom, #000 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Animated geometric shapes */}
        <div className="absolute top-20 left-10 text-pure-black/30">
          <GeometricShape type="circle" className="w-16 h-16 bg-current" delay={0.2} />
        </div>
        
        <div className="absolute bottom-40 left-1/4 text-pure-black/20">
          <GeometricShape type="square" className="w-24 h-24 bg-current rotate-12" delay={0.4} />
        </div>
        
        <div className="absolute top-1/3 right-1/4 text-white/40">
          <GeometricShape type="triangle" className="text-current" delay={0.6} />
        </div>
        
        <div className="absolute bottom-20 right-20 text-pure-black/25">
          <GeometricShape type="cross" className="w-16 h-16" delay={0.8} />
        </div>

        {/* Diagonal stripe */}
        <div 
          className="absolute top-0 right-1/3 w-32 h-full bg-pure-black/5 -skew-x-12"
          style={{ transform: 'skewX(-12deg)' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 min-h-screen flex items-center">
        <div className="grid grid-cols-12 gap-8 w-full items-center">
          {/* Left Content - 7 columns */}
          <motion.div 
            className="col-span-12 lg:col-span-7"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Overline */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm uppercase tracking-[0.3em] text-pure-black/60 mb-6 font-medium"
            >
              TENET Platform v2.0
            </motion.p>

            {/* Main Title */}
            <h1 
              id="hero-title"
              className="text-hero font-bold text-pure-black leading-[0.9] tracking-tighter mb-8"
            >
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                4NJZ4
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white"
              >
                ESPORTS
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl md:text-2xl text-pure-black/80 max-w-xl mb-12 leading-relaxed"
            >
              Advanced analytics and simulation platform for tactical FPS esports. 
              Five hubs. Infinite insights.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/sator"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-pure-black text-white font-semibold uppercase tracking-wider text-sm hover:bg-white hover:text-pure-black transition-all duration-300"
              >
                Explore SATOR
                <svg 
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-pure-black text-pure-black font-semibold uppercase tracking-wider text-sm hover:bg-pure-black hover:text-white transition-all duration-300"
              >
                View Dashboard
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Content - 5 columns - Hub Preview Cards */}
          <motion.div 
            className="col-span-12 lg:col-span-5 relative"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative h-[400px] lg:h-[500px]">
              {/* Floating Hub Cards */}
              {[
                { name: 'SATOR', color: 'bg-pure-black', text: 'text-white', x: 0, y: 0, delay: 0.5 },
                { name: 'ROTAS', color: 'bg-white', text: 'text-pure-black', x: 40, y: 80, delay: 0.6 },
                { name: 'AREPO', color: 'bg-kunst-green', text: 'text-white', x: -20, y: 160, delay: 0.7 },
                { name: 'OPERA', color: 'bg-accent-cyan', text: 'text-pure-black', x: 60, y: 240, delay: 0.8 },
                { name: 'TENET', color: 'bg-accent-purple', text: 'text-white', x: 20, y: 320, delay: 0.9 },
              ].map((hub, index) => (
                <motion.div
                  key={hub.name}
                  initial={{ opacity: 0, scale: 0.8, x: hub.x + 20 }}
                  animate={{ opacity: 1, scale: 1, x: hub.x }}
                  transition={{ 
                    duration: 0.5, 
                    delay: hub.delay,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                  whileHover={{ scale: 1.05, x: hub.x + 10 }}
                  className={`absolute w-32 h-20 ${hub.color} ${hub.text} flex items-center justify-center font-bold text-sm uppercase tracking-wider cursor-pointer shadow-lg`}
                  style={{ 
                    top: hub.y,
                    left: '50%',
                    marginLeft: '-64px'
                  }}
                >
                  {hub.name}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom geometric bar */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-pure-black" />
      
      {/* Side accent */}
      <div className="absolute top-0 left-0 w-2 h-full bg-pure-black/10" />
    </section>
  );
}

export default HeroV2;
