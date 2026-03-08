/**
 * Main App Component
 * Unified NJZ Platform with all 4 hubs connected
 */
import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from './shared/components/Navigation'
import MobileNavigation from './shared/components/MobileNavigation'
import RealTimeNotifications from './shared/components/RealTimeNotifications'
import Footer from './shared/components/Footer'
import NotificationContainer from './shared/components/NotificationContainer'
import TwinFileVisualizer from './shared/components/TwinFileVisualizer'
import CentralGrid from './shared/components/CentralGrid'
import SATORHub from './hub-1-sator/SATORHub'
import ROTASHub from './hub-2-rotas/ROTASHub'
import InformationHub from './hub-3-info/InformationHub'
import GamesHub from './hub-4-games/GamesHub'
import { useNJZStore, HUBS } from './shared/store/njzStore'

// Page transition wrapper
const PageTransition = ({ children, hubId }) => {
  const preferences = useNJZStore(state => state.preferences)
  
  const variants = {
    initial: { 
      opacity: 0, 
      x: preferences.reducedMotion ? 0 : -20 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: { 
      opacity: 0, 
      x: preferences.reducedMotion ? 0 : 20,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      key={hubId}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

// Route change handler
const RouteChangeHandler = () => {
  const location = useLocation()
  const setCurrentHub = useNJZStore(state => state.setCurrentHub)
  
  useEffect(() => {
    const path = location.pathname
    const hubId = path === '/' ? 'central' : path.replace('/', '')
    setCurrentHub(hubId)
    
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location, setCurrentHub])
  
  return null
}

function App() {
  const { preferences } = useNJZStore()
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches !== preferences.reducedMotion) {
      useNJZStore.getState().setPreference('reducedMotion', mediaQuery.matches)
    }
    
    const handler = (e) => {
      useNJZStore.getState().setPreference('reducedMotion', e.matches)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div className="min-h-screen bg-void text-white overflow-x-hidden">
      <RouteChangeHandler />
      <Navigation />
      <RealTimeNotifications />
      
      <main className="relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/" 
              element={
                <PageTransition hubId="central">
                  <CentralGrid />
                </PageTransition>
              } 
            />
            <Route 
              path="/sator" 
              element={
                <PageTransition hubId="sator">
                  <SATORHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/rotas" 
              element={
                <PageTransition hubId="rotas">
                  <ROTASHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/info" 
              element={
                <PageTransition hubId="info">
                  <InformationHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/games" 
              element={
                <PageTransition hubId="games">
                  <GamesHub />
                </PageTransition>
              } 
            />
            
            {/* 404 Catch-all */}
            <Route 
              path="*" 
              element={
                <PageTransition hubId="404">
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-display font-bold text-signal-cyan mb-4">404</h1>
                      <p className="text-xl text-slate mb-8">This hub doesn't exist in the NJZ universe.</p>
                      <a 
                        href="/" 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-signal-cyan text-void-black 
                                 font-medium hover:shadow-glow-cyan transition-all"
                      >
                        Return to Central
                      </a>
                    </div>
                  </div>
                </PageTransition>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>
      
      <Footer />
      <NotificationContainer />
      <MobileNavigation />
      
      {/* Fixed Twin-File Integrity Indicator */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:block">
        <TwinFileVisualizer compact={true} />
      </div>
    </div>
  )
}

export default App
