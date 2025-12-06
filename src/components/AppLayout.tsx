/**
 * AppLayout - Čistý, profesionální layout
 * 
 * Struktura:
 * - Levý sidebar: Logo + Navigace
 * - Hlavní obsah: Header + Content
 */

import { useState } from 'react'
import { 
  Sparkles, LayoutDashboard, Wand2, Images, Settings,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { platforms } from '@/lib/platforms'
import type { PlatformId } from '@/types'

// ============================================================================
// TYPY
// ============================================================================

export type ViewType = 
  | 'dashboard' 
  | 'generator' 
  | 'gallery' 
  | 'settings'

interface AppLayoutProps {
  children: React.ReactNode
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  selectedPlatform: PlatformId
  selectedCategory: string
  onPlatformChange: (platform: PlatformId) => void
  onCategoryChange: (category: string) => void
}

// ============================================================================
// SIDEBAR NAVIGACE
// ============================================================================

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  collapsed: boolean
  onClick: () => void
}

function NavItem({ icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
        active 
          ? 'bg-violet-500/20 text-white' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      )}
    >
      <span className={cn('flex-shrink-0', active ? 'text-violet-400' : 'text-white/50')}>
        {icon}
      </span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  )
}

// ============================================================================
// HLAVNÍ LAYOUT
// ============================================================================

export function AppLayout({
  children,
  currentView,
  onViewChange,
  selectedPlatform,
  selectedCategory,
  onPlatformChange,
  onCategoryChange,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const currentPlatform = platforms[selectedPlatform]

  const navigation = [
    { id: 'dashboard' as ViewType, icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'generator' as ViewType, icon: <Wand2 className="w-5 h-5" />, label: 'Generátor' },
    { id: 'gallery' as ViewType, icon: <Images className="w-5 h-5" />, label: 'Galerie' },
    { id: 'settings' as ViewType, icon: <Settings className="w-5 h-5" />, label: 'Nastavení' },
  ]

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 flex items-center px-4">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-white/70 hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">AdCreative</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:relative z-40 h-full bg-slate-900 border-r border-white/10 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'flex items-center gap-3 p-4 border-b border-white/10',
            sidebarCollapsed && 'justify-center'
          )}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-bold text-white">AdCreative</div>
                <div className="text-xs text-violet-400">Studio Pro</div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={currentView === item.id}
                collapsed={sidebarCollapsed}
                onClick={() => {
                  onViewChange(item.id)
                  setMobileMenuOpen(false)
                }}
              />
            ))}
          </nav>

          {/* Platform Selection - jen pokud je v generátoru */}
          {currentView === 'generator' && !sidebarCollapsed && (
            <div className="p-3 border-t border-white/10">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-3">
                Platforma
              </div>
              <div className="space-y-1">
                {(Object.keys(platforms) as PlatformId[]).map((pid) => {
                  const p = platforms[pid]
                  return (
                    <button
                      key={pid}
                      onClick={() => {
                        onPlatformChange(pid)
                        const firstCat = Object.keys(p.categories)[0]
                        onCategoryChange(firstCat)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left',
                        selectedPlatform === pid
                          ? 'bg-violet-500/20 text-white'
                          : 'text-white/60 hover:bg-white/5'
                      )}
                    >
                      <span>{p.icon}</span>
                      <span className="text-sm font-medium">{p.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Categories */}
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-3 mt-4">
                Kategorie
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentPlatform && Object.entries(currentPlatform.categories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => onCategoryChange(key)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left',
                      selectedCategory === key
                        ? 'bg-violet-500/20 text-white'
                        : 'text-white/60 hover:bg-white/5'
                    )}
                  >
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-xs flex-1 truncate">{cat.name}</span>
                    <span className="text-[10px] text-white/40">{cat.formats?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Collapse Button - desktop only */}
          <div className="hidden lg:block p-3 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Sbalit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'flex-1 flex flex-col overflow-hidden',
        'pt-14 lg:pt-0' // Padding pro mobile header
      )}>
        {children}
      </main>
    </div>
  )
}

export default AppLayout
