/**
 * Sidebar - Hlavní navigace ve stylu Google Ads
 */

import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Sparkles, 
  Video, 
  Palette, 
  FolderOpen, 
  Settings,
  ChevronRight,
  Zap,
  Rocket
} from 'lucide-react'

export type NavigationView = 'dashboard' | 'quickmode' | 'editor' | 'video' | 'brandkits' | 'library' | 'settings'

interface SidebarProps {
  currentView: NavigationView
  onNavigate: (view: NavigationView) => void
  onOpenSettings: () => void
}

const navigationItems = [
  { 
    id: 'dashboard' as const, 
    label: 'Dashboard', 
    icon: LayoutDashboard,
  },
  { 
    id: 'quickmode' as const, 
    label: 'Quick Mode', 
    icon: Rocket,
    badge: 'SOON',
    disabled: true,
  },
  { 
    id: 'editor' as const, 
    label: 'Expert Editor', 
    icon: Sparkles,
  },
  { 
    id: 'video' as const, 
    label: 'Video Studio', 
    icon: Video,
  },
  { 
    id: 'library' as const, 
    label: 'Knihovna', 
    icon: FolderOpen,
  },
  { 
    id: 'brandkits' as const, 
    label: 'Brand Kity', 
    icon: Palette,
  },
]

export function Sidebar({ currentView, onNavigate, onOpenSettings }: SidebarProps) {
  const { creatives } = useAppStore()
  const creativesCount = Object.keys(creatives).length

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">AdCreative</h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">Studio</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <div className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            const isDisabled = 'disabled' in item && item.disabled
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onNavigate(item.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all',
                  isDisabled
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : isActive 
                      ? 'bg-blue-50 text-[#1a73e8]' 
                      : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className={cn(
                  'w-[18px] h-[18px] flex-shrink-0',
                  isDisabled 
                    ? 'text-gray-400'
                    : isActive ? 'text-[#1a73e8]' : 'text-gray-500'
                )} />
                <span className={cn(
                  'text-[13px] font-medium flex-1',
                  isDisabled 
                    ? 'text-gray-400'
                    : isActive ? 'text-[#1a73e8]' : 'text-gray-700'
                )}>
                  {item.label}
                </span>
                {'badge' in item && item.badge && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded',
                    isDisabled
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  )}>
                    {item.badge}
                  </span>
                )}
                {item.id === 'library' && creativesCount > 0 && (
                  <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {creativesCount}
                  </span>
                )}
                {isActive && !isDisabled && (
                  <ChevronRight className="w-4 h-4 text-[#1a73e8]" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
            Vytvořeno
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-gray-900">{creativesCount}</span>
            <span className="text-xs text-gray-500">kreativ</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-2 border-t border-gray-100">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
          <span className="text-[13px] font-medium">Nastavení</span>
        </button>
      </div>
    </aside>
  )
}
