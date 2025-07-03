import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Play, Square, Trash2, ExternalLink, Terminal, Database, Activity, RotateCw } from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showLogs, setShowLogs] = useState({})
  const [serviceLogs, setServiceLogs] = useState({})

  const fetchServices = async () => {
    try {
      const response = await axios.get(api.endpoints.services)
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceLogs = async (serviceId) => {
    try {
      const response = await axios.get(`${api.endpoints.services}/${serviceId}/logs`)
      setServiceLogs(prev => ({
        ...prev,
        [serviceId]: response.data.logs || 'No logs available'
      }))
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setServiceLogs(prev => ({
        ...prev,
        [serviceId]: 'Failed to fetch logs'
      }))
    }
  }

  const toggleLogs = async (serviceId) => {
    if (!showLogs[serviceId]) {
      await fetchServiceLogs(serviceId)
    }
    setShowLogs(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }))
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleAction = async (serviceId, action) => {
    setActionLoading(`${serviceId}-${action}`)
    try {
      if (action === 'stop') {
        await axios.post(`${api.endpoints.services}/${serviceId}/stop`)
        alert('Service stopped successfully')
      } else if (action === 'start') {
        await axios.post(`${api.endpoints.services}/${serviceId}/start`)
        alert('Service started successfully')
      } else if (action === 'restart') {
        await axios.post(`${api.endpoints.services}/${serviceId}/restart`)
        alert('Service restarted successfully')
      } else if (action === 'remove') {
        const confirmMessage = `Are you sure you want to remove this service?\n\nChoose:\n- OK: Remove service AND delete all data permanently\n- Cancel: Keep service running`
        
        if (confirm(confirmMessage)) {
          const keepDataChoice = confirm(
            'Do you want to KEEP your data (workflows, credentials)?\n\n' +
            '- OK: Keep data (you can redeploy later with same data)\n' +
            '- Cancel: Delete everything permanently'
          )
          
          const response = await axios.delete(`${api.endpoints.services}/${serviceId}?keepData=${keepDataChoice}`)
          
          if (keepDataChoice) {
            alert('Service removed but your data is preserved!\nYou can redeploy with the same name to restore your workflows.')
          } else {
            alert('Service and all data removed permanently.')
          }
        } else {
          setActionLoading(null)
          return
        }
      }
      await fetchServices()
    } catch (error) {
      console.error(`Failed to ${action} service:`, error)
      alert(`Failed to ${action} service: ${error.response?.data?.message || error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status) => {
    if (status.includes('running') || status.includes('Up')) return 'text-green-600 bg-green-100'
    if (status.includes('exited') || status.includes('stopped')) return 'text-red-600 bg-red-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-600">Manage your deployed services</p>
          </div>
          <button
            onClick={fetchServices}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No services deployed yet</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Deploy Your First Service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border p-6">
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      {service.status.includes('Up') ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.image}</p>
                  
                  {/* Service Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p className="font-medium">{new Date(service.created * 1000).toLocaleDateString()}</p>
                    </div>
                    {service.ports && service.ports.length > 0 && (
                      <div>
                        <span className="text-gray-500">Port:</span>
                        <p className="font-medium">{service.ports.map(p => p.PublicPort).join(', ')}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Template:</span>
                      <p className="font-medium">{service.labels?.['zapie.template'] || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Volume:</span>
                      <p className="font-medium text-xs">{service.labels?.['zapie.volume'] || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {service.url && (
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Service
                  </a>
                )}
                
                <button
                  onClick={() => toggleLogs(service.id)}
                  className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Terminal className="w-4 h-4 mr-1" />
                  {showLogs[service.id] ? 'Hide Logs' : 'Show Logs'}
                </button>

                {service.status.includes('Up') ? (
                  <button
                    onClick={() => handleAction(service.id, 'stop')}
                    disabled={actionLoading === `${service.id}-stop`}
                    className="inline-flex items-center px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
                  >
                    {actionLoading === `${service.id}-stop` ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Square className="w-4 h-4 mr-1" />
                    )}
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(service.id, 'start')}
                    disabled={actionLoading === `${service.id}-start`}
                    className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {actionLoading === `${service.id}-start` ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Start
                  </button>
                )}
                
                <button
                  onClick={() => handleAction(service.id, 'restart')}
                  disabled={actionLoading === `${service.id}-restart`}
                  className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {actionLoading === `${service.id}-restart` ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Restart
                </button>
                
                <button
                  onClick={() => handleAction(service.id, 'remove')}
                  disabled={actionLoading === `${service.id}-remove`}
                  className="inline-flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {actionLoading === `${service.id}-remove` ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Remove
                </button>
              </div>

              {/* Service Logs */}
              {showLogs[service.id] && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Container Logs:</span>
                    <button
                      onClick={() => fetchServiceLogs(service.id)}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {serviceLogs[service.id] || 'Loading logs...'}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Services
