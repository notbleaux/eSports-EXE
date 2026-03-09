"use client";

import { motion } from "framer-motion";
import Hero from "@/components/Hero";
import CRT from "@/components/CRT";
import EnergyBorder from "@/components/EnergyBorder";
import SimRating from "@/components/SimRating";
import RARDisplay from "@/components/RARDisplay";
import TournamentBracket from "@/components/TournamentBracket";
import DataStream from "@/components/DataStream";
import { Trophy, Users, Gamepad2, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-exe-black">
      {/* Hero Section */}
      <Hero />

      {/* Data Stream Bar */}
      <div className="border-y border-exe-cyan/30 bg-exe-black/90">
        <DataStream />
      </div>

      {/* Stats Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-exe-cyan mb-4">
              MISSION CONTROL
            </h2>
            <p className="text-gray-400 font-mono">Real-time eSports statistics and analytics</p>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Trophy, label: "Active Tournaments", value: "24", color: "exe-electric" },
              { icon: Users, label: "Registered Players", value: "12,847", color: "exe-cyan" },
              { icon: Gamepad2, label: "Live Matches", value: "156", color: "exe-hot-pink" },
              { icon: Zap, label: "Total Prize Pool", value: "$2.4M", color: "exe-neon-pink" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <EnergyBorder color={stat.color as any}>
                  <div className="p-6 text-center">
                    <stat.icon className={`w-8 h-8 mx-auto mb-4 text-${stat.color}`} />
                    <CRT>
                      <div className="text-3xl font-bold font-orbitron text-white mb-2">
                        {stat.value}
                      </div>
                    </CRT>
                    <p className="text-gray-400 text-sm font-mono">{stat.label}</p>
                  </div>
                </EnergyBorder>
              </motion.div>
            ))}
          </div>

          {/* SimRating Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <EnergyBorder>
                <div className="p-6">
                  <h3 className="text-xl font-orbitron font-bold text-exe-cyan mb-6">
                    SimRating™ ANALYSIS
                  </h3>
                  <SimRating
                    playerName="NEON_VIPER"
                    components={{
                      mechanics: 92,
                      gameSense: 88,
                      communication: 85,
                      consistency: 90,
                      clutch: 94,
                    }}
                  />
                </div>
              </EnergyBorder>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <EnergyBorder color="exe-hot-pink">
                <div className="p-6">
                  <h3 className="text-xl font-orbitron font-bold text-exe-hot-pink mb-6">
                    RAR DISPLAY
                  </h3>
                  <RARDisplay
                    baseRating={87.5}
                    role="ENTRY_FRagger"
                    roleModifier={+2.3}
                    adjustedRating={89.8}
                  />
                </div>
              </EnergyBorder>
            </motion.div>
          </div>

          {/* Tournament Bracket */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <EnergyBorder color="exe-electric">
              <div className="p-6">
                <h3 className="text-xl font-orbitron font-bold text-exe-electric mb-6">
                  CHAMPIONSHIP BRACKET
                </h3>
                <TournamentBracket />
              </div>
            </EnergyBorder>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-exe-cyan/30 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-exe-cyan font-orbitron text-sm">
            eSports-EXE © 2024 // DARE TO WEAR
          </p>
        </div>
      </footer>
    </main>
  );
}
