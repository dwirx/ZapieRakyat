import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Categories from './pages/Categories'
import DeployN8n from './pages/DeployN8n'
import DeployWaha from './pages/DeployWaha'
import Services from './pages/Services'
import DeploymentMonitor from './components/DeploymentMonitor'
import SystemMonitor from './components/SystemMonitor'

function App() {
  const [showMonitor, setShowMonitor] = useState(true)

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Categories />} />
          <Route path="/deploy/n8n" element={<DeployN8n />} />
          <Route path="/deploy/waha" element={<DeployWaha />} />
          <Route path="/services" element={<Services />} />
        </Routes>
        
        {showMonitor && (
          <DeploymentMonitor onClose={() => setShowMonitor(false)} />
        )}
        
        <SystemMonitor />
      </div>
    </Router>
  )
}

export default App
