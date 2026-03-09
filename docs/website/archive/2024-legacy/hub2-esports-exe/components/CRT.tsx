"use client";

import { ReactNode } from "react";

interface CRTProps {
  children: ReactNode;
  className?: string;
  flicker?: boolean;
  scanlines?: boolean;
  phosphor?: boolean;
}

export default function CRT({
  children,
  className = "",
  flicker = true,
  scanlines = true,
  phosphor = true,
}: CRTProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main content */}
      <div className={`relative z-10 ${flicker ? "animate-flicker" : ""}`}>
        {children}
      </div>

      {/* Scanline overlay */}
      {scanlines && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15),
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 2px
            )`,
          }}
        />
      )}

      {/* Moving scanline */}
      <div
        className="absolute inset-0 z-30 pointer-events-none animate-scanline"
        style={{
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 240, 255, 0.03) 50%,
            transparent 100%
          )`,
          height: "10%",
        }}
      />

      {/* Phosphor glow */}
      {phosphor && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 100px rgba(0, 240, 255, 0.1)",
            background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.4) 100%)",
          }}
        />
      )}

      {/* RGB channel separation effect */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-30 mix-blend-screen"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(255, 0, 0, 0.03) 0%, 
              transparent 33%, 
              transparent 66%, 
              rgba(0, 255, 0, 0.03) 100%
            )
          `,
        }}
      />

      {/* Screen curvature vignette */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 150px rgba(0, 0, 0, 0.7)",
          borderRadius: "20%",
          transform: "scale(1.2)",
        }}
      />
    </div>
  );
}
