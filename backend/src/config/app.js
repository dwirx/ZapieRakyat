// Application Configuration
export const appConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : [
            'http://localhost:3000', 
            'http://127.0.0.1:3000', 
            'http://localhost:5173', 
            'http://127.0.0.1:5173',
            /^http:\/\/192\.168\.\d+\.\d+:3000$/,
            /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
            /^http:\/\/172\.\d+\.\d+\.\d+:3000$/,
            /^http:\/\/192\.168\.\d+\.\d+:5173$/,
            /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
            /^http:\/\/172\.\d+\.\d+\.\d+:5173$/
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },

  // Docker Configuration
  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    pullTimeout: 300000, // 5 minutes
    startupTimeout: 60000 // 1 minute
  },

  // Deployment Configuration
  deployment: {
    defaultPortRange: {
      start: 3000,
      end: 9999
    },
    systemPorts: [3000, 3001, 5000, 5173, 8000, 8080, 9000, 9443],
    volumePrefix: 'zapie',
    labelPrefix: 'zapie'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: false
  }
}

export default appConfig
