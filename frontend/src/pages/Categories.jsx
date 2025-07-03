import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Workflow, Database, Globe, MessageSquare, Settings, Phone } from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'

const Categories = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Icon mapping for services
  const iconMapping = {
    'n8n': <Workflow className="w-8 h-8" />,
    'waha': <Phone className="w-8 h-8" />,
    'postgresql': <Database className="w-8 h-8" />,
    'postgres': <Database className="w-8 h-8" />,
    'nginx': <Globe className="w-8 h-8" />,
    'discord-bot': <MessageSquare className="w-8 h-8" />
  }

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/deploy/services`)
        if (response.data.success) {
          setServices(response.data.services)
        }
      } catch (err) {
        console.error('Error fetching services:', err)
        setError('Failed to load services')
        // Fallback to static data if backend is not available
        setServices([
          {
            id: 'n8n',
            name: 'n8n',
            description: 'Workflow automation platform',
            path: '/deploy/n8n'
          },
          {
            id: 'waha',
            name: 'WAHA',
            description: 'WhatsApp API - Connect WhatsApp to your applications',
            path: '/deploy/waha'
          },
          {
            id: 'postgresql',
            name: 'PostgreSQL',
            description: 'Open source relational database',
            path: '/deploy/postgresql'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ZapieRakyat
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Deploy services instantly without any technical knowledge
        </p>
        <p className="text-sm text-green-600 font-medium">
          🎉 Now FREE during Beta! No payment required
        </p>
        <div className="mt-4">
          <Link
            to="/services"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Services
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading services...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <div className="text-gray-600">Using fallback services</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div key={service.id} className="relative">
            {service.disabled && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg z-10 flex items-center justify-center">
                <span className="text-gray-500 font-medium">Coming Soon</span>
              </div>
            )}
            <Link
              to={service.path}
              className={`block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                service.disabled ? 'pointer-events-none' : ''
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-blue-100 rounded-full mb-4 text-blue-600">
                  {iconMapping[service.id] || <Settings className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {service.description}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Categories
