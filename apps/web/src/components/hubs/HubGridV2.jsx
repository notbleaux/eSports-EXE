/**
 * HubGridV2 Component - Asymmetric Colored Cards
 * Swiss-inspired asymmetric grid layout
 * 
 * [Ver001.000]
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const hubs = [
  {
    id: 'sator',
    name: 'Analytics',
    path: '/analytics',
    subtitle: 'Analytics',
    description: 'Advanced player metrics, SimRating, and RAR decomposition.',
    color: 'bg-pure-black',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
    gridClass: 'col-span-12 md:col-span-6 lg:col-span-5 row-span-2',
    stats: ['50K+ Players', 'Real-time'],
  },
  {
    id: 'rotas',
    name: 'Stats',
    path: '/stats',
    subtitle: 'Simulation',
    description: 'Deterministic tactical FPS match simulation.',
    color: 'bg-boitano-pink',
    textColor: 'text-pure-black',
    accentColor: 'bg-pure-black/10',
    gridClass: 'col-span-12 md:col-span-6 lg:col-span-7',
    stats: ['Godot 4 Engine', '20 TPS'],
  },
  {
    id: 'arepo',
    name: 'Community',
    path: '/community',
    subtitle: 'Tactical Maps',
    description: 'Interactive map viewer with callouts and strategies.',
    color: 'bg-kunst-green',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
    gridClass: 'col-span-12 md:col-span-4',
    stats: ['All Maps', 'Lineups'],
  },
  {
    id: 'opera',
    name: 'Pro Scene',
    path: '/pro-scene',
    subtitle: 'Live Events',
    description: 'Live match tracking, fantasy leagues, and predictions.',
    color: 'bg-accent-cyan',
    textColor: 'text-pure-black',
    accentColor: 'bg-pure-black/10',
    gridClass: 'col-span-12 md:col-span-4',
    stats: ['Live Now', 'Fantasy'],
  },
  {
    id: 'tenet',
    name: 'Hubs',
    path: '/hubs',
    subtitle: 'Central Hub',
    description: 'Settings, profile, and unified dashboard.',
    color: 'bg-accent-purple',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
    gridClass: 'col-span-12 md:col-span-4',
    stats: ['Settings', 'Profile'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

function HubCard({ hub, index }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`${hub.gridClass} group relative overflow-hidden`}
    >
      <Link
        to={hub.path}
        className={`block h-full min-h-[200px] ${hub.color} ${hub.textColor} p-8 relative overflow-hidden transition-transform duration-500`}
      >
        {/* Background Pattern */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${hub.accentColor}`}>
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.3
            }}
          />
        </div>

        {/* Index Number */}
        <span className="absolute top-6 right-6 text-6xl font-bold opacity-10">
          0{index + 1}
        </span>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="mb-auto">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60 mb-2">
              {hub.subtitle}
            </p>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
              {hub.name}
            </h3>
          </div>

          {/* Description */}
          <p className={`mt-6 text-sm leading-relaxed opacity-80 max-w-xs ${hub.id === 'sator' ? 'md:max-w-sm' : ''}`}>
            {hub.description}
          </p>

          {/* Stats */}
          <div className="mt-6 flex gap-4">
            {hub.stats.map((stat) => (
              <span 
                key={stat}
                className="text-xs uppercase tracking-wider px-3 py-1 border border-current/30"
              >
                {stat}
              </span>
            ))}
          </div>

          {/* Arrow Link */}
          <div className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider group-hover:gap-4 transition-all duration-300">
            <span>Enter Hub</span>
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Hover border accent */}
        <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${hub.textColor === 'text-white' ? 'bg-white' : 'bg-pure-black'}`} />
      </Link>
    </motion.div>
  );
}

export function HubGridV2() {
  return (
    <section 
      className="py-20 bg-off-white"
      aria-labelledby="hubs-title"
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-text-secondary mb-4">
            Platform Hubs
          </p>
          <h2 
            id="hubs-title"
            className="text-display text-pure-black"
          >
            Five Dimensions
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl">
            Each hub represents a unique facet of the esports experience, 
            from deep analytics to live event coverage.
          </p>
        </motion.div>

        {/* Asymmetric Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-12 gap-4"
        >
          {hubs.map((hub, index) => (
            <HubCard key={hub.id} hub={hub} index={index} />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            to="/home"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-pure-black text-pure-black font-semibold uppercase tracking-wider text-sm hover:bg-pure-black hover:text-white transition-all duration-300"
          >
            View Home
            <svg 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default HubGridV2;
