/**
 * Unified Sidebar - Všechny funkce na jednom místě
 * 
 * Sekce:
 * - Dashboard
 * - Generátor (Quick Mode, Formáty)
 * - AI Nástroje
 * - Assets (Brand Kit, Galerie)
 * - Preview & Export
 * - Nastavení
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms } from '@/lib/platforms'
import { StorageStatusBar } from '@/components/StorageProvider'
import type { PlatformId } from '@/types'
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  Image,
  LayoutGrid,
  Brain,
  FileText,
  Maximize2,
  Layout,
  ScanLine,
  Palette,
  Images,
  FolderOpen,
  Smartphone,
  Edit3,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Video,
  Play,
  Film,
  Star,
  Crown,
  Check,
  Shield,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type ViewType = 
  | 'dashboard'
  | 'quick-mode'
  | 'formats'
  | 'ai-scoring'
  | 'ai-copywriter'
  | 'ai-resize'
  | 'ai-templates'
  | 'ai-scanner'
  | 'brand-kit'
  | 'gallery'
  | 'mobile-preview'
  | 'bulk-edit'
  | 'export'
  | 'video-slideshow'
  | 'video-generator'
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
// SIDEBAR SECTION
// ============================================================================

interface SidebarSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
}

function SidebarSection({ title, icon, children, defaultOpen = false, badge }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-white/40">{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-white/80">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            {badge}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// SIDEBAR ITEM
// ============================================================================

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  badge?: string
  pro?: boolean
  indent?: boolean
}

function SidebarItem({ icon, label, active, onClick, badge, pro, indent }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        indent ? 'ml-4' : ''
      } ${
        active 
          ? 'bg-blue-500/20 text-blue-400' 
          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
      }`}
    >
      <span className={active ? 'text-blue-400' : 'text-white/40'}>{icon}</span>
      <span className="flex-1 text-left text-sm">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
          {badge}
        </span>
      )}
      {pro && (
        <Crown className="w-4 h-4 text-yellow-500" />
      )}
    </button>
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
  const { creatives } = useAppStore()
  const { profile } = useAuth()
  const creativesCount = creatives.length
  const isAdmin = profile?.is_admin === true

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-white/10 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-white text-sm">AdCreative</div>
          <div className="text-xs text-white/40">Studio</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Dashboard */}
        <div className="p-2">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => onViewChange('dashboard')}
          />
        </div>

        {/* Generator */}
        <SidebarSection
          title="Generátor"
          icon={<Wand2 className="w-5 h-5" />}
          defaultOpen={true}
        >
          <SidebarItem
            icon={<Zap className="w-5 h-5" />}
            label="Quick Mode"
            active={currentView === 'quick-mode'}
            onClick={() => onViewChange('quick-mode')}
            badge="Rychlé"
          />
          
          <div className="mt-2 mb-1 px-3">
            <div className="text-xs font-medium text-white/40 uppercase tracking-wider">Platformy</div>
          </div>
          
          {Object.entries(platforms).map(([platformId, platform]) => (
            <div key={platformId}>
              <button
                onClick={() => onPlatformChange(platformId as PlatformId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedPlatform === platformId 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <div 
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: platformId === 'sklik' ? '#cc0000' : '#4285f4',
                    color: 'white'
                  }}
                >
                  {platformId === 'sklik' ? 'S' : 'G'}
                </div>
                <span className="flex-1 text-left text-sm">{platform.name}</span>
                <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${
                  selectedPlatform === platformId ? 'rotate-90' : ''
                }`} />
              </button>
              
              {selectedPlatform === platformId && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {Object.entries(platform.categories).map(([catId, category]) => (
                    <button
                      key={catId}
                      onClick={() => {
                        onCategoryChange(catId)
                        onViewChange('formats')
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        selectedCategory === catId
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {category.name}
                      <span className="ml-auto text-xs text-white/30">
                        {Object.keys(category.formats).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </SidebarSection>

        {/* AI Tools */}
        <SidebarSection
          title="AI Nástroje"
          icon={<Brain className="w-5 h-5" />}
          badge="5"
        >
          <SidebarItem
            icon={<Star className="w-5 h-5" />}
            label="Creative Scoring"
            active={currentView === 'ai-scoring'}
            onClick={() => onViewChange('ai-scoring')}
          />
          <SidebarItem
            icon={<FileText className="w-5 h-5" />}
            label="AI Copywriter"
            active={currentView === 'ai-copywriter'}
            onClick={() => onViewChange('ai-copywriter')}
          />
          <SidebarItem
            icon={<Maximize2 className="w-5 h-5" />}
            label="Magic Resize"
            active={currentView === 'ai-resize'}
            onClick={() => onViewChange('ai-resize')}
          />
          <SidebarItem
            icon={<Layout className="w-5 h-5" />}
            label="Template Library"
            active={currentView === 'ai-templates'}
            onClick={() => onViewChange('ai-templates')}
          />
          <SidebarItem
            icon={<ScanLine className="w-5 h-5" />}
            label="Landing Scanner"
            active={currentView === 'ai-scanner'}
            onClick={() => onViewChange('ai-scanner')}
          />
        </SidebarSection>

        {/* Video */}
        <SidebarSection
          title="Video Studio"
          icon={<Video className="w-5 h-5" />}
        >
          <SidebarItem
            icon={<Play className="w-5 h-5" />}
            label="Slideshow Builder"
            active={currentView === 'video-slideshow'}
            onClick={() => onViewChange('video-slideshow')}
          />
          <SidebarItem
            icon={<Film className="w-5 h-5" />}
            label="AI Video"
            active={currentView === 'video-generator'}
            onClick={() => onViewChange('video-generator')}
            pro
          />
        </SidebarSection>

        {/* Assets */}
        <SidebarSection
          title="Assets"
          icon={<FolderOpen className="w-5 h-5" />}
          defaultOpen={true}
        >
          <SidebarItem
            icon={<Palette className="w-5 h-5" />}
            label="Brand Kit"
            active={currentView === 'brand-kit'}
            onClick={() => onViewChange('brand-kit')}
          />
          <SidebarItem
            icon={<Images className="w-5 h-5" />}
            label="Galerie"
            active={currentView === 'gallery'}
            onClick={() => onViewChange('gallery')}
            badge={creativesCount > 0 ? String(creativesCount) : undefined}
          />
        </SidebarSection>

        {/* Preview & Export */}
        <SidebarSection
          title="Preview & Export"
          icon={<Download className="w-5 h-5" />}
        >
          <SidebarItem
            icon={<Smartphone className="w-5 h-5" />}
            label="Mobile Preview"
            active={currentView === 'mobile-preview'}
            onClick={() => onViewChange('mobile-preview')}
          />
          <SidebarItem
            icon={<Edit3 className="w-5 h-5" />}
            label="Bulk Edit"
            active={currentView === 'bulk-edit'}
            onClick={() => onViewChange('bulk-edit')}
          />
          <SidebarItem
            icon={<Download className="w-5 h-5" />}
            label="Export"
            active={currentView === 'export'}
            onClick={() => onViewChange('export')}
          />
        </SidebarSection>
      </nav>

      {/* Bottom - Settings */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <SidebarItem
          icon={<Settings className="w-5 h-5" />}
          label="Nastavení"
          active={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        {isAdmin && (
          <SidebarItem
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            active={currentView === 'admin'}
            onClick={() => onViewChange('admin')}
            badge="Admin"
          />
        )}
      </div>

      {/* Storage Status */}
      <div className="px-3 pb-2">
        <StorageStatusBar />
      </div>

      {/* Pro Banner */}
      <div className="p-3 m-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-white text-sm">Upgrade na Pro</span>
        </div>
        <p className="text-xs text-white/60 mb-3">
          Neomezené generování, všechny formáty, bez watermarku
        </p>
        <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm font-medium text-white hover:from-purple-600 hover:to-blue-600 transition-colors">
          499 Kč/měsíc
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

export function DashboardView() {
  const { creatives, selectedFormats } = useAppStore()
  
  const stats = [
    { label: 'Kreativy', value: creatives.length, icon: Images, color: 'from-blue-500 to-cyan-500' },
    { label: 'Formáty', value: selectedFormats.size, icon: LayoutGrid, color: 'from-purple-500 to-pink-500' },
    { label: 'Tento měsíc', value: creatives.filter(c => {
      const d = new Date(c.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length, icon: Sparkles, color: 'from-green-500 to-emerald-500' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Creatives */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Poslední kreativy</h2>
          {creatives.length === 0 ? (
            <p className="text-white/50 text-sm">Zatím žádné kreativy. Začněte generovat!</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {creatives.slice(0, 8).map((creative) => (
                <div key={creative.id} className="aspect-square rounded-lg overflow-hidden bg-white/10">
                  <img src={creative.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Rychlé akce</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-white font-medium">Quick Mode</div>
                <div className="text-xs text-white/50">Vygenerujte kreativy rychle</div>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
              <Palette className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-white font-medium">Nastavit Brand Kit</div>
                <div className="text-xs text-white/50">Barvy, fonty, loga</div>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
              <Download className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-white font-medium">Exportovat vše</div>
                <div className="text-xs text-white/50">Stáhnout jako ZIP</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
