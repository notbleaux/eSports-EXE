/**
 * PanelErrorBoundary - Error boundary for individual grid panels
 * Prevents panel crashes from bringing down the entire grid
 * 
 * Features:
 * - Graceful error recovery
 * - Retry functionality
 * - Error reporting
 * - Visual error state
 * 
 * [Ver002.000] - Converted to TypeScript
 */
import { Component, type ReactNode, type ErrorInfo, type MouseEvent } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { colors } from '@/theme/colors';

const HUB_COLORS = {
  SATOR: colors.hub.sator,
  ROTAS: colors.hub.rotas,
  AREPO: colors.hub.arepo,
  OPERA: colors.hub.opera,
  TENET: colors.hub.tenet,
};

type HubType = 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET';

interface HubColor {
  base: string;
  light: string;
  dark: string;
}

/** Props for ErrorDisplay component */
interface ErrorDisplayProps {
  /** The error that was caught */
  error: Error | null;
  /** Title of the panel that failed */
  panelTitle: string;
  /** Hub type for theming */
  hub?: HubType;
  /** Retry callback */
  onRetry: () => void;
  /** Close panel callback */
  onClose: () => void;
}

/** Props for PanelErrorBoundary component */
interface PanelErrorBoundaryProps {
  /** Panel identifier */
  panelId: string;
  /** Title of the panel */
  panelTitle?: string;
  /** Hub type for theming */
  hub?: HubType;
  /** Child components */
  children: ReactNode;
  /** Error reporting callback */
  onError?: (error: Error, errorInfo: ErrorInfo, panelId: string) => void;
  /** Close panel callback */
  onClose?: (panelId: string) => void;
}

/** State for PanelErrorBoundary component */
interface PanelErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** React error info */
  errorInfo: ErrorInfo | null;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Error display component
 */
function ErrorDisplay({ error, panelTitle, hub = 'SATOR', onRetry, onClose }: ErrorDisplayProps): JSX.Element {
  const hubColor = (HUB_COLORS[hub] || colors.hub.sator) as HubColor;
  const errorMessage = error?.message || 'Unknown error occurred';
  
  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.backgroundColor = `${hubColor.base}30`;
  };

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.backgroundColor = `${hubColor.base}20`;
  };
  
  return (
    <div 
      className="w-full h-full flex flex-col rounded-xl border border-red-500/30 overflow-hidden bg-[#14141a]"
      role="alert"
      aria-live="polite"
    >
      {/* Error Header */}
      <div 
        className="flex items-center justify-between px-3 py-2"
        style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
        }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle 
            className="w-4 h-4 text-red-400" 
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-red-400">
            {panelTitle} - Error
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
          aria-label="Close panel"
          title="Close"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Error Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertTriangle 
            className="w-6 h-6 text-red-400" 
            aria-hidden="true"
          />
        </div>
        
        <h3 className="text-white/90 font-medium mb-2">
          Panel Failed to Load
        </h3>
        
        <p className="text-white/50 text-sm mb-1 max-w-[200px]">
          {errorMessage}
        </p>
        
        <p className="text-white/30 text-xs mb-4">
          {hub} Hub
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#14141a]"
            style={{ 
              backgroundColor: `${hubColor.base}20`,
              color: hubColor.base,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
          
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Error details (collapsed by default) */}
      <details className="border-t border-white/5">
        <summary className="px-3 py-2 text-xs text-white/30 cursor-pointer hover:text-white/50 select-none">
          Technical Details
        </summary>
        <pre className="px-3 py-2 text-xs text-white/40 overflow-auto max-h-24 bg-black/20">
          {error?.stack || 'No stack trace available'}
        </pre>
      </details>
    </div>
  );
}

/**
 * PanelErrorBoundary - React error boundary for grid panels
 */
export class PanelErrorBoundary extends Component<PanelErrorBoundaryProps, PanelErrorBoundaryState> {
  constructor(props: PanelErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PanelErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    this.setState({ errorInfo });
    
    // Optional: Send to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.panelId);
    }
    
    // Console error for debugging
    console.error(
      `PanelErrorBoundary caught error in panel "${this.props.panelTitle}":`,
      error,
      errorInfo
    );
  }
  
  handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };
  
  handleClose = (): void => {
    if (this.props.onClose) {
      this.props.onClose(this.props.panelId);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          panelTitle={this.props.panelTitle || 'Panel'}
          hub={this.props.hub}
          onRetry={this.handleRetry}
          onClose={this.handleClose}
        />
      );
    }

    return this.props.children;
  }
}

/** Props for usePanelErrorBoundary hook */
interface UsePanelErrorBoundaryResult {
  panelId: string;
  panelTitle: string;
  hub: HubType | undefined;
  onClose: ((panelId: string) => void) | undefined;
  onError: (error: Error, errorInfo: ErrorInfo, panelId: string) => void;
}

/**
 * Hook to create error boundary props
 */
export function usePanelErrorBoundary(
  panelId: string, 
  panelTitle: string, 
  hub: HubType | undefined, 
  onClose: ((panelId: string) => void) | undefined
): UsePanelErrorBoundaryResult {
  return {
    panelId,
    panelTitle,
    hub,
    onClose,
    onError: (error: Error, errorInfo: ErrorInfo, panelId: string): void => {
      // Could send to analytics service
      console.error(`Panel ${panelId} error:`, error);
    }
  };
}

export default PanelErrorBoundary;
