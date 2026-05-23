import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map, Loader2, Zap } from 'lucide-react'
import { apiPost } from '../lib/api'

export default function DrainagePlan({ currentProject, currentPlan, setCurrentPlan, showNotification }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  if (!currentProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
        <p className="text-slate-500">Create or select a project first.</p>
      </motion.div>
    )
  }

  const generatePlan = async () => {
    setLoading(true)
    try {
      const data = await apiPost(`/api/plans/generate/${currentProject.id}`, {})
      if (data.success) {
        setResults(data.plan || data)
        if (data.plan) setCurrentPlan(data.plan)
        showNotification('Drainage plan generated!', 'success')
      } else {
        showNotification('Plan generation failed: ' + (data.error || 'Unknown'), 'error')
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Drainage Plan</h1>
          <p className="text-slate-500 text-sm mt-1">Construction Manager Module</p>
        </div>
      </div>

      <div className="section-card mb-6">
        <button onClick={generatePlan} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          Generate Drainage Plan
        </button>
      </div>

      {(results || currentPlan) && (
        <div className="section-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Map size={18} className="text-brand-600" /> Generated Plan
          </h3>
          <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(results || currentPlan, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  )
}
