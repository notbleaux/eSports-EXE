import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * ModernCard - Enhanced glassmorphism card with gradient borders
 * 
 * Features:
 * - Animated gradient border on hover
 * - Enhanced backdrop blur
 * - Smooth scale and glow transitions
 * - Optional icon header with gradient background
 */
export function ModernCard({
  children,
  className,
  hoverGlow,
  onClick,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
}) {
  return (
    <motion.div
      className={cn(
        'relative group overflow-hidden rounded-2xl',
        'bg-white/[0.03] backdrop-blur-xl',
        'border border-white/10',
        'transition-all duration-500',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.3 },
      }}
      onClick={onClick}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: hoverGlow 
            ? `linear-gradient(135deg, ${hoverGlow}40 0%, transparent 50%, ${hoverGlow}20 100%)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
          padding: '1px',
        }}
      >
        <div className="w-full h-full rounded-2xl bg-[#0a0a0f]" />
      </motion.div>

      {/* Inner glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: hoverGlow 
            ? `radial-gradient(circle at 50% 0%, ${hoverGlow}30 0%, transparent 60%)`
            : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header with icon */}
        {(Icon || title) && (
          <div className="flex items-start justify-between mb-4">
            {Icon && (
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ 
                  background: iconColor 
                    ? `linear-gradient(135deg, ${iconColor}30 0%, ${iconColor}10 100%)`
                    : 'rgba(255,255,255,0.05)',
                  border: iconColor ? `1px solid ${iconColor}30` : '1px solid rgba(255,255,255,0.1)',
                }}
                whileHover={{ scale: 1.05, rotate: 2 }}
              >
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: iconColor || 'rgba(255,255,255,0.7)' }}
                />
              </motion.div>
            )}
            
            {badge && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/60">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Title section */}
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-white/50">{subtitle}</p>
            )}
          </div>
        )}

        {/* Main content */}
        {children}
      </div>
    </motion.div>
  );
}

export default ModernCard;
