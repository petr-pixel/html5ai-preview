/**
 * BulkEditMode - Hromadné úpravy kreativ
 * 
 * Funkce:
 * - Výběr více kreativ
 * - Změna CTA barvy na všech
 * - Změna textu na všech
 * - Regenerace vybraných
 * - Hromadný export
 */

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import type { Creative } from '@/types'

// =============================================================================
// ICONS
// =============================================================================

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const PaletteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
)

const TypeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
)

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

interface BulkEditModeProps {
  creatives?: Creative[]
  onClose?: () => void
  onExport?: (selected: Creative[]) => void
}

type EditAction = 'cta-color' | 'cta-text' | 'headline' | 'delete'

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BulkEditMode({ creatives: propCreatives, onClose, onExport }: BulkEditModeProps) {
  const { creatives: storeCreatives, removeCreative, textOverlay, setTextOverlay } = useAppStore()
  
  // Použít předané creatives nebo ze store
  const creatives = propCreatives ?? storeCreatives
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeAction, setActiveAction] = useState<EditAction | null>(null)
  const [newCtaColor, setNewCtaColor] = useState(textOverlay.ctaColor || '#f97316')
  const [newCtaText, setNewCtaText] = useState(textOverlay.cta || 'Zjistit více')
  const [newHeadline, setNewHeadline] = useState(textOverlay.headline || '')
  
  const selectedCreatives = useMemo(() => 
    creatives.filter(c => selectedIds.has(c.id)),
    [creatives, selectedIds]
  )
  
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  const selectAll = () => {
    if (selectedIds.size === creatives.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(creatives.map(c => c.id)))
    }
  }
  
  const applyChanges = () => {
    switch (activeAction) {
      case 'cta-color':
        setTextOverlay({ ...textOverlay, ctaColor: newCtaColor })
        break
      case 'cta-text':
        setTextOverlay({ ...textOverlay, cta: newCtaText })
        break
      case 'headline':
        setTextOverlay({ ...textOverlay, headline: newHeadline })
        break
      case 'delete':
        selectedIds.forEach(id => removeCreative(id))
        setSelectedIds(new Set())
        break
    }
    setActiveAction(null)
  }
  
  const handleExport = () => {
    if (onExport && selectedCreatives.length > 0) {
      onExport(selectedCreatives)
    }
  }
  
  // Preset colors
  const presetColors = [
    '#f97316', '#ef4444', '#22c55e', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PaletteIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hromadné úpravy</h3>
                <p className="text-sm text-gray-500">
                  {selectedIds.size} z {creatives.length} vybráno
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex items-center gap-2 flex-wrap">
          <button
            onClick={selectAll}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border",
              selectedIds.size === creatives.length 
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "hover:bg-gray-100"
            )}
          >
            {selectedIds.size === creatives.length ? 'Zrušit výběr' : 'Vybrat vše'}
          </button>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <button
            onClick={() => setActiveAction('cta-color')}
            disabled={selectedIds.size === 0}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border flex items-center gap-2",
              activeAction === 'cta-color' ? "bg-orange-100 border-orange-300" : "hover:bg-gray-100",
              selectedIds.size === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <PaletteIcon className="w-4 h-4" />
            Barva CTA
          </button>
          
          <button
            onClick={() => setActiveAction('cta-text')}
            disabled={selectedIds.size === 0}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border flex items-center gap-2",
              activeAction === 'cta-text' ? "bg-blue-100 border-blue-300" : "hover:bg-gray-100",
              selectedIds.size === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <TypeIcon className="w-4 h-4" />
            Text CTA
          </button>
          
          <button
            onClick={() => setActiveAction('headline')}
            disabled={selectedIds.size === 0}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border flex items-center gap-2",
              activeAction === 'headline' ? "bg-purple-100 border-purple-300" : "hover:bg-gray-100",
              selectedIds.size === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <TypeIcon className="w-4 h-4" />
            Headline
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={() => setActiveAction('delete')}
            disabled={selectedIds.size === 0}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border flex items-center gap-2 text-red-600 hover:bg-red-50",
              selectedIds.size === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <TrashIcon className="w-4 h-4" />
            Smazat
          </button>
          
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-2",
              selectedIds.size === 0 && "opacity-50 cursor-not-allowed"
            )}
          >
            <DownloadIcon className="w-4 h-4" />
            Exportovat ({selectedIds.size})
          </button>
        </div>
        
        {/* Action Panel */}
        {activeAction && (
          <div className="px-6 py-4 border-b bg-gray-50">
            {activeAction === 'cta-color' && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Nová barva CTA:</span>
                <div className="flex items-center gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCtaColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform",
                        newCtaColor === color ? "border-gray-900 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newCtaColor}
                    onChange={(e) => setNewCtaColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <button
                  onClick={applyChanges}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Aplikovat na {selectedIds.size} kreativ
                </button>
              </div>
            )}
            
            {activeAction === 'cta-text' && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Nový text CTA:</span>
                <input
                  type="text"
                  value={newCtaText}
                  onChange={(e) => setNewCtaText(e.target.value)}
                  className="flex-1 max-w-xs px-3 py-2 border rounded-lg"
                  placeholder="Koupit nyní"
                />
                <button
                  onClick={applyChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Aplikovat
                </button>
              </div>
            )}
            
            {activeAction === 'headline' && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Nový headline:</span>
                <input
                  type="text"
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Váš nový headline"
                />
                <button
                  onClick={applyChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Aplikovat
                </button>
              </div>
            )}
            
            {activeAction === 'delete' && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-red-600">
                  ⚠️ Opravdu chcete smazat {selectedIds.size} kreativ? Tato akce je nevratná.
                </span>
                <button
                  onClick={applyChanges}
                  className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Smazat {selectedIds.size} kreativ
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Zrušit
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Creative Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {creatives.map((creative) => (
              <div
                key={creative.id}
                onClick={() => toggleSelect(creative.id)}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                  selectedIds.has(creative.id) 
                    ? "border-blue-500 ring-2 ring-blue-200" 
                    : "border-transparent hover:border-gray-300"
                )}
              >
                <img
                  src={creative.imageUrl}
                  alt={creative.format.name}
                  className="w-full aspect-square object-cover"
                />
                
                {/* Selection indicator */}
                <div className={cn(
                  "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  selectedIds.has(creative.id) 
                    ? "bg-blue-500 text-white" 
                    : "bg-white/80 border"
                )}>
                  {selectedIds.has(creative.id) && <CheckIcon className="w-4 h-4" />}
                </div>
                
                {/* Format label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white truncate">
                    {creative.format.name}
                  </p>
                  <p className="text-xs text-white/70">
                    {creative.format.width}×{creative.format.height}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {creatives.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Žádné kreativy k zobrazení
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Tip: Kliknutím na kreativu ji vyberete/odznačíte
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkEditMode
