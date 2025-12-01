/**
 * Outpainting Module - Dopočítání POUZE prázdných oblastí
 * 
 * FLOW:
 * 1. Uživatel posune obrázek v editoru (offset)
 * 2. Tento modul vytvoří canvas s obrázkem na správné pozici
 * 3. Prázdné oblasti jsou PRŮHLEDNÉ (alpha = 0)
 * 4. DALL-E 2 dogeneruje pouze průhledné oblasti
 * 5. Výsledek se ořízne na cílový formát
 */

export interface OutpaintParams {
  apiKey: string
  sourceImage: string        // base64 data URL zdrojového obrázku
  targetWidth: number        // šířka cílového formátu (např. 1200)
  targetHeight: number       // výška cílového formátu (např. 300)
  offsetX: number            // posun obrázku v % (-50 až +50)
  offsetY: number            // posun obrázku v % (-50 až +50)
}

export interface OutpaintResult {
  success: boolean
  image?: string             // base64 data URL výsledku
  error?: string
  usedFallback?: boolean     // true pokud se použil blur místo AI
}

/**
 * Hlavní funkce - dopočítá prázdné oblasti kolem obrázku
 */
export async function outpaintWithOffset(params: OutpaintParams): Promise<OutpaintResult> {
  const { apiKey, sourceImage, targetWidth, targetHeight, offsetX, offsetY } = params
  
  try {
    // 1. Načti zdrojový obrázek
    const srcImg = await loadImage(sourceImage)
    console.log('[Outpaint] Source image:', srcImg.width, 'x', srcImg.height)
    
    // 2. Vypočítej pozici obrázku v cílovém formátu
    const placement = calculateImagePlacement(
      srcImg.width, srcImg.height,
      targetWidth, targetHeight,
      offsetX, offsetY
    )
    console.log('[Outpaint] Placement:', placement)
    
    // 3. Zkontroluj zda vůbec potřebujeme outpainting
    if (!placement.needsOutpainting) {
      console.log('[Outpaint] No outpainting needed, just cropping')
      return cropOnly(srcImg, targetWidth, targetHeight, placement)
    }
    
    // 4. Připrav obrázek pro DALL-E (1024x1024 s průhlednými oblastmi)
    const dalleCanvas = prepareDalleCanvas(srcImg, targetWidth, targetHeight, placement)
    const dalleBlob = await canvasToBlob(dalleCanvas, 'image/png')
    
    // 5. Zavolej DALL-E 2 edit API
    console.log('[Outpaint] Calling DALL-E 2 API...')
    const formData = new FormData()
    formData.append('image', dalleBlob, 'image.png')
    formData.append('prompt', 'Continue the background seamlessly. Match the existing colors, lighting, style and texture exactly. Do not add any new objects, people, or subjects. Only extend the existing background.')
    formData.append('model', 'dall-e-2')
    formData.append('n', '1')
    formData.append('size', '1024x1024')
    formData.append('response_format', 'b64_json')
    
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.warn('[Outpaint] DALL-E API failed:', error)
      return blurFallback(srcImg, targetWidth, targetHeight, placement)
    }
    
    const data = await response.json()
    const resultB64 = data.data?.[0]?.b64_json
    
    if (!resultB64) {
      console.warn('[Outpaint] No result from DALL-E')
      return blurFallback(srcImg, targetWidth, targetHeight, placement)
    }
    
    // 6. Ořízni výsledek na cílový formát
    const resultImg = await loadImage(`data:image/png;base64,${resultB64}`)
    const finalImage = cropDalleResult(resultImg, targetWidth, targetHeight, dalleCanvas.scale, dalleCanvas.offsetX, dalleCanvas.offsetY)
    
    console.log('[Outpaint] Success!')
    return { success: true, image: finalImage }
    
  } catch (error: any) {
    console.error('[Outpaint] Error:', error)
    
    // Fallback na blur
    try {
      const srcImg = await loadImage(sourceImage)
      const placement = calculateImagePlacement(
        srcImg.width, srcImg.height,
        targetWidth, targetHeight,
        offsetX, offsetY
      )
      return blurFallback(srcImg, targetWidth, targetHeight, placement)
    } catch {
      return { success: false, error: error.message }
    }
  }
}

/**
 * Vypočítá kam se zdrojový obrázek nakreslí v cílovém formátu
 */
interface ImagePlacement {
  drawX: number      // X pozice kde začíná obrázek
  drawY: number      // Y pozice kde začíná obrázek
  drawWidth: number  // šířka nakresleného obrázku
  drawHeight: number // výška nakresleného obrázku
  needsOutpainting: boolean // true pokud jsou prázdné oblasti
  emptyTop: number   // prázdná oblast nahoře (px)
  emptyBottom: number
  emptyLeft: number
  emptyRight: number
}

function calculateImagePlacement(
  srcWidth: number, srcHeight: number,
  targetWidth: number, targetHeight: number,
  offsetX: number, offsetY: number
): ImagePlacement {
  const srcRatio = srcWidth / srcHeight
  const targetRatio = targetWidth / targetHeight
  
  let drawWidth: number, drawHeight: number, baseX: number, baseY: number
  
  if (srcRatio > targetRatio) {
    // Zdrojový obrázek je širší - škáluje se na výšku targetu
    drawHeight = targetHeight
    drawWidth = targetHeight * srcRatio
    baseX = (targetWidth - drawWidth) / 2  // Centrováno horizontálně
    baseY = 0
  } else {
    // Zdrojový obrázek je užší - škáluje se na šířku targetu
    drawWidth = targetWidth
    drawHeight = targetWidth / srcRatio
    baseX = 0
    baseY = (targetHeight - drawHeight) / 2  // Centrováno vertikálně
  }
  
  // Aplikuj offset (v procentech velikosti obrázku)
  const drawX = baseX + (offsetX / 100) * drawWidth
  const drawY = baseY + (offsetY / 100) * drawHeight
  
  // Vypočítej prázdné oblasti
  const emptyLeft = Math.max(0, -drawX)
  const emptyTop = Math.max(0, -drawY)
  const emptyRight = Math.max(0, (drawX + drawWidth) - targetWidth)
  const emptyBottom = Math.max(0, (drawY + drawHeight) - targetHeight)
  
  // Potřebujeme outpainting pokud jsou nějaké prázdné oblasti VIDITELNÉ v targetu
  const visibleEmptyLeft = Math.max(0, drawX)
  const visibleEmptyTop = Math.max(0, drawY)
  const visibleEmptyRight = Math.max(0, targetWidth - (drawX + drawWidth))
  const visibleEmptyBottom = Math.max(0, targetHeight - (drawY + drawHeight))
  
  const needsOutpainting = visibleEmptyLeft > 1 || visibleEmptyTop > 1 || 
                           visibleEmptyRight > 1 || visibleEmptyBottom > 1
  
  return {
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    needsOutpainting,
    emptyTop: visibleEmptyTop,
    emptyBottom: visibleEmptyBottom,
    emptyLeft: visibleEmptyLeft,
    emptyRight: visibleEmptyRight,
  }
}

/**
 * Připraví 1024x1024 canvas pro DALL-E s průhlednými oblastmi
 */
