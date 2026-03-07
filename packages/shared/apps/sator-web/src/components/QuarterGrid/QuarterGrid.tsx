import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuarterGrid.css';

export interface QuarterCell {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

interface QuarterGridProps {
  cells: QuarterCell[];
  hubContent: React.ReactNode;
  onCellClick?: (cellId: string) => void;
}

export const QuarterGrid: React.FC<QuarterGridProps> = ({ cells, hubContent, onCellClick }) => {
  const [expandedCell, setExpandedCell] = useState<string | null>(null);
  const [hubOpen, setHubOpen] = useState(false);

  const handleCellClick = (cellId: string) => {
    if (expandedCell === cellId) {
      // Navigate to the hub route
      onCellClick?.(cellId);
    } else {
      setExpandedCell(cellId);
    }
  };

  const handleHubClick = () => {
    setHubOpen(true);
  };

  const handleCloseHub = () => {
    setHubOpen(false);
  };

  return (
    <div className="quarter-grid">
      {cells.map((cell, index) => (
        <QuarterCellComponent
          key={cell.id}
          cell={cell}
          index={index}
          isExpanded={expandedCell === cell.id}
          onClick={() => handleCellClick(cell.id)}
        />
      ))}

      {/* Center Hub Button */}
      <div className="quarter-hub-container">
        <HubButton onClick={handleHubClick} isExpanded={hubOpen} />
      </div>

      {/* Hub Overlay */}
      <AnimatePresence>
        {hubOpen && (
          <HubOverlay onClose={handleCloseHub}>
            {hubContent}
          </HubOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quarter Cell Component
interface QuarterCellComponentProps {
  cell: QuarterCell;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
}

const QuarterCellComponent: React.FC<QuarterCellComponentProps> = ({
  cell,
  index,
  isExpanded,
  onClick,
}) => {
  const getGridArea = () => {
    switch (index) {
      case 0: return '1 / 1 / 2 / 2';
      case 1: return '1 / 2 / 2 / 3';
      case 2: return '2 / 1 / 3 / 2';
      case 3: return '2 / 2 / 3 / 2';
      default: return 'auto';
    }
  };

  return (
    <motion.div
      className={`quarter-cell ${isExpanded ? 'expanded' : ''}`}
      style={{
        gridArea: getGridArea(),
        borderColor: cell.color,
      }}
      onClick={onClick}
      layout
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="quarter-cell__header" style={{ borderColor: cell.color }}>
        <span className="quarter-cell__icon" style={{ color: cell.color }}>
          {cell.icon}
        </span>
        <h3 className="quarter-cell__title">{cell.title}</h3>
      </div>
      <div className="quarter-cell__content">
        {cell.content}
      </div>
      
      {/* Expand Indicator */}
      <div className="quarter-cell__expand-indicator">
        {isExpanded ? '→' : '+'}
      </div>
    </motion.div>
  );
};

// Hub Button Component
interface HubButtonProps {
  onClick: () => void;
  isExpanded: boolean;
}

const HubButton: React.FC<HubButtonProps> = ({ onClick, isExpanded }) => {
  return (
    <motion.button
      className="quarter-hub"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{ rotate: isExpanded ? 45 : 0 }}
    >
      <span className="quarter-hub__icon">?</span>
      <span className="quarter-hub__label">HELP</span>
    </motion.button>
  );
};

// Hub Overlay Component
interface HubOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

const HubOverlay: React.FC<HubOverlayProps> = ({ children, onClose }) => {
  return (
    <motion.div
      className="hub-overlay"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Close Button */}
      <button className="hub-overlay__close" onClick={onClose}>
        ✕
      </button>

      {/* Content */}
      <div className="hub-overlay__content">
        {children}
      </div>
    </motion.div>
  );
};

export default QuarterGrid;
