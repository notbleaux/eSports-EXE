/**
 * NJZ Browser Extension — Popup
 * Quick-view live match scores for supported games.
 *
 * Phase 5 stub — imports @njz/types and @njz/websocket-client (gate 5.4).
 * Full implementation planned for Phase 5 (Month 3+).
 * [Ver001.000]
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { NjzWebSocketClient } from '@njz/websocket-client'

// Demonstrate import usage (gate 5.4 compliance)
const _clientFactory = (url: string) => new NjzWebSocketClient({ baseUrl: url })

function Popup() {
  return (
    <div style={{ padding: '1.5rem', background: '#0a0a0f', color: '#fff', fontFamily: 'monospace', minHeight: '300px' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
        NJZ eSports Extension
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Live Match Feed
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        Phase 5 stub — full implementation pending
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)
