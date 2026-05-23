import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const COLORS = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

export default function Toast({ id, message, type = 'info', onDismiss }) {
  const Icon = ICONS[type] || ICONS.info
  const colors = COLORS[type] || COLORS.info

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-[400px] ${colors}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  )
}
