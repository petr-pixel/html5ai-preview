/**
 * AdCreative Studio - Main Application
 * 
 * Architektura:
 * - Levý Sidebar s navigací
 * - Kontextový editor podle typu kategorie (image/branding/video)
 * - Google Ads Light Style
 */

import React, { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey, getCategoryType, isBrandingCategory, isVideoCategory, getMaxSizeKB, parseFormatKey } from '@/lib/platforms'
import { generateId, cn, loadImage, drawRoundedRect } from '@/lib/utils'
import { outpaintImage } from '@/lib/openai-client'
import { UnifiedSidebar, type ViewType } from '@/components/UnifiedSidebar'
import { DashboardView } from '@/components/DashboardView'
import { DesktopLayout } from '@/layouts/DesktopLayout' // Layout import
import { buildEnhancedPrompt } from '@/lib/prompt-utils'
import { SettingsModal } from '@/components/SettingsModal'
import { GeneratorView } from '@/components/GeneratorView'
import { GalleryView } from '@/components/GalleryView'
import { AIBrandingKit } from '@/components/AIBrandingKit'
import { SlideshowBuilder } from '@/components/SlideshowBuilder'
import { TemplateLibrary } from '@/components/TemplateLibrary'
import { AICopywriter } from '@/components/AICopywriter'
import { CreativeScoring } from '@/components/CreativeScoring'
import { MagicResize } from '@/components/MagicResize'
import { MobilePreview } from '@/components/MobilePreview'
import { BulkEditMode } from '@/components/BulkEditMode'
import { ToolsPanel } from '@/components/ToolsPanel'
import { UserMenu } from '@/components/Auth'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { useStorageSync } from '@/hooks/useStorageSync'
import { CostEstimate, CostBadge, calculateCost, formatPrice } from '@/components/CostEstimate'
import { PRICING } from '@/lib/openai-client'
import { Button, Progress, Spinner } from '@/components/ui'
import {
  Sparkles,
  Upload,
  Download,
  Check,
  Image as ImageIcon,
  AlertTriangle,
  ChevronDown,
  Wand2,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react'
import type { Creative, TextOverlay, PlatformId, CategoryType } from '@/types'

// ============================================================================
// ENHANCED PROMPT BUILDER - Pro GPT-4o image generation
// ============================================================================



// ============================================================================
// MAIN APP
// ============================================================================

export function AppContent() {
  // Storage synchronization
  useStorageSync()

  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<{ key: string; format: any } | null>(null)
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut for tools panel (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setToolsPanelOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Store
  const {
    platform,
    category,
    prompt,
    sourceFormat,
    sourceImage,
    selectedFormats,
    creatives,
    textOverlay,
    watermark,
    qrCode,
    isGenerating,
    progress,
    apiKeys,
    imageModelTier,
    textModelTier,
    brandKits,
    activeBrandKit,
    cropMode,
    formatOffsets,
    perFormatTextSettings,
    outpaintedImages,
    setPlatform,
    setCategory,
    setPrompt,
    setSourceFormat,
    setSourceImage,
    setCropMode,
    toggleFormat,
    selectAllFormats,
    clearSelection,
    addCreatives,
    setTextOverlay,
    setWatermark,
    addToHistory,
    setIsGenerating,
    setProgress,
  } = useAppStore()

  // Derived state
  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const categoryType = getCategoryType(platform, category)
  const maxSizeKB = getMaxSizeKB(platform, category)

  const currentBrandKit = activeBrandKit
    ? brandKits.find(kit => kit.id === activeBrandKit)
    : brandKits.find(kit => kit.isDefault)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const renderVideoStudio = () => (
    <div className="flex-1 overflow-hidden mesh-gradient-static">
      <SlideshowBuilder />
    </div>
  )

  const renderLibrary = () => (
    <div className="flex-1 overflow-y-auto mesh-gradient-static">
      <GalleryView />
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const handleExport = async () => {
    const creativeList = Object.values(creatives) as Creative[]
    if (creativeList.length === 0) return

    try {
      const blob = await createCreativePackZip(creativeList)
      downloadBlob(blob, 'adcreative-export.zip')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <DesktopLayout currentView={currentView} onViewChange={setCurrentView}>
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <DashboardView
            onViewChange={setCurrentView}
            onOpenBrandKit={() => setCurrentView('ai-branding')}
            onExportAll={handleExport}
          />
        )}
        {/* Generator */}
        {currentView === 'formats' && (
          <GeneratorView
            onOpenSettings={() => setSettingsOpen(true)}
            onViewChange={setCurrentView}
          />
        )}
        {/* Video */}
        {currentView === 'video-slideshow' && (
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <SlideshowBuilder />
          </div>
        )}
        {/* Assets */}
        {currentView === 'gallery' && renderLibrary()}

        {/* AI Tools */}
        {currentView === 'ai-branding' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <AIBrandingKit />
          </div>
        )}
        {currentView === 'ai-templates' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <TemplateLibrary />
          </div>
        )}

        {currentView === 'ai-copywriter' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <AICopywriter />
          </div>
        )}
        {currentView === 'ai-scoring' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <CreativeScoring />
          </div>
        )}
        {currentView === 'ai-resize' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <MagicResize />
          </div>
        )}
        {/* Settings */}
        {currentView === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <SettingsModal open={true} onOpenChange={() => setCurrentView('dashboard')} />
          </div>
        )}

        {/* Mobile Preview */}
        {currentView === 'mobile-preview' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <MobilePreview />
          </div>
        )}

        {/* Bulk Edit */}
        {currentView === 'bulk-edit' && (
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <BulkEditMode />
          </div>
        )}

        {/* Export */}
        {currentView === 'export' && renderLibrary()}
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />



      {/* Tools Panel (Ctrl+K) */}
      <ToolsPanel
        isOpen={toolsPanelOpen}
        onClose={() => setToolsPanelOpen(false)}
      />

      {/* Floating User Menu */}
      <div className="absolute top-4 right-4 z-30">
        <UserMenu
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSubscription={() => setCurrentView('settings')}
        />
      </div>
    </DesktopLayout >
  )
}
