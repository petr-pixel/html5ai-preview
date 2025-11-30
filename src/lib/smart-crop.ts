/**
 * Smart Crop Engine
 * 
 * Inteligentní ořezávání obrázků s detekcí hlavního objektu.
 * Využívá kombinaci:
 * 1. Edge detection (Sobel)
 * 2. Color saliency (saturace)
 * 3. Skin tone detection (obličeje)
 * 4. Rule of thirds (kompozice)
 * 5. Entropy analysis (detail/textura)
 */

import type { Format, CropSettings } from '@/types'
import type { CSSProperties } from 'react'

// ============================================================================
// TYPY
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
  faceBoost?: number
  centerBoost?: number
  ruleOfThirdsBoost?: number
  edgePenalty?: number
  debug?: boolean
}

// ============================================================================
// HLAVNÍ FUNKCE
// ============================================================================

/**
 * Vypočítá optimální výřez pro daný formát s pokročilou analýzou
 */
export async function calculateSmartCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  options: SmartCropOptions = {}
): Promise<CropResult> {
  const {
    minScale = 0.5,
    centerBoost = 0.1,
    ruleOfThirdsBoost = 0.3,
    edgePenalty = 0.2,
    debug = false,
  } = options

  const img = await loadImage(imageUrl)
  const sourceWidth = img.width
  const sourceHeight = img.height

  // Zmenši pro rychlejší analýzu
  const analysisScale = Math.min(1, 256 / Math.max(sourceWidth, sourceHeight))
  const analysisWidth = Math.floor(sourceWidth * analysisScale)
  const analysisHeight = Math.floor(sourceHeight * analysisScale)
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = analysisWidth
  canvas.height = analysisHeight
  ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight)
  
  const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight)

  // Vypočítej saliency komponenty
  const edgeMap = calculateEdgeMap(imageData)
  const saturationMap = calculateSaturationMap(imageData)
  const skinMap = calculateSkinMap(imageData)
  const entropyMap = calculateEntropyMap(imageData)

  // Kombinuj s váhami
  const combinedSaliency = combineSaliencyMaps(
    analysisWidth,
    analysisHeight,
    [
      { map: edgeMap, weight: 0.3 },
      { map: saturationMap, weight: 0.2 },
      { map: skinMap, weight: 0.35 },
      { map: entropyMap, weight: 0.15 },
    ]
  )

  // Najdi nejlepší crop
  const targetRatio = targetWidth / targetHeight
  const bestCrop = findBestCrop(
    combinedSaliency,
    analysisWidth,
    analysisHeight,
    targetRatio,
    { minScale, ruleOfThirdsBoost, edgePenalty }
  )

  // Škáluj zpět
  const scaleFactor = 1 / analysisScale
  const finalCrop: CropResult = {
    x: Math.round(bestCrop.x * scaleFactor),
    y: Math.round(bestCrop.y * scaleFactor),
    width: Math.round(bestCrop.width * scaleFactor),
    height: Math.round(bestCrop.height * scaleFactor),
    confidence: bestCrop.confidence,
  }

  if (debug) {
    drawDebugHeatmap(combinedSaliency, analysisWidth, analysisHeight)
  }

  // Aplikuj center boost
  const focusX = (finalCrop.x + finalCrop.width / 2) / sourceWidth
  const focusY = (finalCrop.y + finalCrop.height / 2) / sourceHeight
  
  const adjustedFocusX = focusX * (1 - centerBoost) + 0.5 * centerBoost
  const adjustedFocusY = focusY * (1 - centerBoost) + 0.5 * centerBoost

  const adjustedCrop = calculateCropFromFocus(
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    adjustedFocusX,
    adjustedFocusY,
    minScale
  )

  return {
    ...adjustedCrop,
    confidence: finalCrop.confidence,
  }
}

/**
 * Batch smart crop - zpracuje více formátů najednou
 */
