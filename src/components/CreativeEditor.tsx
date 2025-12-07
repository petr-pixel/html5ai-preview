'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Modal, Input, Badge } from '@/components/ui'
import { getFormatById, getPlatformFromFormatId } from '@/lib/formats'
import type { Format, FormatSettings, TextOverlay } from '@/types'
import { 
  Edit3, 
  Move, 
  Type, 
  Image, 
  Check, 
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  Wand2,
  Download
} from 'lucide-react'

interface CreativePreviewProps {
  format: Format
  sourceImage: string
  settings: Partial<FormatSettings>
  text: TextOverlay
  brandKit: any
  onClick?: () => void
}

function CreativePreview({ format, sourceImage, settings, text, brandKit, onClick }: CreativePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !sourceImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Clear
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, format.width, format.height)

      // Calculate crop
      const cropX = settings.cropX ?? 0.5
      const cropY = settings.cropY ?? 0.5
      const scale = settings.cropScale ?? 1

      const imgAspect = img.width / img.height
      const formatAspect = format.width / format.height

      let srcW, srcH, srcX, srcY

      if (imgAspect > formatAspect) {
        // Image is wider
        srcH = img.height / scale
        srcW = srcH * formatAspect
        srcX = (img.width - srcW) * cropX
        srcY = (img.height - srcH) * cropY
      } else {
        // Image is taller
        srcW = img.width / scale
        srcH = srcW / formatAspect
        srcX = (img.width - srcW) * cropX
        srcY = (img.height - srcH) * cropY
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, format.width, format.height)

      // Draw safe zone overlay if exists
      if (format.safeZone) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(
          format.safeZone.x,
          format.safeZone.y,
          format.safeZone.width,
          format.safeZone.height
        )
        ctx.setLineDash([])
      }

      // Draw text overlay
      if (text.showHeadline && text.headline) {
        const padding = Math.min(format.width, format.height) * 0.05
        const fontSize = Math.min(format.width, format.height) * 0.08
        
        // Position
        let textX = padding
        let textY = format.height - padding

        if (text.position.includes('top')) textY = padding + fontSize
        if (text.position.includes('center') && !text.position.includes('bottom') && !text.position.includes('top')) {
          textY = format.height / 2
        }
        if (text.position.includes('right')) textX = format.width - padding
        if (text.position === 'center' || text.position === 'top-center' || text.position === 'bottom-center') {
          textX = format.width / 2
        }

        // Background
        ctx.font = `bold ${fontSize}px ${text.fontFamily}`
        const metrics = ctx.measureText(text.headline)
        const bgPadding = fontSize * 0.3

        let bgX = textX - bgPadding
        let bgY = textY - fontSize
        let textAlign: CanvasTextAlign = 'left'

        if (text.position.includes('center')) {
          bgX = textX - metrics.width / 2 - bgPadding
          textAlign = 'center'
        }
        if (text.position.includes('right')) {
          bgX = textX - metrics.width - bgPadding
          textAlign = 'right'
        }

        ctx.fillStyle = text.backgroundColor
        ctx.fillRect(bgX, bgY, metrics.width + bgPadding * 2, fontSize + bgPadding)

        // Text
        ctx.fillStyle = text.color
        ctx.textAlign = textAlign
        ctx.textBaseline = 'bottom'
        ctx.fillText(text.headline, textX, textY)

        // CTA button
        if (text.showCta && text.cta) {
          const ctaFontSize = fontSize * 0.6
          ctx.font = `bold ${ctaFontSize}px ${text.fontFamily}`
          const ctaMetrics = ctx.measureText(text.cta)
          const ctaPadding = ctaFontSize * 0.4
          const ctaY = textY + ctaFontSize + padding * 0.5

          let ctaX = textX
          if (textAlign === 'center') ctaX = textX - ctaMetrics.width / 2 - ctaPadding
          else if (textAlign === 'right') ctaX = textX - ctaMetrics.width - ctaPadding * 2
          else ctaX = textX - ctaPadding

          ctx.fillStyle = brandKit.accentColor || '#f59e0b'
          ctx.beginPath()
          ctx.roundRect(ctaX, ctaY - ctaFontSize, ctaMetrics.width + ctaPadding * 2, ctaFontSize + ctaPadding, 4)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'left'
          ctx.fillText(text.cta, ctaX + ctaPadding, ctaY)
        }
      }

      // Draw logo if enabled
      if (settings.logoVisible && brandKit.logo) {
        const logoImg = new window.Image()
        logoImg.crossOrigin = 'anonymous'
        logoImg.onload = () => {
          const logoSize = Math.min(format.width, format.height) * 0.15 * (settings.logoScale || 1)
          const logoPadding = Math.min(format.width, format.height) * 0.03
          
          let logoX = logoPadding
          let logoY = logoPadding

          if (settings.logoPosition?.includes('right')) logoX = format.width - logoSize - logoPadding
          if (settings.logoPosition?.includes('bottom')) logoY = format.height - logoSize - logoPadding

          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
          setRendered(true)
        }
        logoImg.src = brandKit.logo
      } else {
        setRendered(true)
      }
    }
    img.src = sourceImage
  }, [sourceImage, format, settings, text, brandKit])

  const scale = Math.min(300 / format.width, 200 / format.height, 1)

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={onClick}
      style={{ width: format.width * scale, height: format.height * scale }}
    >
      <canvas
        ref={canvasRef}
        width={format.width}
        height={format.height}
        className="rounded border border-gray-200 shadow-sm"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
        <Edit3 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export function CreativeEditor() {
  const {
    sourceImage,
    selectedFormats,
    formatSettings,
    setFormatSettings,
    defaultText,
    setDefaultText,
    brandKit,
    setActiveTab,
    apiKey,
  } = useAppStore()

  const [editingFormat, setEditingFormat] = useState<string | null>(null)
  const [localSettings, setLocalSettings] = useState<Partial<FormatSettings>>({})
  const [localText, setLocalText] = useState<TextOverlay>(defaultText)
  const [detecting, setDetecting] = useState(false)

  const format = editingFormat ? getFormatById(editingFormat) : null

  useEffect(() => {
    if (editingFormat) {
      setLocalSettings(formatSettings[editingFormat] || {
        cropX: 0.5,
        cropY: 0.5,
        cropScale: 1,
        logoVisible: true,
        logoPosition: 'bottom-right',
        logoScale: 1,
      })
      setLocalText(formatSettings[editingFormat]?.textOverlay || defaultText)
    }
  }, [editingFormat, formatSettings, defaultText])

  const saveSettings = () => {
    if (!editingFormat) return
    setFormatSettings(editingFormat, {
      ...localSettings,
      textOverlay: localText,
    })
    setEditingFormat(null)
  }

  const applyToAll = () => {
    selectedFormats.forEach(formatId => {
      setFormatSettings(formatId, {
        ...localSettings,
        textOverlay: localText,
      })
    })
    setEditingFormat(null)
  }

  const detectSmartCrop = async () => {
    if (!apiKey || !sourceImage || !format) return
    setDetecting(true)
    try {
      const res = await fetch('/api/smart-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImage,
          apiKey,
          targetWidth: format.width,
          targetHeight: format.height,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setLocalSettings(prev => ({
          ...prev,
          cropX: data.focusX,
          cropY: data.focusY,
        }))
      }
    } catch (err) {
      console.error('Smart crop error:', err)
    }
    setDetecting(false)
  }

  const formatArray = Array.from(selectedFormats)
    .map(id => getFormatById(id))
    .filter(Boolean) as Format[]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Editor kreativ</h2>
        <div className="flex gap-2">
          <Badge>{formatArray.length} formátů</Badge>
          <Button size="sm" onClick={() => setActiveTab('export')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Global Text Settings */}
      <Card>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Type className="w-4 h-4" />
          Výchozí texty (pro všechny formáty)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Headline"
            value={defaultText.headline}
            onChange={(e) => setDefaultText({ headline: e.target.value })}
          />
          <Input
            label="Subheadline"
            value={defaultText.subheadline}
            onChange={(e) => setDefaultText({ subheadline: e.target.value })}
          />
          <Input
            label="CTA"
            value={defaultText.cta}
            onChange={(e) => setDefaultText({ cta: e.target.value })}
          />
        </div>
      </Card>

      {/* Format Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {formatArray.map((format) => {
          const settings = formatSettings[format.id] || {}
          const text = settings.textOverlay || defaultText
          const platform = getPlatformFromFormatId(format.id)

          return (
            <Card key={format.id} padding="sm" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  platform === 'sklik' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {platform === 'sklik' ? 'Sklik' : 'Google'}
                </span>
                <span className="text-xs text-gray-500">{format.width}×{format.height}</span>
              </div>

              <CreativePreview
                format={format}
                sourceImage={sourceImage!}
                settings={settings}
                text={text}
                brandKit={brandKit}
                onClick={() => setEditingFormat(format.id)}
              />

              <p className="text-xs font-medium truncate">{format.name}</p>
            </Card>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingFormat}
        onClose={() => setEditingFormat(null)}
        title={format ? `Upravit: ${format.name} (${format.width}×${format.height})` : 'Upravit'}
        size="xl"
      >
        {format && sourceImage && (
          <div className="grid grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              <h4 className="font-medium mb-3">Náhled</h4>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                <CreativePreview
                  format={format}
                  sourceImage={sourceImage}
                  settings={localSettings}
                  text={localText}
                  brandKit={brandKit}
                />
              </div>
              
              {format.safeZone && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 inline mr-2" />
                  <strong>Safe Zone:</strong> {format.safeZone.description}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Crop */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    Pozice obrázku
                  </h4>
                  <Button size="sm" variant="ghost" onClick={detectSmartCrop} loading={detecting}>
                    <Wand2 className="w-4 h-4 mr-1" />
                    Auto
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Horizontálně</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localSettings.cropX ?? 0.5}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, cropX: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Vertikálně</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localSettings.cropY ?? 0.5}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, cropY: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs text-gray-500">Zoom</label>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={localSettings.cropScale ?? 1}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, cropScale: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Text */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Text
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localText.showHeadline}
                      onChange={(e) => setLocalText(prev => ({ ...prev, showHeadline: e.target.checked }))}
                    />
                    <Input
                      value={localText.headline}
                      onChange={(e) => setLocalText(prev => ({ ...prev, headline: e.target.value }))}
                      placeholder="Headline"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localText.showCta}
                      onChange={(e) => setLocalText(prev => ({ ...prev, showCta: e.target.checked }))}
                    />
                    <Input
                      value={localText.cta}
                      onChange={(e) => setLocalText(prev => ({ ...prev, cta: e.target.value }))}
                      placeholder="CTA"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Pozice:</label>
                    <select
                      value={localText.position}
                      onChange={(e) => setLocalText(prev => ({ ...prev, position: e.target.value as any }))}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="top-left">Vlevo nahoře</option>
                      <option value="top-center">Nahoře</option>
                      <option value="top-right">Vpravo nahoře</option>
                      <option value="center">Střed</option>
                      <option value="bottom-left">Vlevo dole</option>
                      <option value="bottom-center">Dole</option>
                      <option value="bottom-right">Vpravo dole</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo
                </h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={localSettings.logoVisible ?? true}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, logoVisible: e.target.checked }))}
                    />
                    Zobrazit logo
                  </label>
                  <select
                    value={localSettings.logoPosition || 'bottom-right'}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, logoPosition: e.target.value as any }))}
                    className="text-sm border rounded px-2 py-1"
                    disabled={!localSettings.logoVisible}
                  >
                    <option value="top-left">Vlevo nahoře</option>
                    <option value="top-right">Vpravo nahoře</option>
                    <option value="bottom-left">Vlevo dole</option>
                    <option value="bottom-right">Vpravo dole</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="secondary" onClick={() => setEditingFormat(null)}>
                  Zrušit
                </Button>
                <Button variant="secondary" onClick={applyToAll}>
                  Aplikovat na všechny
                </Button>
                <Button onClick={saveSettings}>
                  <Check className="w-4 h-4 mr-1" />
                  Uložit
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Continue */}
      <Button size="lg" className="w-full" onClick={() => setActiveTab('export')}>
        Pokračovat k exportu
      </Button>
    </div>
  )
}
