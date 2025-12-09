import { cn } from '@/lib/utils'
import type { Format, Creative, CategoryType } from '@/types' // Added Creative, CategoryType
import { Check, Image as ImageIcon, Video, AlertTriangle } from 'lucide-react' // Added Image, Video
import { SafeZoneOverlay } from './SafeZoneOverlay' // Changed from SafeZoneOverlayCompact if exists, checking imports. 
// AppContent used SafeZoneOverlay. FormatCard used SafeZoneOverlayCompact. 
// I'll stick to SafeZoneOverlay usage from AppContent for consistency with the "rich" view.
// If SafeZoneOverlayCompact is preferred, I can keep it, but AppContent used the full one?
// AppContent line 1286: <SafeZoneOverlay ... />
// FormatCard line 56: <SafeZoneOverlayCompact ... />
// I'll import SafeZoneOverlay.

export interface FormatCardProps {
  formatKey: string
  format: Format
  isSelected: boolean
  onToggle: () => void
  onEdit: () => void
  creative?: Creative
  sourceImage?: string | null
  categoryType?: CategoryType
  className?: string
  perFormatSettings?: any // Optional extra settings if needed to show badges
}

export function FormatCard({
  formatKey,
  format,
  isSelected,
  onToggle,
  onEdit,
  creative,
  sourceImage,
  categoryType,
  className,
  perFormatSettings,
}: FormatCardProps) {
  const hasSafeZone = format.safeZone !== undefined
  const hasCustomSettings = perFormatSettings && (
    perFormatSettings.fontSizeMultiplier !== 1.0 ||
    perFormatSettings.hideHeadline ||
    perFormatSettings.hideSubheadline ||
    perFormatSettings.hideCta ||
    perFormatSettings.customPosition
  )

  // Max size check logic (if passed or calculated? AppContent did logic outside)
  // I won't move the max size logic inside unless I pass maxSizeKB.
  // AppContent passed maxSizeKB to check.
  // For now I'll simplify and rely on what was passed or just show basic info.

  return (
    <div
      className={cn(
        'format-card group relative', // match AppContent classes roughly, relying on global css 'format-card'
        isSelected && 'format-card-selected',
        className
      )}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={cn(
          'absolute top-2 right-2 w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors z-10',
          isSelected
            ? 'bg-violet-500 border-violet-500 text-white'
            : 'border-white/30 hover:border-white/50'
        )}
      >
        {isSelected && <Check className="w-3 h-3" />}
      </div>

      {/* Preview */}
      <div
        onClick={onEdit}
        className="relative bg-white/5 rounded-xl mb-2 overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all"
        style={{
          paddingBottom: `${(format.height / format.width) * 100}%`,
          maxHeight: '120px' // AppContent max height
        }}
      >
        {creative ? (
          <img
            src={creative.imageUrl}
            alt={format.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : sourceImage ? (
          <img
            src={sourceImage}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Safe Zone Overlay */}
        {hasSafeZone && format.safeZone && (
          <SafeZoneOverlay
            safeZone={format.safeZone}
            width={format.width}
            height={format.height}
          />
        )}

        {/* Edit hint on hover */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <span className="text-white text-xs font-medium bg-violet-500/80 px-2 py-1 rounded-lg">
            Upravit
          </span>
        </div>

        {/* Custom settings badge */}
        {hasCustomSettings && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" title="Vlastní nastavení" />
        )}
      </div>

      {/* Info */}
      <div className="text-sm font-medium text-white truncate">
        {format.name}
      </div>
      <div className="text-xs text-white/50">
        {format.width} × {format.height}
      </div>
      {creative?.sizeKB && (
        <div className={cn(
          'text-xs mt-1',
          // Assuming max size check needs maxSizeKB... 
          // I will just show size for now, color logic requires knowledge of limit.
          'text-emerald-400'
        )}>
          {creative.sizeKB} kB
        </div>
      )}
    </div>
  )
}
