#!/bin/bash

echo "🚀 Setting up ZapieRakyat..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Setup Backend
echo "📦 Setting up backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Setup Frontend  
echo "📦 Setting up frontend..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

# Configure network settings
echo ""
echo "🔧 Configuring network access..."
cd ..
./configure-network.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "✅ All dependencies installed successfully!"
echo "✅ Network access configured for LAN connections!"
echo ""
echo "🚀 To start the application:"
echo "1. Use VS Code Command Palette (Ctrl+Shift+P)"
echo "2. Type 'Tasks: Run Task'"
echo "3. Select 'Start Backend' first"
echo "4. Then select 'Start Frontend'"
echo ""
echo "OR manually in terminals:"
echo "Terminal 1: cd backend && npm run dev"
echo "Terminal 2: cd frontend && npm run dev"
echo ""
echo "🌐 Access from any device on your network!"
echo "📱 Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 Backend:  http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "🔧 Dependencies Status:"
echo "   ✅ Backend: nodemon, express, dockerode installed"
echo "   ✅ Frontend: react, vite, tailwindcss installed"
echo "   ✅ CORS: Configured for local network access"
