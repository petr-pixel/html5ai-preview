/**
 * FormatEditor - Kompletní editor pro jednotlivý formát
 * 
 * Funkce:
 * - Drag & drop pro obrázek
 * - Drag & drop pro jednotlivé textové prvky (headline, sub, CTA)
 * - Dopočítat pozadí (AI outpainting)
 * - Uložit jen tento formát
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { outpaintImage } from '@/lib/openai-client'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { 
  X, 
  RotateCcw,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Move,
  Type,
  Wand2,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react'
import type { Format, Creative } from '@/types'

interface FormatEditorProps {
  formatKey: string
  format: Format
  sourceImage: string | null
  onClose: () => void
}

interface ElementPosition {
  x: number  // 0-100 procent
  y: number  // 0-100 procent
}

const POSITIONS = [
  { value: 'top-left', label: '↖ Vlevo nahoře' },
  { value: 'top-center', label: '↑ Nahoře' },
  { value: 'top-right', label: '↗ Vpravo nahoře' },
  { value: 'center', label: '● Střed' },
  { value: 'bottom-left', label: '↙ Vlevo dole' },
  { value: 'bottom-center', label: '↓ Dole' },
  { value: 'bottom-right', label: '↘ Vpravo dole' },
  { value: 'custom', label: '✋ Vlastní (táhněte)' },
]

export function FormatEditor({ formatKey, format, sourceImage, onClose }: FormatEditorProps) {
  const {
    textOverlay,
    perFormatTextSettings,
    setPerFormatTextSettings,
    formatOffsets,
    setFormatOffset,
    apiKeys,
    addCreatives,
    brandKits,
    activeBrandKit,
    outpaintedImages,
    setOutpaintedImage: setGlobalOutpaintedImage,
    clearOutpaintedImage,
  } = useAppStore()

  // Lokální stav
  const settings = perFormatTextSettings[formatKey] || { fontSizeMultiplier: 1.0 }
  const imageOffset = formatOffsets[formatKey] || { x: 0, y: 0 }
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Dragging state
  const [dragMode, setDragMode] = useState<'image' | 'headline' | 'subheadline' | 'cta' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Element positions (lokální stav pro drag)
  const [headlinePos, setHeadlinePos] = useState<ElementPosition | null>(null)
  const [subheadlinePos, setSubheadlinePos] = useState<ElementPosition | null>(null)
  const [ctaPos, setCtaPos] = useState<ElementPosition | null>(null)
  
  // Outpainting state
  const [isOutpainting, setIsOutpainting] = useState(false)
  const outpaintedImage = outpaintedImages[formatKey] || null
  const [hasEmptySpace, setHasEmptySpace] = useState(false)
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false)

  const currentBrandKit = brandKits.find(b => b.id === activeBrandKit)

  // Detekce prázdného místa
  useEffect(() => {
    if (!sourceImage) return
    
    const img = new Image()
    img.onload = () => {
      const imgAspect = img.width / img.height
      const canvasAspect = format.width / format.height
      
      // Pokud aspect ratio je hodně jiný, bude prázdné místo
      const aspectDiff = Math.abs(imgAspect - canvasAspect)
      setHasEmptySpace(aspectDiff > 0.3)
    }
    img.src = sourceImage
  }, [sourceImage, format])

  // Update settings helper
  const updateSetting = (key: string, value: any) => {
    setPerFormatTextSettings(formatKey, { [key]: value })
  }

  // Render preview
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current
    const imgSrc = outpaintedImage || sourceImage
    if (!canvas || !imgSrc) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Clear
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, format.width, format.height)

      // Pokud je outpainted obrázek, nakresli ho přímo (už má správné rozměry)
      if (outpaintedImage) {
        ctx.drawImage(img, 0, 0, format.width, format.height)
      } else {
        // Původní obrázek - aplikuj offset
        const imgAspect = img.width / img.height
        const canvasAspect = format.width / format.height

        let drawWidth, drawHeight, drawX, drawY

        if (imgAspect > canvasAspect) {
          drawHeight = format.height
          drawWidth = drawHeight * imgAspect
          drawX = (format.width - drawWidth) / 2 + (imageOffset.x / 100) * drawWidth
          drawY = (imageOffset.y / 100) * drawHeight
        } else {
          drawWidth = format.width
          drawHeight = drawWidth / imgAspect
          drawX = (imageOffset.x / 100) * drawWidth
          drawY = (format.height - drawHeight) / 2 + (imageOffset.y / 100) * drawHeight
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      }

      // Draw text overlay
      if (textOverlay.enabled) {
        drawTextOnCanvas(ctx, format.width, format.height)
      }
    }
    img.src = imgSrc
  }, [sourceImage, outpaintedImage, format, imageOffset, textOverlay, settings, headlinePos, subheadlinePos, ctaPos])

  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  // Draw text helper
  const drawTextOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const fontSizeMultiplier = settings.fontSizeMultiplier || 1.0
    const hideHeadline = settings.hideHeadline || false
    const hideSubheadline = settings.hideSubheadline || false
    const hideCta = settings.hideCta || false

    const padding = Math.max(8, Math.min(width, height) * 0.05)
    const fontFamily = currentBrandKit?.headlineFont || 'Arial, Helvetica, sans-serif'
    const textColor = currentBrandKit?.textColor || '#ffffff'

    // Calculate base sizes
    const aspectRatio = width / height
    const isWide = aspectRatio > 3
    const isTall = aspectRatio < 0.6
    const base = Math.min(width, height)

    let headlineSize = isTall ? width * 0.12 : isWide ? height * 0.28 : base * 0.14
    let subSize = isTall ? width * 0.08 : isWide ? height * 0.18 : base * 0.09
    let ctaSize = isTall ? width * 0.09 : isWide ? height * 0.20 : base * 0.08

    headlineSize = Math.max(10, Math.min(headlineSize * fontSizeMultiplier, 48))
    subSize = Math.max(8, Math.min(subSize * fontSizeMultiplier, 28))
    ctaSize = Math.max(8, Math.min(ctaSize * fontSizeMultiplier, 22))

    const showHeadline = textOverlay.headline && !hideHeadline
    const showSubheadline = textOverlay.subheadline && !hideSubheadline && !isWide
    const showCta = textOverlay.cta && !hideCta

    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4

    // Custom positions
    if (showHeadline && headlinePos) {
      const x = (headlinePos.x / 100) * width
      const y = (headlinePos.y / 100) * height
      ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.fillText(textOverlay.headline, x, y)
    }
    
    if (showSubheadline && subheadlinePos) {
      const x = (subheadlinePos.x / 100) * width
      const y = (subheadlinePos.y / 100) * height
      ctx.font = `${Math.round(subSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.fillText(textOverlay.subheadline, x, y)
    }
    
    if (showCta && ctaPos) {
      const x = (ctaPos.x / 100) * width
      const y = (ctaPos.y / 100) * height
      ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
      const ctaText = textOverlay.cta
      const ctaTextWidth = ctx.measureText(ctaText).width
      const ctaPadX = ctaSize * 0.6
      const ctaPadY = ctaSize * 0.35
      const ctaW = ctaTextWidth + ctaPadX * 2
      const ctaH = ctaSize + ctaPadY * 2
      
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = textOverlay.ctaColor || '#ff6600'
      ctx.beginPath()
      ctx.roundRect(x - ctaW/2, y - ctaH/2, ctaW, ctaH, ctaH/2)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(ctaText, x, y)
    }

    // Default positions for elements without custom pos
    if (!headlinePos || !subheadlinePos || !ctaPos) {
      const position = settings.customPosition || textOverlay.position || 'bottom-left'
      let x = padding
      let startY = height - padding
      let align: CanvasTextAlign = 'left'

      if (position.includes('right')) { x = width - padding; align = 'right' }
      else if (position.includes('center') || position === 'center') { x = width / 2; align = 'center' }
      if (position.includes('top')) startY = padding + headlineSize
      else if (position === 'center') startY = height / 2

      ctx.textAlign = align
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      let currentY = startY

      // CTA
      if (showCta && !ctaPos) {
        ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
        const ctaText = textOverlay.cta
        const ctaTextWidth = ctx.measureText(ctaText).width
        const ctaPadX = ctaSize * 0.6
        const ctaPadY = ctaSize * 0.35
        const ctaW = ctaTextWidth + ctaPadX * 2
        const ctaH = ctaSize + ctaPadY * 2

        let ctaX = x
        if (align === 'right') ctaX = x - ctaW
        else if (align === 'center') ctaX = x - ctaW / 2

        const ctaY = currentY - ctaH
        
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = textOverlay.ctaColor || '#ff6600'
        ctx.beginPath()
        ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ctaText, ctaX + ctaW / 2, ctaY + ctaH / 2)
        
        currentY = ctaY - 8
        ctx.textAlign = align
        ctx.textBaseline = 'bottom'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
      }

      // Subheadline
      if (showSubheadline && !subheadlinePos) {
        ctx.font = `${Math.round(subSize)}px ${fontFamily}`
        ctx.fillStyle = textColor
        ctx.fillText(textOverlay.subheadline, x, currentY)
        currentY -= subSize * 1.2 + 4
      }

      // Headline
      if (showHeadline && !headlinePos) {
        ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
        ctx.fillStyle = textColor
        ctx.fillText(textOverlay.headline, x, currentY)
      }
    }

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragMode('image')
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (dragMode === 'image') {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      const sensitivity = 0.3
      const newX = Math.max(-50, Math.min(50, imageOffset.x + dx * sensitivity))
      const newY = Math.max(-50, Math.min(50, imageOffset.y + dy * sensitivity))
      setFormatOffset(formatKey, { x: newX, y: newY })
      setDragStart({ x: e.clientX, y: e.clientY })
    } else {
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100))
      
      if (dragMode === 'headline') setHeadlinePos({ x, y })
      else if (dragMode === 'subheadline') setSubheadlinePos({ x, y })
      else if (dragMode === 'cta') setCtaPos({ x, y })
    }
  }

  const handleMouseUp = () => {
    setDragMode(null)
  }

  // Outpainting handler
  const handleOutpaint = async () => {
    if (!sourceImage || !apiKeys.openai) {
      alert('Pro dopočítání pozadí je potřeba OpenAI API klíč')
      return
    }
    
    setIsOutpainting(true)
    
    try {
      const result = await outpaintImage(
        { apiKey: apiKeys.openai },
        {
          image: sourceImage,
          targetWidth: format.width,
          targetHeight: format.height,
          prompt: 'Continue the background seamlessly, match lighting and style',
        }
      )
      
      if (result.success && result.image) {
        // Uložit do globálního store
        setGlobalOutpaintedImage(formatKey, result.image)
        setHasEmptySpace(false)
        
        if (result.usedFallback) {
          console.log('Použit blur fallback místo AI outpaintingu')
        }
      } else {
        alert(result.error || 'Nepodařilo se dopočítat pozadí')
      }
    } catch (err) {
      console.error('Outpainting error:', err)
      alert('Chyba při dopočítávání pozadí')
    } finally {
      setIsOutpainting(false)
    }
  }

  // Uložit tento formát
  const handleSaveFormat = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsSaving(true)
    
    try {
      const imageUrl = canvas.toDataURL('image/png')
      const base64Length = imageUrl.split(',')[1]?.length || 0
      const sizeKB = Math.round((base64Length * 3) / 4 / 1024)
      
      const creative: Creative = {
        id: `${formatKey}-${Date.now()}`,
        formatKey,
        platform: formatKey.split('-')[0] as any,
        category: formatKey.split('-')[1],
        format: { width: format.width, height: format.height, name: format.name },
        imageUrl,
        createdAt: new Date(),
        sizeKB,
      }
      
      addCreatives([creative])
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      alert('Chyba při ukládání')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset
  const resetSettings = () => {
    setPerFormatTextSettings(formatKey, {
      fontSizeMultiplier: 1.0,
      hideHeadline: false,
      hideSubheadline: false,
      hideCta: false,
      customPosition: undefined,
    })
    setFormatOffset(formatKey, { x: 0, y: 0 })
    setHeadlinePos(null)
    setSubheadlinePos(null)
    setCtaPos(null)
    clearOutpaintedImage(formatKey)
  }

  // Start dragging element
  const enableElementDrag = (element: 'headline' | 'subheadline' | 'cta') => {
    if (element === 'headline') setHeadlinePos({ x: 50, y: 25 })
    else if (element === 'subheadline') setSubheadlinePos({ x: 50, y: 50 })
    else if (element === 'cta') setCtaPos({ x: 50, y: 75 })
  }

  // Calculate preview scale
  const maxPreviewWidth = 500
  const maxPreviewHeight = 400
  const scaleX = maxPreviewWidth / format.width
  const scaleY = maxPreviewHeight / format.height
  const scale = Math.min(scaleX, scaleY, 1)
  const previewWidth = format.width * scale
  const previewHeight = format.height * scale

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{format.name}</h2>
            <p className="text-sm text-gray-500">{format.width} × {format.height} px</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Preview */}
          <div className="flex-1 p-6 bg-gray-50 flex flex-col items-center justify-center">
            <div
              ref={containerRef}
              className="relative bg-white rounded-lg overflow-hidden shadow-lg cursor-move border-2 border-dashed border-gray-300"
              style={{ width: previewWidth, height: previewHeight }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={format.width}
                height={format.height}
                className="w-full h-full"
              />
              
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs flex items-center gap-1">
                <Move className="w-3 h-3" />
                Táhni pro posun obrázku
              </div>

              {/* Draggable element indicators */}
              {textOverlay.enabled && (
                <>
                  {headlinePos && (
                    <div 
                      className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-move z-10"
                      style={{ left: `${headlinePos.x}%`, top: `${headlinePos.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => { e.stopPropagation(); setDragMode('headline'); setDragStart({ x: e.clientX, y: e.clientY }) }}
                    />
                  )}
                  {subheadlinePos && (
                    <div 
                      className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-move z-10"
                      style={{ left: `${subheadlinePos.x}%`, top: `${subheadlinePos.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => { e.stopPropagation(); setDragMode('subheadline'); setDragStart({ x: e.clientX, y: e.clientY }) }}
                    />
                  )}
                  {ctaPos && (
                    <div 
                      className="absolute w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg cursor-move z-10"
                      style={{ left: `${ctaPos.x}%`, top: `${ctaPos.y}%`, transform: 'translate(-50%, -50%)' }}
                      onMouseDown={(e) => { e.stopPropagation(); setDragMode('cta'); setDragStart({ x: e.clientX, y: e.clientY }) }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Outpaint button */}
            {hasEmptySpace && !outpaintedImage && (
              <Button
                onClick={handleOutpaint}
                disabled={isOutpainting || !apiKeys.openai}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isOutpainting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Dopočítávám...</>
                ) : (
                  <><Wand2 className="w-4 h-4 mr-2" />Dopočítat pozadí (AI)</>
                )}
              </Button>
            )}
            
            {outpaintedImage && (
              <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />Pozadí dopočítáno
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="w-80 p-6 border-l border-gray-200 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* Text Position */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Type className="w-4 h-4" />Pozice textu
              </label>
              <select
                value={settings.customPosition || textOverlay.position || 'bottom-left'}
                onChange={(e) => updateSetting('customPosition', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POSITIONS.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Velikost textu</label>
                <span className="text-sm font-mono text-gray-500">{Math.round((settings.fontSizeMultiplier || 1.0) * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => updateSetting('fontSizeMultiplier', Math.max(0.5, (settings.fontSizeMultiplier || 1.0) - 0.1))} className="p-2 h-8 w-8">
                  <Minus className="w-3 h-3" />
                </Button>
                <input type="range" min="0.5" max="1.5" step="0.05" value={settings.fontSizeMultiplier || 1.0} onChange={(e) => updateSetting('fontSizeMultiplier', parseFloat(e.target.value))} className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => updateSetting('fontSizeMultiplier', Math.min(1.5, (settings.fontSizeMultiplier || 1.0) + 0.1))} className="p-2 h-8 w-8">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Visibility Toggles with Drag option */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Zobrazit prvky</label>
              <div className="space-y-2">
                {/* Headline */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting('hideHeadline', !settings.hideHeadline)}
                    className={cn(
                      'flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                      settings.hideHeadline ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    <span className="text-sm">Headline</span>
                    {settings.hideHeadline ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {!settings.hideHeadline && textOverlay.headline && (
                    <button
                      onClick={() => enableElementDrag('headline')}
                      className={cn("p-2 rounded-lg border transition-colors", headlinePos ? "border-blue-500 bg-blue-100 text-blue-700" : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100")}
                      title="Vlastní pozice"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Subheadline */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting('hideSubheadline', !settings.hideSubheadline)}
                    className={cn(
                      'flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                      settings.hideSubheadline ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    <span className="text-sm">Subheadline</span>
                    {settings.hideSubheadline ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {!settings.hideSubheadline && textOverlay.subheadline && (
                    <button
                      onClick={() => enableElementDrag('subheadline')}
                      className={cn("p-2 rounded-lg border transition-colors", subheadlinePos ? "border-green-500 bg-green-100 text-green-700" : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100")}
                      title="Vlastní pozice"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* CTA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSetting('hideCta', !settings.hideCta)}
                    className={cn(
                      'flex-1 flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                      settings.hideCta ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-green-50 border-green-200 text-green-700'
                    )}
                  >
                    <span className="text-sm">CTA tlačítko</span>
                    {settings.hideCta ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {!settings.hideCta && textOverlay.cta && (
                    <button
                      onClick={() => enableElementDrag('cta')}
                      className={cn("p-2 rounded-lg border transition-colors", ctaPos ? "border-orange-500 bg-orange-100 text-orange-700" : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100")}
                      title="Vlastní pozice"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {(headlinePos || subheadlinePos || ctaPos) && (
                <p className="text-xs text-gray-500 mt-2">
                  Táhněte barevné body na náhledu pro přesun prvků
                </p>
              )}
            </div>

            {/* Image Offset Info */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Pozice obrázku</label>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>X: {imageOffset.x.toFixed(0)}%</span>
                <span>Y: {imageOffset.y.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Táhněte na náhledu pro posun</p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button variant="outline" onClick={resetSettings} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />Resetovat nastavení
              </Button>
              
              <Button
                onClick={handleSaveFormat}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ukládám...</> : <><Save className="w-4 h-4 mr-2" />Uložit tento formát</>}
              </Button>
              
              <Button onClick={onClose} variant="ghost" className="w-full">Hotovo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
