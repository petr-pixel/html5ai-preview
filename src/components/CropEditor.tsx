import React, { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card } from '@/components/ui'
import { Move, RotateCcw, Check, X } from 'lucide-react'
import type { Format } from '@/types'

interface CropEditorProps {
  format: Format
  formatKey: string
  sourceImage: string
  onClose: () => void
}

export function CropEditor({ format, formatKey, sourceImage, onClose }: CropEditorProps) {
  const { formatOutputSettings, setFormatOutputSettings } = useAppStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [_dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Aktuální crop settings nebo default
  const currentSettings = formatOutputSettings[formatKey]?.cropSettings || {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    focusX: 0.5,
    focusY: 0.5,
  }

  const [focusPoint, setFocusPoint] = useState({
    x: currentSettings.focusX,
    y: currentSettings.focusY,
  })

  // Aspect ratio cílového formátu
  const targetRatio = format.width / format.height

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setFocusPoint({ x, y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset to center
  const handleReset = () => {
    setFocusPoint({ x: 0.5, y: 0.5 })
  }

  // Save
  const handleSave = () => {
    setFormatOutputSettings(formatKey, {
      cropSettings: {
        ...currentSettings,
        focusX: focusPoint.x,
        focusY: focusPoint.y,
      },
    })
    onClose()
  }

  // Výpočet crop rectangle pro preview
  const getCropRect = () => {
    // Předpokládáme zdrojový obrázek 16:9 (1920x1080)
    const sourceRatio = 16 / 9
    
    let cropWidth: number
    let cropHeight: number

    if (sourceRatio > targetRatio) {
      // Zdrojový je širší - ořízneme strany
      cropHeight = 100
      cropWidth = (targetRatio / sourceRatio) * 100
    } else {
      // Zdrojový je vyšší - ořízneme nahoře/dole
      cropWidth = 100
      cropHeight = (sourceRatio / targetRatio) * 100
    }

    const maxX = 100 - cropWidth
    const maxY = 100 - cropHeight
    const x = maxX * focusPoint.x
    const y = maxY * focusPoint.y

    return { x, y, width: cropWidth, height: cropHeight }
  }

  const cropRect = getCropRect()

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Upravit výřez</h3>
            <p className="text-sm text-muted-foreground">
              {format.name} ({format.width}×{format.height})
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview */}
        <div
          ref={containerRef}
          className="relative bg-muted rounded-xl overflow-hidden cursor-move mb-4"
          style={{ aspectRatio: '16/9' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Source image */}
          <img
            src={sourceImage}
            alt="Source"
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Dimmed overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Crop area (visible) */}
          <div
            className="absolute border-2 border-white shadow-lg"
            style={{
              left: `${cropRect.x}%`,
              top: `${cropRect.y}%`,
              width: `${cropRect.width}%`,
              height: `${cropRect.height}%`,
            }}
          >
            {/* Clear area */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                backgroundImage: `url(${sourceImage})`,
                backgroundSize: `${100 / cropRect.width * 100}% ${100 / cropRect.height * 100}%`,
                backgroundPosition: `${-cropRect.x / cropRect.width * 100}% ${-cropRect.y / cropRect.height * 100}%`,
              }}
            />

            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/30" />
              ))}
            </div>

            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
          </div>

          {/* Focus point indicator */}
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center pointer-events-none"
            style={{
              left: `${focusPoint.x * 100}%`,
              top: `${focusPoint.y * 100}%`,
            }}
          >
            <Move className="w-3 h-3 text-white" />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="px-2 py-1 bg-black/60 rounded text-xs text-white">
              Klikněte a táhněte pro posun středu výřezu
            </span>
          </div>
        </div>

        {/* Focus point info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <label className="text-xs text-muted-foreground">Horizontální pozice</label>
            <input
              type="range"
              min="0"
              max="100"
              value={focusPoint.x * 100}
              onChange={(e) => setFocusPoint({ ...focusPoint, x: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{Math.round(focusPoint.x * 100)}%</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Vertikální pozice</label>
            <input
              type="range"
              min="0"
              max="100"
              value={focusPoint.y * 100}
              onChange={(e) => setFocusPoint({ ...focusPoint, y: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{Math.round(focusPoint.y * 100)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Reset na střed
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Zrušit
            </Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4" />
              Uložit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
