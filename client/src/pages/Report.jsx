import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Printer, ExternalLink } from 'lucide-react'

export default function Report({ currentProject, currentPlan, showNotification }) {
  const [reportHtml, setReportHtml] = useState(null)

  if (!currentProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="text-5xl mb-4">📄</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
        <p className="text-slate-500">Create or select a project first.</p>
      </motion.div>
    )
  }

  const viewReport = async () => {
    if (!currentPlan?.id) return showNotification('Generate a plan first', 'warning')
    window.open(`/api/reports/html/${currentPlan.id}`, '_blank')
  }

  const printReport = () => {
    if (!currentPlan?.id) return showNotification('Generate a plan first', 'warning')
    const win = window.open(`/api/reports/html/${currentPlan.id}`, '_blank')
    win.addEventListener('load', () => win.print())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Drainage Report</h1>
      </div>

      <div className="section-card">
        <div className="flex flex-wrap gap-3">
          <button onClick={viewReport} className="btn-primary flex items-center gap-2">
            <ExternalLink size={18} /> View Full Report
          </button>
          <button onClick={printReport} className="btn-outline flex items-center gap-2">
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>

        {!currentPlan && (
          <p className="mt-4 text-sm text-slate-500">Generate a drainage plan first to view the report.</p>
        )}
      </div>
    </motion.div>
  )
}