function prepareDalleCanvas(
  srcImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  placement: ImagePlacement
): HTMLCanvasElement & { scale: number; offsetX: number; offsetY: number } {
  const dalleSize = 1024
  
  // Škálování: celý target formát se musí vejít do 1024x1024
  const scale = dalleSize / Math.max(targetWidth, targetHeight)
  
  // Pozice target oblasti v DALL-E canvasu (centrovaná)
  const dalleTargetW = targetWidth * scale
  const dalleTargetH = targetHeight * scale
  const dalleOffsetX = (dalleSize - dalleTargetW) / 2
  const dalleOffsetY = (dalleSize - dalleTargetH) / 2
  
  // Pozice zdrojového obrázku v DALL-E prostoru
  const dalleDrawX = dalleOffsetX + placement.drawX * scale
  const dalleDrawY = dalleOffsetY + placement.drawY * scale
  const dalleDrawW = placement.drawWidth * scale
  const dalleDrawH = placement.drawHeight * scale
  
  // Vytvoř canvas
  const canvas = document.createElement('canvas') as HTMLCanvasElement & { scale: number; offsetX: number; offsetY: number }
  canvas.width = dalleSize
  canvas.height = dalleSize
  canvas.scale = scale
  canvas.offsetX = dalleOffsetX
  canvas.offsetY = dalleOffsetY
  
  const ctx = canvas.getContext('2d')!
  
  // Celý canvas PRŮHLEDNÝ (DALL-E dogeneruje průhledné oblasti)
  ctx.clearRect(0, 0, dalleSize, dalleSize)
  
  // Nakresli zdrojový obrázek na správnou pozici
  // Ořízneme část obrázku která je mimo target oblast
  const srcClipX = Math.max(0, -placement.drawX) / placement.drawWidth * srcImg.width
  const srcClipY = Math.max(0, -placement.drawY) / placement.drawHeight * srcImg.height
  const srcClipW = Math.min(placement.drawWidth, targetWidth - Math.max(0, placement.drawX)) / placement.drawWidth * srcImg.width
  const srcClipH = Math.min(placement.drawHeight, targetHeight - Math.max(0, placement.drawY)) / placement.drawHeight * srcImg.height
  
  const destX = dalleOffsetX + Math.max(0, placement.drawX) * scale
  const destY = dalleOffsetY + Math.max(0, placement.drawY) * scale
  const destW = srcClipW / srcImg.width * dalleDrawW
  const destH = srcClipH / srcImg.height * dalleDrawH
  
  ctx.drawImage(
    srcImg,
    srcClipX, srcClipY, srcClipW, srcClipH,  // source rect
    destX, destY, destW, destH                // dest rect
  )
  
  return canvas
}

/**
 * Ořízne DALL-E výsledek na cílový formát
 */
function cropDalleResult(
  resultImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  scale: number,
  dalleOffsetX: number,
  dalleOffsetY: number
): string {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')!
  
  const srcW = targetWidth * scale
  const srcH = targetHeight * scale
  
  ctx.drawImage(
    resultImg,
    dalleOffsetX, dalleOffsetY, srcW, srcH,  // source rect (oblast v DALL-E výstupu)
    0, 0, targetWidth, targetHeight           // dest rect (celý cílový canvas)
  )
  
  return canvas.toDataURL('image/png')
}

/**
 * Pouze ořízne obrázek bez outpaintingu
 */
function cropOnly(
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
  ctx.drawImage(srcImg, placement.drawX, placement.drawY, placement.drawWidth, placement.drawHeight)
  
  return { success: true, image: canvas.toDataURL('image/png') }
}

/**
 * Fallback - rozmazané pozadí místo AI
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
  
  // 1. Rozmazané pozadí přes celý canvas
  ctx.filter = 'blur(60px) saturate(1.1)'
  ctx.drawImage(srcImg, -100, -100, targetWidth + 200, targetHeight + 200)
  ctx.filter = 'none'
  
  // 2. Ostrý obrázek na správnou pozici
  ctx.drawImage(srcImg, placement.drawX, placement.drawY, placement.drawWidth, placement.drawHeight)
  
  return { success: true, image: canvas.toDataURL('image/png'), usedFallback: true }
}

// Helpers
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas to blob failed'))
    }, type)
  })
}

/**
 * Renderuje obrázek do cílového formátu BEZ outpaintingu (pro preview a finální uložení)
 */
export function renderImageToFormat(
  sourceImage: string,
  targetWidth: number,
  targetHeight: number,
  offsetX: number,
  offsetY: number
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const srcImg = await loadImage(sourceImage)
      const placement = calculateImagePlacement(
        srcImg.width, srcImg.height,
        targetWidth, targetHeight,
        offsetX, offsetY
      )
      
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')!
      
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetWidth, targetHeight)
      ctx.drawImage(srcImg, placement.drawX, placement.drawY, placement.drawWidth, placement.drawHeight)
      
      resolve(canvas.toDataURL('image/png'))
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Zjistí zda obrázek potřebuje outpainting pro daný formát
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
      top: placement.emptyTop,
      bottom: placement.emptyBottom,
      left: placement.emptyLeft,
      right: placement.emptyRight,
    }
  }
}