export async function calculateSmartCropBatch(
  imageUrl: string,
  formats: Array<{ width: number; height: number; key: string }>,
  options: SmartCropOptions = {}
): Promise<Map<string, CropResult>> {
  const results = new Map<string, CropResult>()
  
  const img = await loadImage(imageUrl)
  const sourceWidth = img.width
  const sourceHeight = img.height

  const analysisScale = Math.min(1, 256 / Math.max(sourceWidth, sourceHeight))
  const analysisWidth = Math.floor(sourceWidth * analysisScale)
  const analysisHeight = Math.floor(sourceHeight * analysisScale)
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = analysisWidth
  canvas.height = analysisHeight
  ctx.drawImage(img, 0, 0, analysisWidth, analysisHeight)
  
  const imageData = ctx.getImageData(0, 0, analysisWidth, analysisHeight)

  const edgeMap = calculateEdgeMap(imageData)
  const saturationMap = calculateSaturationMap(imageData)
  const skinMap = calculateSkinMap(imageData)
  const entropyMap = calculateEntropyMap(imageData)

  const combinedSaliency = combineSaliencyMaps(
    analysisWidth,
    analysisHeight,
    [
      { map: edgeMap, weight: 0.3 },
      { map: saturationMap, weight: 0.2 },
      { map: skinMap, weight: 0.35 },
      { map: entropyMap, weight: 0.15 },
    ]
  )

  for (const format of formats) {
    const targetRatio = format.width / format.height
    
    const bestCrop = findBestCrop(
      combinedSaliency,
      analysisWidth,
      analysisHeight,
      targetRatio,
      {
        minScale: options.minScale || 0.5,
        ruleOfThirdsBoost: options.ruleOfThirdsBoost || 0.3,
        edgePenalty: options.edgePenalty || 0.2,
      }
    )

    const scaleFactor = 1 / analysisScale
    results.set(format.key, {
      x: Math.round(bestCrop.x * scaleFactor),
      y: Math.round(bestCrop.y * scaleFactor),
      width: Math.round(bestCrop.width * scaleFactor),
      height: Math.round(bestCrop.height * scaleFactor),
      confidence: bestCrop.confidence,
    })
  }

  return results
}

/**
 * Sliding window pro nalezení nejlepšího cropu
 */
function findBestCrop(
  saliency: number[][],
  width: number,
  height: number,
  targetRatio: number,
  options: { minScale: number; ruleOfThirdsBoost: number; edgePenalty: number }
): CropResult {
  const { minScale, ruleOfThirdsBoost, edgePenalty } = options
  
  let bestScore = -Infinity
  let bestCrop: CropResult = { x: 0, y: 0, width, height, confidence: 0 }

  const scales = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5].filter(s => s >= minScale)
  const steps = 10

  for (const scale of scales) {
    let cropWidth: number
    let cropHeight: number
    
    const sourceRatio = width / height
    
    if (sourceRatio > targetRatio) {
      cropHeight = Math.floor(height * scale)
      cropWidth = Math.floor(cropHeight * targetRatio)
    } else {
      cropWidth = Math.floor(width * scale)
      cropHeight = Math.floor(cropWidth / targetRatio)
    }

    cropWidth = Math.min(cropWidth, width)
    cropHeight = Math.min(cropHeight, height)

    const maxX = width - cropWidth
    const maxY = height - cropHeight
    
    const stepX = Math.max(1, Math.floor(maxX / steps))
    const stepY = Math.max(1, Math.floor(maxY / steps))

    for (let y = 0; y <= maxY; y += stepY) {
      for (let x = 0; x <= maxX; x += stepX) {
        const score = scoreCrop(
          saliency, x, y, cropWidth, cropHeight,
          width, height, ruleOfThirdsBoost, edgePenalty
        )

        if (score > bestScore) {
          bestScore = score
          bestCrop = {
            x, y,
            width: cropWidth,
            height: cropHeight,
            confidence: Math.min(1, score / 100),
          }
        }
      }
    }
  }

  return bestCrop
}

/**
 * Ohodnotí kvalitu cropu
 */
function scoreCrop(
  saliency: number[][],
  x: number, y: number,
  cropWidth: number, cropHeight: number,
  imageWidth: number, imageHeight: number,
  ruleOfThirdsBoost: number,
  edgePenalty: number
): number {
  let totalSaliency = 0
  let pixelCount = 0

  for (let cy = y; cy < y + cropHeight && cy < saliency.length; cy++) {
    for (let cx = x; cx < x + cropWidth && cx < saliency[cy].length; cx++) {
      totalSaliency += saliency[cy][cx]
      pixelCount++
    }
  }

  const avgSaliency = pixelCount > 0 ? totalSaliency / pixelCount : 0

  // Rule of thirds
  const centerX = x + cropWidth / 2
  const centerY = y + cropHeight / 2
  
  const thirds = [
    { x: imageWidth / 3, y: imageHeight / 3 },
    { x: imageWidth * 2 / 3, y: imageHeight / 3 },
    { x: imageWidth / 3, y: imageHeight * 2 / 3 },
    { x: imageWidth * 2 / 3, y: imageHeight * 2 / 3 },
  ]

  let minThirdsDist = Infinity
  for (const point of thirds) {
    const dist = Math.sqrt(
      Math.pow(centerX - point.x, 2) + Math.pow(centerY - point.y, 2)
    )
    minThirdsDist = Math.min(minThirdsDist, dist)
  }
  
  const maxDist = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight)
  const thirdsScore = (1 - minThirdsDist / maxDist) * ruleOfThirdsBoost * 100

  // Edge penalty
  let edgeLoss = 0
  if (y > 0) {
    for (let cx = x; cx < x + cropWidth && cx < saliency[0].length; cx++) {
      for (let ey = 0; ey < y && ey < saliency.length; ey++) {
        edgeLoss += saliency[ey][cx]
      }
    }
  }
  
  for (let cy = y + cropHeight; cy < imageHeight && cy < saliency.length; cy++) {
    for (let cx = x; cx < x + cropWidth && cx < saliency[cy].length; cx++) {
      edgeLoss += saliency[cy][cx]
    }
  }

  const edgePenaltyScore = edgeLoss * edgePenalty / 1000

  return avgSaliency + thirdsScore - edgePenaltyScore
}

