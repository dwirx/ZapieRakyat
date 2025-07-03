import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import DockerService from '../services/DockerService.js'

const router = express.Router()
const dockerService = new DockerService()

// Template configurations
const templates = {
  basic: {
    memory: '512m',
    cpus: '0.5',
    ports: { '5678': {} }
  },
  plus: {
    memory: '1g',
    cpus: '1.0',
    ports: { '5678': {} }
  },
  pro: {
    memory: '2g',
    cpus: '2.0',
    ports: { '5678': {} }
  }
}

// Deploy a new service
router.post('/', async (req, res) => {
  try {
    const { serviceName, serviceType, template } = req.body
    const io = req.app.get('io')
    const deploymentId = uuidv4()

    // Emit progress function
    const emitProgress = (step, status = 'info') => {
      io.emit('deployment-progress', {
        deploymentId,
        step,
        status,
        timestamp: new Date().toISOString()
      })
    }

    // Validation
    if (!serviceName || !serviceType || !template) {
      return res.status(400).json({
        error: 'Missing required fields: serviceName, serviceType, template'
      })
    }

    if (!templates[template]) {
      return res.status(400).json({
        error: 'Invalid template. Available templates: basic, plus, pro'
      })
    }

    emitProgress('🚀 Starting deployment process...', 'info')

    // Sanitize service name
    const sanitizedName = serviceName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const containerName = `zapie-${serviceType}-${sanitizedName}-${uuidv4().split('-')[0]}`
    
    emitProgress('🔍 Validating service configuration...', 'info')
    
    // Get template configuration
    const templateConfig = { ...templates[template], name: template }

    let deploymentResult

    if (serviceType === 'n8n') {
      emitProgress('🐳 Creating Docker volume for persistent data...', 'info')
      
      emitProgress('📥 Pulling n8n Docker image (this may take a moment)...', 'info')
      
      deploymentResult = await dockerService.deployN8n(containerName, templateConfig, emitProgress)
      
      emitProgress('🔌 Configuring network and port mappings...', 'info')
      
      emitProgress('✅ n8n service deployed successfully!', 'success')
    } else {
      return res.status(400).json({
        error: 'Unsupported service type. Currently supported: n8n'
      })
    }

    emitProgress('🎉 Deployment completed! Service is ready to use.', 'success')

    res.json({
      success: true,
      deploymentId,
      serviceName: serviceName,
      containerName: containerName,
      serviceType: serviceType,
      template: template,
      url: deploymentResult.url,
      containerId: deploymentResult.containerId,
      message: `Service "${serviceName}" deployed successfully!`
    })

  } catch (error) {
    console.error('Deployment error:', error)
    
    const io = req.app.get('io')
    io.emit('deployment-progress', {
      deploymentId: req.body.deploymentId || 'unknown',
      step: `❌ Deployment failed: ${error.message}`,
      status: 'error',
      timestamp: new Date().toISOString()
    })
    
    res.status(500).json({
      error: 'Deployment failed',
      message: error.message
    })
  }
})

export default router
