import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import deployRoutes from './routes/deploy.js'
import servicesRoutes from './routes/services.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, /^http:\/\/172\.\d+\.\d+\.\d+:3000$/],
    credentials: true
  }
})

const PORT = process.env.PORT || 5000

// Make io available to routes
app.set('io', io)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/, /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, /^http:\/\/172\.\d+\.\d+\.\d+:3000$/],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ZapieRakyat Backend is running',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/deploy', deployRoutes)
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
