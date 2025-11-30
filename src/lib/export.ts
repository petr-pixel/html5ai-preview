/**
 * Export Utilities - CSV, JSON, ZIP export pro kreativy
 */

import { platforms, parseFormatKey } from './platforms'
import type { Format } from '@/types'
import type { CreativePackContents } from './creative-engine'

// ============================================================================
// FORMAT EXPORT (pro Google Ads Editor / Sklik)
// ============================================================================

export interface FormatExportRow {
  platform: string
  category: string
  formatName: string
  width: number
  height: number
  ratio: string
  maxSizeKB: number
  fileTypes: string
  isVideo: boolean
  isHTML5: boolean
}

/**
 * Exportuje vybrané formáty do CSV
 */
export function exportFormatsToCSV(selectedFormats: Set<string>): string {
  const rows = getFormatRows(selectedFormats)
  const headers = ['Platform', 'Category', 'Format', 'Width', 'Height', 'Ratio', 'MaxKB', 'FileTypes', 'IsVideo', 'IsHTML5']
  
  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      r.platform,
      r.category,
      `"${r.formatName}"`,
      r.width,
      r.height,
      r.ratio || '',
      r.maxSizeKB,
      `"${r.fileTypes}"`,
      r.isVideo ? 'true' : 'false',
      r.isHTML5 ? 'true' : 'false',
    ].join(','))
  ]

  return csvRows.join('\n')
}

/**
 * Exportuje vybrané formáty do JSON
 */
export function exportFormatsToJSON(selectedFormats: Set<string>): string {
  const rows = getFormatRows(selectedFormats)
  return JSON.stringify(rows, null, 2)
}

/**
 * Exportuje do Google Ads Editor formátu
 */
export function exportToGoogleAdsEditor(selectedFormats: Set<string>, campaignName: string = 'Campaign'): string {
  const rows = getFormatRows(selectedFormats).filter(r => r.platform === 'Google Ads')
  
  const headers = ['Campaign', 'Ad group', 'Asset type', 'Asset', 'Asset width', 'Asset height']
  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      campaignName,
      'Ad Group 1',
      r.isVideo ? 'VIDEO' : 'IMAGE',
      `placeholder_${r.width}x${r.height}.${r.isVideo ? 'mp4' : 'png'}`,
      r.width,
      r.height,
    ].join(','))
  ]

  return csvRows.join('\n')
}

/**
 * Exportuje do Sklik importního formátu
 */
export function exportToSklik(selectedFormats: Set<string>, groupName: string = 'Skupina'): string {
  const rows = getFormatRows(selectedFormats).filter(r => r.platform === 'Sklik')
  
  const headers = ['Skupina', 'Typ', 'Rozměr', 'Soubor', 'MaxKB']
  const csvRows = [
    headers.join(';'), // Sklik používá středník
    ...rows.map(r => [
      groupName,
      r.isHTML5 ? 'HTML5' : r.isVideo ? 'VIDEO' : 'BANNER',
      `${r.width}x${r.height}`,
      `banner_${r.width}x${r.height}.${r.isHTML5 ? 'zip' : r.isVideo ? 'mp4' : 'png'}`,
      r.maxSizeKB,
    ].join(';'))
  ]

  return csvRows.join('\n')
}

function getFormatRows(selectedFormats: Set<string>): FormatExportRow[] {
  const rows: FormatExportRow[] = []

  for (const key of selectedFormats) {
    const { platform, category, index } = parseFormatKey(key)
    const p = platforms[platform]
    if (!p) continue
    const c = p.categories[category]
    if (!c) continue
    const f = c.formats[index]
    if (!f) continue

    rows.push({
      platform: p.name,
      category: c.name,
      formatName: f.name,
      width: f.width,
      height: f.height,
      ratio: f.ratio || '',
      maxSizeKB: c.maxSizeKB,
      fileTypes: c.fileTypes.join(', '),
      isVideo: f.isVideo || false,
      isHTML5: c.isHTML5 || false,
    })
  }

  return rows
}

// ============================================================================
// CREATIVE PACK EXPORT (ZIP)
// ============================================================================

/**
 * Vytvoří ZIP soubor s kompletním creative packem
 * Struktura:
 * /static/{platform}/{width}x{height}.png
 * /html5/{platform}/{width}x{height}/index.html, ...
 * /video/{platform}/{aspect}/{length}s.mp4
 * /preview/thumbnails/
 */
export async function createCreativePackZip(
  contents: CreativePackContents,
  brand: string,
  campaign: string
): Promise<Blob> {
  // Dynamic import JSZip
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Static images
  const staticFolder = zip.folder('static')!
  for (const item of contents.static) {
    const platformFolder = staticFolder.folder(item.format.name.toLowerCase().replace(/\s+/g, '_'))!
    platformFolder.file(item.filename, item.blob)
  }

  // HTML5 ZIPs
  const html5Folder = zip.folder('html5')!
  for (const item of contents.html5) {
    html5Folder.file(item.filename, item.zipBlob)
  }

  // Videos
  const videoFolder = zip.folder('video')!
  for (const item of contents.video) {
    if (item.blob) {
      videoFolder.file(item.filename, item.blob)
    }
  }

  // Manifest JSON
  const manifest = {
    brand,
    campaign,
    createdAt: new Date().toISOString(),
    contents: {
      static: contents.static.length,
      html5: contents.html5.length,
      video: contents.video.length,
    },
    formats: contents.static.map(s => ({
      type: 'static',
      filename: s.filename,
      width: s.format.width,
      height: s.format.height,
    })),
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

// ============================================================================
// SINGLE CREATIVE EXPORT
// ============================================================================

/**
 * Stáhne jednotlivý soubor
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Stáhne text jako soubor
 */
export function downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

// ============================================================================
// HTML5 ZIP EXPORT
// ============================================================================

/**
 * Vytvoří ZIP pro jednotlivý HTML5 banner
 */
export async function createHTML5Zip(
  htmlContent: string,
  imageBlob: Blob,
  format: Format
): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // index.html
  zip.file('index.html', htmlContent)

  // assets/background.jpg
  const assetsFolder = zip.folder('assets')!
  assetsFolder.file('background.jpg', imageBlob)

  return await zip.generateAsync({ 
    type: 'blob', 
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
}

/**
 * Vytvoří kompletní HTML5 banner ZIP s inline obrázkem
 */
export async function createHTML5BannerZip(
  format: Format,
  imageBase64: string,
  textOverlay: { headline: string; subheadline: string; cta: string; ctaColor: string; position: string },
  template: 'static' | 'fade-in' | 'slide-up' | 'ken-burns' | 'pulse-cta' = 'fade-in',
  isPMax: boolean = false
): Promise<{ zipBlob: Blob; sizeKB: number }> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Generuj HTML
  const htmlContent = generateHTML5Content(format, imageBase64, textOverlay, template, isPMax)
  
  // CSS soubor
  const cssContent = generateHTML5CSS(format, textOverlay, template)
  
  // JS soubor (pokud je animace)
  const jsContent = template !== 'static' ? generateHTML5JS(template) : null

  // Přidej soubory do ZIPu
  zip.file('index.html', htmlContent)
  zip.file('styles.css', cssContent)
  if (jsContent) {
    zip.file('banner.js', jsContent)
  }

  // Přidej obrázek jako soubor (ne inline)
  const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))
  zip.file('assets/background.jpg', imageBuffer)

  const zipBlob = await zip.generateAsync({ 
    type: 'blob', 
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })

  return {
    zipBlob,
    sizeKB: zipBlob.size / 1024
  }
}

