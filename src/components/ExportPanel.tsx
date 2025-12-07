'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { getFormatById, getPlatformFromFormatId } from '@/lib/formats'
import { generateHtml5Banner, validateHtml5ForSklik } from '@/lib/html5-generator'
import { generateAllCSVs } from '@/lib/csv-export'
import type { Format } from '@/types'
import JSZip from 'jszip'
import { 
  Download, 
  Check, 
  AlertTriangle, 
  Loader2,
  FileArchive,
  Image,
  Film,
  Code,
  RefreshCw,
  FileSpreadsheet
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
    formatSettings,
    defaultText,
    brandKit,
    html5Settings,
    videoSettings,
  } = useAppStore()

  const [validating, setValidating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])

  const formatArray = Array.from(selectedFormats)
    .map(id => getFormatById(id))
    .filter(Boolean) as Format[]

  const imageFormats = formatArray.filter(f => f.type === 'image')
  const html5Formats = formatArray.filter(f => f.type === 'html5')
  const videoFormats = formatArray.filter(f => f.type === 'video')

  const renderCreative = useCallback(async (format: Format): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = format.width
      canvas.height = format.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas context'))

      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const settings = formatSettings[format.id] || {}
        const text = settings.textOverlay || defaultText

        // Draw image with crop
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

        // Draw text
        if (text.showHeadline && text.headline) {
          const padding = Math.min(format.width, format.height) * 0.05
          const fontSize = Math.min(format.width, format.height) * 0.08

          let textX = padding
          let textY = format.height - padding

          if (text.position.includes('top')) textY = padding + fontSize
          if (text.position === 'center' || text.position === 'top-center' || text.position === 'bottom-center') {
            textX = format.width / 2
          }
          if (text.position.includes('right')) textX = format.width - padding

          ctx.font = `bold ${fontSize}px ${text.fontFamily}`
          const metrics = ctx.measureText(text.headline)
          const bgPadding = fontSize * 0.3

          let bgX = textX - bgPadding
          let textAlign: CanvasTextAlign = 'left'

          if (text.position.includes('center')) {
            bgX = textX - metrics.width / 2 - bgPadding
            textAlign = 'center'
          }
          if (text.position.includes('right')) {
            bgX = textX - metrics.width - bgPadding
            textAlign = 'right'
          }

          ctx.fillStyle = text.backgroundColor
          ctx.fillRect(bgX, textY - fontSize, metrics.width + bgPadding * 2, fontSize + bgPadding)

          ctx.fillStyle = text.color
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

            ctx.fillStyle = brandKit.accentColor || '#f59e0b'
            ctx.beginPath()
            ctx.roundRect(ctaX, ctaY - ctaFontSize, ctaMetrics.width + ctaPadding * 2, ctaFontSize + ctaPadding, 4)
            ctx.fill()

            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'left'
            ctx.fillText(text.cta, ctaX + ctaPadding, ctaY)
          }
        }

        // Logo
        if ((settings.logoVisible ?? true) && brandKit.logo) {
          const logoImg = new window.Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.onload = () => {
            const logoSize = Math.min(format.width, format.height) * 0.15 * (settings.logoScale || 1)
            const logoPadding = Math.min(format.width, format.height) * 0.03

            let logoX = logoPadding
            let logoY = logoPadding

            if (settings.logoPosition?.includes('right')) logoX = format.width - logoSize - logoPadding
            if (settings.logoPosition?.includes('bottom')) logoY = format.height - logoSize - logoPadding

            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)

            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create blob'))
            }, 'image/jpeg', 0.9)
          }
          logoImg.onerror = () => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create blob'))
            }, 'image/jpeg', 0.9)
          }
          logoImg.src = brandKit.logo
        } else {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/jpeg', 0.9)
        }
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = sourceImage!
    })
  }, [sourceImage, formatSettings, defaultText, brandKit])

  const generateHtml5Files = useCallback((format: Format) => {
    const settings = formatSettings[format.id] || {}
    const text = settings.textOverlay || defaultText

    return generateHtml5Banner({
      width: format.width,
      height: format.height,
      imageDataUrl: sourceImage || '',
      text,
      template: html5Settings.template,
      brandColors: {
        primary: brandKit.primaryColor,
        secondary: brandKit.secondaryColor,
        accent: brandKit.accentColor,
      },
      animationDuration: html5Settings.animationDuration,
      loop: html5Settings.loop,
    })
  }, [formatSettings, defaultText, brandKit, html5Settings, sourceImage])

  const validate = async () => {
    setValidating(true)
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
        } else if (format.type === 'html5') {
          const files = generateHtml5Files(format)
          const totalSize = (files['index.html'].length + files['styles.css'].length + files['script.js'].length) / 1024
          result.fileSize = totalSize

          // Validate for Sklik
          if (getPlatformFromFormatId(format.id) === 'sklik') {
            const validation = validateHtml5ForSklik(files)
            if (!validation.valid) {
              result.valid = false
              result.errors.push(...validation.errors)
            }
          }

          if (totalSize > format.maxSizeKB * 0.5) {
            result.warnings.push('HTML5 bude potřebovat obrázek, sledujte celkovou velikost ZIP')
          }
        }

        // Safe zone warning
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
    setValidating(false)
  }

  const exportZip = async () => {
    setExporting(true)
    setProgress(0)

    const zip = new JSZip()
    const total = formatArray.length
    let current = 0

    for (const format of formatArray) {
      const platform = getPlatformFromFormatId(format.id)
      const category = format.id.split('-')[1]

      if (format.type === 'image') {
        try {
          const blob = await renderCreative(format)
          const path = `${platform}/${category}/${format.width}x${format.height}.jpg`
          zip.file(path, blob)
        } catch (err) {
          console.error(`Error rendering ${format.id}:`, err)
        }
      } else if (format.type === 'html5') {
        const files = generateHtml5Files(format)
        const folder = `${platform}/html5/${format.width}x${format.height}`
        zip.file(`${folder}/index.html`, files['index.html'])
        zip.file(`${folder}/styles.css`, files['styles.css'])
        zip.file(`${folder}/script.js`, files['script.js'])

        // Add image
        if (sourceImage) {
          try {
            const imgBlob = await renderCreative({ ...format, type: 'image' } as Format)
            zip.file(`${folder}/image.jpg`, imgBlob)
          } catch (err) {
            console.error(`Error adding image to HTML5:`, err)
          }
        }
      }

      current++
      setProgress((current / total) * 100)
    }

    // Generate CSV files for import
    const exportedCreatives = formatArray.map(f => ({
      format: f,
      filename: `${getPlatformFromFormatId(f.id)}/${f.id.split('-')[1]}/${f.width}x${f.height}.${f.type === 'html5' ? 'zip' : 'jpg'}`,
      text: formatSettings[f.id]?.textOverlay || defaultText,
    }))

    const csvFiles = generateAllCSVs(exportedCreatives, brandKit)
    for (const csvFile of csvFiles) {
      zip.file(csvFile.filename, csvFile.content)
    }

    // Generate manifest
    const manifest = {
      generated: new Date().toISOString(),
      formats: formatArray.map(f => ({
        id: f.id,
        name: f.name,
        width: f.width,
        height: f.height,
        type: f.type,
        platform: getPlatformFromFormatId(f.id),
      })),
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // Download
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `creatives-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)

    setExporting(false)
    setProgress(100)
  }

  const validCount = validationResults.filter(r => r.valid).length
  const invalidCount = validationResults.filter(r => !r.valid).length

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Export kreativ</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <Image className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{imageFormats.length}</div>
          <div className="text-sm text-gray-500">Obrázků</div>
        </Card>
        <Card className="text-center">
          <Code className="w-8 h-8 mx-auto mb-2 text-purple-500" />
          <div className="text-2xl font-bold">{html5Formats.length}</div>
          <div className="text-sm text-gray-500">HTML5</div>
        </Card>
        <Card className="text-center">
          <Film className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <div className="text-2xl font-bold">{videoFormats.length}</div>
          <div className="text-sm text-gray-500">Videí</div>
        </Card>
      </div>

      {/* Validation */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Validace</h3>
          <Button onClick={validate} loading={validating} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Validovat
          </Button>
        </div>

        {validationResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <Badge variant="success">
                <Check className="w-3 h-3 mr-1" />
                {validCount} OK
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="error">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {invalidCount} chyb
                </Badge>
              )}
            </div>

            <div className="max-h-48 overflow-auto space-y-2">
              {validationResults.filter(r => !r.valid || r.warnings.length > 0).map((result) => {
                const format = getFormatById(result.formatId)
                return (
                  <div
                    key={result.formatId}
                    className={`p-2 rounded text-sm ${
                      result.valid ? 'bg-yellow-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="font-medium">
                      {format?.name} ({format?.width}×{format?.height})
                    </div>
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-red-600 text-xs">{err}</div>
                    ))}
                    {result.warnings.map((warn, i) => (
                      <div key={i} className="text-yellow-600 text-xs">{warn}</div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Export */}
      <Card>
        <h3 className="font-medium mb-4">Stáhnout</h3>

        {exporting && (
          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500 mt-2">Generování... {Math.round(progress)}%</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={exportZip}
            loading={exporting}
            disabled={formatArray.length === 0}
            className="flex-1"
          >
            <FileArchive className="w-5 h-5 mr-2" />
            Stáhnout ZIP
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          ZIP bude obsahovat složky pro každou platformu a kategorii.
        </p>
      </Card>
    </div>
  )
}
