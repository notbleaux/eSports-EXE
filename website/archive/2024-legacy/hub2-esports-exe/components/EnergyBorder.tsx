"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface EnergyBorderProps {
  children: ReactNode;
  className?: string;
  color?: "exe-cyan" | "exe-hot-pink" | "exe-neon-pink" | "exe-electric";
  animated?: boolean;
}

export default function EnergyBorder({
  children,
  className = "",
  color = "exe-cyan",
  animated = true,
}: EnergyBorderProps) {
  const colorMap = {
    "exe-cyan": "#00F0FF",
    "exe-hot-pink": "#FF006E",
    "exe-neon-pink": "#FF1493",
    "exe-electric": "#39FF14",
  };

  const glowColor = colorMap[color];

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={animated ? { scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Animated border gradient */}
      <div
        className="absolute -inset-0.5 rounded-lg animate-border-flow"
        style={{
          background: `linear-gradient(90deg, ${glowColor}00, ${glowColor}, ${glowColor}00)`,
          backgroundSize: "200% 100%",
          filter: "blur(2px)",
        }}
      />

      {/* Main border */}
      <div
        className="absolute inset-0 rounded-lg border-2"
        style={{
          borderColor: glowColor,
          boxShadow: `0 0 20px ${glowColor}40, inset 0 0 20px ${glowColor}10`,
        }}
      />

      {/* Corner accents */}
      <div
        className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 animate-corner-pulse"
        style={{ borderColor: glowColor }}
      />
      <div
        className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 animate-corner-pulse"
        style={{ borderColor: glowColor, animationDelay: "0.5s" }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 animate-corner-pulse"
        style={{ borderColor: glowColor, animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 animate-corner-pulse"
        style={{ borderColor: glowColor, animationDelay: "1.5s" }}
      />

      {/* Pulsing glow animation */}
      {animated && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse-glow pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${glowColor}30`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 bg-exe-black rounded-lg overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}
