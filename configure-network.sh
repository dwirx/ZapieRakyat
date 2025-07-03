#!/bin/bash

echo "🔧 Auto-configuring network settings..."

# Get the local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
    echo "⚠️  Could not detect local IP, using localhost"
else
    echo "📡 Detected local IP: $LOCAL_IP"
fi

# Update frontend .env file
echo "VITE_API_URL=http://$LOCAL_IP:5000" > frontend/.env
echo "✅ Updated frontend API URL to: http://$LOCAL_IP:5000"

# Update vite config to bind to all interfaces
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0'  // Bind to all interfaces
  }
})
EOF

echo "✅ Updated Vite config to accept connections from any IP"
echo ""
echo "🌐 Network Access:"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend:  http://$LOCAL_IP:5000"
echo "   Localhost: http://localhost:3000"
echo ""
echo "🚀 Ready to start the application!"
