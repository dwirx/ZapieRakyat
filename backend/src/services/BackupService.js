import Docker from 'dockerode'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import { pipeline } from 'stream/promises'
import { createWriteStream, createReadStream } from 'fs'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class BackupService {
  constructor() {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
    this.backupsPath = path.join(__dirname, '../../backups')
    this.ensureBackupsDirectory()
  }

  async ensureBackupsDirectory() {
    try {
      await fs.mkdir(this.backupsPath, { recursive: true })
    } catch (error) {
      console.error('Error creating backups directory:', error.message)
    }
  }

  async createBackup(containerId, backupName, description = '') {
    try {
      const container = this.docker.getContainer(containerId)
      const containerInfo = await container.inspect()
      
      const backupId = this.generateBackupId()
      const timestamp = new Date().toISOString()
      const backupDir = path.join(this.backupsPath, containerId, backupId)
      
      await fs.mkdir(backupDir, { recursive: true })
      
      // Create backup metadata
      const metadata = {
        id: backupId,
        name: backupName,
        description: description,
        containerId: containerId,
        containerName: containerInfo.Name.replace('/', ''),
        image: containerInfo.Config.Image,
        created_at: timestamp,
        status: 'creating',
        size: 0,
        volumes: [],
        config: {
          env: containerInfo.Config.Env,
          ports: containerInfo.Config.ExposedPorts,
          volumes: containerInfo.Config.Volumes,
          workingDir: containerInfo.Config.WorkingDir,
          cmd: containerInfo.Config.Cmd,
          entrypoint: containerInfo.Config.Entrypoint
        }
      }
      
      // Save metadata
      await fs.writeFile(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      )
      
      // Backup container volumes
      const volumeBackups = []
      if (containerInfo.Mounts) {
        for (const mount of containerInfo.Mounts) {
          if (mount.Type === 'volume' || mount.Type === 'bind') {
            const volumeBackup = await this.backupVolume(mount, backupDir)
            volumeBackups.push(volumeBackup)
          }
        }
      }
      
      // Update metadata with volume info
      metadata.volumes = volumeBackups
      metadata.status = 'completed'
      metadata.size = await this.calculateBackupSize(backupDir)
      
      await fs.writeFile(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      )
      
      console.log(`Backup created successfully: ${backupId}`)
      return metadata
      
    } catch (error) {
      console.error('Error creating backup:', error.message)
      throw error
    }
  }

  async backupVolume(mount, backupDir) {
    const volumeName = mount.Name || path.basename(mount.Source)
    const volumeBackupPath = path.join(backupDir, 'volumes', volumeName)
    
    await fs.mkdir(volumeBackupPath, { recursive: true })
    
    try {
      // Use tar to create archive of volume data
      await this.createTarArchive(mount.Source, path.join(volumeBackupPath, 'data.tar'))
      
      return {
        name: volumeName,
        source: mount.Source,
        destination: mount.Destination,
        type: mount.Type,
        mode: mount.Mode,
        backupPath: volumeBackupPath,
        size: await this.getDirectorySize(volumeBackupPath)
      }
    } catch (error) {
      console.error(`Error backing up volume ${volumeName}:`, error.message)
      return {
        name: volumeName,
        source: mount.Source,
        destination: mount.Destination,
        type: mount.Type,
        mode: mount.Mode,
        error: error.message
      }
    }
  }

  async createTarArchive(sourcePath, outputPath) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-czf', outputPath, '-C', path.dirname(sourcePath), path.basename(sourcePath)])
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`tar process exited with code ${code}`))
        }
      })
      
      tar.on('error', reject)
    })
  }

  async getBackups(containerId) {
    try {
      const containerBackupsPath = path.join(this.backupsPath, containerId)
      
      try {
        await fs.access(containerBackupsPath)
      } catch {
        return []
      }
      
      const backupDirs = await fs.readdir(containerBackupsPath)
      const backups = []
      
      for (const backupDir of backupDirs) {
        try {
          const metadataPath = path.join(containerBackupsPath, backupDir, 'metadata.json')
          const metadataContent = await fs.readFile(metadataPath, 'utf8')
          const metadata = JSON.parse(metadataContent)
          backups.push(metadata)
        } catch (error) {
          console.warn(`Error reading backup metadata for ${backupDir}:`, error.message)
        }
      }
      
      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
    } catch (error) {
      console.error('Error getting backups:', error.message)
      return []
    }
  }

  async getBackup(containerId, backupId) {
    try {
      const backupPath = path.join(this.backupsPath, containerId, backupId)
      const metadataPath = path.join(backupPath, 'metadata.json')
      
      const metadataContent = await fs.readFile(metadataPath, 'utf8')
      return JSON.parse(metadataContent)
    } catch (error) {
      console.error('Error getting backup:', error.message)
      return null
    }
  }

  async deleteBackup(containerId, backupId) {
    try {
      const backupPath = path.join(this.backupsPath, containerId, backupId)
      await fs.rm(backupPath, { recursive: true, force: true })
      console.log(`Backup deleted: ${backupId}`)
      return true
    } catch (error) {
      console.error('Error deleting backup:', error.message)
      throw error
    }
  }

  async restoreBackup(containerId, backupId) {
    try {
      const backup = await this.getBackup(containerId, backupId)
      if (!backup) {
        throw new Error('Backup not found')
      }
      
      // Stop the current container
      const container = this.docker.getContainer(containerId)
      try {
        await container.stop()
        console.log(`Stopped container ${containerId} for restore`)
      } catch (error) {
        console.warn('Container was not running:', error.message)
      }
      
      // Remove the current container
      try {
        await container.remove()
        console.log(`Removed container ${containerId}`)
      } catch (error) {
        console.warn('Error removing container:', error.message)
      }
      
      // Restore volumes
      for (const volume of backup.volumes) {
        if (volume.backupPath && !volume.error) {
          await this.restoreVolume(volume)
        }
      }
      
      // Recreate container with original configuration
      const createOptions = {
        Image: backup.image,
        name: backup.containerName,
        Env: backup.config.env,
        ExposedPorts: backup.config.ports,
        WorkingDir: backup.config.workingDir,
        Cmd: backup.config.cmd,
        Entrypoint: backup.config.entrypoint,
        Labels: {
          'zapie.managed': 'true',
          'zapie.backup.restored': 'true',
          'zapie.backup.source': backupId
        }
      }
      
      const newContainer = await this.docker.createContainer(createOptions)
      await newContainer.start()
      
      console.log(`Restored container from backup ${backupId}`)
      return {
        success: true,
        containerId: newContainer.id,
        backupId: backupId,
        message: 'Container restored successfully'
      }
      
    } catch (error) {
      console.error('Error restoring backup:', error.message)
      throw error
    }
  }

  async restoreVolume(volumeInfo) {
    try {
      const dataArchivePath = path.join(volumeInfo.backupPath, 'data.tar')
      
      // Create target directory if it doesn't exist
      await fs.mkdir(path.dirname(volumeInfo.source), { recursive: true })
      
      // Extract the archive
      await this.extractTarArchive(dataArchivePath, path.dirname(volumeInfo.source))
      
      console.log(`Restored volume: ${volumeInfo.name}`)
    } catch (error) {
      console.error(`Error restoring volume ${volumeInfo.name}:`, error.message)
      throw error
    }
  }

  async extractTarArchive(archivePath, outputDir) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xzf', archivePath, '-C', outputDir])
      
      tar.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`tar extract process exited with code ${code}`))
        }
      })
      
      tar.on('error', reject)
    })
  }

  async downloadBackup(containerId, backupId) {
    try {
      const backupPath = path.join(this.backupsPath, containerId, backupId)
      const outputPath = path.join(this.backupsPath, `${containerId}-${backupId}.tar.gz`)
      
      // Create compressed archive of the entire backup
      await this.createTarArchive(backupPath, outputPath)
      
      return {
        filePath: outputPath,
        filename: `backup-${containerId}-${backupId}.tar.gz`
      }
    } catch (error) {
      console.error('Error preparing backup download:', error.message)
      throw error
    }
  }

  async getStorageUsage(containerId) {
    try {
      const containerBackupsPath = path.join(this.backupsPath, containerId)
      
      try {
        await fs.access(containerBackupsPath)
      } catch {
        return { used: 0, total: 0 }
      }
      
      const used = await this.getDirectorySize(containerBackupsPath)
      
      // For now, set a default total of 10GB per container
      // This can be made configurable
      const total = 10 * 1024 * 1024 * 1024 // 10GB in bytes
      
      return { used, total }
    } catch (error) {
      console.error('Error getting storage usage:', error.message)
      return { used: 0, total: 0 }
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name)
        
        if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath)
        } else {
          const stats = await fs.stat(itemPath)
          totalSize += stats.size
        }
      }
    } catch (error) {
      console.warn(`Error calculating directory size for ${dirPath}:`, error.message)
    }
    
    return totalSize
  }

  async calculateBackupSize(backupDir) {
    return await this.getDirectorySize(backupDir)
  }

  generateBackupId() {
    return 'backup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }

  async cleanup() {
    // Cleanup old backups (older than 30 days by default)
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    const now = Date.now()
    
    try {
      const containerDirs = await fs.readdir(this.backupsPath)
      
      for (const containerDir of containerDirs) {
        const containerPath = path.join(this.backupsPath, containerDir)
        const backupDirs = await fs.readdir(containerPath)
        
        for (const backupDir of backupDirs) {
          try {
            const backupPath = path.join(containerPath, backupDir)
            const metadataPath = path.join(backupPath, 'metadata.json')
            
            const metadataContent = await fs.readFile(metadataPath, 'utf8')
            const metadata = JSON.parse(metadataContent)
            
            const backupAge = now - new Date(metadata.created_at).getTime()
            
            if (backupAge > maxAge) {
              await fs.rm(backupPath, { recursive: true, force: true })
              console.log(`Cleaned up old backup: ${metadata.id}`)
            }
          } catch (error) {
            console.warn(`Error cleaning up backup ${backupDir}:`, error.message)
          }
        }
      }
    } catch (error) {
      console.error('Error during backup cleanup:', error.message)
    }
  }
}

export default BackupService