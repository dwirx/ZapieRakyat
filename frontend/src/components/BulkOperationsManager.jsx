import { useState, useEffect } from 'react'
import { 
  Play, Square, RotateCcw, Trash2, Download, Upload,
  CheckSquare, Square as UncheckedSquare, Filter,
  Layers, Shield, Zap, AlertCircle, CheckCircle,
  Clock, RefreshCw, Settings, MoreHorizontal
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'
import { useToast } from './Toast'
import { LoadingSpinner } from './Loading'

const BulkOperationsManager = ({ services, onRefresh, onClose }) => {
  const [selectedServices, setSelectedServices] = useState(new Set())
  const [filteredServices, setFilteredServices] = useState(services)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [operationInProgress, setOperationInProgress] = useState(false)
  const [operationStatus, setOperationStatus] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  
  const { success, error, info, warning, ToastContainer } = useToast()

  useEffect(() => {
    filterServices()
  }, [services, statusFilter, typeFilter, searchTerm])

  const filterServices = () => {
    let filtered = [...services]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => service.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(service => 
        service.labels?.['zapie.service'] === typeFilter
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.labels?.['zapie.service']?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredServices(filtered)
  }

  const toggleServiceSelection = (serviceId) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
  }

  const selectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set())
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)))
    }
  }

  const executeOperation = async (operation) => {
    if (selectedServices.size === 0) {
      warning('No Selection', 'Please select at least one service')
      return
    }

    const confirmMessage = {
      start: 'start the selected services',
      stop: 'stop the selected services',
      restart: 'restart the selected services',
      delete: 'delete the selected services (this cannot be undone)',
      backup: 'create backups for the selected services'
    }

    if (!confirm(`Are you sure you want to ${confirmMessage[operation]}?`)) {
      return
    }

    setOperationInProgress(true)
    setOperationStatus({})

    const selectedServiceIds = Array.from(selectedServices)
    const totalServices = selectedServiceIds.length

    info('Operation Started', `Starting ${operation} operation for ${totalServices} service(s)`)

    const results = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const serviceId of selectedServiceIds) {
      try {
        setOperationStatus(prev => ({
          ...prev,
          [serviceId]: 'processing'
        }))

        let response
        switch (operation) {
          case 'start':
            response = await axios.post(`${api.baseURL}/api/services/${serviceId}/start`)
            break
          case 'stop':
            response = await axios.post(`${api.baseURL}/api/services/${serviceId}/stop`)
            break
          case 'restart':
            response = await axios.post(`${api.baseURL}/api/services/${serviceId}/restart`)
            break
          case 'delete':
            response = await axios.delete(`${api.baseURL}/api/services/${serviceId}`)
            break
          case 'backup':
            response = await axios.post(`${api.baseURL}/api/services/${serviceId}/backups`, {
              name: `bulk-backup-${new Date().toISOString().split('T')[0]}`,
              description: 'Bulk operation backup'
            })
            break
        }

        setOperationStatus(prev => ({
          ...prev,
          [serviceId]: 'success'
        }))
        results.success++

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (err) {
        setOperationStatus(prev => ({
          ...prev,
          [serviceId]: 'error'
        }))
        results.failed++
        results.errors.push({
          serviceId,
          serviceName: services.find(s => s.id === serviceId)?.name || serviceId,
          error: err.response?.data?.message || err.message
        })
      }
    }

    setOperationInProgress(false)

    // Show results
    if (results.failed === 0) {
      success('Operation Complete', `Successfully ${operation}ed ${results.success} service(s)`)
    } else if (results.success === 0) {
      error('Operation Failed', `Failed to ${operation} all ${results.failed} service(s)`)
    } else {
      warning('Partial Success', `${results.success} succeeded, ${results.failed} failed`)
    }

    // Show detailed errors if any
    if (results.errors.length > 0) {
      console.error('Bulk operation errors:', results.errors)
    }

    // Clear selection and refresh
    setSelectedServices(new Set())
    setOperationStatus({})
    if (onRefresh) onRefresh()
  }

  const getServiceTypeColor = (type) => {
    const colors = {
      'postgresql': 'bg-blue-100 text-blue-800',
      'n8n': 'bg-green-100 text-green-800',
      'waha': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'stopped':
        return <Square className="w-4 h-4 text-red-500" />
      case 'starting':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getOperationStatusIcon = (serviceId) => {
    const status = operationStatus[serviceId]
    switch (status) {
      case 'processing':
        return <LoadingSpinner size="sm" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const serviceTypes = [...new Set(services.map(s => s.labels?.['zapie.service']).filter(Boolean))]
  const statuses = [...new Set(services.map(s => s.status))]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bulk Operations Manager</h2>
                <p className="text-indigo-100">Manage multiple services at once</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Filters and Search */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectedServices.size === filteredServices.length && filteredServices.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <UncheckedSquare className="w-4 h-4" />
                )}
                <span>
                  {selectedServices.size === filteredServices.length && filteredServices.length > 0 
                    ? 'Deselect All' 
                    : 'Select All'
                  }
                </span>
              </button>
              
              <span className="text-sm text-gray-600">
                {selectedServices.size} of {filteredServices.length} selected
              </span>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => executeOperation('start')}
                disabled={operationInProgress || selectedServices.size === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </button>
              
              <button
                onClick={() => executeOperation('stop')}
                disabled={operationInProgress || selectedServices.size === 0}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </button>
              
              <button
                onClick={() => executeOperation('restart')}
                disabled={operationInProgress || selectedServices.size === 0}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart
              </button>
              
              <button
                onClick={() => executeOperation('backup')}
                disabled={operationInProgress || selectedServices.size === 0}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
              >
                <Shield className="w-4 h-4 mr-1" />
                Backup
              </button>
              
              <button
                onClick={() => executeOperation('delete')}
                disabled={operationInProgress || selectedServices.size === 0}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>

          {/* Services List */}
          <div className="bg-white border rounded-xl">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No services found</p>
                <p className="text-gray-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <div 
                    key={service.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      selectedServices.has(service.id) ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleServiceSelection(service.id)}
                          className="flex items-center justify-center w-5 h-5"
                        >
                          {selectedServices.has(service.id) ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <UncheckedSquare className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${getServiceTypeColor(service.labels?.['zapie.service'])}`}>
                                {service.labels?.['zapie.service']?.toUpperCase() || 'UNKNOWN'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Status: {service.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getOperationStatusIcon(service.id)}
                        {service.ports && service.ports.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Port: {service.ports[0].PublicPort || service.ports[0].PrivatePort}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operation Progress */}
          {operationInProgress && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <LoadingSpinner size="sm" />
                <div>
                  <h4 className="font-semibold text-blue-900">Operation in Progress</h4>
                  <p className="text-sm text-blue-700">
                    Processing {selectedServices.size} service(s)...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkOperationsManager
