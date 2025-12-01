/**
 * OpenAI API Client
 * Jednotné API pro všechny OpenAI služby:
 * - Images (gpt-image-1 / GPT-4o image generation)
 * - Chat Completions (gpt-4o-mini, gpt-4o)
 * - Video (sora-2, sora-2-pro)
 */

import type { ModelTier, VideoScenario } from '@/types'

// ============================================================================
// TYPY
// ============================================================================

export interface OpenAIConfig {
  apiKey: string
}

export interface ImageGenerationParams {
  prompt: string
  size: '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto'
  quality: 'low' | 'medium' | 'high' | 'auto'
  n?: number
}

export interface ImageGenerationResult {
  success: boolean
  images: string[] // base64 data URLs
  error?: string
  cost?: number
}

export interface TextGenerationParams {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface TextGenerationResult {
  success: boolean
  text: string
  error?: string
  cost?: number
}

export interface VideoGenerationParams {
  prompt: string
  aspectRatio: '16:9' | '1:1' | '9:16'
  duration: number // sekundy
  model: 'sora-2' | 'sora-2-pro'
  firstFrameImage?: string // base64 pro image-to-video
}

export interface VideoGenerationResult {
  success: boolean
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
  cost?: number
  jobId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// ============================================================================
// API KEY TESTING
// ============================================================================

export interface ApiKeyTestResult {
  valid: boolean
  error?: string
  models?: string[]
}

/**
 * Otestuje API klíč zavoláním /v1/models
 */
export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  if (!apiKey || apiKey.length < 10) {
    return { valid: false, error: 'Klíč je příliš krátký' }
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      if (response.status === 401) {
        return { valid: false, error: 'Neplatný API klíč' }
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limit - zkuste později' }
      }
      return { valid: false, error: error.error?.message || `Chyba ${response.status}` }
    }
    
    const data = await response.json()
    const models = data.data?.map((m: any) => m.id) || []
    
    // Zkontroluj, zda má přístup k potřebným modelům
    const hasDALLE = models.some((m: string) => m.includes('dall-e'))
    const hasGPT4 = models.some((m: string) => m.includes('gpt-4'))
    
    if (!hasDALLE && !hasGPT4) {
      return { 
        valid: true, 
        models,
        error: 'Klíč funguje, ale nemá přístup k DALL-E nebo GPT-4' 
      }
    }
    
    return { valid: true, models }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Nepodařilo se připojit k API' }
  }
}

// ============================================================================
// CENOVÉ KONSTANTY (OpenAI API Pricing - 2025)
// ============================================================================

export const PRICING = {
  // GPT-4o Image Generation (gpt-image-1)
  // Pricing: low=$0.011, medium=$0.042, high=$0.167 per image (1024x1024)
  images: {
    '1024x1024': { low: 0.011, medium: 0.042, high: 0.167 },
    '1536x1024': { low: 0.016, medium: 0.063, high: 0.250 },
    '1024x1536': { low: 0.016, medium: 0.063, high: 0.250 },
    '1792x1024': { low: 0.016, medium: 0.063, high: 0.250 },
    '1024x1792': { low: 0.016, medium: 0.063, high: 0.250 },
    'auto': { low: 0.011, medium: 0.042, high: 0.167 },
  },
  // Chat Completions - per 1M tokens
  text: {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
  },
  // Video - Sora 2 (per second)
  video: {
    'sora-2': 0.10, // $0.10/sec - levnější varianta
    'sora-2-pro': 0.40, // $0.40/sec - vyšší kvalita
  },
} as const

// ============================================================================
// HELPER: Model tier to actual model
// ============================================================================

export function getImageModel(tier: ModelTier): { quality: 'low' | 'medium' | 'high' } {
  switch (tier) {
    case 'cheap':
      return { quality: 'low' }
    case 'standard':
      return { quality: 'medium' }
    case 'best':
      return { quality: 'high' }
  }
}

export function getTextModel(tier: ModelTier): string {
  switch (tier) {
    case 'cheap':
      return 'gpt-4o-mini'
    case 'standard':
      return 'gpt-4o-mini'
    case 'best':
      return 'gpt-4o'
  }
}

export function getVideoModel(tier: ModelTier): 'sora-2' | 'sora-2-pro' {
  switch (tier) {
    case 'cheap':
      return 'sora-2'
    case 'standard':
      return 'sora-2'
    case 'best':
      return 'sora-2-pro'
  }
}

// ============================================================================
// IMAGE GENERATION (GPT-4o / gpt-image-1)
// ============================================================================

