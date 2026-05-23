import { LayoutDashboard, ClipboardList, Ruler, Camera, FlaskConical, Map, Leaf, FileText, HardHat, Compass, Trees } from 'lucide-react'

const ICON_MAP = {
  LayoutDashboard, ClipboardList, Ruler, Camera, FlaskConical, Map, Leaf, FileText
}

export default function Sidebar({ panels, activePanel, onNavigate, isOpen, onToggle }) {
  return (
    <aside className={`
      fixed top-0 left-0 bottom-0 w-64 bg-sidebar z-40
      flex flex-col transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
    `}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg">
          🌧️
        </div>
        <div>
          <div className="font-bold text-white text-sm">DrainagePlanner</div>
          <div className="text-xs text-slate-400">Pro v2.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {panels.map(panel => {
          const Icon = ICON_MAP[panel.icon]
          const isActive = activePanel === panel.id
          return (
            <button
              key={panel.id}
              onClick={() => onNavigate(panel.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 text-left
                ${isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-900/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {Icon && <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />}
              {panel.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-2">
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-slate-400">
            <HardHat size={12} /> CM
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-slate-400">
            <Compass size={12} /> LS
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-slate-400">
            <Trees size={12} /> LA
          </span>
        </div>
      </div>
    </aside>
  )
}
