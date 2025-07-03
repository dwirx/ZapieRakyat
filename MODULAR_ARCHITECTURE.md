# ZapieRakyat - Modular Architecture

## Project Structure

```
ZapieRakyat/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   └── app.js        # Main app configuration
│   │   ├── modules/          # Modular components
│   │   │   ├── deployment/   # Deployment module
│   │   │   │   ├── index.js        # Module exports
│   │   │   │   ├── DockerService.js # Docker deployment service
│   │   │   │   └── routes.js       # Deployment routes
│   │   │   └── services/     # Services module
│   │   │       ├── index.js        # Module exports
│   │   │       ├── ServiceRegistry.js # Service registry
│   │   │       └── definitions/    # Service definitions
│   │   │           ├── n8n.js      # n8n service config
│   │   │           └── waha.js     # WAHA service config
│   │   ├── routes/           # Legacy routes (to be migrated)
│   │   │   └── services.js   # Services management routes
│   │   └── server.js         # Main server file
│   ├── package.json
│   └── README.md
└── frontend/
    ├── src/
    │   ├── config/           # Frontend configuration
    │   │   └── api.js        # API configuration
    │   ├── pages/            # React pages/components
    │   │   ├── Categories.jsx    # Service selection page
    │   │   ├── DeployN8n.jsx    # N8n deployment page
    │   │   ├── DeployWaha.jsx   # WAHA deployment page
    │   │   └── Services.jsx     # Service management page
    │   ├── App.jsx           # Main React component
    │   ├── main.jsx          # React entry point
    │   └── index.css         # Global styles
    ├── package.json
    └── README.md
```

## Modular Design Benefits

### 1. **Separation of Concerns**
- **Deployment Module**: Handles all Docker-related operations
- **Services Module**: Manages service definitions and registry
- **Config Module**: Centralized configuration management

### 2. **Easy to Extend**
To add a new service:
1. Create service definition in `modules/services/definitions/`
2. Register it in `ServiceRegistry.js`
3. Service automatically appears in frontend

### 3. **Maintainable**
- Each module has clear responsibility
- Dependencies are explicit through index.js exports
- Configuration is centralized

### 4. **Scalable**
- Can easily add new deployment types (Kubernetes, Docker Compose)
- Frontend automatically adapts to backend service changes
- Template system supports any service configuration

## Key Features

### Backend Modular Structure
- **Generic Deployment**: Single `deployService()` method handles all services
- **Service Registry**: Central management of all available services
- **Configuration-Driven**: Services defined through config objects
- **Port Management**: Automatic port allocation with conflict resolution
- **Volume Management**: Persistent data storage for all services

### Frontend Dynamic Loading
- **Dynamic Service List**: Loads available services from backend
- **Dynamic Templates**: Templates fetched from backend configuration
- **Consistent UI**: Unified deployment experience for all services

### Service Definition Schema
Each service is defined with:
- Service metadata (name, description, image)
- Template configurations (basic, plus, pro)
- Environment variables
- Volume mounts
- Port configurations

## Example: Adding New Service

1. **Create service definition** (`modules/services/definitions/redis.js`):
```javascript
export const redisServiceConfig = {
  name: 'redis',
  displayName: 'Redis',
  description: 'In-memory data structure store',
  image: 'redis:latest',
  defaultPort: 6379,
  internalPort: 6379,
  templates: {
    basic: { memory: '256m', cpus: '0.5' }
  },
  getEnvironment: () => [],
  volumeMount: '/data'
}
```

2. **Register in ServiceRegistry** (`modules/services/ServiceRegistry.js`):
```javascript
import redisServiceConfig from './definitions/redis.js'
// Add to constructor:
this.registerService(redisServiceConfig)
```

3. **Service automatically appears in frontend** - No frontend changes needed!

## Testing the Modular Structure

1. **Backend API Test**:
   ```bash
   curl http://localhost:5000/api/deploy/services
   ```

2. **Service Templates Test**:
   ```bash
   curl http://localhost:5000/api/deploy/services/waha/templates
   ```

3. **Deployment Test**:
   ```bash
   curl -X POST http://localhost:5000/api/deploy \
     -H "Content-Type: application/json" \
     -d '{"serviceName":"test-waha","serviceType":"waha","template":"basic"}'
   ```

## Migration Notes

The project has been successfully migrated to a modular architecture while maintaining backward compatibility. All existing functionality continues to work, but the codebase is now more maintainable and extensible.

### What Changed:
- ✅ Modular folder structure
- ✅ Centralized configuration
- ✅ Generic deployment system
- ✅ Dynamic frontend loading
- ✅ WAHA now appears in frontend

### What Stayed the Same:
- ✅ All existing API endpoints
- ✅ Frontend user experience
- ✅ Deployment functionality
- ✅ Service management features
