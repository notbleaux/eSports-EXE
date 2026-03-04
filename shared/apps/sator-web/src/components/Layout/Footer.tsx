import { Link } from 'react-router-dom';
import { Github, Twitter, Discord } from 'lucide-react';

const footerLinks = {
  platform: [
    { label: 'Dashboard', href: '/' },
    { label: 'Players', href: '/players' },
    { label: 'Matches', href: '/matches' },
    { label: 'Analytics', href: '/analytics' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api' },
    { label: 'GitHub', href: 'https://github.com', external: true },
  ],
  community: [
    { label: 'Twitter', href: 'https://twitter.com', external: true, icon: Twitter },
    { label: 'Discord', href: 'https://discord.com', external: true, icon: Discord },
    { label: 'GitHub', href: 'https://github.com', external: true, icon: Github },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-radiant-black border-t border-radiant-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-radiant-red rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">S</span>
              </div>
              <span className="font-mono font-bold text-xl">SATOR</span>
            </Link>
            <p className="text-radiant-gray text-sm leading-relaxed">
              Advanced esports analytics platform powered by the SATOR engine.
            </p>
            <div className="flex items-center gap-4 mt-4">
              {footerLinks.community.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-radiant-gray hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-radiant-gray hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-radiant-gray hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && (
                      <span className="text-xs">↗</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Updates */}
          <div>
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-radiant-gray text-sm mb-4">
              Get the latest analytics updates and features.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-radiant-card border border-radiant-border rounded-lg text-white placeholder-radiant-gray text-sm focus:outline-none focus:border-radiant-red/50"
              />
              <button className="px-4 py-2 bg-radiant-red hover:bg-radiant-red/90 text-white text-sm font-medium rounded-lg transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-radiant-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-radiant-gray text-sm">
            © {currentYear} SATOR Analytics. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-radiant-gray hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-radiant-gray hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
