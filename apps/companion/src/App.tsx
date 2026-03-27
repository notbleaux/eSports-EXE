/**
 * NJZ Companion App
 * React Native / Expo app stub for NJZ eSports mobile companion.
 *
 * Phase 5 stub — imports @njz/types and @njz/ui (gate 5.4).
 * Full implementation planned for Phase 5 (Month 3+).
 * [Ver001.000]
 */
import React from 'react'
import { GameNodeBadge } from '@njz/ui'

export function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <GameNodeBadge gameId="valorant" verified />
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '1.5rem' }}>
        NJZ Companion
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
        Phase 5 stub — full implementation pending
      </p>
    </div>
  )
}