export async function generateImage(
  config: OpenAIConfig,
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: params.prompt,
        size: params.size,
        quality: params.quality,
        n: params.n || 1,
        output_format: 'png',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Image generation failed')
    }

    const data = await response.json()
    
    // GPT-4o returns b64_json
    const images = data.data.map((item: any) => {
      if (item.b64_json) {
        return `data:image/png;base64,${item.b64_json}`
      }
      return item.url
    })

    // Calculate cost
    const sizeKey = params.size as keyof typeof PRICING.images
    const qualityKey = params.quality as 'low' | 'medium' | 'high'
    const costPerImage = PRICING.images[sizeKey]?.[qualityKey] || 0.042
    const cost = costPerImage * (params.n || 1)

    return { success: true, images, cost }
  } catch (error: any) {
    return { success: false, images: [], error: error.message }
  }
}

// ============================================================================
// TEXT GENERATION
// ============================================================================

export async function generateText(
  config: OpenAIConfig,
  params: TextGenerationParams,
  tier: ModelTier = 'standard'
): Promise<TextGenerationResult> {
  try {
    const model = getTextModel(tier)
    const messages: any[] = []

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }
    messages.push({ role: 'user', content: params.prompt })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: params.maxTokens || 150,
        temperature: params.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Text generation failed')
    }

    const data = await response.json()
    const text = data.choices[0]?.message?.content?.trim() || ''

    // Estimate cost (rough)
    const inputTokens = (params.prompt.length + (params.systemPrompt?.length || 0)) / 4
    const outputTokens = text.length / 4
    const pricing = PRICING.text[model as keyof typeof PRICING.text]
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000

    return { success: true, text, cost }
  } catch (error: any) {
    return { success: false, text: '', error: error.message }
  }
}

// ============================================================================
// VIDEO GENERATION (Sora 2)
// ============================================================================

