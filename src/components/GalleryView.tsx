import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { useAuth } from '@/components/Auth'
import { platforms } from '@/lib/platforms'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { formatStorageSize, getStoragePercentage } from '@/lib/supabase'
import { validateCreatives, getValidationSummary, getStatusIcon, type ValidationStatus, type CreativeValidation } from '@/lib/creative-validator'
import { Card, Button, Badge, Input, Spinner } from '@/components/ui'
import { cn, loadImage, drawRoundedRect } from '@/lib/utils'
import {
  Grid3X3,
  List,
  Download,
  Search,
  Image,
  Film,
  Code,
  Check,
  Package,
  Trash2,
  Eye,
  Type,
  Wand2,
  X,
  HardDrive,
  Cloud,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ZoomIn,
} from 'lucide-react'
import type { Creative, TextOverlay, BrandKit } from '@/types'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'static' | 'html5' | 'video' | 'issues'
type SortType = 'date' | 'size' | 'platform' | 'format' | 'status'

export function GalleryView() {
  const { creatives, clearCreatives, deleteCreative, deleteCreatives, setActiveView, brandKits, activeBrandKit, addCreatives } = useAppStore()
  const { profile } = useAuth()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('date')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  
  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Creative | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  
  // Storage stats from profile
  const storageUsed = profile?.storage_used || 0
  const storageLimit = profile?.storage_limit || 100 * 1024 * 1024
  const storagePercent = getStoragePercentage(storageUsed, storageLimit)
  
  // Text Overlay Modal State
  const [overlayModalOpen, setOverlayModalOpen] = useState(false)
  const [overlayTarget, setOverlayTarget] = useState<Creative | null>(null)
  const [overlaySettings, setOverlaySettings] = useState<TextOverlay>({
    enabled: true,
    headline: '',
    subheadline: '',
    cta: 'Zjistit více',
    position: 'bottom-left',
    ctaColor: '#f97316',
    fontSize: 'medium',
  })
  const [isApplyingOverlay, setIsApplyingOverlay] = useState(false)

  const currentBrandKit = activeBrandKit 
    ? brandKits.find(kit => kit.id === activeBrandKit) 
    : brandKits.find(kit => kit.isDefault)

  const creativesArray = useMemo(() => Object.values(creatives), [creatives])
  
  // Validace všech kreativ
  const validations = useMemo(() => validateCreatives(creativesArray), [creativesArray])
  const validationSummary = useMemo(() => getValidationSummary(validations), [validations])

  // Filtrování
  const filteredCreatives = useMemo(() => {
    let result = creativesArray

    // Filter by type
    if (filter === 'issues') {
      // Pouze kreativy s varováním nebo chybou
      result = result.filter((c) => {
        const validation = validations.get(c.id)
        return validation && validation.status !== 'ok'
      })
    } else if (filter !== 'all') {
      result = result.filter((c) => {
        if (filter === 'html5') return c.isHTML5
        if (filter === 'video') return c.format.isVideo
        if (filter === 'static') return !c.isHTML5 && !c.format.isVideo
        return true
      })
    }

    // Search
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.format.name.toLowerCase().includes(searchLower) ||
          c.platform.toLowerCase().includes(searchLower) ||
          c.category.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'size':
          return (b.sizeKB || 0) - (a.sizeKB || 0)
        case 'platform':
          return a.platform.localeCompare(b.platform)
        case 'format':
          return `${a.format.width}x${a.format.height}`.localeCompare(
            `${b.format.width}x${b.format.height}`
          )
        case 'status':
          // Chyby první, pak varování, pak OK
          const statusOrder = { error: 0, warning: 1, ok: 2 }
          const statusA = validations.get(a.id)?.status || 'ok'
          const statusB = validations.get(b.id)?.status || 'ok'
          return statusOrder[statusA] - statusOrder[statusB]
        default:
          return 0
      }
    })

    return result
  }, [creativesArray, filter, search, sortBy, validations])

  // Stats
  const stats = useMemo(() => {
    const staticCount = creativesArray.filter((c) => !c.isHTML5 && !c.format.isVideo).length
    const html5Count = creativesArray.filter((c) => c.isHTML5).length
    const videoCount = creativesArray.filter((c) => c.format.isVideo).length
    const totalSizeKB = creativesArray.reduce((sum, c) => sum + (c.sizeKB || 0), 0)

    return { staticCount, html5Count, videoCount, totalSizeKB, total: creativesArray.length }
  }, [creativesArray])

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const selectAll = () => {
    setSelected(new Set(filteredCreatives.map((c) => c.id)))
  }

  const clearSelection = () => {
    setSelected(new Set())
  }

  // Export selected
  const handleExportSelected = async () => {
    const toExport = creativesArray.filter((c) => selected.has(c.id))
    if (toExport.length === 0) return

    setIsExporting(true)

    try {
      const zipBlob = await createCreativePackZip(toExport)
      downloadBlob(zipBlob, `kreativy_vyber_${new Date().toISOString().slice(0, 10)}.zip`)
    } catch (err) {
      console.error('Export error:', err)
      alert('Chyba při exportu')
    } finally {
      setIsExporting(false)
    }
  }

  // Download single
  const handleDownloadSingle = async (creative: Creative) => {
    // Pro video použij videoUrl
    const url = creative.isVideo && creative.videoUrl ? creative.videoUrl : creative.imageUrl
    const extension = creative.isVideo ? 'webm' : 'png'
    
    const response = await fetch(url)
    const blob = await response.blob()
    downloadBlob(
      blob,
      `${creative.platform}_${creative.format.width}x${creative.format.height}.${extension}`
    )
  }

  // Open Text Overlay Modal
  const openOverlayModal = (creative: Creative) => {
    setOverlayTarget(creative)
    setOverlaySettings({
      enabled: true,
      headline: '',
      subheadline: '',
      cta: 'Zjistit více',
      position: 'bottom-left',
      ctaColor: currentBrandKit?.ctaColor || '#f97316',
      fontSize: 'medium',
    })
    setOverlayModalOpen(true)
  }

  // Apply Text Overlay to creative
  const applyTextOverlay = async () => {
    if (!overlayTarget) return
    
    setIsApplyingOverlay(true)
    
    try {
      const img = await loadImage(overlayTarget.imageUrl)
      const canvas = document.createElement('canvas')
      canvas.width = overlayTarget.format.width
      canvas.height = overlayTarget.format.height
      const ctx = canvas.getContext('2d')!
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Draw text overlay
      drawTextOverlayOnCanvas(ctx, overlaySettings, overlayTarget.format.width, overlayTarget.format.height, currentBrandKit)
      
      const newImageUrl = canvas.toDataURL('image/png')
      
      // Create new creative with overlay
      const newCreative: Creative = {
        ...overlayTarget,
        id: `${overlayTarget.id}-overlay-${Date.now()}`,
        imageUrl: newImageUrl,
        createdAt: new Date(),
        sizeKB: Math.round((newImageUrl.length * 3) / 4 / 1024),
      }
      
      addCreatives([newCreative])
      setOverlayModalOpen(false)
      setOverlayTarget(null)
    } catch (err) {
      console.error('Error applying overlay:', err)
      alert('Chyba při aplikování textu')
    } finally {
      setIsApplyingOverlay(false)
    }
  }

  // Helper: Draw text overlay on canvas
  function drawTextOverlayOnCanvas(
    ctx: CanvasRenderingContext2D,
    overlay: TextOverlay,
    width: number,
    height: number,
    brandKit?: BrandKit | null
  ) {
    if (!overlay.enabled) return
    if (!overlay.headline && !overlay.subheadline && !overlay.cta) return

    const aspectRatio = width / height
    const isWide = aspectRatio > 2.5
    const isTall = aspectRatio < 0.5

    const padding = Math.min(width, height) * 0.06
    const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#f97316'
    const textColor = '#ffffff'
    const fontFamily = brandKit?.fontFamily || 'Arial, Helvetica, sans-serif'

    // Font sizing based on aspect ratio
    let baseSize = isWide ? height * 0.7 : isTall ? width * 0.6 : Math.min(width, height)
    const headlineSize = Math.max(12, Math.min(baseSize * 0.18, 72))
    const subSize = Math.max(10, Math.min(baseSize * 0.11, 48))
    const ctaSize = Math.max(9, Math.min(baseSize * 0.09, 36))

    // Position calculation
    let startY = height - padding
    const startX = padding

    // Draw CTA button first (from bottom)
    if (overlay.cta) {
      ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
      const ctaTextWidth = ctx.measureText(overlay.cta).width
      const ctaPadX = ctaSize * 0.8
      const ctaPadY = ctaSize * 0.4
      const ctaW = ctaTextWidth + ctaPadX * 2
      const ctaH = ctaSize + ctaPadY * 2

      startY -= ctaH
      
      // Button background with rounded corners
      ctx.fillStyle = ctaColor
      ctx.beginPath()
      if (ctx.roundRect) {
        ctx.roundRect(startX, startY, ctaW, ctaH, ctaH / 2)
      } else {
        drawRoundedRect(ctx, startX, startY, ctaW, ctaH, ctaH / 2)
      }
      ctx.fill()

      // Button text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(overlay.cta, startX + ctaW / 2, startY + ctaH / 2)

      startY -= padding * 0.5
    }

    // Draw subheadline
    if (overlay.subheadline && !isWide) {
      ctx.font = `${Math.round(subSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      startY -= subSize * 0.3
      ctx.fillText(overlay.subheadline, startX, startY)
      startY -= subSize * 1.2
      
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }

    // Draw headline
    if (overlay.headline) {
      ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      startY -= headlineSize * 0.2
      ctx.fillText(overlay.headline, startX, startY)
      
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
  }

  if (creativesArray.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Grid3X3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Galerie je prázdná</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nejprve vygenerujte nějaké kreativy v záložce "Vytvořit"
        </p>
        <Button onClick={() => setActiveView('create')}>Vytvořit kreativy</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Galerie kreativ</h2>
              <p className="text-xs text-muted-foreground">
                {stats.total} kreativ • {(stats.totalSizeKB / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>

          {/* Storage indicator */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
            storagePercent > 90 
              ? 'bg-red-100 text-red-700'
              : storagePercent > 70
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
          )}>
            <Cloud className="w-3.5 h-3.5" />
            <span className="font-medium">
              {formatStorageSize(storageUsed)} / {formatStorageSize(storageLimit)}
            </span>
            <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full',
                  storagePercent > 90 
                    ? 'bg-red-500'
                    : storagePercent > 70
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                )}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filter === 'static' ? 'primary' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setFilter(filter === 'static' ? 'all' : 'static')}
            >
              <Image className="w-3 h-3 mr-1" />
              {stats.staticCount} statických
            </Badge>
            <Badge
              variant={filter === 'html5' ? 'primary' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setFilter(filter === 'html5' ? 'all' : 'html5')}
            >
              <Code className="w-3 h-3 mr-1" />
              {stats.html5Count} HTML5
            </Badge>
            <Badge
              variant={filter === 'video' ? 'primary' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setFilter(filter === 'video' ? 'all' : 'video')}
            >
              <Film className="w-3 h-3 mr-1" />
              {stats.videoCount} videí
            </Badge>
            
            {/* Validation status badges */}
            {(validationSummary.warnings > 0 || validationSummary.errors > 0) && (
              <Badge
                variant={filter === 'issues' ? 'primary' : 'secondary'}
                className={cn(
                  'cursor-pointer',
                  filter !== 'issues' && validationSummary.errors > 0 && 'bg-red-100 text-red-700 hover:bg-red-200',
                  filter !== 'issues' && validationSummary.errors === 0 && validationSummary.warnings > 0 && 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                )}
                onClick={() => setFilter(filter === 'issues' ? 'all' : 'issues')}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {validationSummary.errors > 0 && `${validationSummary.errors} chyb`}
                {validationSummary.errors > 0 && validationSummary.warnings > 0 && ', '}
                {validationSummary.warnings > 0 && `${validationSummary.warnings} varování`}
              </Badge>
            )}
            {validationSummary.ok === validationSummary.total && validationSummary.total > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Vše OK
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat formát, platformu..."
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
        >
          <option value="date">Nejnovější</option>
          <option value="status">Podle stavu (chyby první)</option>
          <option value="size">Podle velikosti</option>
          <option value="platform">Podle platformy</option>
          <option value="format">Podle formátu</option>
        </select>

        {/* View mode */}
        <div className="flex border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-2 text-sm',
              viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-2 text-sm',
              viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <Card className="p-3 bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{selected.size} vybráno</Badge>
              <button onClick={selectAll} className="text-xs text-primary hover:underline">
                Vybrat vše ({filteredCreatives.length})
              </button>
              <button onClick={clearSelection} className="text-xs text-muted-foreground hover:underline">
                Zrušit výběr
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Opravdu smazat ${selected.size} kreativ?`)) {
                    deleteCreatives(Array.from(selected))
                    clearSelection()
                  }
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Smazat vybrané
              </Button>
              <Button
                size="sm"
                onClick={handleExportSelected}
                disabled={isExporting}
              >
                {isExporting ? <Spinner size={14} /> : <Download className="w-4 h-4" />}
                Stáhnout vybrané
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredCreatives.map((creative) => {
            const validation = validations.get(creative.id)
            const statusInfo = validation ? getStatusIcon(validation.status) : null
            
            return (
            <div
              key={creative.id}
              className={cn(
                'group relative bg-secondary rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                selected.has(creative.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : validation?.status === 'error'
                    ? 'border-red-300 hover:border-red-400'
                    : validation?.status === 'warning'
                      ? 'border-amber-300 hover:border-amber-400'
                      : 'border-transparent hover:border-muted-foreground/30'
              )}
              onClick={() => toggleSelect(creative.id)}
            >
              {/* Preview */}
              <div className="aspect-video bg-background flex items-center justify-center overflow-hidden relative">
                <img
                  src={creative.imageUrl}
                  alt={creative.format.name}
                  className="w-full h-full object-contain"
                />
                {/* Video play indicator */}
                {creative.isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Selection indicator */}
              {selected.has(creative.id) && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Validation status indicator */}
              {statusInfo && validation?.status !== 'ok' && (
                <div className={cn(
                  'absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  statusInfo.bgColor,
                  statusInfo.color
                )}>
                  {statusInfo.icon}
                </div>
              )}

              {/* Type badge */}
              <div className="absolute top-2 right-2 flex gap-1">
                {creative.isHTML5 ? (
                  <Badge variant="secondary" className="text-[10px]">
                    <Code className="w-3 h-3" />
                  </Badge>
                ) : creative.format.isVideo ? (
                  <Badge variant="secondary" className="text-[10px]">
                    <Film className="w-3 h-3" />
                  </Badge>
                ) : null}
              </div>

              {/* Actions on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Detail / Zoom */}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetailTarget(creative)
                    setDetailModalOpen(true)
                  }}
                  title="Detail"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadSingle(creative)
                  }}
                  title="Stáhnout"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {/* Text overlay - pouze pro obrázky, ne pro videa */}
                {!creative.isVideo && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      openOverlayModal(creative)
                    }}
                    title="Přidat text"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCreative(creative.id)
                  }}
                  title="Smazat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Info */}
              <div className="p-2">
                <div className="font-medium text-xs truncate">{creative.format.name}</div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-mono">
                    {creative.format.width}×{creative.format.height}
                  </span>
                  <span
                    style={{ color: platforms[creative.platform]?.color }}
                    className="font-medium"
                  >
                    {platforms[creative.platform]?.name}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filteredCreatives.length}
                    onChange={() =>
                      selected.size === filteredCreatives.length
                        ? clearSelection()
                        : selectAll()
                    }
                  />
                </th>
                <th className="px-3 py-2 text-left">Náhled</th>
                <th className="px-3 py-2 text-left">Formát</th>
                <th className="px-3 py-2 text-left">Rozměr</th>
                <th className="px-3 py-2 text-left">Platforma</th>
                <th className="px-3 py-2 text-left">Typ</th>
                <th className="px-3 py-2 text-right">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredCreatives.map((creative) => (
                <tr
                  key={creative.id}
                  className={cn(
                    'border-t border-border hover:bg-muted/30',
                    selected.has(creative.id) && 'bg-primary/5'
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(creative.id)}
                      onChange={() => toggleSelect(creative.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="w-16 h-10 rounded bg-muted overflow-hidden">
                      <img
                        src={creative.imageUrl}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium">{creative.format.name}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {creative.format.width}×{creative.format.height}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      style={{
                        background: `${platforms[creative.platform]?.color}20`,
                        color: platforms[creative.platform]?.color,
                      }}
                    >
                      {platforms[creative.platform]?.name}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {creative.isHTML5 ? (
                      <Badge variant="secondary">HTML5</Badge>
                    ) : creative.format.isVideo ? (
                      <Badge variant="secondary">Video</Badge>
                    ) : (
                      <Badge variant="secondary">Static</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadSingle(creative)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Footer actions */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={clearCreatives} className="text-destructive">
          <Trash2 className="w-4 h-4" />
          Smazat vše
        </Button>
        <Button onClick={handleExportSelected} disabled={selected.size === 0 || isExporting}>
          <Package className="w-4 h-4" />
          Exportovat {selected.size > 0 ? `(${selected.size})` : 'vše'}
        </Button>
      </div>

      {/* Text Overlay Modal */}
      {overlayModalOpen && overlayTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Type className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Přidat text overlay</h3>
                  <p className="text-xs text-gray-500">
                    {overlayTarget.format.name} ({overlayTarget.format.width}×{overlayTarget.format.height})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOverlayModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview */}
              <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
                <img 
                  src={overlayTarget.imageUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-64 object-contain rounded-lg shadow"
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {/* Headline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={overlaySettings.headline}
                    onChange={(e) => setOverlaySettings(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Black Friday - Sleva 25%"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Subheadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subheadline
                  </label>
                  <input
                    type="text"
                    value={overlaySettings.subheadline}
                    onChange={(e) => setOverlaySettings(prev => ({ ...prev, subheadline: e.target.value }))}
                    placeholder="Pouze do konce týdne"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA tlačítko
                    </label>
                    <input
                      type="text"
                      value={overlaySettings.cta}
                      onChange={(e) => setOverlaySettings(prev => ({ ...prev, cta: e.target.value }))}
                      placeholder="Nakupovat"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barva CTA
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={overlaySettings.ctaColor}
                        onChange={(e) => setOverlaySettings(prev => ({ ...prev, ctaColor: e.target.value }))}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={overlaySettings.ctaColor}
                        onChange={(e) => setOverlaySettings(prev => ({ ...prev, ctaColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick colors */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Rychlé barvy</label>
                  <div className="flex gap-2">
                    {['#f97316', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setOverlaySettings(prev => ({ ...prev, ctaColor: color }))}
                        className={cn(
                          'w-8 h-8 rounded-lg border-2 transition-all',
                          overlaySettings.ctaColor === color 
                            ? 'border-gray-900 scale-110' 
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setOverlayModalOpen(false)}>
                Zrušit
              </Button>
              <Button 
                onClick={applyTextOverlay}
                disabled={isApplyingOverlay || (!overlaySettings.headline && !overlaySettings.subheadline && !overlaySettings.cta)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {isApplyingOverlay ? (
                  <>
                    <Spinner size={14} />
                    Aplikuji...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Aplikovat overlay
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{detailTarget.format.name}</h3>
                  <p className="text-xs text-gray-500">
                    {detailTarget.format.width}×{detailTarget.format.height} • {platforms[detailTarget.platform]?.name} • {detailTarget.sizeKB} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Validation status */}
                {(() => {
                  const validation = validations.get(detailTarget.id)
                  if (!validation) return null
                  const statusInfo = getStatusIcon(validation.status)
                  return (
                    <div className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                      statusInfo.bgColor,
                      statusInfo.color
                    )}>
                      {validation.status === 'ok' && <CheckCircle className="w-3 h-3" />}
                      {validation.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                      {validation.status === 'error' && <XCircle className="w-3 h-3" />}
                      {validation.status === 'ok' ? 'OK' : validation.status === 'warning' ? 'Varování' : 'Chyba'}
                    </div>
                  )
                })()}
                <button 
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Large Preview */}
                <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
                  {detailTarget.isVideo && detailTarget.videoUrl ? (
                    <video 
                      src={detailTarget.videoUrl} 
                      controls 
                      className="max-w-full max-h-[400px] rounded-lg"
                    />
                  ) : (
                    <img
                      src={detailTarget.imageUrl}
                      alt={detailTarget.format.name}
                      className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                    />
                  )}
                </div>
                
                {/* Info & Actions */}
                <div className="space-y-4">
                  {/* Details */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-sm">Detaily</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Rozměry:</span>
                        <span className="ml-2 font-mono">{detailTarget.format.width}×{detailTarget.format.height}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Velikost:</span>
                        <span className="ml-2">{detailTarget.sizeKB} KB</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Platforma:</span>
                        <span className="ml-2" style={{ color: platforms[detailTarget.platform]?.color }}>
                          {platforms[detailTarget.platform]?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Kategorie:</span>
                        <span className="ml-2">{detailTarget.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vytvořeno:</span>
                        <span className="ml-2">{new Date(detailTarget.createdAt).toLocaleString('cs')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Typ:</span>
                        <span className="ml-2">
                          {detailTarget.isVideo ? 'Video' : detailTarget.isHTML5 ? 'HTML5' : 'Statický'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Validation Issues */}
                  {(() => {
                    const validation = validations.get(detailTarget.id)
                    if (!validation || validation.issues.length === 0) return null
                    return (
                      <div className={cn(
                        'rounded-xl p-4 space-y-2',
                        validation.status === 'error' ? 'bg-red-50' : 'bg-amber-50'
                      )}>
                        <h4 className={cn(
                          'font-medium text-sm flex items-center gap-2',
                          validation.status === 'error' ? 'text-red-700' : 'text-amber-700'
                        )}>
                          <AlertTriangle className="w-4 h-4" />
                          {validation.status === 'error' ? 'Chyby' : 'Varování'}
                        </h4>
                        <ul className="space-y-1">
                          {validation.issues.map((issue, idx) => (
                            <li key={idx} className={cn(
                              'text-sm',
                              issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                            )}>
                              • {issue.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })()}
                  
                  {/* Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Akce</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleDownloadSingle(detailTarget)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Stáhnout
                      </Button>
                      {!detailTarget.isVideo && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDetailModalOpen(false)
                            openOverlayModal(detailTarget)
                          }}
                          className="flex-1"
                        >
                          <Type className="w-4 h-4 mr-2" />
                          Přidat text
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const url = detailTarget.isVideo && detailTarget.videoUrl 
                            ? detailTarget.videoUrl 
                            : detailTarget.imageUrl
                          window.open(url, '_blank')
                        }}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Otevřít v novém okně
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Opravdu smazat tuto kreativu?')) {
                            deleteCreative(detailTarget.id)
                            setDetailModalOpen(false)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Smazat
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
