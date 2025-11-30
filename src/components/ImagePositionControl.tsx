/**
 * ImagePositionControl - Ovládání pozice obrázku při cropu
 * 
 * Umožňuje ručně posouvat obrázek pomocí:
 * - Šipek (jemný posun)
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
  Move
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'

const STEP = 5 // Krok posunu v procentech

export function ImagePositionControl() {
  const { imageOffset, setImageOffset, sourceImage, cropMode } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const moveImage = (dx: number, dy: number) => {
    setImageOffset({
      x: Math.max(-50, Math.min(50, imageOffset.x + dx)),
      y: Math.max(-50, Math.min(50, imageOffset.y + dy)),
    })
  }

  const resetPosition = () => {
    setImageOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: imageOffset.x,
      offsetY: imageOffset.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100
    const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100
    
    setImageOffset({
      x: Math.max(-50, Math.min(50, dragStartRef.current.offsetX + dx)),
      y: Math.max(-50, Math.min(50, dragStartRef.current.offsetY + dy)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  // Pokud není obrázek nebo je fit mode, nezobrazuj
  if (!sourceImage) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Pozice obrázku</span>
        </div>
        {(imageOffset.x !== 0 || imageOffset.y !== 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPosition}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        {/* Mini preview s drag */}
        <div 
          ref={containerRef}
          className={cn(
            'relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-move border-2 transition-colors',
            isDragging ? 'border-primary' : 'border-transparent hover:border-gray-300'
          )}
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
              transform: `translate(${imageOffset.x}%, ${imageOffset.y}%)`,
            }}
          />
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-px bg-white/50" />
            <div className="absolute w-px h-4 bg-white/50" />
          </div>
        </div>

        {/* Šipky */}
        <div className="grid grid-cols-3 gap-0.5 w-20 h-20">
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
          
          <div className="flex items-center justify-center text-[9px] text-muted-foreground font-mono">
            {imageOffset.x !== 0 || imageOffset.y !== 0 ? (
              `${imageOffset.x > 0 ? '+' : ''}${imageOffset.x},${imageOffset.y > 0 ? '+' : ''}${imageOffset.y}`
            ) : '0,0'}
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
        Táhni obrázek nebo použij šipky pro jemné doladění pozice.
      </p>
    </div>
  )
}