export async function generateVideo(
  config: OpenAIConfig,
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  try {
    // Sora 2 API endpoint
    const endpoint = 'https://api.openai.com/v1/videos/generations'

    const body: any = {
      model: params.model,
      prompt: params.prompt,
      aspect_ratio: params.aspectRatio,
      duration: params.duration,
    }

    // Image-to-video mode
    if (params.firstFrameImage) {
      body.first_frame = {
        type: 'base64',
        data: params.firstFrameImage.replace(/^data:image\/\w+;base64,/, ''),
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Video generation failed')
    }

    const data = await response.json()

    // Sora vrací job ID pro asynchronní zpracování
    const cost = PRICING.video[params.model] * params.duration

    return {
      success: true,
      jobId: data.id,
      status: 'processing',
      cost,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
    }
  }
}

/**
 * Zkontroluje stav video generování
 */
export async function checkVideoStatus(
  config: OpenAIConfig,
  jobId: string
): Promise<VideoGenerationResult> {
  try {
    const response = await fetch(`https://api.openai.com/v1/videos/generations/${jobId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Status check failed')
    }

    const data = await response.json()

    if (data.status === 'completed') {
      return {
        success: true,
        status: 'completed',
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
      }
    } else if (data.status === 'failed') {
      return {
        success: false,
        status: 'failed',
        error: data.error || 'Video generation failed',
      }
    }

    return {
      success: true,
      status: 'processing',
      jobId,
    }
  } catch (error: any) {
    return {
      success: false,
      status: 'failed',
      error: error.message,
    }
  }
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

export interface CostEstimate {
  images: { count: number; cost: number }
  text: { tokens: number; cost: number }
  video: { seconds: number; cost: number }
  total: number
}

export function estimateCost(params: {
  imageCount?: number
  imageSize?: keyof typeof PRICING.images
  imageQuality?: 'standard' | 'hd'
  textTokens?: number
  textTier?: ModelTier
  videoSeconds?: number
  videoTier?: ModelTier
}): CostEstimate {
  let imageCost = 0
  let textCost = 0
  let videoCost = 0

  if (params.imageCount && params.imageSize) {
    const quality = params.imageQuality || 'standard'
    imageCost = PRICING.images[params.imageSize][quality] * params.imageCount
  }

  if (params.textTokens) {
    const model = getTextModel(params.textTier || 'standard')
    const pricing = PRICING.text[model as keyof typeof PRICING.text]
    textCost = (params.textTokens * (pricing.input + pricing.output) / 2) / 1_000_000
  }

  if (params.videoSeconds) {
    const model = getVideoModel(params.videoTier || 'standard')
    videoCost = PRICING.video[model] * params.videoSeconds
  }

  return {
    images: { count: params.imageCount || 0, cost: imageCost },
    text: { tokens: params.textTokens || 0, cost: textCost },
    video: { seconds: params.videoSeconds || 0, cost: videoCost },
    total: imageCost + textCost + videoCost,
  }
}

// ============================================================================
// VIDEO PROMPT BUILDER
// ============================================================================

export function buildVideoPrompt(scenario: VideoScenario, brandInfo?: string): string {
  const parts: string[] = []

  // Základní info
  parts.push(`Create a ${scenario.lengthSeconds}-second advertising video.`)
  parts.push(`Aspect ratio: ${scenario.aspectRatio}.`)
  parts.push(`Visual style: ${scenario.style}.`)
  parts.push(`Language for any text/speech: ${scenario.language}.`)

  // Struktura videa
  if (scenario.hook) {
    parts.push(`Opening hook (0-2s): ${scenario.hook}`)
  }
  if (scenario.body) {
    parts.push(`Main content: ${scenario.body}`)
  }
  if (scenario.proof) {
    parts.push(`Proof/credibility element: ${scenario.proof}`)
  }
  if (scenario.cta) {
    parts.push(`Call to action (final seconds): ${scenario.cta}`)
  }

  // Voiceover
  if (scenario.voiceoverText) {
    parts.push(`Voiceover narration: "${scenario.voiceoverText}"`)
  }

  // Titulky
  if (scenario.subtitles) {
    parts.push(`Include large, readable subtitles in ${scenario.language}.`)
  }

  // Brand info
  if (brandInfo) {
    parts.push(`Brand context: ${brandInfo}`)
  }

  // Campaign type specific hints
  switch (scenario.campaignType) {
    case 'youtube_bumper':
      parts.push('Optimize for 6-second bumper format: immediate impact, no slow builds.')
      break
    case 'demand_gen':
      parts.push('Optimize for mobile-first vertical viewing, engaging for scroll-stopping.')
      break
    case 'pmax':
      parts.push('Ensure versatility across placements (YouTube, Display, Discover).')
      break
  }

  return parts.join('\n')
}

// ============================================================================
// MULTI-IMAGE GENERATION (pro varianty)
// ============================================================================

export async function generateImageVariants(
  config: OpenAIConfig,
  basePrompt: string,
  count: number = 3,
  size: ImageGenerationParams['size'] = '1024x1024',
  quality: 'standard' | 'hd' = 'standard'
): Promise<ImageGenerationResult> {
  // Generujeme více obrázků najednou pokud možno
  if (count <= 4) {
    return generateImage(config, {
      prompt: basePrompt,
      size,
      quality,
      n: count,
    })
  }

  // Pro více než 4 musíme volat vícekrát
  const results: string[] = []
  let totalCost = 0

  const batches = Math.ceil(count / 4)
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(4, count - i * 4)
    const result = await generateImage(config, {
      prompt: basePrompt,
      size,
      quality,
      n: batchSize,
    })

    if (result.success) {
      results.push(...result.images)
      totalCost += result.cost || 0
    } else {
      return { success: false, images: results, error: result.error, cost: totalCost }
    }
  }

  return { success: true, images: results, cost: totalCost }
}

// ============================================================================
// DALL-E 2 OUTPAINTING (pro rozšíření obrázku)
// ============================================================================

export interface OutpaintingParams {
  image: string // base64 data URL
  targetWidth: number
  targetHeight: number
  prompt?: string // popis pozadí
}

export interface OutpaintingResult {
  success: boolean
  image?: string // base64 data URL
  error?: string
  usedFallback?: boolean
}

/**
 * Rozšíří obrázek pomocí DALL-E 2 edit API
 * Pokud DALL-E selže, použije blur fill jako fallback
 */
export async function outpaintImage(
  config: OpenAIConfig,
  params: OutpaintingParams
): Promise<OutpaintingResult> {
  // DALL-E 2 podporuje jen čtvercové obrázky: 1024x1024, 512x512, 256x256
  const dalleSize = 1024
  const scale = dalleSize / Math.max(params.targetWidth, params.targetHeight)
  
  // Vycentrujeme target oblast v DALL-E canvasu
  const targetOffsetX = (dalleSize - params.targetWidth * scale) / 2
  const targetOffsetY = (dalleSize - params.targetHeight * scale) / 2
  
  try {
    // Vytvoř canvas pro přípravu obrázku
    const img = await loadImageFromDataUrl(params.image)
    
    const srcRatio = img.width / img.height
    const tgtRatio = params.targetWidth / params.targetHeight
    
    // Určíme kam umístit zdrojový obrázek
    let drawX = 0
    let drawY = 0
    let drawWidth = params.targetWidth
    let drawHeight = params.targetHeight
    
    if (srcRatio > tgtRatio) {
      // Zdrojový je širší - potřebujeme rozšířit nahoru/dolů
      drawWidth = params.targetWidth
      drawHeight = params.targetWidth / srcRatio
      drawY = (params.targetHeight - drawHeight) / 2
    } else {
      // Zdrojový je vyšší - potřebujeme rozšířit doleva/doprava
      drawHeight = params.targetHeight
      drawWidth = params.targetHeight * srcRatio
      drawX = (params.targetWidth - drawWidth) / 2
    }
    
    // Pozice zdrojového obrázku ve scaled prostoru
    const scaledDrawX = targetOffsetX + drawX * scale
    const scaledDrawY = targetOffsetY + drawY * scale
    const scaledDrawWidth = drawWidth * scale
    const scaledDrawHeight = drawHeight * scale
    
    // Vytvoř RGBA canvas pro DALL-E (průhledné oblasti = dogenerovat)
    const canvas = document.createElement('canvas')
    canvas.width = dalleSize
    canvas.height = dalleSize
    const ctx = canvas.getContext('2d')!
    
    // Celý canvas průhledný
    ctx.clearRect(0, 0, dalleSize, dalleSize)
    
    // Nakresli zdrojový obrázek - tato oblast zůstane, zbytek je průhledný
    ctx.drawImage(img, scaledDrawX, scaledDrawY, scaledDrawWidth, scaledDrawHeight)
    
    // Konvertuj na PNG blob (zachová průhlednost)
    const imageBlob = await canvasToBlob(canvas, 'image/png')
    
    // DALL-E 2 edit API: průhledné oblasti v obrázku = dogenerovat
    // Mask není potřeba pokud obrázek má průhlednost
    const formData = new FormData()
    formData.append('image', imageBlob, 'image.png')
    formData.append('prompt', params.prompt || 'Continue the background seamlessly, matching the style, colors and lighting of the existing image')
    formData.append('model', 'dall-e-2')
    formData.append('n', '1')
    formData.append('size', '1024x1024')
    formData.append('response_format', 'b64_json')
    
    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.warn('DALL-E 2 outpainting failed:', error)
      // Fallback na blur fill
      return blurFillFallback(params)
    }
    
    const data = await response.json()
    const resultB64 = data.data?.[0]?.b64_json
    
    if (!resultB64) {
      return blurFillFallback(params)
    }
    
    // Resize zpět na cílovou velikost
    const resultImg = await loadImageFromDataUrl(`data:image/png;base64,${resultB64}`)
    
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = params.targetWidth
    finalCanvas.height = params.targetHeight
    const finalCtx = finalCanvas.getContext('2d')!
    
    // Crop jen požadovanou oblast z DALL-E výstupu
    const cropWidth = params.targetWidth * scale
    const cropHeight = params.targetHeight * scale
    
    finalCtx.drawImage(
      resultImg, 
      targetOffsetX, targetOffsetY, cropWidth, cropHeight,
      0, 0, params.targetWidth, params.targetHeight
    )
    
    return {
      success: true,
      image: finalCanvas.toDataURL('image/png'),
    }
  } catch (error: any) {
    console.error('Outpainting error:', error)
    return blurFillFallback(params)
  }
}

/**
 * Fallback - použije rozmazané pozadí místo AI outpaintingu
 * Vytvoří plynulé rozmazané pozadí které vyplní prázdné místo
 */
async function blurFillFallback(params: OutpaintingParams): Promise<OutpaintingResult> {
  try {
    const img = await loadImageFromDataUrl(params.image)
    
    const canvas = document.createElement('canvas')
    canvas.width = params.targetWidth
    canvas.height = params.targetHeight
    const ctx = canvas.getContext('2d')!
    
    const srcRatio = img.width / img.height
    const tgtRatio = params.targetWidth / params.targetHeight
    
    // Vypočítej kam nakreslit ostrý obrázek
    let drawX = 0
    let drawY = 0
    let drawWidth = params.targetWidth
    let drawHeight = params.targetHeight
    
    if (srcRatio > tgtRatio) {
      drawWidth = params.targetWidth
      drawHeight = params.targetWidth / srcRatio
      drawY = (params.targetHeight - drawHeight) / 2
    } else {
      drawHeight = params.targetHeight
      drawWidth = params.targetHeight * srcRatio
      drawX = (params.targetWidth - drawWidth) / 2
    }
    
    // 1. Nakresli silně rozmazané pozadí (celý obrázek roztažený přes celý canvas)
    ctx.filter = 'blur(40px) saturate(1.1)'
    ctx.drawImage(img, -50, -50, params.targetWidth + 100, params.targetHeight + 100)
    ctx.filter = 'none'
    
    // 2. Přidej jemný gradient overlay pro lepší splynutí
    const gradient = ctx.createRadialGradient(
      params.targetWidth / 2, params.targetHeight / 2, Math.min(drawWidth, drawHeight) / 3,
      params.targetWidth / 2, params.targetHeight / 2, Math.max(params.targetWidth, params.targetHeight) / 1.5
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, params.targetWidth, params.targetHeight)
    
    // 3. Nakresli ostrý obrázek do středu s jemným stínem pro hloubku
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    
    return {
      success: true,
      image: canvas.toDataURL('image/png'),
      usedFallback: true,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// Helper funkce
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas to blob failed'))
    }, type)
  })
}
