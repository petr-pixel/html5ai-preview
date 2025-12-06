/**
 * Outpainting Module v3.2 - OpenAI DALL-E 2
 * 
 * Kompletní řešení pro dopočítání prázdných oblastí kolem obrázku.
 * 
 * JAK TO FUNGUJE:
 * 1. DALL-E 2 edit API přijímá PNG s průhledností
 * 2. Průhledné pixely = oblasti kde DALL-E generuje nový obsah
 * 3. Neprůhledné pixely = zachová se originál
 * 4. Stejný PNG se posílá jako "image" i "mask"
 * 
 * OMEZENÍ DALL-E 2:
 * - Pouze čtvercové obrázky: 256x256, 512x512, 1024x1024
 * - Max 4MB velikost souboru
 * - Průhlednost určuje kde generovat
 * 
 * ZMĚNY v3.2:
 * - Integrovaný debug systém
 * - Lepší error handling
 */

import { debug, perfStart, perfEnd, fetchWithRetry } from './debug'

export interface OutpaintParams {
  openaiKey?: string          // OpenAI API klíč
  stabilityKey?: string       // Ignorováno - zpětná kompatibilita
  sourceImage: string         // base64 data URL zdrojového obrázku
  targetWidth: number         // šířka cílového formátu
  targetHeight: number        // výška cílového formátu
  offsetX: number             // posun obrázku v % (-50 až +50)
  offsetY: number             // posun obrázku v % (-50 až +50)
}

export interface OutpaintResult {
  success: boolean
  image?: string              // base64 data URL výsledku
  error?: string
  usedFallback?: boolean      // true = blur, false = AI
  provider?: 'openai' | 'blur'
}

interface ImagePlacement {
  drawX: number
  drawY: number
  drawWidth: number
  drawHeight: number
  needsOutpainting: boolean
  emptyTop: number
  emptyBottom: number
  emptyLeft: number
  emptyRight: number
}

// ============================================================================
// HLAVNÍ FUNKCE
// ============================================================================

/**
 * Dopočítá prázdné oblasti kolem obrázku pomocí AI nebo blur fallbacku
 */
export async function outpaintWithOffset(params: OutpaintParams): Promise<OutpaintResult> {
  const { openaiKey, sourceImage, targetWidth, targetHeight, offsetX, offsetY } = params
  const timerId = perfStart('outpaintWithOffset')
  
  try {
    // 1. Načti zdrojový obrázek
    const srcImg = await loadImage(sourceImage)
    debug.info('Outpaint', 'Source loaded', {
      source: `${srcImg.width}x${srcImg.height}`,
      target: `${targetWidth}x${targetHeight}`,
      offset: `${offsetX}%, ${offsetY}%`,
    })
    
    // 2. Vypočítej placement
    const placement = calculateImagePlacement(
      srcImg.width, srcImg.height,
      targetWidth, targetHeight,
      offsetX, offsetY
    )
    debug.info('Outpaint', 'Empty areas calculated', {
      top: Math.round(placement.emptyTop),
      bottom: Math.round(placement.emptyBottom),
      left: Math.round(placement.emptyLeft),
      right: Math.round(placement.emptyRight),
      needsOutpaint: placement.needsOutpainting,
    })
    
    // 3. Pokud není potřeba outpainting, jen ořízni
    if (!placement.needsOutpainting) {
      debug.info('Outpaint', 'No empty areas - just cropping')
      perfEnd(timerId)
      return renderFinal(srcImg, targetWidth, targetHeight, placement)
    }
    
    // 4. Zkusit DALL-E 2 (pokud máme klíč)
    if (openaiKey) {
      debug.api('Outpaint', 'Trying DALL-E 2 outpaint')
      const result = await dalleOutpaint(srcImg, targetWidth, targetHeight, placement, openaiKey)
      if (result.success) {
        debug.success('Outpaint', 'DALL-E 2 completed', { provider: 'openai' })
        perfEnd(timerId)
        return result
      }
      debug.warn('Outpaint', 'DALL-E 2 failed, using fallback', { error: result.error })
    } else {
      debug.info('Outpaint', 'No API key - using blur fallback')
    }
    
    // 5. Fallback na blur
    debug.info('Outpaint', 'Using blur fallback')
    const result = blurFallback(srcImg, targetWidth, targetHeight, placement)
    perfEnd(timerId)
    return result
    
  } catch (error: any) {
    debug.error('Outpaint', 'Error', { error: error.message })
    
    // Pokus o blur fallback i při chybě
    try {
      const srcImg = await loadImage(sourceImage)
      const placement = calculateImagePlacement(
        srcImg.width, srcImg.height,
        targetWidth, targetHeight,
        offsetX, offsetY
      )
      return blurFallback(srcImg, targetWidth, targetHeight, placement)
    } catch {
      return { success: false, error: error.message || 'Outpainting failed' }
    }
  }
}