function generateHTML5Content(
  format: Format,
  imageBase64: string,
  textOverlay: { headline: string; subheadline: string; cta: string; ctaColor: string; position: string },
  template: string,
  isPMax: boolean
): string {
  const metaTags = isPMax
    ? '<meta name="productType" content="dynamic">\n  <meta name="vertical" content="RETAIL">'
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width=${format.width},height=${format.height}">
  ${metaTags}
  <link rel="stylesheet" href="styles.css">
  ${template !== 'static' ? '<script src="banner.js" defer></script>' : ''}
</head>
<body>
  <div class="banner" onclick="window.open(window.clickTag || '#')">
    <img class="bg" src="assets/background.jpg" alt="">
    <div class="overlay"></div>
    <div class="content">
      ${textOverlay.headline ? `<div class="headline">${textOverlay.headline}</div>` : ''}
      ${textOverlay.subheadline ? `<div class="subheadline">${textOverlay.subheadline}</div>` : ''}
      ${textOverlay.cta ? `<div class="cta" style="background:${textOverlay.ctaColor}">${textOverlay.cta}</div>` : ''}
    </div>
  </div>
  <script>var clickTag = "";</script>
</body>
</html>`
}

function generateHTML5CSS(
  format: Format,
  textOverlay: { position: string },
  template: string
): string {
  const fontSize = Math.max(14, Math.min(48, format.width / 15))
  
  return `* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  width: ${format.width}px; 
  height: ${format.height}px; 
  overflow: hidden; 
  font-family: 'Segoe UI', system-ui, sans-serif;
}
.banner {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  ${template === 'ken-burns' ? 'animation: kenBurns 8s ease-out forwards;' : ''}
}
.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%);
}
.content {
  position: absolute;
  ${textOverlay.position.includes('top') ? 'top: 20px' : 'bottom: 20px'};
  ${textOverlay.position.includes('left') ? 'left: 20px; text-align: left' : 
    textOverlay.position.includes('right') ? 'right: 20px; text-align: right' : 
    'left: 50%; transform: translateX(-50%); text-align: center'};
  color: white;
  max-width: 90%;
}
.headline {
  font-size: ${fontSize}px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  ${template === 'fade-in' || template === 'ken-burns' ? 'opacity: 0; animation: fadeIn 0.6s ease-out 0.3s forwards;' : ''}
  ${template === 'slide-up' ? 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.3s forwards;' : ''}
}
.subheadline {
  font-size: ${fontSize * 0.6}px;
  margin-bottom: 12px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.8);
  opacity: 0.9;
  ${template === 'fade-in' || template === 'ken-burns' ? 'opacity: 0; animation: fadeIn 0.6s ease-out 0.5s forwards;' : ''}
  ${template === 'slide-up' ? 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.5s forwards;' : ''}
}
.cta {
  display: inline-block;
  color: white;
  padding: ${Math.max(8, fontSize * 0.4)}px ${Math.max(16, fontSize * 0.8)}px;
  border-radius: 6px;
  font-size: ${fontSize * 0.5}px;
  font-weight: 600;
  ${template === 'fade-in' || template === 'ken-burns' ? 'opacity: 0; animation: fadeIn 0.6s ease-out 0.7s forwards;' : ''}
  ${template === 'slide-up' ? 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.7s forwards;' : ''}
  ${template === 'pulse-cta' ? 'animation: fadeIn 0.6s ease-out 0.7s forwards, pulse 2s ease-in-out 1.5s infinite;' : ''}
}

@keyframes fadeIn { to { opacity: 1; } }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
@keyframes kenBurns { from { transform: scale(1.1); } to { transform: scale(1); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`
}

function generateHTML5JS(template: string): string {
  return `// Banner animation script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Banner loaded: ${template} animation');
  
  // Track interaction
  document.querySelector('.banner').addEventListener('click', function() {
    if (window.clickTag) {
      window.open(window.clickTag, '_blank');
    }
  });
});`
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validuje creative pack před exportem
 */
export function validateCreativePack(contents: CreativePackContents, maxSizes: Record<string, number>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Kontrola velikostí statických bannerů
  for (const item of contents.static) {
    const sizeKB = item.blob.size / 1024
    const limit = maxSizes[`${item.format.width}x${item.format.height}`] || 150
    if (sizeKB > limit) {
      errors.push(`${item.filename}: ${sizeKB.toFixed(1)} kB překračuje limit ${limit} kB`)
    }
  }

  // Kontrola HTML5 ZIPů
  for (const item of contents.html5) {
    const sizeKB = item.zipBlob.size / 1024
    if (sizeKB > 150) {
      warnings.push(`${item.filename}: ${sizeKB.toFixed(1)} kB - některé sítě mají limit 150 kB`)
    }
  }

  // Kontrola videí
  for (const item of contents.video) {
    if (item.output.lengthSeconds === 6 && item.output.lengthSeconds > 6) {
      errors.push(`Video bumper musí být max 6 sekund`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// SUMMARY HELPERS
// ============================================================================

/**
 * Generuje souhrnný text pro kategorii
 */
export function getCategorySummary(platformId: string, categoryId: string): string {
  const p = platforms[platformId]
  if (!p) return ''
  const c = p.categories[categoryId]
  if (!c) return ''

  const parts = [
    p.name,
    '–',
    c.name,
    '•',
    `max ${c.maxSizeKB} kB`,
    '•',
    c.fileTypes.join(', '),
  ]

  if (c.isHTML5) parts.push('• HTML5')
  if (c.isPMax) parts.push('• P-Max')

  return parts.join(' ')
}

// ============================================================================
// COMPLIANCE EXPORT - Sklik & Google Ads
// ============================================================================

export interface ComplianceCreative {
  id: string
  platform: 'sklik' | 'google'
  category: string
  format: Format
  imageUrl: string
  blob?: Blob
  sizeKB?: number
  isCompliant?: boolean
}

/**
 * Komprimuje obrázek na požadovanou velikost
 * Agresivně snižuje kvalitu JPEG dokud není pod limitem
 */
export async function compressToSize(
  imageUrl: string,
  maxSizeKB: number,
  options: {
    minQuality?: number
    removeMetadata?: boolean
  } = {}
): Promise<{ blob: Blob; quality: number; sizeKB: number }> {
  const { minQuality = 0.3, removeMetadata = true } = options
  
  // Načti obrázek
  const img = await loadImageFromUrl(imageUrl)
  
  // Vytvoř canvas
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  
  // Kresli bez metadat (čistý canvas)
  if (removeMetadata) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  
  // Binární hledání optimální kvality
  let quality = 0.92
  let blob: Blob
  let sizeKB: number
  
  do {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    sizeKB = blob.size / 1024
    
    if (sizeKB <= maxSizeKB) {
      break
    }
    
    quality -= 0.05
  } while (quality >= minQuality)
  
  // Pokud stále moc velké, zmenši rozlišení
  if (sizeKB > maxSizeKB && quality <= minQuality) {
    let scale = 0.9
    while (sizeKB > maxSizeKB && scale > 0.5) {
      const newCanvas = document.createElement('canvas')
      newCanvas.width = Math.floor(img.width * scale)
      newCanvas.height = Math.floor(img.height * scale)
      const newCtx = newCanvas.getContext('2d')!
      newCtx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)
      
      blob = await canvasToBlob(newCanvas, 'image/jpeg', minQuality + 0.1)
      sizeKB = blob.size / 1024
      scale -= 0.1
    }
  }
  
  return { blob, quality, sizeKB }
}

/**
 * Vytvoří compliance ZIP s korektní strukturou složek
 * Struktura:
 * /Sklik_CZ/Bannery/       (< 150kB, auto-komprimované)
 * /Sklik_CZ/Kombinovana/
 * /Sklik_CZ/Branding/
 * /Google_Ads/PMax/        (až 5MB)
 * /Google_Ads/Display/     (< 150kB)
 * /Video/
 */
export async function createComplianceZip(
  creatives: ComplianceCreative[],
  options: {
    brand?: string
    campaign?: string
    forceCompliance?: boolean
    onProgress?: (progress: number, message: string) => void
  } = {}
): Promise<Blob> {
  const { brand = 'Brand', campaign = 'Campaign', forceCompliance = true, onProgress } = options
  
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  
  // Vytvoř strukturu složek
  const sklikFolder = zip.folder('Sklik_CZ')!
  const googleFolder = zip.folder('Google_Ads')!
  const videoFolder = zip.folder('Video')!
  
  // Sklik podsložky
  const sklikBannery = sklikFolder.folder('Bannery')!
  const sklikKombinova = sklikFolder.folder('Kombinovana')!
  const sklikBranding = sklikFolder.folder('Branding')!
  const sklikHTML5 = sklikFolder.folder('HTML5')!
  
  // Google podsložky
  const googlePMax = googleFolder.folder('PMax')!
  const googleDisplay = googleFolder.folder('Display')!
  const googleYouTube = googleFolder.folder('YouTube')!
  
  const processedCreatives: Array<{
    creative: ComplianceCreative
    blob: Blob
    sizeKB: number
    isCompliant: boolean
    wasCompressed: boolean
  }> = []
  
  let processed = 0
  const total = creatives.length
  
  for (const creative of creatives) {
    onProgress?.(Math.round((processed / total) * 80), `Zpracovávám ${creative.format.name}...`)
    
    // Získej limit velikosti
    const maxSizeKB = getMaxSizeForCategory(creative.platform, creative.category)
    
    // Konvertuj data URL na blob
    let blob: Blob
    let sizeKB: number
    let wasCompressed = false
    
    if (creative.blob) {
      blob = creative.blob
      sizeKB = blob.size / 1024
    } else {
      const response = await fetch(creative.imageUrl)
      blob = await response.blob()
      sizeKB = blob.size / 1024
    }
    
    // Komprimuj pokud je potřeba
    if (forceCompliance && sizeKB > maxSizeKB) {
      onProgress?.(Math.round((processed / total) * 80), `Komprimuji ${creative.format.name} (${Math.round(sizeKB)}kB → ${maxSizeKB}kB)...`)
      
      const compressed = await compressToSize(creative.imageUrl, maxSizeKB, {
        minQuality: 0.4,
        removeMetadata: true,
      })
      
      blob = compressed.blob
      sizeKB = compressed.sizeKB
      wasCompressed = true
    }
    
    const isCompliant = sizeKB <= maxSizeKB
    
    processedCreatives.push({
      creative,
      blob,
      sizeKB,
      isCompliant,
      wasCompressed,
    })
    
    processed++
  }
  
  onProgress?.(85, 'Vytvářím ZIP strukturu...')
  
  // Zařaď do správných složek
  for (const { creative, blob, isCompliant } of processedCreatives) {
    const filename = `${creative.format.name.replace(/\s+/g, '_')}_${creative.format.width}x${creative.format.height}.jpg`
    const sizeNote = isCompliant ? '' : '_OVERSIZED'
    const finalFilename = filename.replace('.jpg', `${sizeNote}.jpg`)
    
    if (creative.platform === 'sklik') {
      switch (creative.category) {
        case 'bannery':
          sklikBannery.file(finalFilename, blob)
          break
        case 'kombinovana':
          sklikKombinova.file(finalFilename, blob)
          break
        case 'branding':
          sklikBranding.file(finalFilename, blob)
          break
        case 'html5':
          sklikHTML5.file(finalFilename, blob)
          break
        case 'video':
          videoFolder.file(finalFilename, blob)
          break
        default:
          sklikFolder.file(finalFilename, blob)
      }
    } else if (creative.platform === 'google') {
      switch (creative.category) {
        case 'pmax':
          googlePMax.file(finalFilename, blob)
          break
        case 'display':
          googleDisplay.file(finalFilename, blob)
          break
        case 'youtube':
          googleYouTube.file(finalFilename, blob)
          break
        default:
          googleFolder.file(finalFilename, blob)
      }
    }
  }
  
  onProgress?.(90, 'Generuji manifest...')
  
  // Compliance report
  const complianceReport = {
    brand,
    campaign,
    generatedAt: new Date().toISOString(),
    summary: {
      total: processedCreatives.length,
      compliant: processedCreatives.filter(p => p.isCompliant).length,
      compressed: processedCreatives.filter(p => p.wasCompressed).length,
      oversized: processedCreatives.filter(p => !p.isCompliant).length,
    },
    creatives: processedCreatives.map(p => ({
      platform: p.creative.platform,
      category: p.creative.category,
      format: `${p.creative.format.width}x${p.creative.format.height}`,
      sizeKB: Math.round(p.sizeKB * 10) / 10,
      maxSizeKB: getMaxSizeForCategory(p.creative.platform, p.creative.category),
      isCompliant: p.isCompliant,
      wasCompressed: p.wasCompressed,
    })),
  }
  
  zip.file('compliance_report.json', JSON.stringify(complianceReport, null, 2))
  
  // README
  const readme = `# ${brand} - ${campaign}
Generated: ${new Date().toLocaleString('cs-CZ')}

## Struktura
- /Sklik_CZ/Bannery/ - Bannery pro Sklik (max 150kB)
- /Sklik_CZ/Kombinovana/ - Kombinovaná reklama (max 1MB)
- /Sklik_CZ/Branding/ - Branding formáty (max 500kB)
- /Google_Ads/PMax/ - Performance Max (max 5MB)
- /Google_Ads/Display/ - Display bannery (max 150kB)
- /Video/ - Video formáty

## Compliance
- Celkem: ${complianceReport.summary.total} kreativ
- Vyhovující: ${complianceReport.summary.compliant}
- Komprimované: ${complianceReport.summary.compressed}
- Nevyhovující: ${complianceReport.summary.oversized}

## Poznámky
Soubory označené "_OVERSIZED" přesahují limit a vyžadují ruční úpravu.
`
  
  zip.file('README.txt', readme)
  
  onProgress?.(100, 'Hotovo!')
  
  return await zip.generateAsync({ 
    type: 'blob', 
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
}

/**
 * Vrátí maximální velikost pro danou kategorii
 */
function getMaxSizeForCategory(platform: 'sklik' | 'google', category: string): number {
  const limits: Record<string, Record<string, number>> = {
    sklik: {
      bannery: 150,
      kombinovana: 1024,
      branding: 500,
      html5: 250,
      interscroller: 250,
      video: 102400,
    },
    google: {
      pmax: 5120,
      display: 150,
      responsive: 5120,
      youtube: 256000,
    },
  }
  
  return limits[platform]?.[category] || 150
}

/**
 * Helper: Načte obrázek z URL
 */
function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Helper: Canvas to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob())
    }, type, quality)
  })
}

// ============================================================================
// SIMPLIFIED CREATIVE PACK EXPORT (for App.tsx)
// ============================================================================

import type { Creative } from '@/types'

/**
 * Vytvoří ZIP soubor s kreativami - COMPLIANCE struktura
 * 
 * Struktura:
 * /Sklik_CZ/Bannery_150kB/     (auto-komprimované)
 * /Sklik_CZ/Kombinovana/
 * /Sklik_CZ/Branding/
 * /Google_Ads/PMax/
 * /Google_Ads/Display_150kB/   (auto-komprimované)
 * /Video/
 * compliance_report.json
 */
export async function createCreativePackZip(
  creatives: Creative[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Vytvoř strukturu složek
  const folders = {
    sklik_bannery: zip.folder('Sklik_CZ/Bannery_150kB')!,
    sklik_kombinovana: zip.folder('Sklik_CZ/Kombinovana')!,
    sklik_branding: zip.folder('Sklik_CZ/Branding')!,
    sklik_interscroller: zip.folder('Sklik_CZ/Interscroller')!,
    google_pmax: zip.folder('Google_Ads/PMax')!,
    google_display: zip.folder('Google_Ads/Display_150kB')!,
    google_demandgen: zip.folder('Google_Ads/DemandGen')!,
    video: zip.folder('Video')!,
  }

  const report: {
    summary: { total: number; compliant: number; compressed: number; oversized: number }
    creatives: Array<{
      platform: string
      category: string
      format: string
      sizeKB: number
      maxSizeKB: number
      isCompliant: boolean
      wasCompressed: boolean
    }>
  } = {
    summary: { total: creatives.length, compliant: 0, compressed: 0, oversized: 0 },
    creatives: [],
  }

  let processed = 0

  for (const creative of creatives) {
    const maxSizeKB = getMaxSizeForCategory(creative.platform, creative.category)
    
    // Konvertuj data URL na blob
    const response = await fetch(creative.imageUrl)
    let blob = await response.blob()
    let sizeKB = blob.size / 1024
    let wasCompressed = false

    // Komprimuj pokud je potřeba
    if (sizeKB > maxSizeKB) {
      const compressed = await compressToSize(creative.imageUrl, maxSizeKB)
      blob = compressed.blob
      sizeKB = compressed.sizeKB
      wasCompressed = true
      report.summary.compressed++
    }

    const isCompliant = sizeKB <= maxSizeKB
    if (isCompliant) {
      report.summary.compliant++
    } else {
      report.summary.oversized++
    }

    // Vyber správnou složku
    let folder: ReturnType<typeof zip.folder>
    const folderKey = `${creative.platform}_${creative.category}` as keyof typeof folders
    
    if (creative.platform === 'sklik') {
      switch (creative.category) {
        case 'bannery': folder = folders.sklik_bannery; break
        case 'kombinovana': folder = folders.sklik_kombinovana; break
        case 'branding': folder = folders.sklik_branding; break
        case 'interscroller': folder = folders.sklik_interscroller; break
        default: folder = folders.sklik_bannery
      }
    } else {
      switch (creative.category) {
        case 'pmax': folder = folders.google_pmax; break
        case 'display': folder = folders.google_display; break
        case 'demandgen': folder = folders.google_demandgen; break
        default: folder = folders.google_pmax
      }
    }

    // Název souboru
    const suffix = isCompliant ? '' : '_OVERSIZED'
    const filename = `${creative.format.width}x${creative.format.height}${suffix}.jpg`
    
    folder?.file(filename, blob)

    // Report
    report.creatives.push({
      platform: creative.platform,
      category: creative.category,
      format: `${creative.format.width}x${creative.format.height}`,
      sizeKB: Math.round(sizeKB * 10) / 10,
      maxSizeKB,
      isCompliant,
      wasCompressed,
    })

    processed++
    onProgress?.(Math.round((processed / creatives.length) * 100))
  }

  // Přidej report
  zip.file('compliance_report.json', JSON.stringify(report, null, 2))

  // Přidej README
  const readme = `AdCreative Studio Export
========================
Generated: ${new Date().toISOString()}

Summary:
- Total creatives: ${report.summary.total}
- Compliant: ${report.summary.compliant}
- Compressed: ${report.summary.compressed}
- Oversized (need manual fix): ${report.summary.oversized}

Folder Structure:
- /Sklik_CZ/Bannery_150kB/ - Sklik banners (max 150kB)
- /Sklik_CZ/Kombinovana/ - Sklik responsive (max 2MB)
- /Sklik_CZ/Branding/ - Desktop branding (max 500kB)
- /Google_Ads/PMax/ - Performance Max (max 5MB)
- /Google_Ads/Display_150kB/ - GDN banners (max 150kB)

Files marked with _OVERSIZED need manual optimization.
`
  zip.file('README.txt', readme)

  return await zip.generateAsync({ 
    type: 'blob', 
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })
}
