import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, Menu, X, Zap } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/players', label: 'Players' },
  { path: '/matches', label: 'Matches' },
  { path: '/analytics', label: 'Analytics' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-radiant-black/80 backdrop-blur-md border-b border-radiant-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-radiant-red rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="font-mono font-bold text-xl hidden sm:block">SATOR</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-radiant-card'
                      : 'text-radiant-gray hover:text-white hover:bg-radiant-card/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-radiant-gray hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Live Indicator */}
            <Link
              to="/matches?status=live"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-radiant-red/10 border border-radiant-red/30 rounded-full"
            >
              <div className="w-2 h-2 bg-radiant-red rounded-full live-dot" />
              <span className="text-xs font-medium text-radiant-red">LIVE</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-radiant-gray hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-3 border-t border-radiant-border animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-radiant-gray" />
              <input
                type="text"
                placeholder="Search players, teams, matches..."
                className="w-full pl-12 pr-4 py-2 bg-radiant-card border border-radiant-border rounded-lg text-white placeholder-radiant-gray focus:outline-none focus:border-radiant-red/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-radiant-border bg-radiant-black">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-radiant-card'
                      : 'text-radiant-gray hover:text-white hover:bg-radiant-card/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
