import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * GlowButton - Action button with glow effect
 * 
 * Variants:
 * - primary: Filled with gradient, strong glow
 * - secondary: Outlined, subtle glow
 * - ghost: Transparent, minimal
 */
export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  glowColor = '#ff4655',
  onClick,
  disabled = false,
  className,
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const variantClasses = {
    primary: cn(
      'bg-gradient-to-r from-[#ff4655] to-[#ff6b00]',
      'text-white font-semibold',
      'shadow-lg'
    ),
    secondary: cn(
      'bg-transparent',
      'border border-current',
      'text-white font-medium'
    ),
    ghost: cn(
      'bg-transparent',
      'text-white/80 hover:text-white'
    ),
  };
  
  return (
    <motion.button
      className={cn(
        'relative rounded-lg font-sans',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={
        disabled
          ? {}
          : {
              scale: 1.05,
              boxShadow: `0 0 30px ${glowColor}`,
            }
      }
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

export default GlowButton;
