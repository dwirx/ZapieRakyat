import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Cpu, HardDrive, Database, Eye, EyeOff, 
  Shield, Zap, CheckCircle, AlertCircle, Clock, 
  Server, Copy, ExternalLink, Star, Sparkles 
} from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { api } from '../config/api'
import { useToast } from '../components/Toast'
import { LoadingSpinner, FullPageLoader } from '../components/Loading'

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
  const [postgresPassword, setPostgresPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [customDatabase, setCustomDatabase] = useState('myapp')
  
  // Enhanced features
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const { success, error, info, ToastContainer } = useToast()

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(postgresPassword))
  }, [postgresPassword])

  // Enhanced template data with more details
  const enhancedTemplates = templates.map(template => ({
    ...template,
    features: template.id === 'basic' ? [
      'PostgreSQL 15+',
      '1 Database',
      'Basic Monitoring',
      'Community Support'
    ] : template.id === 'plus' ? [
      'PostgreSQL 15+',
      'Multiple Databases',
      'Performance Monitoring',
      'Backup Support',
      'SSL Encryption'
    ] : [
      'PostgreSQL 15+',
      'Unlimited Databases',
      'Advanced Monitoring',
      'Automated Backups',
      'SSL + TLS Encryption',
      'High Availability'
    ],
    recommended: template.id === 'plus'
  }))

  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service name is required'
    } else if (!/^[a-zA-Z0-9-_]+$/.test(serviceName)) {
      newErrors.serviceName = 'Service name can only contain letters, numbers, hyphens, and underscores'
    }
    
    if (!postgresUser.trim()) {
      newErrors.postgresUser = 'Username is required'
    }
    
    if (!postgresPassword) {
      newErrors.postgresPassword = 'Password is required'
    } else if (postgresPassword.length < 8) {
      newErrors.postgresPassword = 'Password must be at least 8 characters long'
    }
    
    if (!customDatabase.trim()) {
      newErrors.customDatabase = 'Database name is required'
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(customDatabase)) {
      newErrors.customDatabase = 'Database name must start with a letter and contain only letters, numbers, and underscores'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Generate secure password
  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setPostgresPassword(password)
    success('Secure Password Generated', 'A strong password has been generated for you')
  }

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${api.baseURL}/api/deploy/services/postgresql/templates`)
        if (response.data.success && response.data.service.templates) {
          setTemplates(response.data.service.templates)
        } else {
          // Enhanced fallback templates
          setTemplates([
            {
              id: 'basic',
              name: 'PostgreSQL Basic',
              description: 'Perfect for small applications and development',
              cpu: '0.5 CPU',
              ram: '512 MB RAM',
              storage: '5 GB SSD',
              price: 'Free',
              priceValue: 0,
              connections: '100 connections'
            },
            {
              id: 'plus',
              name: 'PostgreSQL Plus',
              description: 'Great for medium-scale production applications',
              cpu: '1.0 CPU',
              ram: '1 GB RAM',
              storage: '10 GB SSD',
              price: 'Free',
              priceValue: 0,
              connections: '200 connections'
            },
            {
              id: 'pro',
              name: 'PostgreSQL Pro',
              description: 'High performance for enterprise applications',
              cpu: '2.0 CPU',
              ram: '2 GB RAM',
              storage: '20 GB SSD',
              price: 'Free',
              priceValue: 0,
              connections: '500 connections'
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching templates:', error)
        error('Failed to Load Templates', 'Using fallback templates instead')
        // Use enhanced fallback templates (same as above)
        setTemplates([
          {
            id: 'basic',
            name: 'PostgreSQL Basic',
            description: 'Perfect for small applications and development',
            cpu: '0.5 CPU',
            ram: '512 MB RAM',
            storage: '5 GB SSD',
            price: 'Free',
            priceValue: 0,
            connections: '100 connections'
          },
          {
            id: 'plus',
            name: 'PostgreSQL Plus',
            description: 'Great for medium-scale production applications',
            cpu: '1.0 CPU',
            ram: '1 GB RAM',
            storage: '10 GB SSD',
            price: 'Free',
            priceValue: 0,
            connections: '200 connections'
          },
          {
            id: 'pro',
            name: 'PostgreSQL Pro',
            description: 'High performance for enterprise applications',
            cpu: '2.0 CPU',
            ram: '2 GB RAM',
            storage: '20 GB SSD',
            price: 'Free',
            priceValue: 0,
            connections: '500 connections'
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

  // Enhanced deployment function
  const handleDeploy = async () => {
    if (!validateForm()) {
      error('Form Validation Failed', 'Please fix the errors and try again')
      return
    }

    setIsDeploying(true)
    setDeploymentProgress([])
    setCurrentStep('Initializing deployment...')
    
    try {
      // Setup Socket.IO for real-time updates
      const socketConnection = io(api.baseURL)
      setSocket(socketConnection)
      
      socketConnection.on('deployment-progress', (data) => {
        setCurrentStep(data.step)
        setDeploymentProgress(prev => [...prev, data])
      })
      
      // Deploy PostgreSQL with enhanced configuration
      const deployData = {
        serviceName,
        template: selectedTemplate,
        credentials: {
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DB: customDatabase
        }
      }
      
      info('Deployment Started', `Deploying PostgreSQL service "${serviceName}"...`)
      
      const response = await axios.post(`${api.baseURL}/api/deploy/services/postgresql`, deployData)
      
      if (response.data.success) {
        setDeploymentResult({
          ...response.data,
          connectionString: `postgresql://${postgresUser}:${postgresPassword}@localhost:${response.data.port}/${customDatabase}`,
          adminUrl: `http://localhost:8080`, // pgAdmin URL if available
          serviceName,
          username: postgresUser,
          database: customDatabase
        })
        success('Deployment Successful!', `PostgreSQL service "${serviceName}" is now running`)
      } else {
        throw new Error(response.data.message || 'Deployment failed')
      }
    } catch (err) {
      console.error('Deployment error:', err)
      error('Deployment Failed', err.response?.data?.message || err.message || 'Unknown error occurred')
    } finally {
      setIsDeploying(false)
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }

  // Copy to clipboard function
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    success('Copied!', `${label} copied to clipboard`)
  }

  if (loading) {
    return <FullPageLoader message="Loading PostgreSQL Templates..." subMessage="Preparing deployment options" />
  }

  // Enhanced deployment progress UI
  if (isDeploying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <ToastContainer />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl border p-8">
            <div className="text-center mb-8">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
                  <Database className="w-8 h-8 text-blue-600 animate-bounce" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Deploying PostgreSQL
              </h2>
              <p className="text-lg text-gray-600 mb-2">Service: {serviceName}</p>
              <p className="text-blue-600 font-medium">{currentStep}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 max-h-80 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Deployment Progress
              </h3>
              <div className="space-y-3">
                {deploymentProgress.map((item, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border-l-4 ${
                    item.status === 'success' ? 'bg-green-50 border-green-400' :
                    item.status === 'error' ? 'bg-red-50 border-red-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    {item.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : item.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <LoadingSpinner size="sm" color="blue" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        item.status === 'success' ? 'text-green-700' :
                        item.status === 'error' ? 'text-red-700' :
                        'text-blue-700'
                      }`}>{item.step}</p>
                      <p className="text-xs text-gray-500">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
                {deploymentProgress.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>Initializing deployment...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced success page
  if (deploymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <ToastContainer />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl"></div>
                <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-green-800 mb-3">
                PostgreSQL Deployed Successfully! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                Service "{deploymentResult.serviceName}" is now running with persistent data storage
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Connection Details */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Database className="w-6 h-6 mr-2 text-blue-600" />
                  Connection Details
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Host', value: deploymentResult.url?.replace('http://', '').replace(':5432', '') || 'localhost', icon: Server },
                    { label: 'Port', value: '5432', icon: Zap },
                    { label: 'Username', value: postgresUser, icon: Shield },
                    { label: 'Password', value: showPassword ? postgresPassword : '••••••••', icon: Shield, isPassword: true },
                    { label: 'Database', value: customDatabase, icon: Database }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-700">{item.label}:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {item.value}
                        </span>
                        {item.isPassword && (
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(item.value, item.label)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => copyToClipboard(deploymentResult.connectionString, 'Connection String')}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Copy Connection String</span>
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(
                      `psql -h ${deploymentResult.url?.replace('http://', '').replace(':5432', '') || 'localhost'} -p 5432 -U ${postgresUser} -d ${customDatabase}`,
                      'psql Command'
                    )}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">Copy psql Command</span>
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <Link
                    to="/services"
                    className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Manage Services
                  </Link>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Next Steps
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="bg-yellow-200 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium text-yellow-800">Connect Your App</p>
                    <p className="text-yellow-700">Use the connection details to integrate with your application</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-yellow-200 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium text-yellow-800">Create Schema</p>
                    <p className="text-yellow-700">Set up your database tables and relationships</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-yellow-200 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium text-yellow-800">Monitor & Scale</p>
                    <p className="text-yellow-700">Use the services page to monitor performance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedTemplateData = enhancedTemplates.find(t => t.id === selectedTemplate)
  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500'
    if (passwordStrength >= 50) return 'bg-yellow-500'
    if (passwordStrength >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Very Strong'
    if (passwordStrength >= 50) return 'Strong'
    if (passwordStrength >= 25) return 'Moderate'
    return 'Weak'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <ToastContainer />
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
          
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <Database className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Deploy PostgreSQL</h1>
              <p className="text-xl text-blue-100">
                Production-ready PostgreSQL database in minutes - completely FREE during beta!
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-blue-100">Enterprise-grade security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-blue-100">Persistent data storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-blue-100">Real-time monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Configuration */}
          <div className="xl:col-span-2 space-y-8">
            {/* Service Configuration */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Server className="w-6 h-6 mr-3 text-blue-600" />
                Service Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="my-postgresql-db"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.serviceName 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.serviceName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.serviceName}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a unique name for your PostgreSQL service (letters, numbers, hyphens, underscores)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Initial Database Name *
                  </label>
                  <input
                    type="text"
                    value={customDatabase}
                    onChange={(e) => setCustomDatabase(e.target.value)}
                    placeholder="myapp"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.customDatabase 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.customDatabase && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.customDatabase}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Name of the initial database to create (starts with letter, letters/numbers/underscores only)
                  </p>
                </div>
              </div>
            </div>

            {/* Database Credentials */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-green-600" />
                Database Credentials
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={postgresUser}
                    onChange={(e) => setPostgresUser(e.target.value)}
                    placeholder="postgres"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.postgresUser 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.postgresUser && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.postgresUser}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    PostgreSQL superuser username
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Generate Secure Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={postgresPassword}
                      onChange={(e) => setPostgresPassword(e.target.value)}
                      placeholder="Enter a secure password (min 8 characters)"
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.postgresPassword 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {postgresPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Password Strength</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength >= 75 ? 'text-green-600' :
                          passwordStrength >= 50 ? 'text-yellow-600' :
                          passwordStrength >= 25 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {errors.postgresPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.postgresPassword}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Use a strong password with uppercase, lowercase, numbers, and special characters
                  </p>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-2xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Cpu className="w-6 h-6 mr-3 text-purple-600" />
                Choose Template
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {enhancedTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                        : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {template.recommended && (
                      <div className="absolute -top-2 left-4">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          RECOMMENDED
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                        template.id === 'basic' ? 'bg-blue-100 text-blue-600' :
                        template.id === 'plus' ? 'bg-purple-100 text-purple-600' :
                        'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      }`}>
                        {template.id === 'pro' ? <Star className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                      </div>
                      
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Cpu className="w-3 h-3 mr-1" />
                            {template.cpu}
                          </div>
                          <div className="flex items-center">
                            <HardDrive className="w-3 h-3 mr-1" />
                            {template.ram}
                          </div>
                        </div>
                        {template.storage && (
                          <div className="text-xs text-gray-500">
                            Storage: {template.storage}
                          </div>
                        )}
                        {template.connections && (
                          <div className="text-xs text-gray-500">
                            Max: {template.connections}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xl font-bold text-green-600 mb-3">
                        {template.price}
                      </div>
                      
                      <div className="space-y-1">
                        {template.features?.slice(0, 3).map((feature, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deployment Summary Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Deployment Summary
              </h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Type</span>
                  <span className="font-medium flex items-center">
                    <Database className="w-4 h-4 mr-1 text-blue-600" />
                    PostgreSQL 15+
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Template</span>
                  <span className="font-medium capitalize">{selectedTemplateData?.name || 'Not selected'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Name</span>
                  <span className={`font-medium ${serviceName ? 'text-gray-900' : 'text-gray-400'}`}>
                    {serviceName || 'Not set'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Database</span>
                  <span className={`font-medium ${customDatabase ? 'text-gray-900' : 'text-gray-400'}`}>
                    {customDatabase || 'Not set'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Username</span>
                  <span className="font-medium">{postgresUser}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Password</span>
                  <span className={`font-medium ${postgresPassword ? 'text-gray-900' : 'text-gray-400'}`}>
                    {postgresPassword ? '••••••••' : 'Not set'}
                  </span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Resources</span>
                  <div className="text-right">
                    <div className="font-medium">{selectedTemplateData?.cpu}</div>
                    <div className="text-xs text-gray-500">{selectedTemplateData?.ram}</div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Beta - FREE</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Cost</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedTemplateData?.price || 'FREE'}
                    </div>
                    <div className="text-xs text-gray-500">during beta</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !serviceName.trim() || !postgresUser.trim() || !postgresPassword.trim() || !customDatabase.trim()}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                {isDeploying ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Deploying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Deploy PostgreSQL
                  </>
                )}
              </button>
              
              <p className="mt-3 text-xs text-gray-500 text-center">
                ⚡ Deploy in under 2 minutes with persistent data storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeployPostgreSQL