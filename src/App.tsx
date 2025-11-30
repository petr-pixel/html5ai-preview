/**
 * AdCreative Studio - Main Application
 * 
 * Architektura:
 * - Levý Sidebar s navigací
 * - Kontextový editor podle typu kategorie (image/branding/video)
 * - Google Ads Light Style
 */

import React, { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { platforms, getFormatKey, getCategoryType, isBrandingCategory, isVideoCategory, getMaxSizeKB, parseFormatKey } from '@/lib/platforms'
import { generateId, cn, loadImage, drawRoundedRect } from '@/lib/utils'
import { isR2Configured, uploadCreativesToR2Batch } from '@/lib/r2-storage'
import { Sidebar, NavigationView } from '@/components/Sidebar'
import { SettingsModal } from '@/components/SettingsModal'
import { FormatCard } from '@/components/FormatCard'
import { TextOverlayEditor } from '@/components/TextOverlayEditor'
import { WatermarkEditor } from '@/components/WatermarkEditor'
import { QRCodeEditor } from '@/components/QRCodeEditor'
import { GalleryView } from '@/components/GalleryView'
import { BrandKitManager } from '@/components/BrandKitManager'
import { VideoGenerator } from '@/components/VideoGenerator'
import { QuickMode } from '@/components/QuickMode'
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay'
import { ImagePositionControl } from '@/components/ImagePositionControl'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { calculateSmartCrop } from '@/lib/smart-crop'
import { Button, Progress, Spinner } from '@/components/ui'
import {
  Sparkles,
  Upload,
  Download,
  Check,
  Image as ImageIcon,
  AlertTriangle,
  ChevronDown,
  Wand2,
  LayoutGrid,
  ArrowRight,
  Cloud,
} from 'lucide-react'
import type { Creative, TextOverlay, PlatformId, CategoryType } from '@/types'

// ============================================================================
// ENHANCED PROMPT BUILDER - Pro GPT-4o image generation
// ============================================================================

function buildEnhancedPrompt(userPrompt: string, format: 'landscape' | 'square' | 'portrait'): string {
  // GPT-4o works better with natural language prompts, less keyword stuffing
  
  // Detekce typu obsahu z promptu
  const isProduct = /produkt|product|zboží|goods|item|věc/i.test(userPrompt)
  const isLifestyle = /lifestyle|život|living|people|lidé|osoba|člověk/i.test(userPrompt)
  const isFood = /jídlo|food|restaur|café|kafe|drink|pití|pizza|burger/i.test(userPrompt)
  const isTech = /tech|software|app|digital|mobil|phone|computer|laptop/i.test(userPrompt)
  const isNature = /příroda|nature|outdoor|hory|mountain|moře|sea|les|forest|lyž/i.test(userPrompt)
  const isFashion = /móda|fashion|oblečení|clothes|style|styl/i.test(userPrompt)
  
  // Kompozice podle formátu
  const compositionHint = format === 'landscape' 
    ? "Use wide cinematic framing with space on the sides for text overlay."
    : format === 'portrait'
    ? "Use vertical composition with the main subject centered, leaving space at top or bottom for text."
    : "Use balanced square composition with the subject centered."
  
  // Styl podle typu obsahu
  let styleHint = ""
  
  if (isNature || userPrompt.toLowerCase().includes('lyž')) {
    styleHint = "Capture the scene like a professional outdoor/adventure photographer. Natural lighting, vivid colors, dynamic composition that conveys energy and excitement."
  } else if (isProduct) {
    styleHint = "Professional product photography with clean background, perfect studio lighting, and hero angle that showcases the product beautifully."
  } else if (isFood) {
    styleHint = "Appetizing food photography with natural lighting, shallow depth of field, and fresh vibrant colors that make the food look delicious."
  } else if (isTech) {
    styleHint = "Modern tech aesthetic with clean lines, cool tones, and sleek minimalist presentation."
  } else if (isFashion) {
    styleHint = "High-end fashion editorial style with dramatic lighting and sophisticated color palette."
  } else if (isLifestyle) {
    styleHint = "Authentic lifestyle photography capturing a genuine moment with warm, inviting atmosphere."
  } else {
    styleHint = "Professional advertising photography with perfect lighting, compelling composition, and premium quality suitable for a major brand campaign."
  }
  
  // Sestavení promptu pro GPT-4o - přirozený jazyk
  return `${userPrompt}

${styleHint}

${compositionHint}

Technical requirements: Photorealistic, sharp focus, professional color grading. No text, watermarks, or logos in the image. The image should look like it was shot by a top advertising photographer.`
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<NavigationView>('editor')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Store
  const {
    platform,
    category,
    prompt,
    sourceFormat,
    sourceImage,
    selectedFormats,
    creatives,
    textOverlay,
    watermark,
    qrCode,
    isGenerating,
    progress,
    apiKeys,
    imageModelTier,
    textModelTier,
    brandKits,
    activeBrandKit,
    cropMode,
    imageOffset,
    r2Config,
    setPlatform,
    setCategory,
    setPrompt,
    setSourceFormat,
    setSourceImage,
    setCropMode,
    toggleFormat,
    selectAllFormats,
    clearSelection,
    addCreatives,
    setTextOverlay,
    setWatermark,
    addToHistory,
    setIsGenerating,
    setProgress,
  } = useAppStore()

  // Derived state
  const currentPlatform = platforms[platform]
  const currentCategory = currentPlatform?.categories[category]
  const categoryType = getCategoryType(platform, category)
  const maxSizeKB = getMaxSizeKB(platform, category)
  
  const currentBrandKit = activeBrandKit 
    ? brandKits.find(kit => kit.id === activeBrandKit) 
    : brandKits.find(kit => kit.isDefault)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setSourceImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const generateSourceImage = async () => {
    if (!prompt.trim()) {
      alert('Zadejte prompt')
      return
    }
    if (!apiKeys.openai) {
      setSettingsOpen(true)
      return
    }

    setIsGenerating(true)
    setProgress(10)

    try {
      // GPT-4o image generation - supported sizes
      const size = sourceFormat === 'landscape' ? '1536x1024' 
                 : sourceFormat === 'portrait' ? '1024x1536' 
                 : '1024x1024'

      // Build professional prompt
      const enhancedPrompt = buildEnhancedPrompt(prompt, sourceFormat)
      
      console.log('Generating with GPT-4o:', { size, quality: imageModelTier, prompt: enhancedPrompt })

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: enhancedPrompt,
          size: size,
          quality: imageModelTier === 'best' ? 'high' : imageModelTier === 'cheap' ? 'low' : 'medium',
          n: 1,
        }),
      })

      setProgress(60)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || `API error: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('GPT-4o response:', data)

      // GPT-4o returns b64_json in data[0].b64_json
      const b64 = data?.data?.[0]?.b64_json
      if (b64) {
        setSourceImage(`data:image/png;base64,${b64}`)
        setProgress(100)
        return
      }

      // Check for URL response
      const url = data?.data?.[0]?.url
      if (url) {
        setSourceImage(url)
        setProgress(100)
        return
      }

      throw new Error('No image in response')
    } catch (err: any) {
      console.error('Image generation error:', err)
      alert(`Chyba generování: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const createDemoImage = () => {
    const canvas = document.createElement('canvas')
    const w = 1200
    const h = sourceFormat === 'landscape' ? 628 : sourceFormat === 'portrait' ? 1500 : 1200
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a73e8')
    grad.addColorStop(1, '#0d47a1')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''), w / 2, h / 2)

    ctx.font = '20px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('Demo – připojte OpenAI API', w / 2, h / 2 + 45)

    setSourceImage(canvas.toDataURL('image/png'))
    setProgress(100)
  }

  const generateAIText = async (field: 'headline' | 'subheadline') => {
    if (!apiKeys.openai) {
      setSettingsOpen(true)
      return
    }

    setIsGenerating(true)
    try {
      const model = textModelTier === 'cheap' ? 'gpt-4o-mini' : 'gpt-4o'
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 60,
          messages: [
            {
              role: 'user',
              content: `Napiš ${
                field === 'headline' ? 'krátký reklamní headline (max 5 slov)' : 'krátký podtitulek (max 8 slov)'
              } pro reklamu: "${prompt}". Pouze text, žádné uvozovky.`,
            },
          ],
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim() || (field === 'headline' ? 'Speciální nabídka' : 'Jen teď')
      setTextOverlay({ [field]: text })
    } catch {
      setTextOverlay({ [field]: field === 'headline' ? 'Speciální nabídka' : 'Pouze dnes' })
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // APPLY TEXT TO SOURCE IMAGE
  // ============================================================================

  const applyTextToSourceImage = async () => {
    if (!sourceImage) {
      alert('Nejprve nahrajte nebo vygenerujte zdrojový obrázek')
      return
    }
    if (!textOverlay.headline && !textOverlay.subheadline && !textOverlay.cta) {
      alert('Zadejte alespoň jeden text (headline, subheadline nebo CTA)')
      return
    }

    setIsGenerating(true)

    try {
      const img = await loadImage(sourceImage)
      
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Draw text overlay
      const padding = Math.min(img.width, img.height) * 0.04
      const pos = textOverlay.position
      
      // Calculate text position
      let textX = padding
      let textY = img.height - padding
      let textAlign: CanvasTextAlign = 'left'
      
      if (pos.includes('right')) {
        textX = img.width - padding
        textAlign = 'right'
      } else if (pos.includes('center') || pos === 'center') {
        textX = img.width / 2
        textAlign = 'center'
      }
      
      if (pos.includes('top')) {
        textY = padding + 40
      } else if (pos === 'center') {
        textY = img.height / 2
      }
      
      ctx.textAlign = textAlign
      
      // Font sizes relative to image
      const headlineSize = Math.max(24, img.width * 0.05)
      const subheadlineSize = Math.max(16, img.width * 0.03)
      const ctaSize = Math.max(14, img.width * 0.025)
      
      let currentY = textY
      
      // CTA button
      if (textOverlay.cta) {
        const ctaPadding = ctaSize * 0.6
        ctx.font = `bold ${ctaSize}px system-ui, sans-serif`
        const ctaMetrics = ctx.measureText(textOverlay.cta)
        const ctaWidth = ctaMetrics.width + ctaPadding * 2
        const ctaHeight = ctaSize + ctaPadding * 1.5
        
        let ctaX = textX
        if (textAlign === 'right') ctaX = textX - ctaWidth
        else if (textAlign === 'center') ctaX = textX - ctaWidth / 2
        
        // Button background
        ctx.fillStyle = textOverlay.ctaColor || '#f97316'
        drawRoundedRect(ctx, ctaX, currentY - ctaHeight, ctaWidth, ctaHeight, 6)
        ctx.fill()
        
        // Button text
        ctx.fillStyle = '#ffffff'
        ctx.fillText(textOverlay.cta, ctaX + ctaPadding, currentY - ctaPadding)
        
        currentY -= ctaHeight + 10
      }
      
      // Subheadline
      if (textOverlay.subheadline) {
        ctx.font = `${subheadlineSize}px system-ui, sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillText(textOverlay.subheadline, textX, currentY)
        currentY -= subheadlineSize + 8
      }
      
      // Headline
      if (textOverlay.headline) {
        ctx.font = `bold ${headlineSize}px system-ui, sans-serif`
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        ctx.fillText(textOverlay.headline, textX, currentY)
      }
      
      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      
      // Update source image
      const newImageUrl = canvas.toDataURL('image/png')
      setSourceImage(newImageUrl)
      
    } catch (err) {
      console.error('Error applying text:', err)
      alert('Chyba při aplikování textu')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // APPLY LOGO TO SOURCE IMAGE
  // ============================================================================

  const applyLogoToSourceImage = async () => {
    if (!sourceImage) {
      alert('Nejprve nahrajte nebo vygenerujte zdrojový obrázek')
      return
    }
    if (!watermark.image) {
      alert('Nejprve nahrajte logo')
      return
    }

    setIsGenerating(true)

    try {
      const img = await loadImage(sourceImage)
      const logoImg = await loadImage(watermark.image)
      
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Calculate logo size and position
      const logoWidth = (img.width * watermark.size) / 100
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth
      const padding = Math.min(img.width, img.height) * 0.03
      
      let logoX = padding
      let logoY = padding
      
      switch (watermark.position) {
        case 'top-right':
          logoX = img.width - logoWidth - padding
          logoY = padding
          break
        case 'bottom-left':
          logoX = padding
          logoY = img.height - logoHeight - padding
          break
        case 'bottom-right':
          logoX = img.width - logoWidth - padding
          logoY = img.height - logoHeight - padding
          break
        case 'center':
          logoX = (img.width - logoWidth) / 2
          logoY = (img.height - logoHeight) / 2
          break
        default: // top-left
          logoX = padding
          logoY = padding
      }
      
      // Draw logo with opacity
      ctx.globalAlpha = watermark.opacity
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)
      ctx.globalAlpha = 1
      
      // Update source image
      const newImageUrl = canvas.toDataURL('image/png')
      setSourceImage(newImageUrl)
      
    } catch (err) {
      console.error('Error applying logo:', err)
      alert('Chyba při aplikování loga')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // GENERATE CREATIVES
  // ============================================================================

  const generateCreatives = async () => {
    if (!sourceImage) {
      alert('Nejprve nahrajte nebo vygenerujte zdrojový obrázek')
      return
    }
    if (selectedFormats.size === 0) {
      alert('Vyberte alespoň jeden formát')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const formats = Array.from(selectedFormats)
      const newCreatives: Creative[] = []

      // Load source image
      const img = await loadImage(sourceImage)

      for (let i = 0; i < formats.length; i++) {
        const formatKey = formats[i]
        const { platform: plat, category: cat, index } = parseFormatKey(formatKey)
        const fmt = platforms[plat]?.categories[cat]?.formats[index]

        if (!fmt) continue

        setProgress(Math.round(((i + 1) / formats.length) * 100))

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = fmt.width
        canvas.height = fmt.height
        const ctx = canvas.getContext('2d')!
        
        // High quality rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Smart crop nebo základní crop
        let cropResult = { x: 0, y: 0, width: img.width, height: img.height }
        
        // Pro branding typ NEPOUŽÍVAT smart crop
        const catType = getCategoryType(plat, cat)
        
        // Vypočítej základní crop (center crop)
        const srcRatio = img.width / img.height
        const tgtRatio = fmt.width / fmt.height
        
        // Aplikuj ruční offset (v procentech, -50 až +50)
        const applyOffset = (crop: typeof cropResult) => {
          // Offset v pixelech - proporcionálně k velikosti cropu
          const maxOffsetX = (img.width - crop.width) / 2
          const maxOffsetY = (img.height - crop.height) / 2
          
          const offsetX = (imageOffset.x / 50) * maxOffsetX
          const offsetY = (imageOffset.y / 50) * maxOffsetY
          
          return {
            ...crop,
            x: Math.max(0, Math.min(img.width - crop.width, crop.x - offsetX)),
            y: Math.max(0, Math.min(img.height - crop.height, crop.y - offsetY)),
          }
        }
        
        if (cropMode === 'fit') {
          // FIT režim: zachovat celý obrázek, přidat padding pokud potřeba
          // Obrázek se vejde celý do canvasu (letterbox/pillarbox efekt)
          let drawWidth = fmt.width
          let drawHeight = fmt.height
          let drawX = 0
          let drawY = 0
          
          if (srcRatio > tgtRatio) {
            // Zdrojový je širší - přizpůsobíme šířku, výška bude menší
            drawWidth = fmt.width
            drawHeight = fmt.width / srcRatio
            drawY = (fmt.height - drawHeight) / 2
          } else {
            // Zdrojový je vyšší - přizpůsobíme výšku, šířka bude menší
            drawHeight = fmt.height
            drawWidth = fmt.height * srcRatio
            drawX = (fmt.width - drawWidth) / 2
          }
          
          // Pozadí (bílé nebo z brand kit)
          ctx.fillStyle = currentBrandKit?.backgroundColor || '#ffffff'
          ctx.fillRect(0, 0, fmt.width, fmt.height)
          
          // Aplikuj offset na pozici v FIT režimu
          const fitOffsetX = (imageOffset.x / 50) * ((fmt.width - drawWidth) / 2)
          const fitOffsetY = (imageOffset.y / 50) * ((fmt.height - drawHeight) / 2)
          
          // Nakresli obrázek zachovaný celý
          ctx.drawImage(img, 0, 0, img.width, img.height, drawX + fitOffsetX, drawY + fitOffsetY, drawWidth, drawHeight)
        } else if (catType === 'image' && cropMode === 'smart') {
          // SMART režim: inteligentní ořez
          try {
            cropResult = await calculateSmartCrop(sourceImage, fmt.width, fmt.height, { minScale: 0.5 })
            cropResult = applyOffset(cropResult)
          } catch {
            // Fallback na základní crop
            if (srcRatio > tgtRatio) {
              const newW = img.height * tgtRatio
              cropResult = { x: (img.width - newW) / 2, y: 0, width: newW, height: img.height }
            } else {
              const newH = img.width / tgtRatio
              cropResult = { x: 0, y: (img.height - newH) / 2, width: img.width, height: newH }
            }
            cropResult = applyOffset(cropResult)
          }
          ctx.drawImage(
            img,
            cropResult.x, cropResult.y, cropResult.width, cropResult.height,
            0, 0, fmt.width, fmt.height
          )
        } else {
          // Pro branding nebo fallback - center crop
          if (srcRatio > tgtRatio) {
            const newW = img.height * tgtRatio
            cropResult = { x: (img.width - newW) / 2, y: 0, width: newW, height: img.height }
          } else {
            const newH = img.width / tgtRatio
            cropResult = { x: 0, y: (img.height - newH) / 2, width: img.width, height: newH }
          }
          cropResult = applyOffset(cropResult)
          ctx.drawImage(
            img,
            cropResult.x, cropResult.y, cropResult.width, cropResult.height,
            0, 0, fmt.width, fmt.height
          )
        }

        // Draw text overlay
        if (textOverlay.enabled) {
          drawTextOverlay(ctx, textOverlay, fmt.width, fmt.height, currentBrandKit)
        }

        // Draw watermark (logo from Brand Kit)
        if (watermark.enabled && watermark.image) {
          await drawWatermark(ctx, watermark, fmt.width, fmt.height)
        } else if (currentBrandKit?.logoSquare || currentBrandKit?.logoHorizontal) {
          // Auto-apply brand kit logo
          const logoUrl = currentBrandKit.logoHorizontal || currentBrandKit.logoSquare
          if (logoUrl) {
            await drawWatermark(ctx, {
              enabled: true,
              image: logoUrl,
              opacity: 0.9,
              size: 12,
              position: 'bottom-right'
            }, fmt.width, fmt.height)
          }
        }

        // Export as high quality PNG for preview, JPEG compression happens during export
        const imageUrl = canvas.toDataURL('image/png')

        newCreatives.push({
          id: generateId(),
          formatKey,
          platform: plat as PlatformId,
          category: cat,
          format: fmt,
          imageUrl,
          createdAt: new Date(),
          sizeKB: Math.round((imageUrl.length * 3) / 4 / 1024),
        })
      }

      // Upload do R2 pokud je nakonfigurováno
      let finalCreatives = newCreatives
      if (isR2Configured(r2Config)) {
        setProgress(95)
        try {
          const uploadResults = await uploadCreativesToR2Batch(
            r2Config,
            newCreatives.map(c => ({
              id: c.id,
              imageUrl: c.imageUrl,
              platform: c.platform,
              format: c.format,
            }))
          )
          
          // Update URLs with R2 URLs
          finalCreatives = newCreatives.map(c => {
            const result = uploadResults.find(r => r.id === c.id)
            if (result?.uploadedToR2) {
              return { ...c, imageUrl: result.imageUrl }
            }
            return c
          })
        } catch (err) {
          console.warn('R2 upload failed, using local storage:', err)
        }
      }

      addCreatives(finalCreatives)

      // Save to history
      addToHistory({
        id: generateId(),
        prompt,
        sourceImage,
        creatives: finalCreatives,
        textOverlay,
        watermark,
        qrCode,
        createdAt: new Date(),
        platform,
      })

      setProgress(100)
    } catch (err) {
      console.error(err)
      alert('Chyba při generování')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = async () => {
    const creativesArray = Object.values(creatives) as Creative[]
    if (creativesArray.length === 0) {
      alert('Žádné kreativy k exportu')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      const zip = await createCreativePackZip(creativesArray, (p) => setProgress(p))
      downloadBlob(zip, `adcreative-pack-${Date.now()}.zip`)
    } catch (err) {
      console.error(err)
      alert('Chyba při exportu')
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderDashboard = () => (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Celkem kreativ</div>
          <div className="text-3xl font-semibold text-gray-900">{Object.keys(creatives).length}</div>
        </div>
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Sklik</div>
          <div className="text-3xl font-semibold text-gray-900">
            {(Object.values(creatives) as Creative[]).filter(c => c.platform === 'sklik').length}
          </div>
        </div>
        <div className="card-google p-6">
          <div className="text-sm text-gray-500 mb-1">Google Ads</div>
          <div className="text-3xl font-semibold text-gray-900">
            {(Object.values(creatives) as Creative[]).filter(c => c.platform === 'google').length}
          </div>
        </div>
      </div>

      <div className="card-google p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Rychlé akce</h2>
        <div className="flex gap-3">
          <button onClick={() => setCurrentView('editor')} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            Nová kreativa
          </button>
          <button onClick={() => setCurrentView('video')} className="btn-secondary">
            Vytvořit video
          </button>
        </div>
      </div>
    </div>
  )

  const renderEditor = () => (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Source & Settings */}
      <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Platforma</h2>
          <div className="flex gap-2">
            {Object.entries(platforms).map(([key, p]) => (
              <button
                key={key}
                onClick={() => {
                  setPlatform(key as PlatformId)
                  const firstCat = Object.keys(p.categories)[0]
                  setCategory(firstCat)
                }}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  platform === key
                    ? 'bg-blue-50 text-[#1a73e8] border border-[#1a73e8]'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                )}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Kategorie</h2>
          <div className="space-y-1">
            {Object.entries(currentPlatform.categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
                  category === key
                    ? 'bg-blue-50 text-[#1a73e8]'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{cat.name}</div>
                  <div className="text-xs text-gray-500 truncate">max {cat.maxSizeKB} kB</div>
                </div>
                {cat.type === 'branding' && (
                  <span className="badge-yellow text-[10px]">Safe Zone</span>
                )}
                {cat.type === 'video' && (
                  <span className="badge-blue text-[10px]">Video</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Video redirect */}
        {categoryType === 'video' ? (
          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Pro tvorbu videí přejděte do Video Studia
              </p>
              <button onClick={() => setCurrentView('video')} className="btn-primary">
                Video Studio
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Source Image */}
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Zdrojový obrázek</h2>
              
              {/* Format selection */}
              <div className="flex gap-2 mb-3">
                {(['landscape', 'square', 'portrait'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSourceFormat(fmt)}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all',
                      sourceFormat === fmt
                        ? 'bg-[#1a73e8] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {fmt === 'landscape' ? '16:9' : fmt === 'square' ? '1:1' : '4:5'}
                  </button>
                ))}
              </div>

              {/* Prompt */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Popište obrázek pro AI generování..."
                className="input-google mb-3 h-20 text-sm resize-none"
              />

              {/* Generate / Upload buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={generateSourceImage}
                  disabled={isGenerating}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  {isGenerating ? <Spinner size={16} /> : <Wand2 className="w-4 h-4" />}
                  Generovat
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-sm py-2"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Source preview */}
              {sourceImage && (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={sourceImage} alt="Source" className="w-full" />
                </div>
              )}

              {/* Crop Mode */}
              {sourceImage && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Režim ořezu
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCropMode('smart')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2',
                        cropMode === 'smart'
                          ? 'bg-blue-50 text-[#1a73e8] border border-[#1a73e8]'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Wand2 className="w-3 h-3" />
                      Smart Crop
                    </button>
                    <button
                      onClick={() => setCropMode('fit')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2',
                        cropMode === 'fit'
                          ? 'bg-blue-50 text-[#1a73e8] border border-[#1a73e8]'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      Fit (celý)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {cropMode === 'smart' 
                      ? 'AI detekuje hlavní objekt a ořízne' 
                      : 'Zachová celý obrázek (pro grafiky s textem)'
                    }
                  </p>
                </div>
              )}
              
              {/* Image Position Control */}
              {sourceImage && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <ImagePositionControl />
                </div>
              )}
            </div>

            {/* Conditional editors based on category type */}
            {categoryType === 'image' && (
              <>
                <TextOverlayEditor 
                  onGenerateAI={generateAIText} 
                  onApplyToImage={applyTextToSourceImage}
                  isGenerating={isGenerating} 
                />
                <WatermarkEditor 
                  onApplyToImage={applyLogoToSourceImage}
                  isGenerating={isGenerating}
                />
              </>
            )}

            {categoryType === 'branding' && (
              <>
                <TextOverlayEditor 
                  onGenerateAI={generateAIText} 
                  onApplyToImage={applyTextToSourceImage}
                  isGenerating={isGenerating} 
                />
                {/* Safe Zone info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-yellow-800">Safe Zone</div>
                        <div className="text-xs text-yellow-700 mt-1">
                          {currentCategory?.formats[0]?.safeZone?.description || 
                           'Středová část může být zakrytá obsahem webu.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Main Content - Format Grid */}
      {categoryType !== 'video' && (
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          {/* Toolbar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {currentCategory?.name}
                </h2>
                <span className="badge-gray">
                  {currentCategory?.formats.length} formátů
                </span>
                {maxSizeKB <= 150 && (
                  <span className="badge-red">
                    ⚠️ Max {maxSizeKB} kB
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const keys = currentCategory?.formats.map((_, i) => 
                      getFormatKey(platform, category, i)
                    ) || []
                    selectAllFormats(keys)
                  }}
                  className="btn-ghost text-sm py-1.5"
                >
                  Vybrat vše
                </button>
                <button
                  onClick={clearSelection}
                  className="btn-ghost text-sm py-1.5"
                >
                  Zrušit výběr
                </button>
                <button
                  onClick={generateCreatives}
                  disabled={isGenerating || selectedFormats.size === 0 || !sourceImage}
                  className="btn-primary"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size={16} />
                      {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generovat ({selectedFormats.size})
                    </>
                  )}
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-3">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Format Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentCategory?.formats.map((format, index) => {
                const formatKey = getFormatKey(platform, category, index)
                const isSelected = selectedFormats.has(formatKey)
                const creative = creatives[formatKey]
                const hasSafeZone = format.safeZone !== undefined

                return (
                  <div
                    key={formatKey}
                    onClick={() => toggleFormat(formatKey)}
                    className={cn(
                      'format-card',
                      isSelected && 'format-card-selected'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'format-card-checkbox',
                      isSelected && 'format-card-checkbox-checked'
                    )}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>

                    {/* Preview */}
                    <div 
                      className="relative bg-gray-100 rounded mb-2 overflow-hidden"
                      style={{ 
                        paddingBottom: `${(format.height / format.width) * 100}%`,
                        maxHeight: '120px'
                      }}
                    >
                      {creative ? (
                        <img 
                          src={creative.imageUrl} 
                          alt={format.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : sourceImage ? (
                        <img 
                          src={sourceImage} 
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      {/* Safe Zone Overlay for branding */}
                      {hasSafeZone && format.safeZone && (
                        <SafeZoneOverlay 
                          safeZone={format.safeZone}
                          width={format.width}
                          height={format.height}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {format.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format.width} × {format.height}
                    </div>
                    {creative?.sizeKB && (
                      <div className={cn(
                        'text-xs mt-1',
                        creative.sizeKB > maxSizeKB ? 'text-red-600 font-medium' : 'text-green-600'
                      )}>
                        {creative.sizeKB} kB {creative.sizeKB > maxSizeKB && '⚠️'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export bar */}
          {Object.keys(creatives).length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(creatives).length} kreativ připraveno k exportu
                </div>
                <button onClick={handleExport} className="btn-primary">
                  <Download className="w-4 h-4" />
                  Stáhnout ZIP
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderVideoStudio = () => (
    <div className="flex-1 overflow-y-auto">
      <VideoGenerator />
    </div>
  )

  const renderLibrary = () => (
    <div className="flex-1 overflow-y-auto">
      <GalleryView />
    </div>
  )

  const renderBrandKits = () => (
    <div className="flex-1 overflow-y-auto">
      <BrandKitManager />
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main-content flex flex-col">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'quickmode' && <QuickMode />}
        {currentView === 'editor' && renderEditor()}
        {currentView === 'video' && renderVideoStudio()}
        {currentView === 'library' && renderLibrary()}
        {currentView === 'brandkits' && renderBrandKits()}
        {currentView === 'settings' && (
          <div className="p-8">
            <SettingsModal open={true} onOpenChange={() => setCurrentView('dashboard')} />
          </div>
        )}
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  width: number,
  height: number,
  brandKit?: { ctaColor?: string; headlineFont?: string; textColor?: string }
) {
  if (!overlay.headline && !overlay.subheadline && !overlay.cta) {
    return
  }

  // Detect banner aspect ratio for smart sizing
  const aspectRatio = width / height
  const isWide = aspectRatio > 2.5  // Leaderboard, Billboard (970x90, 970x250)
  const isTall = aspectRatio < 0.5  // Skyscraper, Half Page (160x600, 300x600)
  const isSquarish = aspectRatio >= 0.5 && aspectRatio <= 2.5

  const padding = Math.min(width, height) * 0.06
  const fontFamily = brandKit?.headlineFont || 'Arial, Helvetica, sans-serif'
  const textColor = brandKit?.textColor || '#ffffff'
  const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#ff6600'

  // Smart font sizing based on banner dimensions
  // For wide banners: use height as base but ensure readability
  // For tall banners: use width as base
  // For square-ish: use smaller dimension
  let baseSize: number
  if (isWide) {
    baseSize = height * 0.9  // Wide banners - use most of height
  } else if (isTall) {
    baseSize = width * 0.8   // Tall banners - use most of width
  } else {
    baseSize = Math.min(width, height)
  }

  // Font size multipliers based on overlay.fontSize setting
  const sizeMultipliers = {
    small: { headline: 0.18, sub: 0.12, cta: 0.10 },
    medium: { headline: 0.24, sub: 0.15, cta: 0.12 },
    large: { headline: 0.32, sub: 0.18, cta: 0.14 },
  }
  const multiplier = sizeMultipliers[overlay.fontSize] || sizeMultipliers.medium
  
  // Calculate actual font sizes with min/max bounds
  const size = {
    headline: Math.max(12, Math.min(baseSize * multiplier.headline, 72)),
    sub: Math.max(10, Math.min(baseSize * multiplier.sub, 48)),
    cta: Math.max(9, Math.min(baseSize * multiplier.cta, 36)),
  }

  // Calculate total text block height
  let blockHeight = 0
  if (overlay.headline) blockHeight += size.headline * 1.3
  if (overlay.subheadline) blockHeight += size.sub * 1.4
  if (overlay.cta) blockHeight += size.cta * 2.8

  // For wide banners, stack horizontally if needed
  const useHorizontalLayout = isWide && blockHeight > height * 0.8

  // Calculate starting position
  const position = overlay.position || 'bottom-left'
  let x = padding
  let y = padding
  let align: CanvasTextAlign = 'left'

  if (useHorizontalLayout) {
    // Wide banner: center everything vertically
    y = (height - size.headline) / 2
    switch (position) {
      case 'top-left':
      case 'bottom-left':
        x = padding
        align = 'left'
        break
      case 'top-center':
      case 'center':
      case 'bottom-center':
        x = width / 2
        align = 'center'
        break
      case 'top-right':
      case 'bottom-right':
        x = width - padding
        align = 'right'
        break
    }
  } else {
    // Normal vertical stacking
    switch (position) {
      case 'top-left':
        x = padding
        y = padding
        align = 'left'
        break
      case 'top-center':
        x = width / 2
        y = padding
        align = 'center'
        break
      case 'top-right':
        x = width - padding
        y = padding
        align = 'right'
        break
      case 'center':
        x = width / 2
        y = (height - blockHeight) / 2
        align = 'center'
        break
      case 'bottom-left':
        x = padding
        y = height - padding - blockHeight
        align = 'left'
        break
      case 'bottom-center':
        x = width / 2
        y = height - padding - blockHeight
        align = 'center'
        break
      case 'bottom-right':
        x = width - padding
        y = height - padding - blockHeight
        align = 'right'
        break
      default:
        x = width / 2
        y = (height - blockHeight) / 2
        align = 'center'
    }
  }

  ctx.textAlign = align
  let currentY = y

  // Draw headline
  if (overlay.headline) {
    ctx.font = `bold ${Math.round(size.headline)}px ${fontFamily}`
    ctx.fillStyle = textColor
    
    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = Math.max(2, size.headline * 0.1)
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    
    ctx.textBaseline = 'top'
    ctx.fillText(overlay.headline, x, currentY)
    currentY += size.headline * 1.3
  }

  // Draw subheadline (skip for very wide banners to save space)
  if (overlay.subheadline && !useHorizontalLayout) {
    ctx.font = `${Math.round(size.sub)}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = Math.max(1, size.sub * 0.08)
    ctx.textBaseline = 'top'
    ctx.fillText(overlay.subheadline, x, currentY)
    currentY += size.sub * 1.4
  }

  // Reset shadow before CTA
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Draw CTA Button (skip for very small banners)
  if (overlay.cta && size.cta >= 9) {
    ctx.font = `bold ${Math.round(size.cta)}px ${fontFamily}`
    const ctaTextWidth = ctx.measureText(overlay.cta).width
    const ctaPaddingX = size.cta * 0.8
    const ctaPaddingY = size.cta * 0.4
    const ctaWidth = ctaTextWidth + ctaPaddingX * 2
    const ctaHeight = size.cta + ctaPaddingY * 2
    const ctaRadius = Math.min(ctaHeight / 2, 8)

    // Calculate CTA X position based on alignment
    let ctaX = x
    if (align === 'center') {
      ctaX = x - ctaWidth / 2
    } else if (align === 'right') {
      ctaX = x - ctaWidth
    }

    // Draw button background
    ctx.fillStyle = ctaColor
    drawRoundedRect(ctx, ctaX, currentY, ctaWidth, ctaHeight, ctaRadius)
    ctx.fill()

    // Draw button text (centered in button)
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(overlay.cta, ctaX + ctaWidth / 2, currentY + ctaHeight / 2)
  }

  // Reset context
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: { image: string | null; opacity: number; size: number; position: string },
  width: number,
  height: number
) {
  if (!watermark.image) return

  try {
    const img = await loadImage(watermark.image)
    const maxSize = Math.min(width, height) * (watermark.size / 100)
    const ratio = img.width / img.height
    const w = ratio > 1 ? maxSize : maxSize * ratio
    const h = ratio > 1 ? maxSize / ratio : maxSize

    let x = 0
    let y = 0
    const margin = Math.min(width, height) * 0.03

    switch (watermark.position) {
      case 'top-left':
        x = margin
        y = margin
        break
      case 'top-right':
        x = width - w - margin
        y = margin
        break
      case 'bottom-left':
        x = margin
        y = height - h - margin
        break
      case 'bottom-right':
        x = width - w - margin
        y = height - h - margin
        break
      case 'center':
        x = (width - w) / 2
        y = (height - h) / 2
        break
    }

    ctx.globalAlpha = watermark.opacity
    ctx.drawImage(img, x, y, w, h)
    ctx.globalAlpha = 1
  } catch (err) {
    console.error('Watermark error:', err)
  }
}
