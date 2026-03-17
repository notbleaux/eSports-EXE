/**
 * NJZ Primordial Waters - Subtle waterfall edge effect
 * Prussian Blue base, cyan accents
 */
import React from 'react'

const NJZWaterfall: React.FC<{ direction?: 'up' | 'down'; className?: string }> = ({
  direction = 'down',
  className = ''
}) => (
  <div
    className={`
    fixed bottom-0 left-0 w-full h-32 md:h-48 lg:h-64 overflow-hidden z-0
    ${direction === 'up' ? 'top-0' : 'bottom-0'}
    ${className}
  `}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-prussian-blue/90 via-cyan/10 to-transparent" />

    <div
      className={`
      absolute inset-0 bg-[linear-gradient(90deg,transparent_30%,rgba(6,182,212,0.03)_50%,transparent_70%)]
      animate-waterfall-${direction}
      bg-[length:200%_100%]
    `}
    />

    <div className="absolute inset-0 opacity-20">
      <div className="w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />
      <div className="w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.08)_0%,transparent_50%)]" />
    </div>
  </div>
)

export default NJZWaterfall
