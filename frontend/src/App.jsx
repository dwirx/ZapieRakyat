import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Categories from './pages/Categories'
import DeployN8n from './pages/DeployN8n'
import DeployWaha from './pages/DeployWaha'
import DeployPostgreSQL from './pages/DeployPostgreSQL'
import DeployActivePieces from './pages/DeployActivePieces'
import Services from './pages/Services'
import DeploymentMonitor from './components/DeploymentMonitor'
import SystemMonitor from './components/SystemMonitor'
import NotificationCenter from './components/NotificationCenter'
import { SocketProvider } from './contexts/SocketContext'

function App() {
  const [showMonitor, setShowMonitor] = useState(true)

  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Global Notification Center */}
          <div className="fixed top-4 right-4 z-50">
            <NotificationCenter />
          </div>
          
          <Routes>
            <Route path="/" element={<Categories />} />
            <Route path="/deploy/n8n" element={<DeployN8n />} />
            <Route path="/deploy/waha" element={<DeployWaha />} />
            <Route path="/deploy/postgresql" element={<DeployPostgreSQL />} />
            <Route path="/deploy/activepieces" element={<DeployActivePieces />} />
            <Route path="/services" element={<Services />} />
          </Routes>
          
          {showMonitor && (
            <DeploymentMonitor onClose={() => setShowMonitor(false)} />
          )}
          
          <SystemMonitor />
        </div>
      </Router>
    </SocketProvider>
  )
}

export default App
