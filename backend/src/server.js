import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import Docker from 'dockerode'
import os from 'os'
import appConfig from './config/app.js'
import { deploymentRoutes } from './modules/deployment/index.js'
import servicesRoutes from './routes/services.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: appConfig.server.cors
})

const PORT = appConfig.server.port

// Make io available to routes
app.set('io', io)

// Middleware
app.use(helmet())
app.use(cors(appConfig.server.cors))
app.use(express.json())

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Check Docker connection
    const docker = new Docker({ socketPath: '/var/run/docker.sock' })
    
    let dockerStatus = 'unknown'
    let dockerInfo = null
    
    try {
      dockerInfo = await docker.info()
      dockerStatus = 'running'
    } catch (error) {
      dockerStatus = 'offline'
    }
    
    // Get system info
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length
    }
    
    res.json({ 
      status: 'OK', 
      message: 'ZapieRakyat Backend is running',
      timestamp: new Date().toISOString(),
      docker: {
        status: dockerStatus,
        containers: dockerInfo?.Containers || 0,
        images: dockerInfo?.Images || 0,
        version: dockerInfo?.ServerVersion || 'unknown'
      },
      system: systemInfo,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

app.use('/api/deploy', deploymentRoutes)
app.use('/api/services', servicesRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })
  
  socket.on('join-deployment', (deploymentId) => {
    socket.join(`deployment-${deploymentId}`)
    console.log(`📡 Client joined deployment room: ${deploymentId}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 ZapieRakyat Backend server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔌 WebSocket server ready for real-time updates`)
})
