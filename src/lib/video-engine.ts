/**
 * Video Engine - Třístupňová strategie pro generování videí
 * 
 * Tier 1: Slideshow (FFmpeg.wasm) - klientské generování MP4
 * Tier 2: Motion AI (Replicate API) - image-to-video
 * Tier 3: Generative AI (Sora/Runway) - text-to-video
 */

import type { Creative, VideoScenario, BrandKit } from '@/types'

// ============================================================================
// TYPY
// ============================================================================

export type VideoTier = 'slideshow' | 'motion' | 'generative'

export interface VideoGenerationOptions {
  tier: VideoTier
  scenario: VideoScenario
  images?: string[]
  sourceImage?: string
  brandKit?: BrandKit
  audioUrl?: string
  apiKey?: string
  onProgress?: (progress: number, message: string) => void
}

export interface VideoResult {
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  tier: VideoTier
  format: 'mp4' | 'webm'
  cost?: number
}

export interface SlideTransition {
  type: 'fade' | 'slide' | 'zoom' | 'kenburns' | 'crossfade'
  duration: number
}

export interface SlideConfig {
  imageUrl: string
  duration: number
  transition: SlideTransition
  text?: {
    content: string
    position: 'top' | 'center' | 'bottom'
    fontSize: number
    color: string
    backgroundColor?: string
  }
  kenBurns?: {
    startScale: number
    endScale: number
    startX: number
    startY: number
    endX: number
    endY: number
  }
}

// FFmpeg types
interface FFmpegInstance {
  load: () => Promise<void>
  writeFile: (name: string, data: Uint8Array) => Promise<void>
  exec: (args: string[]) => Promise<void>
  readFile: (name: string) => Promise<Uint8Array>
  on: (event: string, callback: (data: { progress: number }) => void) => void
}

// ============================================================================
// FFMPEG.WASM LOADER
// ============================================================================

let ffmpegInstance: FFmpegInstance | null = null
let ffmpegLoading: Promise<FFmpegInstance> | null = null

/**
 * Načte FFmpeg.wasm (singleton)
 */
async function loadFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpegInstance) return ffmpegInstance
  
  if (ffmpegLoading) return ffmpegLoading
  
  ffmpegLoading = (async () => {
    try {
      // Dynamický import FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile } = await import('@ffmpeg/util')
      
      const ffmpeg = new FFmpeg()
      
      // Načti WASM soubory z CDN
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      })
      
      ffmpegInstance = ffmpeg as unknown as FFmpegInstance
      
      // Přidáme fetchFile jako metodu pro pohodlí
      (ffmpegInstance as unknown as { fetchFile: typeof fetchFile }).fetchFile = fetchFile
      
      return ffmpegInstance
    } catch (error) {
      console.warn('FFmpeg.wasm nelze načíst, fallback na WebM:', error)
      throw error
    }
  })()
  
  return ffmpegLoading
}

// ============================================================================
// TIER 1: SLIDESHOW S FFMPEG.WASM (MP4 OUTPUT)
// ============================================================================

/**
 * Generuje MP4 slideshow pomocí FFmpeg.wasm
 * Funkce: Ken Burns efekt, prolínačky, audio
 */
