import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

interface TeZeTBranchProps {
  id: string;
  label: string;
  subroute: string;
}

interface TeZeTBranchSelectorProps {
  branches: TeZeTBranchProps[];
}

/**
 * TeZeTBranchSelector
 * Renders sub-branch selectors within each of the 4 hubs.
 * [Ver001.000]
 */
export function TeZeTBranchSelector({ branches }: TeZeTBranchSelectorProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
      {branches.map((branch) => {
        const isActive = currentPath.endsWith(branch.subroute);
        
        return (
          <Link
            key={branch.id}
            to={branch.subroute}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest
              border transition-all duration-200
              ${isActive 
                ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {branch.label}
          </Link>
        );
      })}
    </div>
  );
}
