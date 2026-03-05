"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import CRT from "./CRT";

interface RARDisplayProps {
  baseRating: number;
  role: string;
  roleModifier: number;
  adjustedRating: number;
}

export default function RARDisplay({
  baseRating,
  role,
  roleModifier,
  adjustedRating,
}: RARDisplayProps) {
  const isPositive = roleModifier > 0;
  const isNeutral = roleModifier === 0;

  return (
    <CRT className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs font-mono text-exe-hot-pink/60 mb-1">ROLE-ADJUSTED RATING</p>
          <h4 className="text-2xl font-orbitron font-bold text-white tracking-wider">
            RAR
          </h4>
        </div>

        {/* Role Display */}
        <div className="p-4 border border-exe-hot-pink/30 bg-exe-hot-pink/5 rounded">
          <p className="text-xs font-mono text-gray-400 mb-2">ASSIGNED ROLE</p>
          <p className="text-lg font-orbitron font-bold text-exe-hot-pink tracking-wider">
            {role}
          </p>
        </div>

        {/* Calculation */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
            <span className="text-sm font-mono text-gray-400">Base Rating</span>
            <span className="text-lg font-bold font-mono seven-segment text-white">
              {baseRating.toFixed(1)}
            </span>
          </div>

          <div className="flex justify-center">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-exe-electric" />
            ) : isNeutral ? (
              <Minus className="w-5 h-5 text-gray-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-exe-hot-pink" />
            )}
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded border-l-4 border-exe-hot-pink">
            <span className="text-sm font-mono text-gray-400">Role Modifier</span>
            <span
              className={`text-lg font-bold font-mono seven-segment ${
                isPositive ? "text-exe-electric" : isNeutral ? "text-gray-500" : "text-exe-hot-pink"
              }`}
            >
              {isPositive ? "+" : ""}
              {roleModifier.toFixed(1)}
            </span>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center p-4 bg-exe-hot-pink/10 rounded border border-exe-hot-pink/50"
          >
            <span className="text-sm font-mono text-exe-hot-pink">ADJUSTED RATING</span>
            <span className="text-3xl font-bold font-orbitron seven-segment text-exe-hot-pink neon-text-pink">
              {adjustedRating.toFixed(1)}
            </span>
          </motion.div>
        </div>

        {/* Role Context */}
        <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-800">
          <p className="text-xs font-mono text-gray-500 leading-relaxed">
            RAR adjusts base performance metrics based on role-specific demands. 
            Entry fraggers receive bonus points for opening duels, while support roles 
            are weighted for utility usage and team enablement.
          </p>
        </div>
      </div>
    </CRT>
  );
}
