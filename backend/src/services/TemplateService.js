import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class TemplateService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../../templates/custom-templates.json')
    this.ensureTemplatesFile()
  }

  async ensureTemplatesFile() {
    try {
      await fs.access(this.templatesPath)
    } catch (error) {
      // File doesn't exist, create it with default templates
      const defaultTemplates = {
        templates: [
          {
            id: 'postgres-basic',
            name: 'PostgreSQL Basic',
            description: 'Basic PostgreSQL database server',
            category: 'database',
            dockerImage: 'postgres:14',
            ports: ['5432:5432'],
            environment: [
              'POSTGRES_DB=mydb',
              'POSTGRES_USER=admin',
              'POSTGRES_PASSWORD=changeme'
            ],
            volumes: ['/data/postgres:/var/lib/postgresql/data'],
            commands: [],
            tags: ['database', 'postgresql', 'sql'],
            isPublic: true,
            isFavorite: false,
            requirements: {
              minMemory: 512,
              minCpu: 0.5,
              minDisk: 2
            },
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: 'nginx-web',
            name: 'Nginx Web Server',
            description: 'High performance web server and reverse proxy',
            category: 'web',
            dockerImage: 'nginx:alpine',
            ports: ['80:80', '443:443'],
            environment: [],
            volumes: ['/data/nginx/html:/usr/share/nginx/html', '/data/nginx/conf:/etc/nginx/conf.d'],
            commands: [],
            tags: ['web', 'nginx', 'proxy'],
            isPublic: true,
            isFavorite: false,
            requirements: {
              minMemory: 256,
              minCpu: 0.25,
              minDisk: 1
            },
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }
        ]
      }
      
      await fs.mkdir(path.dirname(this.templatesPath), { recursive: true })
      await fs.writeFile(this.templatesPath, JSON.stringify(defaultTemplates, null, 2))
      console.log('Created default templates file')
    }
  }

  async getAllTemplates() {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf8')
      const templates = JSON.parse(data)
      return templates.templates || []
    } catch (error) {
      console.error('Error reading templates:', error.message)
      return []
    }
  }

  async getTemplates(category = null, search = null) {
    const templates = await this.getAllTemplates()
    
    let filtered = templates
    
    if (category && category !== 'all') {
      filtered = filtered.filter(template => template.category === category)
    }
    
    if (search) {
      const searchTerm = search.toLowerCase()
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }
    
    return filtered
  }

  async getTemplate(templateId) {
    const templates = await this.getAllTemplates()
    return templates.find(template => template.id === templateId)
  }

  async createTemplate(templateData) {
    try {
      const templates = await this.getAllTemplates()
      
      const newTemplate = {
        id: this.generateId(),
        ...templateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      templates.push(newTemplate)
      
      await this.saveTemplates(templates)
      return newTemplate
    } catch (error) {
      console.error('Error creating template:', error.message)
      throw error
    }
  }

  async updateTemplate(templateId, templateData) {
    try {
      const templates = await this.getAllTemplates()
      const templateIndex = templates.findIndex(template => template.id === templateId)
      
      if (templateIndex === -1) {
        return null // Template not found
      }
      
      templates[templateIndex] = {
        ...templates[templateIndex],
        ...templateData,
        id: templateId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      }
      
      await this.saveTemplates(templates)
      return templates[templateIndex]
    } catch (error) {
      console.error('Error updating template:', error.message)
      throw error
    }
  }

  async deleteTemplate(templateId) {
    try {
      const templates = await this.getAllTemplates()
      const initialLength = templates.length
      const filteredTemplates = templates.filter(template => template.id !== templateId)
      
      if (filteredTemplates.length === initialLength) {
        return false // Template not found
      }
      
      await this.saveTemplates(filteredTemplates)
      return true
    } catch (error) {
      console.error('Error deleting template:', error.message)
      throw error
    }
  }

  async saveTemplates(templates) {
    const data = {
      templates: templates,
      lastUpdated: new Date().toISOString()
    }
    
    await fs.writeFile(this.templatesPath, JSON.stringify(data, null, 2))
  }

  generateId() {
    return 'template-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }

  async getFavoriteTemplates() {
    const templates = await this.getAllTemplates()
    return templates.filter(template => template.isFavorite)
  }

  async toggleFavorite(templateId) {
    const templates = await this.getAllTemplates()
    const template = templates.find(t => t.id === templateId)
    
    if (!template) {
      throw new Error('Template not found')
    }
    
    template.isFavorite = !template.isFavorite
    template.updatedAt = new Date().toISOString()
    
    await this.saveTemplates(templates)
    return template
  }

  async exportTemplates() {
    const templates = await this.getAllTemplates()
    return {
      templates: templates,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      count: templates.length
    }
  }

  async importTemplates(templatesData, overwrite = false) {
    try {
      const existingTemplates = await this.getAllTemplates()
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      }

      for (const templateData of templatesData) {
        try {
          // Check if template already exists
          const existingTemplate = existingTemplates.find(t => 
            t.name === templateData.name || t.id === templateData.id
          )

          if (existingTemplate && !overwrite) {
            results.skipped++
            continue
          }

          // Clean up template data
          const cleanTemplate = { ...templateData }
          delete cleanTemplate.id
          delete cleanTemplate.exportedAt
          delete cleanTemplate.exportVersion
          delete cleanTemplate.createdAt
          delete cleanTemplate.updatedAt

          // Validate template
          this.validateTemplate(cleanTemplate)

          if (existingTemplate && overwrite) {
            await this.updateTemplate(existingTemplate.id, cleanTemplate)
          } else {
            await this.createTemplate(cleanTemplate)
          }

          results.imported++
        } catch (error) {
          results.errors.push({
            template: templateData.name || 'Unknown',
            error: error.message
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error importing templates:', error.message)
      throw error
    }
  }

  validateTemplate(templateData) {
    const required = ['name', 'dockerImage', 'category']
    const missing = required.filter(field => !templateData[field])
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (missing.length > 0) {
      validation.isValid = false
      validation.errors.push(`Missing required fields: ${missing.join(', ')}`)
    }
    
    // Validate category
    const validCategories = ['database', 'web', 'api', 'monitoring', 'automation', 'other']
    if (templateData.category && !validCategories.includes(templateData.category)) {
      validation.isValid = false
      validation.errors.push('Invalid category. Must be one of: ' + validCategories.join(', '))
    }
    
    // Validate Docker image format
    if (templateData.dockerImage && !templateData.dockerImage.includes(':')) {
      validation.warnings.push('Docker image should include a tag (e.g., nginx:alpine)')
    }
    
    // Validate resource requirements
    if (templateData.requirements) {
      const { minMemory, minCpu, minDisk } = templateData.requirements
      if (minMemory && minMemory < 128) {
        validation.errors.push('Minimum memory must be at least 128MB')
        validation.isValid = false
      }
      if (minCpu && minCpu < 0.1) {
        validation.errors.push('Minimum CPU must be at least 0.1 cores')
        validation.isValid = false
      }
      if (minDisk && minDisk < 1) {
        validation.errors.push('Minimum disk must be at least 1GB')
        validation.isValid = false
      }
    }

    // Validate ports format
    if (templateData.ports && Array.isArray(templateData.ports)) {
      for (const port of templateData.ports) {
        if (typeof port === 'string' && !port.match(/^\d+:\d+$/)) {
          validation.warnings.push(`Port mapping "${port}" may not be in correct format (expected: hostPort:containerPort)`)
        }
      }
    }
    
    return validation
  }

  async cloneTemplate(templateId, newName) {
    try {
      const originalTemplate = await this.getTemplate(templateId)
      if (!originalTemplate) {
        return null
      }

      // Create a copy with new name and ID
      const clonedTemplate = {
        ...originalTemplate,
        name: newName,
        id: undefined, // Will be generated in createTemplate
        createdAt: undefined,
        updatedAt: undefined,
        // Add clone indicator
        description: `${originalTemplate.description} (Cloned from ${originalTemplate.name})`
      }

      return await this.createTemplate(clonedTemplate)
    } catch (error) {
      console.error('Error cloning template:', error.message)
      throw error
    }
  }

  async getTemplateStats() {
    const templates = await this.getAllTemplates()
    
    const stats = {
      total: templates.length,
      favorites: templates.filter(t => t.isFavorite).length,
      public: templates.filter(t => t.isPublic).length,
      categories: {}
    }
    
    // Count by category
    templates.forEach(template => {
      stats.categories[template.category] = (stats.categories[template.category] || 0) + 1
    })
    
    return stats
  }
}

export default TemplateService
