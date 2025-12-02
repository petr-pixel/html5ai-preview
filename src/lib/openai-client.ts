/**
 * OpenAI API Client v3.0
 * 
 * Jednotné API pro všechny OpenAI služby:
 * - Images (gpt-image-1 / GPT-4o image generation)
 * - Image Edit (DALL-E 2 pro outpainting)
 * - Chat Completions (gpt-4o-mini, gpt-4o)
 * - Video (sora - TODO: čekáme na veřejné API)
 * 
 * ZMĚNY v3.0:
 * - Konzistentní quality levels: 'low' | 'medium' | 'high'
 * - Integrovaný debug systém
 * - Retry logika s exponential backoff
 * - Request timeout
 * - Removed duplicitní outpaint funkce (použij /lib/outpaint.ts)
 */

import { debug, fetchWithRetry, perfStart, perfEnd } from './debug'
import type { ModelTier, VideoScenario } from '@/types'

// ============================================================================
// TYPY
// ============================================================================

export interface OpenAIConfig {
  apiKey: string
}

export type ImageQuality = 'low' | 'medium' | 'high'
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto'

export interface ImageGenerationParams {
  prompt: string
  size?: ImageSize
  quality?: ImageQuality
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
  usage?: { promptTokens: number; completionTokens: number }
}

export interface VideoGenerationParams {
  prompt: string
  aspectRatio: '16:9' | '1:1' | '9:16'
  duration: number
  model: 'sora-2' | 'sora-2-pro'
  firstFrameImage?: string
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
// PRICING (OpenAI API - aktuální k 2025)
// ============================================================================

export const PRICING = {
  // GPT-4o Image Generation (gpt-image-1)
  // https://openai.com/api/pricing/
  images: {
    '1024x1024': { low: 0.011, medium: 0.042, high: 0.167 },
    '1536x1024': { low: 0.016, medium: 0.063, high: 0.250 },
    '1024x1536': { low: 0.016, medium: 0.063, high: 0.250 },
    '1792x1024': { low: 0.016, medium: 0.063, high: 0.250 },
    '1024x1792': { low: 0.016, medium: 0.063, high: 0.250 },
    'auto': { low: 0.011, medium: 0.042, high: 0.167 },
  } as const,
  
  // DALL-E 2 Edit (pro outpainting)
  imageEdit: {
    '1024x1024': 0.020,
    '512x512': 0.018,
    '256x256': 0.016,
  } as const,
  
  // Chat Completions - per 1M tokens
  text: {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
  } as const,
  
  // Video - Sora (estimated, not yet public)
  video: {
    'sora-2': 0.10,
    'sora-2-pro': 0.40,
  } as const,
} as const

// ============================================================================
// HELPERS: Model tier mapping
// ============================================================================

export function getImageQuality(tier: ModelTier): ImageQuality {
  const map: Record<ModelTier, ImageQuality> = {
    cheap: 'low',
    standard: 'medium',
    best: 'high',
  }
  return map[tier]
}

export function getTextModel(tier: ModelTier): 'gpt-4o-mini' | 'gpt-4o' {
  return tier === 'best' ? 'gpt-4o' : 'gpt-4o-mini'
}

export function getVideoModel(tier: ModelTier): 'sora-2' | 'sora-2-pro' {
  return tier === 'best' ? 'sora-2-pro' : 'sora-2'
}

// Deprecated aliases for backward compatibility
export function getImageModel(tier: ModelTier): { quality: ImageQuality } {
  return { quality: getImageQuality(tier) }
}

// ============================================================================
// API KEY VALIDATION
// ============================================================================

export interface ApiKeyTestResult {
  valid: boolean
  error?: string
  models?: string[]
  hasImageModels?: boolean
  hasTextModels?: boolean
}

export async function testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
  debug.api('OpenAI', 'testApiKey', { keyLength: apiKey?.length })
  
  if (!apiKey || apiKey.length < 20) {
    return { valid: false, error: 'API klíč je příliš krátký' }
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
        debug.error('OpenAI', 'Invalid API key')
        return { valid: false, error: 'Neplatný API klíč' }
      }
      if (response.status === 429) {
        debug.warn('OpenAI', 'Rate limited during key test')
        return { valid: false, error: 'Rate limit - zkuste později' }
      }
      
      return { valid: false, error: error.error?.message || `Chyba ${response.status}` }
    }
    
    const data = await response.json()
    const models = data.data?.map((m: any) => m.id) || []
    
    const hasImageModels = models.some((m: string) => 
      m.includes('dall-e') || m.includes('gpt-image')
    )
    const hasTextModels = models.some((m: string) => 
      m.includes('gpt-4') || m.includes('gpt-3.5')
    )
    
    debug.success('OpenAI', 'API key valid', { 
      modelCount: models.length,
      hasImageModels,
      hasTextModels,
    })
    
    return { 
      valid: true, 
      models,
      hasImageModels,
      hasTextModels,
    }
  } catch (error: any) {
    debug.error('OpenAI', 'Key test failed', error)
    return { valid: false, error: error.message || 'Nepodařilo se připojit k API' }
  }
}

// ============================================================================
// IMAGE GENERATION (GPT-4o / gpt-image-1)
// ============================================================================

export async function generateImage(
  config: OpenAIConfig,
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const timerId = perfStart('generateImage')
  
  const size = params.size || '1024x1024'
  const quality = params.quality || 'medium'
  const n = params.n || 1
  
  debug.api('OpenAI', 'generateImage', { 
    promptLength: params.prompt.length,
    size,
    quality,
    n,
  })
  
  try {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: params.prompt,
          size,
          quality,
          n,
          output_format: 'png',
        }),
      },
      { maxRetries: 2, delayMs: 2000 }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    
    const images = data.data.map((item: any) => {
      if (item.b64_json) {
        return `data:image/png;base64,${item.b64_json}`
      }
      return item.url
    })

    // Calculate cost
    const pricing = PRICING.images[size]
    const cost = pricing[quality] * n

    const duration = perfEnd(timerId)
    
    debug.success('OpenAI', 'Images generated', { 
      count: images.length,
      cost: `$${cost.toFixed(3)}`,
      duration: `${duration.toFixed(0)}ms`,
    })

    return { success: true, images, cost }
  } catch (error: any) {
    perfEnd(timerId)
    debug.error('OpenAI', 'generateImage failed', error)
    return { success: false, images: [], error: error.message }
  }
}

// ============================================================================
// IMAGE EDIT (DALL-E 2) - pro outpainting
// ============================================================================

export interface ImageEditParams {
  image: Blob        // PNG s průhledností
  mask?: Blob        // Volitelná maska
  prompt: string
  size?: '1024x1024' | '512x512' | '256x256'
}

export interface ImageEditResult {
  success: boolean
  image?: string     // base64 data URL
  error?: string
  cost?: number
}

export async function editImage(
  config: OpenAIConfig,
  params: ImageEditParams
): Promise<ImageEditResult> {
  const timerId = perfStart('editImage')
  const size = params.size || '1024x1024'
  
  debug.api('OpenAI', 'editImage (DALL-E 2)', { 
    imageSize: `${(params.image.size / 1024).toFixed(1)}KB`,
    hasMask: !!params.mask,
    promptLength: params.prompt.length,
    size,
  })
  
  try {
    const formData = new FormData()
    formData.append('image', params.image, 'image.png')
    if (params.mask) {
      formData.append('mask', params.mask, 'mask.png')
    }
    formData.append('prompt', params.prompt)
    formData.append('model', 'dall-e-2')
    formData.append('n', '1')
    formData.append('size', size)
    formData.append('response_format', 'b64_json')
    
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/images/edits',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
      },
      { maxRetries: 2, delayMs: 2000 }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const b64 = data.data?.[0]?.b64_json
    
    if (!b64) {
      throw new Error('No image data in response')
    }
    
    const cost = PRICING.imageEdit[size]
    const duration = perfEnd(timerId)
    
    debug.success('OpenAI', 'Image edited', {
      cost: `$${cost.toFixed(3)}`,
      duration: `${duration.toFixed(0)}ms`,
    })
    
    return {
      success: true,
      image: `data:image/png;base64,${b64}`,
      cost,
    }
  } catch (error: any) {
    perfEnd(timerId)
    debug.error('OpenAI', 'editImage failed', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// TEXT GENERATION (Chat Completions)
// ============================================================================

export async function generateText(
  config: OpenAIConfig,
  params: TextGenerationParams,
  tier: ModelTier = 'standard'
): Promise<TextGenerationResult> {
  const timerId = perfStart('generateText')
  const model = getTextModel(tier)
  
  debug.api('OpenAI', 'generateText', {
    model,
    promptLength: params.prompt.length,
    hasSystemPrompt: !!params.systemPrompt,
    maxTokens: params.maxTokens,
  })
  
  try {
    const messages: any[] = []
    
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }
    messages.push({ role: 'user', content: params.prompt })
    
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: params.maxTokens || 500,
          temperature: params.temperature ?? 0.7,
        }),
      },
      { maxRetries: 2, delayMs: 1000 }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const text = data.choices[0]?.message?.content?.trim() || ''
    
    // Calculate cost from actual usage
    const usage = data.usage || {}
    const pricing = PRICING.text[model]
    const cost = (
      (usage.prompt_tokens || 0) * pricing.input + 
      (usage.completion_tokens || 0) * pricing.output
    ) / 1_000_000
    
    const duration = perfEnd(timerId)
    
    debug.success('OpenAI', 'Text generated', {
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      cost: `$${cost.toFixed(5)}`,
      duration: `${duration.toFixed(0)}ms`,
    })
    
    return { 
      success: true, 
      text, 
      cost,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
      },
    }
  } catch (error: any) {
    perfEnd(timerId)
    debug.error('OpenAI', 'generateText failed', error)
    return { success: false, text: '', error: error.message }
  }
}

