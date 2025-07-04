// ActivePieces Service Definition
export const activepiecesServiceConfig = {
  name: 'activepieces',
  displayName: 'ActivePieces',
  description: 'Open-source business automation platform for building workflows and automating repetitive tasks',
  image: 'activepieces/activepieces:latest',
  defaultPort: 8080,
  internalPort: 80,
  
  // Template configurations
  templates: {
    basic: {
      memory: '512m',
      cpus: '0.5',
      description: 'Standard ActivePieces setup with SQLite database'
    },
    plus: {
      memory: '1g',
      cpus: '1.0',
      description: 'Enhanced setup with more resources'
    },
    pro: {
      memory: '2g',
      cpus: '2.0',
      description: 'Production-ready with PostgreSQL database support'
    }
  },

  // Environment variables
  getEnvironment: (localIP, availablePort, credentials = {}) => [
    'AP_QUEUE_MODE=MEMORY',
    'AP_DB_TYPE=SQLITE3',
    `AP_FRONTEND_URL=http://${localIP}:${availablePort}`,
    'AP_EXECUTION_MODE=UNSANDBOXED',
    'AP_SIGN_UP_ENABLED=true',
    'AP_TELEMETRY_ENABLED=false',
    'AP_ENVIRONMENT=prod'
  ],

  // Volume configuration
  volumeMount: '/root/.activepieces',

  // Deployment success message
  successMessage: 'ActivePieces service deployed successfully!'
}

export default activepiecesServiceConfig
