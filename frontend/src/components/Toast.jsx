import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

const Toast = ({ id, type, title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Slide in animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(dismissTimer)
    }
  }, [id, duration, onClose])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 300)
  }

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 border-green-200',
      iconColor: 'text-green-500',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 border-red-200',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const config = typeConfig[type] || typeConfig.info
  const Icon = config.icon

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <div className={`
        max-w-sm w-full ${config.bgColor} border rounded-lg shadow-lg overflow-hidden
        backdrop-blur-sm hover:shadow-xl transition-shadow duration-200
      `}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1">
              {title && (
                <p className={`text-sm font-semibold ${config.titleColor} mb-1`}>
                  {title}
                </p>
              )}
              <p className={`text-sm ${config.messageColor}`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className={`
                  inline-flex rounded-md p-1.5 ${config.iconColor} 
                  hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  transition-colors duration-200
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/30">
          <div 
            className={`h-full bg-current ${config.iconColor} transition-all duration-300 ease-linear`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = (type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, type, title, message, duration }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const removeAllToasts = () => {
    setToasts([])
  }

  // Convenience methods
  const success = (title, message, duration) => addToast('success', title, message, duration)
  const error = (title, message, duration) => addToast('error', title, message, duration)
  const warning = (title, message, duration) => addToast('warning', title, message, duration)
  const info = (title, message, duration) => addToast('info', title, message, duration)

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onRemove={removeToast} />
  }
}

export default Toast
