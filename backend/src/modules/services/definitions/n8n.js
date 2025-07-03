// N8N Service Definition
export const n8nServiceConfig = {
  name: 'n8n',
  displayName: 'n8n',
  description: 'Workflow automation platform',
  image: 'docker.n8n.io/n8nio/n8n:latest',
  defaultPort: 5678,
  internalPort: 5678,
  
  // Template configurations
  templates: {
    basic: {
      memory: '512m',
      cpus: '0.5',
      description: 'Perfect for Small and Simple Tasks'
    },
    plus: {
      memory: '1g',
      cpus: '1.0',
      description: 'Great for Building Chatbot and AI Agent'
    },
    pro: {
      memory: '2g',
      cpus: '2.0',
      description: 'Best Performance for Complex Automations'
    }
  },

  // Environment variables
  getEnvironment: (localIP, availablePort) => [
    'N8N_HOST=0.0.0.0',
    'N8N_PORT=5678',
    'N8N_PROTOCOL=http',
    `WEBHOOK_URL=http://${localIP}:${availablePort}`,
    'GENERIC_TIMEZONE=Asia/Jakarta',
    'N8N_SECURE_COOKIE=false',
    'N8N_ENCRYPTION_KEY=n8n-default-encryption-key-change-me',
    'N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false',
    'DB_TYPE=sqlite',
    'DB_SQLITE_DATABASE=/home/node/.n8n/database.sqlite'
  ],

  // Volume configuration
  volumeMount: '/home/node/.n8n',

  // Deployment success message
  successMessage: 'n8n service deployed successfully!'
}

export default n8nServiceConfig
