/**
 * GeneratorView - Čistý editor pro generování kreativ
 * 
 * Jednoduchý layout:
 * - Header s titulkem a akcemi
 * - Levá část: Source image + settings
 * - Pravá část: Format grid
 */

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey, getCategoryType, getMaxSizeKB } from '@/lib/platforms'
import { cn, loadImage, generateId } from '@/lib/utils'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { CostEstimate, calculateCost, formatPrice } from '@/components/CostEstimate'
import type { PlatformId, Creative, Format } from '@/types'
import {
  Upload, Sparkles, Wand2, Check, Download, Settings,
  Image as ImageIcon, Type, Droplet, QrCode, ChevronDown
} from 'lucide-react'

interface GeneratorViewProps {
  platform: PlatformId
  category: string
  onOpenSettings: () => void
}

export function GeneratorView({ platform, category, onOpenSettings }: GeneratorViewProps) {
  const {
    prompt, setPrompt,
    sourceFormat, setSourceFormat,
    sourceImage, setSourceImage,
    selectedFormats, toggleFormat, selectAllFormats, clearSelection,
    textOverlay, setTextOverlay,
    watermark,
    qrCode,
    isGenerating, setIsGenerating,
    progress, setProgress,
    apiKeys,
    addCreatives,
    addToHistory,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showTextEditor, setShowTextEditor] = useState(false)

  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const formats = currentCategory?.formats || []
  const maxSizeKB = currentCategory?.maxSizeKB || 150

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Generate creatives
  const handleGenerate = async () => {
    if (!sourceImage) {
      alert('Nejprve nahrajte nebo vygenerujte obrázek')
      return
    }
    if (selectedFormats.size === 0) {
      alert('Vyberte alespoň jeden formát')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const img = await loadImage(sourceImage)
      const formatKeys = Array.from(selectedFormats)
      const newCreatives: Creative[] = []

      for (let i = 0; i < formatKeys.length; i++) {
        const formatKey = formatKeys[i]
        const [plat, cat, fmtIdx] = formatKey.split('_')
        const fmt = platforms[plat as PlatformId]?.categories[cat]?.formats[parseInt(fmtIdx)]
        
        if (!fmt) continue

        setProgress(Math.round(((i + 0.5) / formatKeys.length) * 100))

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = fmt.width
        canvas.height = fmt.height
        const ctx = canvas.getContext('2d')!

        // Smart crop
        const crop = await calculateSmartCrop(sourceImage, fmt.width, fmt.height)
        
        // Draw image
        ctx.drawImage(
          img,
          crop.x, crop.y, crop.width, crop.height,
          0, 0, fmt.width, fmt.height
        )

        // Text overlay (simplified)
        if (textOverlay.enabled && textOverlay.headline) {
          const padding = 20
          const fontSize = Math.min(fmt.width, fmt.height) * 0.08
          
          ctx.font = `bold ${fontSize}px Arial`
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'left'
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.shadowBlur = 4
          ctx.fillText(textOverlay.headline, padding, fmt.height - padding - fontSize)
          ctx.shadowBlur = 0
        }

        const imageUrl = canvas.toDataURL('image/png')

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

        setProgress(Math.round(((i + 1) / formatKeys.length) * 100))
      }

      addCreatives(newCreatives)
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

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-bold text-white">Generátor kreativ</h1>
          <p className="text-sm text-white/50">
            {currentPlatform?.name} → {currentCategory?.name} • Max {maxSizeKB} kB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectAllFormats(formats.map((_, i) => getFormatKey(platform, category, i)))}
            className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm"
          >
            Vybrat vše ({formats.length})
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {progress}%
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generovat ({selectedFormats.size})
              </>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Source Image */}
        <div className="w-80 border-r border-white/10 bg-slate-900/30 p-4 overflow-y-auto">
          {/* Source Format */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Formát zdroje
            </label>
            <div className="flex gap-2">
              {(['landscape', 'square', 'portrait'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSourceFormat(fmt)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                    sourceFormat === fmt
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  )}
                >
                  {fmt === 'landscape' ? '16:9' : fmt === 'square' ? '1:1' : '9:16'}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload/Preview */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              Zdrojový obrázek
            </label>
            
            {sourceImage ? (
              <div className="relative group">
                <img 
                  src={sourceImage} 
                  alt="Source" 
                  className="w-full rounded-xl border border-white/10"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30"
                  >
                    Změnit
                  </button>
                  <button
                    onClick={() => setSourceImage(null)}
                    className="px-3 py-1.5 bg-red-500/20 rounded-lg text-red-300 text-sm hover:bg-red-500/30"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <Upload className="w-8 h-8 text-white/30 mb-2" />
                <span className="text-sm text-white/50">Klikněte pro nahrání</span>
                <span className="text-xs text-white/30 mt-1">nebo přetáhněte soubor</span>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* AI Generate */}
          {apiKeys.openai && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
                Nebo generovat AI
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Popis obrázku..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <button className="px-3 py-2 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <CostEstimate type="image" quality="medium" compact className="mt-2" />
            </div>
          )}

          {/* Text Overlay Toggle */}
          <div className="p-3 bg-white/5 rounded-xl">
            <button
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">Text overlay</span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-white/50 transition-transform',
                showTextEditor && 'rotate-180'
              )} />
            </button>
            
            {showTextEditor && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={textOverlay.headline}
                  onChange={(e) => setTextOverlay({ ...textOverlay, headline: e.target.value, enabled: true })}
                  placeholder="Hlavní text..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <input
                  type="text"
                  value={textOverlay.cta}
                  onChange={(e) => setTextOverlay({ ...textOverlay, cta: e.target.value })}
                  placeholder="CTA tlačítko..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            )}
          </div>

          {/* Settings Link */}
          {!apiKeys.openai && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-300 mb-2">
                Pro AI generování nastavte OpenAI API klíč
              </p>
              <button
                onClick={onOpenSettings}
                className="w-full px-3 py-2 bg-amber-500/20 text-amber-300 rounded-lg text-sm hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Nastavení
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Format Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {formats.map((format, index) => {
              const formatKey = getFormatKey(platform, category, index)
              const isSelected = selectedFormats.has(formatKey)
              const aspectRatio = format.width / format.height

              return (
                <div
                  key={formatKey}
                  onClick={() => toggleFormat(formatKey)}
                  className={cn(
                    'group relative rounded-xl overflow-hidden cursor-pointer transition-all',
                    'border-2',
                    isSelected 
                      ? 'border-violet-500 ring-2 ring-violet-500/30' 
                      : 'border-white/10 hover:border-white/30'
                  )}
                >
                  {/* Preview */}
                  <div 
                    className="relative bg-slate-800"
                    style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
                  >
                    {sourceImage ? (
                      <img
                        src={sourceImage}
                        alt={format.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    
                    {/* Selected Check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2 bg-slate-900">
                    <div className="text-xs font-medium text-white truncate">
                      {format.name || `${format.width}×${format.height}`}
                    </div>
                    <div className="text-[10px] text-white/40">
                      {format.width} × {format.height}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {formats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ImageIcon className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40">Žádné formáty v této kategorii</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default GeneratorView