export async function generateSlideshowMP4(
  slides: SlideConfig[],
  options: {
    width: number
    height: number
    fps: number
    audioUrl?: string
    onProgress?: (progress: number, message: string) => void
  }
): Promise<Blob> {
  const { width, height, fps, audioUrl, onProgress } = options
  
  onProgress?.(0, 'Načítám FFmpeg...')
  
  let ffmpeg: FFmpegInstance
  
  try {
    ffmpeg = await loadFFmpeg()
  } catch {
    // Fallback na WebM
    onProgress?.(5, 'FFmpeg nedostupný, používám WebM fallback...')
    return generateSlideshowWebM(slides, { width, height, fps, onProgress })
  }
  
  onProgress?.(10, 'Připravuji obrázky...')
  
  // Vyrenderuj všechny frames jako PNG
  const totalDuration = slides.reduce((acc, s) => acc + s.duration + s.transition.duration, 0)
  const totalFrames = Math.ceil((totalDuration / 1000) * fps)
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  // Načti obrázky
  const images = await Promise.all(slides.map(s => loadImage(s.imageUrl)))
  
  // Generuj frames
  const framePromises: Promise<{ index: number; data: Uint8Array }>[] = []
  
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const currentTime = (frameIndex / fps) * 1000
    
    // Najdi aktuální slide
    let accTime = 0
    let slideIndex = 0
    let slideTime = 0
    
    for (let i = 0; i < slides.length; i++) {
      const slideTotalTime = slides[i].duration + slides[i].transition.duration
      if (currentTime < accTime + slideTotalTime) {
        slideIndex = i
        slideTime = currentTime - accTime
        break
      }
      accTime += slideTotalTime
    }
    
    const slide = slides[slideIndex]
    const img = images[slideIndex]
    const nextImg = images[slideIndex + 1]
    
    // Vyčisti canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    
    // Vykresli frame
    if (slideTime < slide.duration) {
      // Hlavní část s Ken Burns
      const progress = slideTime / slide.duration
      drawImageWithKenBurns(ctx, img, slide, progress, width, height)
    } else if (nextImg) {
      // Transition
      const transitionProgress = (slideTime - slide.duration) / slide.transition.duration
      
      switch (slide.transition.type) {
        case 'fade':
        case 'crossfade':
          drawImageFit(ctx, img, width, height)
          ctx.globalAlpha = transitionProgress
          drawImageFit(ctx, nextImg, width, height)
          ctx.globalAlpha = 1
          break
          
        case 'slide':
          const offset = width * transitionProgress
          ctx.save()
          ctx.translate(-offset, 0)
          drawImageFit(ctx, img, width, height)
          ctx.translate(width, 0)
          drawImageFit(ctx, nextImg, width, height)
          ctx.restore()
          break
          
        case 'zoom':
          const zoomScale = 1 + transitionProgress * 0.5
          ctx.save()
          ctx.translate(width / 2, height / 2)
          ctx.scale(zoomScale, zoomScale)
          ctx.globalAlpha = 1 - transitionProgress
          ctx.translate(-width / 2, -height / 2)
          drawImageFit(ctx, img, width, height)
          ctx.restore()
          ctx.globalAlpha = transitionProgress
          drawImageFit(ctx, nextImg, width, height)
          ctx.globalAlpha = 1
          break
          
        default:
          drawImageFit(ctx, img, width, height)
      }
    } else {
      drawImageFit(ctx, img, width, height)
    }
    
    // Text overlay
    if (slide.text) {
      drawTextOverlay(ctx, slide.text, width, height)
    }
    
    // Konvertuj na PNG
    const frameData = await canvasToUint8Array(canvas)
    framePromises.push(Promise.resolve({ index: frameIndex, data: frameData }))
    
    if (frameIndex % 10 === 0) {
      onProgress?.(10 + (frameIndex / totalFrames) * 50, `Renderuji frame ${frameIndex}/${totalFrames}...`)
    }
  }
  
  const frames = await Promise.all(framePromises)
  
  onProgress?.(60, 'Zapisuji frames do FFmpeg...')
  
  // Zapiš frames do FFmpeg
  for (const frame of frames) {
    const paddedIndex = String(frame.index).padStart(6, '0')
    await ffmpeg.writeFile(`frame_${paddedIndex}.png`, frame.data)
  }
  
  // Zapiš audio pokud existuje
  if (audioUrl) {
    onProgress?.(65, 'Zpracovávám audio...')
    try {
      const audioData = await fetchFileAsUint8Array(audioUrl)
      await ffmpeg.writeFile('audio.mp3', audioData)
    } catch (e) {
      console.warn('Nepodařilo se načíst audio:', e)
    }
  }
  
  onProgress?.(70, 'Enkóduji MP4...')
  
  // FFmpeg příkaz pro vytvoření MP4
  const ffmpegArgs = [
    '-framerate', String(fps),
    '-i', 'frame_%06d.png',
  ]
  
  // Přidej audio pokud existuje
  if (audioUrl) {
    ffmpegArgs.push('-i', 'audio.mp3')
    ffmpegArgs.push('-shortest') // Ukonči video když skončí kratší stream
  }
  
  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '23',
    '-movflags', '+faststart', // Pro web playback
  )
  
  if (audioUrl) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k')
  }
  
  ffmpegArgs.push('output.mp4')
  
  // Progress tracking
  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(70 + progress * 25, 'Enkóduji MP4...')
  })
  
  await ffmpeg.exec(ffmpegArgs)
  
  onProgress?.(95, 'Načítám výsledek...')
  
  const outputData = await ffmpeg.readFile('output.mp4')
  // Vytvoř ArrayBuffer kopii pro Blob kompatibilitu
  const arrayBuffer = (outputData as Uint8Array).slice().buffer
  const videoBlob = new Blob([arrayBuffer], { type: 'video/mp4' })
  
  onProgress?.(100, 'Hotovo!')
  
  return videoBlob
}

