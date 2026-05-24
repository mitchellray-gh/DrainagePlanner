import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

export default function Landscaping({ currentProject, currentPlan, navigate }) {
  if (!currentProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
        <p className="text-slate-500">Create or select a project first.</p>
      </motion.div>
    )
  }

  const landscape = currentPlan?.landscape_integration || currentPlan?.landscaping

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Landscaping Integration</h1>
        <p className="text-slate-500 text-sm mt-1">Landscaping Specialist Module</p>
      </div>

      {!currentPlan ? (
        <div className="section-card text-center py-12">
          <Leaf size={40} className="mx-auto mb-4 text-emerald-400" />
          <h3 className="font-bold text-slate-700 mb-2">Generate a Drainage Plan First</h3>
          <p className="text-slate-500 mb-4">Landscaping recommendations will be included automatically.</p>
          <button onClick={() => navigate('plan')} className="btn-primary">
            Go to Drainage Plan →
          </button>
        </div>
      ) : (
        <div className="section-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Leaf size={18} className="text-emerald-500" /> Landscape Recommendations
          </h3>
          {landscape ? (
            <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap">
              {typeof landscape === 'string' ? landscape : JSON.stringify(landscape, null, 2)}
            </pre>
          ) : (
            <p className="text-slate-500">Landscape data will appear here after plan generation includes it.</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
