/**
 * TENETLoader - ASCII-inspired 5x5 loading animations
 * Variants: sator, rotas, oooo, exe
 * [Ver001.000]
 */

import React from 'react'

interface TENETLoaderProps {
  variant?: 'sator' | 'rotas' | 'oooo' | 'exe'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TENETLoader: React.FC<TENETLoaderProps> = ({
  variant = 'sator',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs leading-[0.75rem] w-20 h-20',
    md: 'text-sm leading-[1rem] w-32 h-32',
    lg: 'text-base leading-[1.25rem] w-48 h-48'
  }

  const frameClasses = `font-mono font-black bg-gradient-to-br from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse`

  const renderSquare = (rows: string[], animateClass = '') => (
    <div className={`grid grid-cols-5 gap-[0.1em] ${sizeClasses[size]} ${animateClass}`}>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-[0.1em] justify-center">
          {row.split(' ').map((char, j) => (
            <span
              key={j}
              className={`${frameClasses} ${animateClass} opacity-80 hover:opacity-100 transition-all`}
            >
              {char === '.' ? ' ' : char}
            </span>
          ))}
        </div>
      ))}
    </div>
  )

  const animations = {
    sator: 'animate-sator-pulse [animation-delay:0s,0.1s,0.2s,0.3s,0.4s]',
    rotas: 'animate-rotas-wave',
    oooo: 'animate-oooo-blink',
    exe: 'animate-exe-sequence'
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-black/50 border border-cyan-500/30 backdrop-blur-sm ${className}`}
    >
      {variant === 'sator' &&
        renderSquare(
          ['S A T O R', 'A R E P O', 'T E N E T', 'O P E R A', 'R O T A S'],
          animations.sator
        )}

      {variant === 'rotas' &&
        renderSquare(
          ['R O T A S', 'O P E R A', 'T E N E T', 'A R E P O', 'S A T O R'],
          animations.rotas
        )}

      {variant === 'oooo' &&
        renderSquare(
          ['o o o o o', 'o o o o o', 'o 4 N J Z o', 'o o o o o', 'o o o o o'],
          animations.oooo
        )}

      {variant === 'exe' && (
        <div
          className={`${sizeClasses[size]} ${frameClasses} animate-exe-sequence whitespace-pre text-center leading-tight`}
        >
          {`XxX___/EXE___\___XxX\n|!|*O*T*O*|?|`}
        </div>
      )}

      <div className="text-xs text-cyan-400/70 font-mono tracking-wider">
        TENET {variant.toUpperCase()}
      </div>
    </div>
  )
}

export default TENETLoader
