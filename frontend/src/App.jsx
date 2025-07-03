import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Categories from './pages/Categories'
import DeployN8n from './pages/DeployN8n'
import Services from './pages/Services'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Categories />} />
          <Route path="/deploy/n8n" element={<DeployN8n />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
