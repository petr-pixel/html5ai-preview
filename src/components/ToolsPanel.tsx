/**
 * ToolsPanel - Centrální přístup ke všem AI nástrojům
 * 
 * Integruje:
 * - Creative Scoring AI
 * - AI Copywriter
 * - Magic Resize
 * - Template Library
 * - Landing Page Scanner
 * - Bulk Edit Mode
 * - Mobile Preview
 */

import { useState, ReactNode, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import type { Creative } from '@/types'

// Import tool components
import { CreativeScoring } from './CreativeScoring'
import { AICopywriter } from './AICopywriter'
import { MagicResize } from './MagicResize'
import { TemplateLibrary } from './TemplateLibrary'
import { AIBrandingKit } from './AIBrandingKit'
import { BulkEditMode } from './BulkEditMode'
import { MobilePreview } from './MobilePreview'


// =============================================================================
// ICONS
// =============================================================================

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const WandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm0 0l-.354-3.354M4.5 19.5l15-15" />
  </svg>
)

const ResizeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)

const TemplateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
)

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const TargetIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// =============================================================================
// TYPES
// =============================================================================

type ToolId =
  | 'scoring'
  | 'copywriter'
  | 'magic-resize'
  | 'templates'
  | 'scanner'
  | 'bulk-edit'
  | 'mobile-preview'

interface Tool {
  id: ToolId
  name: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  requiresImage?: boolean
  requiresCreatives?: boolean
  isNew?: boolean
}

interface ToolsPanelProps {
  isOpen: boolean
  onClose: () => void
  previewCreative?: Creative
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TOOLS: Tool[] = [
  {
    id: 'scoring',
    name: 'Creative Scoring',
    description: 'AI analýza a predikce výkonu reklamy',
    icon: TargetIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    requiresImage: true,
  },
  {
    id: 'copywriter',
    name: 'AI Copywriter',
    description: 'Generování headlines a CTA',
    icon: WandIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    isNew: true,
  },
  {
    id: 'magic-resize',
    name: 'Magic Resize',
    description: 'Všechny formáty jedním klikem',
    icon: ResizeIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    requiresImage: true,
  },
  {
    id: 'templates',
    name: 'Knihovna šablon',
    description: 'Předpřipravené šablony podle odvětví',
    icon: TemplateIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    id: 'scanner',
    name: 'Landing Page Scanner',
    description: 'Extrakce barev a textů z webu',
    icon: GlobeIcon,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    id: 'bulk-edit',
    name: 'Hromadné úpravy',
    description: 'Editace více kreativ najednou',
    icon: LayersIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    requiresCreatives: true,
  },
  {
    id: 'mobile-preview',
    name: 'Náhled na zařízení',
    description: 'Simulace na mobilu a tabletu',
    icon: PhoneIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    requiresCreatives: true,
  },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ToolsPanel({ isOpen, onClose, previewCreative }: ToolsPanelProps) {
  const { sourceImage, creatives: storeCreatives } = useAppStore()
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)

  // Konverze objektu na pole
  const creatives = useMemo(() => Object.values(storeCreatives) as Creative[], [storeCreatives])

  if (!isOpen) return null

  const canUseTool = (tool: Tool): boolean => {
    if (tool.requiresImage && !sourceImage) return false
    if (tool.requiresCreatives && creatives.length === 0) return false
    return true
  }

  const handleToolClick = (tool: Tool) => {
    if (!canUseTool(tool)) return
    setActiveTool(tool.id)
  }

  const closeTool = () => {
    setActiveTool(null)
  }

  // Render active tool modal
  const renderActiveTool = () => {
    switch (activeTool) {
      case 'scoring':
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <CreativeScoring imageUrl={sourceImage || undefined} onClose={closeTool} />
          </div>
        )
      case 'copywriter':
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <AICopywriter onClose={closeTool} />
          </div>
        )
      case 'magic-resize':
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <MagicResize onClose={closeTool} />
          </div>
        )
      case 'templates':
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <TemplateLibrary onClose={closeTool} />
          </div>
        )
      case 'scanner':
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <AIBrandingKit onClose={closeTool} />
          </div>
        )
      case 'bulk-edit':
        return (
          <BulkEditMode
            creatives={creatives}
            onClose={closeTool}
          />
        )
      case 'mobile-preview':
        return previewCreative || creatives.length > 0 ? (
          <MobilePreview
            creative={previewCreative || creatives[0]}
            onClose={closeTool}
          />
        ) : null
      default:
        return null
    }
  }

  return (
    <>
      {/* Main Panel */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4" onClick={onClose}>
        <div
          className="bg-[#0F1115]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/20">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Nástroje</h3>
                  <p className="text-sm text-white/50">Automatizace a optimalizace</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <XIcon className="w-5 h-5 text-white/50 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TOOLS.map((tool) => {
                const isEnabled = canUseTool(tool)

                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    disabled={!isEnabled}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border border-white/5 text-left transition-all",
                      isEnabled
                        ? "bg-white/5 hover:bg-white/10 hover:border-violet-500/30 cursor-pointer"
                        : "opacity-40 cursor-not-allowed bg-black/20"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl bg-white/5", tool.color)}>
                      <tool.icon className={cn("w-6 h-6", tool.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{tool.name}</h4>
                        {tool.isNew && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                            NOVÉ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/50 mt-0.5">{tool.description}</p>
                      {!isEnabled && (
                        <p className="text-xs text-orange-600 mt-1">
                          {tool.requiresImage && '⚠️ Vyžaduje obrázek'}
                          {tool.requiresCreatives && '⚠️ Vyžaduje kreativy'}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer tip */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/5 text-center">
            <p className="text-xs text-white/40">
              💡 Tip: Použijte <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] font-mono text-white/70">Ctrl+K</kbd> pro rychlý přístup k nástrojům
            </p>
          </div>
        </div>
      </div>

      {/* Active Tool Modal */}
      {renderActiveTool()}
    </>
  )
}

// =============================================================================
// TOOLBAR BUTTON
// =============================================================================

interface ToolsButtonProps {
  onClick: () => void
}

export function ToolsButton({ onClick }: ToolsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
    >
      <SparklesIcon className="w-4 h-4" />
      <span>AI Nástroje</span>
    </button>
  )
}

export default ToolsPanel
