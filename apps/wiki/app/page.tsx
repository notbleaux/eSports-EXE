/**
 * NJZ Wiki — Home Page
 *
 * Entry page for the NJZ eSports media and knowledge base.
 * Renders game world entries for Valorant and CS2.
 * [Ver001.000]
 */

const WIKI_ENTRIES = [
  {
    slug: 'valorant',
    title: 'Valorant',
    description: 'Agents, maps, abilities, patch notes, and team strategy guides.',
    icon: '⚡',
  },
  {
    slug: 'cs2',
    title: 'Counter-Strike 2',
    description: 'Maps, weapons, strategies, and the competitive meta.',
    icon: '🎯',
  },
]

export default function WikiHome() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        NJZ Knowledge Base
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem' }}>
        Guides, stats, and editorial content for the NJZ eSports community.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {WIKI_ENTRIES.map((entry) => (
          <div
            key={entry.slug}
            style={{
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{entry.icon}</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{entry.title}</h2>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              {entry.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
