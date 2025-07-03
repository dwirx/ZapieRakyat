// WAHA Service Definition
export const wahaServiceConfig = {
  name: 'waha',
  displayName: 'WAHA',
  description: 'WhatsApp API - Connect WhatsApp to your applications',
  image: 'devlikeapro/waha:latest',
  defaultPort: 3030, // Start from 3030 to avoid conflicts
  internalPort: 3000,
  
  // Template configurations
  templates: {
    basic: {
      memory: '512m',
      cpus: '0.5',
      description: 'Perfect for Small WhatsApp Integration'
    },
    plus: {
      memory: '1g',
      cpus: '1.0',
      description: 'Great for Medium Scale WhatsApp Bots'
    },
    pro: {
      memory: '2g',
      cpus: '2.0',
      description: 'Best Performance for High Volume WhatsApp API'
    }
  },

  // Environment variables
  getEnvironment: (localIP, availablePort) => [
    'WAHA_PRINT_QR=true',
    'WAHA_LOG_LEVEL=info'
  ],

  // Volume configuration
  volumeMount: '/app/sessions',

  // Deployment success message
  successMessage: 'WAHA service deployed successfully!',

  // Instructions for users
  instructions: [
    'Open the WAHA API URL above',
    'Scan QR code with WhatsApp to connect your account',
    'Use the API endpoints to send/receive WhatsApp messages'
  ]
}

export default wahaServiceConfig
