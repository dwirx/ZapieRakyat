// Services Module - Central export point
export { serviceRegistry, ServiceRegistry } from './ServiceRegistry.js'
export { default as n8nServiceConfig } from './definitions/n8n.js'
export { default as wahaServiceConfig } from './definitions/waha.js'

// Re-export individual service configs if needed
export * from './definitions/n8n.js'
export * from './definitions/waha.js'
