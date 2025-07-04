import express from 'express'
import TemplateService from '../services/TemplateService.js'

const router = express.Router()
const templateService = new TemplateService()

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    const templates = await templateService.getTemplates(category, search)
    
    res.json({
      success: true,
      templates: templates
    })
  } catch (error) {
    console.error('Error getting templates:', error)
    res.status(500).json({
      error: 'Failed to get templates',
      message: error.message
    })
  }
})

// Get specific template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const template = await templateService.getTemplate(id)
    
    if (!template) {
      return res.status(404).json({
        error: 'Template not found'
      })
    }
    
    res.json({
      success: true,
      template: template
    })
  } catch (error) {
    console.error('Error getting template:', error)
    res.status(500).json({
      error: 'Failed to get template',
      message: error.message
    })
  }
})

// Create new template
router.post('/', async (req, res) => {
  try {
    const templateData = req.body
    
    // Validate required fields
    if (!templateData.name || !templateData.dockerImage || !templateData.category) {
      return res.status(400).json({
        error: 'Name, dockerImage, and category are required fields'
      })
    }
    
    const template = await templateService.createTemplate(templateData)
    
    res.status(201).json({
      success: true,
      template: template,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Error creating template:', error)
    res.status(500).json({
      error: 'Failed to create template',
      message: error.message
    })
  }
})

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const templateData = req.body
    
    const updatedTemplate = await templateService.updateTemplate(id, templateData)
    
    if (!updatedTemplate) {
      return res.status(404).json({
        error: 'Template not found'
      })
    }
    
    res.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    res.status(500).json({
      error: 'Failed to update template',
      message: error.message
    })
  }
})

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await templateService.deleteTemplate(id)
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Template not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message
    })
  }
})

// Export templates
router.get('/export/all', async (req, res) => {
  try {
    const exportData = await templateService.exportTemplates()
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="templates-export.json"')
    
    res.json(exportData)
  } catch (error) {
    console.error('Error exporting templates:', error)
    res.status(500).json({
      error: 'Failed to export templates',
      message: error.message
    })
  }
})

// Import templates
router.post('/import', async (req, res) => {
  try {
    const { templates, overwrite = false } = req.body
    
    if (!templates || !Array.isArray(templates)) {
      return res.status(400).json({
        error: 'Templates array is required'
      })
    }
    
    const result = await templateService.importTemplates(templates, overwrite)
    
    res.json({
      success: true,
      result: result,
      message: 'Templates imported successfully'
    })
  } catch (error) {
    console.error('Error importing templates:', error)
    res.status(500).json({
      error: 'Failed to import templates',
      message: error.message
    })
  }
})

// Validate template
router.post('/validate', async (req, res) => {
  try {
    const templateData = req.body
    const validation = await templateService.validateTemplate(templateData)
    
    res.json({
      success: true,
      validation: validation
    })
  } catch (error) {
    console.error('Error validating template:', error)
    res.status(500).json({
      error: 'Failed to validate template',
      message: error.message
    })
  }
})

// Clone/duplicate template
router.post('/:id/clone', async (req, res) => {
  try {
    const { id } = req.params
    const { newName } = req.body
    
    if (!newName) {
      return res.status(400).json({
        error: 'New name is required for cloning'
      })
    }
    
    const clonedTemplate = await templateService.cloneTemplate(id, newName)
    
    if (!clonedTemplate) {
      return res.status(404).json({
        error: 'Template not found'
      })
    }
    
    res.status(201).json({
      success: true,
      template: clonedTemplate,
      message: 'Template cloned successfully'
    })
  } catch (error) {
    console.error('Error cloning template:', error)
    res.status(500).json({
      error: 'Failed to clone template',
      message: error.message
    })
  }
})

export default router
