import { useState, useEffect } from 'react'
import { Activity, Cpu, HardDrive, Zap, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const SystemMonitor = () => {
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    dockerStatus: 'unknown',
    backendStatus: 'unknown'
  })

  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/health`)
        setSystemStats(prev => ({
          ...prev,
          backendStatus: 'online',
          dockerStatus: 'running'
        }))
        setIsOnline(true)
      } catch (error) {
        setSystemStats(prev => ({
          ...prev,
          backendStatus: 'offline'
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

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg border p-4 w-64">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">System Status</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-600">Backend</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(systemStats.backendStatus)}`}>
            {systemStats.backendStatus}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Docker</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(systemStats.dockerStatus)}`}>
            {systemStats.dockerStatus}
          </span>
        </div>
        
        {isOnline && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Quick Actions</div>
            <div className="flex space-x-1">
              <button className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                Logs
              </button>
              <button className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100">
                Health
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemMonitor
