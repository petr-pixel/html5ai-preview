/**
 * Creative Engine - Generování statických bannerů, HTML5 animací a video příprava
 * Postaveno na OpenAI API (Images, Chat Completions, budoucí Sora)
 */

import type { Format, TextOverlay, Watermark, QRCode } from '@/types'
import { loadImage } from './utils'

// ============================================================================
// TYPY
// ============================================================================

export interface BannerLayout {
  type: 'full-cover' | 'split-left' | 'split-right' | 'text-only'
  imageArea: { x: number; y: number; width: number; height: number }
  textArea: { x: number; y: number; width: number; height: number }
  safeZone: { top: number; right: number; bottom: number; left: number }
}

export interface CompressionResult {
  blob: Blob
  sizeKB: number
  quality: number
  passedLimit: boolean
}

export interface HTML5Template {
  id: string
  name: string
  animation: 'none' | 'fade-in' | 'slide-up' | 'ken-burns' | 'pulse-cta'
  description: string
}

export interface VideoOutput {
  aspectRatio: '16:9' | '1:1' | '9:16'
  lengthSeconds: number
  status: 'pending' | 'generating' | 'done' | 'error'
  url?: string
  thumbnailUrl?: string
}

export interface CreativePackContents {
  static: { format: Format; blob: Blob; filename: string }[]
  html5: { format: Format; zipBlob: Blob; filename: string }[]
  video: { output: VideoOutput; blob?: Blob; filename: string }[]
}

// ============================================================================
// KONSTANTY
// ============================================================================

export const HTML5_TEMPLATES: HTML5Template[] = [
  { id: 'static', name: 'Statický', animation: 'none', description: 'Bez animace, jen obrázek + text' },
  { id: 'fade-in', name: 'Fade In', animation: 'fade-in', description: 'Text se postupně objeví' },
  { id: 'slide-up', name: 'Slide Up', animation: 'slide-up', description: 'Text vyjede zdola' },
  { id: 'ken-burns', name: 'Ken Burns', animation: 'ken-burns', description: 'Pomalý zoom na pozadí' },
  { id: 'pulse-cta', name: 'Pulse CTA', animation: 'pulse-cta', description: 'Pulsující CTA tlačítko' },
]

// Formáty, které preferují split layout (široké bannery)
const SPLIT_LAYOUT_FORMATS = [
  { minRatio: 4, maxRatio: 12 }, // 728x90, 970x90, 468x60 atd.
]

// ============================================================================
// LAYOUT CALCULATION
// ============================================================================

/**
 * Vypočítá optimální layout pro daný formát
 */
export function calculateLayout(format: Format, textOverlay: TextOverlay): BannerLayout {
  const ratio = format.width / format.height
  const isSplitFormat = SPLIT_LAYOUT_FORMATS.some(r => ratio >= r.minRatio && ratio <= r.maxRatio)
  
  // Safe zone - 5% od každého kraje
  const safeZone = {
    top: Math.max(8, format.height * 0.05),
    right: Math.max(8, format.width * 0.05),
    bottom: Math.max(8, format.height * 0.05),
    left: Math.max(8, format.width * 0.05),
  }

  if (isSplitFormat && textOverlay.enabled) {
    // Split layout pro široké bannery - obrázek vlevo, text vpravo
    const splitPoint = format.width * 0.4
    return {
      type: 'split-left',
      imageArea: { x: 0, y: 0, width: splitPoint, height: format.height },
      textArea: { x: splitPoint, y: 0, width: format.width - splitPoint, height: format.height },
      safeZone,
    }
  }

  // Full cover - obrázek přes celý banner
  return {
    type: 'full-cover',
    imageArea: { x: 0, y: 0, width: format.width, height: format.height },
    textArea: { x: safeZone.left, y: safeZone.top, width: format.width - safeZone.left - safeZone.right, height: format.height - safeZone.top - safeZone.bottom },
    safeZone,
  }
}

/**
 * Vypočítá font velikosti podle rozměru banneru
 */
export function calculateFontSizes(format: Format): { headline: number; subheadline: number; cta: number } {
  const baseSize = Math.min(format.width, format.height)
  const scale = baseSize / 300 // Normalizace na 300px jako základ

  return {
    headline: Math.round(Math.max(14, Math.min(72, 28 * scale))),
    subheadline: Math.round(Math.max(10, Math.min(48, 18 * scale))),
    cta: Math.round(Math.max(10, Math.min(36, 14 * scale))),
  }
}

// ============================================================================
// SMART CROP
// ============================================================================

