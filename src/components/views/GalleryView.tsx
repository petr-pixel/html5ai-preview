import { useState } from 'react'
import {
    Grid3X3, Download, Trash2, CheckSquare, Square,
    Package, Image as ImageIcon, Filter
} from 'lucide-react'
import { useStore } from '@/stores/app-store'
import { getFormatById } from '@/lib/formats'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function GalleryView() {
    const {
        creatives,
        clearCreatives,
        sourceImage,
        selectedFormats,
        platform
    } = useStore()

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [exporting, setExporting] = useState(false)
    const [filterPlatform, setFilterPlatform] = useState<'all' | 'sklik' | 'google'>('all')

    // Get all formats that have source image
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

    const handleExportAll = async () => {
        if (!sourceImage || formatIds.length === 0) return

        setExporting(true)

        try {
            const zip = new JSZip()
            const folder = zip.folder(`creatives_${platform}`)

            // Create canvas and export each format
            for (const formatId of formatIds) {
                const format = getFormatById(formatId)
                if (!format) continue

                // Create temporary canvas
                const canvas = document.createElement('canvas')
                canvas.width = format.width
                canvas.height = format.height
                const ctx = canvas.getContext('2d')
                if (!ctx) continue

                // Load source image
                const img = await loadImage(sourceImage)

                // Calculate smart crop
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

                // Convert to blob and add to zip
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((b) => resolve(b!), 'image/png')
                })

                const filename = `${format.name.replace(/\s+/g, '_')}_${format.width}x${format.height}.png`
                folder?.file(filename, blob)
            }

            // Generate and download zip
            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `adcreative_${platform}_${Date.now()}.zip`)

        } catch (error) {
            console.error('Export failed:', error)
            alert('Export se nezdařil')
        }

        setExporting(false)
    }

    const handleExportSelected = async () => {
        if (selectedIds.size === 0) return
        await handleExportAll() // For now, export all - can be refined later
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
                        {selectedIds.size === formatIds.length ? 'Zrušit vše' : 'Vybrat vše'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportAll}
                        disabled={exporting}
                        className="btn-accent flex items-center gap-2 text-sm"
                    >
                        <Package className="w-4 h-4" />
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
                                {/* Preview */}
                                <div
                                    className="bg-dark-800 flex items-center justify-center p-4"
                                    style={{ aspectRatio: Math.min(aspectRatio, 2).toString() }}
                                >
                                    {sourceImage ? (
                                        <img
                                            src={sourceImage}
                                            alt={format.name}
                                            className="max-w-full max-h-full object-contain rounded"
                                            style={{
                                                aspectRatio: aspectRatio.toString(),
                                                maxHeight: '150px'
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-white/20" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 bg-white/5">
                                    <div className="font-medium text-sm">{format.name}</div>
                                    <div className="text-xs text-white/40">
                                        {format.width} × {format.height}
                                        {format.maxSizeKB && ` • max ${format.maxSizeKB}KB`}
                                    </div>
                                </div>

                                {/* Selection indicator */}
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

// Helper function to load image
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}
