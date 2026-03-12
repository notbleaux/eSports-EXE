/**
 * DirectoryList Component
 * Displays categorized directory navigation with blue AREPO theme
 * 
 * Uses exact color: #0066ff (Royal Blue)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { FolderTree, ChevronRight } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';

function DirectoryList({ 
  categories, 
  activeCategory, 
  onCategorySelect,
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) {
  return (
    <GlassCard 
      hoverGlow={hubGlow}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderTree className="w-5 h-5" style={{ color: hubColor }} />
          <h3 className="font-display font-semibold text-lg">Browse by Category</h3>
        </div>
        <div className="text-xs text-slate">
          {categories.length} categories
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const Icon = category.icon;
          const isActive = activeCategory?.id === category.id;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategorySelect(category)}
              className={`
                relative p-5 rounded-xl border text-left transition-all duration-300
                ${isActive 
                  ? 'bg-[#0066ff]/10 border-[#0066ff]' 
                  : 'bg-void-mid border-mist hover:border-[#0066ff]/50'
                }
              `}
              style={{
                boxShadow: isActive ? `0 0 20px ${hubGlow}` : 'none'
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-[#0066ff]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: isActive ? `${hubColor}20` : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    style={{ color: isActive ? hubColor : '#a0a0b0' }}
                  />
                </div>

                {/* Content */}
                <h4 
                  className="font-display font-semibold mb-1"
                  style={{ color: isActive ? hubColor : '#ffffff' }}
                >
                  {category.name}
                </h4>
                
                <p className="text-sm text-slate mb-3">
                  {category.items} items
                </p>

                {/* Action hint */}
                <div className="flex items-center gap-1 text-xs" style={{ color: hubColor }}>
                  <span>Browse</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Category Details */}
      {activeCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-mist"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display font-semibold" style={{ color: hubColor }}>
              {activeCategory.name}
            </h4>
            <button 
              onClick={() => onCategorySelect(null)}
              className="text-xs text-slate hover:text-white transition-colors"
            >
              Clear selection
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-void-mid border border-mist
                         hover:border-[#0066ff]/30 transition-colors cursor-pointer group"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hubColor }}
                />
                <span className="text-sm text-slate group-hover:text-white transition-colors">
                  Sample {activeCategory.name} Item {i + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}

export default DirectoryList;
