/**
 * NotFoundPage — 404 route for the NJZiteGeisTe Platform
 * [Ver001.000]
 */
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const HUBS = [
  { label: 'SATOR — Analytics', href: '/analytics', color: '#ffd700' },
  { label: 'ROTAS — Stats', href: '/stats', color: '#00d4ff' },
  { label: 'AREPO — Community', href: '/community', color: '#0066ff' },
  { label: 'OPERA — Pro Scene', href: '/pro-scene', color: '#9d4edd' },
  { label: 'TENET — Hubs', href: '/hubs', color: '#ff4655' },
];

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#0a0a0a', color: '#e5e7eb' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Glitch-style 404 */}
        <div className="relative">
          <h1
            className="text-9xl font-black font-mono select-none"
            style={{ color: '#1a1a1a', textShadow: '3px 3px 0 #ffd700, -3px -3px 0 #ff4655' }}
          >
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-xl font-semibold">Route not found</p>
          <p className="text-sm text-gray-500 font-mono break-all">
            {location.pathname}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            The SATOR palindrome resolves — but this path does not.
          </p>
        </div>

        {/* Hub navigation */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">
            Navigate to a hub
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HUBS.map(hub => (
              <Link
                key={hub.href}
                to={hub.href}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-all duration-200"
                style={{
                  border: `1px solid ${hub.color}30`,
                  color: hub.color,
                  backgroundColor: `${hub.color}08`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${hub.color}15`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${hub.color}60`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${hub.color}08`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${hub.color}30`;
                }}
              >
                <span className="text-xs">→</span>
                {hub.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Back home */}
        <Link
          to="/"
          className="inline-block text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
        >
          ← Back to landing page
        </Link>
      </motion.div>
    </div>
  );
}
