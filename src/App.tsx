import React, { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey, parseFormatKey } from '@/lib/platforms'
import { generateId, cn, loadImage } from '@/lib/utils'
import { Sidebar } from '@/components/Sidebar'
import { SettingsModal } from '@/components/SettingsModal'
import { FormatCard } from '@/components/FormatCard'
import { TextOverlayEditor } from '@/components/TextOverlayEditor'
import { WatermarkEditor } from '@/components/WatermarkEditor'
import { QRCodeEditor } from '@/components/QRCodeEditor'
import { ABTestingEditor } from '@/components/ABTestingEditor'
import { HTML5Preview } from '@/components/HTML5Preview'
import { HistoryPanel } from '@/components/HistoryPanel'
import { VideoScenarioEditor } from '@/components/VideoScenarioEditor'
import { FormatSummaryBar } from '@/components/FormatSummaryBar'
import { SourceVariantsPanel } from '@/components/SourceVariantsPanel'
import { GalleryView } from '@/components/GalleryView'
import { QualityCheck } from '@/components/QualityCheck'
import { CostEstimator } from '@/components/CostEstimator'
import { BrandKitManager } from '@/components/BrandKitManager'
import { VideoGenerator } from '@/components/VideoGenerator'
import { SafeZoneInfo } from '@/components/SafeZoneOverlay'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import {
  Button,
  Textarea,
  Card,
  Progress,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
} from '@/components/ui'
import {
  Sparkles,
  Upload,
  Zap,
  Download,
  Image,
  Layers,
  History,
  Check,
  Play,
  Grid3X3,
  Video,
} from 'lucide-react'
import type { Creative, TextOverlay } from '@/types'

