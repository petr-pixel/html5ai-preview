/**
 * FormatEditorV2 - Plnohodnotný editor pro jednotlivý formát
 * 
 * FUNKCE:
 * - Drag & drop textových prvků (HTML overlays, ne canvas)
 * - Inline editing - dvojklik na text = kurzor
 * - Outpainting - využívá existující outpaintImage()
 * - Synchronizace se store (formatOffsets, perFormatTextSettings)
 * - Layout presets (text vlevo, dole, střed...)
 * - Undo/Redo historie
 * - Keyboard shortcuts (Delete, Arrows, +/-)
 * - Snap to guides
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { outpaintImage } from '@/lib/openai-client'
import { Button } from '@/components/ui'
import { CostBadge, calculateCost } from '@/components/CostEstimate'
import { cn } from '@/lib/utils'
import { 
  X, 
  RotateCcw,
  Eye,
  EyeOff,
  Minus,
  Plus,
  GripVertical,
  Type,
  Wand2,
  Loader2,
  Sparkles,
  MousePointer2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Layout,
  Undo2,
  Redo2,
  Grid3X3,
  ChevronDown
} from 'lucide-react'
import type { Format, TextLayer, TextElement, CTAElement, LogoElement, BrandKit } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface FormatEditorV2Props {
  formatKey: string
  format: Format
  sourceImage: string | null
  onClose: () => void
  onSave?: (renderedImage: string) => void
}

interface HistoryState {
  textLayer: TextLayer
  imageOffset: { x: number; y: number }
}

// =============================================================================
// LAYOUT PRESETS
// =============================================================================

const LAYOUT_PRESETS = [
  { id: 'bottom-left', name: 'Vlevo dole', icon: '↙️' },
  { id: 'bottom-center', name: 'Dole střed', icon: '⬇️' },
  { id: 'center', name: 'Na střed', icon: '⏺️' },
  { id: 'top-left', name: 'Vlevo nahoře', icon: '↖️' },
  { id: 'left-stack', name: 'Vlevo stack', icon: '◀️' },
  { id: 'right-stack', name: 'Vpravo stack', icon: '▶️' },
] as const

function getPresetPositions(presetId: string, format: Format): Partial<TextLayer> {
  const ratio = format.width / format.height
  const isWide = ratio > 2
  const base = Math.min(format.width, format.height)
  const headlineSize = Math.round(Math.max(16, Math.min(72, base * 0.07)))
  const subSize = Math.round(Math.max(12, Math.min(36, base * 0.04)))
  const ctaSize = Math.round(Math.max(12, Math.min(28, base * 0.035)))
  
  switch (presetId) {
    case 'bottom-left':
      return {
        headline: { x: 8, y: 55, textAlign: 'left', fontSize: headlineSize },
        subheadline: { x: 8, y: 68, textAlign: 'left', fontSize: subSize },
        cta: { x: 8, y: 82, textAlign: 'left', fontSize: ctaSize },
        logo: { x: 92, y: 10, width: 12 },
      } as any
    case 'bottom-center':
      return {
        headline: { x: 50, y: 55, textAlign: 'center', fontSize: headlineSize },
        subheadline: { x: 50, y: 68, textAlign: 'center', fontSize: subSize },
        cta: { x: 50, y: 82, textAlign: 'center', fontSize: ctaSize },
        logo: { x: 50, y: 10, width: 12 },
      } as any
    case 'center':
      return {
        headline: { x: 50, y: 35, textAlign: 'center', fontSize: headlineSize },
        subheadline: { x: 50, y: 50, textAlign: 'center', fontSize: subSize },
        cta: { x: 50, y: 65, textAlign: 'center', fontSize: ctaSize },
        logo: { x: 50, y: 90, width: 10 },
      } as any
    case 'top-left':
      return {
        headline: { x: 8, y: 18, textAlign: 'left', fontSize: headlineSize },
        subheadline: { x: 8, y: 32, textAlign: 'left', fontSize: subSize },
        cta: { x: 8, y: 46, textAlign: 'left', fontSize: ctaSize },
        logo: { x: 92, y: 90, width: 12 },
      } as any
    case 'left-stack':
      return {
        headline: { x: 5, y: 35, textAlign: 'left', fontSize: isWide ? headlineSize * 0.8 : headlineSize },
        subheadline: { x: 5, y: 50, textAlign: 'left', fontSize: subSize },
        cta: { x: 5, y: 65, textAlign: 'left', fontSize: ctaSize },
        logo: { x: 92, y: 50, width: 10 },
      } as any
    case 'right-stack':
      return {
        headline: { x: 95, y: 35, textAlign: 'right', fontSize: headlineSize },
        subheadline: { x: 95, y: 50, textAlign: 'right', fontSize: subSize },
        cta: { x: 95, y: 65, textAlign: 'right', fontSize: ctaSize },
        logo: { x: 8, y: 50, width: 10 },
      } as any
    default:
      return {}
  }
}

// =============================================================================
// DEFAULT TEXT LAYER
// =============================================================================

function createDefaultTextLayer(
  format: Format, 
  texts: { headline: string; subheadline: string; cta: string; ctaColor: string },
  brandKit?: BrandKit | null
): TextLayer {
  const { width, height } = format
  const ratio = width / height
  const base = Math.min(width, height)
  
  let preset = 'bottom-left'
  if (ratio > 2) preset = 'left-stack'
  else if (ratio < 0.7) preset = 'bottom-center'
  
  const presetPos = getPresetPositions(preset, format)
  const headlineSize = Math.round(Math.max(16, Math.min(72, base * 0.07)))
  const subSize = Math.round(Math.max(12, Math.min(36, base * 0.04)))
  const ctaSize = Math.round(Math.max(12, Math.min(28, base * 0.035)))
  
  const primaryColor = brandKit?.primaryColor || texts.ctaColor || '#f97316'
  const textColor = brandKit?.textLight || '#ffffff'
  
  return {
    headline: {
      text: texts.headline || '',
      visible: !!texts.headline,
      x: (presetPos.headline as any)?.x || 50,
      y: (presetPos.headline as any)?.y || 35,
      fontSize: (presetPos.headline as any)?.fontSize || headlineSize,
      fontWeight: 'bold',
      color: textColor,
      textAlign: (presetPos.headline as any)?.textAlign || 'center',
      maxWidth: 85,
      shadow: true,
    },
    subheadline: {
      text: texts.subheadline || '',
      visible: !!texts.subheadline,
      x: (presetPos.subheadline as any)?.x || 50,
      y: (presetPos.subheadline as any)?.y || 50,
      fontSize: (presetPos.subheadline as any)?.fontSize || subSize,
      fontWeight: 'normal',
      color: textColor,
      textAlign: (presetPos.subheadline as any)?.textAlign || 'center',
      maxWidth: 80,
      shadow: true,
    },
    cta: {
      text: texts.cta || '',
      visible: !!texts.cta,
      x: (presetPos.cta as any)?.x || 50,
      y: (presetPos.cta as any)?.y || 70,
      fontSize: (presetPos.cta as any)?.fontSize || ctaSize,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      maxWidth: 50,
      shadow: false,
      backgroundColor: primaryColor,
      paddingX: Math.round(ctaSize * 0.8),
      paddingY: Math.round(ctaSize * 0.4),
      borderRadius: 100,
    },
    logo: {
      visible: brandKit?.logoRules?.autoApply ?? false,
      x: (presetPos.logo as any)?.x || 90,
      y: (presetPos.logo as any)?.y || 10,
      width: (presetPos.logo as any)?.width || 12,
      opacity: (brandKit?.logoRules?.opacity || 100) / 100,
      variant: 'auto',
    }
  }
}

// =============================================================================
// SNAP GUIDES
// =============================================================================

const SNAP_THRESHOLD = 3
const SNAP_LINES = [5, 25, 50, 75, 95]

function snapToGuide(value: number): { snapped: number; guide: number | null } {
  for (const guide of SNAP_LINES) {
    if (Math.abs(value - guide) < SNAP_THRESHOLD) {
      return { snapped: guide, guide }
    }
  }
  return { snapped: value, guide: null }
}

// =============================================================================
// DRAGGABLE TEXT COMPONENT
// =============================================================================

interface DraggableTextProps {
  element: TextElement | CTAElement
  type: 'headline' | 'subheadline' | 'cta'
  containerWidth: number
  containerHeight: number
  isEditing: boolean
  isSelected: boolean
  showGuides: boolean
  onSelect: () => void
  onChange: (updates: Partial<TextElement | CTAElement>) => void
  onStartEdit: () => void
  onEndEdit: () => void
  onActiveGuide: (guide: { x: number | null; y: number | null }) => void
}

function DraggableText({ 
  element, type, containerWidth, containerHeight, isEditing, isSelected, showGuides,
  onSelect, onChange, onStartEdit, onEndEdit, onActiveGuide
}: DraggableTextProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  if (!element.visible) return null
  
  const isCTA = type === 'cta'
  const ctaEl = element as CTAElement
  const left = (element.x / 100) * containerWidth
  const top = (element.y / 100) * containerHeight
  
  const textStyle: React.CSSProperties = {
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    color: element.color,
    textAlign: element.textAlign,
    maxWidth: `${(element.maxWidth / 100) * containerWidth}px`,
    textShadow: element.shadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
  
  const ctaStyle: React.CSSProperties = isCTA ? {
    backgroundColor: ctaEl.backgroundColor,
    padding: `${ctaEl.paddingY}px ${ctaEl.paddingX}px`,
    borderRadius: ctaEl.borderRadius,
  } : {}
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setIsDragging(true)
  }
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const container = elementRef.current?.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    let newX = ((e.clientX - containerRect.left - dragOffset.x + (elementRef.current?.offsetWidth || 0) / 2) / containerRect.width) * 100
    let newY = ((e.clientY - containerRect.top - dragOffset.y + (elementRef.current?.offsetHeight || 0) / 2) / containerRect.height) * 100
    
    if (showGuides) {
      const snapX = snapToGuide(newX)
      const snapY = snapToGuide(newY)
      newX = snapX.snapped
      newY = snapY.snapped
      onActiveGuide({ x: snapX.guide, y: snapY.guide })
    }
    onChange({ x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) })
  }, [isDragging, dragOffset, showGuides, onChange, onActiveGuide])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    onActiveGuide({ x: null, y: null })
  }, [onActiveGuide])
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])
  
  const colorByType = { headline: 'ring-blue-500', subheadline: 'ring-green-500', cta: 'ring-orange-500' }

  return (
    <div
      ref={elementRef}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none transition-shadow duration-150',
        isSelected && `ring-2 ring-offset-1 ${colorByType[type]}`,
        isDragging && 'opacity-80 scale-105'
      )}
      style={{ left, top, zIndex: isSelected ? 50 : type === 'headline' ? 30 : type === 'subheadline' ? 20 : 10 }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit() }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={element.text}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={onEndEdit}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onEndEdit() }}
          className="bg-white text-black px-2 py-1 rounded border-2 border-blue-500 outline-none"
          style={{ fontSize: Math.max(14, element.fontSize * 0.7), minWidth: '120px' }}
        />
      ) : (
        <div style={{ ...textStyle, ...ctaStyle }} className="px-1">
          {element.text || `[${type}]`}
        </div>
      )}
      {isSelected && !isEditing && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          {type === 'headline' ? 'Headline' : type === 'subheadline' ? 'Subheadline' : 'CTA'}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// DRAGGABLE LOGO
// =============================================================================

function DraggableLogo({ logo, logoUrl, containerWidth, containerHeight, isSelected, showGuides, onSelect, onChange, onActiveGuide }: {
  logo: LogoElement; logoUrl?: string; containerWidth: number; containerHeight: number; isSelected: boolean; showGuides: boolean
  onSelect: () => void; onChange: (u: Partial<LogoElement>) => void; onActiveGuide: (g: { x: number | null; y: number | null }) => void
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  if (!logo.visible || !logoUrl) return null
  
  const left = (logo.x / 100) * containerWidth
  const top = (logo.y / 100) * containerHeight
  const width = (logo.width / 100) * containerWidth
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); onSelect()
    const rect = elementRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setIsDragging(true)
  }
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const container = elementRef.current?.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    let newX = ((e.clientX - containerRect.left - dragOffset.x + width / 2) / containerRect.width) * 100
    let newY = ((e.clientY - containerRect.top - dragOffset.y + width / 2) / containerRect.height) * 100
    if (showGuides) {
      const snapX = snapToGuide(newX); const snapY = snapToGuide(newY)
      newX = snapX.snapped; newY = snapY.snapped
      onActiveGuide({ x: snapX.guide, y: snapY.guide })
    }
    onChange({ x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) })
  }, [isDragging, dragOffset, width, showGuides, onChange, onActiveGuide])
  
  const handleMouseUp = useCallback(() => { setIsDragging(false); onActiveGuide({ x: null, y: null }) }, [onActiveGuide])
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={elementRef}
      className={cn('absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move', isSelected && 'ring-2 ring-purple-500 ring-offset-1', isDragging && 'opacity-75')}
      style={{ left, top, width, opacity: logo.opacity, zIndex: 5 }}
      onMouseDown={handleMouseDown}
    >
      <img src={logoUrl} alt="Logo" className="w-full h-auto object-contain" draggable={false} />
      {isSelected && <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded">Logo</div>}
    </div>
  )
}

// =============================================================================
// MAIN EDITOR
// =============================================================================

export function FormatEditorV2({ formatKey, format, sourceImage, onClose, onSave }: FormatEditorV2Props) {
  const {
    textOverlay, brandKits, activeBrandKit, apiKeys, outpaintedImages, setOutpaintedImage, clearOutpaintedImage,
    formatOffsets, setFormatOffset, addCreatives, platform, category,
  } = useAppStore()

  const currentBrandKit = brandKits.find(b => b.id === activeBrandKit)
  
  const [textLayer, setTextLayer] = useState<TextLayer>(() => 
    createDefaultTextLayer(format, { headline: textOverlay.headline, subheadline: textOverlay.subheadline, cta: textOverlay.cta, ctaColor: textOverlay.ctaColor }, currentBrandKit)
  )
  
  const [selectedElement, setSelectedElement] = useState<'headline' | 'subheadline' | 'cta' | 'logo' | 'image' | null>(null)
  const [editingElement, setEditingElement] = useState<'headline' | 'subheadline' | 'cta' | null>(null)
  const [isOutpainting, setIsOutpainting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [activeGuide, setActiveGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const [presetMenuOpen, setPresetMenuOpen] = useState(false)
  
  // Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedo, setIsUndoRedo] = useState(false)
  
  const storedOffset = formatOffsets[formatKey] || { x: 0, y: 0 }
  const [imageOffset, setImageOffset] = useState(storedOffset)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const maxDisplayWidth = 550
  const scale = Math.min(1, maxDisplayWidth / format.width)
  const displayWidth = format.width * scale
  const displayHeight = format.height * scale
  
  const outpaintedImage = outpaintedImages[formatKey] || null
  const displayImage = outpaintedImage || sourceImage
  
  const needsOutpainting = useMemo(() => {
    if (!sourceImage || outpaintedImage) return false
    const img = new Image(); img.src = sourceImage
    const imgRatio = img.naturalWidth / img.naturalHeight || 1
    const formatRatio = format.width / format.height
    return Math.abs(imgRatio - formatRatio) > 0.3
  }, [sourceImage, outpaintedImage, format])
  
  const getLogoUrl = () => {
    if (!currentBrandKit) return undefined
    if (textLayer.logo.variant === 'light') return currentBrandKit.logoLight
    if (textLayer.logo.variant === 'dark') return currentBrandKit.logoDark
    return currentBrandKit.logoMain
  }
  
  // History
  const saveToHistory = useCallback(() => {
    if (isUndoRedo) return
    const newState: HistoryState = { textLayer: JSON.parse(JSON.stringify(textLayer)), imageOffset: { ...imageOffset } }
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newState].slice(-30))
    setHistoryIndex(prev => Math.min(prev + 1, 29))
  }, [textLayer, imageOffset, historyIndex, isUndoRedo])
  
  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    setIsUndoRedo(true)
    const prevState = history[historyIndex - 1]
    setTextLayer(prevState.textLayer); setImageOffset(prevState.imageOffset)
    setHistoryIndex(prev => prev - 1)
    setTimeout(() => setIsUndoRedo(false), 50)
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    setIsUndoRedo(true)
    const nextState = history[historyIndex + 1]
    setTextLayer(nextState.textLayer); setImageOffset(nextState.imageOffset)
    setHistoryIndex(prev => prev + 1)
    setTimeout(() => setIsUndoRedo(false), 50)
  }, [history, historyIndex])
  
  useEffect(() => { if (history.length === 0) saveToHistory() }, [])
  
  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && selectedElement !== 'image' && !editingElement) {
        e.preventDefault()
        if (selectedElement === 'logo') updateLogo({ visible: false })
        else updateElement(selectedElement, { visible: false })
        saveToHistory()
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElement && selectedElement !== 'image' && !editingElement) {
        e.preventDefault()
        const step = e.shiftKey ? 5 : 1
        const delta = { x: 0, y: 0 }
        if (e.key === 'ArrowUp') delta.y = -step; if (e.key === 'ArrowDown') delta.y = step
        if (e.key === 'ArrowLeft') delta.x = -step; if (e.key === 'ArrowRight') delta.x = step
        if (selectedElement === 'logo') updateLogo({ x: textLayer.logo.x + delta.x, y: textLayer.logo.y + delta.y })
        else { const el = textLayer[selectedElement]; updateElement(selectedElement, { x: el.x + delta.x, y: el.y + delta.y }) }
      }
      if ((e.key === '+' || e.key === '=') && selectedElement && !['image', 'logo'].includes(selectedElement || '')) {
        e.preventDefault(); const el = textLayer[selectedElement as 'headline' | 'subheadline' | 'cta']
        updateElement(selectedElement as any, { fontSize: Math.min(100, el.fontSize + 2) })
      }
      if (e.key === '-' && selectedElement && !['image', 'logo'].includes(selectedElement || '')) {
        e.preventDefault(); const el = textLayer[selectedElement as 'headline' | 'subheadline' | 'cta']
        updateElement(selectedElement as any, { fontSize: Math.max(10, el.fontSize - 2) })
      }
      if (e.key === 'Escape') { setSelectedElement(null); setEditingElement(null) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, editingElement, textLayer, undo, redo, saveToHistory])
  
  const updateElement = (type: 'headline' | 'subheadline' | 'cta', updates: Partial<TextElement | CTAElement>) => {
    setTextLayer(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }))
  }
  const updateLogo = (updates: Partial<LogoElement>) => {
    setTextLayer(prev => ({ ...prev, logo: { ...prev.logo, ...updates } }))
  }
  
  const applyPreset = (presetId: string) => {
    const positions = getPresetPositions(presetId, format)
    setTextLayer(prev => ({
      headline: { ...prev.headline, ...positions.headline },
      subheadline: { ...prev.subheadline, ...positions.subheadline },
      cta: { ...prev.cta, ...positions.cta },
      logo: { ...prev.logo, ...positions.logo },
    }))
    saveToHistory(); setPresetMenuOpen(false)
  }
  
  const handleOutpaint = async () => {
    if (!sourceImage || !apiKeys.openai) { alert('Pro dopočítání pozadí je potřeba OpenAI API klíč'); return }
    setIsOutpainting(true)
    try {
      const result = await outpaintImage({ apiKey: apiKeys.openai }, { image: sourceImage, targetWidth: format.width, targetHeight: format.height, prompt: 'Continue the background seamlessly' })
      if (result.success && result.image) setOutpaintedImage(formatKey, result.image)
      else alert(result.error || 'Nepodařilo se')
    } catch { alert('Chyba') } finally { setIsOutpainting(false) }
  }
  
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (selectedElement && selectedElement !== 'image') return
    setSelectedElement('image'); setIsDraggingImage(true); setImageDragStart({ x: e.clientX, y: e.clientY })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage) return
    const dx = e.clientX - imageDragStart.x; const dy = e.clientY - imageDragStart.y
    setImageOffset(prev => ({ x: Math.max(-50, Math.min(50, prev.x + dx * 0.3)), y: Math.max(-50, Math.min(50, prev.y + dy * 0.3)) }))
    setImageDragStart({ x: e.clientX, y: e.clientY })
  }
  const handleMouseUp = () => { if (isDraggingImage) { setFormatOffset(formatKey, imageOffset); saveToHistory() } setIsDraggingImage(false) }
  
  const renderToCanvas = async (): Promise<string> => {
    const canvas = canvasRef.current; if (!canvas || !displayImage) return ''
    canvas.width = format.width; canvas.height = format.height
    const ctx = canvas.getContext('2d'); if (!ctx) return ''
    
    await new Promise<void>((resolve) => {
      const img = new Image(); img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, format.width, format.height)
        if (outpaintedImage) { ctx.drawImage(img, 0, 0, format.width, format.height) }
        else {
          const imgAspect = img.width / img.height; const canvasAspect = format.width / format.height
          let drawWidth, drawHeight, drawX, drawY
          if (imgAspect > canvasAspect) {
            drawHeight = format.height; drawWidth = drawHeight * imgAspect
            drawX = (format.width - drawWidth) / 2 + (imageOffset.x / 100) * drawWidth; drawY = (imageOffset.y / 100) * drawHeight
          } else {
            drawWidth = format.width; drawHeight = drawWidth / imgAspect
            drawX = (imageOffset.x / 100) * drawWidth; drawY = (format.height - drawHeight) / 2 + (imageOffset.y / 100) * drawHeight
          }
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
        }
        resolve()
      }
      img.src = displayImage
    })
    
    const drawText = (el: TextElement, isCTA = false) => {
      if (!el.visible || !el.text) return
      const x = (el.x / 100) * format.width; const y = (el.y / 100) * format.height
      ctx.font = `${el.fontWeight} ${el.fontSize}px Arial, sans-serif`
      ctx.textAlign = el.textAlign; ctx.textBaseline = 'middle'
      if (el.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2 }
      if (isCTA) {
        const ctaEl = el as CTAElement; const textWidth = ctx.measureText(el.text).width
        const boxWidth = textWidth + ctaEl.paddingX * 2; const boxHeight = el.fontSize + ctaEl.paddingY * 2
        let boxX = x; if (el.textAlign === 'center') boxX = x - boxWidth / 2; else if (el.textAlign === 'right') boxX = x - boxWidth
        ctx.shadowColor = 'transparent'; ctx.fillStyle = ctaEl.backgroundColor
        ctx.beginPath(); ctx.roundRect(boxX, y - boxHeight / 2, boxWidth, boxHeight, ctaEl.borderRadius); ctx.fill()
        ctx.fillStyle = el.color; ctx.fillText(el.text, x, y)
      } else { ctx.fillStyle = el.color; ctx.fillText(el.text, x, y) }
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    }
    drawText(textLayer.headline); drawText(textLayer.subheadline); drawText(textLayer.cta, true)
    
    if (textLayer.logo.visible) {
      const logoUrl = getLogoUrl()
      if (logoUrl) {
        await new Promise<void>((resolve) => {
          const logoImg = new Image(); logoImg.crossOrigin = 'anonymous'
          logoImg.onload = () => {
            const logoW = (textLayer.logo.width / 100) * format.width
            const logoH = logoW * (logoImg.height / logoImg.width)
            const logoX = (textLayer.logo.x / 100) * format.width - logoW / 2
            const logoY = (textLayer.logo.y / 100) * format.height - logoH / 2
            ctx.globalAlpha = textLayer.logo.opacity; ctx.drawImage(logoImg, logoX, logoY, logoW, logoH); ctx.globalAlpha = 1
            resolve()
          }
          logoImg.onerror = () => resolve(); logoImg.src = logoUrl
        })
      }
    }
    return canvas.toDataURL('image/png')
  }
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const renderedImage = await renderToCanvas()
      setFormatOffset(formatKey, imageOffset)
      const creative = { id: `${formatKey}-${Date.now()}`, formatKey, platform: platform as any, category, format, baseImageUrl: sourceImage || '', imageUrl: renderedImage, textLayer, createdAt: new Date() }
      addCreatives([creative])
      onSave?.(renderedImage); onClose()
    } catch (e) { console.error(e) }
    setIsSaving(false)
  }
  
  const handleReset = () => {
    setTextLayer(createDefaultTextLayer(format, { headline: textOverlay.headline, subheadline: textOverlay.subheadline, cta: textOverlay.cta, ctaColor: textOverlay.ctaColor }, currentBrandKit))
    setImageOffset({ x: 0, y: 0 }); setFormatOffset(formatKey, { x: 0, y: 0 }); clearOutpaintedImage(formatKey)
    setSelectedElement(null); setEditingElement(null); saveToHistory()
  }
  
  const selectedConfig = selectedElement && selectedElement !== 'image' && selectedElement !== 'logo'
    ? { type: selectedElement, element: textLayer[selectedElement] }
    : selectedElement === 'logo' ? { type: 'logo' as const, element: textLayer.logo } : null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upravit: {format.name}</h2>
            <p className="text-sm text-gray-500">{format.width} × {format.height}px</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} title="Zpět"><Undo2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Vpřed"><Redo2 className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="flex">
          {/* Canvas */}
          <div className="flex-1 p-6 bg-gray-100 flex flex-col items-center justify-center min-h-[500px]" onClick={() => { setSelectedElement(null); setEditingElement(null) }}>
            <div 
              ref={containerRef}
              className="relative bg-white shadow-lg"
              style={{ width: displayWidth, height: displayHeight, backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }}
              onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            >
              {showGuides && activeGuide.x !== null && <div className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none z-40" style={{ left: `${activeGuide.x}%` }} />}
              {showGuides && activeGuide.y !== null && <div className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none z-40" style={{ top: `${activeGuide.y}%` }} />}
              
              {displayImage && (
                <div className={cn("absolute inset-0 overflow-hidden", selectedElement === 'image' && "ring-2 ring-blue-500 ring-inset")} style={{ cursor: isDraggingImage ? 'grabbing' : 'grab' }} onMouseDown={handleImageMouseDown} onClick={(e) => e.stopPropagation()}>
                  <img src={displayImage} alt="Background" className="absolute" style={{ width: outpaintedImage ? '100%' : 'auto', height: outpaintedImage ? '100%' : 'auto', minWidth: outpaintedImage ? undefined : '100%', minHeight: outpaintedImage ? undefined : '100%', left: `${50 + imageOffset.x}%`, top: `${50 + imageOffset.y}%`, transform: 'translate(-50%, -50%)', objectFit: outpaintedImage ? 'cover' : undefined }} draggable={false} />
                </div>
              )}
              
              {(['headline', 'subheadline', 'cta'] as const).map((type) => (
                <DraggableText key={type} element={textLayer[type]} type={type} containerWidth={displayWidth} containerHeight={displayHeight} isEditing={editingElement === type} isSelected={selectedElement === type} showGuides={showGuides} onSelect={() => { setSelectedElement(type); saveToHistory() }} onChange={(u) => updateElement(type, u)} onStartEdit={() => setEditingElement(type)} onEndEdit={() => { setEditingElement(null); saveToHistory() }} onActiveGuide={setActiveGuide} />
              ))}
              <DraggableLogo logo={textLayer.logo} logoUrl={getLogoUrl()} containerWidth={displayWidth} containerHeight={displayHeight} isSelected={selectedElement === 'logo'} showGuides={showGuides} onSelect={() => { setSelectedElement('logo'); saveToHistory() }} onChange={updateLogo} onActiveGuide={setActiveGuide} />
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              {needsOutpainting && !outpaintedImage && (
                <Button onClick={handleOutpaint} disabled={isOutpainting || !apiKeys.openai} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {isOutpainting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Dopočítat pozadí
                  <CostBadge cost={calculateCost('outpaint', { quality: 'medium' })} />
                </Button>
              )}
              {outpaintedImage && <span className="text-xs text-green-600 flex items-center gap-1"><Sparkles className="w-3 h-3" />Pozadí hotovo</span>}
              <Button variant={showGuides ? 'default' : 'outline'} size="sm" onClick={() => setShowGuides(!showGuides)}><Grid3X3 className="w-4 h-4" /></Button>
              <span className="text-xs text-gray-500 flex items-center gap-1"><MousePointer2 className="w-3 h-3" />Táhni • Dvojklik = edit</span>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 p-5 overflow-y-auto max-h-[calc(95vh-80px)]">
            {/* Presets */}
            <div className="mb-5 relative">
              <Button variant="outline" className="w-full justify-between" onClick={() => setPresetMenuOpen(!presetMenuOpen)}>
                <span className="flex items-center gap-2"><Layout className="w-4 h-4" />Layout preset</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", presetMenuOpen && "rotate-180")} />
              </Button>
              {presetMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                  {LAYOUT_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => applyPreset(p.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <span>{p.icon}</span>{p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Layers */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Type className="w-4 h-4" />Vrstvy</h3>
              <div className="space-y-2">
                {(['headline', 'subheadline', 'cta'] as const).map((type) => (
                  <button key={type} onClick={() => updateElement(type, { visible: !textLayer[type].visible })} className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left', textLayer[type].visible ? type === 'headline' ? 'bg-blue-50 border-blue-200 text-blue-700' : type === 'subheadline' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-400')}>
                    <span className="text-sm font-medium capitalize">{type}</span>
                    {textLayer[type].visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                ))}
                <button onClick={() => updateLogo({ visible: !textLayer.logo.visible })} disabled={!currentBrandKit?.logoMain} className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left', textLayer.logo.visible ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-400', !currentBrandKit?.logoMain && 'opacity-50')}>
                  <span className="text-sm font-medium">Logo</span>
                  {textLayer.logo.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Selected props */}
            {selectedConfig && selectedConfig.type !== 'logo' && (
              <div className="mb-5 p-4 bg-gray-50 rounded-xl border">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">✏️ {selectedConfig.type}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Text</label>
                    <input type="text" value={(selectedConfig.element as TextElement).text} onChange={(e) => { updateElement(selectedConfig.type as any, { text: e.target.value }); saveToHistory() }} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><label className="text-xs text-gray-500">Velikost</label><span className="text-xs font-mono">{(selectedConfig.element as TextElement).fontSize}px</span></div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="p-1 h-7 w-7" onClick={() => updateElement(selectedConfig.type as any, { fontSize: Math.max(10, (selectedConfig.element as TextElement).fontSize - 2) })}><Minus className="w-3 h-3" /></Button>
                      <input type="range" min="10" max="100" value={(selectedConfig.element as TextElement).fontSize} onChange={(e) => updateElement(selectedConfig.type as any, { fontSize: parseInt(e.target.value) })} className="flex-1" />
                      <Button variant="outline" size="sm" className="p-1 h-7 w-7" onClick={() => updateElement(selectedConfig.type as any, { fontSize: Math.min(100, (selectedConfig.element as TextElement).fontSize + 2) })}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Zarovnání</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button key={a} onClick={() => updateElement(selectedConfig.type as any, { textAlign: a })} className={cn('flex-1 p-2 rounded border', (selectedConfig.element as TextElement).textAlign === a ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50')}>
                          {a === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}{a === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}{a === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Barva</label>
                    <div className="flex gap-2">
                      <input type="color" value={(selectedConfig.element as TextElement).color} onChange={(e) => updateElement(selectedConfig.type as any, { color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                      <input type="text" value={(selectedConfig.element as TextElement).color} onChange={(e) => updateElement(selectedConfig.type as any, { color: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                    </div>
                  </div>
                  {selectedConfig.type === 'cta' && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Pozadí CTA</label>
                      <div className="flex gap-2">
                        <input type="color" value={(selectedConfig.element as CTAElement).backgroundColor} onChange={(e) => updateElement('cta', { backgroundColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                        <input type="text" value={(selectedConfig.element as CTAElement).backgroundColor} onChange={(e) => updateElement('cta', { backgroundColor: e.target.value })} className="flex-1 px-2 py-1 border rounded text-xs font-mono" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedConfig?.type === 'logo' && (
              <div className="mb-5 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-700 mb-3">🏷️ Logo</h3>
                <div className="space-y-3">
                  <div><div className="flex justify-between mb-1"><label className="text-xs text-purple-600">Velikost</label><span className="text-xs font-mono">{textLayer.logo.width}%</span></div><input type="range" min="5" max="40" value={textLayer.logo.width} onChange={(e) => updateLogo({ width: parseInt(e.target.value) })} className="w-full" /></div>
                  <div><div className="flex justify-between mb-1"><label className="text-xs text-purple-600">Průhlednost</label><span className="text-xs font-mono">{Math.round(textLayer.logo.opacity * 100)}%</span></div><input type="range" min="0.1" max="1" step="0.05" value={textLayer.logo.opacity} onChange={(e) => updateLogo({ opacity: parseFloat(e.target.value) })} className="w-full" /></div>
                </div>
              </div>
            )}
            
            <div className="mb-5 text-xs text-gray-400 space-y-1">
              <p>⌨️ <strong>Delete</strong> = skrýt</p>
              <p>⌨️ <strong>Šipky</strong> = posun</p>
              <p>⌨️ <strong>+/-</strong> = velikost</p>
              <p>⌨️ <strong>Ctrl+Z</strong> = zpět</p>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset} className="w-full"><RotateCcw className="w-4 h-4 mr-2" />Reset vše</Button>
              <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Uložit formát
              </Button>
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default FormatEditorV2
