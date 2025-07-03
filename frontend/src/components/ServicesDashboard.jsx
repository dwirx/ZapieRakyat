import { useState, useEffect } from 'react'
import { 
  TrendingUp, Users, Clock, Zap, Database, Server, 
  Activity, CheckCircle, AlertTriangle, BarChart3 
} from 'lucide-react'

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue', trend = 'up' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {change && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

const ServiceTypeChart = ({ services }) => {
  const [serviceTypes, setServiceTypes] = useState({})

  useEffect(() => {
    const types = services.reduce((acc, service) => {
      const type = service.labels?.['zapie.service'] || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    setServiceTypes(types)
  }, [services])

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500']
  const total = Object.values(serviceTypes).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Service Types</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {Object.entries(serviceTypes).map(([type, count], index) => (
          <div key={type} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
              <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{count}</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${(count / total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        
        {Object.keys(serviceTypes).length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No services deployed yet
          </div>
        )}
      </div>
    </div>
  )
}

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'deploy': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'stop': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'remove': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length > 0 ? activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            {getActivityIcon(activity.type)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ResourceUsage = ({ services }) => {
  const [usage, setUsage] = useState({ cpu: 0, memory: 0, storage: 0 })

  useEffect(() => {
    // Calculate estimated resource usage
    const totalMemory = services.reduce((total, service) => {
      const template = service.labels?.['zapie.template']
      const memory = template === 'pro' ? 2048 : template === 'plus' ? 1024 : 512
      return total + memory
    }, 0)

    setUsage({
      cpu: Math.min(services.length * 15, 100), // Estimated CPU usage
      memory: Math.min((totalMemory / 8192) * 100, 100), // Assume 8GB total
      storage: Math.min(services.length * 10, 100) // Estimated storage
    })
  }, [services])

  const ResourceBar = ({ label, value, color }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resource Usage</h3>
        <Server className="w-5 h-5 text-gray-400" />
      </div>
      
      <ResourceBar 
        label="CPU" 
        value={usage.cpu} 
        color={usage.cpu > 80 ? 'bg-red-500' : usage.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}
      />
      
      <ResourceBar 
        label="Memory" 
        value={usage.memory} 
        color={usage.memory > 80 ? 'bg-red-500' : usage.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500'}
      />
      
      <ResourceBar 
        label="Storage" 
        value={usage.storage} 
        color={usage.storage > 80 ? 'bg-red-500' : usage.storage > 60 ? 'bg-yellow-500' : 'bg-purple-500'}
      />
    </div>
  )
}

const ServicesDashboard = ({ services = [], stats = {}, activities = [] }) => {
  const dashboardStats = [
    {
      title: 'Total Services',
      value: stats.total || 0,
      change: '+2 this week',
      icon: Database,
      color: 'blue'
    },
    {
      title: 'Running Services',
      value: stats.running || 0,
      change: '+1 today',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Total Memory',
      value: `${Math.round((stats.totalMemory || 0) / 1024 * 10) / 10}GB`,
      change: '+0.5GB',
      icon: Server,
      color: 'purple'
    },
    {
      title: 'Avg Uptime',
      value: stats.avgUptime ? `${Math.round(stats.avgUptime / (1000 * 60 * 60))}h` : '0h',
      change: '+2h',
      icon: Clock,
      color: 'yellow'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ServiceTypeChart services={services} />
        <ResourceUsage services={services} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}

export { StatsCard, ServiceTypeChart, RecentActivity, ResourceUsage }
export default ServicesDashboard
