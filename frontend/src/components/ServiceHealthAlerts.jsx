import { useState, useEffect, useRef } from 'react'
import { 
  Bell, BellRing, AlertTriangle, CheckCircle, Clock,
  X, Volume2, VolumeX, Settings, Trash2, Eye,
  Server, Activity, Wifi, WifiOff, Zap, Shield
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'
import { useToast } from './Toast'

const ServiceHealthAlerts = ({ services, onClose }) => {
  const [alerts, setAlerts] = useState([])
  const [healthHistory, setHealthHistory] = useState({})
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [alertSettings, setAlertSettings] = useState({
    monitoringEnabled: true,
    checkInterval: 30, // seconds
    notifyOnDown: true,
    notifyOnUp: true,
    notifyOnHighMemory: true,
    notifyOnHighCPU: true,
    memoryThreshold: 80, // percentage
    cpuThreshold: 80 // percentage
  })
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef(null)
  const audioRef = useRef(null)
  const previousStatusRef = useRef({})
  
  const { success, error, warning, info, ToastContainer } = useToast()

  useEffect(() => {
    if (alertSettings.monitoringEnabled) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
    
    return () => stopMonitoring()
  }, [alertSettings.monitoringEnabled, alertSettings.checkInterval])

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('zapie-alert-settings')
    if (savedSettings) {
      setAlertSettings(JSON.parse(savedSettings))
    }

    const savedSoundEnabled = localStorage.getItem('zapie-sound-enabled')
    if (savedSoundEnabled) {
      setSoundEnabled(JSON.parse(savedSoundEnabled))
    }
  }, [])

  const saveSettings = (newSettings) => {
    setAlertSettings(newSettings)
    localStorage.setItem('zapie-alert-settings', JSON.stringify(newSettings))
  }

  const startMonitoring = () => {
    if (intervalRef.current) return
    
    // Initial check
    checkServicesHealth()
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      checkServicesHealth()
    }, alertSettings.checkInterval * 1000)
  }

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const checkServicesHealth = async () => {
    for (const service of services) {
      try {
        const response = await axios.get(`${api.baseURL}/api/services/${service.id}/health`)
        const healthData = response.data
        
        const previousStatus = previousStatusRef.current[service.id]
        const currentStatus = healthData.status
        
        // Update health history
        setHealthHistory(prev => ({
          ...prev,
          [service.id]: {
            ...prev[service.id],
            lastCheck: new Date(),
            status: currentStatus,
            metrics: healthData.metrics || {}
          }
        }))

        // Check for status changes
        if (previousStatus && previousStatus !== currentStatus) {
          if (currentStatus === 'down' && alertSettings.notifyOnDown) {
            createAlert('down', service, 'Service has gone down')
          } else if (currentStatus === 'up' && previousStatus === 'down' && alertSettings.notifyOnUp) {
            createAlert('up', service, 'Service is back online')
          }
        }

        // Check resource usage alerts
        if (healthData.metrics) {
          const { memory, cpu } = healthData.metrics
          
          if (memory && memory.percentage > alertSettings.memoryThreshold && alertSettings.notifyOnHighMemory) {
            createAlert('high-memory', service, `High memory usage: ${memory.percentage.toFixed(1)}%`)
          }
          
          if (cpu && cpu.percentage > alertSettings.cpuThreshold && alertSettings.notifyOnHighCPU) {
            createAlert('high-cpu', service, `High CPU usage: ${cpu.percentage.toFixed(1)}%`)
          }
        }

        previousStatusRef.current[service.id] = currentStatus
        
      } catch (err) {
        console.error(`Health check failed for service ${service.id}:`, err)
        
        // If we can't reach the service, consider it down
        if (previousStatusRef.current[service.id] !== 'unreachable') {
          createAlert('unreachable', service, 'Service is unreachable')
          previousStatusRef.current[service.id] = 'unreachable'
        }
      }
    }
  }

  const createAlert = (type, service, message) => {
    const alertId = `${service.id}-${type}-${Date.now()}`
    const newAlert = {
      id: alertId,
      type,
      service,
      message,
      timestamp: new Date(),
      read: false
    }

    setAlerts(prev => [newAlert, ...prev].slice(0, 50)) // Keep only last 50 alerts

    // Play sound if enabled
    if (soundEnabled) {
      playAlertSound(type)
    }

    // Show toast notification
    const toastMessage = `${service.name}: ${message}`
    switch (type) {
      case 'down':
      case 'unreachable':
        error('Service Down', toastMessage)
        break
      case 'up':
        success('Service Restored', toastMessage)
        break
      case 'high-memory':
      case 'high-cpu':
        warning('Resource Alert', toastMessage)
        break
      default:
        info('Service Alert', toastMessage)
    }
  }

  const playAlertSound = (type) => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    // Different sounds for different alert types
    const soundMap = {
      'down': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYEJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYE',
      'unreachable': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYEJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYE',
      'up': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYEJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYE',
      'high-memory': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYEJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYE',
      'high-cpu': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYEJHfH8N2QQAoUXrTp66hVFApGn+D1wm0gBj2T3PLNdyYE'
    }

    const soundUrl = soundMap[type] || soundMap['down']
    audioRef.current.src = soundUrl
    audioRef.current.play().catch(console.error)
  }

  const markAsRead = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ))
  }

  const deleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const clearAllAlerts = () => {
    setAlerts([])
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'down':
      case 'unreachable':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'up':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'high-memory':
      case 'high-cpu':
        return <Activity className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'down':
      case 'unreachable':
        return 'border-l-red-500 bg-red-50'
      case 'up':
        return 'border-l-green-500 bg-green-50'
      case 'high-memory':
      case 'high-cpu':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const getServiceHealth = (serviceId) => {
    return healthHistory[serviceId] || { status: 'unknown', lastCheck: null }
  }

  const unreadCount = alerts.filter(alert => !alert.read).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Service Health Alerts</h2>
                <p className="text-red-100">Real-time monitoring and notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Alert Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      checked={alertSettings.monitoringEnabled}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        monitoringEnabled: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium">Enable Monitoring</span>
                  </label>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={alertSettings.checkInterval}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        checkInterval: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
                  
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.notifyOnDown}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        notifyOnDown: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Service Down</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.notifyOnUp}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        notifyOnUp: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Service Restored</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={alertSettings.notifyOnHighMemory}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        notifyOnHighMemory: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">High Memory Usage</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      checked={alertSettings.notifyOnHighCPU}
                      onChange={(e) => saveSettings({
                        ...alertSettings,
                        notifyOnHighCPU: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">High CPU Usage</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Memory Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="95"
                        value={alertSettings.memoryThreshold}
                        onChange={(e) => saveSettings({
                          ...alertSettings,
                          memoryThreshold: parseInt(e.target.value)
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        CPU Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="95"
                        value={alertSettings.cpuThreshold}
                        onChange={(e) => saveSettings({
                          ...alertSettings,
                          cpuThreshold: parseInt(e.target.value)
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Status Overview */}
          <div className="bg-white border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-blue-600" />
              Service Status Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(service => {
                const health = getServiceHealth(service.id)
                return (
                  <div key={service.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <div className="flex items-center space-x-1">
                        {health.status === 'up' && <Wifi className="w-4 h-4 text-green-500" />}
                        {health.status === 'down' && <WifiOff className="w-4 h-4 text-red-500" />}
                        {health.status === 'unknown' && <Clock className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${
                          health.status === 'up' ? 'text-green-600' :
                          health.status === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {health.status || 'Unknown'}
                        </span>
                      </div>
                      
                      {health.lastCheck && (
                        <div className="flex justify-between mt-1">
                          <span>Last Check:</span>
                          <span className="text-xs">
                            {health.lastCheck.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      
                      {health.metrics && (
                        <div className="mt-2 space-y-1">
                          {health.metrics.memory && (
                            <div className="flex justify-between">
                              <span>Memory:</span>
                              <span className={`text-xs ${
                                health.metrics.memory.percentage > alertSettings.memoryThreshold 
                                  ? 'text-red-600 font-medium' : ''
                              }`}>
                                {health.metrics.memory.percentage.toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {health.metrics.cpu && (
                            <div className="flex justify-between">
                              <span>CPU:</span>
                              <span className={`text-xs ${
                                health.metrics.cpu.percentage > alertSettings.cpuThreshold 
                                  ? 'text-red-600 font-medium' : ''
                              }`}>
                                {health.metrics.cpu.percentage.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <BellRing className="w-5 h-5 mr-2 text-red-600" />
                Recent Alerts ({alerts.length})
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              
              {alerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No alerts</p>
                <p className="text-gray-400">
                  {alertSettings.monitoringEnabled 
                    ? 'All services are running smoothly' 
                    : 'Monitoring is disabled'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.type)} ${
                      alert.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {alert.service.name}
                            </h4>
                            <span className="px-2 py-1 text-xs bg-white rounded-full">
                              {alert.service.labels?.['zapie.service']?.toUpperCase() || 'SERVICE'}
                            </span>
                          </div>
                          <p className="text-gray-700">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!alert.read && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete alert"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceHealthAlerts
