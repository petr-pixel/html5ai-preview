import { useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getFormatById } from '@/lib/formats'
import type { Format } from '@/types'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { 
  Download, 
  FileArchive,
  Image as ImageIcon,
  Code,
  Film,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface ValidationResult {
  formatId: string
  valid: boolean
  errors: string[]
  warnings: string[]
  fileSize: number
}

export function ExportPanel() {
  const {
    sourceImage,
    selectedFormats,
    creativeSettings,
    defaultText,
    brandKit,
  } = useAppStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [includeCSV, setIncludeCSV] = useState(true)

  const formatArray = (Array.from(selectedFormats) as string[])
    .map(id => getFormatById(id))
    .filter(Boolean) as Format[]

  const imageFormats = formatArray.filter(f => f.type === 'image')
  const html5Formats = formatArray.filter(f => f.type === 'html5')
  const videoFormats = formatArray.filter(f => f.type === 'video')

  // Render creative to canvas and return blob
  const renderCreative = useCallback(async (format: Format): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = format.width
      canvas.height = format.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas context'))

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const settings = creativeSettings[format.id] || {} as any

        // Calculate crop
        const cropX = settings.cropX ?? 0.5
        const cropY = settings.cropY ?? 0.5
        const scale = settings.cropScale ?? 1

        const imgAspect = img.width / img.height
        const formatAspect = format.width / format.height

        let srcW, srcH, srcX, srcY

        if (imgAspect > formatAspect) {
          srcH = img.height / scale
          srcW = srcH * formatAspect
          srcX = (img.width - srcW) * cropX
          srcY = (img.height - srcH) * cropY
        } else {
          srcW = img.width / scale
          srcH = srcW / formatAspect
          srcX = (img.width - srcW) * cropX
          srcY = (img.height - srcH) * cropY
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, format.width, format.height)

        // Draw text overlay
        const text = settings.textOverlay || defaultText
        if (text.showHeadline && text.headline) {
          const padding = Math.min(format.width, format.height) * 0.05
          const fontSize = Math.min(format.width, format.height) * 0.08

          let textX = padding
          let textY = format.height - padding
          let textAlign: CanvasTextAlign = 'left'

          if (text.position.includes('center')) {
            textX = format.width / 2
            textAlign = 'center'
          } else if (text.position.includes('right')) {
            textX = format.width - padding
            textAlign = 'right'
          }
          if (text.position.includes('top')) textY = padding + fontSize

          ctx.font = `bold ${fontSize}px ${text.fontFamily}`
          const metrics = ctx.measureText(text.headline)
          const bgPadding = fontSize * 0.3

          let bgX = textX - bgPadding
          if (textAlign === 'center') bgX = textX - metrics.width / 2 - bgPadding
          else if (textAlign === 'right') bgX = textX - metrics.width - bgPadding

          ctx.fillStyle = text.headlineBackground
          ctx.fillRect(bgX, textY - fontSize, metrics.width + bgPadding * 2, fontSize + bgPadding)

          ctx.fillStyle = text.headlineColor
          ctx.textAlign = textAlign
          ctx.textBaseline = 'bottom'
          ctx.fillText(text.headline, textX, textY)

          // CTA
          if (text.showCta && text.cta) {
            const ctaFontSize = fontSize * 0.6
            ctx.font = `bold ${ctaFontSize}px ${text.fontFamily}`
            const ctaMetrics = ctx.measureText(text.cta)
            const ctaPadding = ctaFontSize * 0.4
            const ctaY = textY + ctaFontSize + padding * 0.5

            let ctaX = textX
            if (textAlign === 'center') ctaX = textX - ctaMetrics.width / 2 - ctaPadding
            else if (textAlign === 'right') ctaX = textX - ctaMetrics.width - ctaPadding * 2
            else ctaX = textX - ctaPadding

            ctx.fillStyle = brandKit.accentColor
            ctx.beginPath()
            ctx.roundRect(ctaX, ctaY - ctaFontSize, ctaMetrics.width + ctaPadding * 2, ctaFontSize + ctaPadding, 4)
            ctx.fill()

            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'left'
            ctx.fillText(text.cta, ctaX + ctaPadding, ctaY)
          }
        }

        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.9)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = sourceImage!
    })
  }, [sourceImage, creativeSettings, defaultText, brandKit])

  // Validate all creatives
  const validate = async () => {
    setIsValidating(true)
    const results: ValidationResult[] = []

    for (const format of formatArray) {
      const result: ValidationResult = {
        formatId: format.id,
        valid: true,
        errors: [],
        warnings: [],
        fileSize: 0,
      }

      try {
        if (format.type === 'image') {
          const blob = await renderCreative(format)
          result.fileSize = blob.size / 1024

          if (result.fileSize > format.maxSizeKB) {
            result.valid = false
            result.errors.push(`Velikost ${result.fileSize.toFixed(0)} kB překračuje limit ${format.maxSizeKB} kB`)
          }
        }

        if (format.safeZone) {
          result.warnings.push(`Formát má safe zone: ${format.safeZone.description}`)
        }
      } catch (err: any) {
        result.valid = false
        result.errors.push(err.message || 'Chyba při validaci')
      }

      results.push(result)
    }

    setValidationResults(results)
    setIsValidating(false)
  }

  // Export ZIP
  const exportZip = async () => {
    if (!sourceImage) return

    setIsExporting(true)
    setProgress(0)

    const zip = new JSZip()
    const total = formatArray.length
    let current = 0

    for (const format of formatArray) {
      const platform = format.id.startsWith('sklik') ? 'sklik' : 'google'
      const category = format.category

      if (format.type === 'image') {
        try {
          const blob = await renderCreative(format)
          const path = `${platform}/${category}/${format.width}x${format.height}.jpg`
          zip.file(path, blob)
        } catch (err) {
          console.error(`Error rendering ${format.id}:`, err)
        }
      }

      current++
      setProgress((current / total) * 100)
    }

    // Add manifest
    const manifest = {
      generated: new Date().toISOString(),
      formats: formatArray.map(f => ({
        id: f.id,
        name: f.name,
        width: f.width,
        height: f.height,
        type: f.type,
        platform: f.platform,
      })),
      brandKit: {
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
      },
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // Add CSV for import
    if (includeCSV) {
      // Sklik CSV
      const sklikFormats = formatArray.filter(f => f.platform === 'sklik')
      if (sklikFormats.length > 0) {
        const sklikCSV = generateSklikCSV(sklikFormats)
        zip.file('sklik-import.csv', sklikCSV)
      }

      // Google CSV
      const googleFormatsArr = formatArray.filter(f => f.platform === 'google')
      if (googleFormatsArr.length > 0) {
        const googleCSV = generateGoogleCSV(googleFormatsArr)
        zip.file('google-ads-import.csv', googleCSV)
      }
    }

    // Download
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `creatives-${new Date().toISOString().slice(0, 10)}.zip`)

    setIsExporting(false)
    setProgress(100)
  }

  // Generate Sklik CSV
  const generateSklikCSV = (formats: Format[]) => {
    const headers = ['Kampaň', 'Sestava', 'Titulek', 'Popisek', 'Obrázek', 'Cílová URL']
    const rows = [headers.join(';')]
    
    formats.forEach(f => {
      rows.push([
        'AdCreative Export',
        'Sestava 1',
        defaultText.headline || '',
        defaultText.subheadline || '',
        `${f.platform}/${f.category}/${f.width}x${f.height}.jpg`,
        ''
      ].join(';'))
    })

    return rows.join('\n')
  }

  // Generate Google CSV
  const generateGoogleCSV = (formats: Format[]) => {
    const headers = ['Campaign', 'Ad Group', 'Headlines', 'Descriptions', 'Final URL', 'Marketing image']
    const rows = [headers.join(',')]
    
    formats.forEach(f => {
      rows.push([
        'AdCreative Export',
        'Ad Group 1',
        defaultText.headline || '',
        defaultText.subheadline || '',
        '',
        `${f.platform}/${f.category}/${f.width}x${f.height}.jpg`
      ].join(','))
    })

    return rows.join('\n')
  }

  const validCount = validationResults.filter(r => r.valid).length
  const invalidCount = validationResults.filter(r => !r.valid).length

  if (formatArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileArchive className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Žádné formáty</h2>
        <p className="text-muted-foreground">Vyber formáty pro export</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-muted-foreground">
          Stáhni hotové kreativy
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{imageFormats.length}</div>
            <p className="text-sm text-muted-foreground">Obrázků</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Code className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{html5Formats.length}</div>
            <p className="text-sm text-muted-foreground">HTML5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Film className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{videoFormats.length}</div>
            <p className="text-sm text-muted-foreground">Videí</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{includeCSV ? 2 : 0}</div>
            <p className="text-sm text-muted-foreground">CSV souborů</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Validace</CardTitle>
            <Button 
              onClick={validate} 
              variant="outline"
              disabled={isValidating}
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Validovat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {validationResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="success">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} OK
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {invalidCount} chyb
                  </Badge>
                )}
              </div>

              {validationResults.filter(r => !r.valid || r.warnings.length > 0).length > 0 && (
                <div className="max-h-48 overflow-auto space-y-2">
                  {validationResults
                    .filter(r => !r.valid || r.warnings.length > 0)
                    .map((result) => {
                      const format = getFormatById(result.formatId)
                      return (
                        <div
                          key={result.formatId}
                          className={`p-3 rounded-lg text-sm ${
                            result.valid ? 'bg-yellow-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="font-medium">
                            {format?.name} ({format?.width}×{format?.height})
                          </div>
                          {result.errors.map((err, i) => (
                            <div key={i} className="text-red-600 text-xs mt-1">{err}</div>
                          ))}
                          {result.warnings.map((warn, i) => (
                            <div key={i} className="text-yellow-600 text-xs mt-1">{warn}</div>
                          ))}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Klikni na Validovat pro kontrolu kreativ
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Možnosti exportu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Přidat CSV pro import</Label>
              <p className="text-xs text-muted-foreground">
                CSV soubory pro Sklik a Google Ads Editor
              </p>
            </div>
            <Switch
              checked={includeCSV}
              onCheckedChange={setIncludeCSV}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          {isExporting && (
            <div className="mb-4">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Generování... {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button
            size="lg"
            onClick={exportZip}
            disabled={isExporting || formatArray.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Exportuji...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Stáhnout ZIP ({formatArray.length} kreativ)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            ZIP bude obsahovat složky pro každou platformu a kategorii
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
