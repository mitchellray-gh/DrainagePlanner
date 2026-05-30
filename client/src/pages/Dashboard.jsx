import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Camera, Ruler, Map as MapIcon, Calendar, Droplets } from 'lucide-react'
import { apiGet } from '../lib/api'

export default function Dashboard({ currentProject, setCurrentProject, setCurrentPlan, navigate, showNotification, hasSubmittedProject, setHasSubmittedProject }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await apiGet('/api/projects')
      if (data.success) {
        setProjects(data.projects)
        if (data.projects?.length > 0) {
          setHasSubmittedProject(true)
          localStorage.setItem('drainageplanner_project_submitted', 'true')
        }
      }
    } catch (err) {
      if (hasSubmittedProject) {
        showNotification('Error loading projects', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectProject = async (id) => {
    try {
      const data = await apiGet(`/api/projects/${id}`)
      if (data.success) {
        setCurrentProject(data.project)
        if (data.project.plans?.length) setCurrentPlan(data.project.plans[0])
        navigate('project')
        showNotification(`Project loaded: ${data.project.name}`, 'success')
      }
    } catch (err) {
      showNotification('Error loading project', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Expert yard drainage planning</p>
        </div>
        <button onClick={() => navigate('project')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Empty state / Welcome */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
            <Droplets size={36} className="text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to DrainagePlanner Pro</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Expert yard drainage planning powered by three disciplines
          </p>

          {/* Expertise cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {[
              { icon: '🏗️', title: 'Construction Manager', desc: 'Pipe sizing, flow calculations, grading specs, materials & cost estimation' },
              { icon: '📐', title: 'Land Surveyor', desc: 'Elevation mapping, slope analysis, contour generation, flow path modeling' },
              { icon: '🌿', title: 'Landscaping Specialist', desc: 'Rain gardens, bioswales, dry creek beds, native plant palettes' },
            ].map((card, i) => (
              <div key={i} className="glass-card p-6 text-left hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500">{card.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('project')} className="btn-primary text-lg px-8 py-3">
            Create Your First Project →
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Projects grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <motion.div
              key={project.id}
              whileHover={{ y: -2 }}
              onClick={() => selectProject(project.id)}
              className="glass-card p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group"
            >
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {project.address || 'No address'}  ·  {project.soil_type || 'Unknown soil'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Camera size={12} /> {project.photo_count || 0}</span>
                <span className="flex items-center gap-1"><Ruler size={12} /> {project.survey_point_count || 0}</span>
                <span className="flex items-center gap-1"><MapIcon size={12} /> {project.plan_count || 0}</span>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                <Calendar size={12} />
                {new Date(project.updated_at).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
