import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from './shared/components/Navigation'
import Footer from './shared/components/Footer'
import CentralGrid from './shared/components/CentralGrid'
import SATORHub from './hub-1-sator/SATORHub'
import ROTASHub from './hub-2-rotas/ROTASHub'
import InformationHub from './hub-3-info/InformationHub'
import GamesHub from './hub-4-games/GamesHub'

function App() {
  return (
    <div className="min-h-screen bg-void text-white overflow-x-hidden">
      <Navigation />
      
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/" 
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CentralGrid />
              </motion.div>
            } 
          />
          <Route 
            path="/sator" 
            element={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <SATORHub />
              </motion.div>
            } 
          />
          <Route 
            path="/rotas" 
            element={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <ROTASHub />
              </motion.div>
            } 
          />
          <Route 
            path="/info" 
            element={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <InformationHub />
              </motion.div>
            } 
          />
          <Route 
            path="/games" 
            element={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <GamesHub />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
      
      <Footer />
    </div>
  )
}

export default App