// ============================================================================
// DALL-E 2 OUTPAINTING
// ============================================================================

/**
 * DALL-E 2 outpainting
 * 
 * Strategie:
 * 1. Vytvořit 1024x1024 canvas (DALL-E requirement)
 * 2. Nakreslit obrázek tak, aby prázdné oblasti byly průhledné
 * 3. Poslat PNG jako image i mask (stejný soubor!)
 * 4. Extrahovat relevantní část z výsledku
 */
async function dalleOutpaint(
  srcImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  placement: ImagePlacement,
  apiKey: string
): Promise<OutpaintResult> {
  const DALLE_SIZE = 1024
  
  try {
    // Vypočítej scale tak, aby se target vešel do 1024x1024
    const scale = Math.min(
      DALLE_SIZE / targetWidth,
      DALLE_SIZE / targetHeight
    )
    
    // Velikost target formátu v DALL-E souřadnicích
    const scaledTargetW = Math.round(targetWidth * scale)
    const scaledTargetH = Math.round(targetHeight * scale)
    
    // Offset pro vycentrování v 1024x1024
    const offsetX = Math.round((DALLE_SIZE - scaledTargetW) / 2)
    const offsetY = Math.round((DALLE_SIZE - scaledTargetH) / 2)
    
    // Pozice obrázku v DALL-E souřadnicích
    const imgX = offsetX + Math.round(placement.drawX * scale)
    const imgY = offsetY + Math.round(placement.drawY * scale)
    const imgW = Math.round(placement.drawWidth * scale)
    const imgH = Math.round(placement.drawHeight * scale)
    
    debug.info('DALL-E', 'Preparing canvas', {
      scaledTarget: `${scaledTargetW}x${scaledTargetH}`,
      imageRect: { x: imgX, y: imgY, w: imgW, h: imgH },
    })
    
    // Vytvoř canvas pro DALL-E
    const canvas = document.createElement('canvas')
    canvas.width = DALLE_SIZE
    canvas.height = DALLE_SIZE
    const ctx = canvas.getContext('2d')!
    
    // DŮLEŽITÉ: Celý canvas musí být průhledný (RGBA)
    // DALL-E generuje do průhledných oblastí
    ctx.clearRect(0, 0, DALLE_SIZE, DALLE_SIZE)
    
    // Nakresli obrázek na správnou pozici
    ctx.drawImage(srcImg, imgX, imgY, imgW, imgH)
    
    // Konvertuj na PNG blob (zachová průhlednost)
    const pngBlob = await canvasToBlob(canvas, 'image/png')
    debug.info('DALL-E', 'PNG prepared', { size: `${(pngBlob.size / 1024).toFixed(1)}KB` })
    
    // Kontrola velikosti (max 4MB)
    if (pngBlob.size > 4 * 1024 * 1024) {
      debug.error('DALL-E', 'Image too large', { size: `${(pngBlob.size / 1024 / 1024).toFixed(1)}MB` })
      return { success: false, error: 'Image too large for DALL-E (max 4MB)' }
    }
    
    // Volej DALL-E API
    // KLÍČOVÉ: Posíláme STEJNÝ PNG jako image i mask!
    const formData = new FormData()
    formData.append('image', pngBlob, 'image.png')
    formData.append('mask', pngBlob, 'mask.png')  // Stejný soubor!
    formData.append('prompt', 'Seamlessly continue and extend the background, matching the existing colors, lighting, style and texture exactly. Natural, cohesive extension.')
    formData.append('n', '1')
    formData.append('size', '1024x1024')
    formData.append('model', 'dall-e-2')
    
    debug.api('DALL-E', 'Calling edit API')
    
    const response = await fetchWithRetry('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    }, { maxRetries: 2, delayMs: 2000 })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`
      debug.error('DALL-E', 'API error', { status: response.status, error: errorMsg })
      return { success: false, error: errorMsg }
    }
    
    const data = await response.json()
    
    if (!data.data?.[0]) {
      debug.error('DALL-E', 'No image in response')
      return { success: false, error: 'No image in DALL-E response' }
    }
    
    debug.success('DALL-E', 'Image received')
    
    // Získej výsledný obrázek
    let resultDataUrl: string
    if (data.data[0].b64_json) {
      resultDataUrl = `data:image/png;base64,${data.data[0].b64_json}`
    } else if (data.data[0].url) {
      const imgResponse = await fetch(data.data[0].url)
      const imgBlob = await imgResponse.blob()
      resultDataUrl = await blobToDataUrl(imgBlob)
    } else {
      return { success: false, error: 'Invalid DALL-E response format' }
    }
    
    // Načti výsledek
    const resultImg = await loadImage(resultDataUrl)
    
    // Extrahuj správnou část (target formát z 1024x1024)
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = targetWidth
    finalCanvas.height = targetHeight
    const finalCtx = finalCanvas.getContext('2d')!
    
    // Ořízni z DALL-E výstupu oblast odpovídající target formátu
    finalCtx.drawImage(
      resultImg,
      offsetX, offsetY, scaledTargetW, scaledTargetH,  // source rect
      0, 0, targetWidth, targetHeight                   // dest rect
    )
    
    return {
      success: true,
      image: finalCanvas.toDataURL('image/jpeg', 0.92),
      usedFallback: false,
      provider: 'openai'
    }
    
  } catch (error: any) {
    debug.error('DALL-E', 'Exception', { error: error.message })
    return { success: false, error: error.message }
  }
}

