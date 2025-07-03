import { Loader2, Zap, Database, Workflow, Phone } from 'lucide-react'

const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }

  return (
    <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
  )
}

const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
)

const LoadingOverlay = ({ show, children, message = 'Loading...' }) => {
  if (!show) return children

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" color="blue" />
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  )
}

const ServiceLoadingCard = ({ service }) => {
  const icons = {
    postgresql: Database,
    n8n: Workflow,
    waha: Phone,
    default: Zap
  }

  const Icon = icons[service] || icons.default

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border">
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" color="blue" />
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 mx-auto w-24"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse mx-auto w-32"></div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

const FullPageLoader = ({ message = 'Loading ZapieRakyat...', subMessage = 'Preparing your services' }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
    <div className="text-center">
      {/* Logo animation */}
      <div className="mb-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <Zap className="w-10 h-10 text-blue-600 animate-bounce" />
          </div>
        </div>
      </div>
      
      {/* Main message */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
      <p className="text-gray-600 mb-8">{subMessage}</p>
      
      {/* Progress animation */}
      <div className="max-w-xs mx-auto">
        <div className="flex justify-center mb-4">
          <LoadingSpinner size="lg" color="blue" />
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Floating icons */}
      <div className="mt-12 flex justify-center space-x-8">
        <div className="animate-float" style={{ animationDelay: '0s' }}>
          <Database className="w-6 h-6 text-blue-400" />
        </div>
        <div className="animate-float" style={{ animationDelay: '0.5s' }}>
          <Workflow className="w-6 h-6 text-purple-400" />
        </div>
        <div className="animate-float" style={{ animationDelay: '1s' }}>
          <Phone className="w-6 h-6 text-green-400" />
        </div>
      </div>
    </div>
  </div>
)

const InlineLoader = ({ size = 'md', message, className = '' }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    <LoadingSpinner size={size} />
    {message && <span className="text-gray-600">{message}</span>}
  </div>
)

export {
  LoadingSpinner,
  SkeletonCard,
  LoadingOverlay,
  ServiceLoadingCard,
  FullPageLoader,
  InlineLoader
}

export default LoadingSpinner
