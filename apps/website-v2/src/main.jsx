/**
 * Main Entry Point
 * NJZ Platform v2.0
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/mobile.css'

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('NJZ Platform Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-void text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-display font-bold text-signal-cyan mb-4">
              System Anomaly
            </h1>
            <p className="text-slate mb-8">
              The platform encountered an unexpected error. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-signal-cyan text-void-black font-medium hover:shadow-glow-cyan transition-all"
            >
              Reinitialize
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
