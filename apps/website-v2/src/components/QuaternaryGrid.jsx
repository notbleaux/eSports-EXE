/**
 * QuaternaryGrid - Dynamic 4-quadrant panel system
 * Draggable, resizable panels with group views and error boundaries
 * 
 * Performance optimizations:
 * - Individual Zustand selectors
 * - Error boundaries per panel
 * - useCallback for stable handlers
 * - Optimized re-render prevention
 * 
 * [Ver002.000]
 */
import { useCallback, useState, Suspense } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import { Plus, LayoutGrid, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGridStore } from '@/store/gridStore';
import { DraggablePanel } from './grid/DraggablePanel';
import { PanelErrorBoundary } from './grid/PanelErrorBoundary';
import { PanelSkeleton, HubLoader } from './grid/PanelSkeleton';
import { 
  MinimapPanel, 
  AnalyticsPanel, 
  StatsPanel, 
  VideoPanel 
} from './grid/PanelTypes';
import { colors } from '@/theme/colors';

// Import react-grid-layout styles
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';



const PANEL_COMPONENTS = {
  minimap: MinimapPanel,
  analytics: AnalyticsPanel,
  stats: StatsPanel,
  video: VideoPanel,
};

const PANEL_TYPES = [
  { type: 'minimap', label: 'Minimap', hub: 'SATOR' },
  { type: 'analytics', label: 'Analytics', hub: 'ROTAS' },
  { type: 'stats', label: 'Stats', hub: 'AREPO' },
  { type: 'video', label: 'Video', hub: 'OPERA' },
];

/**
 * PanelContent - Render panel content with suspense
 */
function PanelContent({ type, panelId }) {
  const Component = PANEL_COMPONENTS[type];
  if (!Component) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40">
        Unknown panel type: {type}
      </div>
    );
  }
  return <Component panelId={panelId} />;
}

/**
 * GroupViewSelector - Save and load grid layouts
 */
function GroupViewSelector() {
  // Use individual selectors for stable references
  const groupViews = useGridStore((state) => state.groupViews);
  const currentGroupId = useGridStore((state) => state.currentGroupId);
  const loadGroupView = useGridStore((state) => state.loadGroupView);
  const saveGroupView = useGridStore((state) => state.saveGroupView);
  
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  
  const handleSave = useCallback(() => {
    if (newName.trim()) {
      saveGroupView(newName.trim());
      setNewName('');
      setIsSaving(false);
    }
  }, [newName, saveGroupView]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  }, [handleSave]);
  
  const handleSelectChange = useCallback((e) => {
    loadGroupView(e.target.value);
  }, [loadGroupView]);
  
  return (
    <div className="flex items-center gap-2">
      <LayoutGrid className="w-4 h-4 text-white/40" aria-hidden="true" />
      <select
        value={currentGroupId}
        onChange={handleSelectChange}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-white/20"
        aria-label="Select group view"
      >
        {groupViews.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
      
      {isSaving ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="View name..."
            className="w-32 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:border-white/20"
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="New view name"
          />
          <button
            onClick={handleSave}
            className="text-xs px-2 py-1.5 rounded bg-white/10 text-white/80 hover:bg-white/15 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsSaving(true)}
          className="text-xs px-3 py-1.5 rounded bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
        >
          Save Current
        </button>
      )}
    </div>
  );
}

/**
 * GridPanel - Individual panel with error boundary
 */
function GridPanel({ panel, isDragging, onClose }) {
  return (
    <PanelErrorBoundary
      panelId={panel.i}
      panelTitle={panel.title}
      hub={panel.hub}
      onClose={onClose}
    >
      <DraggablePanel 
        panel={panel} 
        isDragging={isDragging}
      >
        <Suspense fallback={<PanelSkeleton hub={panel.hub} title={panel.title} />}>
          <PanelContent type={panel.type} panelId={panel.i} />
        </Suspense>
      </DraggablePanel>
    </PanelErrorBoundary>
  );
}

/**
 * QuaternaryGrid - Main grid component
 */
export function QuaternaryGrid() {
  // Use individual selectors to prevent unnecessary re-renders
  const panels = useGridStore((state) => state.panels);
  const layout = useGridStore((state) => state.layout);
  const updateLayout = useGridStore((state) => state.updateLayout);
  const addPanel = useGridStore((state) => state.addPanel);
  const resetLayout = useGridStore((state) => state.resetLayout);
  const closePanel = useGridStore((state) => state.closePanel);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  
  // Stable callback handlers
  const onLayoutChange = useCallback((currentLayout) => {
    updateLayout(currentLayout);
  }, [updateLayout]);
  
  const onDragStart = useCallback((layout, oldItem, newItem) => {
    setDraggingId(newItem.i);
  }, []);
  
  const onDragStop = useCallback(() => {
    setDraggingId(null);
  }, []);
  
  const handleAddPanel = useCallback((type, hub) => {
    addPanel(type, hub);
    setShowAddMenu(false);
  }, [addPanel]);
  
  const handleCloseMenu = useCallback(() => {
    setShowAddMenu(false);
  }, []);
  
  const handleClosePanel = useCallback((panelId) => {
    closePanel(panelId);
  }, [closePanel]);
  
  return (
    <div className="min-h-screen bg-[#050508] pt-20 pb-6 px-4">
      {/* Header Controls */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white/90">Quaternary Grid</h1>
          <div className="h-6 w-px bg-white/10" aria-hidden="true" />
          <GroupViewSelector />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Panel Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
              aria-expanded={showAddMenu}
              aria-haspopup="listbox"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Add Panel</span>
            </button>
            
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a25] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                  role="listbox"
                  aria-label="Add panel options"
                >
                  {PANEL_TYPES.map(({ type, label, hub }) => (
                    <button
                      key={type}
                      onClick={() => handleAddPanel(type, hub)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      role="option"
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.hub[hub.toLowerCase()].base }}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-white/80">{label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Reset Button */}
          <button
            onClick={resetLayout}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
            title="Reset Layout"
            aria-label="Reset grid layout"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.header>
      
      {/* Grid Layout */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-[1600px] mx-auto"
      >
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: panels }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={layout.rowHeight}
          margin={layout.margin}
          containerPadding={layout.containerPadding}
          onLayoutChange={onLayoutChange}
          onDragStart={onDragStart}
          onDragStop={onDragStop}
          draggableHandle=".cursor-move"
          isResizable={true}
          isDraggable={true}
          compactType="vertical"
          preventCollision={false}
        >
          {panels.map((panel) => (
            <div key={panel.i}>
              <GridPanel 
                panel={panel}
                isDragging={draggingId === panel.i}
                onClose={handleClosePanel}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </motion.main>
      
      {/* Click outside to close add menu */}
      {showAddMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={handleCloseMenu}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Lazy-loaded hub components for code splitting
export const SATORHub = () => (
  <Suspense fallback={<HubLoader />}>
    <QuaternaryGrid />
  </Suspense>
);

export default QuaternaryGrid;
