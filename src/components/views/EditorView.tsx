import { useState, useRef, useEffect } from 'react'
import {
    ZoomIn, ZoomOut, RotateCcw, Type, Image as ImageIcon,
    Download, ChevronLeft, ChevronRight, Check, Layers,
    Move, Maximize2
} from 'lucide-react'
import { useStore } from '@/stores/app-store'
import { getFormatById, getAllFormats, type Format } from '@/lib/formats'

export function EditorView() {
    const {
        sourceImage,
        selectedFormats,
        platform,
        textOverlay, setTextOverlay,
        creatives, addCreatives
    } = useStore()

    const [currentFormatIndex, setCurrentFormatIndex] = useState(0)
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [showTextPanel, setShowTextPanel] = useState(false)

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Get current format from selection
    const formatIds = Array.from(selectedFormats)
    const currentFormatId = formatIds[currentFormatIndex]
    const currentFormat = currentFormatId ? getFormatById(currentFormatId) : null

    // Draw canvas
    useEffect(() => {
        if (!canvasRef.current || !currentFormat || !sourceImage) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size to format dimensions
        canvas.width = currentFormat.width
        canvas.height = currentFormat.height

        // Clear canvas
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Load and draw source image
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            // Calculate smart crop to fill format
            const imgRatio = img.width / img.height
            const formatRatio = currentFormat.width / currentFormat.height

            let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height

            if (imgRatio > formatRatio) {
                // Image is wider - crop sides
                srcW = img.height * formatRatio
                srcX = (img.width - srcW) / 2 + (position.x * img.width / 100)
            } else {
                // Image is taller - crop top/bottom
                srcH = img.width / formatRatio
                srcY = (img.height - srcH) / 2 + (position.y * img.height / 100)
            }

            // Draw image
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

            // Draw text overlay if enabled
            if (textOverlay.enabled) {
                drawTextOverlay(ctx, currentFormat)
            }
        }
        img.src = sourceImage
    }, [sourceImage, currentFormat, position, textOverlay, zoom])

    const drawTextOverlay = (ctx: CanvasRenderingContext2D, format: Format) => {
        const padding = Math.min(format.width, format.height) * 0.05
        const headlineSize = Math.min(format.width, format.height) * 0.08
        const subSize = headlineSize * 0.6
        const ctaSize = headlineSize * 0.5

        // Position calculations
        let x = padding
        let y = format.height - padding

        if (textOverlay.position.includes('center')) {
            x = format.width / 2
        } else if (textOverlay.position.includes('right')) {
            x = format.width - padding
        }

        if (textOverlay.position.includes('top')) {
            y = padding + headlineSize
        } else if (textOverlay.position === 'center') {
            y = format.height / 2
        }

        ctx.textAlign = textOverlay.position.includes('center') ? 'center' :
            textOverlay.position.includes('right') ? 'right' : 'left'

        // Draw headline
        if (textOverlay.headline) {
            ctx.font = `bold ${headlineSize}px Arial`
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur = 4
            ctx.fillText(textOverlay.headline, x, y - subSize - ctaSize - 20)
        }

        // Draw subheadline
        if (textOverlay.subheadline) {
            ctx.font = `${subSize}px Arial`
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.fillText(textOverlay.subheadline, x, y - ctaSize - 10)
        }

        // Draw CTA button
        if (textOverlay.cta) {
            ctx.font = `bold ${ctaSize}px Arial`
            const ctaWidth = ctx.measureText(textOverlay.cta).width + 30
            const ctaHeight = ctaSize + 16

            let ctaX = x
            if (textOverlay.position.includes('center')) {
                ctaX = x - ctaWidth / 2
            } else if (textOverlay.position.includes('right')) {
                ctaX = x - ctaWidth
            }

            // CTA background
            ctx.shadowBlur = 0
            ctx.fillStyle = textOverlay.ctaColor
            ctx.beginPath()
            ctx.roundRect(ctaX, y - ctaHeight, ctaWidth, ctaHeight, 6)
            ctx.fill()

            // CTA text
            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'center'
            ctx.fillText(textOverlay.cta, ctaX + ctaWidth / 2, y - 8)
        }

        ctx.shadowBlur = 0
    }

    const handlePrevFormat = () => {
        setCurrentFormatIndex(prev => Math.max(0, prev - 1))
    }

    const handleNextFormat = () => {
        setCurrentFormatIndex(prev => Math.min(formatIds.length - 1, prev + 1))
    }

    const handleExportCurrent = () => {
        if (!canvasRef.current || !currentFormat) return

        const link = document.createElement('a')
        link.download = `${currentFormat.name.replace(/\s+/g, '_')}_${currentFormat.width}x${currentFormat.height}.png`
        link.href = canvasRef.current.toDataURL('image/png')
        link.click()
    }

    if (!sourceImage) {
        return (
            <div className="h-full flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-white/40" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Žádný zdrojový obrázek</h2>
                    <p className="text-white/60">Nejdříve vygenerujte obrázek v Generátoru</p>
                </div>
            </div>
        )
    }

    if (formatIds.length === 0) {
        return (
            <div className="h-full flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8 text-white/40" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Žádné formáty</h2>
                    <p className="text-white/60">Vyberte formáty v Generátoru</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex gap-4 animate-fadeIn">
            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-3 glass-card mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevFormat} disabled={currentFormatIndex === 0} className="glass-button p-2 disabled:opacity-30">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm">
                            {currentFormatIndex + 1} / {formatIds.length}
                            {currentFormat && (
                                <span className="text-white/60 ml-2">
                                    {currentFormat.name} ({currentFormat.width}×{currentFormat.height})
                                </span>
                            )}
                        </span>
                        <button onClick={handleNextFormat} disabled={currentFormatIndex === formatIds.length - 1} className="glass-button p-2 disabled:opacity-30">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="glass-button p-2">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="glass-button p-2">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }} className="glass-button p-2">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTextPanel(!showTextPanel)}
                            className={`glass-button p-2 ${showTextPanel ? 'bg-accent/20 text-accent' : ''}`}
                        >
                            <Type className="w-5 h-5" />
                        </button>
                        <button onClick={handleExportCurrent} className="btn-accent flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-[#0a0a0a] rounded-xl overflow-auto flex items-center justify-center p-8"
                >
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="shadow-2xl"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                imageRendering: 'crisp-edges'
                            }}
                        />
                    </div>
                </div>

                {/* Format Thumbnails */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {formatIds.map((formatId, index) => {
                        const format = getFormatById(formatId)
                        if (!format) return null
                        return (
                            <button
                                key={formatId}
                                onClick={() => setCurrentFormatIndex(index)}
                                className={`flex-shrink-0 p-2 rounded-lg border transition-all ${index === currentFormatIndex
                                        ? 'border-accent bg-accent/10'
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="text-xs font-medium">{format.name}</div>
                                <div className="text-xs text-white/40">{format.width}×{format.height}</div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Right Panel - Text Overlay */}
            {showTextPanel && (
                <div className="w-80 glass-card p-4 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Type className="w-5 h-5 text-accent" />
                        Text Overlay
                    </h3>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={textOverlay.enabled}
                            onChange={(e) => setTextOverlay({ enabled: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Povolit text</span>
                    </label>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Headline</label>
                        <input
                            type="text"
                            value={textOverlay.headline}
                            onChange={(e) => setTextOverlay({ headline: e.target.value })}
                            placeholder="Hlavní titulek..."
                            className="input text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Subheadline</label>
                        <input
                            type="text"
                            value={textOverlay.subheadline}
                            onChange={(e) => setTextOverlay({ subheadline: e.target.value })}
                            placeholder="Podtitulek..."
                            className="input text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">CTA Button</label>
                        <input
                            type="text"
                            value={textOverlay.cta}
                            onChange={(e) => setTextOverlay({ cta: e.target.value })}
                            placeholder="Zjistit více..."
                            className="input text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">CTA Barva</label>
                        <input
                            type="color"
                            value={textOverlay.ctaColor}
                            onChange={(e) => setTextOverlay({ ctaColor: e.target.value })}
                            className="w-full h-10 rounded-lg cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">Pozice</label>
                        <div className="grid grid-cols-3 gap-1">
                            {['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => setTextOverlay({ position: pos as any })}
                                    className={`p-2 text-xs rounded border transition-all ${textOverlay.position === pos
                                            ? 'border-accent bg-accent/10'
                                            : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {pos === 'center' ? '●' : pos.split('-').map(p => p[0].toUpperCase()).join('')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
