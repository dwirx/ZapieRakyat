import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Cpu, HardDrive, Phone } from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { api } from '../config/api'

const DeployWaha = () => {
  const [serviceName, setServiceName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('basic')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState(null)
  const [deploymentProgress, setDeploymentProgress] = useState([])
  const [currentStep, setCurrentStep] = useState('')
  const [socket, setSocket] = useState(null)

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/deploy/services/waha/templates`)
        if (response.data.success && response.data.service.templates) {
          setTemplates(response.data.service.templates)
        } else {
          // Fallback templates
          setTemplates([
            {
              id: 'basic',
              name: 'WAHA Basic',
              description: 'Perfect for Small WhatsApp Integration',
              cpu: '0.5 CPU',
              ram: '512 MB RAM',
              price: 'Free',
              priceValue: 0
            },
            {
              id: 'plus',
              name: 'WAHA Plus',
              description: 'Great for Medium Scale WhatsApp Bots',
              cpu: '1.0 CPU',
              ram: '1 GB RAM',
              price: 'Free',
              priceValue: 0
            },
            {
              id: 'pro',
              name: 'WAHA Pro',
              description: 'Best Performance for High Volume WhatsApp API',
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
            name: 'WAHA Basic',
            description: 'Perfect for Small WhatsApp Integration',
            cpu: '0.5 CPU',
            ram: '512 MB RAM',
            price: 'Free',
            priceValue: 0
          },
          {
            id: 'plus',
            name: 'WAHA Plus',
            description: 'Great for Medium Scale WhatsApp Bots',
            cpu: '1.0 CPU',
            ram: '1 GB RAM',
            price: 'Free',
            priceValue: 0
          },
          {
            id: 'pro',
            name: 'WAHA Pro',
            description: 'Best Performance for High Volume WhatsApp API',
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

    setIsDeploying(true)
    setDeploymentProgress([])
    setDeploymentResult(null)
    setCurrentStep('Starting deployment...')
    
    try {
      const response = await axios.post(api.endpoints.deploy, {
        serviceName: serviceName.trim(),
        serviceType: 'waha',
        template: selectedTemplate
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Deploying {serviceName}...
            </h2>
            <p className="text-green-700">
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
            <Phone className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Deployment Successful!
          </h2>
          <p className="text-green-700 mb-6">
            Your WAHA service "{deploymentResult.serviceName}" is now running with persistent session storage
          </p>
          <div className="bg-white rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your WAHA API URL:</p>
            <a
              href={deploymentResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium break-all"
            >
              {deploymentResult.url}
            </a>
            <p className="text-xs text-gray-500 mt-2">
              📁 Sessions are stored in volume: {deploymentResult.containerName}_data
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <p className="font-medium">Next Steps:</p>
              <p>1. Open the WAHA API URL above</p>
              <p>2. Scan QR code with WhatsApp to connect your account</p>
              <p>3. Use the API endpoints to send/receive WhatsApp messages</p>
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
              <Phone className="w-4 h-4 mr-2" />
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
        <h1 className="text-3xl font-bold text-gray-900">Deploy WAHA</h1>
        <p className="text-gray-600">Deploy WhatsApp API in one click - Connect WhatsApp to your applications - FREE during beta!</p>
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
                placeholder="Enter your service name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Choose Template */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Choose Template
            </h2>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedTemplate === template.id && (
                          <div className="w-full h-full rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                </div>
              ))}
            </div>
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
                <div className="font-medium">WAHA (WhatsApp API)</div>
              </div>
              <div>
                <span className="text-gray-600">Template</span>
                <div className="font-medium">{selectedTemplateData?.name}</div>
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
              disabled={isDeploying || !serviceName.trim()}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isDeploying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deploying...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
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

export default DeployWaha
