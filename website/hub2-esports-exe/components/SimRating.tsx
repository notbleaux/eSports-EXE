"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CRT from "./CRT";

interface SimRatingProps {
  playerName: string;
  components: {
    mechanics: number;
    gameSense: number;
    communication: number;
    consistency: number;
    clutch: number;
  };
}

export default function SimRating({ playerName, components }: SimRatingProps) {
  const [animatedValues, setAnimatedValues] = useState({
    mechanics: 0,
    gameSense: 0,
    communication: 0,
    consistency: 0,
    clutch: 0,
  });

  const average = Math.round(
    (components.mechanics +
      components.gameSense +
      components.communication +
      components.consistency +
      components.clutch) /
      5
  );

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        mechanics: Math.round(components.mechanics * easeOut),
        gameSense: Math.round(components.gameSense * easeOut),
        communication: Math.round(components.communication * easeOut),
        consistency: Math.round(components.consistency * easeOut),
        clutch: Math.round(components.clutch * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [components]);

  const ratingComponents = [
    { key: "mechanics", label: "MECHANICS", value: animatedValues.mechanics, color: "#00F0FF" },
    { key: "gameSense", label: "GAME SENSE", value: animatedValues.gameSense, color: "#FF006E" },
    { key: "communication", label: "COMMS", value: animatedValues.communication, color: "#39FF14" },
    { key: "consistency", label: "CONSISTENCY", value: animatedValues.consistency, color: "#FF1493" },
    { key: "clutch", label: "CLUTCH", value: animatedValues.clutch, color: "#00F0FF" },
  ];

  return (
    <CRT className="p-4">
      <div className="space-y-4">
        {/* Player Name */}
        <div className="text-center mb-6">
          <p className="text-xs font-mono text-exe-cyan/60 mb-1">PLAYER ID</p>
          <h4 className="text-xl font-orbitron font-bold text-white tracking-wider">
            {playerName}
          </h4>
        </div>

        {/* Rating Components */}
        <div className="space-y-3">
          {ratingComponents.map((component, index) => (
            <motion.div
              key={component.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-gray-400">{component.label}</span>
                <span
                  className="text-sm font-bold font-mono seven-segment"
                  style={{ color: component.color }}
                >
                  {component.value}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${component.value}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: component.color,
                    boxShadow: `0 0 10px ${component.color}`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Average Rating */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <span className="text-sm font-mono text-exe-cyan">SIM RATING™</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="text-3xl font-bold font-orbitron"
              style={{
                color: average >= 90 ? "#39FF14" : average >= 80 ? "#00F0FF" : "#FF006E",
                textShadow: `0 0 20px ${average >= 90 ? "#39FF14" : average >= 80 ? "#00F0FF" : "#FF006E"}`,
              }}
            >
              {average}
            </motion.div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-mono">VS GLOBAL AVG</span>
            <span
              className={`font-mono font-bold ${
                average > 75 ? "text-exe-electric" : "text-exe-hot-pink"
              }`}
            >
              {average > 75 ? "+" : ""}
              {average - 75}%
            </span>
          </div>
        </div>
      </div>
    </CRT>
  );
}
