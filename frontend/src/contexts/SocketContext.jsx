import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { api } from '../config/api'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [healthUpdates, setHealthUpdates] = useState({})
  const [metricsUpdates, setMetricsUpdates] = useState({})
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(api.socketURL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      retries: 3
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      setConnected(false)
    })

    // Health monitoring events
    newSocket.on('health-update', (data) => {
      setHealthUpdates(prev => ({
        ...prev,
        [data.containerId]: {
          ...data.health,
          timestamp: data.timestamp
        }
      }))
    })

    newSocket.on('metrics-update', (data) => {
      setMetricsUpdates(prev => ({
        ...prev,
        [data.containerId]: {
          ...data.metrics,
          timestamp: data.timestamp
        }
      }))
    })

    newSocket.on('health-alert', (data) => {
      const newAlert = {
        id: `${data.containerId}-${Date.now()}`,
        containerId: data.containerId,
        type: data.type,
        message: data.message,
        severity: data.severity,
        timestamp: data.timestamp,
        read: false
      }
      
      setAlerts(prev => [newAlert, ...prev.slice(0, 49)]) // Keep last 50 alerts
      
      // Show browser notification for critical alerts
      if (data.severity === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`ZapieRakyat Alert: ${data.type}`, {
            body: data.message,
            icon: '/favicon.ico',
            tag: data.containerId
          })
        }
      }
    })

    // Service action events (for real-time progress updates)
    newSocket.on('service-action', (data) => {
      console.log('🔄 Service action update:', data)
      
      // You can add state management here if needed
      // For now, we'll just log the progress
      
      // Optionally trigger notifications for major status changes
      if (data.status === 'completed') {
        // Service action completed successfully
        console.log(`✅ ${data.action} completed for container ${data.containerId}`)
      } else if (data.status === 'failed') {
        // Service action failed
        console.error(`❌ ${data.action} failed for container ${data.containerId}: ${data.message}`)
      } else if (data.status === 'in-progress') {
        // Service action in progress
        console.log(`🔄 ${data.action} in progress for container ${data.containerId}`)
      }
    })

    setSocket(newSocket)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      newSocket.close()
    }
  }, [])

  const joinDeploymentRoom = (deploymentId) => {
    if (socket) {
      socket.emit('join-deployment', deploymentId)
    }
  }

  const markAlertAsRead = (alertId) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    )
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const getUnreadAlertsCount = () => {
    return alerts.filter(alert => !alert.read).length
  }

  const value = {
    socket,
    connected,
    healthUpdates,
    metricsUpdates,
    alerts,
    joinDeploymentRoom,
    markAlertAsRead,
    clearAlerts,
    getUnreadAlertsCount
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
