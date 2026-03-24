/**
 * Footer Component
 * Platform footer with hub navigation and twin-file status
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Twitter, MessageCircle, Zap, Shield, Database } from 'lucide-react'
import { useTwinFile } from '../store/njzStore'

function Footer() {
  const { integrity } = useTwinFile()

  return (
    <footer className="border-t border-mist bg-void-deep relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-signal-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-aged-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-signal-cyan to-aged-gold flex items-center justify-center">
                <Zap className="w-5 h-5 text-void-black" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">NJZ ¿!? Platform</h3>
              </div>
            </div>
            
            <p className="text-slate text-sm mb-4">
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
              <li>
                <Link to="/sator" className="text-sm text-slate hover:text-alert-amber transition-colors flex items-center gap-2">
                  <span className="text-alert-amber">◎</span> SATOR
                </Link>
              </li>
              <li>
                <Link to="/rotas" className="text-sm text-slate hover:text-signal-cyan transition-colors flex items-center gap-2">
                  <span className="text-signal-cyan">◈</span> ROTAS
                </Link>
              </li>
              <li>
                <Link to="/arepo" className="text-sm text-slate hover:text-porcelain transition-colors flex items-center gap-2">
                  <span className="text-porcelain">◉</span> AREPO
                </Link>
              </li>
              <li>
                <Link to="/opera" className="text-sm text-slate hover:text-cobalt transition-colors flex items-center gap-2">
                  <span className="text-cobalt">◆</span> OPERA
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-slate">
              Resources
            </h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Status Page</a></li>
              <li><a href="#" className="text-sm text-slate hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Twin File Status */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-slate">
              System Status
            </h4>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-void-mid border border-mist">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-alert-amber" />
                  <span className="text-xs font-mono text-alert-amber">RAWS</span>
                </div>
                <div className="text-xs text-slate">Immutable snapshots</div>
              </div>
              
              <div className="p-3 rounded-lg bg-void-mid border border-mist">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-signal-cyan" />
                  <span className="text-xs font-mono text-signal-cyan">BASE</span>
                </div>
                <div className="text-xs text-slate">Analytics layers</div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">Integrity: {integrity.correlation}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-mist flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate">
            © 2025 NJZ Platform. Twin-file integrity system. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-slate hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-xs text-slate hover:text-white transition-colors">Cookies</a>
            
            <div className="flex items-center gap-2 text-xs text-slate">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
