/**
 * FormatEditorV3 - Profesionální editor formátu
 * 
 * FUNKCE:
 * ✅ MUST HAVE:
 *    - Undo/Redo (Ctrl+Z, Ctrl+Y)
 *    - Safe Zone overlay (Branding, Interscroller)
 *    - Validace formátu (max size, file types)
 *    - Automatická komprese na limit
 * 
 * ✅ SHOULD HAVE:
 *    - Fonty z Brand Kit
 *    - Watermark/Logo editor
 *    - Multi-preview (YouTube, Gmail, Display, Discover)
 *    - HTML5 export s animacemi
 *    - Batch edit (aplikovat na více formátů)
 * 
 * ✅ NICE TO HAVE:
 *    - AI text suggestions (GPT)
 *    - Color picker z obrázku (Eyedropper)
 *    - Snap to grid
 *    - Layer z-index
 *    - Gradient overlay pod text
 * 
 * @version 3.0.0
 * @author AdCreative Studio
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { outpaintWithOffset } from '@/lib/outpaint'
import { Button, Input } from '@/components/ui'
import { CostBadge, calculateCost } from '@/components/CostEstimate'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { 
  X, RotateCcw, Eye, EyeOff, Minus, Plus, Type, Wand2, Loader2, 
  Sparkles, MousePointer2, AlignLeft, AlignCenter, AlignRight, Check, 
  Undo2, Redo2, Anchor, Move, Lock, Unlock, AlertTriangle, Download,
  Layers, Grid3X3, Palette, Image, Play, FileCode, Copy, Smartphone,
  Monitor, Mail, Youtube, Search, LayoutGrid, Map, Pipette, Sliders,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ZoomIn, ZoomOut,
  RotateCw, FlipHorizontal, Trash2, Settings, HelpCircle, Maximize2
} from 'lucide-react'
import type { Format, BrandKit } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface TextElement {
  text: string
  visible: boolean
  x: number  // 0-100%
  y: number  // 0-100%
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  shadow: boolean
  shadowColor: string
  shadowBlur: number
  letterSpacing: number
  lineHeight: number
  maxWidth: number  // 0-100%
  zIndex: number
}

interface CTAElement extends TextElement {
  backgroundColor: string
  paddingX: number
  paddingY: number
  borderRadius: number
  borderWidth: number
  borderColor: string
}

interface LogoElement {
  visible: boolean
  x: number
  y: number
  width: number  // 0-100%
  opacity: number
  variant: 'auto' | 'light' | 'dark'
  zIndex: number
}

interface GradientOverlay {
  enabled: boolean
  type: 'linear' | 'radial'
  direction: 'to-top' | 'to-bottom' | 'to-left' | 'to-right'
  color: string
  opacity: number
}

interface TextLayer {
  headline: TextElement
  subheadline: TextElement
  cta: CTAElement
  logo: LogoElement
  gradient: GradientOverlay
}

interface HistoryState {
  textLayer: TextLayer
  offset: { x: number; y: number }
  locked: boolean
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  fileSize: number
  maxSize: number
}

interface SafeZone {
  x: number
  y: number
  width: number
  height: number
  description: string
}

interface Props {
  formatKey: string
  format: Format & { safeZone?: SafeZone }
  sourceImage: string | null
  onClose: () => void
  onSave?: (creative: any) => void
  onApplyToAll?: (textLayer: TextLayer) => void
}

type PreviewChannel = 'youtube' | 'gmail' | 'search' | 'display' | 'discover' | 'maps'
type SelectedElement = 'headline' | 'subheadline' | 'cta' | 'logo' | null

// =============================================================================
// CONSTANTS
// =============================================================================

const SNAP_THRESHOLD = 5  // px
const GRID_SIZE = 10      // %
const MAX_HISTORY = 50

const FONT_OPTIONS = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
]

const LAYOUT_PRESETS = [
  { id: 'bottom-left', icon: '↙️', label: 'Vlevo dole' },
  { id: 'bottom-center', icon: '⬇️', label: 'Dole střed' },
  { id: 'bottom-right', icon: '↘️', label: 'Vpravo dole' },
  { id: 'center', icon: '⏺️', label: 'Střed' },
  { id: 'top-left', icon: '↖️', label: 'Vlevo nahoře' },
  { id: 'top-center', icon: '⬆️', label: 'Nahoře střed' },
  { id: 'left-stack', icon: '◀️', label: 'Levý stack' },
  { id: 'right-stack', icon: '▶️', label: 'Pravý stack' },
]

const ANIMATION_PRESETS = [
  { id: 'none', label: 'Žádná', icon: '⏹️' },
  { id: 'fade-in', label: 'Fade In', icon: '🌅' },
  { id: 'slide-up', label: 'Slide Up', icon: '⬆️' },
  { id: 'slide-left', label: 'Slide Left', icon: '⬅️' },
  { id: 'ken-burns', label: 'Ken Burns', icon: '🎬' },
  { id: 'pulse-cta', label: 'Pulse CTA', icon: '💓' },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createDefaultTextLayer(format: Format, brandKit?: BrandKit | null): TextLayer {
  const { width, height } = format
  const base = Math.min(width, height)
  const ratio = width / height
  
  const headlineSize = Math.round(Math.max(16, Math.min(72, base * 0.08)))
  const subSize = Math.round(Math.max(12, Math.min(36, base * 0.045)))
  const ctaSize = Math.round(Math.max(12, Math.min(28, base * 0.04)))
  
  const primaryColor = brandKit?.primaryColor || '#f97316'
  const textColor = brandKit?.textLight || '#ffffff'
  const fontFamily = brandKit?.headlineFont || 'Inter, sans-serif'
  
  const isWide = ratio > 2
  const isTall = ratio < 0.7
  
  return {
    headline: {
      text: '',
      visible: true,
      x: isWide ? 5 : 50,
      y: isWide ? 35 : isTall ? 25 : 35,
      fontSize: headlineSize,
      fontWeight: 'bold',
      fontFamily,
      color: textColor,
      textAlign: isWide ? 'left' : 'center',
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 4,
      letterSpacing: 0,
      lineHeight: 1.2,
      maxWidth: 85,
      zIndex: 3,
    },
    subheadline: {
      text: '',
      visible: true,
      x: isWide ? 5 : 50,
      y: isWide ? 50 : isTall ? 40 : 50,
      fontSize: subSize,
      fontWeight: 'normal',
      fontFamily: brandKit?.bodyFont || fontFamily,
      color: textColor,
      textAlign: isWide ? 'left' : 'center',
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.6)',
      shadowBlur: 3,
      letterSpacing: 0,
      lineHeight: 1.4,
      maxWidth: 80,
      zIndex: 2,
    },
    cta: {
      text: '',
      visible: true,
      x: isWide ? 5 : 50,
      y: isWide ? 70 : isTall ? 75 : 70,
      fontSize: ctaSize,
      fontWeight: 'bold',
      fontFamily,
      color: '#ffffff',
      textAlign: isWide ? 'left' : 'center',
      shadow: false,
      shadowColor: 'transparent',
      shadowBlur: 0,
      letterSpacing: 0.5,
      lineHeight: 1,
      maxWidth: 50,
      zIndex: 4,
      backgroundColor: primaryColor,
      paddingX: Math.round(ctaSize * 0.8),
      paddingY: Math.round(ctaSize * 0.4),
      borderRadius: 100,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    logo: {
      visible: false,
      x: 90,
      y: 10,
      width: 12,
      opacity: 1,
      variant: 'auto',
      zIndex: 5,
    },
    gradient: {
      enabled: true,
      type: 'linear',
      direction: 'to-top',
      color: '#000000',
      opacity: 0.6,
    }
  }
}

function snapToGrid(value: number, enabled: boolean): number {
  if (!enabled) return value
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

async function compressImage(dataUrl: string, maxSizeKB: number, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      
      let result = canvas.toDataURL('image/jpeg', quality)
      let currentSize = Math.round((result.length * 3) / 4 / 1024)
      
      // Postupně snižuj kvalitu dokud není pod limitem
      while (currentSize > maxSizeKB && quality > 0.1) {
        quality -= 0.1
        result = canvas.toDataURL('image/jpeg', quality)
        currentSize = Math.round((result.length * 3) / 4 / 1024)
      }
      
      resolve(result)
    }
    img.src = dataUrl
  })
}

function validateFormat(
  dataUrl: string, 
  maxSizeKB: number, 
  allowedTypes: string[]
): ValidationResult {
  const sizeBytes = Math.round((dataUrl.length * 3) / 4)
  const sizeKB = Math.round(sizeBytes / 1024)
  
  const errors: string[] = []
  const warnings: string[] = []
  
  if (sizeKB > maxSizeKB) {
    errors.push(`Velikost ${sizeKB} kB překračuje limit ${maxSizeKB} kB`)
  } else if (sizeKB > maxSizeKB * 0.9) {
    warnings.push(`Velikost ${sizeKB} kB je blízko limitu ${maxSizeKB} kB`)
  }
  
  // Check file type from data URL
  const mimeMatch = dataUrl.match(/data:image\/(\w+);/)
  if (mimeMatch) {
    const type = mimeMatch[1].toLowerCase()
    const normalizedTypes = allowedTypes.map(t => t.toLowerCase().replace('jpg', 'jpeg'))
    if (!normalizedTypes.includes(type)) {
      errors.push(`Typ ${type.toUpperCase()} není povolený. Povolené: ${allowedTypes.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileSize: sizeKB,
    maxSize: maxSizeKB,
  }
}

function generateHTML5Banner(
  imageUrl: string,
  textLayer: TextLayer,
  format: Format,
  animation: string
): string {
  const { width, height } = format
  
  const animationCSS = {
    'none': '',
    'fade-in': `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .animate { animation: fadeIn 1s ease-out forwards; }
    `,
    'slide-up': `
      @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .animate { animation: slideUp 0.8s ease-out forwards; }
    `,
    'slide-left': `
      @keyframes slideLeft { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      .animate { animation: slideLeft 0.8s ease-out forwards; }
    `,
    'ken-burns': `
      @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.1); } }
      .bg { animation: kenBurns 8s ease-out forwards; }
    `,
    'pulse-cta': `
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .cta { animation: pulse 2s ease-in-out infinite; }
    `,
  }[animation] || ''
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width=${width},height=${height}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${width}px; height: ${height}px; overflow: hidden; font-family: ${textLayer.headline.fontFamily}; }
    .container { position: relative; width: 100%; height: 100%; }
    .bg { position: absolute; inset: 0; background: url('${imageUrl}') center/cover no-repeat; }
    ${textLayer.gradient.enabled ? `.gradient { position: absolute; inset: 0; background: linear-gradient(${textLayer.gradient.direction}, transparent 0%, ${textLayer.gradient.color} 100%); opacity: ${textLayer.gradient.opacity}; }` : ''}
    .text-layer { position: absolute; inset: 0; display: flex; flex-direction: column; }
    .headline { position: absolute; left: ${textLayer.headline.x}%; top: ${textLayer.headline.y}%; transform: translate(-50%, -50%); font-size: ${textLayer.headline.fontSize}px; font-weight: ${textLayer.headline.fontWeight}; color: ${textLayer.headline.color}; text-align: ${textLayer.headline.textAlign}; ${textLayer.headline.shadow ? `text-shadow: 0 2px 4px ${textLayer.headline.shadowColor};` : ''} }
    .subheadline { position: absolute; left: ${textLayer.subheadline.x}%; top: ${textLayer.subheadline.y}%; transform: translate(-50%, -50%); font-size: ${textLayer.subheadline.fontSize}px; color: ${textLayer.subheadline.color}; text-align: ${textLayer.subheadline.textAlign}; ${textLayer.subheadline.shadow ? `text-shadow: 0 2px 4px ${textLayer.subheadline.shadowColor};` : ''} }
    .cta { position: absolute; left: ${textLayer.cta.x}%; top: ${textLayer.cta.y}%; transform: translate(-50%, -50%); font-size: ${textLayer.cta.fontSize}px; font-weight: bold; color: ${textLayer.cta.color}; background: ${textLayer.cta.backgroundColor}; padding: ${textLayer.cta.paddingY}px ${textLayer.cta.paddingX}px; border-radius: ${textLayer.cta.borderRadius}px; cursor: pointer; }
    ${animationCSS}
  </style>
</head>
<body>
  <div class="container" onclick="window.open(clickTag)">
    <div class="bg ${animation === 'ken-burns' ? 'animate' : ''}"></div>
    ${textLayer.gradient.enabled ? '<div class="gradient"></div>' : ''}
    <div class="text-layer">
      ${textLayer.headline.visible && textLayer.headline.text ? `<div class="headline ${animation !== 'ken-burns' ? 'animate' : ''}">${textLayer.headline.text}</div>` : ''}
      ${textLayer.subheadline.visible && textLayer.subheadline.text ? `<div class="subheadline ${animation !== 'ken-burns' ? 'animate' : ''}" style="animation-delay: 0.2s">${textLayer.subheadline.text}</div>` : ''}
      ${textLayer.cta.visible && textLayer.cta.text ? `<div class="cta ${animation === 'pulse-cta' ? 'animate' : ''}" style="animation-delay: 0.4s">${textLayer.cta.text}</div>` : ''}
    </div>
  </div>
  <script>var clickTag = "https://example.com";</script>
</body>
</html>`
}

// =============================================================================
// DRAGGABLE COMPONENT
// =============================================================================

interface DraggableProps {
  x: number
  y: number
  children: React.ReactNode
  onMove: (x: number, y: number) => void
  onMoveEnd: () => void
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  label?: string
  color?: string
  snapEnabled?: boolean
}

function Draggable({ 
  x, y, children, onMove, onMoveEnd, isSelected, onSelect, disabled, label, color = 'blue', snapEnabled = false 
}: DraggableProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, startY: 0, elemX: 0, elemY: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.active) return
      
      const container = ref.current?.parentElement
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      const newX = dragState.current.elemX + ((e.clientX - dragState.current.startX) / rect.width) * 100
      const newY = dragState.current.elemY + ((e.clientY - dragState.current.startY) / rect.height) * 100
      
      const clampedX = Math.max(2, Math.min(98, snapToGrid(newX, snapEnabled)))
      const clampedY = Math.max(2, Math.min(98, snapToGrid(newY, snapEnabled)))
      
      onMove(clampedX, clampedY)
    }
    
    const handleMouseUp = () => {
      if (dragState.current.active) {
        dragState.current.active = false
        onMoveEnd()
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onMove, onMoveEnd, snapEnabled])
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      elemX: x,
      elemY: y,
    }
  }
  
  const borderColor = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    orange: 'border-orange-500',
    purple: 'border-purple-500',
  }[color] || 'border-blue-500'
  
  return (
    <div
      ref={ref}
      className={cn(
        'absolute cursor-move transition-shadow',
        isSelected && `ring-2 ring-offset-1 ${borderColor.replace('border', 'ring')}`,
        disabled && 'cursor-not-allowed opacity-50'
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
      {isSelected && label && (
        <div className={cn(
          'absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap',
          color === 'blue' && 'bg-blue-500',
          color === 'green' && 'bg-green-500',
          color === 'orange' && 'bg-orange-500',
          color === 'purple' && 'bg-purple-500',
        )}>
          {label}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SAFE ZONE OVERLAY
// =============================================================================

interface SafeZoneOverlayProps {
  safeZone: SafeZone
  containerWidth: number
  containerHeight: number
  formatWidth: number
  formatHeight: number
}

function SafeZoneOverlay({ safeZone, containerWidth, containerHeight, formatWidth, formatHeight }: SafeZoneOverlayProps) {
  const scale = Math.min(containerWidth / formatWidth, containerHeight / formatHeight)
  
  const x = (safeZone.x / formatWidth) * 100
  const y = (safeZone.y / formatHeight) * 100
  const w = (safeZone.width / formatWidth) * 100
  const h = (safeZone.height / formatHeight) * 100
  
  return (
    <>
      {/* Overlay mimo safe zone */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top */}
        <div 
          className="absolute bg-red-500/30 border-b-2 border-dashed border-red-500"
          style={{ top: 0, left: 0, right: 0, height: `${y}%` }}
        />
        {/* Bottom */}
        <div 
          className="absolute bg-red-500/30 border-t-2 border-dashed border-red-500"
          style={{ bottom: 0, left: 0, right: 0, height: `${100 - y - h}%` }}
        />
        {/* Left */}
        <div 
          className="absolute bg-red-500/30 border-r-2 border-dashed border-red-500"
          style={{ top: `${y}%`, left: 0, width: `${x}%`, height: `${h}%` }}
        />
        {/* Right */}
        <div 
          className="absolute bg-red-500/30 border-l-2 border-dashed border-red-500"
          style={{ top: `${y}%`, right: 0, width: `${100 - x - w}%`, height: `${h}%` }}
        />
      </div>
      
      {/* Safe zone label */}
      <div 
        className="absolute bg-green-500/20 border-2 border-green-500 pointer-events-none flex items-center justify-center"
        style={{ 
          left: `${x}%`, 
          top: `${y}%`, 
          width: `${w}%`, 
          height: `${h}%` 
        }}
      >
        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
          Safe Zone ({safeZone.width}×{safeZone.height})
        </span>
      </div>
      
      {/* Warning */}
      <div className="absolute bottom-2 left-2 right-2 bg-yellow-100 border border-yellow-400 rounded-lg p-2 text-xs text-yellow-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Mrtvá zóna!</strong> {safeZone.description}
        </div>
      </div>
    </>
  )
}

