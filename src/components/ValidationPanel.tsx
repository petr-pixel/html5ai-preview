/**
 * ValidationPanel - Zobrazení výsledků validace kreativ
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  validateImageFile, 
  getPresetByDimensions,
  checkSizeLimit,
  getSizePercentage,
  type FormatPreset,
  type ValidationResult,
  type ValidationError
} from '@/lib/format-presets'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  ChevronDown,
  ChevronRight,
  FileImage,
  Archive,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui'

interface ValidationPanelProps {
  creatives: {
    id: string
    imageUrl: string
    platform: 'google' | 'sklik'
    type: 'image' | 'html5' | 'branding'
    width: number
    height: number
    sizeKB?: number
  }[]
  onAutoFix?: (id: string, fixType: string) => void
}

interface CreativeValidation {
  id: string
  preset: FormatPreset | null
  result: ValidationResult | null
  isLoading: boolean
}

export function ValidationPanel({ creatives, onAutoFix }: ValidationPanelProps) {
  const [validations, setValidations] = useState<Record<string, CreativeValidation>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isValidating, setIsValidating] = useState(false)

  // Spustit validaci při změně kreativ
  useEffect(() => {
    validateAll()
  }, [creatives])

  const validateAll = async () => {
    setIsValidating(true)
    const newValidations: Record<string, CreativeValidation> = {}

    for (const creative of creatives) {
      const preset = getPresetByDimensions(
        creative.platform,
        creative.type,
        creative.width,
        creative.height
      )

      if (!preset) {
        newValidations[creative.id] = {
          id: creative.id,
          preset: null,
          result: {
            isValid: false,
            errors: [{
              type: 'error',
              code: 'UNKNOWN_FORMAT',
              message: `Neznámý formát: ${creative.platform} ${creative.type} ${creative.width}×${creative.height}`
            }],
            warnings: []
          },
          isLoading: false
        }
        continue
      }

      // Pro image validaci potřebujeme načíst obrázek
      if (creative.type === 'image' || creative.type === 'branding') {
        try {
          const img = await loadImage(creative.imageUrl)
          const blob = await fetch(creative.imageUrl).then(r => r.blob())
          
          const result = validateImageFile(
            {
              data: blob,
              width: img.width,
              height: img.height,
              type: blob.type
            },
            preset
          )

          newValidations[creative.id] = {
            id: creative.id,
            preset,
            result,
            isLoading: false
          }
        } catch (err) {
          newValidations[creative.id] = {
            id: creative.id,
            preset,
            result: {
              isValid: false,
              errors: [{
                type: 'error',
                code: 'LOAD_ERROR',
                message: 'Nepodařilo se načíst obrázek pro validaci'
              }],
              warnings: []
            },
            isLoading: false
          }
        }
      }
    }

    setValidations(newValidations)
    setIsValidating(false)
  }

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Summary stats
  const stats = {
    total: creatives.length,
    valid: Object.values(validations).filter(v => v.result?.isValid).length,
    errors: Object.values(validations).filter(v => v.result && !v.result.isValid).length,
    warnings: Object.values(validations).filter(v => v.result?.warnings.length).length,
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Validace kreativ</h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={validateAll}
            disabled={isValidating}
          >
            <Zap className="w-4 h-4 mr-1" />
            {isValidating ? 'Validuji...' : 'Znovu validovat'}
          </Button>
        </div>
        
        {/* Summary */}
        <div className="flex gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Celkem:</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>{stats.valid} OK</span>
          </div>
          {stats.errors > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              <span>{stats.errors} chyb</span>
            </div>
          )}
          {stats.warnings > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{stats.warnings} varování</span>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {creatives.map(creative => {
          const validation = validations[creative.id]
          const isExpanded = expandedItems.has(creative.id)
          const hasErrors = validation?.result && !validation.result.isValid
          const hasWarnings = validation?.result?.warnings.length > 0

          return (
            <div key={creative.id} className="bg-white">
              {/* Row header */}
              <button
                onClick={() => toggleExpanded(creative.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Status icon */}
                {validation?.isLoading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : validation?.result?.isValid && !hasWarnings ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : hasErrors ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : hasWarnings ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200" />
                )}

                {/* Thumbnail */}
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                  <img 
                    src={creative.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {creative.width}×{creative.height}
                    </span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      creative.platform === 'google' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-orange-100 text-orange-700'
                    )}>
                      {creative.platform === 'google' ? 'Google' : 'Sklik'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {creative.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {validation?.result?.fileSize 
                      ? `${validation.result.fileSize} kB`
                      : creative.sizeKB 
                      ? `~${creative.sizeKB} kB`
                      : ''
                    }
                    {validation?.preset && (
                      <span className="ml-2">
                        (limit {validation.preset.maxFileSizeKB} kB)
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand icon */}
                {(hasErrors || hasWarnings) && (
                  isExpanded 
                    ? <ChevronDown className="w-5 h-5 text-gray-400" />
                    : <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && validation?.result && (
                <div className="px-4 pb-3 pl-16">
                  {/* Errors */}
                  {validation.result.errors.map((error, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 py-1.5 text-sm"
                    >
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-red-700">{error.message}</div>
                        {error.details && (
                          <div className="text-red-500 text-xs">{error.details}</div>
                        )}
                        {error.autoFixable && onAutoFix && (
                          <button
                            onClick={() => onAutoFix(creative.id, error.code)}
                            className="mt-1 text-xs text-blue-600 hover:underline"
                          >
                            Automaticky opravit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Warnings */}
                  {validation.result.warnings.map((warning, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 py-1.5 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-amber-700">{warning.message}</div>
                        {warning.details && (
                          <div className="text-amber-500 text-xs">{warning.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {creatives.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            <FileImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div>Žádné kreativy k validaci</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// QUICK SIZE INDICATOR
// ============================================================================

interface SizeIndicatorProps {
  sizeKB: number
  maxSizeKB: number
  className?: string
}

export function SizeIndicator({ sizeKB, maxSizeKB, className }: SizeIndicatorProps) {
  const percentage = Math.round((sizeKB / maxSizeKB) * 100)
  const isOver = percentage > 100
  const isNear = percentage > 90 && percentage <= 100
  const isOk = percentage <= 90

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full rounded-full transition-all',
            isOver && 'bg-red-500',
            isNear && 'bg-amber-500',
            isOk && 'bg-green-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-medium',
        isOver && 'text-red-600',
        isNear && 'text-amber-600',
        isOk && 'text-green-600'
      )}>
        {sizeKB}/{maxSizeKB} kB
      </span>
    </div>
  )
}

// ============================================================================
// VALIDATION BADGE
// ============================================================================

interface ValidationBadgeProps {
  isValid: boolean
  errorsCount?: number
  warningsCount?: number
  className?: string
}

export function ValidationBadge({ 
  isValid, 
  errorsCount = 0, 
  warningsCount = 0,
  className 
}: ValidationBadgeProps) {
  if (isValid && warningsCount === 0) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700',
        className
      )}>
        <CheckCircle className="w-3 h-3" />
        OK
      </span>
    )
  }

  if (!isValid) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
        className
      )}>
        <XCircle className="w-3 h-3" />
        {errorsCount} {errorsCount === 1 ? 'chyba' : 'chyby'}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700',
      className
    )}>
      <AlertTriangle className="w-3 h-3" />
      {warningsCount} varování
    </span>
  )
}