/**
 * Fallback: WebM generování pomocí MediaRecorder
 */
async function generateSlideshowWebM(
  slides: SlideConfig[],
  options: {
    width: number
    height: number
    fps: number
    onProgress?: (progress: number, message: string) => void
  }
): Promise<Blob> {
  const { width, height, fps, onProgress } = options
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  const images = await Promise.all(slides.map(s => loadImage(s.imageUrl)))
  
  const totalDuration = slides.reduce((acc, s) => acc + s.duration + s.transition.duration, 0)
  const totalFrames = Math.ceil((totalDuration / 1000) * fps)
  
  const stream = canvas.captureStream(fps)
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000,
  })
  
  const chunks: Blob[] = []
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }))
    }
    mediaRecorder.onerror = reject
    mediaRecorder.start()
    
    let currentTime = 0
    let frameIndex = 0
    
    const renderFrame = () => {
      if (frameIndex >= totalFrames) {
        mediaRecorder.stop()
        return
      }
      
      let accTime = 0
      let slideIndex = 0
      let slideTime = 0
      
      for (let i = 0; i < slides.length; i++) {
        const slideTotalTime = slides[i].duration + slides[i].transition.duration
        if (currentTime < accTime + slideTotalTime) {
          slideIndex = i
          slideTime = currentTime - accTime
          break
        }
        accTime += slideTotalTime
      }
      
      const slide = slides[slideIndex]
      const img = images[slideIndex]
      const nextImg = images[slideIndex + 1]
      
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      
      if (slideTime < slide.duration) {
        drawImageWithKenBurns(ctx, img, slide, slideTime / slide.duration, width, height)
      } else if (nextImg) {
        const transitionProgress = (slideTime - slide.duration) / slide.transition.duration
        
        if (slide.transition.type === 'fade' || slide.transition.type === 'crossfade') {
          drawImageFit(ctx, img, width, height)
          ctx.globalAlpha = transitionProgress
          drawImageFit(ctx, nextImg, width, height)
          ctx.globalAlpha = 1
        } else {
          drawImageFit(ctx, img, width, height)
        }
      } else {
        drawImageFit(ctx, img, width, height)
      }
      
      if (slide.text) {
        drawTextOverlay(ctx, slide.text, width, height)
      }
      
      onProgress?.((frameIndex / totalFrames) * 100, 'Renderuji...')
      
      currentTime += 1000 / fps
      frameIndex++
      requestAnimationFrame(renderFrame)
    }
    
    renderFrame()
  })
}

// ============================================================================
// HLAVNÍ FUNKCE PRO TVORBU SLIDESHOW Z KREATIV
// ============================================================================

/**
 * Vytvoří slideshow z kreativ - hlavní API
 */
