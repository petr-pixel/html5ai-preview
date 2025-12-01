/**
 * Smart Crop - Inteligentní ořez obrázků
 * 
 * Používá knihovnu smartcrop.js pro detekci hlavního objektu (produkt/obličej)
 * a automatické nastavení ořezu pro každý formát.
 * 
 * @see https://github.com/jwagner/smartcrop.js
 */

// @ts-expect-error - smartcrop nemá typy
import smartcrop from 'smartcrop'

// ============================================================================
// TYPES
// ============================================================================

export interface CropResult {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

export interface SmartCropOptions {
  minScale?: number
  boost?: Array<{
    x: number
    y: number
    width: number
    height: number
    weight: number
  }>
  ruleOfThirds?: boolean
  debug?: boolean
}

export interface BatchCropResult {
  formatKey: string
  width: number
  height: number
  crop: CropResult
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Vypočítá optimální ořez pro daný obrázek a cílové rozměry
 */
export async function calculateSmartCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  options: SmartCropOptions = {}
): Promise<CropResult> {
  try {
    // Načti obrázek
    const img = await loadImage(imageUrl)
    
    // Spusť smartcrop
    const result = await smartcrop.crop(img, {
      width: targetWidth,
      height: targetHeight,
      minScale: options.minScale ?? 0.5,
      ruleOfThirds: options.ruleOfThirds ?? true,
      boost: options.boost,
      debug: options.debug ?? false,
    })

    const crop = result.topCrop

    return {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
      confidence: crop.score?.total ?? 0,
    }
  } catch (error) {
    console.warn('SmartCrop failed, using fallback:', error)
    return fallbackCrop(imageUrl, targetWidth, targetHeight)
  }
}

/**
 * Batch processing - vypočítá ořezy pro více formátů najednou
 * Efektivnější než volat calculateSmartCrop opakovaně
 */
export async function calculateSmartCropBatch(
  imageUrl: string,
  formats: Array<{ key: string; width: number; height: number }>,
  options: SmartCropOptions = {}
): Promise<Map<string, CropResult>> {
  const results = new Map<string, CropResult>()

  try {
    const img = await loadImage(imageUrl)

    for (const format of formats) {
      try {
        const result = await smartcrop.crop(img, {
          width: format.width,
          height: format.height,
          minScale: options.minScale ?? 0.5,
          ruleOfThirds: options.ruleOfThirds ?? true,
        })

        const crop = result.topCrop
        results.set(format.key, {
          x: crop.x,
          y: crop.y,
          width: crop.width,
          height: crop.height,
          confidence: crop.score?.total ?? 0,
        })
      } catch {
        // Fallback pro tento formát
        const fallback = await fallbackCrop(imageUrl, format.width, format.height)
        results.set(format.key, fallback)
      }
    }
  } catch (error) {
    console.error('Batch crop failed:', error)
    // Fallback pro všechny formáty
    for (const format of formats) {
      const fallback = await fallbackCrop(imageUrl, format.width, format.height)
      results.set(format.key, fallback)
    }
  }

  return results
}

/**
 * Analyzuje obrázek a vrátí oblasti zájmu (faces, products, etc.)
 */
export async function analyzeImage(imageUrl: string): Promise<{
  width: number
  height: number
  aspectRatio: number
  suggestedCrops: Array<{
    ratio: string
    crop: CropResult
  }>
}> {
  const img = await loadImage(imageUrl)

  const commonRatios = [
    { ratio: '1:1', width: 1, height: 1 },
    { ratio: '16:9', width: 16, height: 9 },
    { ratio: '4:5', width: 4, height: 5 },
    { ratio: '1.91:1', width: 1.91, height: 1 },
    { ratio: '9:16', width: 9, height: 16 },
  ]

  const suggestedCrops: Array<{ ratio: string; crop: CropResult }> = []

  for (const r of commonRatios) {
    // Vypočítej cílové rozměry zachovávající poměr stran
    const targetWidth = Math.round(Math.min(img.width, img.height * (r.width / r.height)))
    const targetHeight = Math.round(targetWidth * (r.height / r.width))

    try {
      const result = await smartcrop.crop(img, {
        width: targetWidth,
        height: targetHeight,
      })

      suggestedCrops.push({
        ratio: r.ratio,
        crop: {
          x: result.topCrop.x,
          y: result.topCrop.y,
          width: result.topCrop.width,
          height: result.topCrop.height,
          confidence: result.topCrop.score?.total ?? 0,
        },
      })
    } catch {
      // Skip this ratio
    }
  }

  return {
    width: img.width,
    height: img.height,
    aspectRatio: img.width / img.height,
    suggestedCrops,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Načte obrázek jako HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

/**
 * Fallback crop - středový ořez když smartcrop selže
 */
async function fallbackCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  const img = await loadImage(imageUrl)

  const srcRatio = img.width / img.height
  const tgtRatio = targetWidth / targetHeight

  let cropWidth: number
  let cropHeight: number
  let cropX: number
  let cropY: number

  if (srcRatio > tgtRatio) {
    // Obrázek je širší - oříznout strany
    cropHeight = img.height
    cropWidth = img.height * tgtRatio
    cropX = (img.width - cropWidth) / 2
    cropY = 0
  } else {
    // Obrázek je vyšší - oříznout nahoře/dole
    cropWidth = img.width
    cropHeight = img.width / tgtRatio
    cropX = 0
    cropY = (img.height - cropHeight) / 2
  }

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    confidence: 0.5, // Nízká confidence pro fallback
  }
}

/**
 * Aplikuje ořez na obrázek a vrátí data URL
 */
export async function applyCrop(
  imageUrl: string,
  crop: CropResult,
  outputWidth: number,
  outputHeight: number,
  quality: number = 0.92
): Promise<string> {
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, outputWidth, outputHeight
  )

  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Generuje debug vizualizaci cropu
 */
export async function generateCropDebugImage(
  imageUrl: string,
  crops: Array<{ label: string; crop: CropResult; color: string }>
): Promise<string> {
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!

  // Nakresli obrázek
  ctx.drawImage(img, 0, 0)

  // Nakresli crop oblasti
  for (const { label, crop, color } of crops) {
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)

    // Label
    ctx.fillStyle = color
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(label, crop.x + 5, crop.y + 20)
  }

  return canvas.toDataURL('image/png')
}
