"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EnergyBorder from "./EnergyBorder";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate 8x8 checkerboard grid
  const gridSize = 8;
  const squares = Array.from({ length: gridSize * gridSize }, (_, i) => ({
    id: i,
    row: Math.floor(i / gridSize),
    col: i % gridSize,
    isPink: (Math.floor(i / gridSize) + (i % gridSize)) % 2 === 1,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0.3,
      },
    },
  };

  const squareVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateY: 90,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (!mounted) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-exe-black">
        <div className="text-exe-cyan font-orbitron">LOADING...</div>
      </section>
    );
  }

  return (
    <section className="min-h-screen relative overflow-hidden bg-exe-black flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-8 grid-rows-8 h-full w-full"
        >
          {squares.map((square) => (
            <motion.div
              key={square.id}
              variants={squareVariants}
              className={`relative overflow-hidden ${
                square.isPink ? "bg-exe-hot-pink" : "bg-exe-black"
              }`}
              style={{
                backgroundImage: square.isPink 
                  ? 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'noise\' x=\'0\' y=\'0\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23noise)\'/%3E%3C/svg%3E")'
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Gloss effect on pink squares */}
              {square.isPink && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EnergyBorder className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-16 bg-exe-black/80 backdrop-blur-sm">
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-exe-cyan" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-exe-cyan" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-exe-cyan" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-exe-cyan" />

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-center"
            >
              <h1 className="font-orbitron font-black text-5xl md:text-7xl lg:text-8xl tracking-wider mb-4">
                <span className="text-white">DARE</span>
                <span className="text-exe-hot-pink"> TO</span>
                <span className="text-white"> WEAR</span>
              </h1>
              
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="h-1 bg-gradient-to-r from-exe-cyan via-exe-hot-pink to-exe-cyan mb-6"
              />

              <p className="text-exe-cyan font-mono text-lg md:text-xl tracking-widest mb-8">
                eSports-EXE MISSION CONTROL
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 0, 110, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-exe-hot-pink text-white font-orbitron font-bold tracking-wider border-2 border-exe-hot-pink hover:bg-transparent transition-colors"
                >
                  ENTER ARENA
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 240, 255, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-transparent text-exe-cyan font-orbitron font-bold tracking-wider border-2 border-exe-cyan hover:bg-exe-cyan/10 transition-colors"
                >
                  VIEW STATS
                </motion.button>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 text-xs font-mono text-exe-cyan/50">
              SYS.VER.2.4.1
            </div>
            <div className="absolute top-4 right-4 text-xs font-mono text-exe-cyan/50">
              ONLINE
            </div>
            <div className="absolute bottom-4 left-4 text-xs font-mono text-exe-hot-pink/50">
              LATENCY: 12ms
            </div>
            <div className="absolute bottom-4 right-4 text-xs font-mono text-exe-hot-pink/50">
              SECURE
            </div>
          </div>
        </EnergyBorder>
      </div>

      {/* Scanline Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-exe-cyan/5 to-transparent animate-scanline" />
      </div>
    </section>
  );
}
