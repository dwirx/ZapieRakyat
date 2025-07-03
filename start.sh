#!/bin/bash

echo "🚀 Starting ZapieRakyat Services..."

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "❌ Backend dependencies not found. Running setup first..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not found. Running setup first..."
    cd frontend && npm install && cd ..
fi

# Start services
echo "🔄 Starting Backend on port 5000..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "🔄 Starting Frontend on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Services Started!"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "🌐 Access from any device:"
echo "📱 Frontend: http://$LOCAL_IP:3000"
echo "🔧 Backend:  http://$LOCAL_IP:5000"
echo "🏠 Localhost: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to stop all services
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for services
wait
