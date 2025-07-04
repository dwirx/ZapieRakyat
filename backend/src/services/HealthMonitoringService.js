import Docker from 'dockerode'
import os from 'os'

class HealthMonitoringService {
  constructor(io = null) {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
    this.healthHistory = new Map()
    this.monitoringIntervals = new Map()
    this.io = io // Socket.IO instance for real-time updates
  }

  setSocketIO(io) {
    this.io = io
  }

  emitHealthUpdate(containerId, healthData) {
    if (this.io) {
      this.io.emit('health-update', {
        containerId,
        health: healthData,
        timestamp: new Date().toISOString()
      })
    }
  }

  emitMetricsUpdate(containerId, metricsData) {
    if (this.io) {
      this.io.emit('metrics-update', {
        containerId,
        metrics: metricsData,
        timestamp: new Date().toISOString()
      })
    }
  }

  emitHealthAlert(containerId, alertType, message, severity = 'warning') {
    if (this.io) {
      this.io.emit('health-alert', {
        containerId,
        type: alertType,
        message,
        severity,
        timestamp: new Date().toISOString()
      })
    }
  }

  async getServiceHealth(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      const containerInfo = await container.inspect()
      
      const health = {
        status: containerInfo.State.Running ? 'up' : 'down',
        lastCheck: new Date(),
        uptime: containerInfo.State.StartedAt,
        restartCount: containerInfo.RestartCount,
        exitCode: containerInfo.State.ExitCode,
        pid: containerInfo.State.Pid,
        // Add more container state info
        startedAt: containerInfo.State.StartedAt,
        finishedAt: containerInfo.State.FinishedAt,
        running: containerInfo.State.Running,
        paused: containerInfo.State.Paused,
        restarting: containerInfo.State.Restarting,
        oomKilled: containerInfo.State.OOMKilled,
        dead: containerInfo.State.Dead
      }

      // Get metrics if container is running
      if (containerInfo.State.Running) {
        try {
          const stats = await container.stats({ stream: false })
          health.metrics = this.calculateMetrics(stats)
        } catch (err) {
          console.warn(`Failed to get stats for container ${containerId}:`, err.message)
        }
      } else {
        // For stopped containers, provide basic info
        health.metrics = {
          cpu: { percentage: 0, cores: 0 },
          memory: { usage: 0, limit: 0, percentage: 0 },
          network: { rxBytes: 0, txBytes: 0, totalBytes: 0 },
          disk: { readBytes: 0, writeBytes: 0, totalBytes: 0 }
        }
      }

      return health
    } catch (error) {
      console.error(`Health check failed for container ${containerId}:`, error.message)
      return {
        status: 'unreachable',
        lastCheck: new Date(),
        error: error.message,
        running: false,
        metrics: {
          cpu: { percentage: 0, cores: 0 },
          memory: { usage: 0, limit: 0, percentage: 0 },
          network: { rxBytes: 0, txBytes: 0, totalBytes: 0 },
          disk: { readBytes: 0, writeBytes: 0, totalBytes: 0 }
        }
      }
    }
  }

  calculateMetrics(stats) {
    const metrics = {}

    // CPU Usage
    if (stats.cpu_stats && stats.precpu_stats) {
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
      const numCpus = stats.cpu_stats.online_cpus || os.cpus().length
      
      if (systemDelta > 0 && cpuDelta > 0) {
        metrics.cpu = {
          percentage: (cpuDelta / systemDelta) * numCpus * 100,
          cores: numCpus
        }
      }
    }

    // Memory Usage
    if (stats.memory_stats) {
      const memoryUsage = stats.memory_stats.usage || 0
      const memoryLimit = stats.memory_stats.limit || 0
      
      metrics.memory = {
        usage: memoryUsage,
        limit: memoryLimit,
        percentage: memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0,
        usageBytes: memoryUsage,
        limitBytes: memoryLimit
      }
    }

    // Network I/O
    if (stats.networks) {
      let totalRx = 0
      let totalTx = 0
      
      Object.values(stats.networks).forEach(network => {
        totalRx += network.rx_bytes || 0
        totalTx += network.tx_bytes || 0
      })
      
      metrics.network = {
        rxBytes: totalRx,
        txBytes: totalTx,
        totalBytes: totalRx + totalTx
      }
    }

    // Disk I/O
    if (stats.blkio_stats && stats.blkio_stats.io_service_bytes_recursive) {
      let totalRead = 0
      let totalWrite = 0
      
      stats.blkio_stats.io_service_bytes_recursive.forEach(stat => {
        if (stat.op === 'Read') totalRead += stat.value
        if (stat.op === 'Write') totalWrite += stat.value
      })
      
      metrics.disk = {
        readBytes: totalRead,
        writeBytes: totalWrite,
        totalBytes: totalRead + totalWrite
      }
    }

    return metrics
  }

  async getServiceMetrics(containerId, timeRange = '1h') {
    try {
      const currentHealth = await this.getServiceHealth(containerId)
      const historical = this.getHistoricalData(containerId, timeRange)
      
      return {
        current: currentHealth.metrics || {},
        historical: historical,
        status: currentHealth.status,
        lastCheck: currentHealth.lastCheck
      }
    } catch (error) {
      console.error(`Failed to get metrics for container ${containerId}:`, error.message)
      return {
        current: {},
        historical: [],
        status: 'error',
        error: error.message
      }
    }
  }

  getHistoricalData(containerId, timeRange) {
    const history = this.healthHistory.get(containerId) || []
    const now = new Date()
    let cutoffTime
    
    switch (timeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000)
    }
    
    return history.filter(entry => new Date(entry.timestamp) >= cutoffTime)
  }

  startMonitoring(containerId, interval = 30000) {
    // Stop existing monitoring if any
    this.stopMonitoring(containerId)
    
    const monitoringInterval = setInterval(async () => {
      try {
        const health = await this.getServiceHealth(containerId)
        
        // Store in history
        const history = this.healthHistory.get(containerId) || []
        const newEntry = {
          timestamp: new Date().toISOString(),
          ...health.metrics,
          status: health.status
        }
        
        // Keep only last 1000 entries per container
        history.push(newEntry)
        if (history.length > 1000) {
          history.shift()
        }
        
        this.healthHistory.set(containerId, history)
        
        // Emit real-time updates
        this.emitHealthUpdate(containerId, health)
        if (health.metrics) {
          this.emitMetricsUpdate(containerId, health.metrics)
        }
        
        // Check for alerts
        this.checkHealthAlerts(containerId, health)
        
      } catch (error) {
        console.error(`Monitoring error for container ${containerId}:`, error.message)
        this.emitHealthAlert(containerId, 'monitoring_error', `Monitoring error: ${error.message}`, 'error')
      }
    }, interval)
    
    this.monitoringIntervals.set(containerId, monitoringInterval)
    console.log(`Started monitoring container ${containerId} with ${interval}ms interval`)
  }

  stopMonitoring(containerId) {
    const interval = this.monitoringIntervals.get(containerId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(containerId)
      console.log(`Stopped monitoring container ${containerId}`)
    }
  }

  getSystemMetrics() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsagePercentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
      timestamp: new Date().toISOString()
    }
  }

  async getAllServicesHealth() {
    try {
      // Get ALL containers (running and stopped) with zapie.managed label
      const containers = await this.docker.listContainers({ 
        all: true, // This includes stopped containers
        filters: {
          label: ['zapie.managed=true']
        }
      })
      
      const healthPromises = containers.map(async (container) => {
        const health = await this.getServiceHealth(container.Id)
        return {
          id: container.Id,
          name: container.Names[0].replace('/', ''),
          image: container.Image,
          created: container.Created,
          state: container.State,
          status: container.Status,
          health: health,
          // Add container info for better tracking
          labels: container.Labels || {},
          ports: container.Ports || []
        }
      })
      
      const results = await Promise.all(healthPromises)
      
      // Sort by creation time (newest first) and then by name
      results.sort((a, b) => {
        if (a.created !== b.created) {
          return b.created - a.created
        }
        return a.name.localeCompare(b.name)
      })
      
      return results
    } catch (error) {
      console.error('Failed to get all services health:', error.message)
      return []
    }
  }

  checkHealthAlerts(containerId, health) {
    if (!health.metrics) return

    const { cpu, memory } = health.metrics

    // CPU Alert
    if (cpu && cpu.percentage > 80) {
      this.emitHealthAlert(containerId, 'high_cpu', `High CPU usage: ${cpu.percentage.toFixed(1)}%`, 'warning')
    } else if (cpu && cpu.percentage > 95) {
      this.emitHealthAlert(containerId, 'critical_cpu', `Critical CPU usage: ${cpu.percentage.toFixed(1)}%`, 'critical')
    }

    // Memory Alert
    if (memory && memory.percentage > 80) {
      this.emitHealthAlert(containerId, 'high_memory', `High memory usage: ${memory.percentage.toFixed(1)}%`, 'warning')
    } else if (memory && memory.percentage > 95) {
      this.emitHealthAlert(containerId, 'critical_memory', `Critical memory usage: ${memory.percentage.toFixed(1)}%`, 'critical')
    }

    // Container Status Alert
    if (health.status === 'down') {
      this.emitHealthAlert(containerId, 'container_down', 'Container is not running', 'critical')
    } else if (health.status === 'unreachable') {
      this.emitHealthAlert(containerId, 'container_unreachable', 'Container is unreachable', 'error')
    }

    // High restart count alert
    if (health.restartCount > 5) {
      this.emitHealthAlert(containerId, 'high_restarts', `Container has restarted ${health.restartCount} times`, 'warning')
    }
  }

  cleanup() {
    // Stop all monitoring intervals
    this.monitoringIntervals.forEach((interval, containerId) => {
      clearInterval(interval)
      console.log(`Cleaned up monitoring for container ${containerId}`)
    })
    this.monitoringIntervals.clear()
    this.healthHistory.clear()
  }

  getMonitoringStatus() {
    const status = {}
    
    for (const [containerId, interval] of this.monitoringIntervals) {
      status[containerId] = {
        isMonitoring: true,
        interval: interval._repeat || 30000, // Default interval
        historyCount: this.healthHistory.get(containerId)?.length || 0
      }
    }
    
    return status
  }
}

export default HealthMonitoringService