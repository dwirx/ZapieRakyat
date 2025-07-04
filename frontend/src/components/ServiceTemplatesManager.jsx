import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Copy, Download, Upload, FileText, 
  Search, Filter, Save, X, Check, AlertCircle, Layers,
  Tag, Clock, User, ExternalLink
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'
import Toast from './Toast'

const ServiceTemplatesManager = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState([])
  const [filteredTemplates, setFilteredTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    ports: [],
    environment: [],
    volumes: [],
    restart_policy: 'unless-stopped',
    depends_on: [],
    labels: {},
    healthcheck: {},
    networks: []
  })

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, categoryFilter])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await axios.get(api.endpoints.templates)
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      showToast('Failed to fetch templates', 'error')
    }
    setLoading(false)
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter)
    }

    setFilteredTemplates(filtered)
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      image: '',
      ports: [],
      environment: [],
      volumes: [],
      restart_policy: 'unless-stopped',
      depends_on: [],
      labels: {},
      healthcheck: {},
      networks: []
    })
    setEditingTemplate(null)
    setShowCreateForm(false)
  }

  const handleCreateTemplate = async () => {
    try {
      await axios.post(api.endpoints.templates, formData)
      showToast('Template created successfully', 'success')
      fetchTemplates()
      resetForm()
    } catch (error) {
      console.error('Error creating template:', error)
      showToast('Failed to create template', 'error')
    }
  }

  const handleUpdateTemplate = async () => {
    try {
      await axios.put(`${api.endpoints.templates}/${editingTemplate.id}`, formData)
      showToast('Template updated successfully', 'success')
      fetchTemplates()
      resetForm()
    } catch (error) {
      console.error('Error updating template:', error)
      showToast('Failed to update template', 'error')
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await axios.delete(`${api.endpoints.templates}/${templateId}`)
      showToast('Template deleted successfully', 'success')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      showToast('Failed to delete template', 'error')
    }
  }

  const handleCloneTemplate = (template) => {
    setFormData({
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined
    })
    setShowCreateForm(true)
    setEditingTemplate(null)
  }

  const handleEditTemplate = (template) => {
    setFormData(template)
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  const handleExportTemplates = async () => {
    try {
      const response = await axios.get(`${api.endpoints.templates}/export`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Templates exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting templates:', error)
      showToast('Failed to export templates', 'error')
    }
  }

  const handleImportTemplates = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await axios.post(`${api.endpoints.templates}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      showToast('Templates imported successfully', 'success')
      fetchTemplates()
    } catch (error) {
      console.error('Error importing templates:', error)
      showToast('Failed to import templates', 'error')
    }
  }

  const categories = [...new Set(templates.map(t => t.category))].filter(Boolean)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Service Templates Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Templates List */}
          <div className={`${showCreateForm ? 'w-1/2' : 'w-full'} border-r`}>
            {/* Controls */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex flex-wrap gap-3 mb-3">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
                
                <button
                  onClick={handleExportTemplates}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportTemplates}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="p-4 overflow-y-auto h-full">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{template.category}</span>
                            {template.created_at && (
                              <>
                                <Clock className="w-3 h-3 text-gray-400 ml-2" />
                                <span className="text-xs text-gray-500">
                                  {new Date(template.created_at).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleCloneTemplate(template)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                        >
                          <Copy className="w-3 h-3" />
                          Clone
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Docker Image *</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., nginx:latest"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Restart Policy</label>
                  <select
                    value={formData.restart_policy}
                    onChange={(e) => setFormData({ ...formData, restart_policy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no">No</option>
                    <option value="always">Always</option>
                    <option value="unless-stopped">Unless Stopped</option>
                    <option value="on-failure">On Failure</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                  
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ServiceTemplatesManager
