import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Workflow, Database, Globe, MessageSquare, Settings, Phone, 
  Zap, Star, TrendingUp, Shield, Clock, Users, 
  Activity, CheckCircle, ArrowRight, Sparkles 
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const Categories = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total: 0, running: 0, deployed: 0 })
  const [featuredService, setFeaturedService] = useState(null)

  // Enhanced icon mapping with colors
  const iconMapping = {
    'n8n': { icon: <Workflow className="w-8 h-8" />, color: 'bg-purple-100 text-purple-600', gradient: 'from-purple-500 to-indigo-600' },
    'waha': { icon: <Phone className="w-8 h-8" />, color: 'bg-green-100 text-green-600', gradient: 'from-green-500 to-emerald-600' },
    'postgresql': { icon: <Database className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600', gradient: 'from-blue-500 to-cyan-600' },
    'postgres': { icon: <Database className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600', gradient: 'from-blue-500 to-cyan-600' },
    'nginx': { icon: <Globe className="w-8 h-8" />, color: 'bg-orange-100 text-orange-600', gradient: 'from-orange-500 to-red-600' },
    'discord-bot': { icon: <MessageSquare className="w-8 h-8" />, color: 'bg-indigo-100 text-indigo-600', gradient: 'from-indigo-500 to-purple-600' }
  }

  const defaultIcon = { icon: <Settings className="w-8 h-8" />, color: 'bg-gray-100 text-gray-600', gradient: 'from-gray-500 to-gray-600' }

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/deploy/services`)
        if (response.data.success) {
          setServices(response.data.services)
          
          // Set featured service (PostgreSQL as newest feature)
          const postgres = response.data.services.find(s => s.id === 'postgresql')
          if (postgres) {
            setFeaturedService({
              ...postgres,
              isNew: true,
              features: ['Custom Credentials', 'Multiple Templates', 'Persistent Storage', 'Real-time Monitoring']
            })
          }
        }
      } catch (err) {
        console.error('Error fetching services:', err)
        setError('Failed to load services')
        // Enhanced fallback data
        const fallbackServices = [
          {
            id: 'n8n',
            name: 'n8n',
            description: 'Workflow automation platform - Build complex automations with visual interface',
            path: '/deploy/n8n',
            category: 'Automation',
            difficulty: 'Beginner',
            deployTime: '2-3 min'
          },
          {
            id: 'waha',
            name: 'WAHA',
            description: 'WhatsApp API - Connect WhatsApp to your applications with ease',
            path: '/deploy/waha',
            category: 'Communication',
            difficulty: 'Beginner',
            deployTime: '1-2 min'
          },
          {
            id: 'postgresql',
            name: 'PostgreSQL',
            description: 'Open source relational database with advanced features',
            path: '/deploy/postgresql',
            category: 'Database',
            difficulty: 'Intermediate',
            deployTime: '1-2 min',
            isNew: true
          }
        ]
        setServices(fallbackServices)
        setFeaturedService({
          ...fallbackServices[2],
          features: ['Custom Credentials', 'Multiple Templates', 'Persistent Storage', 'Real-time Monitoring']
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/services`)
        const runningServices = response.data.services?.filter(s => s.status.includes('Up')) || []
        setStats({
          total: response.data.services?.length || 0,
          running: runningServices.length,
          deployed: response.data.services?.length || 0
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    fetchServices()
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Platform Deployment Terdepan
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
              ZapieRakyat
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Deploy layanan powerful tanpa pengetahuan teknis kompleks
            </p>
            
            <p className="text-lg text-green-600 font-semibold mb-8 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              100% GRATIS selama Beta! Tidak perlu pembayaran
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Services Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.running}</div>
                <div className="text-sm text-gray-600">Currently Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.deployed}</div>
                <div className="text-sm text-gray-600">Total Deployed</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Settings className="w-5 h-5 mr-2" />
                Kelola Services
              </Link>
              
              <button
                onClick={() => document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200 shadow-md hover:shadow-lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Mulai Deploy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Service Section */}
      {featuredService && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative">
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold mr-4">
                  ⭐ BARU!
                </span>
                <span className="text-white/80">Fitur Terbaru</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">{featuredService.name}</h2>
                  <p className="text-white/90 text-lg mb-6">{featuredService.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {featuredService.features?.map((feature, index) => (
                      <div key={index} className="flex items-center text-white/90">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to={featuredService.path}
                    className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Deploy Sekarang
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <div className="text-white">
                        {iconMapping[featuredService.id]?.icon || defaultIcon.icon}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-600 text-lg">Memuat layanan...</div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-red-600 mb-4 text-lg">{error}</div>
          <div className="text-gray-600">Menggunakan data fallback</div>
        </div>
      ) : null}

      {/* Services Grid */}
      <div id="services-section" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilih Layanan untuk Deploy</h2>
          <p className="text-gray-600 text-lg">Semua layanan siap deploy dalam hitungan menit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const serviceIcon = iconMapping[service.id] || defaultIcon
            
            return (
              <div key={service.id} className="relative group">
                {service.disabled && (
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-xl z-10 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-500 font-medium">Segera Hadir</span>
                    </div>
                  </div>
                )}
                
                <Link
                  to={service.path}
                  className={`block relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 ${
                    service.disabled ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Header with gradient */}
                  <div className={`h-24 bg-gradient-to-r ${serviceIcon.gradient} relative`}>
                    {service.isNew && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                          BARU
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-6 left-6">
                      <div className={`w-12 h-12 ${serviceIcon.color} rounded-lg flex items-center justify-center shadow-lg border-4 border-white`}>
                        {serviceIcon.icon}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 pt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {service.category}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    
                    {/* Service metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      {service.difficulty && (
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {service.difficulty}
                        </div>
                      )}
                      {service.deployTime && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {service.deployTime}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                        <span className="text-sm">Deploy Sekarang</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">Siap</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
        
        {/* Coming Soon Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Layanan Segera Hadir</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Redis', 'MongoDB', 'MySQL', 'Nginx'].map((service) => (
              <div key={service} className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">{service}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Categories
