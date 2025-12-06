/**
 * Dashboard - Přehledová stránka
 */

import { useAppStore } from '@/stores/app-store'
import { 
  Sparkles, Images, Wand2, Download, TrendingUp,
  LayoutDashboard, ArrowRight, Plus
} from 'lucide-react'

interface DashboardProps {
  onNavigate: (view: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { creatives, selectedFormats } = useAppStore()
  const creativesArray = Object.values(creatives)
  
  // Stats
  const thisMonth = creativesArray.filter((c: any) => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const stats = [
    { 
      label: 'Celkem kreativ', 
      value: creativesArray.length, 
      icon: Images, 
      color: 'from-violet-500 to-purple-600',
      change: '+12%'
    },
    { 
      label: 'Tento měsíc', 
      value: thisMonth, 
      icon: TrendingUp, 
      color: 'from-cyan-500 to-blue-600',
      change: '+8%'
    },
    { 
      label: 'Vybraných formátů', 
      value: selectedFormats.size, 
      icon: LayoutDashboard, 
      color: 'from-emerald-500 to-teal-600',
      change: null
    },
  ]

  const quickActions = [
    { 
      label: 'Nová kreativa', 
      description: 'Vygenerovat reklamní banner',
      icon: Wand2, 
      color: 'violet',
      view: 'generator'
    },
    { 
      label: 'Galerie', 
      description: 'Prohlédnout všechny kreativy',
      icon: Images, 
      color: 'cyan',
      view: 'gallery'
    },
    { 
      label: 'AI Copywriter', 
      description: 'Generovat reklamní texty',
      icon: Sparkles, 
      color: 'pink',
      view: 'ai-copywriter'
    },
    { 
      label: 'Export', 
      description: 'Stáhnout kreativy jako ZIP',
      icon: Download, 
      color: 'emerald',
      view: 'export'
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Vítejte zpět 👋
          </h1>
          <p className="text-white/50">
            Zde je přehled vašich kreativ a rychlé akce.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/[0.07] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/50 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-emerald-400 mt-1">{stat.change} tento měsíc</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Decorative gradient */}
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Rychlé akce
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.view)}
                className={`group relative overflow-hidden rounded-2xl bg-${action.color}-500/10 border border-${action.color}-500/20 p-5 text-left hover:bg-${action.color}-500/15 transition-all hover:scale-[1.02]`}
                style={{
                  background: `linear-gradient(135deg, rgba(var(--color-${action.color}), 0.1) 0%, transparent 100%)`,
                }}
              >
                <div className={`w-10 h-10 rounded-xl bg-${action.color}-500/20 flex items-center justify-center mb-3`}>
                  <action.icon className={`w-5 h-5 text-${action.color}-400`} />
                </div>
                <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                <p className="text-sm text-white/50">{action.description}</p>
                
                <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Creatives */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Images className="w-5 h-5 text-cyan-400" />
              Poslední kreativy
            </h2>
            {creativesArray.length > 0 && (
              <button 
                onClick={() => onNavigate('gallery')}
                className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                Zobrazit vše
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {creativesArray.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Images className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 mb-4">Zatím nemáte žádné kreativy</p>
              <button
                onClick={() => onNavigate('generator')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Vytvořit první kreativu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {creativesArray.slice(0, 6).map((creative: any) => (
                <div
                  key={creative.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer"
                  onClick={() => onNavigate('gallery')}
                >
                  {creative.imageUrl ? (
                    <img
                      src={creative.imageUrl}
                      alt={creative.name || 'Creative'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state for more content */}
        <div className="mt-8 text-center text-white/30 text-sm">
          <p>Pro více funkcí navštivte sekci AI Nástroje</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