export interface CropSettings {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Vypočítá smart crop ze zdrojového obrázku na cílový formát
 */
export function calculateSmartCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focusPoint: { x: number; y: number } = { x: 0.5, y: 0.5 }
): CropSettings {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  let cropWidth: number
  let cropHeight: number

  if (sourceRatio > targetRatio) {
    // Zdrojový je širší - ořízneme strany
    cropHeight = sourceHeight
    cropWidth = sourceHeight * targetRatio
  } else {
    // Zdrojový je vyšší - ořízneme nahoře/dole
    cropWidth = sourceWidth
    cropHeight = sourceWidth / targetRatio
  }

  // Aplikuj focus point
  const maxX = sourceWidth - cropWidth
  const maxY = sourceHeight - cropHeight
  const x = Math.max(0, Math.min(maxX, (sourceWidth - cropWidth) * focusPoint.x))
  const y = Math.max(0, Math.min(maxY, (sourceHeight - cropHeight) * focusPoint.y))

  return { x, y, width: cropWidth, height: cropHeight }
}

// ============================================================================
// CANVAS RENDERING
// ============================================================================

/**
 * Vykreslí banner na canvas
 */
export async function renderBannerToCanvas(
  sourceImage: string,
  format: Format,
  textOverlay: TextOverlay,
  watermark: Watermark,
  qrCode: QRCode,
  cropSettings?: CropSettings
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = format.width
  canvas.height = format.height
  const ctx = canvas.getContext('2d')!

  const img = await loadImage(sourceImage)
  const layout = calculateLayout(format, textOverlay)
  const fonts = calculateFontSizes(format)

  // Crop settings
  const crop = cropSettings || calculateSmartCrop(img.width, img.height, format.width, format.height)

  // 1. Vykreslení pozadí
  if (layout.type === 'full-cover') {
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, format.width, format.height)
  } else if (layout.type === 'split-left') {
    // Obrázek vlevo
    const imgArea = layout.imageArea
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, imgArea.x, imgArea.y, imgArea.width, imgArea.height)
    // Gradient overlay na textovou část
    const grad = ctx.createLinearGradient(imgArea.width, 0, format.width, 0)
    grad.addColorStop(0, 'rgba(0,0,0,0.8)')
    grad.addColorStop(1, 'rgba(0,0,0,0.95)')
    ctx.fillStyle = grad
    ctx.fillRect(layout.textArea.x, 0, layout.textArea.width, format.height)
  }

  // 2. Overlay gradient pro full-cover s textem
  if (layout.type === 'full-cover' && textOverlay.enabled) {
    const overlayGrad = ctx.createLinearGradient(0, format.height * 0.4, 0, format.height)
    overlayGrad.addColorStop(0, 'rgba(0,0,0,0)')
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.7)')
    ctx.fillStyle = overlayGrad
    ctx.fillRect(0, 0, format.width, format.height)
  }

  // 3. Text overlay
  if (textOverlay.enabled) {
    drawTextOverlay(ctx, format, textOverlay, layout, fonts)
  }

  // 4. Watermark
  if (watermark.enabled && watermark.image) {
    await drawWatermark(ctx, format, watermark)
  }

  // 5. QR kód (pokud je potřeba)
  if (qrCode.enabled && qrCode.url) {
    await drawQRCode(ctx, format, qrCode)
  }

  return canvas
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  format: Format,
  textOverlay: TextOverlay,
  layout: BannerLayout,
  fonts: { headline: number; subheadline: number; cta: number }
) {
  const { safeZone } = layout
  ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  // Pozice podle nastavení
  let x: number
  let y: number
  let align: CanvasTextAlign = 'left'

  if (layout.type === 'split-left') {
    // Text v pravé části
    x = layout.textArea.x + safeZone.left
    y = safeZone.top
    align = 'left'
  } else {
    // Full cover - podle position
    switch (textOverlay.position) {
      case 'top-left':
        x = safeZone.left
        y = safeZone.top
        align = 'left'
        break
      case 'top-center':
        x = format.width / 2
        y = safeZone.top
        align = 'center'
        break
      case 'top-right':
        x = format.width - safeZone.right
        y = safeZone.top
        align = 'right'
        break
      case 'center':
        x = format.width / 2
        y = format.height / 2 - fonts.headline
        align = 'center'
        break
      case 'bottom-left':
        x = safeZone.left
        y = format.height - safeZone.bottom - fonts.headline - fonts.subheadline - fonts.cta - 40
        align = 'left'
        break
      case 'bottom-center':
        x = format.width / 2
        y = format.height - safeZone.bottom - fonts.headline - fonts.subheadline - fonts.cta - 40
        align = 'center'
        break
      case 'bottom-right':
      default:
        x = format.width - safeZone.right
        y = format.height - safeZone.bottom - fonts.headline - fonts.subheadline - fonts.cta - 40
        align = 'right'
        break
    }
  }

  ctx.textAlign = align
  let currentY = y

  // Headline
  if (textOverlay.headline) {
    ctx.font = `bold ${fonts.headline}px Inter, system-ui, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(textOverlay.headline, x, currentY)
    currentY += fonts.headline + 8
  }

  // Subheadline
  if (textOverlay.subheadline) {
    ctx.font = `${fonts.subheadline}px Inter, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText(textOverlay.subheadline, x, currentY)
    currentY += fonts.subheadline + 12
  }

  // CTA Button
  if (textOverlay.cta) {
    ctx.shadowBlur = 0
    ctx.font = `bold ${fonts.cta}px Inter, system-ui, sans-serif`
    const ctaMetrics = ctx.measureText(textOverlay.cta)
    const ctaPadX = fonts.cta * 1.2
    const ctaPadY = fonts.cta * 0.6
    const ctaWidth = ctaMetrics.width + ctaPadX * 2
    const ctaHeight = fonts.cta + ctaPadY * 2

    let ctaX = x
    if (align === 'center') ctaX = x - ctaWidth / 2
    else if (align === 'right') ctaX = x - ctaWidth

    // Button background
    ctx.fillStyle = textOverlay.ctaColor
    ctx.beginPath()
    ctx.roundRect(ctaX, currentY, ctaWidth, ctaHeight, 6)
    ctx.fill()

    // Button text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(textOverlay.cta, ctaX + ctaWidth / 2, currentY + ctaPadY)
  }
}

async function drawWatermark(ctx: CanvasRenderingContext2D, format: Format, watermark: Watermark) {
  if (!watermark.image) return

  try {
    const img = await loadImage(watermark.image)
    const size = (watermark.size / 100) * Math.min(format.width, format.height)
    const aspectRatio = img.width / img.height
    const w = size * aspectRatio
    const h = size
    const margin = 15

    let x = margin
    let y = margin

    switch (watermark.position) {
      case 'top-right':
        x = format.width - w - margin
        break
      case 'bottom-left':
        y = format.height - h - margin
        break
      case 'bottom-right':
        x = format.width - w - margin
        y = format.height - h - margin
        break
      case 'center':
        x = (format.width - w) / 2
        y = (format.height - h) / 2
        break
    }

    ctx.globalAlpha = watermark.opacity
    ctx.drawImage(img, x, y, w, h)
    ctx.globalAlpha = 1
  } catch (e) {
    console.error('Watermark error:', e)
  }
}

async function drawQRCode(ctx: CanvasRenderingContext2D, format: Format, qrCode: QRCode) {
  // QR kód generování - použijeme qrcode knihovnu
  // Pro MVP: placeholder
  const size = qrCode.size
  const margin = qrCode.margin

  let x = margin
  let y = margin

  switch (qrCode.position) {
    case 'top-right':
      x = format.width - size - margin
      break
    case 'bottom-left':
      y = format.height - size - margin
      break
    case 'bottom-right':
      x = format.width - size - margin
      y = format.height - size - margin
      break
  }

  // Placeholder - bílý čtverec s textem QR
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#000000'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('QR', x + size / 2, y + size / 2 + 3)
}

// ============================================================================
// COMPRESSION
// ============================================================================

/**
 * Komprimuje canvas na cílovou velikost
 */
export async function compressToLimit(
  canvas: HTMLCanvasElement,
  maxSizeKB: number,
  preferPNG: boolean = false
): Promise<CompressionResult> {
  // Zkus PNG první (pokud je preference nebo malý banner)
  if (preferPNG || canvas.width * canvas.height < 100000) {
    const pngBlob = await canvasToBlob(canvas, 'image/png')
    const pngSizeKB = pngBlob.size / 1024
    if (pngSizeKB <= maxSizeKB) {
      return { blob: pngBlob, sizeKB: pngSizeKB, quality: 1, passedLimit: true }
    }
  }

  // JPEG s postupnou kompresí
  let quality = 0.92
  let blob: Blob
  let sizeKB: number

  do {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    sizeKB = blob.size / 1024
    quality -= 0.05
  } while (sizeKB > maxSizeKB && quality > 0.3)

  return {
    blob,
    sizeKB,
    quality: quality + 0.05,
    passedLimit: sizeKB <= maxSizeKB,
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas to blob failed'))
      },
      type,
      quality
    )
  })
}

