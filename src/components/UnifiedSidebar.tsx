/**
 * Unified Sidebar - Gradient Mesh Design
 * Moderní dark theme s glassmorphism a živými gradienty
 */

import React, { useState } from 'react'
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
  Star,
  Crown,
  Shield,
  ArrowRight,
  Rocket,
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
        <span className={`flex-shrink-0 ${gradient || 'text-violet-400'} transition-colors`}>{icon}</span>
        <span className="flex-1 text-left text-sm font-medium text-white/70 group-hover:text-white/90">{title}</span>
        {badge && (
          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {badge}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border-l-2 border-violet-500 ml-[-1px]' 
          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
      }`}
    >
      <span className={`flex-shrink-0 ${active ? 'text-violet-400' : 'text-white/40'}`}>{icon}</span>
      <div className="flex-1 text-left min-w-0">
        <span className="text-sm font-medium block truncate">{label}</span>
        {description && (
          <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors block truncate">{description}</span>
        )}
      </div>
      {badge && (
        <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {badge}
        </span>
      )}
      {pro && (
        <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
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
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-hide">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedPlatform === platformId 
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
                <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${
                  selectedPlatform === platformId ? 'rotate-90' : ''
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
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                        selectedCategory === catId
                          ? 'bg-violet-500/20 text-violet-300'
                          : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedCategory === catId ? 'bg-violet-400' : 'bg-white/30'}`} />
                      <span className="flex-1 text-left truncate">{category.name}</span>
                      <span className="text-[10px] text-white/30 font-medium flex-shrink-0">
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
          <SidebarItem
            icon={<Smartphone className="w-5 h-5" />}
            label="Mobile Preview"
            description="Náhled jak bude reklama vypadat na mobilu"
            active={currentView === 'mobile-preview'}
            onClick={() => onViewChange('mobile-preview')}
          />
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
// ============================================================================

interface DashboardViewProps {
  onViewChange?: (view: ViewType) => void
  onOpenBrandKit?: () => void
  onExportAll?: () => void
}

export function DashboardView({ onViewChange, onOpenBrandKit, onExportAll }: DashboardViewProps) {
  const { creatives, selectedFormats } = useAppStore()
  
  const creativesArray = Object.values(creatives) as any[]
  
  const stats = [
    { 
      label: 'Kreativy', 
      value: creativesArray.length, 
      icon: Images, 
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'stat-card-icon',
      glow: 'shadow-violet-500/20'
    },
    { 
      label: 'Formáty', 
      value: selectedFormats.size, 
      icon: LayoutGrid, 
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'stat-card-icon-cyan',
      glow: 'shadow-cyan-500/20'
    },
    { 
      label: 'Tento měsíc', 
      value: creativesArray.filter(c => {
        const d = new Date(c.createdAt)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length, 
      icon: Sparkles, 
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'stat-card-icon-green',
      glow: 'shadow-emerald-500/20'
    },
  ]

  return (
    <div className="p-8 min-h-screen mesh-gradient-static">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/50">Vítejte zpět! Zde je přehled vašich kreativ.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className={`glass-card-hover p-6 ${stat.glow} animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50 font-medium">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Creatives */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Images className="w-5 h-5 text-violet-400" />
            Poslední kreativy
          </h2>
          {creativesArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Images className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 text-sm mb-2">Zatím žádné kreativy</p>
              <p className="text-white/30 text-xs">Začněte generovat v sekci Generátor</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {creativesArray.slice(0, 8).map((creative) => (
                <div key={creative.id} className="aspect-square rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 hover:ring-violet-500/50 transition-all cursor-pointer">
                  <img src={creative.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Rychlé akce
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => onViewChange?.('formats')}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">Generátor</div>
                <div className="text-xs text-white/50">Vygenerujte reklamní kreativy</div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </button>
            
            <button 
              onClick={() => onOpenBrandKit?.()}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <ScanLine className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">AI Branding Kit</div>
                <div className="text-xs text-white/50">Extrahovat z webu barvy a texty</div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </button>
            
            <button 
              onClick={() => onExportAll?.()}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">Exportovat vše</div>
                <div className="text-xs text-white/50">Stáhnout všechny kreativy jako ZIP</div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