// ============================================================================
// SALIENCY MAPY
// ============================================================================

function calculateEdgeMap(imageData: ImageData): number[][] {
  const { width, height, data } = imageData
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(0))

  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0
      let gy = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
          gx += gray * sobelX[ky + 1][kx + 1]
          gy += gray * sobelY[ky + 1][kx + 1]
        }
      }

      map[y][x] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  return normalizeMap(map)
}

function calculateSaturationMap(imageData: ImageData): number[][] {
  const { width, height, data } = imageData
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(0))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max

      map[y][x] = saturation * 100
    }
  }

  return normalizeMap(map)
}

function calculateSkinMap(imageData: ImageData): number[][] {
  const { width, height, data } = imageData
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(0))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      if (isSkinTone(r, g, b)) {
        map[y][x] = 100
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              map[ny][nx] = Math.max(map[ny][nx], 50)
            }
          }
        }
      }
    }
  }

  return normalizeMap(map)
}

function calculateEntropyMap(imageData: ImageData): number[][] {
  const { width, height, data } = imageData
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(0))
  const windowSize = 4

  for (let y = windowSize; y < height - windowSize; y += 2) {
    for (let x = windowSize; x < width - windowSize; x += 2) {
      const histogram = new Array(256).fill(0)
      let pixelCount = 0

      for (let wy = -windowSize; wy <= windowSize; wy++) {
        for (let wx = -windowSize; wx <= windowSize; wx++) {
          const idx = ((y + wy) * width + (x + wx)) * 4
          const gray = Math.floor((data[idx] + data[idx + 1] + data[idx + 2]) / 3)
          histogram[gray]++
          pixelCount++
        }
      }

      let entropy = 0
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > 0) {
          const p = histogram[i] / pixelCount
          entropy -= p * Math.log2(p)
        }
      }

      for (let ey = y - 1; ey <= y + 1; ey++) {
        for (let ex = x - 1; ex <= x + 1; ex++) {
          if (ey >= 0 && ey < height && ex >= 0 && ex < width) {
            map[ey][ex] = Math.max(map[ey][ex], entropy * 12.5)
          }
        }
      }
    }
  }

  return normalizeMap(map)
}

function combineSaliencyMaps(
  width: number,
  height: number,
  maps: Array<{ map: number[][]; weight: number }>
): number[][] {
  const combined: number[][] = Array(height).fill(null).map(() => Array(width).fill(0))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0
      for (const { map, weight } of maps) {
        total += (map[y]?.[x] || 0) * weight
      }
      combined[y][x] = total
    }
  }

  return combined
}

function normalizeMap(map: number[][]): number[][] {
  let max = 0
  for (const row of map) {
    for (const val of row) {
      max = Math.max(max, val)
    }
  }
  if (max === 0) return map
  return map.map(row => row.map(val => (val / max) * 100))
}

function isSkinTone(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
  return y > 80 && cb > 77 && cb < 127 && cr > 133 && cr < 173
}

function drawDebugHeatmap(saliency: number[][], width: number, height: number): void {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const value = saliency[y]?.[x] || 0
      
      if (value < 50) {
        imageData.data[idx] = 0
        imageData.data[idx + 1] = Math.floor(value * 5.1)
        imageData.data[idx + 2] = Math.floor(255 - value * 5.1)
      } else {
        imageData.data[idx] = Math.floor((value - 50) * 5.1)
        imageData.data[idx + 1] = Math.floor(255 - (value - 50) * 5.1)
        imageData.data[idx + 2] = 0
      }
      imageData.data[idx + 3] = 200
    }
  }

  ctx.putImageData(imageData, 0, 0)
  canvas.style.cssText = 'position:fixed;bottom:10px;right:10px;border:2px solid white;z-index:9999'
  document.body.appendChild(canvas)
  setTimeout(() => canvas.remove(), 5000)
}

