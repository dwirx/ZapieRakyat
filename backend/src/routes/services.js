import express from 'express'
import DockerService from '../services/DockerService.js'
import HealthMonitoringService from '../services/HealthMonitoringService.js'
import BackupService from '../services/BackupService.js'

const router = express.Router()
const dockerService = new DockerService()
const healthService = new HealthMonitoringService()
const backupService = new BackupService()

// Middleware to pass Socket.IO instance to services
router.use((req, res, next) => {
  const io = req.app.get('io')
  if (io && !healthService.io) {
    healthService.setSocketIO(io)
  }
  next()
})

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
    
    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'stopping',
        status: 'in-progress',
        message: 'Stopping container...',
        timestamp: new Date().toISOString()
      })
    }
    
    await dockerService.stopService(containerId)
    
    // Check final status
    const finalStatus = await dockerService.getServiceDetails(containerId)
    
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'stop',
        status: 'completed',
        message: 'Container stopped successfully',
        finalState: finalStatus,
        timestamp: new Date().toISOString()
      })
    }
    
    res.json({
      success: true,
      message: 'Service stopped successfully',
      service: finalStatus
    })
  } catch (error) {
    console.error('Error stopping service:', error)
    
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId: req.params.containerId,
        action: 'stop',
        status: 'failed',
        message: `Failed to stop: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    }
    
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
    
    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'starting',
        status: 'in-progress',
        message: 'Starting container...',
        timestamp: new Date().toISOString()
      })
    }
    
    await dockerService.startService(containerId)
    
    // Wait a moment for container to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check final status
    const finalStatus = await dockerService.getServiceDetails(containerId)
    
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'start',
        status: 'completed',
        message: 'Container started successfully',
        finalState: finalStatus,
        timestamp: new Date().toISOString()
      })
    }
    
    res.json({
      success: true,
      message: 'Service started successfully',
      service: finalStatus
    })
  } catch (error) {
    console.error('Error starting service:', error)
    
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId: req.params.containerId,
        action: 'start',
        status: 'failed',
        message: `Failed to start: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    }
    
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
    
    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'restarting',
        status: 'in-progress',
        message: 'Restarting container...',
        timestamp: new Date().toISOString()
      })
    }
    
    await dockerService.restartService(containerId)
    
    // Wait a moment for container to initialize after restart
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check final status
    const finalStatus = await dockerService.getServiceDetails(containerId)
    
    if (io) {
      io.emit('service-action', {
        containerId,
        action: 'restart',
        status: 'completed',
        message: 'Container restarted successfully',
        finalState: finalStatus,
        timestamp: new Date().toISOString()
      })
    }
    
    res.json({
      success: true,
      message: 'Service restarted successfully',
      service: finalStatus
    })
  } catch (error) {
    console.error('Error restarting service:', error)
    
    const io = req.app.get('io')
    if (io) {
      io.emit('service-action', {
        containerId: req.params.containerId,
        action: 'restart',
        status: 'failed',
        message: `Failed to restart: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    }
    
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

// Health monitoring endpoints
router.get('/:containerId/health', async (req, res) => {
  try {
    const { containerId } = req.params
    const health = await healthService.getServiceHealth(containerId)
    
    res.json({
      success: true,
      health: health
    })
  } catch (error) {
    console.error('Error getting service health:', error)
    res.status(500).json({
      error: 'Failed to get service health',
      message: error.message
    })
  }
})

router.get('/:containerId/metrics', async (req, res) => {
  try {
    const { containerId } = req.params
    const { timeRange } = req.query
    const metrics = await healthService.getServiceMetrics(containerId, timeRange)
    
    res.json({
      success: true,
      metrics: metrics
    })
  } catch (error) {
    console.error('Error getting service metrics:', error)
    res.status(500).json({
      error: 'Failed to get service metrics',
      message: error.message
    })
  }
})

router.get('/health/all', async (req, res) => {
  try {
    const allHealth = await healthService.getAllServicesHealth()
    
    res.json({
      success: true,
      services: allHealth
    })
  } catch (error) {
    console.error('Error getting all services health:', error)
    res.status(500).json({
      error: 'Failed to get all services health',
      message: error.message
    })
  }
})

// Backup endpoints
router.get('/:containerId/backups', async (req, res) => {
  try {
    const { containerId } = req.params
    const backups = await backupService.getBackups(containerId)
    
    res.json({
      success: true,
      backups: backups
    })
  } catch (error) {
    console.error('Error getting backups:', error)
    res.status(500).json({
      error: 'Failed to get backups',
      message: error.message
    })
  }
})

router.post('/:containerId/backups', async (req, res) => {
  try {
    const { containerId } = req.params
    const { name, description } = req.body
    
    if (!name) {
      return res.status(400).json({
        error: 'Backup name is required'
      })
    }
    
    const backup = await backupService.createBackup(containerId, name, description)
    
    res.json({
      success: true,
      backup: backup
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    res.status(500).json({
      error: 'Failed to create backup',
      message: error.message
    })
  }
})

router.post('/:containerId/backups/:backupId/restore', async (req, res) => {
  try {
    const { containerId, backupId } = req.params
    const result = await backupService.restoreBackup(containerId, backupId)
    
    res.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    res.status(500).json({
      error: 'Failed to restore backup',
      message: error.message
    })
  }
})

router.get('/:containerId/backups/:backupId/download', async (req, res) => {
  try {
    const { containerId, backupId } = req.params
    const downloadInfo = await backupService.downloadBackup(containerId, backupId)
    
    res.download(downloadInfo.filePath, downloadInfo.filename, (err) => {
      if (err) {
        console.error('Error downloading backup:', err)
        res.status(500).json({
          error: 'Failed to download backup',
          message: err.message
        })
      }
    })
  } catch (error) {
    console.error('Error preparing backup download:', error)
    res.status(500).json({
      error: 'Failed to prepare backup download',
      message: error.message
    })
  }
})

router.delete('/:containerId/backups/:backupId', async (req, res) => {
  try {
    const { containerId, backupId } = req.params
    await backupService.deleteBackup(containerId, backupId)
    
    res.json({
      success: true,
      message: 'Backup deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting backup:', error)
    res.status(500).json({
      error: 'Failed to delete backup',
      message: error.message
    })
  }
})

router.get('/:containerId/storage', async (req, res) => {
  try {
    const { containerId } = req.params
    const storage = await backupService.getStorageUsage(containerId)
    
    res.json({
      success: true,
      storage: storage
    })
  } catch (error) {
    console.error('Error getting storage usage:', error)
    res.status(500).json({
      error: 'Failed to get storage usage',
      message: error.message
    })
  }
})

// Bulk operations endpoint
router.post('/bulk/:operation', async (req, res) => {
  try {
    const { operation } = req.params
    const { serviceIds } = req.body
    
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        error: 'Service IDs array is required'
      })
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    for (const serviceId of serviceIds) {
      try {
        switch (operation) {
          case 'start':
            await dockerService.startService(serviceId)
            break
          case 'stop':
            await dockerService.stopService(serviceId)
            break
          case 'restart':
            await dockerService.restartService(serviceId)
            break
          case 'delete':
            await dockerService.removeService(serviceId)
            break
          case 'backup':
            const backupName = `bulk-backup-${new Date().toISOString().split('T')[0]}`
            await backupService.createBackup(serviceId, backupName, 'Bulk operation backup')
            break
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }
        
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          serviceId: serviceId,
          error: error.message
        })
      }
    }
    
    res.json({
      success: true,
      operation: operation,
      results: results
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    res.status(500).json({
      error: 'Failed to perform bulk operation',
      message: error.message
    })
  }
})

// Monitoring management endpoints
router.post('/:containerId/monitoring/start', async (req, res) => {
  try {
    const { containerId } = req.params
    const { interval = 30000 } = req.body
    
    healthService.startMonitoring(containerId, interval)
    
    res.json({
      success: true,
      message: 'Monitoring started',
      interval: interval
    })
  } catch (error) {
    console.error('Error starting monitoring:', error)
    res.status(500).json({
      error: 'Failed to start monitoring',
      message: error.message
    })
  }
})

router.post('/:containerId/monitoring/stop', async (req, res) => {
  try {
    const { containerId } = req.params
    
    healthService.stopMonitoring(containerId)
    
    res.json({
      success: true,
      message: 'Monitoring stopped'
    })
  } catch (error) {
    console.error('Error stopping monitoring:', error)
    res.status(500).json({
      error: 'Failed to stop monitoring',
      message: error.message
    })
  }
})

router.get('/monitoring/status', async (req, res) => {
  try {
    const monitoringStatus = healthService.getMonitoringStatus()
    
    res.json({
      success: true,
      monitoring: monitoringStatus
    })
  } catch (error) {
    console.error('Error getting monitoring status:', error)
    res.status(500).json({
      error: 'Failed to get monitoring status',
      message: error.message
    })
  }
})

// System metrics endpoint
router.get('/system/metrics', async (req, res) => {
  try {
    const systemMetrics = await healthService.getSystemMetrics()
    
    res.json({
      success: true,
      system: systemMetrics
    })
  } catch (error) {
    console.error('Error getting system metrics:', error)
    res.status(500).json({
      error: 'Failed to get system metrics',
      message: error.message
    })
  }
})

export default router
