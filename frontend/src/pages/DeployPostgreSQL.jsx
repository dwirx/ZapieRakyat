import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Cpu, HardDrive, Database, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { api } from '../config/api'

const DeployPostgreSQL = () => {
  const [serviceName, setServiceName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('basic')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState(null)
  const [deploymentProgress, setDeploymentProgress] = useState([])
  const [currentStep, setCurrentStep] = useState('')
  const [socket, setSocket] = useState(null)
  
  // PostgreSQL specific fields
  const [postgresUser, setPostgresUser] = useState('postgres')
  const [postgresPassword, setPostgresPassword] = useState('postgres')
  const [showPassword, setShowPassword] = useState(false)

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/deploy/services/postgresql/templates`)
        if (response.data.success && response.data.service.templates) {
          setTemplates(response.data.service.templates)
        } else {
          // Fallback templates
          setTemplates([
            {
              id: 'basic',
              name: 'PostgreSQL Basic',
              description: 'Basic PostgreSQL instance',
              cpu: '0.5 CPU',
              ram: '512 MB RAM',
              price: 'Free',
              priceValue: 0
            },
            {
              id: 'plus',
              name: 'PostgreSQL Plus',
              description: 'Medium PostgreSQL instance',
              cpu: '1.0 CPU',
              ram: '1 GB RAM',
              price: 'Free',
              priceValue: 0
            },
            {
              id: 'pro',
              name: 'PostgreSQL Pro',
              description: 'High performance PostgreSQL instance',
              cpu: '2.0 CPU',
              ram: '2 GB RAM',
              price: 'Free',
              priceValue: 0
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching templates:', error)
        // Use fallback templates
        setTemplates([
          {
            id: 'basic',
            name: 'PostgreSQL Basic',
            description: 'Basic PostgreSQL instance',
            cpu: '0.5 CPU',
            ram: '512 MB RAM',
            price: 'Free',
            priceValue: 0
          },
          {
            id: 'plus',
            name: 'PostgreSQL Plus',
            description: 'Medium PostgreSQL instance',
            cpu: '1.0 CPU',
            ram: '1 GB RAM',
            price: 'Free',
            priceValue: 0
          },
          {
            id: 'pro',
            name: 'PostgreSQL Pro',
            description: 'High performance PostgreSQL instance',
            cpu: '2.0 CPU',
            ram: '2 GB RAM',
            price: 'Free',
            priceValue: 0
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    const socketConnection = io(api.baseURL)
    setSocket(socketConnection)

    socketConnection.on('deployment-progress', (data) => {
      console.log('📡 Received progress:', data)
      setDeploymentProgress(prev => [...prev, {
        step: data.step,
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        status: data.status
      }])
      
      if (data.status === 'success') {
        setCurrentStep('Completed!')
      } else if (data.status === 'error') {
        setCurrentStep('Failed!')
      } else {
        setCurrentStep(data.step)
      }
    })

    return () => {
      socketConnection.disconnect()
    }
  }, [])

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  const handleDeploy = async () => {
    if (!serviceName.trim()) {
      alert('Please enter a service name')
      return
    }

    if (!postgresUser.trim()) {
      alert('Please enter a PostgreSQL username')
      return
    }

    if (!postgresPassword.trim()) {
      alert('Please enter a PostgreSQL password')
      return
    }

    setIsDeploying(true)
    setDeploymentProgress([])
    setDeploymentResult(null)
    setCurrentStep('Starting deployment...')
    
    try {
      const response = await axios.post(api.endpoints.deploy, {
        serviceName: serviceName.trim(),
        serviceType: 'postgresql',
        template: selectedTemplate,
        credentials: {
          POSTGRES_USER: postgresUser.trim(),
          POSTGRES_PASSWORD: postgresPassword.trim()
        }
      })

      setDeploymentResult(response.data)
    } catch (error) {
      console.error('Deployment failed:', error)
      setCurrentStep('Deployment failed!')
      setDeploymentProgress(prev => [...prev, {
        step: `❌ Deployment failed: ${error.response?.data?.message || error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'error'
      }])
      alert('Deployment failed. Please check the progress log for details.')
    } finally {
      setTimeout(() => setIsDeploying(false), 2000) // Keep showing progress for 2 seconds
    }
  }

  if (isDeploying) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-blue-800 mb-2">
              Deploying {serviceName}...
            </h2>
            <p className="text-blue-700">
              {currentStep}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 max-h-64 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Deployment Progress:</h3>
            <div className="space-y-2">
              {deploymentProgress.map((item, index) => (
                <div key={index} className={`flex items-start space-x-3 text-sm p-2 rounded ${
                  item.status === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
                  item.status === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                  'bg-gray-50'
                }`}>
                  <span className="text-gray-500 font-mono text-xs">{item.timestamp}</span>
                  <span className={`${
                    item.status === 'success' ? 'text-green-700' :
                    item.status === 'error' ? 'text-red-700' :
                    'text-gray-700'
                  } flex-1`}>{item.step}</span>
                </div>
              ))}
              {deploymentProgress.length === 0 && (
                <div className="text-gray-500 text-sm italic">
                  Waiting for deployment to start...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (deploymentResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 mb-4">
            <Database className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Deployment Successful!
          </h2>
          <p className="text-green-700 mb-6">
            Your PostgreSQL service "{deploymentResult.serviceName}" is now running with persistent data storage
          </p>
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Connection Details:</p>
            <div className="text-left space-y-2">
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                <strong>Host:</strong> {deploymentResult.url?.replace('http://', '').replace(':5432', '')}
              </div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                <strong>Port:</strong> 5432
              </div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                <strong>Username:</strong> {postgresUser}
              </div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                <strong>Password:</strong> {showPassword ? postgresPassword : '••••••••'}
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />}
                </button>
              </div>
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                <strong>Database:</strong> postgres (default)
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              📁 Data is stored in volume: {deploymentResult.containerName}_data
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <p className="font-medium">Next Steps:</p>
              <p>1. Use the connection details above to connect your application</p>
              <p>2. Connect with psql: <code className="bg-yellow-100 px-1 rounded">psql -h {deploymentResult.url?.replace('http://', '').replace(':5432', '')} -p 5432 -U {postgresUser} -d postgres</code></p>
              <p>3. Create your databases and tables as needed</p>
            </div>
          </div>
          <div className="flex space-x-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Database className="w-4 h-4 mr-2" />
              Manage Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Deploy PostgreSQL</h1>
        <p className="text-gray-600">Configure and deploy your relational database in seconds - FREE during beta!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Configuration */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Service Configuration
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="my-postgresql-db"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a unique name for your PostgreSQL service
              </p>
            </div>
            
            {/* PostgreSQL Credentials */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Database Credentials</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={postgresUser}
                  onChange={(e) => setPostgresUser(e.target.value)}
                  placeholder="postgres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  PostgreSQL username (default: postgres)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={postgresPassword}
                    onChange={(e) => setPostgresPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a strong password for your database
                </p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Choose Template
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-600">Loading templates...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`cursor-pointer border rounded-lg p-4 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>
                      <div className="flex justify-center space-x-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center">
                          <Cpu className="w-4 h-4 mr-1" />
                          {template.cpu}
                        </div>
                        <div className="flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          {template.ram}
                        </div>
                      </div>
                      <div className="mt-2 font-medium text-gray-900">
                        {template.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deployment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Deployment Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Service Type</span>
                <div className="font-medium">PostgreSQL</div>
              </div>
              <div>
                <span className="text-gray-600">Template</span>
                <div className="font-medium">{selectedTemplateData?.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Service Name</span>
                <div className="font-medium">{serviceName || 'Not set'}</div>
              </div>
              <div>
                <span className="text-gray-600">Username</span>
                <div className="font-medium">{postgresUser}</div>
              </div>
              <div>
                <span className="text-gray-600">Password</span>
                <div className="font-medium">{postgresPassword ? '••••••••' : 'Not set'}</div>
              </div>
              <div>
                <span className="text-gray-600">Status</span>
                <div className="font-medium text-green-600">Free Beta</div>
              </div>
              <hr className="my-4" />
              <div>
                <span className="text-gray-600">Cost</span>
                <div className="text-xl font-bold text-green-600">
                  {selectedTemplateData?.price}
                </div>
              </div>
            </div>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !serviceName.trim() || !postgresUser.trim() || !postgresPassword.trim()}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isDeploying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deploying...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Deploy Service
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeployPostgreSQL