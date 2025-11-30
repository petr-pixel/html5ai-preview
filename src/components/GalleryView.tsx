import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms } from '@/lib/platforms'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { Card, Button, Badge, Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'
import type { Creative } from '@/types'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'static' | 'html5' | 'video'
type SortType = 'date' | 'size' | 'platform' | 'format'

export function GalleryView() {
  const { creatives, clearCreatives, setActiveView } = useAppStore()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('date')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)

  const creativesArray = useMemo(() => Object.values(creatives), [creatives])

  // Filtrování
  const filteredCreatives = useMemo(() => {
    let result = creativesArray

    // Filter by type
    if (filter !== 'all') {
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
        default:
          return 0
      }
    })

    return result
  }, [creativesArray, filter, search, sortBy])

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
      const staticContents: { format: any; blob: Blob; filename: string }[] = []

      for (const c of toExport) {
        const response = await fetch(c.imageUrl)
        const blob = await response.blob()
        const filename = `${c.platform}_${c.category}_${c.format.width}x${c.format.height}.png`
        staticContents.push({ format: c.format, blob, filename })
      }

      const zipBlob = await createCreativePackZip(
        { static: staticContents, html5: [], video: [] },
        'export',
        `selected_${selected.size}`
      )

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
    const response = await fetch(creative.imageUrl)
    const blob = await response.blob()
    downloadBlob(
      blob,
      `${creative.platform}_${creative.format.width}x${creative.format.height}.png`
    )
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
          {filteredCreatives.map((creative) => (
            <div
              key={creative.id}
              className={cn(
                'group relative bg-secondary rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                selected.has(creative.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
              onClick={() => toggleSelect(creative.id)}
            >
              {/* Preview */}
              <div className="aspect-video bg-background flex items-center justify-center overflow-hidden">
                <img
                  src={creative.imageUrl}
                  alt={creative.format.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Selection indicator */}
              {selected.has(creative.id) && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Type badge */}
              <div className="absolute top-2 right-2">
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
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadSingle(creative)
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(creative.imageUrl, '_blank')
                  }}
                >
                  <Eye className="w-4 h-4" />
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
          ))}
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
    </div>
  )
}
