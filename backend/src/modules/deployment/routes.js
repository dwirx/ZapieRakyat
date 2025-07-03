import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import DockerService from './DockerService.js'
import { serviceRegistry } from '../services/ServiceRegistry.js'

const router = express.Router()
const dockerService = new DockerService()

// Get available services endpoint
router.get('/services', (req, res) => {
  try {
    const services = serviceRegistry.getAllServicesForFrontend()
    res.json({
      success: true,
      services
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get services',
      message: error.message
    })
  }
})

// Get service templates endpoint
router.get('/services/:serviceName/templates', (req, res) => {
  try {
    const { serviceName } = req.params
    const serviceConfig = serviceRegistry.getServiceForFrontend(serviceName)
    
    if (!serviceConfig) {
      return res.status(404).json({
        error: 'Service not found'
      })
    }

    res.json({
      success: true,
      service: serviceConfig
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get service templates',
      message: error.message
    })
  }
})

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

    // Validation using service registry
    if (!serviceRegistry.isValidService(serviceType)) {
      return res.status(400).json({
        error: `Unsupported service type. Available services: ${serviceRegistry.getAllServices().map(s => s.name).join(', ')}`
      })
    }

    if (!serviceRegistry.isValidTemplate(serviceType, template)) {
      return res.status(400).json({
        error: `Invalid template. Available templates for ${serviceType}: basic, plus, pro`
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
    
    // Get template configuration from service registry
    const serviceConfig = serviceRegistry.getService(serviceType)
    const templateConfig = { ...serviceConfig.templates[template], name: template }

    let deploymentResult

    // Use generic deployment method
    emitProgress('🐳 Creating Docker volume for persistent data...', 'info')
    emitProgress('📥 Pulling Docker image (this may take a moment)...', 'info')
    
    deploymentResult = await dockerService.deployService(serviceType, containerName, template)
    
    emitProgress('🔌 Configuring network and port mappings...', 'info')
    emitProgress(`✅ ${serviceConfig.displayName} deployed successfully!`, 'success')

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