// =============================================================================
// COLOR PICKER (Eyedropper)
// =============================================================================

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  imageUrl?: string | null
}

function ColorPicker({ color, onChange, imageUrl }: ColorPickerProps) {
  const [showEyedropper, setShowEyedropper] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const handleEyedropper = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')
    onChange(hex)
    setShowEyedropper(false)
  }, [onChange])
  
  useEffect(() => {
    if (showEyedropper && imageUrl && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
      }
      img.src = imageUrl
    }
  }, [showEyedropper, imageUrl])
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="w-8 h-8 rounded border cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="w-20 px-2 py-1 text-xs font-mono border rounded"
      />
      {imageUrl && (
        <button
          onClick={() => setShowEyedropper(!showEyedropper)}
          className={cn(
            'p-1.5 rounded border transition-colors',
            showEyedropper ? 'bg-blue-100 border-blue-500 text-blue-600' : 'hover:bg-gray-100'
          )}
          title="Vybrat z obrázku"
        >
          <Pipette className="w-4 h-4" />
        </button>
      )}
      
      {showEyedropper && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Klikněte na barvu</span>
              <button onClick={() => setShowEyedropper(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <canvas
              ref={canvasRef}
              onClick={handleEyedropper}
              className="max-w-full max-h-[60vh] cursor-crosshair border rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PREVIEW CHANNELS
// =============================================================================

interface PreviewChannelProps {
  channel: PreviewChannel
  imageUrl: string | null
  textLayer: TextLayer
  format: Format
}

function PreviewChannel({ channel, imageUrl, textLayer, format }: PreviewChannelProps) {
  const mockups: Record<PreviewChannel, React.ReactNode> = {
    youtube: (
      <div className="bg-white rounded-lg overflow-hidden shadow-lg" style={{ width: 280 }}>
        <div className="aspect-video bg-gray-200 relative">
          {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="" />}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
            <div className="text-white text-sm font-medium line-clamp-2">{textLayer.headline.text || 'Headline'}</div>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Brand</div>
              <div className="text-xs text-gray-500">Sponzorováno</div>
            </div>
          </div>
        </div>
      </div>
    ),
    gmail: (
      <div className="bg-white rounded-lg overflow-hidden shadow-lg" style={{ width: 280 }}>
        <div className="p-3 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">B</div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Brand</div>
            <div className="text-sm text-gray-500">Sponzorovaný</div>
          </div>
        </div>
        <div className="aspect-[1.91/1] bg-gray-200 relative">
          {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="" />}
        </div>
        <div className="p-3">
          <div className="font-medium text-gray-900 mb-1">{textLayer.headline.text || 'Headline'}</div>
          <div className="text-sm text-gray-600">{textLayer.subheadline.text || 'Subheadline'}</div>
        </div>
      </div>
    ),
    search: (
      <div className="bg-white rounded-lg p-4 shadow-lg" style={{ width: 280 }}>
        <div className="text-xs text-gray-500 mb-1">Reklama · example.com</div>
        <div className="text-blue-600 text-lg font-medium mb-1 hover:underline cursor-pointer">
          {textLayer.headline.text || 'Headline reklamy'}
        </div>
        <div className="text-sm text-gray-600">
          {textLayer.subheadline.text || 'Popis reklamy s dalšími informacemi...'}
        </div>
      </div>
    ),
    display: (
      <div className="bg-gray-100 rounded-lg p-2" style={{ width: 300, height: 250 }}>
        <div className="w-full h-full relative rounded overflow-hidden">
          {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="" />}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
            <div className="text-white text-sm font-bold">{textLayer.headline.text || 'Headline'}</div>
            <div className="text-white/80 text-xs mt-1">{textLayer.subheadline.text}</div>
            {textLayer.cta.visible && textLayer.cta.text && (
              <button 
                className="mt-2 px-3 py-1 text-xs font-bold text-white rounded-full"
                style={{ backgroundColor: textLayer.cta.backgroundColor }}
              >
                {textLayer.cta.text}
              </button>
            )}
          </div>
          <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[8px] px-1 rounded">Ad</div>
        </div>
      </div>
    ),
    discover: (
      <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ width: 280 }}>
        <div className="aspect-[4/5] bg-gray-200 relative">
          {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" alt="" />}
        </div>
        <div className="p-4">
          <div className="text-lg font-semibold text-gray-900 mb-2">{textLayer.headline.text || 'Headline'}</div>
          <div className="text-sm text-gray-600 mb-3">{textLayer.subheadline.text}</div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Sponzorováno</span>
            <span>•</span>
            <span>Brand</span>
          </div>
        </div>
      </div>
    ),
    maps: (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width: 280 }}>
        <div className="h-32 bg-green-100 relative">
          <div className="absolute inset-0 opacity-50" style={{ background: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 10px, #f3f4f6 10px, #f3f4f6 20px)' }} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg" />
          </div>
        </div>
        <div className="p-3">
          <div className="font-medium text-gray-900">{textLayer.headline.text || 'Název firmy'}</div>
          <div className="text-sm text-gray-500 mt-1">Sponzorováno</div>
          {textLayer.cta.visible && textLayer.cta.text && (
            <button 
              className="mt-2 w-full py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: textLayer.cta.backgroundColor }}
            >
              {textLayer.cta.text}
            </button>
          )}
        </div>
      </div>
    ),
  }
  
  return mockups[channel]
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormatEditorV3({ formatKey, format, sourceImage, onClose, onSave, onApplyToAll }: Props) {
  const {
    textOverlay: globalTextOverlay,
    apiKeys,
    brandKits,
    activeBrandKit,
    outpaintedImages,
    setOutpaintedImage,
    setFormatOffset,
    setPerFormatTextLayer,
  } = useAppStore()
  
  const brandKit = useMemo(() => brandKits.find(b => b.id === activeBrandKit), [brandKits, activeBrandKit])
  
  // State
  const [textLayer, setTextLayer] = useState<TextLayer>(() => {
    const defaultLayer = createDefaultTextLayer(format, brandKit)
    return {
      ...defaultLayer,
      headline: { ...defaultLayer.headline, text: globalTextOverlay.headline || '' },
      subheadline: { ...defaultLayer.subheadline, text: globalTextOverlay.subheadline || '' },
      cta: { ...defaultLayer.cta, text: globalTextOverlay.cta || '' },
    }
  })
  
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [locked, setLocked] = useState(false)
  const [selected, setSelected] = useState<SelectedElement>(null)
  const [editing, setEditing] = useState<SelectedElement>(null)
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // UI State
  const [isOutpainting, setIsOutpainting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showSafeZone, setShowSafeZone] = useState(!!format.safeZone)
  const [previewChannel, setPreviewChannel] = useState<PreviewChannel>('display')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'export'>('edit')
  const [animation, setAnimation] = useState('none')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [zoom, setZoom] = useState(1)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const outpaintedImage = outpaintedImages[formatKey] || null
  const displayImage = outpaintedImage || sourceImage
  
  // Calculate display dimensions
  const maxDisplayWidth = 600
  const maxDisplayHeight = 500
  const scale = Math.min(maxDisplayWidth / format.width, maxDisplayHeight / format.height) * zoom
  const displayW = format.width * scale
  const displayH = format.height * scale
  
  // Determine if outpainting is needed
  const needsOutpaint = useMemo(() => {
    if (!sourceImage || outpaintedImage) return false
    const img = new Image()
    img.src = sourceImage
    const srcRatio = img.width / img.height
    const tgtRatio = format.width / format.height
    return Math.abs(srcRatio - tgtRatio) > 0.2
  }, [sourceImage, outpaintedImage, format])
  
  // ==========================================================================
  // HISTORY MANAGEMENT
  // ==========================================================================
  
  const saveToHistory = useCallback(() => {
    const state: HistoryState = { textLayer: JSON.parse(JSON.stringify(textLayer)), offset: { ...offset }, locked }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(state)
      if (newHistory.length > MAX_HISTORY) newHistory.shift()
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [textLayer, offset, locked, historyIndex])
  
  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const prevState = history[historyIndex - 1]
    setTextLayer(prevState.textLayer)
    setOffset(prevState.offset)
    setLocked(prevState.locked)
    setHistoryIndex(prev => prev - 1)
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextState = history[historyIndex + 1]
    setTextLayer(nextState.textLayer)
    setOffset(nextState.offset)
    setLocked(nextState.locked)
    setHistoryIndex(prev => prev + 1)
  }, [history, historyIndex])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo() }
        if (e.key === 'y') { e.preventDefault(); redo() }
        if (e.key === 's') { e.preventDefault(); handleSave() }
      }
      
      if (selected) {
        const step = e.shiftKey ? 5 : 1
        if (e.key === 'ArrowUp') { e.preventDefault(); moveElement(selected, 0, -step) }
        if (e.key === 'ArrowDown') { e.preventDefault(); moveElement(selected, 0, step) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); moveElement(selected, -step, 0) }
        if (e.key === 'ArrowRight') { e.preventDefault(); moveElement(selected, step, 0) }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); toggleVisibility(selected) }
        if (e.key === '+' || e.key === '=') { e.preventDefault(); resizeElement(selected, 2) }
        if (e.key === '-') { e.preventDefault(); resizeElement(selected, -2) }
      }
      
      if (e.key === 'Escape') {
        setSelected(null)
        setEditing(null)
      }
      if (e.key === 'g') setShowGrid(prev => !prev)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, undo, redo])
  
  // ==========================================================================
  // UPDATE FUNCTIONS
  // ==========================================================================
  
  const updateText = useCallback((
    element: 'headline' | 'subheadline' | 'cta',
    updates: Partial<TextElement | CTAElement>
  ) => {
    setTextLayer(prev => ({
      ...prev,
      [element]: { ...prev[element], ...updates }
    }))
  }, [])
  
  const updateLogo = useCallback((updates: Partial<LogoElement>) => {
    setTextLayer(prev => ({
      ...prev,
      logo: { ...prev.logo, ...updates }
    }))
  }, [])
  
  const updateGradient = useCallback((updates: Partial<GradientOverlay>) => {
    setTextLayer(prev => ({
      ...prev,
      gradient: { ...prev.gradient, ...updates }
    }))
  }, [])
  
  const moveElement = useCallback((element: SelectedElement, dx: number, dy: number) => {
    if (!element) return
    if (element === 'logo') {
      setTextLayer(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          x: Math.max(2, Math.min(98, prev.logo.x + dx)),
          y: Math.max(2, Math.min(98, prev.logo.y + dy)),
        }
      }))
    } else {
      setTextLayer(prev => ({
        ...prev,
        [element]: {
          ...prev[element],
          x: Math.max(2, Math.min(98, prev[element].x + dx)),
          y: Math.max(2, Math.min(98, prev[element].y + dy)),
        }
      }))
    }
  }, [])
  
  const resizeElement = useCallback((element: SelectedElement, delta: number) => {
    if (!element || element === 'logo') return
    setTextLayer(prev => ({
      ...prev,
      [element]: {
        ...prev[element],
        fontSize: Math.max(8, Math.min(100, prev[element].fontSize + delta)),
      }
    }))
  }, [])
  
  const toggleVisibility = useCallback((element: SelectedElement) => {
    if (!element) return
    if (element === 'logo') {
      setTextLayer(prev => ({ ...prev, logo: { ...prev.logo, visible: !prev.logo.visible } }))
    } else {
      setTextLayer(prev => ({ ...prev, [element]: { ...prev[element], visible: !prev[element].visible } }))
    }
  }, [])
  
  // ==========================================================================
  // LAYOUT PRESETS
  // ==========================================================================
  
  const applyLayoutPreset = useCallback((presetId: string) => {
    const ratio = format.width / format.height
    const isWide = ratio > 2
    const isTall = ratio < 0.7
    
    const presets: Record<string, Partial<TextLayer>> = {
      'bottom-left': {
        headline: { ...textLayer.headline, x: isWide ? 5 : 15, y: isTall ? 70 : 60, textAlign: 'left' as const },
        subheadline: { ...textLayer.subheadline, x: isWide ? 5 : 15, y: isTall ? 80 : 72, textAlign: 'left' as const },
        cta: { ...textLayer.cta, x: isWide ? 5 : 15, y: isTall ? 90 : 85, textAlign: 'left' as const },
      },
      'bottom-center': {
        headline: { ...textLayer.headline, x: 50, y: isTall ? 70 : 60, textAlign: 'center' as const },
        subheadline: { ...textLayer.subheadline, x: 50, y: isTall ? 80 : 72, textAlign: 'center' as const },
        cta: { ...textLayer.cta, x: 50, y: isTall ? 90 : 85, textAlign: 'center' as const },
      },
      'bottom-right': {
        headline: { ...textLayer.headline, x: isWide ? 95 : 85, y: isTall ? 70 : 60, textAlign: 'right' as const },
        subheadline: { ...textLayer.subheadline, x: isWide ? 95 : 85, y: isTall ? 80 : 72, textAlign: 'right' as const },
        cta: { ...textLayer.cta, x: isWide ? 95 : 85, y: isTall ? 90 : 85, textAlign: 'right' as const },
      },
      'center': {
        headline: { ...textLayer.headline, x: 50, y: 40, textAlign: 'center' as const },
        subheadline: { ...textLayer.subheadline, x: 50, y: 55, textAlign: 'center' as const },
        cta: { ...textLayer.cta, x: 50, y: 72, textAlign: 'center' as const },
      },
      'top-left': {
        headline: { ...textLayer.headline, x: 15, y: 20, textAlign: 'left' as const },
        subheadline: { ...textLayer.subheadline, x: 15, y: 32, textAlign: 'left' as const },
        cta: { ...textLayer.cta, x: 15, y: 45, textAlign: 'left' as const },
      },
      'top-center': {
        headline: { ...textLayer.headline, x: 50, y: 20, textAlign: 'center' as const },
        subheadline: { ...textLayer.subheadline, x: 50, y: 32, textAlign: 'center' as const },
        cta: { ...textLayer.cta, x: 50, y: 45, textAlign: 'center' as const },
      },
      'left-stack': {
        headline: { ...textLayer.headline, x: 8, y: 35, textAlign: 'left' as const },
        subheadline: { ...textLayer.subheadline, x: 8, y: 50, textAlign: 'left' as const },
        cta: { ...textLayer.cta, x: 8, y: 68, textAlign: 'left' as const },
      },
      'right-stack': {
        headline: { ...textLayer.headline, x: 92, y: 35, textAlign: 'right' as const },
        subheadline: { ...textLayer.subheadline, x: 92, y: 50, textAlign: 'right' as const },
        cta: { ...textLayer.cta, x: 92, y: 68, textAlign: 'right' as const },
      },
    }
    
    const preset = presets[presetId]
    if (preset) {
      saveToHistory()
      setTextLayer(prev => ({ ...prev, ...preset }))
    }
  }, [format, textLayer, saveToHistory])
  
  // ==========================================================================
  // OUTPAINTING
  // ==========================================================================
  
  const handleOutpaint = useCallback(async () => {
    if (!sourceImage) return
    
    setIsOutpainting(true)
    try {
      const result = await outpaintWithOffset({
        sourceImage,
        apiKey: apiKeys.openai,
        targetWidth: format.width,
        targetHeight: format.height,
        offsetX: offset.x,
        offsetY: offset.y,
      })
      
      if (result.success && result.image) {
        setOutpaintedImage(formatKey, result.image)
        setLocked(true)
        toast.success(result.usedFallback ? 'Pozadí rozmazáno (blur)' : 'Pozadí dopočítáno AI')
      } else {
        toast.error('Nepodařilo se dopočítat', { description: result.error })
      }
    } catch (err: any) {
      toast.error('Chyba outpaintingu', { description: err.message })
    } finally {
      setIsOutpainting(false)
    }
  }, [sourceImage, apiKeys.openai, format, offset, formatKey, setOutpaintedImage])
  
  // ==========================================================================
  // RENDER TO CANVAS
  // ==========================================================================
  
  const renderToCanvas = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current
    if (!canvas || !displayImage) return ''
    
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')!
    
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, format.width, format.height)
    
    // Image
    await new Promise<void>(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (outpaintedImage) {
          ctx.drawImage(img, 0, 0, format.width, format.height)
        } else {
          const srcRatio = img.width / img.height
          const tgtRatio = format.width / format.height
          let dw, dh, dx, dy
          if (srcRatio > tgtRatio) {
            dh = format.height
            dw = dh * srcRatio
            dx = (format.width - dw) / 2 + (offset.x / 100) * dw
            dy = (offset.y / 100) * dh
          } else {
            dw = format.width
            dh = dw / srcRatio
            dx = (offset.x / 100) * dw
            dy = (format.height - dh) / 2 + (offset.y / 100) * dh
          }
          ctx.drawImage(img, dx, dy, dw, dh)
        }
        resolve()
      }
      img.onerror = () => resolve()
      img.src = displayImage
    })
    
    // Gradient overlay
    if (textLayer.gradient.enabled) {
      const grad = ctx.createLinearGradient(
        textLayer.gradient.direction === 'to-right' ? 0 : textLayer.gradient.direction === 'to-left' ? format.width : format.width / 2,
        textLayer.gradient.direction === 'to-bottom' ? 0 : textLayer.gradient.direction === 'to-top' ? format.height : format.height / 2,
        textLayer.gradient.direction === 'to-right' ? format.width : textLayer.gradient.direction === 'to-left' ? 0 : format.width / 2,
        textLayer.gradient.direction === 'to-bottom' ? format.height : textLayer.gradient.direction === 'to-top' ? 0 : format.height / 2
      )
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, textLayer.gradient.color)
      ctx.globalAlpha = textLayer.gradient.opacity
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, format.width, format.height)
      ctx.globalAlpha = 1
    }
    
    // Text elements
    const drawTextElement = (el: TextElement, isCTA = false) => {
      if (!el.visible || !el.text) return
      
      const x = (el.x / 100) * format.width
      const y = (el.y / 100) * format.height
      
      ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
      ctx.textAlign = el.textAlign
      ctx.textBaseline = 'middle'
      
      if (el.shadow) {
        ctx.shadowColor = el.shadowColor
        ctx.shadowBlur = el.shadowBlur
        ctx.shadowOffsetY = 2
      }
      
      if (isCTA) {
        const cta = el as CTAElement
        const tw = ctx.measureText(el.text).width
        const bw = tw + cta.paddingX * 2
        const bh = el.fontSize + cta.paddingY * 2
        let bx = x
        if (el.textAlign === 'center') bx = x - bw / 2
        else if (el.textAlign === 'right') bx = x - bw
        
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = cta.backgroundColor
        ctx.beginPath()
        ctx.roundRect(bx, y - bh / 2, bw, bh, cta.borderRadius)
        ctx.fill()
        
        if (cta.borderWidth > 0) {
          ctx.strokeStyle = cta.borderColor
          ctx.lineWidth = cta.borderWidth
          ctx.stroke()
        }
      }
      
      ctx.fillStyle = el.color
      ctx.fillText(el.text, x, y)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
    
    // Sort by z-index
    const elements = [
      { el: textLayer.headline, type: 'headline', zIndex: textLayer.headline.zIndex },
      { el: textLayer.subheadline, type: 'subheadline', zIndex: textLayer.subheadline.zIndex },
      { el: textLayer.cta, type: 'cta', zIndex: textLayer.cta.zIndex },
    ].sort((a, b) => a.zIndex - b.zIndex)
    
    elements.forEach(({ el, type }) => drawTextElement(el, type === 'cta'))
    
    // Logo
    if (textLayer.logo.visible && brandKit?.logoMain) {
      await new Promise<void>(resolve => {
        const logo = new Image()
        logo.crossOrigin = 'anonymous'
        logo.onload = () => {
          const w = (textLayer.logo.width / 100) * format.width
          const h = w * (logo.height / logo.width)
          const lx = (textLayer.logo.x / 100) * format.width - w / 2
          const ly = (textLayer.logo.y / 100) * format.height - h / 2
          ctx.globalAlpha = textLayer.logo.opacity
          ctx.drawImage(logo, lx, ly, w, h)
          ctx.globalAlpha = 1
          resolve()
        }
        logo.onerror = () => resolve()
        logo.src = textLayer.logo.variant === 'light' && brandKit.logoLight ? brandKit.logoLight : 
                   textLayer.logo.variant === 'dark' && brandKit.logoDark ? brandKit.logoDark :
                   brandKit.logoMain
      })
    }
    
    return canvas.toDataURL('image/png')
  }, [displayImage, outpaintedImage, format, offset, textLayer, brandKit])
  
  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  
  const validateOutput = useCallback(async () => {
    const dataUrl = await renderToCanvas()
    if (!dataUrl) return
    
    // Get format limits from category (simplified - should come from format-presets.ts)
    const maxSizeKB = format.safeZone ? 500 : 150  // Branding = 500kB, bannery = 150kB
    const allowedTypes = ['jpg', 'jpeg', 'png']
    
    const result = validateFormat(dataUrl, maxSizeKB, allowedTypes)
    setValidation(result)
    
    return result
  }, [renderToCanvas, format])
  
  // ==========================================================================
  // SAVE & EXPORT
  // ==========================================================================
  
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      let rendered = await renderToCanvas()
      if (!rendered) throw new Error('Render failed')
      
      // Validate
      const validationResult = await validateOutput()
      
      // Auto-compress if needed
      if (validationResult && !validationResult.valid) {
        const maxSizeKB = format.safeZone ? 500 : 150
        rendered = await compressImage(rendered, maxSizeKB)
        toast.info('Obrázek byl automaticky komprimován')
      }
      
      // Save to store
      setFormatOffset(formatKey, offset)
      setPerFormatTextLayer(formatKey, textLayer)
      
      // Callback
      onSave?.({
        formatKey,
        imageUrl: rendered,
        textLayer,
        format,
      })
      
      toast.success('Formát uložen')
      saveToHistory()
    } catch (err: any) {
      toast.error('Nepodařilo se uložit', { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }, [renderToCanvas, validateOutput, formatKey, offset, textLayer, format, setFormatOffset, setPerFormatTextLayer, onSave, saveToHistory])
  
  const handleExportHTML5 = useCallback(async () => {
    const imageUrl = await renderToCanvas()
    if (!imageUrl) return
    
    const html = generateHTML5Banner(imageUrl, textLayer, format, animation)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `banner-${format.width}x${format.height}.html`
    a.click()
    
    URL.revokeObjectURL(url)
    toast.success('HTML5 banner stažen')
  }, [renderToCanvas, textLayer, format, animation])
  
  const handleApplyToAll = useCallback(() => {
    onApplyToAll?.(textLayer)
    toast.success('Nastavení aplikováno na všechny formáty')
  }, [textLayer, onApplyToAll])
  
  const handleReset = useCallback(() => {
    saveToHistory()
    setTextLayer(createDefaultTextLayer(format, brandKit))
    setOffset({ x: 0, y: 0 })
    setLocked(false)
  }, [format, brandKit, saveToHistory])
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                {format.width}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{format.name || `${format.width}×${format.height}`}</h2>
                <p className="text-sm text-gray-500">{format.width} × {format.height} px</p>
              </div>
            </div>
            
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 ml-4 border-l pl-4">
              <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} title="Zpět (Ctrl+Z)">
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Vpřed (Ctrl+Y)">
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* View toggles */}
            <div className="flex items-center gap-1 ml-4 border-l pl-4">
              <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)} className={showGrid ? 'bg-blue-100 text-blue-600' : ''} title="Mřížka (G)">
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSnapEnabled(!snapEnabled)} className={snapEnabled ? 'bg-blue-100 text-blue-600' : ''} title="Přichytávání">
                <Move className="w-4 h-4" />
              </Button>
              {format.safeZone && (
                <Button variant="ghost" size="sm" onClick={() => setShowSafeZone(!showSafeZone)} className={showSafeZone ? 'bg-red-100 text-red-600' : ''} title="Safe Zone">
                  <AlertTriangle className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Zoom */}
            <div className="flex items-center gap-1 ml-4 border-l pl-4">
              <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} disabled={zoom <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))} disabled={zoom >= 2}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'edit' as const, label: 'Upravit', icon: Type },
            { id: 'preview' as const, label: 'Náhled', icon: Eye },
            { id: 'export' as const, label: 'Export', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Area */}
          <div className="flex-1 p-6 overflow-auto bg-gray-100">
            
            {activeTab === 'edit' && (
              <div className="flex flex-col items-center gap-4">
                
                {/* Canvas Container */}
                <div
                  ref={containerRef}
                  className="relative bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{ width: displayW, height: displayH }}
                  onClick={() => setSelected(null)}
                >
                  {/* Background Image */}
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nahrajte obrázek</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  {textLayer.gradient.enabled && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(${textLayer.gradient.direction}, transparent 0%, ${textLayer.gradient.color} 100%)`,
                        opacity: textLayer.gradient.opacity,
                      }}
                    />
                  )}
                  
                  {/* Grid */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none" style={{
                      backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
                      backgroundSize: `${GRID_SIZE}% ${GRID_SIZE}%`,
                    }} />
                  )}
                  
                  {/* Safe Zone */}
                  {showSafeZone && format.safeZone && (
                    <SafeZoneOverlay
                      safeZone={format.safeZone}
                      containerWidth={displayW}
                      containerHeight={displayH}
                      formatWidth={format.width}
                      formatHeight={format.height}
                    />
                  )}
                  
                  {/* Text Elements */}
                  {textLayer.headline.visible && (
                    <Draggable
                      x={textLayer.headline.x}
                      y={textLayer.headline.y}
                      onMove={(x, y) => updateText('headline', { x, y })}
                      onMoveEnd={saveToHistory}
                      isSelected={selected === 'headline'}
                      onSelect={() => setSelected('headline')}
                      snapEnabled={snapEnabled}
                      label="Headline"
                      color="blue"
                    >
                      {editing === 'headline' ? (
                        <input
                          autoFocus
                          value={textLayer.headline.text}
                          onChange={e => updateText('headline', { text: e.target.value })}
                          onBlur={() => { setEditing(null); saveToHistory() }}
                          onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                          className="px-2 py-1 border-2 border-blue-500 rounded bg-white/90 text-black"
                          style={{ fontSize: Math.max(12, textLayer.headline.fontSize * scale * 0.8), width: 'auto', minWidth: 100 }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditing('headline')}
                          style={{
                            fontSize: textLayer.headline.fontSize * scale,
                            fontWeight: textLayer.headline.fontWeight,
                            fontFamily: textLayer.headline.fontFamily,
                            color: textLayer.headline.color,
                            textShadow: textLayer.headline.shadow ? `0 2px 4px ${textLayer.headline.shadowColor}` : 'none',
                            textAlign: textLayer.headline.textAlign,
                            letterSpacing: textLayer.headline.letterSpacing,
                          }}
                        >
                          {textLayer.headline.text || '[Headline]'}
                        </div>
                      )}
                    </Draggable>
                  )}
                  
                  {textLayer.subheadline.visible && (
                    <Draggable
                      x={textLayer.subheadline.x}
                      y={textLayer.subheadline.y}
                      onMove={(x, y) => updateText('subheadline', { x, y })}
                      onMoveEnd={saveToHistory}
                      isSelected={selected === 'subheadline'}
                      onSelect={() => setSelected('subheadline')}
                      snapEnabled={snapEnabled}
                      label="Subheadline"
                      color="green"
                    >
                      {editing === 'subheadline' ? (
                        <input
                          autoFocus
                          value={textLayer.subheadline.text}
                          onChange={e => updateText('subheadline', { text: e.target.value })}
                          onBlur={() => { setEditing(null); saveToHistory() }}
                          onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                          className="px-2 py-1 border-2 border-green-500 rounded bg-white/90 text-black"
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditing('subheadline')}
                          style={{
                            fontSize: textLayer.subheadline.fontSize * scale,
                            fontWeight: textLayer.subheadline.fontWeight,
                            fontFamily: textLayer.subheadline.fontFamily,
                            color: textLayer.subheadline.color,
                            textShadow: textLayer.subheadline.shadow ? `0 2px 4px ${textLayer.subheadline.shadowColor}` : 'none',
                          }}
                        >
                          {textLayer.subheadline.text || '[Subheadline]'}
                        </div>
                      )}
                    </Draggable>
                  )}
                  
                  {textLayer.cta.visible && (
                    <Draggable
                      x={textLayer.cta.x}
                      y={textLayer.cta.y}
                      onMove={(x, y) => updateText('cta', { x, y })}
                      onMoveEnd={saveToHistory}
                      isSelected={selected === 'cta'}
                      onSelect={() => setSelected('cta')}
                      snapEnabled={snapEnabled}
                      label="CTA"
                      color="orange"
                    >
                      {editing === 'cta' ? (
                        <input
                          autoFocus
                          value={textLayer.cta.text}
                          onChange={e => updateText('cta', { text: e.target.value })}
                          onBlur={() => { setEditing(null); saveToHistory() }}
                          onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                          className="px-2 py-1 border-2 border-orange-500 rounded bg-white/90 text-black"
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditing('cta')}
                          style={{
                            fontSize: textLayer.cta.fontSize * scale,
                            fontWeight: textLayer.cta.fontWeight,
                            fontFamily: textLayer.cta.fontFamily,
                            color: textLayer.cta.color,
                            backgroundColor: textLayer.cta.backgroundColor,
                            padding: `${textLayer.cta.paddingY * scale}px ${textLayer.cta.paddingX * scale}px`,
                            borderRadius: textLayer.cta.borderRadius,
                          }}
                        >
                          {textLayer.cta.text || '[CTA]'}
                        </div>
                      )}
                    </Draggable>
                  )}
                  
                  {textLayer.logo.visible && brandKit?.logoMain && (
                    <Draggable
                      x={textLayer.logo.x}
                      y={textLayer.logo.y}
                      onMove={(x, y) => updateLogo({ x, y })}
                      onMoveEnd={saveToHistory}
                      isSelected={selected === 'logo'}
                      onSelect={() => setSelected('logo')}
                      snapEnabled={snapEnabled}
                      label="Logo"
                      color="purple"
                    >
                      <img
                        src={brandKit.logoMain}
                        alt="Logo"
                        style={{ 
                          width: (textLayer.logo.width / 100) * displayW, 
                          opacity: textLayer.logo.opacity 
                        }}
                        draggable={false}
                      />
                    </Draggable>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {needsOutpaint && !outpaintedImage && (
                    <>
                      {!locked ? (
                        <Button onClick={() => setLocked(true)} className="bg-green-600 hover:bg-green-700">
                          <Anchor className="w-4 h-4 mr-2" />
                          Ukotvit pozici
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setLocked(false)}>
                          <Unlock className="w-4 h-4 mr-2" />
                          Odemknout
                        </Button>
                      )}
                      
                      {locked && (
                        <Button onClick={handleOutpaint} disabled={isOutpainting} className="bg-gradient-to-r from-purple-500 to-pink-500">
                          {isOutpainting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          Dopočítat pozadí
                          {apiKeys.openai && <CostBadge cost={calculateCost('outpaint', { quality: 'medium' })} />}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {validation && (
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                      validation.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {validation.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {validation.fileSize} / {validation.maxSize} kB
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  {(['youtube', 'gmail', 'search', 'display', 'discover', 'maps'] as PreviewChannel[]).map(ch => (
                    <button
                      key={ch}
                      onClick={() => setPreviewChannel(ch)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        previewChannel === ch ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-gray-50'
                      )}
                    >
                      {ch === 'youtube' && <Youtube className="w-4 h-4" />}
                      {ch === 'gmail' && <Mail className="w-4 h-4" />}
                      {ch === 'search' && <Search className="w-4 h-4" />}
                      {ch === 'display' && <LayoutGrid className="w-4 h-4" />}
                      {ch === 'discover' && <Sparkles className="w-4 h-4" />}
                      {ch === 'maps' && <Map className="w-4 h-4" />}
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <PreviewChannel
                    channel={previewChannel}
                    imageUrl={displayImage}
                    textLayer={textLayer}
                    format={format}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'export' && (
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-lg">Export obrázku</h3>
                  
                  <Button onClick={validateOutput} variant="outline" className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Zkontrolovat validaci
                  </Button>
                  
                  {validation && (
                    <div className={cn(
                      'p-4 rounded-lg',
                      validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        {validation.valid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {validation.valid ? 'Formát je v pořádku' : 'Nalezeny problémy'}
                        </span>
                      </div>
                      {validation.errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-600">❌ {err}</p>
                      ))}
                      {validation.warnings.map((warn, i) => (
                        <p key={i} className="text-sm text-yellow-600">⚠️ {warn}</p>
                      ))}
                    </div>
                  )}
                  
                  <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-orange-500 to-amber-500">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Uložit PNG
                  </Button>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-lg">HTML5 Banner</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Animace</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ANIMATION_PRESETS.map(anim => (
                        <button
                          key={anim.id}
                          onClick={() => setAnimation(anim.id)}
                          className={cn(
                            'p-2 rounded-lg border text-center text-sm',
                            animation === anim.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          )}
                        >
                          <span className="text-lg">{anim.icon}</span>
                          <div className="text-xs mt-1">{anim.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleExportHTML5} variant="outline" className="w-full">
                    <FileCode className="w-4 h-4 mr-2" />
                    Stáhnout HTML5
                  </Button>
                </div>
                
                {onApplyToAll && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Batch operace</h3>
                    <Button onClick={handleApplyToAll} variant="outline" className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Aplikovat na všechny formáty
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          {activeTab === 'edit' && (
            <div className="w-80 border-l bg-white overflow-y-auto">
              <div className="p-4 space-y-5">
                
                {/* Layout Presets */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Layout preset
                  </h3>
                  <div className="grid grid-cols-4 gap-1">
                    {LAYOUT_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyLayoutPreset(preset.id)}
                        className="p-2 bg-gray-50 border rounded hover:bg-gray-100 text-center"
                        title={preset.label}
                      >
                        <span className="text-lg">{preset.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Layers */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vrstvy</h3>
                  <div className="space-y-1">
                    {(['headline', 'subheadline', 'cta', 'logo'] as const).map(layer => {
                      const isVisible = layer === 'logo' ? textLayer.logo.visible : textLayer[layer].visible
                      const colors = { headline: 'blue', subheadline: 'green', cta: 'orange', logo: 'purple' }
                      return (
                        <div
                          key={layer}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                            selected === layer ? `bg-${colors[layer]}-50 border border-${colors[layer]}-200` : 'hover:bg-gray-50'
                          )}
                          onClick={() => setSelected(layer)}
                        >
                          <span className="text-sm font-medium capitalize">{layer}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(layer) }}
                            className={cn('p-1 rounded', isVisible ? 'text-gray-700' : 'text-gray-300')}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Selected Element Controls */}
                {selected && selected !== 'logo' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-700">Nastavení: {selected}</h3>
                    
                    {/* Font Size */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-600">Velikost</label>
                        <span className="text-xs font-mono">{textLayer[selected].fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="100"
                        value={textLayer[selected].fontSize}
                        onChange={e => updateText(selected, { fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Font Family */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Font</label>
                      <select
                        value={textLayer[selected].fontFamily}
                        onChange={e => updateText(selected, { fontFamily: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        {FONT_OPTIONS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Color */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Barva textu</label>
                      <ColorPicker
                        color={textLayer[selected].color}
                        onChange={color => updateText(selected, { color })}
                        imageUrl={displayImage}
                      />
                    </div>
                    
                    {/* Alignment */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Zarovnání</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => updateText(selected, { textAlign: align })}
                            className={cn(
                              'flex-1 p-2 rounded border',
                              textLayer[selected].textAlign === align ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                            )}
                          >
                            {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                            {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                            {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* CTA specific */}
                    {selected === 'cta' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Barva pozadí</label>
                          <ColorPicker
                            color={textLayer.cta.backgroundColor}
                            onChange={color => updateText('cta', { backgroundColor: color })}
                            imageUrl={displayImage}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-xs text-gray-600">Zaoblení</label>
                            <span className="text-xs font-mono">{textLayer.cta.borderRadius}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={textLayer.cta.borderRadius}
                            onChange={e => updateText('cta', { borderRadius: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Logo Controls */}
                {selected === 'logo' && brandKit?.logoMain && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-700">Nastavení: Logo</h3>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-600">Velikost</label>
                        <span className="text-xs font-mono">{textLayer.logo.width}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        value={textLayer.logo.width}
                        onChange={e => updateLogo({ width: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-600">Průhlednost</label>
                        <span className="text-xs font-mono">{Math.round(textLayer.logo.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={textLayer.logo.opacity}
                        onChange={e => updateLogo({ opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                
                {/* Gradient */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Gradient overlay</h3>
                    <button
                      onClick={() => updateGradient({ enabled: !textLayer.gradient.enabled })}
                      className={cn('p-1 rounded', textLayer.gradient.enabled ? 'text-blue-600' : 'text-gray-400')}
                    >
                      {textLayer.gradient.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {textLayer.gradient.enabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Směr</label>
                        <select
                          value={textLayer.gradient.direction}
                          onChange={e => updateGradient({ direction: e.target.value as any })}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="to-top">Zdola nahoru</option>
                          <option value="to-bottom">Shora dolů</option>
                          <option value="to-left">Zprava doleva</option>
                          <option value="to-right">Zleva doprava</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Barva</label>
                        <ColorPicker
                          color={textLayer.gradient.color}
                          onChange={color => updateGradient({ color })}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs text-gray-600">Průhlednost</label>
                          <span className="text-xs font-mono">{Math.round(textLayer.gradient.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={textLayer.gradient.opacity}
                          onChange={e => updateGradient({ opacity: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Keyboard Shortcuts */}
                <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                  <p><kbd className="bg-gray-100 px-1 rounded">Ctrl+Z</kbd> Zpět</p>
                  <p><kbd className="bg-gray-100 px-1 rounded">Ctrl+Y</kbd> Vpřed</p>
                  <p><kbd className="bg-gray-100 px-1 rounded">Šipky</kbd> Posun</p>
                  <p><kbd className="bg-gray-100 px-1 rounded">+/-</kbd> Velikost</p>
                  <p><kbd className="bg-gray-100 px-1 rounded">G</kbd> Mřížka</p>
                  <p><kbd className="bg-gray-100 px-1 rounded">Delete</kbd> Skrýt</p>
                </div>
                
                {/* Actions */}
                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" onClick={handleReset} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Uložit formát
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default FormatEditorV3
