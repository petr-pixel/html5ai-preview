import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, parseFormatKey } from '@/lib/platforms'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle
} from 'lucide-react'

interface QualityIssue {
  type: 'error' | 'warning'
  formatKey: string
  formatName: string
  message: string
  detail?: string
}

export function QualityCheck() {
  const { creatives, textOverlay, videoScenario } = useAppStore()

  const creativesArray = useMemo(() => Object.values(creatives), [creatives])

  // Kontrola problémů
  const issues = useMemo(() => {
    const result: QualityIssue[] = []

    for (const creative of creativesArray) {
      const { platform, category } = parseFormatKey(creative.formatKey)
      const platformData = platforms[platform]
      const categoryData = platformData?.categories[category]

      if (!categoryData) continue

      // Kontrola velikosti
      if (creative.sizeKB && creative.sizeKB > categoryData.maxSizeKB) {
        result.push({
          type: 'error',
          formatKey: creative.formatKey,
          formatName: creative.format.name,
          message: `Překročen limit ${categoryData.maxSizeKB} kB`,
          detail: `Aktuální velikost: ${creative.sizeKB.toFixed(1)} kB`,
        })
      } else if (creative.sizeKB && creative.sizeKB > categoryData.maxSizeKB * 0.9) {
        result.push({
          type: 'warning',
          formatKey: creative.formatKey,
          formatName: creative.format.name,
          message: `Blízko limitu ${categoryData.maxSizeKB} kB`,
          detail: `Aktuální velikost: ${creative.sizeKB.toFixed(1)} kB (${Math.round(creative.sizeKB / categoryData.maxSizeKB * 100)}%)`,
        })
      }

      // Kontrola text overlay mimo plochu (pro malé formáty)
      if (textOverlay.enabled && creative.format.width < 200 && textOverlay.headline) {
        result.push({
          type: 'warning',
          formatKey: creative.formatKey,
          formatName: creative.format.name,
          message: 'Text overlay může být nečitelný',
          detail: `Formát ${creative.format.width}×${creative.format.height} je příliš malý pro dlouhý text`,
        })
      }

      // Kontrola video délky vs typ
      if (creative.format.isVideo) {
        if (videoScenario.campaignType === 'youtube_bumper' && videoScenario.lengthSeconds > 6) {
          result.push({
            type: 'error',
            formatKey: creative.formatKey,
            formatName: creative.format.name,
            message: 'Bumper musí být max 6 sekund',
            detail: `Nastavená délka: ${videoScenario.lengthSeconds}s`,
          })
        }
      }
    }

    return result
  }, [creativesArray, textOverlay, videoScenario])

  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')
  const isValid = errors.length === 0

  if (creativesArray.length === 0) {
    return null
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <span className="font-semibold">Kontrola kvality</span>
        </div>
        <div className="flex gap-2">
          {errors.length > 0 && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-500">
              <XCircle className="w-3 h-3 mr-1" />
              {errors.length} chyb
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {warnings.length} varování
            </Badge>
          )}
          {isValid && warnings.length === 0 && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Vše OK
            </Badge>
          )}
        </div>
      </div>

      {/* Seznam problémů */}
      {issues.length > 0 && (
        <div className="space-y-2 mb-4">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg text-sm',
                issue.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-amber-500/10 border border-amber-500/20'
              )}
            >
              {issue.type === 'error' ? (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{issue.formatName}</span>
                  <span className={issue.type === 'error' ? 'text-red-500' : 'text-amber-500'}>
                    {issue.message}
                  </span>
                </div>
                {issue.detail && (
                  <p className="text-xs text-muted-foreground mt-1">{issue.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        <p>
          Zkontrolováno {creativesArray.length} kreativ.{' '}
          {isValid
            ? 'Všechny kreativy splňují požadavky platforem.'
            : 'Některé kreativy nemusí projít validací na platformě.'}
        </p>
      </div>

      {/* Rady pro opravu */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium mb-2">Jak opravit:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Pro velké soubory: Snižte kvalitu JPEG při exportu</li>
            <li>• Pro text mimo plochu: Zkraťte headline nebo použijte menší font</li>
            <li>• Pro video: Upravte délku v nastavení scénáře</li>
          </ul>
        </div>
      )}
    </Card>
  )
}
