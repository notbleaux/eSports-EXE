/**
 * NJZ LiveStream Overlay
 * OBS Browser Source overlay for live match score display.
 *
 * Phase 5 stub — imports @njz/types and @njz/ui (gate 5.4).
 * Full implementation planned for Phase 5 (Month 3+).
 * [Ver001.000]
 */
import React from 'react'
import { GameNodeBadge } from '@njz/ui'

export function App() {
  return (
    <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem' }}>
      <GameNodeBadge gameId="valorant" verified />
      <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)' }}>
        NJZ Overlay — Phase 5 stub
      </span>
    </div>
  )
}