// ============================================================================
// POMOCNÉ FUNKCE
// ============================================================================

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function calculateCropFromFocus(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  focusX: number,
  focusY: number,
  minScale: number = 0.5
): { x: number; y: number; width: number; height: number } {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  let cropWidth: number
  let cropHeight: number

  if (sourceRatio > targetRatio) {
    cropHeight = sourceHeight
    cropWidth = cropHeight * targetRatio
  } else {
    cropWidth = sourceWidth
    cropHeight = cropWidth / targetRatio
  }

  cropWidth = Math.max(cropWidth, sourceWidth * minScale)
  cropHeight = Math.max(cropHeight, sourceHeight * minScale)

  const maxX = sourceWidth - cropWidth
  const maxY = sourceHeight - cropHeight

  const x = Math.max(0, Math.min(maxX, focusX * sourceWidth - cropWidth / 2))
  const y = Math.max(0, Math.min(maxY, focusY * sourceHeight - cropHeight / 2))

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  }
}

export function checkSafeZoneViolation(
  format: Format,
  textPosition: { x: number; y: number; width: number; height: number }
): { isViolation: boolean; message?: string } {
  if (!format.safeZone) return { isViolation: false }

  const safeZone = format.safeZone
  const safeLeft = safeZone.left
  const safeTop = safeZone.top
  const safeRight = format.width - safeZone.right
  const safeBottom = format.height - safeZone.bottom

  const textRight = textPosition.x + textPosition.width
  const textBottom = textPosition.y + textPosition.height

  const isInside = (
    textPosition.x >= safeLeft &&
    textPosition.y >= safeTop &&
    textRight <= safeRight &&
    textBottom <= safeBottom
  )

  if (!isInside) {
    return {
      isViolation: true,
      message: safeZone.description || 'Text zasahuje do ochranné zóny',
    }
  }

  return { isViolation: false }
}

export function getSafeZoneOverlayStyles(format: Format): {
  topOverlay: CSSProperties
  bottomOverlay: CSSProperties
  leftOverlay: CSSProperties
  rightOverlay: CSSProperties
  safeArea: CSSProperties
} | null {
  if (!format.safeZone) return null

  const { safeZone } = format
  const { width, height } = format

  const topPct = (safeZone.top / height) * 100
  const bottomPct = (safeZone.bottom / height) * 100
  const leftPct = (safeZone.left / width) * 100
  const rightPct = (safeZone.right / width) * 100

  const dangerColor = 'rgba(239, 68, 68, 0.3)'
  const borderColor = 'rgba(239, 68, 68, 0.8)'

  return {
    topOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0,
      height: `${topPct}%`, background: dangerColor, pointerEvents: 'none',
    },
    bottomOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: `${bottomPct}%`, background: dangerColor, pointerEvents: 'none',
    },
    leftOverlay: {
      position: 'absolute', top: `${topPct}%`, left: 0,
      width: `${leftPct}%`, height: `${100 - topPct - bottomPct}%`,
      background: dangerColor, pointerEvents: 'none',
    },
    rightOverlay: {
      position: 'absolute', top: `${topPct}%`, right: 0,
      width: `${rightPct}%`, height: `${100 - topPct - bottomPct}%`,
      background: dangerColor, pointerEvents: 'none',
    },
    safeArea: {
      position: 'absolute',
      top: `${topPct}%`, left: `${leftPct}%`, right: `${rightPct}%`, bottom: `${bottomPct}%`,
      border: `2px dashed ${borderColor}`, pointerEvents: 'none',
    },
  }
}

export async function applyCrop(
  imageUrl: string,
  crop: CropResult,
  outputWidth: number,
  outputHeight: number
): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  canvas.width = outputWidth
  canvas.height = outputHeight

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight)

  return canvas
}

export function cropSettingsToResult(
  settings: CropSettings,
  _sourceWidth: number,
  _sourceHeight: number
): CropResult {
  return {
    x: settings.x,
    y: settings.y,
    width: settings.width,
    height: settings.height,
    confidence: 1,
  }
}

export function focusPointToCropSettings(
  focusX: number,
  focusY: number,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): CropSettings {
  const crop = calculateCropFromFocus(
    sourceWidth, sourceHeight, targetWidth, targetHeight, focusX, focusY
  )
  return { x: crop.x, y: crop.y, width: crop.width, height: crop.height, focusX, focusY }
}
