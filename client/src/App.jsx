import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ProjectSetup from './pages/ProjectSetup'
import Survey from './pages/Survey'
import Photos from './pages/Photos'
import Analysis from './pages/Analysis'
import DrainagePlan from './pages/DrainagePlan'
import Landscaping from './pages/Landscaping'
import Report from './pages/Report'
import ChatOverlay from './components/ChatOverlay'
import Toast from './components/Toast'

const PANELS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'project', label: 'Project Setup', icon: 'ClipboardList' },
  { id: 'survey', label: 'Survey & Topo', icon: 'Ruler' },
  { id: 'photos', label: 'Site Photos', icon: 'Camera' },
  { id: 'analysis', label: 'Analysis', icon: 'FlaskConical' },
  { id: 'plan', label: 'Drainage Plan', icon: 'Map' },
  { id: 'landscape', label: 'Landscaping', icon: 'Leaf' },
  { id: 'report', label: 'Report', icon: 'FileText' },
]

export default function App() {
  const [activePanel, setActivePanel] = useState('dashboard')
  const [currentProject, setCurrentProject] = useState(null)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [toasts, setToasts] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const navigate = useCallback((panel) => {
    setActivePanel(panel)
    setSidebarOpen(false)
  }, [])

  const renderPanel = () => {
    const props = { currentProject, setCurrentProject, currentPlan, setCurrentPlan, showNotification, navigate }
    switch (activePanel) {
      case 'dashboard': return <Dashboard {...props} />
      case 'project': return <ProjectSetup {...props} />
      case 'survey': return <Survey {...props} />
      case 'photos': return <Photos {...props} />
      case 'analysis': return <Analysis {...props} />
      case 'plan': return <DrainagePlan {...props} />
      case 'landscape': return <Landscaping {...props} />
      case 'report': return <Report {...props} />
      default: return <Dashboard {...props} />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        panels={PANELS}
        activePanel={activePanel}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            DrainagePlanner Pro
          </span>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {renderPanel()}
          </AnimatePresence>
        </div>
      </main>

      {/* Chat Overlay */}
      <ChatOverlay />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => <Toast key={t.id} {...t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
        </AnimatePresence>
      </div>
    </div>
  )
}
