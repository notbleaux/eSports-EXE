/**
 * StatsGrid Component
 * Grid display of StatBadge components for SATOR Hub
 * 
 * [Ver001.000]
 */
import { motion } from 'framer-motion';
import { StatBadge } from '@/components/ui/StatBadge';
import { colors } from '@/theme/colors';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * StatsGrid - Displays a grid of player statistics
 * 
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects { value, label, trend }
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.hubColor - Primary hub color (#ffd700 for SATOR)
 * @param {string} props.hubGlow - Hub glow color
 */
export function StatsGrid({ 
  stats = [], 
  isLoading = false,
  hubColor = colors.hub.sator.base,
  hubGlow = colors.hub.sator.glow,
}) {
  // Default stats if none provided
  const defaultStats = [
    { value: 2847, label: 'Teams', trend: 'up' },
    { value: 156, label: 'Matches', trend: 'neutral' },
    { value: 12847, label: 'Players', trend: 'up' },
    { value: 48, label: 'Tournaments', trend: 'up' },
    { value: 2400000, label: 'Records', trend: 'up' },
    { value: 99.9, label: 'Uptime %', trend: 'neutral' },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center px-4 py-6 rounded-lg animate-pulse"
            style={{ 
              backgroundColor: colors.porcelain.frost,
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            <div 
              className="w-16 h-8 rounded mb-2"
              style={{ backgroundColor: colors.border.subtle }}
            />
            <div 
              className="w-12 h-4 rounded"
              style={{ backgroundColor: colors.border.subtle }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {displayStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
            boxShadow: `0 0 20px ${hubGlow}`,
          }}
          transition={{ duration: 0.15 }}
        >
          <StatBadge
            value={stat.value}
            label={stat.label}
            trend={stat.trend}
            color={hubColor}
            animate={true}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StatsGrid;
