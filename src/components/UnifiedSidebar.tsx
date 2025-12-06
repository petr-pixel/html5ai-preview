/**
 * Unified Sidebar - Clean Dark Design
 * Jednoduchý, čistý sidebar s gradienty
 */

import React, { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms } from '@/lib/platforms'
import type { PlatformId, Platform } from '@/types'
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  Brain,
  FileText,
  Maximize2,
  Layout,
  Images,
  FolderOpen,
  Smartphone,
  Edit3,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Video,
  Play,
  Shield,
  Eye,
  HardDrive,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ViewType = 
  | 'dashboard'
  | 'formats'
  | 'ai-scoring'
  | 'ai-copywriter'
  | 'ai-resize'
  | 'ai-templates'
  | 'ai-branding'
  | 'gallery'
  | 'mobile-preview'
  | 'bulk-edit'
  | 'export'
  | 'video-slideshow'
  | 'settings'
  | 'admin'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  selectedPlatform: PlatformId
  selectedCategory: string | null
  onPlatformChange: (platform: PlatformId) => void
  onCategoryChange: (category: string) => void
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}

function Section({ title, icon, children, defaultOpen = false, badge }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <span className="text-white/50">{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-white/70">{title}</span>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-500/20 text-violet-300">
            {badge}
          </span>
        )}
        {open ? (
          <ChevronDown className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30" />
        )}
      </button>
      {open && <div className="mt-1 ml-2 space-y-0.5">{children}</div>}
    </div>
  )
}

// ============================================================================
// NAV ITEM
// ============================================================================

interface NavItemProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  active?: boolean
  onClick: () => void
  badge?: string
}

function NavItem({ icon, label, sublabel, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active
          ? 'bg-violet-500/20 text-white border-l-2 border-violet-500 ml-0 pl-[10px]'
          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
      }`}
    >
      <span className={active ? 'text-violet-400' : 'text-white/40'}>{icon}</span>
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {sublabel && <div className="text-[10px] text-white/40 truncate">{sublabel}</div>}
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-300">
          {badge}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// PLATFORM BUTTON
// ============================================================================

interface PlatformButtonProps {
  platform: Platform
  platformId: PlatformId
  active: boolean
  onClick: () => void
}

function PlatformButton({ platform, platformId, active, onClick }: PlatformButtonProps) {
  const colors: Record<PlatformId, string> = {
    sklik: 'from-red-600 to-red-500',
    google: 'from-blue-500 to-green-500',
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full ${
        active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'
      }`}
    >
      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${colors[platformId]} flex items-center justify-center`}>
        <span className="text-[10px] font-bold text-white">{platform.name[0]}</span>
      </div>
      <span className="text-sm font-medium">{platform.name}</span>
    </button>
  )
}

// ============================================================================
// CATEGORY TABS
// ============================================================================

interface CategoryTabsProps {
  platform: Platform | undefined
  selectedCategory: string | null
  onCategoryChange: (category: string) => void
}

function CategoryTabs({ platform, selectedCategory, onCategoryChange }: CategoryTabsProps) {
  if (!platform?.categories) return null
  
  const categories = Object.keys(platform.categories)
  
  return (
    <div className="flex flex-wrap gap-1 px-2 py-2">
      {categories.map((cat) => {
        const category = platform.categories[cat]
        const formatCount = category?.formats?.length || 0
        const isActive = selectedCategory === cat
        
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-2 py-1 text-xs rounded-md transition-all ${
              isActive
                ? 'bg-violet-500/30 text-violet-200 border border-violet-500/50'
                : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
            }`}
          >
            {category?.name || cat}
            <span className="ml-1 text-[10px] opacity-60">{formatCount}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// STORAGE BAR
// ============================================================================

