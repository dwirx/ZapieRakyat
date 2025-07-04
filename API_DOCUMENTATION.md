# ZapieRakyat Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Health & System

### GET /health
Get backend health status
```json
{
  "status": "OK",
  "message": "ZapieRakyat Backend is running",
  "timestamp": "2025-07-04T06:45:38.023Z",
  "docker": {
    "status": "running",
    "containers": 5,
    "images": 4,
    "version": "28.3.1"
  },
  "system": {...},
  "uptime": 18.601660303,
  "memory": {...},
  "version": "1.0.0"
}
```

## Services Management

### GET /services
List all running services

### GET /services/:containerId
Get specific service details

### POST /services/:containerId/start
Start a service

### POST /services/:containerId/stop
Stop a service

### POST /services/:containerId/restart
Restart a service

### DELETE /services/:containerId
Remove a service
- Query param: `?keepData=true` to keep volume

### GET /services/:containerId/logs
Get service logs

## Health Monitoring

### GET /services/:containerId/health
Get service health status
```json
{
  "success": true,
  "health": {
    "status": "up|down|unreachable",
    "lastCheck": "2025-07-04T06:46:44.714Z",
    "uptime": "2025-07-03T21:01:00.090314748Z",
    "restartCount": 0,
    "exitCode": 0,
    "pid": 50486,
    "metrics": {
      "cpu": {
        "percentage": 0.006222222222222222,
        "cores": 2
      },
      "memory": {
        "usage": 16408576,
        "limit": 536870912,
        "percentage": 3.05633544921875
      },
      "network": {
        "rxBytes": 4078,
        "txBytes": 2947,
        "totalBytes": 7025
      },
      "disk": {
        "readBytes": 0,
        "writeBytes": 0,
        "totalBytes": 0
      }
    }
  }
}
```

### GET /services/:containerId/metrics
Get service metrics history
- Query param: `?timeRange=1h|6h|24h|7d|30d`

### GET /services/health/all
Get health status for all services

### POST /services/:containerId/monitoring/start
Start monitoring for a service
```json
{
  "interval": 30000  // monitoring interval in ms
}
```

### POST /services/:containerId/monitoring/stop
Stop monitoring for a service

### GET /services/monitoring/status
Get monitoring status for all services

### GET /services/system/metrics
Get system metrics

## Backup Management

### GET /services/:containerId/backups
List all backups for a service

### POST /services/:containerId/backups
Create a backup
```json
{
  "name": "backup-name",
  "description": "Optional description"
}
```

### POST /services/:containerId/backups/:backupId/restore
Restore a backup

### GET /services/:containerId/backups/:backupId/download
Download a backup file

### DELETE /services/:containerId/backups/:backupId
Delete a backup

### GET /services/:containerId/storage
Get storage usage for a service

## Bulk Operations

### POST /services/bulk/:operation
Perform bulk operations on multiple services
- Operations: `start`, `stop`, `restart`, `delete`, `backup`
```json
{
  "serviceIds": ["containerId1", "containerId2", ...]
}
```

Response:
```json
{
  "success": true,
  "operation": "start",
  "results": {
    "success": 2,
    "failed": 1,
    "errors": [
      {
        "serviceId": "containerId3",
        "error": "Error message"
      }
    ]
  }
}
```

## Service Templates

### GET /templates
Get all templates
- Query params: `?category=database&search=postgres`

### GET /templates/:id
Get specific template by ID

### POST /templates
Create new template
```json
{
  "name": "Template Name",
  "description": "Template description",
  "category": "database|web|api|monitoring|automation|other",
  "dockerImage": "postgres:14",
  "ports": ["5432:5432"],
  "environment": ["ENV_VAR=value"],
  "volumes": ["/host/path:/container/path"],
  "commands": [],
  "tags": ["tag1", "tag2"],
  "requirements": {
    "minMemory": 512,
    "minCpu": 0.5,
    "minDisk": 2
  }
}
```

### PUT /templates/:id
Update template

### DELETE /templates/:id
Delete template

### GET /templates/export/all
Export all templates

### POST /templates/import
Import templates
```json
{
  "templates": [...],
  "overwrite": false
}
```

### POST /templates/validate
Validate template structure
```json
{
  "name": "Template Name",
  "dockerImage": "nginx:alpine",
  "category": "web"
}
```

Response:
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### POST /templates/:id/clone
Clone/duplicate template
```json
{
  "newName": "New Template Name"
}
```

## WebSocket Events

The backend supports real-time monitoring via WebSocket connections:

### Connection
```javascript
const socket = io('http://localhost:5000')
```

### Events Emitted by Server

#### health-update
Real-time health updates for monitored services
```json
{
  "containerId": "abc123...",
  "health": {...},
  "timestamp": "2025-07-04T06:46:44.714Z"
}
```

#### metrics-update
Real-time metrics updates
```json
{
  "containerId": "abc123...",
  "metrics": {...},
  "timestamp": "2025-07-04T06:46:44.714Z"
}
```

#### health-alert
Health alerts when thresholds are exceeded
```json
{
  "containerId": "abc123...",
  "type": "high_cpu|high_memory|container_down|container_unreachable|high_restarts",
  "message": "Alert message",
  "severity": "warning|critical|error",
  "timestamp": "2025-07-04T06:46:44.714Z"
}
```

### Events Listened by Server

#### join-deployment
Join a deployment room for deployment-specific updates
```javascript
socket.emit('join-deployment', 'deploymentId')
```

## Error Responses

All endpoints return consistent error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error
