"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, User, ChevronRight } from "lucide-react";

interface Match {
  id: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  status: "completed" | "live" | "upcoming";
  round: string;
}

const mockMatches: Match[] = [
  { id: "1", player1: "NEON_VIPER", player2: "CYBER_WOLF", score1: 2, score2: 1, status: "completed", round: "QF" },
  { id: "2", player1: "PHANTOM_X", player2: "STEEL_HAWK", score1: 2, score2: 0, status: "completed", round: "QF" },
  { id: "3", player1: "QUANTUM_LEAP", player2: "VOID_WALKER", score1: 1, score2: 2, status: "completed", round: "QF" },
  { id: "4", player1: "NEXUS_PRIME", player2: "ECHO_BLADE", score1: 2, score2: 1, status: "completed", round: "QF" },
  { id: "5", player1: "NEON_VIPER", player2: "PHANTOM_X", score1: 2, score2: 1, status: "completed", round: "SF" },
  { id: "6", player1: "VOID_WALKER", player2: "NEXUS_PRIME", score1: 0, score2: 2, status: "completed", round: "SF" },
  { id: "7", player1: "NEON_VIPER", player2: "NEXUS_PRIME", score1: 1, score2: 1, status: "live", round: "FINAL" },
];

export default function TournamentBracket() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

  const getStatusColor = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return "border-gray-600";
      case "live":
        return "border-exe-hot-pink animate-pulse";
      case "upcoming":
        return "border-gray-800";
      default:
        return "border-gray-600";
    }
  };

  const getStatusBg = (status: Match["status"]) => {
    switch (status) {
      case "completed":
        return "bg-gray-900/50";
      case "live":
        return "bg-exe-hot-pink/10";
      case "upcoming":
        return "bg-gray-900/20";
      default:
        return "bg-gray-900/50";
    }
  };

  const MatchCell = ({ match, isSmall = false }: { match: Match; isSmall?: boolean }) => (
    <motion.div
      layoutId={match.id}
      onClick={() => setSelectedMatch(match)}
      onMouseEnter={() => setHoveredMatch(match.id)}
      onMouseLeave={() => setHoveredMatch(null)}
      className={`
        relative cursor-pointer transition-all duration-300
        border-2 rounded-lg overflow-hidden
        ${getStatusColor(match.status)}
        ${getStatusBg(match.status)}
        ${hoveredMatch === match.id ? "scale-105 shadow-lg shadow-exe-cyan/20" : ""}
        ${isSmall ? "p-2" : "p-3"}
      `}
    >
      {/* Round Badge */}
      <div className="absolute top-1 right-1 text-[10px] font-mono text-gray-500">
        {match.round}
      </div>

      {/* Status Indicator */}
      {match.status === "live" && (
        <div className="absolute top-1 left-1">
          <div className="w-2 h-2 rounded-full bg-exe-hot-pink animate-pulse" />
        </div>
      )}

      <div className={`space-y-1 ${isSmall ? "text-xs" : "text-sm"}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className={`${isSmall ? "w-3 h-3" : "w-4 h-4"} text-exe-cyan`} />
            <span className={`font-mono ${match.score1 > match.score2 ? "text-white font-bold" : "text-gray-400"}`}>
              {match.player1}
            </span>
          </div>
          <span className={`font-bold font-mono seven-segment ${match.score1 > match.score2 ? "text-exe-electric" : "text-gray-500"}`}>
            {match.score1}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className={`${isSmall ? "w-3 h-3" : "w-4 h-4"} text-exe-hot-pink`} />
            <span className={`font-mono ${match.score2 > match.score1 ? "text-white font-bold" : "text-gray-400"}`}>
              {match.player2}
            </span>
          </div>
          <span className={`font-bold font-mono seven-segment ${match.score2 > match.score1 ? "text-exe-electric" : "text-gray-500"}`}>
            {match.score2}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative">
      {/* Bracket Title */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-exe-electric" />
        <span className="text-lg font-orbitron font-bold text-white">
          CHAMPIONSHIP BRACKET
        </span>
        <span className="text-xs font-mono text-exe-hot-pink bg-exe-hot-pink/20 px-2 py-1 rounded">
          LIVE
        </span>
      </div>

      {/* Bracket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quarter Finals */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-gray-500 mb-2">QUARTER FINALS</h4>
          <div className="space-y-3">
            {mockMatches
              .filter((m) => m.round === "QF")
              .map((match) => (
                <MatchCell key={match.id} match={match} />
              ))}
          </div>
        </div>

        {/* Semi Finals */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-gray-500 mb-2">SEMI FINALS</h4>
          <div className="space-y-3">
            {mockMatches
              .filter((m) => m.round === "SF")
              .map((match) => (
                <MatchCell key={match.id} match={match} />
              ))}
          </div>
        </div>

        {/* Finals */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-gray-500 mb-2">FINALS</h4>
          <div className="space-y-3">
            {mockMatches
              .filter((m) => m.round === "FINAL")
              .map((match) => (
                <MatchCell key={match.id} match={match} />
              ))}
          </div>

          {/* Champion Placeholder */}
          <div className="mt-6 p-4 border-2 border-dashed border-exe-electric/30 rounded-lg text-center">
            <Trophy className="w-8 h-8 text-exe-electric/50 mx-auto mb-2" />
            <p className="text-xs font-mono text-gray-500">CHAMPION TBD</p>
          </div>
        </div>
      </div>

      {/* Match Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMatch(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-exe-black border-2 border-exe-cyan rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-orbitron font-bold text-exe-cyan">
                  MATCH DETAILS
                </h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-center py-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-exe-cyan/20 flex items-center justify-center mb-2 mx-auto">
                      <User className="w-8 h-8 text-exe-cyan" />
                    </div>
                    <p className="font-orbitron font-bold text-white">{selectedMatch.player1}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-mono text-gray-500 mb-2">{selectedMatch.round}</p>
                    <div className="text-4xl font-bold font-orbitron">
                      <span className={selectedMatch.score1 > selectedMatch.score2 ? "text-exe-electric" : "text-gray-500"}>
                        {selectedMatch.score1}
                      </span>
                      <span className="text-gray-600 mx-2">-</span>
                      <span className={selectedMatch.score2 > selectedMatch.score1 ? "text-exe-electric" : "text-gray-500"}>
                        {selectedMatch.score2}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded mt-2 inline-block ${
                        selectedMatch.status === "live"
                          ? "bg-exe-hot-pink text-white"
                          : selectedMatch.status === "completed"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {selectedMatch.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-exe-hot-pink/20 flex items-center justify-center mb-2 mx-auto">
                      <User className="w-8 h-8 text-exe-hot-pink" />
                    </div>
                    <p className="font-orbitron font-bold text-white">{selectedMatch.player2}</p>
                  </div>
                </div>

                <button className="w-full py-3 bg-exe-cyan text-exe-black font-orbitron font-bold rounded hover:bg-exe-cyan/80 transition-colors">
                  VIEW FULL STATS
                  <ChevronRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