// ============================================================================
// BLUR FALLBACK
// ============================================================================

/**
 * Blur fallback - rozmazané pozadí z okrajů obrázku
 * Funguje vždy, zadarmo, lokálně
 */
function blurFallback(
  srcImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  placement: ImagePlacement
): OutpaintResult {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!
  
  // 1. Rozmazané pozadí - roztáhni obrázek přes celý canvas
  ctx.filter = 'blur(50px) saturate(1.2)'
  const overscan = 150
  ctx.drawImage(
    srcImg,
    -overscan, -overscan,
    targetWidth + overscan * 2, targetHeight + overscan * 2
  )
  ctx.filter = 'none'
  
  // 2. Jemný vignette efekt na okrajích
  addVignetteEffect(ctx, targetWidth, targetHeight, placement)
  
  // 3. Ostrý obrázek na správné pozici
  ctx.drawImage(
    srcImg,
    placement.drawX, placement.drawY,
    placement.drawWidth, placement.drawHeight
  )
  
  return {
    success: true,
    image: canvas.toDataURL('image/jpeg', 0.92),
    usedFallback: true,
    provider: 'blur'
  }
}

/**
 * Přidá jemný vignette efekt na prázdné oblasti
 */
function addVignetteEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  placement: ImagePlacement
): void {
  // Horizontální gradient
  if (placement.emptyLeft > 10 || placement.emptyRight > 10) {
    const grad = ctx.createLinearGradient(0, 0, width, 0)
    
    const leftStop = Math.min(0.3, placement.emptyLeft / width)
    const rightStop = Math.max(0.7, 1 - placement.emptyRight / width)
    
    grad.addColorStop(0, 'rgba(0,0,0,0.12)')
    grad.addColorStop(leftStop, 'rgba(0,0,0,0)')
    grad.addColorStop(rightStop, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.12)')
    
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }
  
  // Vertikální gradient
  if (placement.emptyTop > 10 || placement.emptyBottom > 10) {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    
    const topStop = Math.min(0.3, placement.emptyTop / height)
    const bottomStop = Math.max(0.7, 1 - placement.emptyBottom / height)
    
    grad.addColorStop(0, 'rgba(0,0,0,0.08)')
    grad.addColorStop(topStop, 'rgba(0,0,0,0)')
    grad.addColorStop(bottomStop, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.08)')
    
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }
}

