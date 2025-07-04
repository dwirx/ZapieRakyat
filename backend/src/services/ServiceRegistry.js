// Service Registry - Central management for all services
import n8nServiceConfig from './definitions/n8n.js'
import wahaServiceConfig from './definitions/waha.js'
import activepiecesServiceConfig from './definitions/activepieces.js'

export class ServiceRegistry {
  constructor() {
    this.services = new Map()
    this.registerService(n8nServiceConfig)
    this.registerService(wahaServiceConfig)
    this.registerService(activepiecesServiceConfig)
  }

  registerService(serviceConfig) {
    this.services.set(serviceConfig.name, serviceConfig)
  }

  getService(serviceName) {
    return this.services.get(serviceName)
  }

  getAllServices() {
    return Array.from(this.services.values())
  }

  getServiceTemplates(serviceName) {
    const service = this.getService(serviceName)
    return service ? service.templates : null
  }

  isValidService(serviceName) {
    return this.services.has(serviceName)
  }

  isValidTemplate(serviceName, templateName) {
    const service = this.getService(serviceName)
    return service && service.templates[templateName] !== undefined
  }

  // Get service configuration for frontend
  getServiceForFrontend(serviceName) {
    const service = this.getService(serviceName)
    if (!service) return null

    return {
      id: service.name,
      name: service.displayName,
      description: service.description,
      templates: Object.entries(service.templates).map(([key, template]) => ({
        id: key,
        name: `${service.displayName} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
        description: template.description,
        cpu: `${template.cpus} CPU`,
        ram: template.memory.toUpperCase() + ' RAM',
        price: 'Free',
        priceValue: 0
      }))
    }
  }

  // Get all services for frontend
  getAllServicesForFrontend() {
    return this.getAllServices().map(service => ({
      id: service.name,
      name: service.displayName,
      description: service.description,
      path: `/deploy/${service.name}`
    }))
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry()
export default serviceRegistry
