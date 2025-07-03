import { useState, useEffect } from 'react'
import { X, Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { io } from 'socket.io-client'
import { api } from '../config/api'

const DeploymentMonitor = ({ onClose }) => {
  const [deployments, setDeployments] = useState([])
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const socketConnection = io(api.baseURL)
    setSocket(socketConnection)

    socketConnection.on('deployment-progress', (data) => {
      setDeployments(prev => {
        const existing = prev.find(d => d.deploymentId === data.deploymentId)
        if (existing) {
          return prev.map(d => 
            d.deploymentId === data.deploymentId 
              ? { ...d, ...data, timestamp: new Date() }
              : d
          )
        } else {
          return [...prev, { ...data, timestamp: new Date() }]
        }
      })
    })

    socketConnection.on('deployment-complete', (data) => {
      setDeployments(prev => 
        prev.map(d => 
          d.deploymentId === data.deploymentId 
            ? { ...d, status: 'completed', completedAt: new Date() }
            : d
        )
      )
    })

    return () => {
      socketConnection.disconnect()
    }
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'info':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const removeDeployment = (deploymentId) => {
    setDeployments(prev => prev.filter(d => d.deploymentId !== deploymentId))
  }

  if (deployments.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Deployment Monitor</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {deployments.map((deployment) => (
          <div key={deployment.deploymentId} className="p-4 border-b last:border-b-0">
            <div className="flex items-start space-x-3">
              {getStatusIcon(deployment.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {deployment.serviceName || 'Unknown Service'}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {deployment.timestamp?.toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-700">
                  {deployment.step || deployment.message}
                </p>
                {deployment.status === 'completed' && (
                  <button
                    onClick={() => removeDeployment(deployment.deploymentId)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeploymentMonitor
