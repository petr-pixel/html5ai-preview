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
import { platforms, getFormatKey, getCategoryType, isBrandingCategory, isVideoCategory, getMaxSizeKB } from '@/lib/platforms'
import { generateId, cn, loadImage } from '@/lib/utils'
import { Sidebar, NavigationView } from '@/components/Sidebar'
import { SettingsModal } from '@/components/SettingsModal'
import { FormatCard } from '@/components/FormatCard'
import { TextOverlayEditor } from '@/components/TextOverlayEditor'
import { WatermarkEditor } from '@/components/WatermarkEditor'
import { QRCodeEditor } from '@/components/QRCodeEditor'
import { GalleryView } from '@/components/GalleryView'
import { BrandKitManager } from '@/components/BrandKitManager'
import { VideoGenerator } from '@/components/VideoGenerator'
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { calculateSmartCrop } from '@/lib/smart-crop'
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
// MAIN APP
// ============================================================================

export default function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<NavigationView>('editor')
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
    apiKeys,
    imageModelTier,
    textModelTier,
    brandKits,
    activeBrandKit,
    setPlatform,
    setCategory,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

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
      const size = sourceFormat === 'landscape' ? '1536x1024' 
                 : sourceFormat === 'portrait' ? '1024x1536' 
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
          prompt: `Professional advertising image. ${prompt}. Clean composition, high contrast, room for text overlay.`,
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
      createDemoImage()
    } finally {
      setIsGenerating(false)
    }
  }

  const createDemoImage = () => {
    const canvas = document.createElement('canvas')
    const w = 1200
    const h = sourceFormat === 'landscape' ? 628 : sourceFormat === 'portrait' ? 1500 : 1200
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a73e8')
    grad.addColorStop(1, '#0d47a1')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''), w / 2, h / 2)

    ctx.font = '20px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('Demo – připojte OpenAI API', w / 2, h / 2 + 45)

    setSourceImage(canvas.toDataURL('image/png'))
    setProgress(100)
  }

  const generateAIText = async (field: 'headline' | 'subheadline') => {
    if (!apiKeys.openai) {
      setSettingsOpen(true)
      return
    }

    setIsGenerating(true)
    try {
      const model = textModelTier === 'cheap' ? 'gpt-4o-mini' : 'gpt-4o'
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
              } pro reklamu: "${prompt}". Pouze text, žádné uvozovky.`,
            },
          ],
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim() || (field === 'headline' ? 'Speciální nabídka' : 'Jen teď')
      setTextOverlay({ [field]: text })
    } catch {
      setTextOverlay({ [field]: field === 'headline' ? 'Speciální nabídka' : 'Pouze dnes' })
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // GENERATE CREATIVES
  // ============================================================================

  const generateCreatives = async () => {
    if (!sourceImage) {
      alert('Nejprve nahrajte nebo vygenerujte zdrojový obrázek')
      return
    }
    if (selectedFormats.size === 0) {
      alert('Vyberte alespoň jeden formát')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const formats = Array.from(selectedFormats)
      const newCreatives: Creative[] = []

      // Load source image
      const img = await loadImage(sourceImage)

      for (let i = 0; i < formats.length; i++) {
        const formatKey = formats[i]
        const [plat, cat, indexStr] = formatKey.split('-')
        const index = parseInt(indexStr, 10)
        const fmt = platforms[plat]?.categories[cat]?.formats[index]

        if (!fmt) continue

        setProgress(Math.round(((i + 1) / formats.length) * 100))

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = fmt.width
        canvas.height = fmt.height
        const ctx = canvas.getContext('2d')!

        // Smart crop nebo základní crop
        let cropResult = { x: 0, y: 0, width: img.width, height: img.height }
        
        // Pro branding typ NEPOUŽÍVAT smart crop
        const catType = getCategoryType(plat, cat)
        if (catType === 'image') {
          try {
            cropResult = await calculateSmartCrop(sourceImage, fmt.width, fmt.height, { minScale: 0.5 })
          } catch {
            // Fallback na základní crop
            const srcRatio = img.width / img.height
            const tgtRatio = fmt.width / fmt.height
            if (srcRatio > tgtRatio) {
              const newW = img.height * tgtRatio
              cropResult = { x: (img.width - newW) / 2, y: 0, width: newW, height: img.height }
            } else {
              const newH = img.width / tgtRatio
              cropResult = { x: 0, y: (img.height - newH) / 2, width: img.width, height: newH }
            }
          }
        } else {
          // Pro branding - fit celý obrázek
          const srcRatio = img.width / img.height
          const tgtRatio = fmt.width / fmt.height
          if (srcRatio > tgtRatio) {
            const newW = img.height * tgtRatio
            cropResult = { x: (img.width - newW) / 2, y: 0, width: newW, height: img.height }
          } else {
            const newH = img.width / tgtRatio
            cropResult = { x: 0, y: (img.height - newH) / 2, width: img.width, height: newH }
          }
        }

        // Draw image
        ctx.drawImage(
          img,
          cropResult.x, cropResult.y, cropResult.width, cropResult.height,
          0, 0, fmt.width, fmt.height
        )

        // Draw text overlay
        if (textOverlay.enabled) {
          drawTextOverlay(ctx, textOverlay, fmt.width, fmt.height, currentBrandKit)
        }

        // Draw watermark (logo from Brand Kit)
        if (watermark.enabled && watermark.image) {
          await drawWatermark(ctx, watermark, fmt.width, fmt.height)
        } else if (currentBrandKit?.logoSquare || currentBrandKit?.logoHorizontal) {
          // Auto-apply brand kit logo
          const logoUrl = currentBrandKit.logoHorizontal || currentBrandKit.logoSquare
          if (logoUrl) {
            await drawWatermark(ctx, {
              enabled: true,
              image: logoUrl,
              opacity: 0.9,
              size: 12,
              position: 'bottom-right'
            }, fmt.width, fmt.height)
          }
        }

        const imageUrl = canvas.toDataURL('image/jpeg', 0.92)

        newCreatives.push({
          id: generateId(),
          formatKey,
          platform: plat as PlatformId,
          category: cat,
          format: fmt,
          imageUrl,
          createdAt: new Date(),
          sizeKB: Math.round((imageUrl.length * 3) / 4 / 1024),
        })
      }

      addCreatives(newCreatives)

      // Save to history
      addToHistory({
        id: generateId(),
        prompt,
        sourceImage,
        creatives: newCreatives,
        textOverlay,
        watermark,
        qrCode,
        createdAt: new Date(),
        platform,
      })

      setProgress(100)
    } catch (err) {
      console.error(err)
      alert('Chyba při generování')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = async () => {
    const creativesArray = Object.values(creatives)
    if (creativesArray.length === 0) {
      alert('Žádné kreativy k exportu')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const zip = await createCreativePackZip(creativesArray, (p) => setProgress(p))
      downloadBlob(zip, `adcreative-pack-${Date.now()}.zip`)
    } catch (err) {
      console.error(err)
      alert('Chyba při exportu')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderDashboard = () => (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Celkem kreativ</div>
          <div className="text-3xl font-semibold text-gray-900">{Object.keys(creatives).length}</div>
        </div>
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Sklik</div>
          <div className="text-3xl font-semibold text-gray-900">
            {Object.values(creatives).filter(c => c.platform === 'sklik').length}
          </div>
        </div>
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Google Ads</div>
          <div className="text-3xl font-semibold text-gray-900">
            {Object.values(creatives).filter(c => c.platform === 'google').length}
          </div>
        </div>
      </div>

      <div className="card-google p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Rychlé akce</h2>
        <div className="flex gap-3">
          <button onClick={() => setCurrentView('editor')} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Nová kreativa
          </button>
          <button onClick={() => setCurrentView('video')} className="btn-secondary">
            Vytvořit video
          </button>
        </div>
      </div>
    </div>
  )

  const renderEditor = () => (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Source & Settings */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Platforma</h2>
          <div className="flex gap-2">
            {Object.entries(platforms).map(([key, p]) => (
              <button
                key={key}
                onClick={() => {
                  setPlatform(key as PlatformId)
                  const firstCat = Object.keys(p.categories)[0]
                  setCategory(firstCat)
                }}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  platform === key
                    ? 'bg-blue-50 text-[#1a73e8] border border-[#1a73e8]'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                )}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Kategorie</h2>
          <div className="space-y-1">
            {Object.entries(currentPlatform.categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                  category === key
                    ? 'bg-blue-50 text-[#1a73e8]'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{cat.name}</div>
                  <div className="text-xs text-gray-500 truncate">max {cat.maxSizeKB} kB</div>
                </div>
                {cat.type === 'branding' && (
                  <span className="badge-yellow text-[10px]">Safe Zone</span>
                )}
                {cat.type === 'video' && (
                  <span className="badge-blue text-[10px]">Video</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Video redirect */}
        {categoryType === 'video' ? (
          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Pro tvorbu videí přejděte do Video Studia
              </p>
              <button onClick={() => setCurrentView('video')} className="btn-primary">
                Video Studio
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Source Image */}
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Zdrojový obrázek</h2>
              
              {/* Format selection */}
              <div className="flex gap-2 mb-3">
                {(['landscape', 'square', 'portrait'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSourceFormat(fmt)}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all',
                      sourceFormat === fmt
                        ? 'bg-[#1a73e8] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {fmt === 'landscape' ? '16:9' : fmt === 'square' ? '1:1' : '4:5'}
                  </button>
                ))}
              </div>

              {/* Prompt */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Popište obrázek pro AI generování..."
                className="input-google mb-3 h-20 text-sm resize-none"
              />

              {/* Generate / Upload buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={generateSourceImage}
                  disabled={isGenerating}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {isGenerating ? <Spinner className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                  Generovat
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-sm py-2"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Source preview */}
              {sourceImage && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={sourceImage} alt="Source" className="w-full" />
                </div>
              )}
            </div>

            {/* Conditional editors based on category type */}
            {categoryType === 'image' && (
              <>
                <TextOverlayEditor onGenerateAI={generateAIText} />
                <WatermarkEditor />
              </>
            )}

            {categoryType === 'branding' && (
              <>
                <TextOverlayEditor onGenerateAI={generateAIText} />
                {/* Safe Zone info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-yellow-800">Safe Zone</div>
                        <div className="text-xs text-yellow-700 mt-1">
                          {currentCategory?.formats[0]?.safeZone?.description || 
                           'Středová část může být zakrytá obsahem webu.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Main Content - Format Grid */}
      {categoryType !== 'video' && (
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          {/* Toolbar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {currentCategory?.name}
                </h2>
                <span className="badge-gray">
                  {currentCategory?.formats.length} formátů
                </span>
                {maxSizeKB <= 150 && (
                  <span className="badge-red">
                    ⚠️ Max {maxSizeKB} kB
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const keys = currentCategory?.formats.map((_, i) => 
                      getFormatKey(platform, category, i)
                    ) || []
                    selectAllFormats(keys)
                  }}
                  className="btn-ghost text-sm py-1.5"
                >
                  Vybrat vše
                </button>
                <button
                  onClick={clearSelection}
                  className="btn-ghost text-sm py-1.5"
                >
                  Zrušit výběr
                </button>
                <button
                  onClick={generateCreatives}
                  disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
                  className="btn-primary"
                >
                  {isGenerating ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generovat ({selectedFormats.size})
                    </>
                  )}
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-3">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Format Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentCategory?.formats.map((format, index) => {
                const formatKey = getFormatKey(platform, category, index)
                const isSelected = selectedFormats.has(formatKey)
                const creative = creatives[formatKey]
                const hasSafeZone = format.safeZone !== undefined

                return (
                  <div
                    key={formatKey}
                    onClick={() => toggleFormat(formatKey)}
                    className={cn(
                      'format-card',
                      isSelected && 'format-card-selected'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'format-card-checkbox',
                      isSelected && 'format-card-checkbox-checked'
                    )}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>

                    {/* Preview */}
                    <div 
                      className="relative bg-gray-100 rounded mb-2 overflow-hidden"
                      style={{ 
                        paddingBottom: `${(format.height / format.width) * 100}%`,
                        maxHeight: '120px'
                      }}
                    >
                      {creative ? (
                        <img 
                          src={creative.imageUrl} 
                          alt={format.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : sourceImage ? (
                        <img 
                          src={sourceImage} 
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      {/* Safe Zone Overlay for branding */}
                      {hasSafeZone && format.safeZone && (
                        <SafeZoneOverlay 
                          safeZone={format.safeZone}
                          width={format.width}
                          height={format.height}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {format.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format.width} × {format.height}
                    </div>
                    {creative?.sizeKB && (
                      <div className={cn(
                        'text-xs mt-1',
                        creative.sizeKB > maxSizeKB ? 'text-red-600 font-medium' : 'text-green-600'
                      )}>
                        {creative.sizeKB} kB {creative.sizeKB > maxSizeKB && '⚠️'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export bar */}
          {Object.keys(creatives).length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(creatives).length} kreativ připraveno k exportu
                </div>
                <button onClick={handleExport} className="btn-primary">
                  <Download className="w-4 h-4" />
                  Stáhnout ZIP
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderVideoStudio = () => (
    <div className="flex-1 overflow-y-auto">
      <VideoGenerator />
    </div>
  )

  const renderLibrary = () => (
    <div className="flex-1 overflow-y-auto">
      <GalleryView />
    </div>
  )

  const renderBrandKits = () => (
    <div className="flex-1 overflow-y-auto">
      <BrandKitManager />
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main-content flex flex-col">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'editor' && renderEditor()}
        {currentView === 'video' && renderVideoStudio()}
        {currentView === 'library' && renderLibrary()}
        {currentView === 'brandkits' && renderBrandKits()}
        {currentView === 'settings' && (
          <div className="p-8">
            <SettingsModal open={true} onClose={() => setCurrentView('dashboard')} />
          </div>
        )}
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  width: number,
  height: number,
  brandKit?: { ctaColor?: string; headlineFont?: string; textColor?: string }
) {
  if (!overlay.headline && !overlay.subheadline && !overlay.cta) return

  const padding = Math.min(width, height) * 0.05
  const fontFamily = brandKit?.headlineFont || 'system-ui, -apple-system, sans-serif'
  const textColor = brandKit?.textColor || '#ffffff'
  const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#1a73e8'

  // Calculate position
  let x = padding
  let y = padding
  let align: CanvasTextAlign = 'left'

  switch (overlay.position) {
    case 'top-center':
      x = width / 2
      align = 'center'
      break
    case 'top-right':
      x = width - padding
      align = 'right'
      break
    case 'center':
      x = width / 2
      y = height / 2 - 40
      align = 'center'
      break
    case 'bottom-left':
      y = height - padding - 80
      break
    case 'bottom-center':
      x = width / 2
      y = height - padding - 80
      align = 'center'
      break
    case 'bottom-right':
      x = width - padding
      y = height - padding - 80
      align = 'right'
      break
  }

  ctx.textAlign = align
  ctx.textBaseline = 'top'

  // Font sizes based on overlay.fontSize
  const baseSize = Math.min(width, height)
  const sizes = {
    small: { headline: baseSize * 0.06, sub: baseSize * 0.04, cta: baseSize * 0.035 },
    medium: { headline: baseSize * 0.08, sub: baseSize * 0.05, cta: baseSize * 0.04 },
    large: { headline: baseSize * 0.1, sub: baseSize * 0.06, cta: baseSize * 0.05 },
  }
  const size = sizes[overlay.fontSize]

  let currentY = y

  // Headline
  if (overlay.headline) {
    ctx.font = `bold ${size.headline}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillText(overlay.headline, x, currentY)
    currentY += size.headline * 1.3
  }

  // Subheadline
  if (overlay.subheadline) {
    ctx.font = `${size.sub}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.fillText(overlay.subheadline, x, currentY)
    currentY += size.sub * 1.5
  }

  // CTA Button
  if (overlay.cta) {
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    const ctaWidth = ctx.measureText(overlay.cta).width + size.cta * 2
    const ctaHeight = size.cta * 2

    let ctaX = x
    if (align === 'center') ctaX = x - ctaWidth / 2
    else if (align === 'right') ctaX = x - ctaWidth

    // Button background
    ctx.fillStyle = ctaColor
    ctx.beginPath()
    const radius = ctaHeight / 2
    ctx.roundRect(ctaX, currentY, ctaWidth, ctaHeight, radius)
    ctx.fill()

    // Button text
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${size.cta}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText(overlay.cta, ctaX + ctaWidth / 2, currentY + (ctaHeight - size.cta) / 2)
  }

  // Reset
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: { image: string | null; opacity: number; size: number; position: string },
  width: number,
  height: number
) {
  if (!watermark.image) return

  try {
    const img = await loadImage(watermark.image)
    const maxSize = Math.min(width, height) * (watermark.size / 100)
    const ratio = img.width / img.height
    const w = ratio > 1 ? maxSize : maxSize * ratio
    const h = ratio > 1 ? maxSize / ratio : maxSize

    let x = 0
    let y = 0
    const margin = Math.min(width, height) * 0.03

    switch (watermark.position) {
      case 'top-left':
        x = margin
        y = margin
        break
      case 'top-right':
        x = width - w - margin
        y = margin
        break
      case 'bottom-left':
        x = margin
        y = height - h - margin
        break
      case 'bottom-right':
        x = width - w - margin
        y = height - h - margin
        break
      case 'center':
        x = (width - w) / 2
        y = (height - h) / 2
        break
    }

    ctx.globalAlpha = watermark.opacity
    ctx.drawImage(img, x, y, w, h)
    ctx.globalAlpha = 1
  } catch (err) {
    console.error('Watermark error:', err)
  }
}