// ============================================================================
// POMOCNÉ FUNKCE
// ============================================================================

/**
 * Vypočítá umístění obrázku v cílovém formátu
 */
function calculateImagePlacement(
  srcWidth: number, srcHeight: number,
  targetWidth: number, targetHeight: number,
  offsetXPercent: number, offsetYPercent: number
): ImagePlacement {
  const srcRatio = srcWidth / srcHeight
  const targetRatio = targetWidth / targetHeight
  
  let drawWidth: number, drawHeight: number, baseX: number, baseY: number
  
  if (srcRatio > targetRatio) {
    // Obrázek je širší - škáluj podle výšky
    drawHeight = targetHeight
    drawWidth = targetHeight * srcRatio
    baseX = (targetWidth - drawWidth) / 2
    baseY = 0
  } else {
    // Obrázek je užší - škáluj podle šířky
    drawWidth = targetWidth
    drawHeight = targetWidth / srcRatio
    baseX = 0
    baseY = (targetHeight - drawHeight) / 2
  }
  
  // Aplikuj offset (procenta z velikosti obrázku)
  const drawX = baseX + (offsetXPercent / 100) * drawWidth
  const drawY = baseY + (offsetYPercent / 100) * drawHeight
  
  // Prázdné oblasti (viditelné v target formátu)
  const emptyLeft = Math.max(0, drawX)
  const emptyTop = Math.max(0, drawY)
  const emptyRight = Math.max(0, targetWidth - (drawX + drawWidth))
  const emptyBottom = Math.max(0, targetHeight - (drawY + drawHeight))
  
  // Potřebujeme outpainting pokud je nějaká prázdná oblast > 2px
  const needsOutpainting = emptyLeft > 2 || emptyTop > 2 || emptyRight > 2 || emptyBottom > 2
  
  return {
    drawX, drawY, drawWidth, drawHeight,
    needsOutpainting,
    emptyTop, emptyBottom, emptyLeft, emptyRight
  }
}

/**
 * Renderuje finální obrázek (bez outpaintingu)
 */
function renderFinal(
  srcImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  placement: ImagePlacement
): OutpaintResult {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  
  ctx.drawImage(
    srcImg,
    placement.drawX, placement.drawY,
    placement.drawWidth, placement.drawHeight
  )
  
  return {
    success: true,
    image: canvas.toDataURL('image/jpeg', 0.92),
    usedFallback: false,
    provider: 'blur'
  }
}

/**
 * Načte obrázek z URL/data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Konvertuje canvas na Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas to blob failed')),
      type
    )
  })
}

/**
 * Konvertuje Blob na data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// ============================================================================
// EXPORTOVANÉ UTILITY
// ============================================================================

/**
 * Zkontroluje zda formát potřebuje outpainting
 */
export async function checkNeedsOutpainting(
  sourceImage: string,
  targetWidth: number,
  targetHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
): Promise<{ needs: boolean; emptyAreas: { top: number; bottom: number; left: number; right: number } }> {
  const srcImg = await loadImage(sourceImage)
  const placement = calculateImagePlacement(
    srcImg.width, srcImg.height,
    targetWidth, targetHeight,
    offsetX, offsetY
  )
  
  return {
    needs: placement.needsOutpainting,
    emptyAreas: {
      top: Math.round(placement.emptyTop),
      bottom: Math.round(placement.emptyBottom),
      left: Math.round(placement.emptyLeft),
      right: Math.round(placement.emptyRight),
    }
  }
}

/**
 * Odhad ceny za outpainting
 */
export function getOutpaintCost(provider: 'openai' | 'blur' = 'openai'): number {
  // DALL-E 2 edit: $0.020 za 1024x1024
  return provider === 'openai' ? 0.02 : 0
}
