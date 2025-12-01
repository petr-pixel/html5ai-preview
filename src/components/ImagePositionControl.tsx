/**
 * ImagePositionControl - Ovládání pozice obrázku při cropu
 * 
 * Umožňuje ručně posouvat obrázek pro každý formát zvlášť:
 * - Výběr formátu z dropdownu
 * - Šipky (jemný posun)
 * - Drag & drop na náhledu
 * - Reset tlačítko
 */

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Move,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useMemo } from 'react'
import { platforms, getFormatKey } from '@/lib/platforms'

const STEP = 5 // Krok posunu v procentech

export function ImagePositionControl() {
  const { 
    formatOffsets, 
    setFormatOffset, 
    resetFormatOffsets,
    sourceImage, 
    selectedFormats,
    platform,
    category
  } = useAppStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFormatKey, setSelectedFormatKey] = useState<string | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Získej vybrané formáty pro dropdown
  const selectedFormatsList = useMemo(() => {
    const plat = platforms[platform]
    const cat = plat?.categories[category]
    if (!cat) return []
    
    return cat.formats
      .map(f => {
        const key = getFormatKey(platform, category, f.width, f.height)
        return { key, name: f.name, width: f.width, height: f.height }
      })
      .filter(f => selectedFormats.has(f.key))
  }, [platform, category, selectedFormats])

  // Nastav první formát pokud není vybraný
  const activeFormatKey = selectedFormatKey || selectedFormatsList[0]?.key || null
  const activeFormat = selectedFormatsList.find(f => f.key === activeFormatKey)
  
  // Offset pro aktivní formát
  const currentOffset = activeFormatKey ? (formatOffsets[activeFormatKey] || { x: 0, y: 0 }) : { x: 0, y: 0 }

  const moveImage = (dx: number, dy: number) => {
    if (!activeFormatKey) return
    setFormatOffset(activeFormatKey, {
      x: Math.max(-50, Math.min(50, currentOffset.x + dx)),
      y: Math.max(-50, Math.min(50, currentOffset.y + dy)),
    })
  }

  const resetPosition = () => {
    if (!activeFormatKey) return
    setFormatOffset(activeFormatKey, { x: 0, y: 0 })
  }

  const resetAllPositions = () => {
    resetFormatOffsets()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !activeFormatKey) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: currentOffset.x,
      offsetY: currentOffset.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current || !activeFormatKey) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100
    const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100
    
    setFormatOffset(activeFormatKey, {
      x: Math.max(-50, Math.min(50, dragStartRef.current.offsetX + dx)),
      y: Math.max(-50, Math.min(50, dragStartRef.current.offsetY + dy)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  // Počet formátů s upraveným offsetem
  const modifiedCount = Object.keys(formatOffsets).filter(k => {
    const o = formatOffsets[k]
    return o && (o.x !== 0 || o.y !== 0)
  }).length

  // Pokud není obrázek nebo nejsou vybrané formáty, nezobrazuj
  if (!sourceImage || selectedFormatsList.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Pozice obrázku</span>
          {modifiedCount > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {modifiedCount} upraveno
            </span>
          )}
        </div>
        {modifiedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAllPositions}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset vše
          </Button>
        )}
      </div>

      {/* Format selector */}
      <div className="flex items-center gap-2">
        <Layers className="w-3 h-3 text-muted-foreground" />
        <select
          value={activeFormatKey || ''}
          onChange={(e) => setSelectedFormatKey(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-border rounded-lg bg-background"
        >
          {selectedFormatsList.map(f => {
            const offset = formatOffsets[f.key]
            const hasOffset = offset && (offset.x !== 0 || offset.y !== 0)
            return (
              <option key={f.key} value={f.key}>
                {f.width}×{f.height} {f.name} {hasOffset ? '●' : ''}
              </option>
            )
          })}
        </select>
      </div>

      <div className="flex gap-3">
        {/* Mini preview s drag - aspect ratio podle formátu */}
        <div 
          ref={containerRef}
          className={cn(
            'relative bg-gray-100 rounded-lg overflow-hidden cursor-move border-2 transition-colors flex-shrink-0',
            isDragging ? 'border-primary' : 'border-transparent hover:border-gray-300'
          )}
          style={{
            width: 80,
            height: activeFormat ? Math.round(80 * (activeFormat.height / activeFormat.width)) : 80,
            maxHeight: 100,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={sourceImage}
            alt="Preview"
            className="absolute w-full h-full object-cover pointer-events-none"
            style={{
              transform: `translate(${currentOffset.x}%, ${currentOffset.y}%)`,
            }}
          />
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-px bg-white/50" />
            <div className="absolute w-px h-4 bg-white/50" />
          </div>
          {/* Format label */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5">
            {activeFormat?.width}×{activeFormat?.height}
          </div>
        </div>

        {/* Šipky */}
        <div className="grid grid-cols-3 gap-0.5" style={{ width: 72, height: 72 }}>
          <div />
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveImage(0, -STEP)}
            className="h-6 w-6"
            title="Nahoru"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <div />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveImage(-STEP, 0)}
            className="h-6 w-6"
            title="Doleva"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <div className="flex items-center justify-center">
            {currentOffset.x !== 0 || currentOffset.y !== 0 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetPosition}
                className="h-6 w-6"
                title="Reset"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            ) : (
              <span className="text-[9px] text-muted-foreground font-mono">0,0</span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveImage(STEP, 0)}
            className="h-6 w-6"
            title="Doprava"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
          
          <div />
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveImage(0, STEP)}
            className="h-6 w-6"
            title="Dolů"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
          <div />
        </div>
      </div>
      
      <p className="text-[10px] text-muted-foreground">
        Vyber formát a uprav pozici obrázku pro každý rozměr zvlášť.
      </p>
    </div>
  )
}