// ============================================================================
// VIDEO GENERATION (Sora 2) - PLACEHOLDER
// ============================================================================

/**
 * NOTE: Sora 2 API není zatím veřejně dostupné.
 * Tato funkce je připravena pro budoucí integraci.
 */
export async function generateVideo(
  config: OpenAIConfig,
  params: VideoGenerationParams
): Promise<VideoGenerationResult> {
  debug.warn('OpenAI', 'Video generation not yet available', {
    note: 'Sora 2 API is not yet public. This is a placeholder.',
  })
  
  // Placeholder - vrátí error dokud nebude API dostupné
  return {
    success: false,
    status: 'failed',
    error: 'Video generování (Sora 2) zatím není veřejně dostupné. Sledujte OpenAI novinky.',
  }
}

export async function checkVideoStatus(
  config: OpenAIConfig,
  jobId: string
): Promise<VideoGenerationResult> {
  debug.warn('OpenAI', 'Video status check not available')
  return {
    success: false,
    status: 'failed',
    error: 'Video API není dostupné',
  }
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

export interface CostEstimate {
  images: { count: number; cost: number }
  text: { tokens: number; cost: number }
  video: { seconds: number; cost: number }
  outpaint: { count: number; cost: number }
  total: number
}

export function estimateCost(params: {
  imageCount?: number
  imageSize?: ImageSize
  imageQuality?: ImageQuality
  textTokens?: number
  textTier?: ModelTier
  videoSeconds?: number
  videoTier?: ModelTier
  outpaintCount?: number
}): CostEstimate {
  let imageCost = 0
  let textCost = 0
  let videoCost = 0
  let outpaintCost = 0
  
  // Image generation
  if (params.imageCount && params.imageSize) {
    const quality = params.imageQuality || 'medium'
    const pricing = PRICING.images[params.imageSize]
    imageCost = pricing[quality] * params.imageCount
  }
  
  // Text generation
  if (params.textTokens) {
    const model = getTextModel(params.textTier || 'standard')
    const pricing = PRICING.text[model]
    // Rough estimate: 50% input, 50% output
    textCost = (params.textTokens * (pricing.input + pricing.output) / 2) / 1_000_000
  }
  
  // Video generation
  if (params.videoSeconds) {
    const model = getVideoModel(params.videoTier || 'standard')
    videoCost = PRICING.video[model] * params.videoSeconds
  }
  
  // Outpainting (DALL-E 2 edit)
  if (params.outpaintCount) {
    outpaintCost = PRICING.imageEdit['1024x1024'] * params.outpaintCount
  }
  
  return {
    images: { count: params.imageCount || 0, cost: imageCost },
    text: { tokens: params.textTokens || 0, cost: textCost },
    video: { seconds: params.videoSeconds || 0, cost: videoCost },
    outpaint: { count: params.outpaintCount || 0, cost: outpaintCost },
    total: imageCost + textCost + videoCost + outpaintCost,
  }
}

// ============================================================================
// MULTI-IMAGE GENERATION (pro varianty)
// ============================================================================

export async function generateImageVariants(
  config: OpenAIConfig,
  basePrompt: string,
  count: number = 3,
  size: ImageSize = '1024x1024',
  quality: ImageQuality = 'medium'
): Promise<ImageGenerationResult> {
  debug.api('OpenAI', 'generateImageVariants', { count, size, quality })
  
  // OpenAI umožňuje max 4 obrázky najednou
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
    
    debug.info('OpenAI', `Generating batch ${i + 1}/${batches}`, { batchSize })
    
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
      debug.error('OpenAI', `Batch ${i + 1} failed`, result.error)
      return { 
        success: false, 
        images: results, 
        error: result.error, 
        cost: totalCost,
      }
    }
  }
  
  debug.success('OpenAI', 'All variants generated', {
    total: results.length,
    cost: `$${totalCost.toFixed(3)}`,
  })
  
  return { success: true, images: results, cost: totalCost }
}

// ============================================================================
// VIDEO PROMPT BUILDER
// ============================================================================

