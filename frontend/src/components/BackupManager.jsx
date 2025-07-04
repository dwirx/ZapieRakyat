import { useState, useEffect } from 'react'
import { 
  Save, Download, Upload, Trash2, RefreshCw, 
  CheckCircle, AlertCircle, Clock, Database,
  Archive, FileDown, FileUp, Shield, Calendar,
  HardDrive, Zap, Activity, TrendingUp, X
} from 'lucide-react'
import axios from 'axios'
import { api } from '../config/api'
import { useToast } from './Toast'
import { LoadingSpinner } from './Loading'

const BackupManager = ({ serviceId, serviceName, onClose }) => {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(null)
  const [backupName, setBackupName] = useState('')
  const [backupDescription, setBackupDescription] = useState('')
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 })
  
  const { success, error, info, ToastContainer } = useToast()

  useEffect(() => {
    fetchBackups()
    fetchStorageUsage()
  }, [serviceId])

  const fetchBackups = async () => {
    try {
      const response = await axios.get(`${api.baseURL}/api/services/${serviceId}/backups`)
      setBackups(response.data.backups || [])
    } catch (err) {
      console.error('Failed to fetch backups:', err)
      error('Error', 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  const fetchStorageUsage = async () => {
    try {
      const response = await axios.get(`${api.baseURL}/api/services/${serviceId}/storage`)
      setStorageUsage(response.data.storage || { used: 0, total: 0 })
    } catch (err) {
      console.error('Failed to fetch storage usage:', err)
    }
  }

  const createBackup = async () => {
    if (!backupName.trim()) {
      error('Validation Error', 'Backup name is required')
      return
    }

    setCreating(true)
    try {
      const response = await axios.post(`${api.baseURL}/api/services/${serviceId}/backups`, {
        name: backupName,
        description: backupDescription
      })
      
      success('Backup Created', `Backup "${backupName}" created successfully`)
      setBackupName('')
      setBackupDescription('')
      fetchBackups()
      fetchStorageUsage()
    } catch (err) {
      error('Backup Failed', err.response?.data?.message || 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const restoreBackup = async (backupId, backupName) => {
    if (!confirm(`Are you sure you want to restore backup "${backupName}"?\n\nThis will replace current data!`)) {
      return
    }

    setRestoring(backupId)
    try {
      await axios.post(`${api.baseURL}/api/services/${serviceId}/backups/${backupId}/restore`)
      success('Restore Complete', `Service restored from backup "${backupName}"`)
    } catch (err) {
      error('Restore Failed', err.response?.data?.message || 'Failed to restore backup')
    } finally {
      setRestoring(null)
    }
  }

  const downloadBackup = async (backupId, backupName) => {
    try {
      const response = await axios.get(`${api.baseURL}/api/services/${serviceId}/backups/${backupId}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${serviceName}-${backupName}.tar.gz`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      success('Download Started', 'Backup download started')
    } catch (err) {
      error('Download Failed', 'Failed to download backup')
    }
  }

  const deleteBackup = async (backupId, backupName) => {
    if (!confirm(`Are you sure you want to delete backup "${backupName}"?\n\nThis action cannot be undone!`)) {
      return
    }

    try {
      await axios.delete(`${api.baseURL}/api/services/${serviceId}/backups/${backupId}`)
      success('Backup Deleted', `Backup "${backupName}" deleted successfully`)
      fetchBackups()
      fetchStorageUsage()
    } catch (err) {
      error('Delete Failed', 'Failed to delete backup')
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Backup Manager</h2>
                <p className="text-blue-100">Service: {serviceName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Storage Usage */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <HardDrive className="w-5 h-5 mr-2 text-purple-600" />
                Storage Usage
              </h3>
              <span className="text-sm text-gray-600">
                {formatSize(storageUsage.used)} / {formatSize(storageUsage.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Create Backup */}
          <div className="bg-white border rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Save className="w-5 h-5 mr-2 text-green-600" />
              Create New Backup
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Name *
                </label>
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="e.g., before-update-v2.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder="Backup description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={createBackup}
              disabled={creating || !backupName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 transition-all flex items-center font-medium"
            >
              {creating ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Creating Backup...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </button>
          </div>

          {/* Backup List */}
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Archive className="w-5 h-5 mr-2 text-blue-600" />
                Available Backups ({backups.length})
              </h3>
              <button
                onClick={fetchBackups}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-gray-600">Loading backups...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No backups found</p>
                <p className="text-gray-400">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Database className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{backup.name}</h4>
                            {backup.description && (
                              <p className="text-sm text-gray-600">{backup.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(backup.created_at)}
                          </div>
                          <div className="flex items-center">
                            <HardDrive className="w-3 h-3 mr-1" />
                            {formatSize(backup.size)}
                          </div>
                          <div className="flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            {backup.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadBackup(backup.id, backup.name)}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          title="Download Backup"
                        >
                          <FileDown className="w-4 h-4 mr-1" />
                          Download
                        </button>
                        
                        <button
                          onClick={() => restoreBackup(backup.id, backup.name)}
                          disabled={restoring === backup.id}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
                          title="Restore Backup"
                        >
                          {restoring === backup.id ? (
                            <>
                              <LoadingSpinner size="sm" color="white" />
                              <span className="ml-1">Restoring...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              Restore
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => deleteBackup(backup.id, backup.name)}
                          className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          title="Delete Backup"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BackupManager
