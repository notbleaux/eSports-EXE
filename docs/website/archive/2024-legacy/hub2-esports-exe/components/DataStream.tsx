"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, Radio, AlertCircle } from "lucide-react";

interface DataItem {
  id: string;
  type: "match" | "alert" | "update" | "stats";
  content: string;
  timestamp: string;
  priority: "normal" | "high" | "critical";
}

const generateMockData = (): DataItem[] => [
  { id: "1", type: "match", content: "NEON_VIPER vs NEXUS_PRIME - ROUND 3 STARTED", timestamp: "12:42:15", priority: "high" },
  { id: "2", type: "stats", content: "TOURNAMENT PRIZE POOL: $2,450,000 (+$50K)", timestamp: "12:41:33", priority: "normal" },
  { id: "3", type: "alert", content: "NEW RECORD: Fastest ace in championship history", timestamp: "12:40:58", priority: "critical" },
  { id: "4", type: "update", content: "Player CYBER_WOLF reached 10,000 career kills", timestamp: "12:39:12", priority: "normal" },
  { id: "5", type: "match", content: "QUARTER FINALS - Match 4 starting in 5 minutes", timestamp: "12:38:45", priority: "high" },
  { id: "6", type: "stats", content: "Global viewer count: 1.2M concurrent", timestamp: "12:37:22", priority: "normal" },
  { id: "7", type: "alert", content: "Server maintenance scheduled for 02:00 UTC", timestamp: "12:35:10", priority: "normal" },
  { id: "8", type: "match", content: "SEMIFINAL BRACKET UPDATED", timestamp: "12:34:55", priority: "high" },
  { id: "9", type: "update", content: "Team PHANTOM_X signs new sponsorship deal", timestamp: "12:33:41", priority: "normal" },
  { id: "10", type: "stats", content: "Daily active players: 47,832", timestamp: "12:32:18", priority: "normal" },
];

export default function DataStream() {
  const [data, setData] = useState<DataItem[]>(generateMockData());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate new data coming in
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newItem: DataItem = {
          id: Date.now().toString(),
          type: ["match", "alert", "update", "stats"][Math.floor(Math.random() * 4)] as DataItem["type"],
          content: [
            "Match update: Score tied at 1-1",
            "New player joined the tournament",
            "Stream delayed by 2 minutes",
            "Technical issue resolved",
            "Player substitution announced",
          ][Math.floor(Math.random() * 5)],
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
          priority: ["normal", "high", "critical"][Math.floor(Math.random() * 3)] as DataItem["priority"],
        };

        setData((prev) => [newItem, ...prev.slice(0, 15)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: DataItem["type"]) => {
    switch (type) {
      case "match":
        return <Radio className="w-3 h-3" />;
      case "alert":
        return <AlertCircle className="w-3 h-3" />;
      case "stats":
        return <Activity className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: DataItem["type"]) => {
    switch (type) {
      case "match":
        return "text-exe-electric";
      case "alert":
        return "text-exe-hot-pink";
      case "stats":
        return "text-exe-cyan";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: DataItem["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-exe-hot-pink/20 border-exe-hot-pink";
      case "high":
        return "bg-exe-cyan/10 border-exe-cyan/50";
      default:
        return "bg-transparent border-transparent";
    }
  };

  return (
    <div className="py-3 overflow-hidden">
      <div className="flex items-center gap-6">
        {/* Live Indicator */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-exe-hot-pink animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-exe-hot-pink animate-ping" />
          </div>
          <span className="text-xs font-mono font-bold text-exe-hot-pink">LIVE</span>
        </div>

        {/* Scrolling Data */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: [0, -1000] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...data, ...data].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`flex items-center gap-3 px-3 py-1 rounded border ${getPriorityColor(item.priority)}`}
              >
                <span className={getTypeColor(item.type)}>{getTypeIcon(item.type)}</span>
                <span className="text-xs font-mono text-gray-300">{item.content}</span>
                <span className="text-[10px] font-mono text-gray-500">{item.timestamp}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Clock */}
        <div className="flex-shrink-0 px-4 border-l border-exe-cyan/30">
          <div className="text-lg font-mono font-bold text-exe-cyan seven-segment">
            {currentTime.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className="text-[10px] font-mono text-gray-500">
            UTC {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Match Countdown */}
      <div className="flex justify-center gap-8 mt-3 pt-3 border-t border-exe-cyan/20">
        {[
          { label: "NEXT MATCH", time: "00:04:32" },
          { label: "TOURNAMENT END", time: "14:22:15" },
        ].map((countdown) => (
          <div key={countdown.label} className="text-center">
            <p className="text-[10px] font-mono text-gray-500 mb-1">{countdown.label}</p>
            <p className="text-sm font-mono font-bold text-exe-electric seven-segment">
              {countdown.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
