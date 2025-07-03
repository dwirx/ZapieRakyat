import { useState, useEffect } from 'react'
import { 
  Activity, Cpu, HardDrive, Zap, Wifi, WifiOff, Server, 
  Monitor, AlertTriangle, CheckCircle, Clock, Minimize2 
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const SystemMonitor = () => {
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    dockerStatus: 'unknown',
    backendStatus: 'unknown',
    uptime: 0,
    totalServices: 0,
    runningServices: 0
  })

  const [isOnline, setIsOnline] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const healthResponse = await axios.get(`${api.baseURL}/api/health`)
        const servicesResponse = await axios.get(`${api.baseURL}/api/services`)
        
        const services = servicesResponse.data.services || []
        const runningCount = services.filter(s => s.status.includes('Up')).length
        
        setSystemStats(prev => ({
          ...prev,
          backendStatus: 'online',
          dockerStatus: healthResponse.data.docker?.status || 'running',
          uptime: healthResponse.data.uptime || 0,
          totalServices: services.length,
          runningServices: runningCount,
          memoryUsage: Math.round((healthResponse.data.memory?.heapUsed / healthResponse.data.memory?.heapTotal) * 100) || 0
        }))
        setIsOnline(true)
        setLastUpdate(new Date())
      } catch (error) {
        setSystemStats(prev => ({
          ...prev,
          backendStatus: 'offline',
          dockerStatus: 'unknown'
        }))
        setIsOnline(false)
      }
    }

    const interval = setInterval(checkSystemHealth, 30000) // Check every 30 seconds
    checkSystemHealth()

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'running':
        return 'text-green-600'
      case 'offline':
      case 'stopped':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
      case 'stopped':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className={`
            p-3 rounded-full shadow-lg border-2 transition-all duration-200 hover:scale-110
            ${isOnline 
              ? 'bg-green-500 border-green-400 text-white hover:bg-green-600' 
              : 'bg-red-500 border-red-400 text-white hover:bg-red-600 animate-pulse'
            }
          `}
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-5 w-80 transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className={`w-5 h-5 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">System Monitor</h3>
              <p className="text-xs text-gray-500">Last update: {lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Backend Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">Backend</span>
              </div>
              {getStatusIcon(systemStats.backendStatus)}
            </div>
            <div className={`text-xs font-semibold ${getStatusColor(systemStats.backendStatus)}`}>
              {systemStats.backendStatus}
            </div>
            {systemStats.uptime > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Uptime: {formatUptime(systemStats.uptime)}
              </div>
            )}
          </div>

          {/* Docker Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-600 font-medium">Docker</span>
              </div>
              {getStatusIcon(systemStats.dockerStatus)}
            </div>
            <div className={`text-xs font-semibold ${getStatusColor(systemStats.dockerStatus)}`}>
              {systemStats.dockerStatus}
            </div>
          </div>
        </div>

        {/* Services Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded">
                <HardDrive className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Services</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">
                {systemStats.runningServices}/{systemStats.totalServices}
              </div>
              <div className="text-xs text-gray-500">running</div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        {systemStats.memoryUsage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">Memory Usage</span>
              <span className="text-xs text-gray-500">{systemStats.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  systemStats.memoryUsage > 80 ? 'bg-red-500' :
                  systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.memoryUsage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {isOnline && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2 font-medium">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Logs</span>
              </button>
              <button className="px-3 py-2 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center justify-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Health</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemMonitor
