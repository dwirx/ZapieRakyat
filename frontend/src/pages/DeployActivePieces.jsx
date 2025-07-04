import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, CheckCircle, AlertCircle, Clock, Zap, Database, Server, Globe, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { api } from '../config/api'
import { useSocket } from '../contexts/SocketContext'

const DeployActivePieces = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('basic')
  const [containerName, setContainerName] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState(null)
  const [error, setError] = useState('')
  const [deploymentProgress, setDeploymentProgress] = useState([])
  const [currentDeploymentId, setCurrentDeploymentId] = useState(null)
  const progressEndRef = useRef(null)
  
  const { socket } = useSocket()

  // Auto-scroll to bottom when new progress is added
  useEffect(() => {
    if (progressEndRef.current) {
      progressEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [deploymentProgress])

  // Listen for deployment progress via Socket.IO
  useEffect(() => {
    if (!socket) return

    const handleDeploymentProgress = (data) => {
      // Only listen to progress for our current deployment
      if (currentDeploymentId && data.deploymentId === currentDeploymentId) {
        setDeploymentProgress(prev => [...prev, {
          id: Date.now(),
          message: data.step,
          status: data.status,
          timestamp: data.timestamp
        }])
      }
    }

    socket.on('deployment-progress', handleDeploymentProgress)

    return () => {
      socket.off('deployment-progress', handleDeploymentProgress)
    }
  }, [socket, currentDeploymentId])

  const templates = {
    basic: {
      name: 'ActivePieces Basic',
      description: 'Standard setup with SQLite database - Perfect for getting started',
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      features: [
        'SQLite Database (No external dependencies)',
        'Memory-based queue system', 
        'Basic workflow automation',
        'Web-based interface',
        'User registration enabled',
        'Lightweight and fast startup'
      ],
      specs: {
        memory: '512MB',
        cpu: '1 Core',
        storage: '2GB',
        database: 'SQLite (Built-in)'
      },
      recommended: 'Small teams, personal use, testing'
    },
    pro: {
      name: 'ActivePieces Pro',
      description: 'Enhanced setup with PostgreSQL and Redis for production use',
      icon: <Server className="w-8 h-8 text-purple-500" />,
      features: [
        'PostgreSQL Database (Scalable)',
        'Redis-based queue system',
        'Advanced workflow automation',
        'Sandboxed execution environment',
        'Enhanced security features',
        'Multi-worker support'
      ],
      specs: {
        memory: '1GB',
        cpu: '2 Cores', 
        storage: '5GB',
        database: 'PostgreSQL + Redis'
      },
      recommended: 'Production use, larger teams, enterprise'
    }
  }

  const handleDeploy = async () => {
    if (!containerName.trim()) {
      setError('Please enter a container name')
      return
    }

    setDeploying(true)
    setError('')
    setDeploymentResult(null)
    setDeploymentProgress([])
    
    // Generate deployment ID for tracking
    const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setCurrentDeploymentId(deploymentId)

    try {
      const response = await axios.post(api.endpoints.deploy, {
        serviceType: 'activepieces',
        serviceName: containerName.trim(),
        template: selectedTemplate,
        deploymentId: deploymentId
      })

      setDeploymentResult(response.data)
    } catch (error) {
      console.error('Deployment failed:', error)
      setError(error.response?.data?.message || 'Deployment failed. Please try again.')
    } finally {
      setDeploying(false)
      setCurrentDeploymentId(null)
    }
  }

  const generateContainerName = () => {
    const timestamp = Date.now().toString().slice(-6)
    setContainerName(`activepieces-${selectedTemplate}-${timestamp}`)
  }

  if (deploymentResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ActivePieces Deployed Successfully! 🎉
            </h2>
            <p className="text-gray-600">Your automation platform is ready to use</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                Access Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">URL:</span>
                  <div className="font-mono text-sm bg-white px-3 py-1 rounded border">
                    <a 
                      href={deploymentResult.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {deploymentResult.url}
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Port:</span>
                  <span className="ml-2 font-mono text-sm">{deploymentResult.port}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-600" />
                Container Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="ml-2 font-mono text-sm">{deploymentResult.containerName}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Template:</span>
                  <span className="ml-2 text-sm capitalize">{deploymentResult.service?.template}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Volume:</span>
                  <span className="ml-2 font-mono text-sm">{deploymentResult.volume}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-yellow-600" />
              Getting Started
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              {deploymentResult.credentials?.notes?.map((note, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={deploymentResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Open ActivePieces
            </a>
            <Link
              to="/services"
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
            >
              View All Services
            </Link>
            <Link
              to="/"
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
            >
              Deploy Another Service
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Categories
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex items-center">
            <Zap className="w-12 h-12 text-white mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-white">Deploy ActivePieces</h1>
              <p className="text-blue-100 mt-2">
                Open-source business automation platform for building workflows and automating tasks
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Template Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Template</h2>
              <div className="space-y-4">
                {Object.entries(templates).map(([key, template]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(key)}
                  >
                    <div className="flex items-start">
                      <div className="mr-4">{template.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="text-xs">
                            <span className="text-gray-500">Memory:</span>
                            <span className="ml-1 font-medium">{template.specs.memory}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">CPU:</span>
                            <span className="ml-1 font-medium">{template.specs.cpu}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Storage:</span>
                            <span className="ml-1 font-medium">{template.specs.storage}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-500">Database:</span>
                            <span className="ml-1 font-medium">{template.specs.database}</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Recommended for:</span> {template.recommended}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={containerName}
                      onChange={(e) => setContainerName(e.target.value)}
                      placeholder="e.g., activepieces-automation"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={generateContainerName}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose a unique name for your ActivePieces container
                  </p>
                </div>

                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Template Features</h3>
                    <div className="space-y-2">
                      {templates[selectedTemplate].features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDeploy}
                  disabled={deploying || !containerName.trim()}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {deploying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Deploying ActivePieces...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Play className="w-5 h-5 mr-2" />
                      <span>Deploy ActivePieces</span>
                    </div>
                  )}
                </button>

                {deploying && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center text-blue-700 mb-3">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">
                        Deployment in progress... This may take a few minutes.
                      </span>
                    </div>
                    
                    {/* Progress Steps */}
                    {deploymentProgress.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto bg-white rounded border p-3">
                        <h4 className="text-sm font-medium text-blue-800 mb-2 sticky top-0 bg-white">
                          📋 Deployment Progress:
                        </h4>
                        {deploymentProgress.map((step) => (
                          <div key={step.id} className="flex items-start space-x-2 text-sm py-1">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              step.status === 'success' ? 'bg-green-500' :
                              step.status === 'error' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-mono text-xs ${
                                step.status === 'success' ? 'text-green-700' :
                                step.status === 'error' ? 'text-red-700' :
                                'text-blue-700'
                              }`}>
                                {step.message}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(step.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Auto-scroll target */}
                        <div ref={progressEndRef} className="animate-pulse flex items-center space-x-2 text-sm text-blue-600 py-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <span className="font-medium">Processing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeployActivePieces
