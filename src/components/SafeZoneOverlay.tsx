/**
 * SafeZoneOverlay - Vizualizace ochranných zón pro formáty jako Branding a Interscroller
 * 
 * Zobrazuje červenou "danger zone" kde nesmí být text a zelenou "safe zone" pro obsah.
 */

import { useMemo } from 'react'
import type { Format } from '@/types'
import { AlertTriangle, Check } from 'lucide-react'

interface SafeZoneOverlayProps {
  format: Format
  showLabels?: boolean
  className?: string
}

export function SafeZoneOverlay({ format, showLabels = true, className = '' }: SafeZoneOverlayProps) {
  const styles = useMemo(() => {
    if (!format.safeZone) return null

    const { safeZone } = format
    const { width, height } = format

    // Procenta pro CSS
    const topPct = (safeZone.top / height) * 100
    const bottomPct = (safeZone.bottom / height) * 100
    const leftPct = (safeZone.left / width) * 100
    const rightPct = (safeZone.right / width) * 100

    return { topPct, bottomPct, leftPct, rightPct }
  }, [format])

  if (!styles) return null

  const { topPct, bottomPct, leftPct, rightPct } = styles

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Top danger zone */}
      {topPct > 0 && (
        <div
          className="absolute left-0 right-0 top-0 bg-red-500/30"
          style={{ height: `${topPct}%` }}
        >
          {showLabels && topPct > 15 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-red-700 text-xs font-medium bg-red-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Pouze pozadí
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom danger zone */}
      {bottomPct > 0 && (
        <div
          className="absolute left-0 right-0 bottom-0 bg-red-500/30"
          style={{ height: `${bottomPct}%` }}
        >
          {showLabels && bottomPct > 15 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-red-700 text-xs font-medium bg-red-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Pouze pozadí
              </span>
            </div>
          )}
        </div>
      )}

      {/* Left danger zone */}
      {leftPct > 0 && (
        <div
          className="absolute left-0 bg-red-500/30"
          style={{ 
            top: `${topPct}%`, 
            width: `${leftPct}%`,
            height: `${100 - topPct - bottomPct}%`
          }}
        />
      )}

      {/* Right danger zone */}
      {rightPct > 0 && (
        <div
          className="absolute right-0 bg-red-500/30"
          style={{ 
            top: `${topPct}%`, 
            width: `${rightPct}%`,
            height: `${100 - topPct - bottomPct}%`
          }}
        />
      )}

      {/* Safe zone border */}
      <div
        className="absolute border-2 border-dashed border-green-500"
        style={{
          top: `${topPct}%`,
          left: `${leftPct}%`,
          right: `${rightPct}%`,
          bottom: `${bottomPct}%`,
        }}
      >
        {showLabels && (
          <div className="absolute top-2 left-2">
            <span className="text-green-700 text-xs font-medium bg-green-100/80 px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Safe zone
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Kompaktní verze pro malé náhledy
 */
export function SafeZoneOverlayCompact({ format }: { format: Format }) {
  if (!format.safeZone) return null

  const { safeZone } = format
  const { width, height } = format

  const topPct = (safeZone.top / height) * 100
  const bottomPct = (safeZone.bottom / height) * 100
  const leftPct = (safeZone.left / width) * 100
  const rightPct = (safeZone.right / width) * 100

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Simplified overlay - just the safe zone border */}
      <div
        className="absolute border border-dashed border-amber-500/60"
        style={{
          top: `${topPct}%`,
          left: `${leftPct}%`,
          right: `${rightPct}%`,
          bottom: `${bottomPct}%`,
        }}
      />
    </div>
  )
}

/**
 * Info panel pro safe zone
 */
export function SafeZoneInfo({ format }: { format: Format }) {
  if (!format.safeZone) return null

  const { safeZone } = format
  const safeWidth = safeZone.centerWidth || (format.width - safeZone.left - safeZone.right)
  const safeHeight = safeZone.visibleHeight || (format.height - safeZone.top - safeZone.bottom)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800">Formát s ochrannou zónou</p>
          <p className="text-amber-700 mt-1">
            {safeZone.description || `Hlavní sdělení umístěte do prostoru ${safeWidth}×${safeHeight} px.`}
          </p>
          <div className="mt-2 flex gap-4 text-xs text-amber-600">
            <span>Safe zone: <strong>{safeWidth}×{safeHeight} px</strong></span>
            <span>Okraje: {safeZone.top}/{safeZone.right}/{safeZone.bottom}/{safeZone.left} px</span>
          </div>
        </div>
      </div>
    </div>
  )
}
