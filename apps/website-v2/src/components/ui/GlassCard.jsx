import { motion } from 'framer-motion';
import { useReducedMotion, Ripple } from '@/utils/fluid.js';
import { cn } from '@/utils/cn';

/**
 * GlassCard - Primary container component
 * 
 * Visual Spec:
 * - Background: rgba(255, 255, 255, 0.05) with backdrop-blur
 * - Border: 1px solid #2a2a3a
 * - Border radius: 12px
 * - Hover: Border color transitions to hub color with glow
 */
export function GlassCard({ children, className, hoverGlow, onClick, as: Component = 'div' }) {
  const reducedMotion = useReducedMotion();
  return (
    <Ripple className={cn(
      'relative overflow-hidden rounded-xl',
      'bg-white/5 backdrop-blur-md',
      'border border-[#2a2a3a]',
      'transition-colors duration-150',
      onClick && 'cursor-pointer',
      className
    )}>
      <motion.div
        whileHover={!reducedMotion ? {
          scale: 1.02,
          borderColor: hoverGlow || '#3a3a4a',
          boxShadow: hoverGlow ? `0 0 20px ${hoverGlow}` : 'none',
        } : {}} 
        transition={{ duration: 0.15 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    </Ripple>
  );
}

export default GlassCard;