function StorageBar() {
  const { creatives } = useAppStore()
  const count = Object.keys(creatives).length
  
  return (
    <div className="px-3 py-3 border-t border-white/5">
      <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5">
        <span className="flex items-center gap-1">
          <HardDrive className="w-3 h-3" />
          {count} kreativ
        </span>
        <span>0 B / 500 MB</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
          style={{ width: '0%' }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN SIDEBAR
// ============================================================================

export function UnifiedSidebar({
  currentView,
  onViewChange,
  selectedPlatform,
  selectedCategory,
  onPlatformChange,
  onCategoryChange,
}: SidebarProps) {
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin === true

  const currentPlatformData = platforms[selectedPlatform]

  return (
    <div className="w-64 h-screen flex flex-col bg-slate-950 border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm">AdCreative</div>
          <div className="text-xs font-medium bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Studio Pro
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-3" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Dashboard */}
        <NavItem
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
          sublabel="Přehled a statistiky"
          active={currentView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
        />

        {/* Generator Section */}
        <Section title="Generátor" icon={<Wand2 className="w-5 h-5" />} defaultOpen={true}>
          <div className="px-1 py-1">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 px-2">
              Platformy
            </div>
            {(Object.keys(platforms) as PlatformId[]).map((pid) => (
              <PlatformButton
                key={pid}
                platform={platforms[pid]}
                platformId={pid}
                active={selectedPlatform === pid}
                onClick={() => onPlatformChange(pid)}
              />
            ))}
          </div>
          
          {/* Categories */}
          <div className="mt-2">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-3">
              Kategorie
            </div>
            <CategoryTabs
              platform={currentPlatformData}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
            />
          </div>
        </Section>

        {/* AI Tools */}
        <Section title="AI Nástroje" icon={<Brain className="w-5 h-5" />} badge="5">
          <NavItem
            icon={<Sparkles className="w-4 h-4" />}
            label="Creative Scoring"
            active={currentView === 'ai-scoring'}
            onClick={() => onViewChange('ai-scoring')}
          />
          <NavItem
            icon={<FileText className="w-4 h-4" />}
            label="AI Copywriter"
            active={currentView === 'ai-copywriter'}
            onClick={() => onViewChange('ai-copywriter')}
          />
          <NavItem
            icon={<Maximize2 className="w-4 h-4" />}
            label="Magic Resize"
            active={currentView === 'ai-resize'}
            onClick={() => onViewChange('ai-resize')}
          />
          <NavItem
            icon={<Layout className="w-4 h-4" />}
            label="Template Library"
            active={currentView === 'ai-templates'}
            onClick={() => onViewChange('ai-templates')}
          />
          <NavItem
            icon={<Images className="w-4 h-4" />}
            label="Brand Kit"
            active={currentView === 'ai-branding'}
            onClick={() => onViewChange('ai-branding')}
            badge="SOON"
          />
        </Section>

        {/* Video Studio */}
        <Section title="Video Studio" icon={<Video className="w-5 h-5" />}>
          <NavItem
            icon={<Play className="w-4 h-4" />}
            label="Slideshow Builder"
            active={currentView === 'video-slideshow'}
            onClick={() => onViewChange('video-slideshow')}
          />
        </Section>

        {/* Assets */}
        <Section title="Assets" icon={<FolderOpen className="w-5 h-5" />} defaultOpen={true}>
          <NavItem
            icon={<Images className="w-4 h-4" />}
            label="Galerie"
            sublabel="Vygenerované kreativy"
            active={currentView === 'gallery'}
            onClick={() => onViewChange('gallery')}
          />
        </Section>

        {/* Preview & Export */}
        <Section title="Preview & Export" icon={<Eye className="w-5 h-5" />}>
          <NavItem
            icon={<Smartphone className="w-4 h-4" />}
            label="Mobile Preview"
            active={currentView === 'mobile-preview'}
            onClick={() => onViewChange('mobile-preview')}
          />
          <NavItem
            icon={<Edit3 className="w-4 h-4" />}
            label="Bulk Edit"
            active={currentView === 'bulk-edit'}
            onClick={() => onViewChange('bulk-edit')}
          />
          <NavItem
            icon={<Download className="w-4 h-4" />}
            label="Export"
            active={currentView === 'export'}
            onClick={() => onViewChange('export')}
          />
        </Section>

        {/* Divider */}
        <div className="h-px bg-white/10 my-2" />

        {/* Settings & Admin */}
        <NavItem
          icon={<Settings className="w-5 h-5" />}
          label="Nastavení"
          sublabel="API klíče, storage, formáty"
          active={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        
        {isAdmin && (
          <NavItem
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            sublabel="Správa uživatelů"
            active={currentView === 'admin'}
            onClick={() => onViewChange('admin')}
            badge="Admin"
          />
        )}
      </nav>

      {/* Storage Status */}
      <StorageBar />
    </div>
  )
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

interface DashboardViewProps {
  onViewChange?: (view: ViewType) => void
  onOpenBrandKit?: () => void
  onExportAll?: () => void
}

export function DashboardView({ onViewChange, onOpenBrandKit, onExportAll }: DashboardViewProps) {
  const { creatives, selectedFormats } = useAppStore()
  const creativesArray = Object.values(creatives)
  
  const thisMonth = creativesArray.filter(c => {
    if (!c || typeof c !== 'object') return false
    const d = new Date((c as any).createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const stats = [
    { label: 'Kreativy', value: creativesArray.length, icon: Images, color: 'from-violet-500 to-purple-600' },
    { label: 'Formáty', value: selectedFormats.size, icon: LayoutDashboard, color: 'from-cyan-500 to-blue-600' },
    { label: 'Tento měsíc', value: thisMonth, icon: Sparkles, color: 'from-emerald-500 to-teal-600' },
  ]

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/50">Vítejte zpět! Zde je přehled vašich kreativ.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Creatives */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Poslední kreativy
          </h3>
          {creativesArray.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Zatím žádné kreativy</p>
              <p className="text-sm text-white/30 mt-1">Začněte generovat v sekci Generátor</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creativesArray.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded bg-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{c.name || 'Kreativa'}</div>
                    <div className="text-xs text-white/40">{c.format?.name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-pink-400" />
            Rychlé akce
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onViewChange?.('formats')}
              className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 transition-colors text-left"
            >
              <Wand2 className="w-6 h-6 text-violet-400 mb-2" />
              <div className="text-sm font-medium text-white">Nová kreativa</div>
            </button>
            <button
              onClick={() => onViewChange?.('gallery')}
              className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors text-left"
            >
              <Images className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-sm font-medium text-white">Galerie</div>
            </button>
            <button
              onClick={() => onOpenBrandKit?.() || onViewChange?.('ai-branding')}
              className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 transition-colors text-left"
            >
              <Images className="w-6 h-6 text-pink-400 mb-2" />
              <div className="text-sm font-medium text-white">Brand Kit</div>
            </button>
            <button
              onClick={() => onExportAll?.() || onViewChange?.('export')}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-left"
            >
              <Download className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="text-sm font-medium text-white">Export</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedSidebar
