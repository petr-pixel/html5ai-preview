import { useState } from 'react'
import {
    Grid3X3, Download, CheckSquare, Square,
    Package, Image as ImageIcon, Code, Loader2
} from 'lucide-react'
import { useStore } from '@/stores/app-store'
import { getFormatById } from '@/lib/formats'
import { generateHTML5Zip } from '@/lib/html5-export'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function GalleryView() {
    const {
        sourceImage,
        selectedFormats,
        platform,
        textOverlay
    } = useStore()

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [exporting, setExporting] = useState(false)
    const [exportType, setExportType] = useState<'png' | 'html5'>('png')

    const formatIds = Array.from(selectedFormats)
    const hasCreatives = sourceImage && formatIds.length > 0

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const selectAll = () => {
        if (selectedIds.size === formatIds.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(formatIds))
        }
    }

    const handleExportPNG = async () => {
        if (!sourceImage || formatIds.length === 0) return

        setExporting(true)

        try {
            const zip = new JSZip()
            const folder = zip.folder(`creatives_${platform}`)

            for (const formatId of formatIds) {
                const format = getFormatById(formatId)
                if (!format) continue

                const canvas = document.createElement('canvas')
                canvas.width = format.width
                canvas.height = format.height
                const ctx = canvas.getContext('2d')
                if (!ctx) continue

                const img = await loadImage(sourceImage)

                // Smart crop
                const imgRatio = img.width / img.height
                const formatRatio = format.width / format.height

                let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height

                if (imgRatio > formatRatio) {
                    srcW = img.height * formatRatio
                    srcX = (img.width - srcW) / 2
                } else {
                    srcH = img.width / formatRatio
                    srcY = (img.height - srcH) / 2
                }

                ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

                // Add text overlay if enabled
                if (textOverlay.enabled) {
                    drawTextOverlay(ctx, format, textOverlay)
                }

                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((b) => resolve(b!), 'image/png')
                })

                const filename = `${format.name.replace(/\s+/g, '_')}_${format.width}x${format.height}.png`
                folder?.file(filename, blob)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `adcreative_${platform}_${Date.now()}.zip`)

        } catch (error) {
            console.error('Export failed:', error)
            alert('Export se nezdařil')
        }

        setExporting(false)
    }

    const handleExportHTML5 = async () => {
        if (!sourceImage || formatIds.length === 0) return

        setExporting(true)

        try {
            const zip = new JSZip()

            for (const formatId of formatIds) {
                const format = getFormatById(formatId)
                if (!format) continue

                const html5Zip = await generateHTML5Zip({
                    imageUrl: sourceImage,
                    width: format.width,
                    height: format.height,
                    animation: 'fade-in',
                    headline: textOverlay.headline,
                    subheadline: textOverlay.subheadline,
                    cta: textOverlay.cta,
                    ctaColor: textOverlay.ctaColor,
                }, format.name)

                const folderName = `${format.name.replace(/\s+/g, '_')}_${format.width}x${format.height}`
                const html5Content = await html5Zip.arrayBuffer()
                zip.file(`${folderName}.zip`, html5Content)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `adcreative_html5_${platform}_${Date.now()}.zip`)

        } catch (error) {
            console.error('HTML5 Export failed:', error)
            alert('HTML5 export se nezdařil')
        }

        setExporting(false)
    }

    if (!hasCreatives) {
        return (
            <div className="h-full flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Grid3X3 className="w-8 h-8 text-white/40" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Galerie kreativ</h2>
                    <p className="text-white/60">
                        Nejdříve vygenerujte kreativy v Generátoru
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col animate-fadeIn">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 glass-card mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5 text-accent" />
                        Galerie ({formatIds.length} formátů)
                    </h2>

                    <button
                        onClick={selectAll}
                        className="glass-button flex items-center gap-2 text-sm"
                    >
                        {selectedIds.size === formatIds.length ? (
                            <CheckSquare className="w-4 h-4" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        {selectedIds.size === formatIds.length ? 'Zrušit' : 'Vybrat vše'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export Type Toggle */}
                    <div className="flex rounded-lg border border-white/10 overflow-hidden">
                        <button
                            onClick={() => setExportType('png')}
                            className={`px-3 py-2 text-sm flex items-center gap-1 ${exportType === 'png' ? 'bg-accent text-white' : 'bg-white/5 text-white/60'
                                }`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            PNG
                        </button>
                        <button
                            onClick={() => setExportType('html5')}
                            className={`px-3 py-2 text-sm flex items-center gap-1 ${exportType === 'html5' ? 'bg-accent text-white' : 'bg-white/5 text-white/60'
                                }`}
                        >
                            <Code className="w-4 h-4" />
                            HTML5
                        </button>
                    </div>

                    <button
                        onClick={exportType === 'png' ? handleExportPNG : handleExportHTML5}
                        disabled={exporting}
                        className="btn-accent flex items-center gap-2 text-sm"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Package className="w-4 h-4" />
                        )}
                        {exporting ? 'Exportuji...' : 'Export ZIP'}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formatIds.map((formatId) => {
                        const format = getFormatById(formatId)
                        if (!format) return null

                        const isSelected = selectedIds.has(formatId)
                        const aspectRatio = format.width / format.height

                        return (
                            <div
                                key={formatId}
                                onClick={() => toggleSelect(formatId)}
                                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected
                                        ? 'border-accent ring-2 ring-accent/30'
                                        : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div
                                    className="bg-dark-800 flex items-center justify-center p-4"
                                    style={{ aspectRatio: Math.min(aspectRatio, 2).toString() }}
                                >
                                    {sourceImage && (
                                        <img
                                            src={sourceImage}
                                            alt={format.name}
                                            className="max-w-full max-h-full object-contain rounded"
                                            style={{
                                                aspectRatio: aspectRatio.toString(),
                                                maxHeight: '150px'
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="p-3 bg-white/5">
                                    <div className="font-medium text-sm">{format.name}</div>
                                    <div className="text-xs text-white/40">
                                        {format.width} × {format.height}
                                        {format.maxSizeKB && ` • max ${format.maxSizeKB}KB`}
                                    </div>
                                </div>

                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-accent' : 'bg-black/50'
                                    }`}>
                                    {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

function drawTextOverlay(
    ctx: CanvasRenderingContext2D,
    format: { width: number; height: number },
    overlay: { headline: string; subheadline: string; cta: string; ctaColor: string; position: string }
) {
    const padding = Math.min(format.width, format.height) * 0.05
    const headlineSize = Math.min(format.width, format.height) * 0.08
    const subSize = headlineSize * 0.6
    const ctaSize = headlineSize * 0.5

    let x = padding
    let y = format.height - padding

    if (overlay.position.includes('center')) {
        x = format.width / 2
    } else if (overlay.position.includes('right')) {
        x = format.width - padding
    }

    if (overlay.position.includes('top')) {
        y = padding + headlineSize
    } else if (overlay.position === 'center') {
        y = format.height / 2
    }

    ctx.textAlign = overlay.position.includes('center') ? 'center' :
        overlay.position.includes('right') ? 'right' : 'left'

    // Headline
    if (overlay.headline) {
        ctx.font = `bold ${headlineSize}px Arial`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.fillText(overlay.headline, x, y - subSize - ctaSize - 20)
    }

    // Subheadline
    if (overlay.subheadline) {
        ctx.font = `${subSize}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillText(overlay.subheadline, x, y - ctaSize - 10)
    }

    // CTA
    if (overlay.cta) {
        ctx.font = `bold ${ctaSize}px Arial`
        const ctaWidth = ctx.measureText(overlay.cta).width + 30
        const ctaHeight = ctaSize + 16

        let ctaX = x
        if (overlay.position.includes('center')) {
            ctaX = x - ctaWidth / 2
        } else if (overlay.position.includes('right')) {
            ctaX = x - ctaWidth
        }

        ctx.shadowBlur = 0
        ctx.fillStyle = overlay.ctaColor
        ctx.beginPath()
        ctx.roundRect(ctaX, y - ctaHeight, ctaWidth, ctaHeight, 6)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.fillText(overlay.cta, ctaX + ctaWidth / 2, y - 8)
    }

    ctx.shadowBlur = 0
}
