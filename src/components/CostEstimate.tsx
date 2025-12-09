/**
 * CostEstimate - Zobrazuje odhadované náklady za AI operace
 * 
 * Podporované operace:
 * - image: Generování obrázku
 * - outpaint: Outpainting/rozšíření obrázku
 * - text: Generování textu
 * - video: Generování videa
 * - variants: Generování variant
 */

import { PRICING } from '@/lib/openai-client'
import { DollarSign, AlertCircle, Sparkles, Wand2, Film, Type, Images } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPY
// ============================================================================

type OperationType = 'image' | 'outpaint' | 'text' | 'video' | 'variants' | 'resize'
type Quality = 'low' | 'medium' | 'high'
type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto'

interface CostEstimateProps {
  /** Typ operace */
  type: OperationType
  /** Kvalita (low/medium/high) */
  quality?: Quality
  /** Počet operací */
  count?: number
  /** Velikost obrázku (pro image operace) */
  size?: ImageSize
  /** Délka videa v sekundách */
  videoSeconds?: number
  /** Zobrazit kompaktně */
  compact?: boolean
  /** Přidat do existující ceny */
  additionalCost?: number
  /** CSS třída */
  className?: string
}

// ============================================================================
// HELPER FUNKCE
// ============================================================================

/**
 * Vypočítá odhadovanou cenu za operaci
 */
export function calculateCost(
  type: OperationType,
  options: {
    quality?: Quality
    count?: number
    size?: ImageSize
    videoSeconds?: number
    textTokens?: number
  } = {}
): number {
  const { quality = 'medium', count = 1, size = '1024x1024', videoSeconds = 15, textTokens = 1000 } = options

  switch (type) {
    case 'image':
    case 'outpaint':
    case 'variants':
    case 'resize':
      const imagePrice = PRICING.images[size]?.[quality] || PRICING.images.auto[quality]
      return imagePrice * count

    case 'text':
      // Odhadovaná cena za ~1000 tokenů vstupu a ~500 výstupu
      const textPricing = PRICING.text['gpt-4o-mini']
      const inputCost = (textTokens / 1_000_000) * textPricing.input
      const outputCost = ((textTokens * 0.5) / 1_000_000) * textPricing.output
      return (inputCost + outputCost) * count

    case 'video':
      const videoModel = quality === 'high' ? 'sora-2-pro' : 'sora-2'
      return PRICING.video[videoModel] * videoSeconds * count

    default:
      return 0
  }
}

/**
 * Formátuje cenu pro zobrazení
 */
export function formatPrice(price: number): string {
  if (price < 0.01) return '< $0.01'
  if (price < 0.1) return `$${price.toFixed(3)}`
  return `$${price.toFixed(2)}`
}

/**
 * Vrátí ikonu pro typ operace
 */
function getOperationIcon(type: OperationType) {
  switch (type) {
    case 'image':
      return Sparkles
    case 'outpaint':
    case 'resize':
      return Wand2
    case 'variants':
      return Images
    case 'text':
      return Type
    case 'video':
      return Film
    default:
      return DollarSign
  }
}

/**
 * Vrátí popis operace
 */
function getOperationLabel(type: OperationType, count: number): string {
  switch (type) {
    case 'image':
      return count > 1 ? `${count} obrázků` : '1 obrázek'
    case 'outpaint':
      return count > 1 ? `${count}× outpaint` : 'Outpaint'
    case 'resize':
      return count > 1 ? `${count}× resize` : 'AI Resize'
    case 'variants':
      return count > 1 ? `${count} variant` : '1 varianta'
    case 'text':
      return count > 1 ? `${count}× text` : 'Text'
    case 'video':
      return count > 1 ? `${count} videí` : '1 video'
    default:
      return 'Operace'
  }
}

// ============================================================================
// KOMPONENTA
// ============================================================================

export function CostEstimate({
  type,
  quality = 'medium',
  count = 1,
  size = '1024x1024',
  videoSeconds = 15,
  additionalCost = 0,
  compact = false,
  className,
}: CostEstimateProps) {
  const cost = calculateCost(type, { quality, count, size, videoSeconds }) + additionalCost
  const Icon = getOperationIcon(type)
  const label = getOperationLabel(type, count)

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        className
      )}>
        <DollarSign className="w-3 h-3" />
        {formatPrice(cost)}
      </span>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
      "border border-amber-500/20",
      className
    )}>
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/50">{label}</div>
        <div className="text-sm font-medium text-amber-300">{formatPrice(cost)}</div>
      </div>
      {cost > 0.5 && (
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      )}
    </div>
  )
}

// ============================================================================
// MULTI-COST KOMPONENTA - pro zobrazení více nákladů najednou
// ============================================================================

interface CostItem {
  type: OperationType
  count?: number
  quality?: Quality
  size?: ImageSize
  videoSeconds?: number
  label?: string
}

interface MultiCostEstimateProps {
  items: CostItem[]
  className?: string
}

export function MultiCostEstimate({ items, className }: MultiCostEstimateProps) {
  const totalCost = items.reduce((sum, item) => {
    return sum + calculateCost(item.type, {
      quality: item.quality,
      count: item.count,
      size: item.size,
      videoSeconds: item.videoSeconds,
    })
  }, 0)

  if (items.length === 0) return null

  return (
    <div className={cn(
      "p-3 rounded-xl",
      "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
      "border border-amber-500/20",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-white/80">Odhadované náklady</span>
      </div>
      
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const cost = calculateCost(item.type, {
            quality: item.quality,
            count: item.count,
            size: item.size,
            videoSeconds: item.videoSeconds,
          })
          const Icon = getOperationIcon(item.type)
          const label = item.label || getOperationLabel(item.type, item.count || 1)
          
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-white/50">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
              <span className="text-white/70">{formatPrice(cost)}</span>
            </div>
          )
        })}
      </div>
      
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">Celkem</span>
        <span className="text-lg font-bold text-amber-300">{formatPrice(totalCost)}</span>
      </div>
      
      {totalCost > 1 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/80">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Vyšší náklady - zvažte snížení počtu nebo kvality</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// INLINE COST BADGE - pro tlačítka
// ============================================================================

interface CostBadgeProps {
  cost: number
  className?: string
}

export function CostBadge({ cost, className }: CostBadgeProps) {
  if (cost <= 0) return null
  
  return (
    <span className={cn(
      "ml-2 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded",
      "bg-amber-500/20 text-amber-300",
      className
    )}>
      ~{formatPrice(cost)}
    </span>
  )
}

export default CostEstimate
