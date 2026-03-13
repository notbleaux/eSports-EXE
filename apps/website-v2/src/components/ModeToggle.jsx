/**
 * ModeToggle - SATOR ↔ ROTAS Mode Switcher
 * 
 * [Ver001.000]
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Activity } from 'lucide-react';
import { useModeStore, AppMode } from '@/store/modeStore';

export function ModeToggle({ className = '' }) {
  const { mode, toggleMode, isTransitioning } = useModeStore();
  const isSator = mode === AppMode.SATOR;
  
  return (
    <motion.button
      onClick={toggleMode}
      disabled={isTransitioning}
      className={`
        relative flex items-center gap-3 px-4 py-2 rounded-xl
        border transition-all duration-300
        ${className}
      `}
      style={{
        backgroundColor: isSator 
          ? 'rgba(0, 212, 255, 0.1)' 
          : 'rgba(255, 70, 85, 0.1)',
        borderColor: isSator
          ? 'rgba(0, 212, 255, 0.3)'
          : 'rgba(255, 70, 85, 0.3)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Mode Icons */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{
            color: isSator ? '#00D4FF' : '#FFFFFF',
            opacity: isSator ? 1 : 0.5,
          }}
          className="flex items-center gap-1.5"
        >
          <Database className="w-4 h-4" />
          <span className="text-sm font-medium">SATOR</span>
        </motion.div>
        
        {/* Toggle Switch */}
        <div 
          className="relative w-12 h-6 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full"
            animate={{
              left: isSator ? '4px' : '28px',
              backgroundColor: isSator ? '#00D4FF' : '#FF4655',
              boxShadow: isSator 
                ? '0 0 10px rgba(0, 212, 255, 0.5)' 
                : '0 0 10px rgba(255, 70, 85, 0.5)',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
        
        <motion.div
          animate={{
            color: !isSator ? '#FF4655' : '#FFFFFF',
            opacity: !isSator ? 1 : 0.5,
          }}
          className="flex items-center gap-1.5"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">ROTAS</span>
        </motion.div>
      </div>
      
      {/* Transition Indicator */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default ModeToggle;
