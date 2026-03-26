import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * TeNeT Portal (Home Portal)
 * Authoritative entry point for the NJZiteGeisTe Platform.
 * [Ver001.000]
 */
export function TeNeTPortal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-boitano-pink relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Sharp Geometry Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border-[12px] border-black rotate-45" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 border-[8px] border-black -rotate-12" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 border-[4px] border-black rotate-90" />
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 text-center max-w-4xl"
      >
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 mb-8"
          animate={{ boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 30px rgba(0,0,0,0.1)', '0 0 0 rgba(0,0,0,0)'] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Shield className="w-4 h-4 text-black" />
          <span className="text-sm font-mono font-bold uppercase tracking-widest text-black/80">
            TENET Navigation Layer — v2.1.0
          </span>
        </motion.div>

        <h1 className="text-hero text-black uppercase mb-4 leading-none">
          TeNeT Portal
        </h1>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-black mb-12 tracking-tight">
          NJZiteGeisTe Platform Entry
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="flex flex-col items-center gap-3">
            <Globe className="w-8 h-8 text-black" />
            <h3 className="text-xl font-bold uppercase tracking-widest">Network</h3>
            <p className="text-sm text-black/60 font-medium">Verified data nodes across all game worlds.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-8 h-8 text-black" />
            <h3 className="text-xl font-bold uppercase tracking-widest">Analytics</h3>
            <p className="text-sm text-black/60 font-medium">SimRating v2 and Path-A/B distribution.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Shield className="w-8 h-8 text-black" />
            <h3 className="text-xl font-bold uppercase tracking-widest">Security</h3>
            <p className="text-sm text-black/60 font-medium">Authoritative truth legacy verification.</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/hubs')}
          className="
            px-12 py-5 bg-black text-white text-xl font-bold uppercase tracking-[0.2em]
            transform transition-all duration-300
            hover:scale-105 hover:shadow-sharp active:scale-95
          "
        >
          Enter Platform
        </button>
      </motion.div>

      {/* Footer info */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-black/40">
          TENET Layer: Home Portal — Node Status: ACTIVE
        </p>
      </div>
    </div>
  );
}
