import Docker from 'dockerode'
import os from 'os'
import serviceRegistry from './ServiceRegistry.js'

class DockerService {
  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
  }

  // Get local network IP address
  getLocalIP() {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          // Prefer addresses in common private IP ranges
          if (iface.address.startsWith('192.168.') || 
              iface.address.startsWith('10.') || 
              iface.address.startsWith('172.')) {
            return iface.address
          }
        }
      }
    }
    return 'localhost' // fallback
  }

  async deployN8n(containerName, templateConfig) {
    try {
      // Create volume for persistent data
      const volumeName = `${containerName}_data`
      
      try {
        await this.docker.createVolume({ Name: volumeName })
        console.log(`✅ Created volume: ${volumeName}`)
      } catch (error) {
        if (error.statusCode === 409) {
          console.log(`📁 Volume ${volumeName} already exists`)
        } else {
          throw error
        }
      }

      // Find an available port starting from 5678
      const availablePort = await this.findAvailablePort(5678)
      
      const createOptions = {
        Image: 'docker.n8n.io/n8nio/n8n:latest',
        name: containerName,
        Env: [
          'N8N_HOST=0.0.0.0',
          'N8N_PORT=5678',
          'N8N_PROTOCOL=http',
          `WEBHOOK_URL=http://${this.getLocalIP()}:${availablePort}`,
          'GENERIC_TIMEZONE=Asia/Jakarta',
          'N8N_SECURE_COOKIE=false',
          'N8N_ENCRYPTION_KEY=n8n-default-encryption-key-change-me',
          'N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false',
          'DB_TYPE=sqlite',
          'DB_SQLITE_DATABASE=/home/node/.n8n/database.sqlite'
        ],
        ExposedPorts: {
          '5678/tcp': {}
        },
        HostConfig: {
          PortBindings: {
            '5678/tcp': [{ HostPort: availablePort.toString() }]
          },
          Binds: [
            `${volumeName}:/home/node/.n8n`
          ],
          Memory: this.parseMemory(templateConfig.memory),
          CpuQuota: Math.floor(parseFloat(templateConfig.cpus) * 100000),
          CpuPeriod: 100000,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
          // Removed AutoRemove to make it persistent
        },
        Labels: {
          'zapie.service': 'n8n',
          'zapie.managed': 'true',
          'zapie.volume': volumeName,
          'zapie.template': templateConfig.name || 'basic',
          'zapie.created': new Date().toISOString()
        }
      }

      // Pull the image if it doesn't exist
      await this.pullImageIfNotExists('docker.n8n.io/n8nio/n8n:latest')

      // Create and start the container (persistent, no --rm)
      const container = await this.docker.createContainer(createOptions)
      await container.start()

      const containerInfo = await container.inspect()
      
      return {
        containerId: containerInfo.Id,
        containerName: containerName,
        url: `http://${this.getLocalIP()}:${availablePort}`,
        port: availablePort,
        volume: volumeName,
        template: templateConfig.name || 'basic',
        status: 'running'
      }

    } catch (error) {
      console.error('Error deploying n8n:', error)
      throw new Error(`Failed to deploy n8n: ${error.message}`)
    }
  }

  async pullImageIfNotExists(imageName) {
    try {
      await this.docker.getImage(imageName).inspect()
      console.log(`Image ${imageName} already exists`)
    } catch (error) {
      console.log(`Pulling image ${imageName}...`)
      await new Promise((resolve, reject) => {
        this.docker.pull(imageName, (err, stream) => {
          if (err) return reject(err)
          
          this.docker.modem.followProgress(stream, (err, res) => {
            if (err) return reject(err)
            console.log(`Successfully pulled ${imageName}`)
            resolve(res)
          })
        })
      })
    }
  }

  async findAvailablePort(startPort = 5678) {
    const containers = await this.docker.listContainers()
    const usedPorts = new Set()

    // Get all used ports
    containers.forEach(container => {
      if (container.Ports) {
        container.Ports.forEach(port => {
          if (port.PublicPort) {
            usedPorts.add(port.PublicPort)
          }
        })
      }
    })

    // Find the first available port
    let port = startPort
    while (usedPorts.has(port)) {
      port++
    }

    return port
  }

  parseMemory(memoryString) {
    const value = parseFloat(memoryString)
    const unit = memoryString.replace(/[0-9.]/g, '').toLowerCase()
    
    switch (unit) {
      case 'm':
      case 'mb':
        return value * 1024 * 1024
      case 'g':
      case 'gb':
        return value * 1024 * 1024 * 1024
      default:
        return value
    }
  }

  async listServices() {
    try {
      // Get ALL containers (running and stopped) with zapie.managed label
      const containers = await this.docker.listContainers({
        all: true, // Include stopped containers
        filters: {
          label: ['zapie.managed=true']
        }
      })

      return containers.map(container => {
        const port = container.Ports.find(p => p.PublicPort)?.PublicPort
        return {
          id: container.Id,
          name: container.Names[0].replace('/', ''),
          image: container.Image,
          status: container.Status,
          state: container.State, // Add state for better tracking
          created: container.Created,
          ports: container.Ports,
          url: port ? `http://${this.getLocalIP()}:${port}` : null,
          labels: container.Labels,
          // Add more detailed status info
          isRunning: container.State === 'running',
          canStart: container.State === 'exited' || container.State === 'created',
          canStop: container.State === 'running',
          canRestart: container.State === 'running' || container.State === 'exited'
        }
      }).sort((a, b) => {
        // Sort by state (running first), then by creation time (newest first)
        if (a.state !== b.state) {
          if (a.state === 'running') return -1
          if (b.state === 'running') return 1
        }
        return b.created - a.created
      })
    } catch (error) {
      console.error('Error listing services:', error)
      throw new Error(`Failed to list services: ${error.message}`)
    }
  }

  async getServiceDetails(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      const details = await container.inspect()
      
      const port = details.NetworkSettings.Ports['5678/tcp']?.[0]?.HostPort
      
      return {
        id: details.Id,
        name: details.Name.replace('/', ''),
        image: details.Config.Image,
        status: details.State.Status,
        created: details.Created,
        url: port ? `http://${this.getLocalIP()}:${port}` : null,
        environment: details.Config.Env,
        labels: details.Config.Labels
      }
    } catch (error) {
      console.error('Error getting service details:', error)
      return null
    }
  }

  async stopService(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      await container.stop()
      console.log(`Service ${containerId} stopped successfully`)
    } catch (error) {
      console.error('Error stopping service:', error)
      throw new Error(`Failed to stop service: ${error.message}`)
    }
  }

  async startService(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      await container.start()
      console.log(`Service ${containerId} started successfully`)
    } catch (error) {
      console.error('Error starting service:', error)
      throw new Error(`Failed to start service: ${error.message}`)
    }
  }

  async restartService(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      await container.restart()
      console.log(`Service ${containerId} restarted successfully`)
    } catch (error) {
      console.error('Error restarting service:', error)
      throw new Error(`Failed to restart service: ${error.message}`)
    }
  }

  async removeService(containerId, keepData = false) {
    try {
      const container = this.docker.getContainer(containerId)
      const details = await container.inspect()
      const volumeName = details.Config.Labels?.['zapie.volume']
      
      // Stop the container first if it's running
      try {
        await container.stop()
        console.log(`Container ${containerId} stopped`)
      } catch (error) {
        // Container might already be stopped
        console.log('Container already stopped or not running')
      }
      
      // Remove the container
      await container.remove()
      console.log(`Service ${containerId} removed successfully`)
      
      let volumeRemoved = false
      
      // Remove the volume based on user preference
      if (volumeName && !keepData) {
        try {
          const volume = this.docker.getVolume(volumeName)
          await volume.remove()
          console.log(`Volume ${volumeName} removed successfully`)
          volumeRemoved = true
        } catch (error) {
          console.log(`Volume ${volumeName} might be in use or doesn't exist:`, error.message)
        }
      }
      
      return {
        success: true,
        message: keepData 
          ? 'Service removed successfully (data preserved)' 
          : 'Service and data removed successfully',
        volumeRemoved,
        volumeName
      }
      
    } catch (error) {
      console.error('Error removing service:', error)
      throw new Error(`Failed to remove service: ${error.message}`)
    }
  }

  async getServiceLogs(containerId) {
    try {
      const container = this.docker.getContainer(containerId)
      
      // Get container logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100, // Get last 100 lines
        timestamps: true
      })
      
      // Convert buffer to string and clean up
      const logsString = logs.toString('utf8')
        .split('\n')
        .filter(line => line.trim()) // Remove empty lines
        .map(line => {
          // Remove Docker's log formatting (first 8 bytes)
          if (line.length > 8) {
            return line.substring(8)
          }
          return line
        })
        .join('\n')
      
      return logsString || 'No logs available'
    } catch (error) {
      console.error('Error fetching logs:', error)
      throw new Error(`Failed to fetch logs: ${error.message}`)
    }
  }

  // Generic deployment method using ServiceRegistry
  async deployService(serviceName, containerName, templateName) {
    try {
      const serviceConfig = serviceRegistry.getService(serviceName)
      if (!serviceConfig) {
        throw new Error(`Service ${serviceName} not found`)
      }

      const template = serviceConfig.templates[templateName]
      if (!template) {
        throw new Error(`Template ${templateName} not found for service ${serviceName}`)
      }

      // Create volume for persistent data
      const volumeName = `${containerName}_data`
      
      try {
        await this.docker.createVolume({ Name: volumeName })
        console.log(`✅ Created volume: ${volumeName}`)
      } catch (error) {
        if (error.statusCode === 409) {
          console.log(`📁 Volume ${volumeName} already exists`)
        } else {
          throw error
        }
      }

      // Find an available port
      const availablePort = await this.findAvailablePort(serviceConfig.defaultPort)
      
      const createOptions = {
        Image: serviceConfig.image,
        name: containerName,
        Env: serviceConfig.getEnvironment(this.getLocalIP(), availablePort),
        ExposedPorts: {
          [`${serviceConfig.internalPort}/tcp`]: {}
        },
        HostConfig: {
          PortBindings: {
            [`${serviceConfig.internalPort}/tcp`]: [{ HostPort: availablePort.toString() }]
          },
          Binds: [
            `${volumeName}:${serviceConfig.volumeMount}`
          ],
          Memory: this.parseMemory(template.memory),
          CpuQuota: Math.floor(parseFloat(template.cpus) * 100000),
          CpuPeriod: 100000,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        },
        Labels: {
          'zapie.service': serviceName,
          'zapie.managed': 'true',
          'zapie.volume': volumeName,
          'zapie.template': templateName,
          'zapie.port': availablePort.toString(),
          'zapie.created': new Date().toISOString()
        }
      }

      // Pull image first
      await this.pullImageIfNotExists(serviceConfig.image)

      // Create and start container
      const container = await this.docker.createContainer(createOptions)
      await container.start()

      console.log(`✅ ${serviceConfig.displayName} deployed successfully on port ${availablePort}`)

      const containerInfo = await container.inspect()
      
      return {
        containerId: containerInfo.Id,
        containerName: containerName,
        url: `http://${this.getLocalIP()}:${availablePort}`,
        port: availablePort,
        volume: volumeName,
        template: templateName,
        status: 'running',
        service: serviceName,
        displayName: serviceConfig.displayName,
        instructions: serviceConfig.instructions || []
      }

    } catch (error) {
      console.error(`Error deploying ${serviceName}:`, error)
      throw new Error(`Failed to deploy ${serviceName}: ${error.message}`)
    }
  }
}

export default DockerService
