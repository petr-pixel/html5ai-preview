/**
 * Slideshow Generator
 * Vytváří video z obrázků pomocí Canvas a MediaRecorder
 * S Ken Burns efektem (zoom a pan)
 */

interface SlideshowOptions {
  images: string[]
  duration: number // sekundy
  aspectRatio: '16:9' | '9:16' | '1:1'
  kenBurns: boolean
  text?: {
    headline?: string
    cta?: string
  }
  fps?: number
}

interface Dimensions {
  width: number
  height: number
}

function getAspectDimensions(aspectRatio: string): Dimensions {
  const dimensions: Record<string, Dimensions> = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
  }
  return dimensions[aspectRatio] || dimensions['16:9']
}

export async function generateSlideshow(options: SlideshowOptions): Promise<Blob> {
  const {
    images,
    duration,
    aspectRatio,
    kenBurns,
    text,
    fps = 30,
  } = options

  const { width, height } = getAspectDimensions(aspectRatio)
  const totalFrames = duration * fps
  const framesPerImage = Math.floor(totalFrames / images.length)

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Load images
  const loadedImages = await Promise.all(
    images.map((src) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    })
  )

  // Setup MediaRecorder
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000, // 5 Mbps
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      resolve(blob)
    }

    recorder.onerror = (e) => {
      reject(new Error('Recorder error'))
    }

    recorder.start()

    let currentFrame = 0
    let currentImageIndex = 0

    // Ken Burns parameters for each image
    const kenBurnsParams = loadedImages.map(() => ({
      startScale: 1 + Math.random() * 0.2, // 1.0 - 1.2
      endScale: 1.1 + Math.random() * 0.2,  // 1.1 - 1.3
      startX: Math.random() * 0.2 - 0.1,    // -0.1 to 0.1
      startY: Math.random() * 0.2 - 0.1,
      endX: Math.random() * 0.2 - 0.1,
      endY: Math.random() * 0.2 - 0.1,
    }))

    function drawFrame() {
      if (currentFrame >= totalFrames) {
        recorder.stop()
        return
      }

      // Calculate current image and progress
      currentImageIndex = Math.min(
        Math.floor(currentFrame / framesPerImage),
        loadedImages.length - 1
      )
      const frameInImage = currentFrame % framesPerImage
      const progress = frameInImage / framesPerImage

      const img = loadedImages[currentImageIndex]
      const params = kenBurnsParams[currentImageIndex]

      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Calculate Ken Burns transform
      let scale = 1
      let offsetX = 0
      let offsetY = 0

      if (kenBurns) {
        scale = params.startScale + (params.endScale - params.startScale) * progress
        offsetX = (params.startX + (params.endX - params.startX) * progress) * width
        offsetY = (params.startY + (params.endY - params.startY) * progress) * height
      }

      // Draw image with cover fit
      const imgAspect = img.width / img.height
      const canvasAspect = width / height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image is wider - fit to height
        drawHeight = height * scale
        drawWidth = drawHeight * imgAspect
        drawX = (width - drawWidth) / 2 + offsetX
        drawY = (height - drawHeight) / 2 + offsetY
      } else {
        // Image is taller - fit to width
        drawWidth = width * scale
        drawHeight = drawWidth / imgAspect
        drawX = (width - drawWidth) / 2 + offsetX
        drawY = (height - drawHeight) / 2 + offsetY
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

      // Draw text overlay
      if (text?.headline) {
        const fontSize = Math.min(width, height) * 0.06
        const padding = fontSize * 0.5
        
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
        const textWidth = ctx.measureText(text.headline).width

        // Background
        const bgX = (width - textWidth) / 2 - padding
        const bgY = height * 0.75 - fontSize
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(bgX, bgY, textWidth + padding * 2, fontSize + padding)

        // Text
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(text.headline, width / 2, height * 0.75)

        // CTA button
        if (text.cta) {
          const ctaFontSize = fontSize * 0.6
          ctx.font = `bold ${ctaFontSize}px Arial, sans-serif`
          const ctaWidth = ctx.measureText(text.cta).width
          const ctaPadding = ctaFontSize * 0.5
          const ctaY = height * 0.75 + padding + ctaFontSize

          // Button background
          ctx.fillStyle = '#f59e0b'
          const ctaX = (width - ctaWidth - ctaPadding * 2) / 2
          ctx.beginPath()
          ctx.roundRect(ctaX, ctaY - ctaFontSize, ctaWidth + ctaPadding * 2, ctaFontSize + ctaPadding, 8)
          ctx.fill()

          // Button text
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.fillText(text.cta, width / 2, ctaY)
        }
      }

      // Fade transitions between images
      if (frameInImage < fps * 0.5) {
        // Fade in (first 0.5 second)
        const fadeProgress = frameInImage / (fps * 0.5)
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeProgress})`
        ctx.fillRect(0, 0, width, height)
      } else if (frameInImage > framesPerImage - fps * 0.5) {
        // Fade out (last 0.5 second)
        const fadeProgress = (frameInImage - (framesPerImage - fps * 0.5)) / (fps * 0.5)
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeProgress})`
        ctx.fillRect(0, 0, width, height)
      }

      currentFrame++
      requestAnimationFrame(drawFrame)
    }

    // Start rendering
    drawFrame()
  })
}

/**
 * Convert WebM to MP4 (requires FFmpeg.wasm - optional)
 * For now, we return WebM which works in most browsers
 */
export async function convertToMp4(webmBlob: Blob): Promise<Blob> {
  // TODO: Implement FFmpeg.wasm conversion
  // For now, return WebM as is
  return webmBlob
}