// ============================================================================
// HTML5 GENERATION
// ============================================================================

/**
 * Generuje HTML5 banner jako string
 */
export function generateHTML5Banner(
  format: Format,
  imageBase64: string,
  textOverlay: TextOverlay,
  template: HTML5Template,
  isPMax: boolean = false
): string {
  const fonts = calculateFontSizes(format)
  const animations = getAnimationCSS(template.animation, format)
  const metaTags = isPMax
    ? '<meta name="productType" content="dynamic">\n<meta name="vertical" content="RETAIL">'
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="ad.size" content="width=${format.width},height=${format.height}">
${metaTags}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
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
  ${animations.background}
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
  font-size: ${fonts.headline}px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  ${animations.headline}
}
.subheadline {
  font-size: ${fonts.subheadline}px;
  margin-bottom: 12px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.8);
  opacity: 0.9;
  ${animations.subheadline}
}
.cta {
  display: inline-block;
  background: ${textOverlay.ctaColor};
  color: white;
  padding: ${Math.max(8, fonts.cta * 0.6)}px ${Math.max(16, fonts.cta * 1.2)}px;
  border-radius: 6px;
  font-size: ${fonts.cta}px;
  font-weight: 600;
  ${animations.cta}
}
${animations.keyframes}
</style>
</head>
<body>
<div class="banner" onclick="window.open(window.clickTag || '#')">
  <img class="bg" src="${imageBase64}" alt="">
  <div class="overlay"></div>
  ${textOverlay.enabled ? `
  <div class="content">
    ${textOverlay.headline ? `<div class="headline">${textOverlay.headline}</div>` : ''}
    ${textOverlay.subheadline ? `<div class="subheadline">${textOverlay.subheadline}</div>` : ''}
    ${textOverlay.cta ? `<div class="cta">${textOverlay.cta}</div>` : ''}
  </div>
  ` : ''}
</div>
<script>var clickTag = "";</script>
</body>
</html>`
}

function getAnimationCSS(animation: HTML5Template['animation'], format: Format): {
  background: string
  headline: string
  subheadline: string
  cta: string
  keyframes: string
} {
  const base = { background: '', headline: '', subheadline: '', cta: '', keyframes: '' }

  switch (animation) {
    case 'fade-in':
      return {
        ...base,
        headline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.3s forwards;',
        subheadline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.5s forwards;',
        cta: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.7s forwards;',
        keyframes: '@keyframes fadeIn { to { opacity: 1; } }',
      }

    case 'slide-up':
      return {
        ...base,
        headline: 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.3s forwards;',
        subheadline: 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.5s forwards;',
        cta: 'opacity: 0; transform: translateY(20px); animation: slideUp 0.6s ease-out 0.7s forwards;',
        keyframes: '@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }',
      }

    case 'ken-burns':
      return {
        ...base,
        background: 'animation: kenBurns 8s ease-out forwards;',
        headline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.5s forwards;',
        subheadline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.7s forwards;',
        cta: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.9s forwards;',
        keyframes: `
@keyframes kenBurns { from { transform: scale(1.1); } to { transform: scale(1); } }
@keyframes fadeIn { to { opacity: 1; } }`,
      }

    case 'pulse-cta':
      return {
        ...base,
        headline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.3s forwards;',
        subheadline: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.5s forwards;',
        cta: 'opacity: 0; animation: fadeIn 0.6s ease-out 0.7s forwards, pulse 2s ease-in-out 1.5s infinite;',
        keyframes: `
@keyframes fadeIn { to { opacity: 1; } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`,
      }

    default:
      return base
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Generuje filename podle konvence
 */
export function generateFilename(
  brand: string,
  campaign: string,
  platform: string,
  format: Format,
  lang: string = 'cs',
  variant: string = 'v1',
  extension: string = 'png'
): string {
  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `${sanitize(brand)}_${sanitize(campaign)}_${sanitize(platform)}_${format.width}x${format.height}_${lang}_${variant}.${extension}`
}

/**
 * Kontroluje limity pro platformu
 */
export function checkLimits(sizeKB: number, maxSizeKB: number): { passed: boolean; overBy: number } {
  const passed = sizeKB <= maxSizeKB
  return { passed, overBy: passed ? 0 : sizeKB - maxSizeKB }
}
