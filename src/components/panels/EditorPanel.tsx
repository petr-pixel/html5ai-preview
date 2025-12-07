import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getFormatById } from '@/lib/formats'
import type { Format, TextPosition } from '@/types'
import { 
  ArrowRight,
  Edit3,
  Move,
  Type,
  Image as ImageIcon,
  Wand2,
  Loader2,
  LayoutGrid
} from 'lucide-react'

export function EditorPanel() {
  const {
    sourceImage,
    selectedFormats,
    creativeSettings,
    setCreativeSettings,
    defaultText,
    setDefaultText,
    brandKit,
    apiKey,
    setActiveTab,
    editingFormatId,
    setEditingFormatId,
  } = useAppStore()

  const [isDetecting, setIsDetecting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const formatArray = Array.from(selectedFormats)
    .map(id => getFormatById(id))
    .filter(Boolean) as Format[]

  const editingFormat = editingFormatId ? getFormatById(editingFormatId) : null
  const currentSettings = editingFormatId 
    ? creativeSettings[editingFormatId] || { cropX: 0.5, cropY: 0.5, cropScale: 1 }
    : null

  // Draw preview on canvas
  useEffect(() => {
    if (!canvasRef.current || !sourceImage || !editingFormat) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const settings = currentSettings || { cropX: 0.5, cropY: 0.5, cropScale: 1 }
      
      // Clear
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate crop
      const imgAspect = img.width / img.height
      const formatAspect = editingFormat.width / editingFormat.height
      const scale = settings.cropScale || 1

      let srcW, srcH, srcX, srcY

      if (imgAspect > formatAspect) {
        srcH = img.height / scale
        srcW = srcH * formatAspect
        srcX = (img.width - srcW) * (settings.cropX || 0.5)
        srcY = (img.height - srcH) * (settings.cropY || 0.5)
      } else {
        srcW = img.width / scale
        srcH = srcW / formatAspect
        srcX = (img.width - srcW) * (settings.cropX || 0.5)
        srcY = (img.height - srcH) * (settings.cropY || 0.5)
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

      // Draw text overlay
      if (defaultText.showHeadline && defaultText.headline) {
        const padding = Math.min(canvas.width, canvas.height) * 0.05
        const fontSize = Math.min(canvas.width, canvas.height) * 0.08
        
        ctx.font = `bold ${fontSize}px ${defaultText.fontFamily}`
        const textWidth = ctx.measureText(defaultText.headline).width
        const bgPadding = fontSize * 0.3

        let textX = padding
        let textY = canvas.height - padding
        let textAlign: CanvasTextAlign = 'left'

        if (defaultText.position.includes('center')) {
          textX = canvas.width / 2
          textAlign = 'center'
        } else if (defaultText.position.includes('right')) {
          textX = canvas.width - padding
          textAlign = 'right'
        }

        if (defaultText.position.includes('top')) {
          textY = padding + fontSize
        } else if (defaultText.position === 'center') {
          textY = canvas.height / 2
        }

        // Background
        let bgX = textX - bgPadding
        if (textAlign === 'center') bgX = textX - textWidth / 2 - bgPadding
        else if (textAlign === 'right') bgX = textX - textWidth - bgPadding

        ctx.fillStyle = defaultText.headlineBackground
        ctx.fillRect(bgX, textY - fontSize, textWidth + bgPadding * 2, fontSize + bgPadding)

        // Text
        ctx.fillStyle = defaultText.headlineColor
        ctx.textAlign = textAlign
        ctx.textBaseline = 'bottom'
        ctx.fillText(defaultText.headline, textX, textY)

        // CTA
        if (defaultText.showCta && defaultText.cta) {
          const ctaFontSize = fontSize * 0.6
          ctx.font = `bold ${ctaFontSize}px ${defaultText.fontFamily}`
          const ctaWidth = ctx.measureText(defaultText.cta).width
          const ctaPadding = ctaFontSize * 0.4
          const ctaY = textY + ctaFontSize + padding * 0.5

          let ctaX = textX
          if (textAlign === 'center') ctaX = textX - ctaWidth / 2 - ctaPadding
          else if (textAlign === 'right') ctaX = textX - ctaWidth - ctaPadding * 2
          else ctaX = textX - ctaPadding

          // Button
          ctx.fillStyle = brandKit.accentColor
          ctx.beginPath()
          ctx.roundRect(ctaX, ctaY - ctaFontSize, ctaWidth + ctaPadding * 2, ctaFontSize + ctaPadding, 4)
          ctx.fill()

          // Text
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'left'
          ctx.fillText(defaultText.cta, ctaX + ctaPadding, ctaY)
        }
      }

      // Draw safe zone if exists
      if (editingFormat.safeZone) {
        const sz = editingFormat.safeZone
        const scaleX = canvas.width / editingFormat.width
        const scaleY = canvas.height / editingFormat.height

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(
          sz.x * scaleX,
          sz.y * scaleY,
          sz.width * scaleX,
          sz.height * scaleY
        )
        ctx.setLineDash([])
      }
    }
    img.src = sourceImage
  }, [sourceImage, editingFormat, currentSettings, defaultText, brandKit])

  // Smart crop detection
  const detectSmartCrop = async () => {
    if (!apiKey || !sourceImage || !editingFormat || !editingFormatId) return

    setIsDetecting(true)
    try {
      const response = await fetch('/api/analyze/smart-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImage,
          apiKey,
          targetWidth: editingFormat.width,
          targetHeight: editingFormat.height,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCreativeSettings(editingFormatId, {
          cropX: data.focusX,
          cropY: data.focusY,
        })
      }
    } catch (err) {
      console.error('Smart crop error:', err)
    }
    setIsDetecting(false)
  }

  if (!sourceImage) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nejdřív nahraj obrázek</h2>
        <Button onClick={() => setActiveTab('input')}>Zpět na vstup</Button>
      </div>
    )
  }

  if (formatArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <LayoutGrid className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vyber formáty</h2>
        <Button onClick={() => setActiveTab('formats')}>Vybrat formáty</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editor</h1>
          <p className="text-muted-foreground">
            Uprav jednotlivé kreativy
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge>{formatArray.length} kreativ</Badge>
          <Button onClick={() => setActiveTab('export')}>
            Export
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Default Text Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5" />
            Výchozí texty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headline</Label>
                <Switch
                  checked={defaultText.showHeadline}
                  onCheckedChange={(checked) => setDefaultText({ showHeadline: checked })}
                />
              </div>
              <Input
                value={defaultText.headline}
                onChange={(e) => setDefaultText({ headline: e.target.value })}
                placeholder="Hlavní nadpis"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subheadline</Label>
                <Switch
                  checked={defaultText.showSubheadline}
                  onCheckedChange={(checked) => setDefaultText({ showSubheadline: checked })}
                />
              </div>
              <Input
                value={defaultText.subheadline}
                onChange={(e) => setDefaultText({ subheadline: e.target.value })}
                placeholder="Podnadpis"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CTA</Label>
                <Switch
                  checked={defaultText.showCta}
                  onCheckedChange={(checked) => setDefaultText({ showCta: checked })}
                />
              </div>
              <Input
                value={defaultText.cta}
                onChange={(e) => setDefaultText({ cta: e.target.value })}
                placeholder="Výzva k akci"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Pozice textu</Label>
            <Select
              value={defaultText.position}
              onValueChange={(value) => setDefaultText({ position: value as TextPosition })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Vlevo nahoře</SelectItem>
                <SelectItem value="top-center">Nahoře</SelectItem>
                <SelectItem value="top-right">Vpravo nahoře</SelectItem>
                <SelectItem value="center">Střed</SelectItem>
                <SelectItem value="bottom-left">Vlevo dole</SelectItem>
                <SelectItem value="bottom-center">Dole</SelectItem>
                <SelectItem value="bottom-right">Vpravo dole</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Creatives Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {formatArray.map((format) => {
          const settings = creativeSettings[format.id] || {}
          const platform = format.id.startsWith('sklik') ? 'sklik' : 'google'

          return (
            <Card 
              key={format.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setEditingFormatId(format.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={platform === 'sklik' ? 'warning' : 'default'} className="text-xs">
                    {platform === 'sklik' ? 'Sklik' : 'Google'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format.width}×{format.height}
                  </span>
                </div>
                <div 
                  className="w-full bg-muted rounded overflow-hidden"
                  style={{ aspectRatio: `${format.width}/${format.height}` }}
                >
                  <img 
                    src={sourceImage} 
                    alt={format.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-medium mt-2 truncate">{format.name}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingFormatId} onOpenChange={() => setEditingFormatId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingFormat?.name} ({editingFormat?.width}×{editingFormat?.height})
            </DialogTitle>
          </DialogHeader>

          {editingFormat && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Preview */}
              <div>
                <canvas
                  ref={canvasRef}
                  width={editingFormat.width > 600 ? 600 : editingFormat.width}
                  height={editingFormat.width > 600 
                    ? (600 * editingFormat.height) / editingFormat.width 
                    : editingFormat.height
                  }
                  className="w-full rounded-lg border"
                />
              </div>

              {/* Controls */}
              <div className="space-y-6">
                {/* Smart Crop */}
                <div>
                  <Button
                    onClick={detectSmartCrop}
                    disabled={isDetecting || !apiKey}
                    className="w-full"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Detekuji...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Smart Crop (AI)
                      </>
                    )}
                  </Button>
                </div>

                {/* Crop X */}
                <div className="space-y-2">
                  <Label>Horizontální posun</Label>
                  <Slider
                    value={[currentSettings?.cropX ?? 0.5]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => 
                      editingFormatId && setCreativeSettings(editingFormatId, { cropX: value })
                    }
                  />
                </div>

                {/* Crop Y */}
                <div className="space-y-2">
                  <Label>Vertikální posun</Label>
                  <Slider
                    value={[currentSettings?.cropY ?? 0.5]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => 
                      editingFormatId && setCreativeSettings(editingFormatId, { cropY: value })
                    }
                  />
                </div>

                {/* Zoom */}
                <div className="space-y-2">
                  <Label>Zoom</Label>
                  <Slider
                    value={[currentSettings?.cropScale ?? 1]}
                    min={1}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => 
                      editingFormatId && setCreativeSettings(editingFormatId, { cropScale: value })
                    }
                  />
                </div>

                {/* Safe zone warning */}
                {editingFormat.safeZone && (
                  <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
                    <strong>Safe Zone:</strong> {editingFormat.safeZone.description}
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={() => setEditingFormatId(null)}
                >
                  Hotovo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
