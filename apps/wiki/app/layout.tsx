/**
 * NJZ Wiki — Root Layout
 *
 * Media & Wiki app for the NJZ eSports platform.
 * Phase 6 stub — renders content, full editorial system planned post-Phase 6.
 * [Ver001.000]
 */
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'NJZ Wiki',
  description: 'NJZ eSports Media & Knowledge Base — Valorant and CS2',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0f', color: '#fff', fontFamily: 'monospace' }}>
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            NJZ Wiki
          </span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
