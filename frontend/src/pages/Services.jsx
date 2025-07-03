import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, RefreshCw, Play, Square, Trash2, ExternalLink, Terminal, 
  Database, Activity, RotateCw, Eye, EyeOff, Download, Copy, 
  Clock, Cpu, HardDrive, Globe, AlertCircle, CheckCircle,
  TrendingUp, PieChart, Settings, Filter, Search, Plus
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const Services = () => {
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showLogs, setShowLogs] = useState({})
  const [serviceLogs, setServiceLogs] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceStats, setServiceStats] = useState({})
  const [notifications, setNotifications] = useState([])
  const autoRefreshInterval = useRef(null)

  const fetchServices = async (showNotification = false) => {
    try {
      const response = await axios.get(api.endpoints.services)
      const newServices = response.data.services || []
      setServices(newServices)
      setFilteredServices(newServices)
      
      // Calculate stats
      const stats = {
        total: newServices.length,
        running: newServices.filter(s => s.status.includes('Up')).length,
        stopped: newServices.filter(s => !s.status.includes('Up')).length,
        totalMemory: calculateTotalMemory(newServices),
        avgUptime: calculateAvgUptime(newServices)
      }
      setServiceStats(stats)
      
      if (showNotification) {
        addNotification('Services refreshed successfully', 'success')
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      addNotification('Failed to refresh services', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalMemory = (services) => {
    // Estimate memory usage based on templates
    return services.reduce((total, service) => {
      const template = service.labels?.['zapie.template']
      const memory = template === 'pro' ? 2048 : template === 'plus' ? 1024 : 512
      return total + memory
    }, 0)
  }

  const calculateAvgUptime = (services) => {
    const runningServices = services.filter(s => s.status.includes('Up'))
    if (runningServices.length === 0) return 0
    
    const totalUptime = runningServices.reduce((total, service) => {
      const created = new Date(service.created * 1000)
      const uptime = Date.now() - created.getTime()
      return total + uptime
    }, 0)
    
    return totalUptime / runningServices.length
  }

  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const filterServices = () => {
    let filtered = services

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.image.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'running') {
        filtered = filtered.filter(s => s.status.includes('Up'))
      } else if (statusFilter === 'stopped') {
        filtered = filtered.filter(s => !s.status.includes('Up'))
      }
    }

    setFilteredServices(filtered)
  }

  useEffect(() => {
    filterServices()
  }, [services, searchTerm, statusFilter])

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshInterval.current = setInterval(() => {
        fetchServices()
      }, 10000) // Refresh every 10 seconds
    } else {
      clearInterval(autoRefreshInterval.current)
    }

    return () => clearInterval(autoRefreshInterval.current)
  }, [autoRefresh])

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    addNotification('Copied to clipboard!', 'success')
  }

  const downloadLogs = (serviceId, serviceName) => {
    const logs = serviceLogs[serviceId] || 'No logs available'
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${serviceName}-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification('Logs downloaded!', 'success')
  }

  const getServiceHealth = (service) => {
    if (service.status.includes('Up')) {
      const uptime = Date.now() - (service.created * 1000)
      const hours = uptime / (1000 * 60 * 60)
      
      if (hours > 24) return { status: 'excellent', color: 'green', text: 'Excellent' }
      if (hours > 1) return { status: 'good', color: 'blue', text: 'Good' }
      return { status: 'starting', color: 'yellow', text: 'Starting' }
    }
    return { status: 'stopped', color: 'red', text: 'Stopped' }
  }

  const formatUptime = (created) => {
    const uptime = Date.now() - (created * 1000)
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatMemory = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`
    return `${mb}MB`
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleAction = async (serviceId, action, serviceName) => {
    setActionLoading(`${serviceId}-${action}`)
    try {
      if (action === 'stop') {
        await axios.post(`${api.endpoints.services}/${serviceId}/stop`)
        addNotification(`Service "${serviceName}" stopped successfully`, 'success')
      } else if (action === 'start') {
        await axios.post(`${api.endpoints.services}/${serviceId}/start`)
        addNotification(`Service "${serviceName}" started successfully`, 'success')
      } else if (action === 'restart') {
        await axios.post(`${api.endpoints.services}/${serviceId}/restart`)
        addNotification(`Service "${serviceName}" restarted successfully`, 'success')
      } else if (action === 'remove') {
        const confirmMessage = `Are you sure you want to remove "${serviceName}"?\n\nThis action cannot be undone.`
        
        if (confirm(confirmMessage)) {
          const keepDataChoice = confirm(
            'Do you want to KEEP your data (workflows, credentials)?\n\n' +
            '- OK: Keep data (you can redeploy later with same data)\n' +
            '- Cancel: Delete everything permanently'
          )
          
          await axios.delete(`${api.endpoints.services}/${serviceId}?keepData=${keepDataChoice}`)
          
          if (keepDataChoice) {
            addNotification(`Service "${serviceName}" removed but data preserved`, 'success')
          } else {
            addNotification(`Service "${serviceName}" and all data removed permanently`, 'success')
          }
        } else {
          setActionLoading(null)
          return
        }
      }
      await fetchServices()
    } catch (error) {
      console.error(`Failed to ${action} service:`, error)
      addNotification(`Failed to ${action} service: ${error.response?.data?.message || error.message}`, 'error')
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
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success' ? 'bg-green-600 text-white' :
              notification.type === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mr-2" />
              ) : (
                <Activity className="w-5 h-5 mr-2" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600">Monitor and manage your deployed services</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={() => fetchServices(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{serviceStats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-green-600">{serviceStats.running || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Square className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stopped</p>
              <p className="text-2xl font-bold text-red-600">{serviceStats.stopped || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-purple-600">{formatMemory(serviceStats.totalMemory || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Services</option>
              <option value="running">Running Only</option>
              <option value="stopped">Stopped Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12">
          {services.length === 0 ? (
            <>
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-lg">No services deployed yet</p>
              <p className="text-gray-500 mb-6">Deploy your first service to get started</p>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Deploy Your First Service
              </Link>
            </>
          ) : (
            <>
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4 text-lg">No services match your search</p>
              <p className="text-gray-500">Try adjusting your search terms or filters</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredServices.map((service) => {
            const health = getServiceHealth(service)
            const serviceName = service.name.replace('zapie-', '').replace(/-[a-f0-9]{8}$/, '')
            
            return (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Service Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${health.color}-500`}></div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {serviceName}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${health.color}-100 text-${health.color}-800`}>
                          {health.text}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {service.labels?.['zapie.service']?.toUpperCase() || 'Unknown'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{service.image}</p>
                      
                      {/* Service Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Uptime</p>
                            <p className="text-sm font-medium">{service.status.includes('Up') ? formatUptime(service.created) : 'Stopped'}</p>
                          </div>
                        </div>
                        
                        {service.ports && service.ports.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Port</p>
                              <p className="text-sm font-medium">{service.ports[0]?.PublicPort}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Template</p>
                            <p className="text-sm font-medium capitalize">{service.labels?.['zapie.template'] || 'Basic'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="text-sm font-medium">{new Date(service.created * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-2">
                      {service.url && (
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open Service"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => copyToClipboard(service.url || 'No URL available')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {service.status.includes('Up') ? (
                      <button
                        onClick={() => handleAction(service.id, 'stop', serviceName)}
                        disabled={actionLoading === `${service.id}-stop`}
                        className="inline-flex items-center px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
                      >
                        {actionLoading === `${service.id}-stop` ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Square className="w-4 h-4 mr-2" />
                        )}
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(service.id, 'start', serviceName)}
                        disabled={actionLoading === `${service.id}-start`}
                        className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                      >
                        {actionLoading === `${service.id}-start` ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Start
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction(service.id, 'restart', serviceName)}
                      disabled={actionLoading === `${service.id}-restart`}
                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {actionLoading === `${service.id}-restart` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <RotateCw className="w-4 h-4 mr-2" />
                      )}
                      Restart
                    </button>
                    
                    <button
                      onClick={() => toggleLogs(service.id)}
                      className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      <Terminal className="w-4 h-4 mr-2" />
                      {showLogs[service.id] ? 'Hide Logs' : 'Show Logs'}
                    </button>
                    
                    {showLogs[service.id] && serviceLogs[service.id] && (
                      <button
                        onClick={() => downloadLogs(service.id, serviceName)}
                        className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Logs
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction(service.id, 'remove', serviceName)}
                      disabled={actionLoading === `${service.id}-remove`}
                      className="inline-flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors ml-auto"
                    >
                      {actionLoading === `${service.id}-remove` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>

                {/* Service Logs */}
                {showLogs[service.id] && (
                  <div className="p-6">
                    <div className="bg-gray-900 text-green-400 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4" />
                          <span className="text-sm font-medium text-gray-300">Container Logs</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchServiceLogs(service.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Refresh Logs"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(serviceLogs[service.id] || '')}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Copy Logs"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto font-mono text-sm">
                        <pre className="whitespace-pre-wrap">
                          {serviceLogs[service.id] || 'Loading logs...'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Services