export async function createSlideshowFromCreatives(
  creatives: Creative[],
  scenario: VideoScenario,
  brandKit?: BrandKit,
  audioUrl?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<VideoResult> {
  onProgress?.(0, 'Připravuji slideshow...')
  
  const dimensions = getVideoDimensions(scenario.aspectRatio)
  const slideDuration = (scenario.lengthSeconds * 1000) / creatives.length
  const transitionDuration = 500
  
  const slides: SlideConfig[] = creatives.map((creative, index) => ({
    imageUrl: creative.imageUrl,
    duration: slideDuration - transitionDuration,
    transition: {
      type: 'crossfade' as const,
      duration: transitionDuration,
    },
    kenBurns: {
      startScale: 1,
      endScale: 1.15,
      startX: 0.5,
      startY: 0.5,
      endX: 0.5 + (Math.random() - 0.5) * 0.15,
      endY: 0.5 + (Math.random() - 0.5) * 0.15,
    },
    text: index === creatives.length - 1 && scenario.cta ? {
      content: scenario.cta,
      position: 'bottom' as const,
      fontSize: Math.round(dimensions.width / 18),
      color: '#ffffff',
      backgroundColor: brandKit?.ctaColor || 'rgba(0,0,0,0.7)',
    } : undefined,
  }))
  
  let videoBlob: Blob
  let format: 'mp4' | 'webm' = 'mp4'
  
  try {
    videoBlob = await generateSlideshowMP4(slides, {
      width: dimensions.width,
      height: dimensions.height,
      fps: 30,
      audioUrl,
      onProgress,
    })
  } catch (e) {
    console.warn('MP4 generování selhalo, používám WebM:', e)
    format = 'webm'
    videoBlob = await generateSlideshowWebM(slides, {
      width: dimensions.width,
      height: dimensions.height,
      fps: 30,
      onProgress,
    })
  }
  
  const videoUrl = URL.createObjectURL(videoBlob)
  
  return {
    videoUrl,
    duration: scenario.lengthSeconds,
    tier: 'slideshow',
    format,
    cost: 0,
  }
}

// ============================================================================
// TIER 2 & 3 PLACEHOLDERS
// ============================================================================

export interface MotionAIConfig {
  apiKey: string
  model: 'stable-video-diffusion' | 'animate-diff' | 'i2vgen-xl'
}

export async function generateMotionVideo(
  _imageUrl: string,
  _config: MotionAIConfig,
  options: {
    duration: number
    motion: 'subtle' | 'moderate' | 'dynamic'
    onProgress?: (progress: number, message: string) => void
  }
): Promise<VideoResult> {
  options.onProgress?.(0, 'Připojuji se k Replicate API...')
  throw new Error('Motion AI (Tier 2) vyžaduje Replicate API klíč. Nastavte ho v Settings.')
}

export interface GenerativeAIConfig {
  provider: 'openai' | 'runway'
  apiKey: string
  model: 'sora-2' | 'sora-2-pro' | 'runway-gen3'
}

export async function generateFromPrompt(
  _prompt: string,
  config: GenerativeAIConfig,
  options: {
    aspectRatio: '16:9' | '1:1' | '9:16'
    duration: number
    style?: string
    onProgress?: (progress: number, message: string) => void
  }
): Promise<VideoResult> {
  options.onProgress?.(0, 'Připojuji se k AI API...')
  
  if (config.provider === 'openai') {
    throw new Error('Pro Sora API použijte VideoScenarioEditor s OpenAI API klíčem.')
  }
  
  throw new Error('Runway API integrace bude dostupná v další verzi.')
}

// ============================================================================
// HELPER FUNKCE
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

async function canvasToUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const buffer = await blob.arrayBuffer()
        resolve(new Uint8Array(buffer))
      } else {
        resolve(new Uint8Array())
      }
    }, 'image/png')
  })
}

async function fetchFileAsUint8Array(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

function getVideoDimensions(aspectRatio: '16:9' | '1:1' | '9:16'): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9': return { width: 1920, height: 1080 }
    case '1:1': return { width: 1080, height: 1080 }
    case '9:16': return { width: 1080, height: 1920 }
    default: return { width: 1920, height: 1080 }
  }
}