export function buildVideoPrompt(scenario: VideoScenario, brandInfo?: string): string {
  const parts: string[] = []
  
  parts.push(`Create a ${scenario.lengthSeconds}-second advertising video.`)
  parts.push(`Aspect ratio: ${scenario.aspectRatio}.`)
  parts.push(`Visual style: ${scenario.style}.`)
  parts.push(`Language for any text/speech: ${scenario.language}.`)
  
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
  
  if (scenario.voiceoverText) {
    parts.push(`Voiceover narration: "${scenario.voiceoverText}"`)
  }
  
  if (scenario.subtitles) {
    parts.push(`Include large, readable subtitles in ${scenario.language}.`)
  }
  
  if (brandInfo) {
    parts.push(`Brand context: ${brandInfo}`)
  }
  
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
// CONVENIENCE: Generate ad copy
// ============================================================================

export interface AdCopyParams {
  productName: string
  productDescription?: string
  targetAudience?: string
  tone?: 'professional' | 'casual' | 'playful' | 'urgent'
  language?: string
}

export interface AdCopyResult {
  success: boolean
  headlines: string[]
  subheadlines: string[]
  ctas: string[]
  error?: string
  cost?: number
}

export async function generateAdCopy(
  config: OpenAIConfig,
  params: AdCopyParams,
  tier: ModelTier = 'standard'
): Promise<AdCopyResult> {
  debug.api('OpenAI', 'generateAdCopy', params)
  
  const language = params.language || 'čeština'
  const tone = params.tone || 'professional'
  
  const systemPrompt = `Jsi expert na reklamní texty. Piš v jazyce: ${language}. 
Styl: ${tone}. 
Odpovídej POUZE v JSON formátu bez markdown.`
  
  const prompt = `Vytvoř reklamní texty pro produkt:
Název: ${params.productName}
${params.productDescription ? `Popis: ${params.productDescription}` : ''}
${params.targetAudience ? `Cílová skupina: ${params.targetAudience}` : ''}

Vrať JSON:
{
  "headlines": ["headline1", "headline2", "headline3"],
  "subheadlines": ["sub1", "sub2", "sub3"],
  "ctas": ["cta1", "cta2", "cta3"]
}

Headlines: max 30 znaků, chytlavé, zaměřené na benefit
Subheadlines: max 90 znaků, rozšíření headlines
CTAs: max 20 znaků, akční, jasné`
  
  const result = await generateText(config, {
    prompt,
    systemPrompt,
    maxTokens: 500,
    temperature: 0.8,
  }, tier)
  
  if (!result.success) {
    return {
      success: false,
      headlines: [],
      subheadlines: [],
      ctas: [],
      error: result.error,
    }
  }
  
  try {
    // Parse JSON response
    const cleaned = result.text.replace(/```json\n?|```\n?/g, '').trim()
    const data = JSON.parse(cleaned)
    
    debug.success('OpenAI', 'Ad copy generated', {
      headlines: data.headlines?.length,
      subheadlines: data.subheadlines?.length,
      ctas: data.ctas?.length,
    })
    
    return {
      success: true,
      headlines: data.headlines || [],
      subheadlines: data.subheadlines || [],
      ctas: data.ctas || [],
      cost: result.cost,
    }
  } catch (parseError) {
    debug.error('OpenAI', 'Failed to parse ad copy response', { 
      response: result.text,
      error: parseError,
    })
    return {
      success: false,
      headlines: [],
      subheadlines: [],
      ctas: [],
      error: 'Nepodařilo se zpracovat odpověď AI',
    }
  }
}

// ============================================================================
// HELPER: Optimize prompt for ad image
// ============================================================================

export function optimizeImagePrompt(
  basePrompt: string,
  format: { width: number; height: number },
  style?: 'photo' | 'illustration' | 'minimal' | '3d'
): string {
  const ratio = format.width / format.height
  
  let composition = ''
  if (ratio > 2) {
    composition = 'horizontal banner composition with subject on left side'
  } else if (ratio < 0.6) {
    composition = 'vertical composition optimized for mobile viewing'
  } else if (Math.abs(ratio - 1) < 0.1) {
    composition = 'square composition with centered subject'
  } else {
    composition = 'balanced composition suitable for advertising'
  }
  
  const styleMap = {
    photo: 'professional product photography, studio lighting, high-end advertising',
    illustration: 'modern digital illustration, clean lines, vibrant colors',
    minimal: 'minimalist design, clean background, focus on product',
    '3d': '3D rendered, realistic materials, dramatic lighting',
  }
  
  const styleDesc = style ? styleMap[style] : 'professional advertising style'
  
  return `${basePrompt}. ${composition}. ${styleDesc}. Clean space for text overlay. High quality, suitable for digital advertising.`
}

export default {
  testApiKey,
  generateImage,
  editImage,
  generateText,
  generateVideo,
  checkVideoStatus,
  generateImageVariants,
  generateAdCopy,
  estimateCost,
  buildVideoPrompt,
  optimizeImagePrompt,
  PRICING,
}
