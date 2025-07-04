import { useState, useEffect, useRef } from 'react'
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, 
  Cpu, MemoryStick, HardDrive, Zap, RefreshCw,
  Download, Calendar, Filter, Settings, Maximize2
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'
import { useToast } from './Toast'
import { LoadingSpinner } from './Loading'

const ResourceUsageAnalytics = ({ services, onClose }) => {
  const [metricsData, setMetricsData] = useState({})
  const [historicalData, setHistoricalData] = useState({})
  const [timeRange, setTimeRange] = useState('1h') // 1h, 6h, 24h, 7d
  const [selectedServices, setSelectedServices] = useState(new Set(services.map(s => s.id)))
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('line') // line, bar, area
  const intervalRef = useRef(null)
  const canvasRefs = useRef({})
  
  const { success, error, info, ToastContainer } = useToast()

  useEffect(() => {
    fetchMetrics()
    if (autoRefresh) {
      startAutoRefresh()
    }
    return () => stopAutoRefresh()
  }, [timeRange, selectedServices, autoRefresh, refreshInterval])

  const startAutoRefresh = () => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      fetchMetrics()
    }, refreshInterval * 1000)
  }

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const fetchMetrics = async () => {
    try {
      const promises = Array.from(selectedServices).map(async (serviceId) => {
        const response = await axios.get(`${api.baseURL}/api/services/${serviceId}/metrics`, {
          params: { timeRange }
        })
        return { serviceId, data: response.data }
      })

      const results = await Promise.all(promises)
      const newMetricsData = {}
      const newHistoricalData = {}

      results.forEach(({ serviceId, data }) => {
        newMetricsData[serviceId] = data.current || {}
        newHistoricalData[serviceId] = data.historical || []
      })

      setMetricsData(newMetricsData)
      setHistoricalData(newHistoricalData)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      error('Metrics Error', 'Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
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

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`
  }

  const getMetricColor = (value, threshold = 80) => {
    if (value > threshold) return 'text-red-600'
    if (value > threshold * 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getMetricBgColor = (value, threshold = 80) => {
    if (value > threshold) return 'bg-red-50 border-red-200'
    if (value > threshold * 0.7) return 'bg-yellow-50 border-yellow-200'
    return 'bg-green-50 border-green-200'
  }

  const exportData = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      services: services.filter(s => selectedServices.has(s.id)).map(s => s.name),
      metrics: metricsData,
      historical: historicalData
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resource-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    success('Export Complete', 'Analytics data exported successfully')
  }

  const MetricCard = ({ title, value, unit, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    }

    return (
      <div className={`rounded-lg border p-4 ${getMetricBgColor(value, unit === '%' ? 80 : 1000000000)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className={`text-2xl font-bold ${getMetricColor(value, unit === '%' ? 80 : 1000000000)}`}>
          {unit === '%' ? formatPercentage(value) : 
           unit === 'bytes' ? formatBytes(value) : 
           value?.toFixed?.(2) || value || '0'}
          {unit && unit !== '%' && unit !== 'bytes' && ` ${unit}`}
        </p>
      </div>
    )
  }

  const SimpleChart = ({ data, color = '#3B82F6', height = 100 }) => {
    const canvasRef = useRef(null)

    useEffect(() => {
      if (!canvasRef.current || !data || data.length === 0) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const { width, height } = canvas

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Set up chart
      const padding = 20
      const chartWidth = width - padding * 2
      const chartHeight = height - padding * 2

      const maxValue = Math.max(...data.map(d => d.value))
      const minValue = Math.min(...data.map(d => d.value))
      const range = maxValue - minValue || 1

      // Draw grid lines
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
      }

      // Draw data line
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Fill area under curve
      if (chartType === 'area') {
        ctx.fillStyle = color + '20'
        ctx.lineTo(width - padding, padding + chartHeight)
        ctx.lineTo(padding, padding + chartHeight)
        ctx.closePath()
        ctx.fill()
      }

      // Draw data points
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - ((point.value - minValue) / range) * chartHeight

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })

    }, [data, color, chartType])

    return (
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-center text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Resource Usage Analytics</h2>
                <p className="text-purple-100">Real-time performance monitoring and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportData}
                className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Maximize2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Controls */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Chart Type:</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                  <option value="bar">Bar</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto Refresh</span>
                </label>
              </div>

              {autoRefresh && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Interval:</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="10">10s</option>
                    <option value="30">30s</option>
                    <option value="60">1m</option>
                    <option value="300">5m</option>
                  </select>
                </div>
              )}

              <button
                onClick={fetchMetrics}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-white border rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-purple-600" />
              Services ({selectedServices.size} selected)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {services.map(service => (
                <label key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.has(service.id)}
                    onChange={() => toggleServiceSelection(service.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-xs text-gray-500">
                      {service.labels?.['zapie.service']?.toUpperCase() || 'SERVICE'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Current Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from(selectedServices).map(serviceId => {
              const service = services.find(s => s.id === serviceId)
              const metrics = metricsData[serviceId] || {}
              
              return (
                <div key={serviceId} className="bg-white border rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 truncate">{service?.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      title="CPU"
                      value={metrics.cpu?.percentage}
                      unit="%"
                      icon={Cpu}
                      color="blue"
                      trend={metrics.cpu?.trend}
                    />
                    <MetricCard
                      title="Memory"
                      value={metrics.memory?.percentage}
                      unit="%"
                      icon={MemoryStick}
                      color="green"
                      trend={metrics.memory?.trend}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <MetricCard
                      title="Disk I/O"
                      value={metrics.disk?.readRate + metrics.disk?.writeRate}
                      unit="MB/s"
                      icon={HardDrive}
                      color="yellow"
                    />
                    <MetricCard
                      title="Network"
                      value={metrics.network?.inRate + metrics.network?.outRate}
                      unit="MB/s"
                      icon={Activity}
                      color="red"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Historical Charts */}
          <div className="space-y-6">
            {Array.from(selectedServices).map(serviceId => {
              const service = services.find(s => s.id === serviceId)
              const historical = historicalData[serviceId] || []
              
              if (historical.length === 0) return null

              return (
                <div key={serviceId} className="bg-white border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    {service?.name} - Historical Performance
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CPU Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Cpu className="w-4 h-4 mr-1" />
                        CPU Usage (%)
                      </h4>
                      <div className="border rounded-lg p-4">
                        <SimpleChart
                          data={historical.map(h => ({ value: h.cpu?.percentage || 0, timestamp: h.timestamp }))}
                          color="#3B82F6"
                          height={120}
                        />
                      </div>
                    </div>

                    {/* Memory Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <MemoryStick className="w-4 h-4 mr-1" />
                        Memory Usage (%)
                      </h4>
                      <div className="border rounded-lg p-4">
                        <SimpleChart
                          data={historical.map(h => ({ value: h.memory?.percentage || 0, timestamp: h.timestamp }))}
                          color="#10B981"
                          height={120}
                        />
                      </div>
                    </div>

                    {/* Disk I/O Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <HardDrive className="w-4 h-4 mr-1" />
                        Disk I/O (MB/s)
                      </h4>
                      <div className="border rounded-lg p-4">
                        <SimpleChart
                          data={historical.map(h => ({ 
                            value: (h.disk?.readRate || 0) + (h.disk?.writeRate || 0), 
                            timestamp: h.timestamp 
                          }))}
                          color="#F59E0B"
                          height={120}
                        />
                      </div>
                    </div>

                    {/* Network Chart */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-1" />
                        Network I/O (MB/s)
                      </h4>
                      <div className="border rounded-lg p-4">
                        <SimpleChart
                          data={historical.map(h => ({ 
                            value: (h.network?.inRate || 0) + (h.network?.outRate || 0), 
                            timestamp: h.timestamp 
                          }))}
                          color="#EF4444"
                          height={120}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedServices.size === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No services selected</p>
              <p className="text-gray-400">Select services to view their performance metrics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResourceUsageAnalytics
