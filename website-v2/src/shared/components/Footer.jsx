import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Twitter, MessageCircle } from 'lucide-react'

function Footer() {
  return (
    <footer className="border-t border-mist bg-void-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display font-bold text-xl mb-4">NJZ ¿!? Platform</h3>
            <p className="text-slate text-sm mb-4 max-w-md">
              Twin-file database system with SATOR/ROTAS infrastructure. 
              4eva and Nvr Die.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate hover:text-signal-cyan transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate hover:text-signal-cyan transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate hover:text-signal-cyan transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hubs */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-slate">
              Hubs
            </h4>
            <ul className="space-y-2">
              <li><Link to="/sator" className="text-sm text-slate hover:text-signal-amber transition-colors">SATOR</Link></li>
              <li><Link to="/rotas" className="text-sm text-slate hover:text-signal-cyan transition-colors">ROTAS</Link></li>
              <li><Link to="/info" className="text-sm text-slate hover:text-porcelain transition-colors">Information</Link></li>
              <li><Link to="/games" className="text-sm text-slate hover:text-deep-cobalt transition-colors">Games</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-slate">
              Legal
            </h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-mist flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate">
            © 2024 NJZ Platform. Twin-file integrity system.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer