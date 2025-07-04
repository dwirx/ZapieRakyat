export default {
  name: 'ActivePieces',
  image: 'activepieces/activepieces:latest',
  description: 'ActivePieces - Open source business automation platform for building workflows and automating repetitive tasks',
  category: 'Automation',
  defaultPort: 8080,
  portRange: [8080, 8081, 8082, 8083, 8084], // Alternative ports if default is taken
  
  templates: {
    basic: {
      name: 'ActivePieces Basic',
      description: 'Standard ActivePieces setup with SQLite database',
      image: 'activepieces/activepieces:latest',
      ports: [
        {
          containerPort: 80,
          hostPort: null, // Will be auto-assigned from portRange
          protocol: 'tcp'
        }
      ],
      environment: [
        {
          name: 'AP_QUEUE_MODE',
          value: 'MEMORY'
        },
        {
          name: 'AP_DB_TYPE',
          value: 'SQLITE3'
        },
        {
          name: 'AP_FRONTEND_URL',
          value: null // Will be set dynamically based on assigned port
        },
        {
          name: 'AP_EXECUTION_MODE',
          value: 'UNSANDBOXED'
        },
        {
          name: 'AP_SIGN_UP_ENABLED',
          value: 'true'
        },
        {
          name: 'AP_TELEMETRY_ENABLED',
          value: 'false'
        }
      ],
      volumes: [
        {
          hostPath: 'activepieces_data',
          containerPath: '/root/.activepieces',
          type: 'volume'
        }
      ],
      labels: {
        'zapie.managed': 'true',
        'zapie.service': 'activepieces',
        'zapie.template': 'basic',
        'zapie.category': 'automation'
      },
      restart_policy: 'unless-stopped',
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:80/api/v1/flags'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '60s'
      }
    },
    
    pro: {
      name: 'ActivePieces Pro',
      description: 'ActivePieces with enhanced configuration and PostgreSQL support',
      image: 'activepieces/activepieces:latest',
      ports: [
        {
          containerPort: 80,
          hostPort: null, // Will be auto-assigned from portRange
          protocol: 'tcp'
        }
      ],
      environment: [
        {
          name: 'AP_QUEUE_MODE',
          value: 'REDIS'
        },
        {
          name: 'AP_DB_TYPE',
          value: 'POSTGRES'
        },
        {
          name: 'AP_POSTGRES_DATABASE',
          value: 'activepieces'
        },
        {
          name: 'AP_POSTGRES_HOST',
          value: 'postgres'
        },
        {
          name: 'AP_POSTGRES_PORT',
          value: '5432'
        },
        {
          name: 'AP_POSTGRES_USERNAME',
          value: 'activepieces'
        },
        {
          name: 'AP_POSTGRES_PASSWORD',
          value: 'activepieces123'
        },
        {
          name: 'AP_FRONTEND_URL',
          value: null // Will be set dynamically
        },
        {
          name: 'AP_EXECUTION_MODE',
          value: 'SANDBOXED'
        },
        {
          name: 'AP_SIGN_UP_ENABLED',
          value: 'true'
        },
        {
          name: 'AP_TELEMETRY_ENABLED',
          value: 'false'
        },
        {
          name: 'AP_MAX_WORKERS',
          value: '4'
        }
      ],
      volumes: [
        {
          hostPath: 'activepieces_data',
          containerPath: '/root/.activepieces',
          type: 'volume'
        }
      ],
      labels: {
        'zapie.managed': 'true',
        'zapie.service': 'activepieces',
        'zapie.template': 'pro',
        'zapie.category': 'automation'
      },
      restart_policy: 'unless-stopped',
      depends_on: ['postgres'],
      healthcheck: {
        test: ['CMD', 'curl', '-f', 'http://localhost:80/api/v1/flags'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '90s'
      }
    }
  },

  getDeploymentConfig(template = 'basic', customConfig = {}) {
    const selectedTemplate = this.templates[template]
    if (!selectedTemplate) {
      throw new Error(`Template ${template} not found`)
    }

    return {
      ...selectedTemplate,
      ...customConfig,
      environment: [
        ...selectedTemplate.environment,
        ...(customConfig.environment || [])
      ],
      volumes: [
        ...selectedTemplate.volumes,
        ...(customConfig.volumes || [])
      ]
    }
  },

  validateConfig(config) {
    const required = ['AP_FRONTEND_URL']
    const missing = required.filter(env => 
      !config.environment.find(e => e.name === env && e.value)
    )
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
    
    return true
  },

  getDefaultCredentials() {
    return {
      type: 'web_interface',
      message: 'Access ActivePieces through the web interface. Create your account on first visit.',
      url: 'http://localhost:PORT',
      notes: [
        'First time setup will ask you to create an admin account',
        'ActivePieces is an open-source automation platform',
        'You can create workflows, automations, and integrations',
        'Documentation: https://activepieces.com/docs'
      ]
    }
  }
}
