/**
 * Sidebar - Čistá, minimalistická navigace
 */

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms } from '@/lib/platforms'
import type { PlatformId } from '@/types'
import { cn } from '@/lib/utils'
import {
  Sparkles, LayoutDashboard, Wand2, Images, Settings,
  Brain, Video, Download, ChevronDown, ChevronRight,
  Shield, Menu, X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ViewType = 
  | 'dashboard' 
  | 'generator' 
  | 'gallery' 
  | 'ai-scoring'
  | 'ai-copywriter'
  | 'ai-branding'
  | 'video-slideshow'
  | 'export'
  | 'settings'
  | 'admin'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  platform: PlatformId
  category: string
  onPlatformChange: (platform: PlatformId) => void
  onCategoryChange: (category: string) => void
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

// ============================================================================
// NAV ITEM
// ============================================================================

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: string | number
  onClick?: () => void
  disabled?: boolean
}

function NavItem({ icon, label, active, badge, onClick, disabled }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
        active 
          ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-white border-l-2 border-violet-500' 
          : 'text-white/60 hover:bg-white/5 hover:text-white',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
      )}
    >
      <span className={cn(
        'flex-shrink-0 w-5 h-5',
        active ? 'text-violet-400' : 'text-white/40'
      )}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-violet-500/20 text-violet-300">
          {badge}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// SECTION
// ============================================================================

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

// ============================================================================
// PLATFORM SELECTOR
// ============================================================================

interface PlatformSelectorProps {
  platform: PlatformId
  category: string
  onPlatformChange: (platform: PlatformId) => void
  onCategoryChange: (category: string) => void
}

function PlatformSelector({ platform, category, onPlatformChange, onCategoryChange }: PlatformSelectorProps) {
  const currentPlatform = platforms[platform]
  
  return (
    <div className="px-3 py-3 border-t border-white/10">
      {/* Platform Tabs */}
      <div className="flex gap-1 mb-3">
        {(Object.keys(platforms) as PlatformId[]).map((pid) => {
          const p = platforms[pid]
          const isActive = platform === pid
          return (
            <button
              key={pid}
              onClick={() => {
                onPlatformChange(pid)
                const firstCat = Object.keys(p.categories)[0]
                onCategoryChange(firstCat)
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
              )}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          )
        })}
      </div>

      {/* Categories */}
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {currentPlatform && Object.entries(currentPlatform.categories).map(([key, cat]) => {
          const isActive = category === key
          const isSoon = key === 'branding' || key === 'interscroller'
          
          return (
            <button
              key={key}
              onClick={() => !isSoon && onCategoryChange(key)}
              disabled={isSoon}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-violet-500/15 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/70',
                isSoon && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="flex-1 text-xs truncate">{cat.name}</span>
              <span className="text-[10px] text-white/30">{cat.formats?.length || 0}</span>
              {isSoon && (
                <span className="px-1 py-0.5 text-[8px] bg-amber-500/20 text-amber-400 rounded">
                  SOON
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN SIDEBAR
// ============================================================================

export function Sidebar({
  currentView,
  onViewChange,
  platform,
  category,
  onPlatformChange,
  onCategoryChange,
}: SidebarProps) {
  const { profile } = useAuth()
  const { creatives } = useAppStore()
  const isAdmin = profile?.is_admin === true
  const creativesCount = Object.keys(creatives).length

  return (
    <div className="w-64 h-full flex flex-col bg-slate-900 border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm">AdCreative</div>
          <div className="text-xs bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-medium">
            Studio Pro
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* Main */}
        <NavItem
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
          active={currentView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
        />

        <Section title="Tvorba">
          <NavItem
            icon={<Wand2 className="w-5 h-5" />}
            label="Generátor"
            active={currentView === 'generator'}
            onClick={() => onViewChange('generator')}
          />
          <NavItem
            icon={<Video className="w-5 h-5" />}
            label="Video Studio"
            active={currentView === 'video-slideshow'}
            onClick={() => onViewChange('video-slideshow')}
            badge="BETA"
          />
        </Section>

        <Section title="AI Nástroje">
          <NavItem
            icon={<Sparkles className="w-5 h-5" />}
            label="Creative Scoring"
            active={currentView === 'ai-scoring'}
            onClick={() => onViewChange('ai-scoring')}
          />
          <NavItem
            icon={<Brain className="w-5 h-5" />}
            label="AI Copywriter"
            active={currentView === 'ai-copywriter'}
            onClick={() => onViewChange('ai-copywriter')}
          />
          <NavItem
            icon={<Images className="w-5 h-5" />}
            label="Brand Kit"
            active={currentView === 'ai-branding'}
            onClick={() => onViewChange('ai-branding')}
          />
        </Section>

        <Section title="Assets" defaultOpen={true}>
          <NavItem
            icon={<Images className="w-5 h-5" />}
            label="Galerie"
            active={currentView === 'gallery'}
            onClick={() => onViewChange('gallery')}
            badge={creativesCount > 0 ? creativesCount : undefined}
          />
          <NavItem
            icon={<Download className="w-5 h-5" />}
            label="Export"
            active={currentView === 'export'}
            onClick={() => onViewChange('export')}
          />
        </Section>

        {/* Platform selector - jen v generátoru */}
        {currentView === 'generator' && (
          <PlatformSelector
            platform={platform}
            category={category}
            onPlatformChange={onPlatformChange}
            onCategoryChange={onCategoryChange}
          />
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-0.5">
        <NavItem
          icon={<Settings className="w-5 h-5" />}
          label="Nastavení"
          active={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        {isAdmin && (
          <NavItem
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            active={currentView === 'admin'}
            onClick={() => onViewChange('admin')}
            badge="Admin"
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MOBILE SIDEBAR
// ============================================================================

interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose, ...props }: MobileSidebarProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
        <Sidebar {...props} />
      </div>
    </>
  )
}

// ============================================================================
// MOBILE HEADER
// ============================================================================

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 flex items-center px-4">
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-lg text-white/70 hover:bg-white/10"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white">AdCreative</span>
      </div>
      <div className="w-10" />
    </header>
  )
}

export default Sidebar
