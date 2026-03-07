/**
 * Notification Container
 * Displays toast notifications with Framer Motion animations
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, Info, X } from 'lucide-react'
import { useNJZStore } from '../store/njzStore'

function NotificationContainer() {
  const notifications = useNJZStore(state => state.notifications)
  const notificationsArray = Array.isArray(notifications) ? notifications : []

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notificationsArray.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function NotificationToast({ notification }) {
  const icons = {
    success: Check,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-alert-amber/30 bg-alert-amber/10 text-alert-amber',
    info: 'border-signal-cyan/30 bg-signal-cyan/10 text-signal-cyan'
  }

  const Icon = icons[notification.type] || Info

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-lg
        border backdrop-blur-md
        min-w-[280px] max-w-md
        ${colors[notification.type] || colors.info}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm flex-1">{notification.message}</span>
    </motion.div>
  )
}

export default NotificationContainer