// Main App Component
export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    activeView,
    apiKeys,
    imageModelTier,
    textModelTier,
    brandKits,
    activeBrandKit,
    setImageModelTier,
    setPrompt,
    setSourceFormat,
    setSourceImage,
    toggleFormat,
    selectAllFormats,
    clearSelection,
    addCreatives,
    setTextOverlay,
    setWatermark,
    addToHistory,
    setIsGenerating,
    setProgress,
    setActiveView,
  } = useAppStore()

  // Aktivní Brand Kit
  const currentBrandKit = activeBrandKit 
    ? brandKits.find(kit => kit.id === activeBrandKit) 
    : brandKits.find(kit => kit.isDefault)

  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform.categories[category]

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }


  // Generate source image with AI (OpenAI Images API)
  const generateSourceImage = async () => {
    if (!prompt.trim()) {
      alert('Zadejte prompt')
      return
    }
    if (!apiKeys.openai) {
      setSettingsOpen(true)
      return
    }

    setIsGenerating(true)
    setProgress(10)

    try {
      const size =
        sourceFormat === 'landscape'
          ? '1280x720'
          : sourceFormat === 'portrait'
          ? '864x1080'
          : '1024x1024'

      const quality = imageModelTier === 'best' ? 'hd' : 'standard'

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: `Professional advertising image for display / social ads. ${prompt}. Style: ${
            sourceFormat === 'landscape'
              ? 'landscape 16:9'
              : sourceFormat === 'portrait'
              ? 'portrait 4:5'
              : 'square 1:1'
          }. Clean composition, high contrast, room for text overlay, no logo baked in.`,
          size,
          quality,
          n: 1,
          response_format: 'b64_json',
        }),
      })

      setProgress(60)
      const data = await res.json()

      const b64 = data?.data?.[0]?.b64_json
      if (b64) {
        setSourceImage(`data:image/png;base64,${b64}`)
        setProgress(100)
        return
      }

      throw new Error('No image')
    } catch (err) {
      console.error(err)
      // Create demo image
      const canvas = document.createElement('canvas')
      const w = 1200
      const h =
        sourceFormat === 'landscape' ? 675 : sourceFormat === 'portrait' ? 1500 : 1200
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!

      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#1e1b4b')
      grad.addColorStop(0.5, '#312e81')
      grad.addColorStop(1, '#1e1b4b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 52px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(prompt.slice(0, 35) + (prompt.length > 35 ? '...' : ''), w / 2, h / 2)

      ctx.font = '24px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#a1a1aa'
      ctx.fillText('Demo — připojte OpenAI API', w / 2, h / 2 + 50)

      setSourceImage(canvas.toDataURL('image/png'))
      setProgress(100)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate AI text (OpenAI Chat Completions)
  const generateAIText = async (field: 'headline' | 'subheadline') => {
    if (!apiKeys.openai) {
      setSettingsOpen(true)
      return
    }
    if (!prompt.trim()) {
      alert('Nejprve zadejte prompt')
      return
    }

    setIsGenerating(true)
    try {
      const model =
        textModelTier === 'cheap'
          ? 'gpt-4.1-mini'
          : textModelTier === 'standard'
          ? 'gpt-4.1'
          : 'o3-mini'
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 60,
          messages: [
            {
              role: 'user',
              content: `Napiš ${
                field === 'headline' ? 'krátký reklamní headline (max 5 slov)' : 'krátký podtitulek (max 8 slov)'
              } pro display / video reklamu na téma: "${prompt}". Pouze text, žádné uvozovky.`,
            },
          ],
        }),
      })
      const data = await res.json()
      const text =
        data.choices?.[0]?.message?.content?.trim() ||
        (field === 'headline' ? 'Speciální nabídka' : 'Jen teď')
      setTextOverlay({ [field]: text })
    } catch (err) {
      console.error(err)
      setTextOverlay({ [field]: field === 'headline' ? 'Speciální nabídka' : 'Pouze dnes' })
    } finally {
      setIsGenerating(false)
    }
  }

  // Draw text overlay s Brand Kit podporou
  const drawTextOverlayWithBrandKit = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    overlay: typeof textOverlay,
    brandKit?: typeof currentBrandKit
  ) => {
    if (!overlay.enabled) return

    const scale = Math.min(canvas.width, canvas.height) / 300

    // Použij Brand Kit font pokud existuje
    const fontFamily = brandKit?.headlineFont || 'system-ui, -apple-system, sans-serif'
    const textColor = brandKit?.textColor || '#ffffff'
    const bgColor = brandKit?.backgroundColor || 'rgba(0,0,0,0.7)'

    // Pozice
    let x = 20 * scale
    let y = canvas.height - 40 * scale
    const positions: Record<string, { x: number; y: number }> = {
      'top-left': { x: 20 * scale, y: 40 * scale },
      'top-right': { x: canvas.width - 20 * scale, y: 40 * scale },
      'bottom-left': { x: 20 * scale, y: canvas.height - 40 * scale },
      'bottom-right': { x: canvas.width - 20 * scale, y: canvas.height - 40 * scale },
      'center': { x: canvas.width / 2, y: canvas.height / 2 },
    }
    const pos = positions[overlay.position] || positions['bottom-left']
    x = pos.x
    y = pos.y

    ctx.textAlign = overlay.position.includes('right') ? 'right' : overlay.position === 'center' ? 'center' : 'left'

    // Headline
    if (overlay.headline) {
      ctx.font = `bold ${16 * scale}px ${fontFamily}`
      
      // Text shadow/background
      const metrics = ctx.measureText(overlay.headline)
      const padding = 8 * scale
      
      ctx.fillStyle = bgColor
      const rectX = overlay.position.includes('right') 
        ? x - metrics.width - padding * 2 
        : overlay.position === 'center' 
          ? x - metrics.width / 2 - padding 
          : x - padding
      ctx.fillRect(rectX, y - 16 * scale - padding, metrics.width + padding * 2, 20 * scale + padding * 2)
      
      ctx.fillStyle = textColor
      ctx.fillText(overlay.headline, x, y)
    }

    // CTA Button
    if (overlay.cta) {
      const ctaY = y + 30 * scale
      const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#f97316'
      const ctaW = 100 * scale
      const ctaH = 28 * scale
      const ctaX = overlay.position.includes('right') 
        ? x - ctaW 
        : overlay.position === 'center' 
          ? x - ctaW / 2 
          : x

      // CTA background s zaoblenými rohy
      ctx.fillStyle = ctaColor
      const radius = 4 * scale
      ctx.beginPath()
      ctx.moveTo(ctaX + radius, ctaY)
      ctx.lineTo(ctaX + ctaW - radius, ctaY)
      ctx.quadraticCurveTo(ctaX + ctaW, ctaY, ctaX + ctaW, ctaY + radius)
      ctx.lineTo(ctaX + ctaW, ctaY + ctaH - radius)
      ctx.quadraticCurveTo(ctaX + ctaW, ctaY + ctaH, ctaX + ctaW - radius, ctaY + ctaH)
      ctx.lineTo(ctaX + radius, ctaY + ctaH)
      ctx.quadraticCurveTo(ctaX, ctaY + ctaH, ctaX, ctaY + ctaH - radius)
      ctx.lineTo(ctaX, ctaY + radius)
      ctx.quadraticCurveTo(ctaX, ctaY, ctaX + radius, ctaY)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${12 * scale}px ${fontFamily}`
      ctx.textAlign = 'center'
      ctx.fillText(overlay.cta, ctaX + ctaW / 2, ctaY + 18 * scale)
    }
  }

  // Draw watermark s Brand Kit podporou
  const drawWatermarkWithBrandKit = async (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    wm: typeof watermark
  ) => {
    if (!wm.enabled || !wm.image) return

    try {
      const img = await loadImage(wm.image)
      const size = (wm.size / 100) * Math.min(canvas.width, canvas.height)
      const aspectRatio = img.width / img.height
      const w = size * aspectRatio
      const h = size
      const margin = 20

      let x = margin
      let y = margin

      switch (wm.position) {
        case 'top-right':
          x = canvas.width - w - margin
          break
        case 'bottom-left':
          y = canvas.height - h - margin
          break
        case 'bottom-right':
          x = canvas.width - w - margin
          y = canvas.height - h - margin
          break
        case 'center':
          x = (canvas.width - w) / 2
          y = (canvas.height - h) / 2
          break
      }

      ctx.globalAlpha = wm.opacity
      ctx.drawImage(img, x, y, w, h)
      ctx.globalAlpha = 1
    } catch (err) {
      console.error('Watermark error:', err)
    }
  }

  // Generate all creatives
  const generateCreatives = async () => {
    if (!sourceImage) {
      alert('Nejprve vygenerujte nebo nahrajte obrázek')
      return
    }
    if (selectedFormats.size === 0) {
      alert('Vyberte alespoň jeden formát')
      return
    }

    setIsGenerating(true)
    const newCreatives: Creative[] = []
    let done = 0

    // ========================================
    // BRAND KIT AUTOMATIZACE
    // ========================================
    
    // Aplikuj Brand Kit pokud je aktivní
    let effectiveTextOverlay = { ...textOverlay }
    let effectiveWatermark = { ...watermark }
    
    if (currentBrandKit) {
      // 1. Automaticky změň barvu CTA tlačítka
      if (currentBrandKit.ctaColor) {
        effectiveTextOverlay.ctaColor = currentBrandKit.ctaColor
      }
      
      // 2. Automaticky aplikuj logo jako vodoznak
      if (currentBrandKit.logoSquare || currentBrandKit.logoHorizontal) {
        effectiveWatermark = {
          ...effectiveWatermark,
          enabled: true,
          image: currentBrandKit.logoHorizontal || currentBrandKit.logoSquare || null,
          opacity: 0.9,
          size: 12,
          position: 'bottom-right',
        }
      }
      
      // 3. Aktualizuj store s Brand Kit hodnotami (pro UI feedback)
      setTextOverlay({ ctaColor: effectiveTextOverlay.ctaColor })
      if (effectiveWatermark.image) {
        setWatermark(effectiveWatermark)
      }
    }

    const img = await loadImage(sourceImage)
    
    // Import smart crop pro pokročilý ořez
    const { calculateSmartCrop } = await import('@/lib/smart-crop')

    for (const key of selectedFormats) {
      const { platform: plat, category: cat, index } = parseFormatKey(key)
      const fmt = platforms[plat].categories[cat].formats[index]

      const canvas = document.createElement('canvas')
      canvas.width = fmt.width
      canvas.height = fmt.height
      const ctx = canvas.getContext('2d')!

      // ========================================
      // VYLEPŠENÝ SMART CROP
      // ========================================
      
      let sx, sy, sw, sh
      
      try {
        // Použij pokročilý smart crop s detekcí objektů
        const cropResult = await calculateSmartCrop(
          sourceImage,
          fmt.width,
          fmt.height,
          { minScale: 0.5, centerBoost: 0.1 }
        )
        
        sx = cropResult.x
        sy = cropResult.y
        sw = cropResult.width
        sh = cropResult.height
      } catch {
        // Fallback na základní crop
        const imgR = img.width / img.height
        const tgtR = fmt.width / fmt.height

        if (imgR > tgtR) {
          sh = img.height
          sw = img.height * tgtR
          sx = (img.width - sw) / 2
          sy = 0
        } else {
          sw = img.width
          sh = img.width / tgtR
          sx = 0
          sy = (img.height - sh) / 2
        }
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, fmt.width, fmt.height)

      // Draw overlays s Brand Kit barvami
      drawTextOverlayWithBrandKit(ctx, canvas, effectiveTextOverlay, currentBrandKit)
      await drawWatermarkWithBrandKit(ctx, canvas, effectiveWatermark)

      newCreatives.push({
        id: generateId(),
        formatKey: key,
        platform: plat as 'sklik' | 'google',
        category: cat,
        format: fmt,
        imageUrl: canvas.toDataURL('image/png', 0.92),
        createdAt: new Date(),
        variant: null,
      })

      done++
      setProgress((done / selectedFormats.size) * 100)
    }

    addCreatives(newCreatives)
    setIsGenerating(false)
    setActiveView('preview')

    // Add to history
    addToHistory({
      id: generateId(),
      prompt,
      sourceImage,
      creatives: newCreatives,
      textOverlay: effectiveTextOverlay,
      watermark: effectiveWatermark,
      qrCode,
      createdAt: new Date(),
      platform,
    })
  }

  // Select all formats in current category
  const handleSelectAll = () => {
    const keys = currentCategory.formats.map((_, i) => getFormatKey(platform, category, i))
    selectAllFormats(keys)
  }

  // Download all creatives as ZIP
  const handleDownloadZip = async () => {
    if (Object.keys(creatives).length === 0) return

    setIsGenerating(true)
    setProgress(10)

    try {
      const staticContents: { format: any; blob: Blob; filename: string }[] = []

      const creativesArray = Object.values(creatives) as Creative[]
      let done = 0

      for (const c of creativesArray) {
        // Konvertovat data URL na Blob
        const response = await fetch(c.imageUrl)
        const blob = await response.blob()
        
        const filename = `${c.platform}_${c.category}_${c.format.width}x${c.format.height}.png`
        staticContents.push({ format: c.format, blob, filename })

        done++
        setProgress(10 + (done / creativesArray.length) * 80)
      }

      const zipBlob = await createCreativePackZip(
        { static: staticContents, html5: [], video: [] },
        'brand',
        prompt.slice(0, 20) || 'campaign'
      )

      setProgress(100)
      downloadBlob(zipBlob, `kreativy_${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err) {
      console.error('ZIP export error:', err)
      alert('Chyba při exportu ZIP')
    } finally {
      setIsGenerating(false)
    }
  }

  // Get selected count for current category
  const selectedInCategory = [...selectedFormats].filter((k) =>
    k.startsWith(`${platform}-${category}-`)
  ).length

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8">
        {/* Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
          <TabsList className="mb-8">
            <TabsTrigger value="create">
              <Sparkles className="w-4 h-4" />
              Vytvořit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Layers className="w-4 h-4" />
              Náhled
              {Object.keys(creatives).length > 0 && (
                <Badge variant="primary" className="ml-2">
                  {Object.keys(creatives).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Grid3X3 className="w-4 h-4" />
              Galerie
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4" />
              Historie
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            {/* Source Image Section */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Zdrojový obrázek</h2>
                  <p className="text-sm text-muted-foreground">
                    Vygenerujte AI obrázek nebo nahrajte vlastní
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Prompt
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Např. Lyžař na zasněžených horách při západu slunce..."
                      className="h-28"
                    />
                  </div>

                  <div className="flex gap-2">
                    {(['landscape', 'square', 'portrait'] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        variant={sourceFormat === fmt ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setSourceFormat(fmt)}
                        className="flex-1"
                      >
                        {fmt === 'landscape' ? '16:9' : fmt === 'square' ? '1:1' : '4:5'}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <p className="text-xs text-muted-foreground">Model pro obrázek</p>
                    <div className="inline-flex items-center rounded-full border border-border bg-background/60 p-1">
                      {(['cheap', 'standard', 'best'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setImageModelTier(tier)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all',
                            imageModelTier === tier
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-muted'
                          )}
                        >
                          <span>
                            {tier === 'cheap' ? '💸' : tier === 'standard' ? '⚡' : '👑'}
                          </span>
                          <span>
                            {tier === 'cheap'
                              ? 'Levný'
                              : tier === 'standard'
                              ? 'Standard'
                              : 'Nejlepší'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Odhad ceny za obrázek (1024×1024): 💸 ~0,02 $ • ⚡ ~0,04 $ • 👑 ~0,08 $+
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={generateSourceImage}
                      disabled={isGenerating || !prompt.trim()}
                      className="flex-1"
                    >
                      {isGenerating ? <Spinner size={18} /> : <Sparkles className="w-4 h-4" />}
                      {isGenerating ? 'Generuji...' : 'Generovat AI'}
                    </Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4" />
                      Nahrát
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Overlay Editors */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <TextOverlayEditor onGenerateAI={generateAIText} isGenerating={isGenerating} />
                    <WatermarkEditor />
                    <QRCodeEditor />
                    <ABTestingEditor />
                  </div>
                </div>

                {/* Right: Preview */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Náhled
                  </label>
                  <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                    {sourceImage ? (
                      <>
                        <img
                          src={sourceImage}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        {textOverlay.enabled && (
                          <div
                            className={`absolute p-5 ${
                              textOverlay.position.includes('bottom')
                                ? 'bottom-0'
                                : textOverlay.position.includes('top')
                                ? 'top-0'
                                : 'top-1/2 -translate-y-1/2'
                            } ${
                              textOverlay.position.includes('left')
                                ? 'left-0 text-left'
                                : textOverlay.position.includes('right')
                                ? 'right-0 text-right'
                                : 'left-1/2 -translate-x-1/2 text-center'
                            }`}
                          >
                            {textOverlay.headline && (
                              <div className="text-white font-bold text-xl drop-shadow-lg mb-1">
                                {textOverlay.headline}
                              </div>
                            )}
                            {textOverlay.subheadline && (
                              <div className="text-white/90 text-sm drop-shadow-lg mb-2">
                                {textOverlay.subheadline}
                              </div>
                            )}
                            {textOverlay.cta && (
                              <span
                                className="inline-block px-4 py-2 rounded-lg text-white text-sm font-semibold"
                                style={{ backgroundColor: textOverlay.ctaColor }}
                              >
                                {textOverlay.cta}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                        <Image className="w-12 h-12" />
                        <p className="mt-3 text-sm">Zadejte prompt nebo nahrajte obrázek</p>
                      </div>
                    )}
                  </div>

                  {isGenerating && progress > 0 && (
                    <div className="mt-3">
                      <Progress value={progress} />
                    </div>
                  )}

                  {/* Source Variants Panel */}
                  <SourceVariantsPanel />
                </div>
              </div>

              {/* Cost Estimator */}
              <CostEstimator />
            </Card>

            {/* Video Scenario */}
            <VideoScenarioEditor />

            {/* Format Selection */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${currentPlatform.color}40, ${currentPlatform.color}20)`,
                    }}
                  >
                    <span className="text-2xl">{currentCategory.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{currentCategory.name}</h2>
                      <Badge
                        variant="primary"
                        style={{
                          background: `${currentPlatform.color}20`,
                          color: currentPlatform.color,
                        }}
                      >
                        {currentPlatform.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                    Vybrat vše
                  </Button>
                  <Button variant="secondary" size="sm" onClick={clearSelection}>
                    Zrušit
                  </Button>
                </div>
              </div>

              <FormatSummaryBar className="mb-4" />

              {/* Safe Zone Warning pro formáty s ochrannou zónou */}
              {currentCategory.formats.some(f => f.safeZone) && (
                <SafeZoneInfo format={currentCategory.formats.find(f => f.safeZone)!} />
              )}

              <div className="format-grid mt-4">
                {currentCategory.formats.map((fmt, idx) => (
                  <FormatCard
                    key={idx}
                    format={fmt}
                    isSelected={selectedFormats.has(getFormatKey(platform, category, idx)) as boolean}
                    onClick={() => toggleFormat(getFormatKey(platform, category, idx))}
                    sourceImage={sourceImage as string | null}
                    textOverlay={textOverlay as TextOverlay}
                    maxSizeKB={currentCategory.maxSizeKB}
                    fileTypes={currentCategory.fileTypes}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Vybráno: <strong className="text-foreground">{selectedInCategory}</strong> z{' '}
                  {currentCategory.formats.length}
                </span>
                <Button
                  onClick={generateCreatives}
                  disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
                >
                  {isGenerating ? <Spinner size={18} /> : <Zap className="w-4 h-4" />}
                  {isGenerating ? 'Generuji...' : 'Vytvořit kreativy'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Vygenerované kreativy</h2>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(creatives).length} formátů připraveno ke stažení
                    </p>
                  </div>
                </div>

                {Object.keys(creatives).length > 0 && (
                  <Button 
                    onClick={handleDownloadZip}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    {isGenerating ? <Spinner size={18} /> : <Download className="w-4 h-4" />}
                    {isGenerating ? 'Exportuji...' : 'Stáhnout ZIP'}
                  </Button>
                )}
              </div>

              {Object.keys(creatives).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Layers className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Zatím žádné kreativy</h3>
                  <p className="text-sm text-muted-foreground">
                    Vyberte formáty a klikněte na "Vytvořit kreativy"
                  </p>
                </div>
              ) : (
                <>
                  {/* Image creatives grid */}
                  <div className="format-grid mb-8">
                    {(Object.values(creatives) as Creative[]).map((c) => (
                      <div key={c.id} className="bg-secondary rounded-xl overflow-hidden">
                        <div className="aspect-video bg-background flex items-center justify-center">
                          <img src={c.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-sm truncate">{c.format.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {c.format.width} × {c.format.height}
                          </div>
                          <Badge
                            variant="primary"
                            className="mt-2"
                            style={{
                              background: `${platforms[c.platform].color}20`,
                              color: platforms[c.platform].color,
                            }}
                          >
                            {platforms[c.platform].name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* HTML5 Previews */}
                  {currentCategory.isHTML5 && sourceImage && (
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        HTML5 Náhled animací
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentCategory.formats.slice(0, 3).map((fmt, idx) => (
                          <HTML5Preview
                            key={idx}
                            format={fmt}
                            imageUrl={(sourceImage || '') as string}
                            textOverlay={textOverlay as TextOverlay}
                            isPMax={(currentCategory.isPMax || false) as boolean}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <HistoryPanel />
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <VideoGenerator />
                <VideoScenarioEditor />
              </div>
              <div className="space-y-6">
                <BrandKitManager />
                <CostEstimator />
              </div>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <div className="space-y-4">
              <QualityCheck />
              <GalleryView />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