function drawImageFit(ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) {
  const imgRatio = img.width / img.height
  const canvasRatio = width / height

  let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number

  if (imgRatio > canvasRatio) {
    drawHeight = height
    drawWidth = height * imgRatio
    offsetX = (width - drawWidth) / 2
    offsetY = 0
  } else {
    drawWidth = width
    drawHeight = width / imgRatio
    offsetX = 0
    offsetY = (height - drawHeight) / 2
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
}

function drawImageWithKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slide: SlideConfig,
  progress: number,
  width: number,
  height: number
) {
  if (!slide.kenBurns) {
    drawImageFit(ctx, img, width, height)
    return
  }

  const kb = slide.kenBurns
  // Easing pro plynulejší pohyb
  const easedProgress = easeInOutCubic(progress)
  
  const scale = kb.startScale + (kb.endScale - kb.startScale) * easedProgress
  const x = kb.startX + (kb.endX - kb.startX) * easedProgress
  const y = kb.startY + (kb.endY - kb.startY) * easedProgress

  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.scale(scale, scale)
  ctx.translate(-width * x, -height * y)
  drawImageFit(ctx, img, width, height)
  ctx.restore()
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: NonNullable<SlideConfig['text']>,
  width: number,
  height: number
) {
  ctx.save()

  const padding = 24
  ctx.font = `bold ${text.fontSize}px "Google Sans", "Roboto", sans-serif`
  const metrics = ctx.measureText(text.content)
  const textWidth = metrics.width
  const textHeight = text.fontSize

  const x = (width - textWidth) / 2
  let y: number

  switch (text.position) {
    case 'top': y = padding + textHeight; break
    case 'center': y = height / 2 + textHeight / 2; break
    default: y = height - padding - textHeight / 2
  }

  // Pozadí s rounded corners
  const bgColor = text.backgroundColor || 'rgba(0, 0, 0, 0.7)'
  ctx.fillStyle = bgColor
  
  const rectX = x - padding
  const rectY = y - textHeight - padding / 2
  const rectW = textWidth + padding * 2
  const rectH = textHeight + padding
  const radius = 12

  ctx.beginPath()
  ctx.moveTo(rectX + radius, rectY)
  ctx.lineTo(rectX + rectW - radius, rectY)
  ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius)
  ctx.lineTo(rectX + rectW, rectY + rectH - radius)
  ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH)
  ctx.lineTo(rectX + radius, rectY + rectH)
  ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius)
  ctx.lineTo(rectX, rectY + radius)
  ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY)
  ctx.closePath()
  ctx.fill()

  // Text se stínem
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = text.color
  ctx.fillText(text.content, x, y)

  ctx.restore()
}

// ============================================================================
// UTILITIES
// ============================================================================

export async function convertToMP4(webmBlob: Blob): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg()
    
    const webmData = new Uint8Array(await webmBlob.arrayBuffer())
    await ffmpeg.writeFile('input.webm', webmData)
    
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '23',
      '-movflags', '+faststart',
      'output.mp4'
    ])
    
    const mp4Data = await ffmpeg.readFile('output.mp4')
    const arrayBuffer = (mp4Data as Uint8Array).slice().buffer
    return new Blob([arrayBuffer], { type: 'video/mp4' })
  } catch (e) {
    console.warn('MP4 konverze selhala:', e)
    return webmBlob
  }
}

export async function createVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.src = videoUrl
    video.currentTime = 0.5

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    video.onerror = reject
  })
}

export function calculateVideoCost(tier: VideoTier, durationSeconds: number, model?: string): number {
  switch (tier) {
    case 'slideshow': return 0
    case 'motion': return durationSeconds * 0.05
    case 'generative':
      if (model === 'sora-2-pro') return durationSeconds * 0.40
      return durationSeconds * 0.10
    default: return 0
  }
}
