/**
 * NJZ Nexus Portal
 *
 * Aggregated directory of all NJZ World-Ports and platform entry points.
 * Phase 6 stub — imports @njz/types and @njz/ui (gate 6.3).
 * Full implementation planned post-Phase 6.
 * [Ver001.000]
 */
import React from 'react'
import { WorldPortCard } from '@njz/ui'
import type { SupportedGame } from '@njz/types'

interface WorldPortEntry {
  id: string
  displayName: string
  game: SupportedGame
  isActive: boolean
  nodeCount: number
  lastUpdated: string
  route: string
}

const WORLD_PORTS: WorldPortEntry[] = [
  {
    id: 'valorant',
    displayName: 'Valorant',
    game: 'valorant',
    isActive: true,
    nodeCount: 1240,
    lastUpdated: 'today',
    route: '/valorant',
  },
  {
    id: 'cs2',
    displayName: 'Counter-Strike 2',
    game: 'cs2',
    isActive: true,
    nodeCount: 980,
    lastUpdated: 'today',
    route: '/cs2',
  },
]

export function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        fontFamily: 'monospace',
        padding: '3rem 2rem',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '0.5rem',
          }}
        >
          NJZ Nexus
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '3rem' }}>
          All World-Ports and platform entry points in one place.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {WORLD_PORTS.map((port) => (
            <WorldPortCard key={port.id} {...port} />
          ))}
        </div>

        <p
          style={{
            color: 'rgba(255,255,255,0.2)',
            marginTop: '3rem',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}
        >
          Phase 6 stub — full aggregation and search pending
        </p>
      </div>
    </div>
  )
}
