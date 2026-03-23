/**
 * Streaming Error Boundary
 * Handles WebSocket and streaming-specific errors
 * 
 * [Ver001.000]
 */

import React, { Component, type ReactNode } from 'react'
import { streamingLogger } from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReconnect?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  isReconnecting: boolean
}

/**
 * Error boundary for streaming components
 * Handles:
 * - WebSocket connection errors
 * - Stream parsing errors
 * - Network disconnections
 * - Buffer overflow errors
 */
export class StreamingErrorBoundary extends Component<Props, State> {
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReconnecting: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })
    
    // Log with structured logger
    streamingLogger.error('Streaming error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
    
    this.props.onError?.(error, errorInfo)
  }

  componentWillUnmount(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
  }

  handleReconnect = (): void => {
    this.setState({ isReconnecting: true })
    
    // Simulate reconnection delay
    this.reconnectTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isReconnecting: false
      })
      
      this.props.onReconnect?.()
    }, 1500)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      const errorDetails = this.getErrorDetails(this.state.error)
      
      return (
        <div className="p-6 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-300">Streaming Error</h3>
              <p className="text-sm text-amber-400/70">{errorDetails.title}</p>
            </div>
          </div>
          
          <div className="bg-black/30 rounded p-3 mb-4">
            <p className="text-sm text-amber-300/80">{errorDetails.message}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={this.handleReconnect}
              disabled={this.state.isReconnecting}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 rounded transition-colors flex items-center gap-2"
            >
              {this.state.isReconnecting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Reconnecting...
                </>
              ) : (
                <>Reconnect</>
              )}
            </button>
            <button
              onClick={this.handleRetry}
              disabled={this.state.isReconnecting}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 rounded transition-colors"
            >
              Continue Without Stream
            </button>
          </div>
          
          {errorDetails.suggestion && (
            <div className="mt-4 p-3 bg-amber-500/5 rounded border border-amber-500/20">
              <p className="text-xs text-amber-400/60">
                <span className="font-semibold">Tip:</span> {errorDetails.suggestion}
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }

  private getErrorDetails(error: Error | null): { title: string; message: string; suggestion?: string } {
    if (!error) {
      return {
        title: 'Unknown Error',
        message: 'An unexpected error occurred with the stream.'
      }
    }
    
    const message = error.message.toLowerCase()
    
    if (message.includes('websocket') || message.includes('ws://') || message.includes('wss://')) {
      return {
        title: 'Connection Failed',
        message: 'Could not establish WebSocket connection. The server may be unavailable.',
        suggestion: 'Check your network connection and ensure the streaming server is running.'
      }
    }
    
    if (message.includes('timeout') || message.includes('etimedout')) {
      return {
        title: 'Connection Timeout',
        message: 'The connection timed out. The server may be overloaded.',
        suggestion: 'Wait a moment and try reconnecting. If the problem persists, contact support.'
      }
    }
    
    if (message.includes('buffer') || message.includes('overflow')) {
      return {
        title: 'Buffer Overflow',
        message: 'The data buffer is full. Processing may be too slow.',
        suggestion: 'Try reducing the prediction rate or clearing the buffer.'
      }
    }
    
    if (message.includes('parse') || message.includes('json') || message.includes('syntax')) {
      return {
        title: 'Data Parse Error',
        message: 'Received malformed data from the server.',
        suggestion: 'This may be a server-side issue. Please report this error.'
      }
    }
    
    if (message.includes('network') || message.includes('offline') || message.includes('disconnect')) {
      return {
        title: 'Network Error',
        message: 'Network connection was lost.',
        suggestion: 'Check your internet connection and try reconnecting.'
      }
    }
    
    return {
      title: 'Streaming Error',
      message: error.message
    }
  }
}

export default StreamingErrorBoundary
