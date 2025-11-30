/**
 * FormatEditor - Inline editor pro nastavení textu a obrázku na konkrétním formátu
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
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
  GripVertical,
  Copy
} from 'lucide-react'
import type { Format } from '@/types'

interface FormatEditorProps {
  formatKey: string
  format: Format
  sourceImage: string | null
  onClose: () => void
}

const POSITIONS = [
  { value: 'top-left', label: '↖ Vlevo nahoře' },
  { value: 'top-center', label: '↑ Nahoře' },
  { value: 'top-right', label: '↗ Vpravo nahoře' },
  { value: 'center', label: '● Střed' },
  { value: 'bottom-left', label: '↙ Vlevo dole' },
  { value: 'bottom-center', label: '↓ Dole' },
  { value: 'bottom-right', label: '↘ Vpravo dole' },
]

export function FormatEditor({ formatKey, format, sourceImage, onClose }: FormatEditorProps) {
  const {
    textOverlay,
    perFormatTextSettings,
    setPerFormatTextSettings,
    formatOffsets,
    setFormatOffset,
  } = useAppStore()

  // Lokální stav pro preview
  const settings = perFormatTextSettings[formatKey] || { fontSizeMultiplier: 1.0 }
  const imageOffset = formatOffsets[formatKey] || { x: 0, y: 0 }
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Dragging state pro obrázek
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Update settings helper
  const updateSetting = (key: string, value: any) => {
    setPerFormatTextSettings(formatKey, { [key]: value })
  }

  // Render preview
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Clear
      ctx.clearRect(0, 0, format.width, format.height)

      // Draw image with offset
      const imgAspect = img.width / img.height
      const canvasAspect = format.width / format.height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image wider - fit height
        drawHeight = format.height
        drawWidth = drawHeight * imgAspect
        drawX = (format.width - drawWidth) / 2 + (imageOffset.x / 100) * drawWidth
        drawY = (imageOffset.y / 100) * drawHeight
      } else {
        // Image taller - fit width
        drawWidth = format.width
        drawHeight = drawWidth / imgAspect
        drawX = (imageOffset.x / 100) * drawWidth
        drawY = (format.height - drawHeight) / 2 + (imageOffset.y / 100) * drawHeight
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

      // Draw text overlay
      if (textOverlay.enabled) {
        drawTextOnCanvas(ctx, format.width, format.height, settings)
      }
    }
    img.src = sourceImage
  }, [sourceImage, format, imageOffset, textOverlay, settings])

  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  // Draw text helper
  const drawTextOnCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    formatSettings: typeof settings
  ) => {
    const fontSizeMultiplier = formatSettings.fontSizeMultiplier || 1.0
    const hideHeadline = formatSettings.hideHeadline || false
    const hideSubheadline = formatSettings.hideSubheadline || false
    const hideCta = formatSettings.hideCta || false
    const position = formatSettings.customPosition || textOverlay.position || 'bottom-left'

    const padding = Math.max(8, Math.min(width, height) * 0.05)
    const fontFamily = 'Arial, Helvetica, sans-serif'

    // Calculate base sizes
    const aspectRatio = width / height
    const isWide = aspectRatio > 3
    const isTall = aspectRatio < 0.6
    const base = Math.min(width, height)

    let headlineSize = isTall ? width * 0.12 : isWide ? height * 0.28 : base * 0.14
    let subSize = isTall ? width * 0.08 : isWide ? height * 0.18 : base * 0.09
    let ctaSize = isTall ? width * 0.09 : isWide ? height * 0.20 : base * 0.08

    // Apply multiplier
    headlineSize *= fontSizeMultiplier
    subSize *= fontSizeMultiplier
    ctaSize *= fontSizeMultiplier

    // Clamp
    headlineSize = Math.max(10, Math.min(headlineSize, 48))
    subSize = Math.max(8, Math.min(subSize, 28))
    ctaSize = Math.max(8, Math.min(ctaSize, 22))

    // What to show
    const showHeadline = textOverlay.headline && !hideHeadline
    const showSubheadline = textOverlay.subheadline && !hideSubheadline && !isWide
    const showCta = textOverlay.cta && !hideCta

    // Word wrap
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      ctx.font = `bold ${fontSize}px ${fontFamily}`
      const words = text.split(' ')
      const lines: string[] = []
      let line = ''
      
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = testLine
        }
      }
      if (line) lines.push(line)
      return lines.slice(0, 3) // Max 3 lines
    }

    const maxTextWidth = width - padding * 2
    const headlineLines = showHeadline ? wrapText(textOverlay.headline, maxTextWidth, headlineSize) : []
    const subLines = showSubheadline ? wrapText(textOverlay.subheadline, maxTextWidth, subSize) : []

    // Calculate block height
    const lineHeight = 1.2
    let blockHeight = 0
    if (headlineLines.length > 0) blockHeight += headlineLines.length * headlineSize * lineHeight
    if (subLines.length > 0) blockHeight += subLines.length * subSize * lineHeight + 4
    if (showCta) blockHeight += ctaSize * 2.2 + 8

    // Position
    let x = padding
    let startY = padding
    let align: CanvasTextAlign = 'left'

    if (position.includes('right')) {
      x = width - padding
      align = 'right'
    } else if (position.includes('center') || position === 'center') {
      x = width / 2
      align = 'center'
    }

    if (position.includes('bottom')) {
      startY = height - padding - blockHeight
    } else if (position === 'center') {
      startY = (height - blockHeight) / 2
    }

    startY = Math.max(padding / 2, Math.min(startY, height - blockHeight - padding / 2))

    ctx.textAlign = align
    ctx.textBaseline = 'top'
    let currentY = startY

    // Draw headline
    if (headlineLines.length > 0) {
      ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = Math.max(2, headlineSize * 0.08)
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      for (const line of headlineLines) {
        ctx.fillText(line, x, currentY)
        currentY += headlineSize * lineHeight
      }
    }

    // Draw subheadline
    if (subLines.length > 0) {
      currentY += 4
      ctx.font = `${Math.round(subSize)}px ${fontFamily}`
      ctx.shadowBlur = Math.max(1, subSize * 0.06)

      for (const line of subLines) {
        ctx.fillText(line, x, currentY)
        currentY += subSize * lineHeight
      }
    }

    // Draw CTA
    if (showCta) {
      currentY += 8
      ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
      
      const ctaText = textOverlay.cta
      const ctaTextWidth = ctx.measureText(ctaText).width
      const ctaPadX = ctaSize * 0.6
      const ctaPadY = ctaSize * 0.35
      const ctaWidth = ctaTextWidth + ctaPadX * 2
      const ctaHeight = ctaSize + ctaPadY * 2

      let ctaX = x
      if (align === 'right') ctaX = x - ctaWidth
      else if (align === 'center') ctaX = x - ctaWidth / 2

      // Clamp CTA position
      ctaX = Math.max(padding / 2, Math.min(ctaX, width - ctaWidth - padding / 2))
      const ctaY = Math.min(currentY, height - ctaHeight - padding / 2)

      // Draw button
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.fillStyle = textOverlay.ctaColor || '#ff6600'
      ctx.beginPath()
      const radius = ctaHeight / 2
      ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, radius)
      ctx.fill()

      // Draw text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ctaText, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2)
    }

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // Mouse handlers for image dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    const sensitivity = 0.2
    const newX = Math.max(-50, Math.min(50, imageOffset.x + dx * sensitivity))
    const newY = Math.max(-50, Math.min(50, imageOffset.y + dy * sensitivity))

    setFormatOffset(formatKey, { x: newX, y: newY })
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset all settings for this format
  const resetSettings = () => {
    setPerFormatTextSettings(formatKey, {
      fontSizeMultiplier: 1.0,
      hideHeadline: false,
      hideSubheadline: false,
      hideCta: false,
      customPosition: undefined,
    })
    setFormatOffset(formatKey, { x: 0, y: 0 })
  }

  // Calculate preview scale
  const maxPreviewWidth = 400
  const maxPreviewHeight = 350
  const scaleX = maxPreviewWidth / format.width
  const scaleY = maxPreviewHeight / format.height
  const scale = Math.min(scaleX, scaleY, 1)
  const previewWidth = format.width * scale
  const previewHeight = format.height * scale

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {format.name}
            </h2>
            <p className="text-sm text-gray-500">
              {format.width} × {format.height} px
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Preview */}
          <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
            <div
              ref={containerRef}
              className="relative bg-gray-200 rounded-lg overflow-hidden shadow-lg cursor-move"
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
              
              {/* Drag hint */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs flex items-center gap-1">
                <Move className="w-3 h-3" />
                Táhni pro posun obrázku
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="w-80 p-6 border-l border-gray-200 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Text Position */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Type className="w-4 h-4" />
                Pozice textu
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
                <span className="text-sm font-mono text-gray-500">
                  {Math.round((settings.fontSizeMultiplier || 1.0) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting('fontSizeMultiplier', Math.max(0.5, (settings.fontSizeMultiplier || 1.0) - 0.1))}
                  className="p-2 h-8 w-8"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings.fontSizeMultiplier || 1.0}
                  onChange={(e) => updateSetting('fontSizeMultiplier', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting('fontSizeMultiplier', Math.min(1.5, (settings.fontSizeMultiplier || 1.0) + 0.1))}
                  className="p-2 h-8 w-8"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Visibility Toggles */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Zobrazit prvky</label>
              <div className="space-y-2">
                <button
                  onClick={() => updateSetting('hideHeadline', !settings.hideHeadline)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                    settings.hideHeadline
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-green-50 border-green-200 text-green-700'
                  )}
                >
                  <span className="text-sm">Headline</span>
                  {settings.hideHeadline ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => updateSetting('hideSubheadline', !settings.hideSubheadline)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                    settings.hideSubheadline
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-green-50 border-green-200 text-green-700'
                  )}
                >
                  <span className="text-sm">Subheadline</span>
                  {settings.hideSubheadline ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => updateSetting('hideCta', !settings.hideCta)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors',
                    settings.hideCta
                      ? 'bg-gray-100 border-gray-200 text-gray-400'
                      : 'bg-green-50 border-green-200 text-green-700'
                  )}
                >
                  <span className="text-sm">CTA tlačítko</span>
                  {settings.hideCta ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Image Offset Info */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Pozice obrázku</label>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>X: {imageOffset.x.toFixed(0)}%</span>
                <span>Y: {imageOffset.y.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Táhněte na náhledu pro posun
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button
                variant="outline"
                onClick={resetSettings}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetovat nastavení
              </Button>
              
              <Button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Hotovo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
