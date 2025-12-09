/**
 * Unified Sidebar - Gradient Mesh Design
 * Moderní dark theme s glassmorphism a živými gradienty
 */

import React, { useState } from 'react'
// framer-motion removed
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms } from '@/lib/platforms'
import { StorageStatusBar } from '@/components/StorageProvider'
import { UsageBanner } from '@/components/UsageBanner'
import type { PlatformId } from '@/types'
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  Brain,
  FileText,
  Maximize2,
  Layout,
  ScanLine,
  Images,
  FolderOpen,
  Edit3,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Video,
  Play,
  Star,
  Crown,
  Shield,
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
// SIDEBAR SECTION
// ============================================================================

interface SidebarSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
  gradient?: string
}

function SidebarSection({ title, icon, children, defaultOpen = false, badge, gradient }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 group"
      >
        <span className={`${gradient || 'text-violet-400'} transition-colors`}>{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-white/70 group-hover:text-white/90">{title}</span>
        {badge && (
          <span className="badge-gradient text-[10px]">
            {badge}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-2 pb-2 pt-1">
          {children}
        </div>
      )}
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
  description?: string
}

function SidebarItem({ icon, label, active, onClick, badge, pro, description }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={description}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active
        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border-l-2 border-violet-500 ml-[-1px]'
        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
        }`}
    >
      <span className={active ? 'text-violet-400' : 'text-white/40'}>{icon}</span>
      <div className="flex-1 text-left">
        <span className="text-sm font-medium block">{label}</span>
        {description && (
          <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors line-clamp-1">{description}</span>
        )}
      </div>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {badge}
        </span>
      )}
      {pro && (
        <Crown className="w-4 h-4 text-amber-400" />
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
  const creativesCount = Object.keys(creatives).length
  const isAdmin = profile?.is_admin === true

  // Debug log pro admin status
  console.log('🔐 Sidebar - Profile:', profile, 'isAdmin:', isAdmin)

  return (
    <div className="w-64 h-screen flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-4 py-5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 blur-lg opacity-40 animate-pulse" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight">AdCreative</div>
          <div className="text-xs font-medium text-gradient">Studio Pro</div>
        </div>
      </div>

      {/* Divider */}
      <div className="divider mx-4 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {/* Dashboard */}
        <div className="mb-2">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            description="Přehled a statistiky projektu"
            active={currentView === 'dashboard'}
            onClick={() => onViewChange('dashboard')}
          />
        </div>

        {/* Generator */}
        <SidebarSection
          title="Generátor"
          icon={<Wand2 className="w-5 h-5" />}
          defaultOpen={true}
          gradient="text-pink-400"
        >
          <div className="mb-2 px-3">
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Platformy</div>
          </div>

          {Object.entries(platforms).map(([platformId, platform]) => (
            <div key={platformId} className="mb-1">
              <button
                onClick={() => onPlatformChange(platformId as PlatformId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${selectedPlatform === platformId
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                  }`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg"
                  style={{
                    background: platformId === 'sklik'
                      ? 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)'
                      : 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                    boxShadow: platformId === 'sklik'
                      ? '0 4px 12px rgba(204, 0, 0, 0.3)'
                      : '0 4px 12px rgba(66, 133, 244, 0.3)',
                  }}
                >
                  {platformId === 'sklik' ? 'S' : 'G'}
                </div>
                <span className="flex-1 text-left text-sm font-medium">{platform.name}</span>
                <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${selectedPlatform === platformId ? 'rotate-90' : ''
                  }`} />
              </button>

              {selectedPlatform === platformId && (
                <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {Object.entries(platform.categories).map(([catId, category]) => (
                    <button
                      key={catId}
                      onClick={() => {
                        onCategoryChange(catId)
                        onViewChange('formats')
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${selectedCategory === catId
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === catId ? 'bg-violet-400' : 'bg-white/30'}`} />
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className="text-[10px] text-white/30 font-medium">
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
          gradient="text-cyan-400"
        >
          <SidebarItem
            icon={<Star className="w-5 h-5" />}
            label="Creative Scoring"
            description="AI hodnocení kvality a efektivity reklamy"
            active={currentView === 'ai-scoring'}
            onClick={() => onViewChange('ai-scoring')}
          />
          <SidebarItem
            icon={<FileText className="w-5 h-5" />}
            label="AI Copywriter"
            description="Generování textů pro reklamy pomocí AI"
            active={currentView === 'ai-copywriter'}
            onClick={() => onViewChange('ai-copywriter')}
          />
          <SidebarItem
            icon={<Maximize2 className="w-5 h-5" />}
            label="Magic Resize"
            description="Automatický resize do všech formátů"
            active={currentView === 'ai-resize'}
            onClick={() => onViewChange('ai-resize')}
          />
          <SidebarItem
            icon={<Layout className="w-5 h-5" />}
            label="Template Library"
            description="Knihovna předpřipravených šablon"
            active={currentView === 'ai-templates'}
            onClick={() => onViewChange('ai-templates')}
          />
          <SidebarItem
            icon={<ScanLine className="w-5 h-5" />}
            label="AI Branding Kit"
            description="Analýza webu a extrakce brand prvků"
            active={currentView === 'ai-branding'}
            onClick={() => onViewChange('ai-branding')}
          />
        </SidebarSection>

        {/* Video */}
        <SidebarSection
          title="Video Studio"
          icon={<Video className="w-5 h-5" />}
          gradient="text-pink-400"
        >
          <SidebarItem
            icon={<Play className="w-5 h-5" />}
            label="Slideshow Builder"
            description="Vytvořit video slideshow z obrázků"
            active={currentView === 'video-slideshow'}
            onClick={() => onViewChange('video-slideshow')}
          />
        </SidebarSection>

        {/* Assets */}
        <SidebarSection
          title="Assets"
          icon={<FolderOpen className="w-5 h-5" />}
          defaultOpen={true}
          gradient="text-emerald-400"
        >
          <SidebarItem
            icon={<Images className="w-5 h-5" />}
            label="Galerie"
            description="Všechny vygenerované kreativy"
            active={currentView === 'gallery'}
            onClick={() => onViewChange('gallery')}
            badge={creativesCount > 0 ? String(creativesCount) : undefined}
          />
        </SidebarSection>

        {/* Preview & Export */}
        <SidebarSection
          title="Preview & Export"
          icon={<Download className="w-5 h-5" />}
          gradient="text-amber-400"
        >
          {/* Removed Mobile Preview */}
          <SidebarItem
            icon={<Edit3 className="w-5 h-5" />}
            label="Bulk Edit"
            description="Hromadné úpravy více kreativ najednou"
            active={currentView === 'bulk-edit'}
            onClick={() => onViewChange('bulk-edit')}
          />
          <SidebarItem
            icon={<Download className="w-5 h-5" />}
            label="Export"
            description="Stáhnout kreativy jako ZIP nebo jednotlivě"
            active={currentView === 'export'}
            onClick={() => onViewChange('export')}
          />
        </SidebarSection>
      </nav>

      {/* Divider */}
      <div className="divider mx-4 my-2" />

      {/* Bottom - Settings */}
      <div className="px-2 space-y-1">
        <SidebarItem
          icon={<Settings className="w-5 h-5" />}
          label="Nastavení"
          description="API klíče, storage, formáty"
          active={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        {isAdmin && (
          <SidebarItem
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            description="Správa uživatelů a statistiky"
            active={currentView === 'admin'}
            onClick={() => onViewChange('admin')}
            badge="Admin"
          />
        )}
      </div>

      {/* Storage Status */}
      <div className="px-3 py-2">
        <StorageStatusBar />
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD VIEW - Gradient Mesh Style
