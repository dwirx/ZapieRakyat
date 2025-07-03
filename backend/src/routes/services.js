import express from 'express'
import DockerService from '../services/DockerService.js'

const router = express.Router()
const dockerService = new DockerService()

// Get all running services
router.get('/', async (req, res) => {
  try {
    const services = await dockerService.listServices()
    res.json({
      success: true,
      services: services
    })
  } catch (error) {
    console.error('Error listing services:', error)
    res.status(500).json({
      error: 'Failed to list services',
      message: error.message
    })
  }
})

// Get specific service details
router.get('/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params
    const service = await dockerService.getServiceDetails(containerId)
    
    if (!service) {
      return res.status(404).json({
        error: 'Service not found'
      })
    }

    res.json({
      success: true,
      service: service
    })
  } catch (error) {
    console.error('Error getting service details:', error)
    res.status(500).json({
      error: 'Failed to get service details',
      message: error.message
    })
  }
})

// Stop a service
router.post('/:containerId/stop', async (req, res) => {
  try {
    const { containerId } = req.params
    await dockerService.stopService(containerId)
    
    res.json({
      success: true,
      message: 'Service stopped successfully'
    })
  } catch (error) {
    console.error('Error stopping service:', error)
    res.status(500).json({
      error: 'Failed to stop service',
      message: error.message
    })
  }
})

// Start/restart a service
router.post('/:containerId/start', async (req, res) => {
  try {
    const { containerId } = req.params
    await dockerService.startService(containerId)
    
    res.json({
      success: true,
      message: 'Service started successfully'
    })
  } catch (error) {
    console.error('Error starting service:', error)
    res.status(500).json({
      error: 'Failed to start service',
      message: error.message
    })
  }
})

// Restart a service
router.post('/:containerId/restart', async (req, res) => {
  try {
    const { containerId } = req.params
    await dockerService.restartService(containerId)
    
    res.json({
      success: true,
      message: 'Service restarted successfully'
    })
  } catch (error) {
    console.error('Error restarting service:', error)
    res.status(500).json({
      error: 'Failed to restart service',
      message: error.message
    })
  }
})

// Get service logs
router.get('/:containerId/logs', async (req, res) => {
  try {
    const { containerId } = req.params
    const logs = await dockerService.getServiceLogs(containerId)
    
    res.json({
      success: true,
      logs: logs
    })
  } catch (error) {
    console.error('Error getting service logs:', error)
    res.status(500).json({
      error: 'Failed to get service logs',
      message: error.message
    })
  }
})

// Remove a service
router.delete('/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params
    const { keepData } = req.query // ?keepData=true to keep volume
    
    const result = await dockerService.removeService(containerId, keepData === 'true')
    
    res.json({
      success: true,
      message: result.message,
      volumeRemoved: result.volumeRemoved
    })
  } catch (error) {
    console.error('Error removing service:', error)
    res.status(500).json({
      error: 'Failed to remove service',
      message: error.message
    })
  }
})

export default router
