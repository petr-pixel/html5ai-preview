import { cn } from '@/lib/utils'
import type { Format, TextOverlay } from '@/types'
import { Check, Video, AlertTriangle } from 'lucide-react'
import { SafeZoneOverlayCompact } from './SafeZoneOverlay'

export interface FormatCardProps {
  key?: number | string
  format: Format
  isSelected: boolean
  onClick: () => void
  sourceImage: string | null
  textOverlay?: TextOverlay
  maxSizeKB?: number
  fileTypes?: string[]
}

export function FormatCard({
  format,
  isSelected,
  onClick,
  sourceImage,
  textOverlay,
  maxSizeKB,
  fileTypes,
}: FormatCardProps) {
  const aspectRatio = format.width / format.height
  const height = Math.min(120, 200 / aspectRatio)
  const hasSafeZone = !!format.safeZone

  return (
    <div
      onClick={onClick}
      className={cn(
        'format-card group',
        isSelected && 'selected'
      )}
    >
      {/* Preview */}
      <div
        className="relative bg-background flex items-center justify-center overflow-hidden"
        style={{ height }}
      >
        {sourceImage ? (
          <img
            src={sourceImage}
            alt={format.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground font-mono text-xs">
            {format.width}×{format.height}
          </div>
        )}

        {/* Safe Zone Overlay */}
        {hasSafeZone && <SafeZoneOverlayCompact format={format} />}

        {/* Text overlay preview */}
        {sourceImage && textOverlay?.enabled && textOverlay?.headline && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="text-white text-xs font-semibold drop-shadow-lg truncate">
              {textOverlay.headline}
            </div>
          </div>
        )}

        {/* Video badge */}
        {format.isVideo && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-xs flex items-center gap-1">
            <Video className="w-3 h-3" />
          </div>
        )}

        {/* Safe Zone badge */}
        {hasSafeZone && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/80 backdrop-blur-sm rounded-md text-xs flex items-center gap-1 text-white">
            <AlertTriangle className="w-3 h-3" />
            Safe Zone
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-0.5">
        <div className="font-medium text-sm truncate">{format.name}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {format.width} × {format.height}
        </div>
        {format.ratio && (
          <div className="text-xs text-muted-foreground">{format.ratio}</div>
        )}
        {(maxSizeKB || fileTypes)?.toString() && (
          <div className="text-[10px] text-muted-foreground">
            {maxSizeKB && <span>≤{maxSizeKB} kB</span>}
            {maxSizeKB && fileTypes && fileTypes.length > 0 && <span> • </span>}
            {fileTypes && fileTypes.length > 0 && <span>{fileTypes.join(' / ')}</span>}
          </div>
        )}
        {format.notes && (
          <div className="text-[10px] text-muted-foreground italic">{format.notes}</div>
        )}
      </div>
    </div>
  )
}
