import { Link } from 'react-router-dom'
import { Workflow, Database, Globe, MessageSquare, Settings } from 'lucide-react'

const Categories = () => {
  const services = [
    {
      id: 'n8n',
      name: 'n8n',
      description: 'Workflow automation platform',
      icon: <Workflow className="w-8 h-8" />,
      path: '/deploy/n8n'
    },
    {
      id: 'postgres',
      name: 'PostgreSQL',
      description: 'Powerful open source database',
      icon: <Database className="w-8 h-8" />,
      path: '/deploy/postgres',
      disabled: true
    },
    {
      id: 'nginx',
      name: 'Nginx',
      description: 'High-performance web server',
      icon: <Globe className="w-8 h-8" />,
      path: '/deploy/nginx',
      disabled: true
    },
    {
      id: 'discord-bot',
      name: 'Discord Bot',
      description: 'Custom Discord bot hosting',
      icon: <MessageSquare className="w-8 h-8" />,
      path: '/deploy/discord-bot',
      disabled: true
    }
  ]

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
                  {service.icon}
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
