/**
 * FormatEditorV2 - Editor formátu s korektním outpainting flow
 * 
 * FLOW:
 * 1. POSUN OBRÁZKU - uživatel táhne obrázek aby důležitá část byla vidět
 * 2. UKOTVENÍ - klikne "Ukotvit pozici" 
 * 3. DOPOČÍTÁNÍ - AI dogeneruje POUZE prázdné oblasti (ne celý obrázek!)
 * 4. TEXTY - přidá headline, CTA atd.
 * 5. ULOŽENÍ - finální kreativa
 * 
 * OPRAVY:
 * - Stabilní drag bez memory leaků (useRef pro state, cleanup v useEffect)
 * - Správný výpočet pozice obrázku s offsetem
 * - Vizualizace prázdných oblastí před outpaintingem
 * - Outpainting respektuje offset a dogeneruje JEN prázdné části
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { outpaintWithOffset, checkNeedsOutpainting } from '@/lib/outpaint'
import { Button } from '@/components/ui'
import { CostBadge, calculateCost } from '@/components/CostEstimate'
import { cn } from '@/lib/utils'
import { 
  X, RotateCcw, Eye, EyeOff, Minus, Plus, Type, Wand2, Loader2, 
  Sparkles, MousePointer2, AlignLeft, AlignCenter, AlignRight, Check, 
  Undo2, Redo2, Anchor, Move, Lock, Unlock, AlertTriangle
} from 'lucide-react'
import type { Format, TextLayer, TextElement, CTAElement, LogoElement, BrandKit } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  formatKey: string
  format: Format
  sourceImage: string | null
  onClose: () => void
  onSave?: (renderedImage: string) => void
}

// =============================================================================
// DEFAULT TEXT LAYER
// =============================================================================

function createDefaultTextLayer(format: Format, texts: { headline: string; subheadline: string; cta: string; ctaColor: string }, brandKit?: BrandKit | null): TextLayer {
  const { width, height } = format
  const base = Math.min(width, height)
  const ratio = width / height
  
  const headlineSize = Math.round(Math.max(16, Math.min(72, base * 0.07)))
  const subSize = Math.round(Math.max(12, Math.min(36, base * 0.04)))
  const ctaSize = Math.round(Math.max(12, Math.min(28, base * 0.035)))
  
  const primaryColor = brandKit?.primaryColor || texts.ctaColor || '#f97316'
  const textColor = brandKit?.textLight || '#ffffff'
  
  // Pozice podle poměru stran
  const isWide = ratio > 2
  const isTall = ratio < 0.7
  
  return {
    headline: {
      text: texts.headline || '',
      visible: !!texts.headline,
      x: isWide ? 5 : 50,
      y: isWide ? 35 : isTall ? 20 : 30,
      fontSize: headlineSize,
      fontWeight: 'bold',
      color: textColor,
      textAlign: isWide ? 'left' : 'center',
      maxWidth: 85,
      shadow: true,
    },
    subheadline: {
      text: texts.subheadline || '',
      visible: !!texts.subheadline,
      x: isWide ? 5 : 50,
      y: isWide ? 50 : isTall ? 35 : 48,
      fontSize: subSize,
      fontWeight: 'normal',
      color: textColor,
      textAlign: isWide ? 'left' : 'center',
      maxWidth: 80,
      shadow: true,
    },
    cta: {
      text: texts.cta || '',
      visible: !!texts.cta,
      x: isWide ? 5 : 50,
      y: isWide ? 70 : isTall ? 80 : 70,
      fontSize: ctaSize,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: isWide ? 'left' : 'center',
      maxWidth: 50,
      shadow: false,
      backgroundColor: primaryColor,
      paddingX: Math.round(ctaSize * 0.8),
      paddingY: Math.round(ctaSize * 0.4),
      borderRadius: 100,
    },
    logo: {
      visible: false,
      x: 90,
      y: 10,
      width: 12,
      opacity: 1,
      variant: 'auto',
    }
  }
}

// =============================================================================
// DRAGGABLE ELEMENT - Stabilní implementace
// =============================================================================

interface DraggableProps {
  x: number  // procenta (0-100)
  y: number
  children: React.ReactNode
  onMove: (x: number, y: number) => void
  onMoveEnd: () => void
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  label?: string
  color?: string
}

function Draggable({ x, y, children, onMove, onMoveEnd, isSelected, onSelect, disabled, label, color = 'blue' }: DraggableProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, startY: 0, elemX: 0, elemY: 0 })
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    
    const container = ref.current?.parentElement
    if (!container) return
    
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      elemX: x,
      elemY: y
    }
    
    const handleMove = (e: MouseEvent) => {
      if (!dragState.current.active) return
      const rect = container.getBoundingClientRect()
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      const newX = Math.max(2, Math.min(98, dragState.current.elemX + (dx / rect.width) * 100))
      const newY = Math.max(2, Math.min(98, dragState.current.elemY + (dy / rect.height) * 100))
      onMove(newX, newY)
    }
    
    const handleUp = () => {
      dragState.current.active = false
      onMoveEnd()
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [x, y, onMove, onMoveEnd, onSelect, disabled])
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing',
        isSelected && `ring-2 ring-${color}-500 ring-offset-1`
      )}
      style={{ left: `${x}%`, top: `${y}%`, zIndex: isSelected ? 100 : 10 }}
      onMouseDown={handleMouseDown}
    >
      {children}
      {isSelected && label && (
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-${color}-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap`}>
          {label}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormatEditorV2({ formatKey, format, sourceImage, onClose, onSave }: Props) {
  // Store
  const {
    textOverlay, brandKits, activeBrandKit, apiKeys,
    outpaintedImages, setOutpaintedImage, clearOutpaintedImage,
    formatOffsets, setFormatOffset,
    perFormatTextLayers, setPerFormatTextLayer,
    addCreatives, platform, category,
  } = useAppStore()
  
  const brandKit = brandKits.find(b => b.id === activeBrandKit)
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  // Text layer
  const [textLayer, setTextLayer] = useState<TextLayer>(() => {
    const saved = perFormatTextLayers[formatKey]
    if (saved) return saved as TextLayer
    return createDefaultTextLayer(format, textOverlay, brandKit)
  })
  
  // Image offset (procenta, -50 až +50)
  const [offset, setOffset] = useState(() => formatOffsets[formatKey] || { x: 0, y: 0 })
  
  // Editor state
  const [selected, setSelected] = useState<'image' | 'headline' | 'subheadline' | 'cta' | 'logo' | null>(null)
  const [editing, setEditing] = useState<'headline' | 'subheadline' | 'cta' | null>(null)
  const [locked, setLocked] = useState(!!outpaintedImages[formatKey])
  const [isOutpainting, setIsOutpainting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [needsOutpaint, setNeedsOutpaint] = useState(false)
  const [emptyAreas, setEmptyAreas] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  
  // Outpainted image
  const outpaintedImage = outpaintedImages[formatKey] || null
  
  // Display
  const maxWidth = 550
  const scale = Math.min(1, maxWidth / format.width)
  const displayW = format.width * scale
  const displayH = format.height * scale
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // ==========================================================================
  // CHECK OUTPAINTING NEEDS
  // ==========================================================================
  
  useEffect(() => {
    if (!sourceImage || outpaintedImage) {
      setNeedsOutpaint(false)
      return
    }
    
    checkNeedsOutpainting(sourceImage, format.width, format.height, offset.x, offset.y)
      .then(result => {
        setNeedsOutpaint(result.needs)
        setEmptyAreas(result.emptyAreas)
      })
      .catch(() => setNeedsOutpaint(false))
  }, [sourceImage, format, offset, outpaintedImage])
  
  // ==========================================================================
  // IMAGE DRAG
  // ==========================================================================
  
  const imageDragState = useRef({ active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  
  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked || outpaintedImage) return
    e.preventDefault()
    setSelected('image')
    
    imageDragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    }
    
    const handleMove = (e: MouseEvent) => {
      if (!imageDragState.current.active) return
      const dx = e.clientX - imageDragState.current.startX
      const dy = e.clientY - imageDragState.current.startY
      setOffset({
        x: Math.max(-50, Math.min(50, imageDragState.current.offsetX + dx * 0.15)),
        y: Math.max(-50, Math.min(50, imageDragState.current.offsetY + dy * 0.15))
      })
    }
    
    const handleUp = () => {
      imageDragState.current.active = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
    
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [locked, outpaintedImage, offset])
  
  // ==========================================================================
  // ACTIONS
  // ==========================================================================
  
  // Ukotvit pozici
  const handleLock = useCallback(() => {
    setFormatOffset(formatKey, offset)
    setLocked(true)
  }, [formatKey, offset, setFormatOffset])
  
  // Odemknout
  const handleUnlock = useCallback(() => {
    setLocked(false)
    clearOutpaintedImage(formatKey)
  }, [formatKey, clearOutpaintedImage])
  
  // Layout preset
  const applyLayoutPreset = useCallback((presetId: string) => {
    const ratio = format.width / format.height
    const isWide = ratio > 2
    const base = Math.min(format.width, format.height)
    const hSize = Math.round(Math.max(16, Math.min(72, base * 0.07)))
    const sSize = Math.round(Math.max(12, Math.min(36, base * 0.04)))
    const cSize = Math.round(Math.max(12, Math.min(28, base * 0.035)))
    
    const presets: Record<string, Partial<TextLayer>> = {
      'bottom-left': {
        headline: { x: 8, y: 55, textAlign: 'left' as const, fontSize: hSize },
        subheadline: { x: 8, y: 68, textAlign: 'left' as const, fontSize: sSize },
        cta: { x: 8, y: 82, textAlign: 'left' as const, fontSize: cSize },
        logo: { x: 92, y: 10, width: 12 },
      },
      'bottom-center': {
        headline: { x: 50, y: 55, textAlign: 'center' as const, fontSize: hSize },
        subheadline: { x: 50, y: 68, textAlign: 'center' as const, fontSize: sSize },
        cta: { x: 50, y: 82, textAlign: 'center' as const, fontSize: cSize },
        logo: { x: 50, y: 10, width: 12 },
      },
      'center': {
        headline: { x: 50, y: 35, textAlign: 'center' as const, fontSize: hSize },
        subheadline: { x: 50, y: 50, textAlign: 'center' as const, fontSize: sSize },
        cta: { x: 50, y: 65, textAlign: 'center' as const, fontSize: cSize },
        logo: { x: 50, y: 90, width: 10 },
      },
      'top-left': {
        headline: { x: 8, y: 18, textAlign: 'left' as const, fontSize: hSize },
        subheadline: { x: 8, y: 32, textAlign: 'left' as const, fontSize: sSize },
        cta: { x: 8, y: 46, textAlign: 'left' as const, fontSize: cSize },
        logo: { x: 92, y: 90, width: 12 },
      },
      'left-stack': {
        headline: { x: 5, y: 35, textAlign: 'left' as const, fontSize: isWide ? hSize * 0.8 : hSize },
        subheadline: { x: 5, y: 50, textAlign: 'left' as const, fontSize: sSize },
        cta: { x: 5, y: 65, textAlign: 'left' as const, fontSize: cSize },
        logo: { x: 92, y: 50, width: 10 },
      },
      'right-stack': {
        headline: { x: 95, y: 35, textAlign: 'right' as const, fontSize: hSize },
        subheadline: { x: 95, y: 50, textAlign: 'right' as const, fontSize: sSize },
        cta: { x: 95, y: 65, textAlign: 'right' as const, fontSize: cSize },
        logo: { x: 8, y: 50, width: 10 },
      },
    }
    
    const preset = presets[presetId]
    if (!preset) return
    
    setTextLayer(prev => ({
      headline: { ...prev.headline, ...(preset.headline || {}) },
      subheadline: { ...prev.subheadline, ...(preset.subheadline || {}) },
      cta: { ...prev.cta, ...(preset.cta || {}) },
      logo: { ...prev.logo, ...(preset.logo || {}) },
    }))
  }, [format])
  
  // Dopočítat pozadí
  const handleOutpaint = useCallback(async () => {
    if (!sourceImage || !apiKeys.openai) {
      alert('Chybí OpenAI API klíč')
      return
    }
    
    setIsOutpainting(true)
    
    try {
      const result = await outpaintWithOffset({
        apiKey: apiKeys.openai,
        sourceImage,
        targetWidth: format.width,
        targetHeight: format.height,
        offsetX: offset.x,
        offsetY: offset.y
      })
      
      if (result.success && result.image) {
        setOutpaintedImage(formatKey, result.image)
        setLocked(true)
        if (result.usedFallback) {
          console.log('Použit blur fallback')
        }
      } else {
        alert(result.error || 'Nepodařilo se dopočítat pozadí')
      }
    } catch (err) {
      console.error('Outpaint error:', err)
      alert('Chyba při dopočítávání')
    } finally {
      setIsOutpainting(false)
    }
  }, [sourceImage, apiKeys.openai, format, offset, formatKey, setOutpaintedImage])
  
  // Render to canvas
  const renderToCanvas = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current
    if (!canvas) return ''
    
    const displayImg = outpaintedImage || sourceImage
    if (!displayImg) return ''
    
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')!
    
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, format.width, format.height)
    
    // Image
    await new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (outpaintedImage) {
          // Outpainted - draw full
          ctx.drawImage(img, 0, 0, format.width, format.height)
        } else {
          // Calculate placement with offset
          const srcRatio = img.width / img.height
          const tgtRatio = format.width / format.height
          
          let drawW, drawH, drawX, drawY
          if (srcRatio > tgtRatio) {
            drawH = format.height
            drawW = format.height * srcRatio
            drawX = (format.width - drawW) / 2 + (offset.x / 100) * drawW
            drawY = (offset.y / 100) * drawH
          } else {
            drawW = format.width
            drawH = format.width / srcRatio
            drawX = (offset.x / 100) * drawW
            drawY = (format.height - drawH) / 2 + (offset.y / 100) * drawH
          }
          ctx.drawImage(img, drawX, drawY, drawW, drawH)
        }
        resolve()
      }
      img.onerror = () => resolve()
      img.src = displayImg
    })
    
    // Text layers
    const drawText = (el: TextElement, isCTA = false) => {
      if (!el.visible || !el.text) return
      const x = (el.x / 100) * format.width
      const y = (el.y / 100) * format.height
      
      ctx.font = `${el.fontWeight} ${el.fontSize}px Arial, sans-serif`
      ctx.textAlign = el.textAlign
      ctx.textBaseline = 'middle'
      
      if (el.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetY = 2
      }
      
      if (isCTA) {
        const cta = el as CTAElement
        const tw = ctx.measureText(el.text).width
        const boxW = tw + cta.paddingX * 2
        const boxH = el.fontSize + cta.paddingY * 2
        let boxX = x
        if (el.textAlign === 'center') boxX = x - boxW / 2
        else if (el.textAlign === 'right') boxX = x - boxW
        
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = cta.backgroundColor
        ctx.beginPath()
        ctx.roundRect(boxX, y - boxH / 2, boxW, boxH, cta.borderRadius)
        ctx.fill()
      }
      
      ctx.fillStyle = el.color
      ctx.fillText(el.text, x, y)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
    
    drawText(textLayer.headline)
    drawText(textLayer.subheadline)
    drawText(textLayer.cta, true)
    
    // Logo
    if (textLayer.logo.visible && brandKit?.logoMain) {
      await new Promise<void>((resolve) => {
        const logo = new Image()
        logo.crossOrigin = 'anonymous'
        logo.onload = () => {
          const w = (textLayer.logo.width / 100) * format.width
          const h = w * (logo.height / logo.width)
          const lx = (textLayer.logo.x / 100) * format.width - w / 2
          const ly = (textLayer.logo.y / 100) * format.height - h / 2
          ctx.globalAlpha = textLayer.logo.opacity
          ctx.drawImage(logo, lx, ly, w, h)
          ctx.globalAlpha = 1
          resolve()
        }
        logo.onerror = () => resolve()
        logo.src = brandKit.logoMain!
      })
    }
    
    return canvas.toDataURL('image/png')
  }, [sourceImage, outpaintedImage, format, offset, textLayer, brandKit])
  
  // Save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const rendered = await renderToCanvas()
      if (!rendered) throw new Error('Render failed')
      
      setFormatOffset(formatKey, offset)
      setPerFormatTextLayer(formatKey, textLayer)
      
      addCreatives([{
        id: `${formatKey}-${Date.now()}`,
        formatKey,
        platform: platform as any,
        category,
        format,
        baseImageUrl: sourceImage || '',
        imageUrl: rendered,
        textLayer,
        createdAt: new Date()
      }])
      
      onSave?.(rendered)
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      alert('Chyba při ukládání')
    } finally {
      setIsSaving(false)
    }
  }, [renderToCanvas, formatKey, offset, textLayer, sourceImage, format, platform, category, addCreatives, setFormatOffset, setPerFormatTextLayer, onSave, onClose])
  
  // Reset
  const handleReset = useCallback(() => {
    setTextLayer(createDefaultTextLayer(format, textOverlay, brandKit))
    setOffset({ x: 0, y: 0 })
    setFormatOffset(formatKey, { x: 0, y: 0 })
    clearOutpaintedImage(formatKey)
    setLocked(false)
    setSelected(null)
    setEditing(null)
  }, [format, textOverlay, brandKit, formatKey, setFormatOffset, clearOutpaintedImage])
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  const updateText = useCallback((type: 'headline' | 'subheadline' | 'cta', updates: Partial<TextElement | CTAElement>) => {
    setTextLayer(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }))
  }, [])
  
  const updateLogo = useCallback((updates: Partial<LogoElement>) => {
    setTextLayer(prev => ({ ...prev, logo: { ...prev.logo, ...updates } }))
  }, [])
  
  // Compute image display style
  const imageStyle = useMemo(() => {
    if (outpaintedImage) {
      return { width: '100%', height: '100%', objectFit: 'cover' as const }
    }
    return {
      position: 'absolute' as const,
      left: `${50 + offset.x}%`,
      top: `${50 + offset.y}%`,
      transform: 'translate(-50%, -50%)',
      minWidth: '100%',
      minHeight: '100%',
      width: 'auto',
      height: 'auto',
    }
  }, [outpaintedImage, offset])
  
  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{format.name}</h2>
            <p className="text-sm text-gray-500">{format.width} × {format.height}px</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex">
          {/* Canvas area */}
          <div className="flex-1 p-6 bg-gray-100 flex flex-col items-center" onClick={() => { setSelected(null); setEditing(null) }}>
            {/* Canvas */}
            <div
              ref={containerRef}
              className="relative bg-white shadow-lg overflow-hidden"
              style={{ width: displayW, height: displayH }}
            >
              {/* Empty area indicators */}
              {needsOutpaint && !outpaintedImage && !locked && (
                <>
                  {emptyAreas.top > 0 && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-500/30 border-b-2 border-amber-500 border-dashed flex items-center justify-center" style={{ height: emptyAreas.top * scale }}>
                      <span className="text-amber-800 text-xs font-medium bg-amber-200 px-2 py-0.5 rounded">Prázdná oblast</span>
                    </div>
                  )}
                  {emptyAreas.bottom > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/30 border-t-2 border-amber-500 border-dashed flex items-center justify-center" style={{ height: emptyAreas.bottom * scale }}>
                      <span className="text-amber-800 text-xs font-medium bg-amber-200 px-2 py-0.5 rounded">Prázdná oblast</span>
                    </div>
                  )}
                  {emptyAreas.left > 0 && (
                    <div className="absolute top-0 bottom-0 left-0 bg-amber-500/30 border-r-2 border-amber-500 border-dashed" style={{ width: emptyAreas.left * scale }} />
                  )}
                  {emptyAreas.right > 0 && (
                    <div className="absolute top-0 bottom-0 right-0 bg-amber-500/30 border-l-2 border-amber-500 border-dashed" style={{ width: emptyAreas.right * scale }} />
                  )}
                </>
              )}
              
              {/* Image */}
              {(sourceImage || outpaintedImage) && (
                <div
                  className={cn(
                    "absolute inset-0",
                    !locked && !outpaintedImage && "cursor-grab active:cursor-grabbing",
                    locked && !outpaintedImage && "cursor-not-allowed",
                    selected === 'image' && "ring-2 ring-blue-500 ring-inset"
                  )}
                  onMouseDown={handleImageMouseDown}
                  onClick={e => e.stopPropagation()}
                >
                  <img
                    src={outpaintedImage || sourceImage!}
                    alt=""
                    className={outpaintedImage ? "w-full h-full object-cover" : "absolute"}
                    style={outpaintedImage ? undefined : imageStyle}
                    draggable={false}
                  />
                  
                  {/* Status badge */}
                  {!outpaintedImage && (
                    <div className={cn(
                      "absolute top-2 left-2 text-xs px-2 py-1 rounded flex items-center gap-1",
                      locked ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                    )}>
                      {locked ? <><Lock className="w-3 h-3" /> Ukotveno</> : <><Move className="w-3 h-3" /> Táhni obrázek</>}
                    </div>
                  )}
                  
                  {outpaintedImage && (
                    <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded flex items-center gap-1 bg-green-500 text-white">
                      <Sparkles className="w-3 h-3" /> Pozadí hotovo
                    </div>
                  )}
                </div>
              )}
              
              {/* Text elements */}
              {textLayer.headline.visible && (
                <Draggable
                  x={textLayer.headline.x}
                  y={textLayer.headline.y}
                  onMove={(x, y) => updateText('headline', { x, y })}
                  onMoveEnd={() => {}}
                  isSelected={selected === 'headline'}
                  onSelect={() => setSelected('headline')}
                  label="Headline"
                  color="blue"
                >
                  {editing === 'headline' ? (
                    <input
                      autoFocus
                      value={textLayer.headline.text}
                      onChange={e => updateText('headline', { text: e.target.value })}
                      onBlur={() => setEditing(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                      className="px-2 py-1 border-2 border-blue-500 rounded bg-white text-black"
                      style={{ fontSize: Math.max(12, textLayer.headline.fontSize * 0.6) }}
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setEditing('headline')}
                      style={{
                        fontSize: textLayer.headline.fontSize,
                        fontWeight: textLayer.headline.fontWeight,
                        color: textLayer.headline.color,
                        textShadow: textLayer.headline.shadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                        textAlign: textLayer.headline.textAlign,
                      }}
                    >
                      {textLayer.headline.text || '[Headline]'}
                    </div>
                  )}
                </Draggable>
              )}
              
              {textLayer.subheadline.visible && (
                <Draggable
                  x={textLayer.subheadline.x}
                  y={textLayer.subheadline.y}
                  onMove={(x, y) => updateText('subheadline', { x, y })}
                  onMoveEnd={() => {}}
                  isSelected={selected === 'subheadline'}
                  onSelect={() => setSelected('subheadline')}
                  label="Subheadline"
                  color="green"
                >
                  {editing === 'subheadline' ? (
                    <input
                      autoFocus
                      value={textLayer.subheadline.text}
                      onChange={e => updateText('subheadline', { text: e.target.value })}
                      onBlur={() => setEditing(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                      className="px-2 py-1 border-2 border-green-500 rounded bg-white text-black"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setEditing('subheadline')}
                      style={{
                        fontSize: textLayer.subheadline.fontSize,
                        fontWeight: textLayer.subheadline.fontWeight,
                        color: textLayer.subheadline.color,
                        textShadow: textLayer.subheadline.shadow ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                      }}
                    >
                      {textLayer.subheadline.text || '[Subheadline]'}
                    </div>
                  )}
                </Draggable>
              )}
              
              {textLayer.cta.visible && (
                <Draggable
                  x={textLayer.cta.x}
                  y={textLayer.cta.y}
                  onMove={(x, y) => updateText('cta', { x, y })}
                  onMoveEnd={() => {}}
                  isSelected={selected === 'cta'}
                  onSelect={() => setSelected('cta')}
                  label="CTA"
                  color="orange"
                >
                  {editing === 'cta' ? (
                    <input
                      autoFocus
                      value={textLayer.cta.text}
                      onChange={e => updateText('cta', { text: e.target.value })}
                      onBlur={() => setEditing(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                      className="px-2 py-1 border-2 border-orange-500 rounded bg-white text-black"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => setEditing('cta')}
                      style={{
                        fontSize: textLayer.cta.fontSize,
                        fontWeight: textLayer.cta.fontWeight,
                        color: textLayer.cta.color,
                        backgroundColor: (textLayer.cta as CTAElement).backgroundColor,
                        padding: `${(textLayer.cta as CTAElement).paddingY}px ${(textLayer.cta as CTAElement).paddingX}px`,
                        borderRadius: (textLayer.cta as CTAElement).borderRadius,
                      }}
                    >
                      {textLayer.cta.text || '[CTA]'}
                    </div>
                  )}
                </Draggable>
              )}
              
              {textLayer.logo.visible && brandKit?.logoMain && (
                <Draggable
                  x={textLayer.logo.x}
                  y={textLayer.logo.y}
                  onMove={(x, y) => updateLogo({ x, y })}
                  onMoveEnd={() => {}}
                  isSelected={selected === 'logo'}
                  onSelect={() => setSelected('logo')}
                  label="Logo"
                  color="purple"
                >
                  <img
                    src={brandKit.logoMain}
                    alt="Logo"
                    style={{ width: (textLayer.logo.width / 100) * displayW, opacity: textLayer.logo.opacity }}
                    draggable={false}
                  />
                </Draggable>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Step 1-2: Position & Lock */}
              {!outpaintedImage && needsOutpaint && (
                <>
                  {!locked ? (
                    <Button onClick={handleLock} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Anchor className="w-4 h-4 mr-2" />
                      Ukotvit pozici
                    </Button>
                  ) : (
                    <Button onClick={handleUnlock} variant="outline" size="sm">
                      <Unlock className="w-4 h-4 mr-2" />
                      Odemknout
                    </Button>
                  )}
                </>
              )}
              
              {/* Step 3: Outpaint */}
              {needsOutpaint && locked && !outpaintedImage && (
                <Button
                  onClick={handleOutpaint}
                  disabled={isOutpainting || !apiKeys.openai}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  {isOutpainting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Dopočítat pozadí
                  <CostBadge cost={calculateCost('outpaint', { quality: 'medium' })} />
                </Button>
              )}
              
              {/* Warning if no API key */}
              {needsOutpaint && locked && !outpaintedImage && !apiKeys.openai && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Chybí OpenAI API klíč
                </span>
              )}
              
              <span className="text-xs text-gray-500">
                <MousePointer2 className="w-3 h-3 inline mr-1" />
                Dvojklik = edit textu
              </span>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 border-l p-5 overflow-y-auto max-h-[calc(95vh-80px)] bg-gray-50">
            {/* Layout Presets */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">📐 Layout preset</h3>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'bottom-left', icon: '↙️', label: 'Vlevo dole' },
                  { id: 'bottom-center', icon: '⬇️', label: 'Dole střed' },
                  { id: 'center', icon: '⏺️', label: 'Střed' },
                  { id: 'top-left', icon: '↖️', label: 'Vlevo nahoře' },
                  { id: 'left-stack', icon: '◀️', label: 'Vlevo' },
                  { id: 'right-stack', icon: '▶️', label: 'Vpravo' },
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyLayoutPreset(preset.id)}
                    className="p-2 bg-white border rounded hover:bg-gray-100 text-center"
                    title={preset.label}
                  >
                    <span className="text-lg">{preset.icon}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Layers */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                <Type className="w-4 h-4" /> Vrstvy
              </h3>
              <div className="space-y-1">
                {(['headline', 'subheadline', 'cta'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      updateText(type, { visible: !textLayer[type].visible })
                      if (textLayer[type].visible && selected === type) setSelected(null)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                      textLayer[type].visible
                        ? type === 'headline' ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : type === 'subheadline' ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-orange-50 border-orange-200 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-400'
                    )}
                  >
                    <span className="font-medium capitalize">{type}</span>
                    {textLayer[type].visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                ))}
                <button
                  onClick={() => {
                    updateLogo({ visible: !textLayer.logo.visible })
                    if (textLayer.logo.visible && selected === 'logo') setSelected(null)
                  }}
                  disabled={!brandKit?.logoMain}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                    textLayer.logo.visible ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-400',
                    !brandKit?.logoMain && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="font-medium">Logo</span>
                  {textLayer.logo.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Selected element properties */}
            {selected && selected !== 'image' && selected !== 'logo' && textLayer[selected].visible && (
              <div className="mb-5 p-4 bg-white rounded-xl border shadow-sm">
                <h4 className="text-sm font-semibold mb-3 capitalize flex items-center gap-2">
                  ✏️ {selected}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Text</label>
                    <input
                      type="text"
                      value={textLayer[selected].text}
                      onChange={e => updateText(selected, { text: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-gray-500">Velikost</label>
                      <span className="text-xs font-mono text-gray-600">{textLayer[selected].fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateText(selected, { fontSize: Math.max(10, textLayer[selected].fontSize - 2) })}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={textLayer[selected].fontSize}
                        onChange={e => updateText(selected, { fontSize: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateText(selected, { fontSize: Math.min(100, textLayer[selected].fontSize + 2) })}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Zarovnání</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button
                          key={a}
                          onClick={() => updateText(selected, { textAlign: a })}
                          className={cn(
                            'flex-1 p-2 rounded-lg border transition-colors',
                            textLayer[selected].textAlign === a ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'
                          )}
                        >
                          {a === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                          {a === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                          {a === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Barva textu</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textLayer[selected].color}
                        onChange={e => updateText(selected, { color: e.target.value })}
                        className="w-10 h-10 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={textLayer[selected].color}
                        onChange={e => updateText(selected, { color: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  {selected === 'cta' && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Pozadí CTA</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(textLayer.cta as CTAElement).backgroundColor}
                          onChange={e => updateText('cta', { backgroundColor: e.target.value })}
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(textLayer.cta as CTAElement).backgroundColor}
                          onChange={e => updateText('cta', { backgroundColor: e.target.value })}
                          className="flex-1 px-2 py-1 border rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selected === 'logo' && textLayer.logo.visible && (
              <div className="mb-5 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="text-sm font-semibold mb-3 text-purple-700">🏷️ Logo</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-purple-600">Velikost</label>
                      <span className="text-xs font-mono">{textLayer.logo.width}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={textLayer.logo.width}
                      onChange={e => updateLogo({ width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-purple-600">Průhlednost</label>
                      <span className="text-xs font-mono">{Math.round(textLayer.logo.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={textLayer.logo.opacity}
                      onChange={e => updateLogo({ opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Keyboard shortcuts */}
            <div className="mb-5 p-3 bg-gray-100 rounded-lg text-xs text-gray-500 space-y-1">
              <p><kbd className="bg-white px-1 rounded border">Delete</kbd> = skrýt prvek</p>
              <p><kbd className="bg-white px-1 rounded border">↑↓←→</kbd> = posun</p>
              <p><kbd className="bg-white px-1 rounded border">+/-</kbd> = velikost</p>
              <p><kbd className="bg-white px-1 rounded border">Dvojklik</kbd> = editace textu</p>
            </div>
            
            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={handleReset} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset vše
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Uložit formát
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
