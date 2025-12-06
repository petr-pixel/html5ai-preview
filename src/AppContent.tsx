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
import { outpaintImage } from '@/lib/openai-client'
import { UnifiedSidebar, DashboardView, type ViewType } from '@/components/UnifiedSidebar'
import { SettingsModal } from '@/components/SettingsModal'
import { FormatCard } from '@/components/FormatCard'
import { TextOverlayEditor } from '@/components/TextOverlayEditor'
import { WatermarkEditor } from '@/components/WatermarkEditor'
import { QRCodeEditor } from '@/components/QRCodeEditor'
import { GalleryView } from '@/components/GalleryView'
import { AIBrandingKit } from '@/components/AIBrandingKit'
import { SlideshowBuilder } from '@/components/SlideshowBuilder'
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay'
import { ImagePositionControl } from '@/components/ImagePositionControl'
import { PerFormatTextEditor } from '@/components/PerFormatTextEditor'
import { FormatEditorV2 } from '@/components/FormatEditorV2'
import { ToolsPanel, ToolsButton } from '@/components/ToolsPanel'
import { UserMenu } from '@/components/Auth'
import { downloadBlob, createCreativePackZip } from '@/lib/export'
import { calculateSmartCrop } from '@/lib/smart-crop'
// AI Tools
import { CreativeScoring } from '@/components/CreativeScoring'
import { AICopywriter } from '@/components/AICopywriter'
import { MagicResize } from '@/components/MagicResize'
import { TemplateLibrary } from '@/components/TemplateLibrary'
import { BulkEditMode } from '@/components/BulkEditMode'
import { MobilePreview } from '@/components/MobilePreview'
import { AdminDashboard } from '@/components/AdminDashboard'
import { useStorageSync } from '@/hooks/useStorageSync'
import { CostEstimate, CostBadge, calculateCost, formatPrice } from '@/components/CostEstimate'
import { PRICING } from '@/lib/openai-client'
import { Button, Progress, Spinner, Tooltip, IconButton } from '@/components/ui'
// Mobile & Keyboard
import { MobileMenuButton, MobileMenuOverlay, useMobileMenu } from '@/components/MobileMenu'
import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/KeyboardShortcuts'
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

export function AppContent() {
  // Storage synchronization
  useStorageSync()
  
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<{ key: string; format: any } | null>(null)
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Mobile menu
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu, isMobile } = useMobileMenu()
  
  // Keyboard shortcuts
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts((view) => {
    if (view === 'settings') {
      setSettingsOpen(true)
    } else {
      setCurrentView(view as ViewType)
    }
  })

  // Keyboard shortcut for tools panel (Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setToolsPanelOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    formatOffsets,
    perFormatTextSettings,
    outpaintedImages,
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
        const imageUrl = `data:image/png;base64,${b64}`
        setSourceImage(imageUrl)
        
        // Uložit do galerie jako "zdrojový" obrázek
        const sourceCreative: Creative = {
          id: generateId(),
          formatKey: `source-${sourceFormat}`,
          platform: platform,
          category: 'source',
          format: { 
            width: sourceFormat === 'landscape' ? 1536 : sourceFormat === 'portrait' ? 1024 : 1024, 
            height: sourceFormat === 'landscape' ? 1024 : sourceFormat === 'portrait' ? 1536 : 1024, 
            name: `AI Source (${sourceFormat})` 
          },
          imageUrl: imageUrl,
          createdAt: new Date(),
          prompt: prompt,
          isSource: true,
        }
        addCreatives([sourceCreative])
        
        setProgress(100)
        return
      }

      // Check for URL response
      const url = data?.data?.[0]?.url
      if (url) {
        setSourceImage(url)
        
        // Uložit do galerie
        const sourceCreative: Creative = {
          id: generateId(),
          formatKey: `source-${sourceFormat}`,
          platform: platform,
          category: 'source',
          format: { 
            width: sourceFormat === 'landscape' ? 1536 : sourceFormat === 'portrait' ? 1024 : 1024, 
            height: sourceFormat === 'landscape' ? 1024 : sourceFormat === 'portrait' ? 1536 : 1024, 
            name: `AI Source (${sourceFormat})` 
          },
          imageUrl: url,
          createdAt: new Date(),
          prompt: prompt,
          isSource: true,
        }
        addCreatives([sourceCreative])
        
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
        
        // Získej offset pro tento konkrétní formát
        const formatOffset = formatOffsets[formatKey] || { x: 0, y: 0 }
        
        // Zkontroluj zda máme uložený outpainted obrázek z FormatEditoru
        const savedOutpaintedImage = outpaintedImages[formatKey]
        
        // Aplikuj ruční offset (v procentech, -50 až +50)
        const applyOffset = (crop: typeof cropResult) => {
          // Offset v pixelech - proporcionálně k velikosti cropu
          const maxOffsetX = (img.width - crop.width) / 2
          const maxOffsetY = (img.height - crop.height) / 2
          
          const offsetX = (formatOffset.x / 50) * maxOffsetX
          const offsetY = (formatOffset.y / 50) * maxOffsetY
          
          return {
            ...crop,
            x: Math.max(0, Math.min(img.width - crop.width, crop.x - offsetX)),
            y: Math.max(0, Math.min(img.height - crop.height, crop.y - offsetY)),
          }
        }
        
        // Pokud máme uložený outpainted obrázek, použijeme ho přímo
        if (savedOutpaintedImage) {
          try {
            const outpaintedImg = await loadImage(savedOutpaintedImage)
            ctx.drawImage(outpaintedImg, 0, 0, fmt.width, fmt.height)
          } catch {
            // Fallback - nakresli původní obrázek s offsetem
            ctx.fillStyle = currentBrandKit?.backgroundColor || '#ffffff'
            ctx.fillRect(0, 0, fmt.width, fmt.height)
            const srcRatioLocal = img.width / img.height
            const tgtRatioLocal = fmt.width / fmt.height
            let dW = fmt.width, dH = fmt.height, dX = 0, dY = 0
            if (srcRatioLocal > tgtRatioLocal) {
              dW = fmt.width
              dH = fmt.width / srcRatioLocal
              dY = (fmt.height - dH) / 2
            } else {
              dH = fmt.height
              dW = fmt.height * srcRatioLocal
              dX = (fmt.width - dW) / 2
            }
            ctx.drawImage(img, dX, dY, dW, dH)
          }
        } else if (cropMode === 'fit') {
          // FIT režim: zachovat celý obrázek, přidat padding pokud potřeba
          // Nebo použít AI outpainting pro rozšíření
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
          
          // Detekuj zda je potřeba outpainting (prázdné místo > 15%)
          const emptyRatio = 1 - (drawWidth * drawHeight) / (fmt.width * fmt.height)
          const needsOutpainting = emptyRatio > 0.15 && apiKeys.openai
          
          if (needsOutpainting) {
            // Zkus AI outpainting pro rozšíření obrázku
            try {
              const outpaintResult = await outpaintImage(
                { apiKey: apiKeys.openai },
                {
                  image: sourceImage,
                  targetWidth: fmt.width,
                  targetHeight: fmt.height,
                  prompt: prompt ? `Continue the background: ${prompt}` : undefined,
                }
              )
              
              if (outpaintResult.success && outpaintResult.image) {
                // Použij outpaintovaný obrázek
                const outpaintedImg = await loadImage(outpaintResult.image)
                ctx.drawImage(outpaintedImg, 0, 0, fmt.width, fmt.height)
              } else {
                // Fallback - blur fill pozadí
                ctx.filter = 'blur(25px)'
                ctx.drawImage(img, -15, -15, fmt.width + 30, fmt.height + 30)
                ctx.filter = 'none'
                ctx.fillStyle = 'rgba(0,0,0,0.15)'
                ctx.fillRect(0, 0, fmt.width, fmt.height)
                
                const fitOffsetX = (formatOffset.x / 50) * ((fmt.width - drawWidth) / 2)
                const fitOffsetY = (formatOffset.y / 50) * ((fmt.height - drawHeight) / 2)
                ctx.drawImage(img, 0, 0, img.width, img.height, drawX + fitOffsetX, drawY + fitOffsetY, drawWidth, drawHeight)
              }
            } catch {
              // Fallback na normální FIT
              ctx.fillStyle = currentBrandKit?.backgroundColor || '#ffffff'
              ctx.fillRect(0, 0, fmt.width, fmt.height)
              const fitOffsetX = (formatOffset.x / 50) * ((fmt.width - drawWidth) / 2)
              const fitOffsetY = (formatOffset.y / 50) * ((fmt.height - drawHeight) / 2)
              ctx.drawImage(img, 0, 0, img.width, img.height, drawX + fitOffsetX, drawY + fitOffsetY, drawWidth, drawHeight)
            }
          } else {
            // Normální FIT bez outpaintingu
            ctx.fillStyle = currentBrandKit?.backgroundColor || '#ffffff'
            ctx.fillRect(0, 0, fmt.width, fmt.height)
            
            const fitOffsetX = (formatOffset.x / 50) * ((fmt.width - drawWidth) / 2)
            const fitOffsetY = (formatOffset.y / 50) * ((fmt.height - drawHeight) / 2)
            ctx.drawImage(img, 0, 0, img.width, img.height, drawX + fitOffsetX, drawY + fitOffsetY, drawWidth, drawHeight)
          }
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
          const formatTextSettings = perFormatTextSettings[formatKey]
          drawTextOverlay(ctx, textOverlay, fmt.width, fmt.height, currentBrandKit, formatTextSettings)
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

      addCreatives(newCreatives)

      // Save to history
      addToHistory({
        id: generateId(),
        prompt,
        sourceImage,
        creatives: newCreatives,
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
    <div className="flex flex-1 overflow-hidden mesh-gradient-static">
      {/* Left Panel - Source & Settings */}
      <div className="w-80 border-r border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-y-auto">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white mb-3">Platforma</h2>
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
                  'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                  platform === key
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20 hover:text-white/80'
                )}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white mb-3">Kategorie</h2>
          <div className="space-y-1">
            {Object.entries(currentPlatform.categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all',
                  // Disable branding a interscroller
                  (key === 'branding' || key === 'interscroller') && 'opacity-50 cursor-not-allowed',
                  category === key
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                )}
                disabled={key === 'branding' || key === 'interscroller'}
              >
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{cat.name}</div>
                  <div className="text-xs text-white/40 truncate">max {cat.maxSizeKB} kB</div>
                </div>
                {(key === 'branding' || key === 'interscroller') && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-medium">SOON</span>
                )}
                {cat.type === 'branding' && key !== 'branding' && key !== 'interscroller' && (
                  <span className="badge-gradient text-[10px]">Safe Zone</span>
                )}
                {cat.type === 'video' && (
                  <span className="badge-cyan text-[10px]">Video</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Video redirect */}
        {categoryType === 'video' ? (
          <div className="p-4">
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-white/60 mb-3">
                Pro tvorbu videí přejděte do Video Studia
              </p>
              <button onClick={() => setCurrentView('video')} className="btn-gradient">
                Video Studio
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Source Image */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white mb-3">Zdrojový obrázek</h2>
              
              {/* Format selection */}
              <div className="flex gap-2 mb-3">
                {(['landscape', 'square', 'portrait'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSourceFormat(fmt)}
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all',
                      sourceFormat === fmt
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
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
                className="input-glass mb-3 h-20 text-sm resize-none"
              />

              {/* Generate / Upload buttons */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={generateSourceImage}
                  disabled={isGenerating}
                  className="btn-gradient flex-1 text-sm py-2"
                >
                  {isGenerating ? <Spinner size={16} /> : <Wand2 className="w-4 h-4" />}
                  Generovat
                  <CostBadge cost={calculateCost('image', { 
                    quality: imageModelTier === 'best' ? 'high' : imageModelTier === 'cheap' ? 'low' : 'medium',
                    size: sourceFormat === 'landscape' ? '1536x1024' : sourceFormat === 'portrait' ? '1024x1536' : '1024x1024'
                  })} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-glass text-sm py-2"
                  title="Nahrát vlastní obrázek (zdarma)"
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
              
              {/* Cost info */}
              {prompt && !sourceImage && (
                <div className="text-xs text-white/40 mb-3 flex items-center gap-1">
                  <span>💡</span>
                  <span>Nahrání vlastního obrázku je zdarma</span>
                </div>
              )}

              {/* Source preview */}
              {sourceImage && (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={sourceImage} alt="Source" className="w-full" />
                </div>
              )}

              {/* Crop Mode */}
              {sourceImage && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-white/60 mb-2">
                    Režim ořezu
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCropMode('smart')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2',
                        cropMode === 'smart'
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      )}
                    >
                      <Wand2 className="w-3 h-3" />
                      Smart Crop
                    </button>
                    <button
                      onClick={() => setCropMode('fit')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2',
                        cropMode === 'fit'
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                      )}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      Fit (celý)
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">
                    {cropMode === 'smart' 
                      ? 'AI detekuje hlavní objekt a ořízne' 
                      : 'Zachová celý obrázek (pro grafiky s textem)'
                    }
                  </p>
                </div>
              )}
              
              {/* Image Position Control */}
              {sourceImage && (
                <div className="mt-3 pt-3 border-t border-white/10">
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
                <PerFormatTextEditor />
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
                <PerFormatTextEditor />
                {/* Safe Zone info */}
                <div className="p-4 border-b border-white/10">
                  <div className="glass-card p-3 border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-amber-300">Safe Zone</div>
                        <div className="text-xs text-amber-200/70 mt-1">
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
        <div className="flex-1 overflow-y-auto mesh-gradient-static">
          {/* Toolbar */}
          <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-white">
                  {currentCategory?.name}
                </h2>
                <span className="badge-gradient">
                  {currentCategory?.formats.length} formátů
                </span>
                {maxSizeKB <= 150 && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
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
                  className="btn-gradient"
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
                      {cropMode === 'fit' && selectedFormats.size > 0 && apiKeys.openai && (
                        <CostBadge cost={calculateCost('outpaint', { 
                          quality: 'medium',
                          count: Math.ceil(selectedFormats.size * 0.5) // ~50% formátů může potřebovat outpaint
                        })} />
                      )}
                    </>
                  )}
                </button>
              </div>
              
              {/* Cost warning for fit mode */}
              {cropMode === 'fit' && selectedFormats.size > 0 && apiKeys.openai && (
                <div className="text-xs text-amber-400/70 flex items-center gap-1.5 mt-2">
                  <span>⚡</span>
                  <span>Fit režim může použít AI outpainting pro ~{Math.ceil(selectedFormats.size * 0.5)} formátů</span>
                </div>
              )}
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
                const hasCustomSettings = perFormatTextSettings[formatKey] && (
                  perFormatTextSettings[formatKey].fontSizeMultiplier !== 1.0 ||
                  perFormatTextSettings[formatKey].hideHeadline ||
                  perFormatTextSettings[formatKey].hideSubheadline ||
                  perFormatTextSettings[formatKey].hideCta ||
                  perFormatTextSettings[formatKey].customPosition
                )

                return (
                  <div
                    key={formatKey}
                    className={cn(
                      'format-card',
                      isSelected && 'format-card-selected'
                    )}
                  >
                    {/* Checkbox */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleFormat(formatKey) }}
                      className={cn(
                        'absolute top-2 right-2 w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors z-10',
                        isSelected 
                          ? 'bg-violet-500 border-violet-500 text-white' 
                          : 'border-white/30 hover:border-white/50'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>

                    {/* Preview */}
                    <div 
                      onClick={() => setEditingFormat({ key: formatKey, format })}
                      className="relative bg-white/5 rounded-xl mb-2 overflow-hidden cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all"
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
                          <ImageIcon className="w-8 h-8 text-white/20" />
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

                      {/* Edit hint on hover */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="text-white text-xs font-medium bg-violet-500/80 px-2 py-1 rounded-lg">
                          Upravit
                        </span>
                      </div>

                      {/* Custom settings badge */}
                      {hasCustomSettings && (
                        <div className="absolute top-1 left-1 w-2 h-2 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" title="Vlastní nastavení" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-sm font-medium text-white truncate">
                      {format.name}
                    </div>
                    <div className="text-xs text-white/50">
                      {format.width} × {format.height}
                    </div>
                    {creative?.sizeKB && (
                      <div className={cn(
                        'text-xs mt-1',
                        creative.sizeKB > maxSizeKB ? 'text-red-400 font-medium' : 'text-emerald-400'
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
            <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">
                  {Object.keys(creatives).length} kreativ připraveno k exportu
                </div>
                <button onClick={handleExport} className="btn-gradient">
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
    <div className="flex-1 overflow-hidden mesh-gradient-static">
      <SlideshowBuilder />
    </div>
  )

  const renderLibrary = () => (
    <div className="flex-1 overflow-y-auto mesh-gradient-static">
      <GalleryView />
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="flex h-screen mesh-gradient-bg">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <UnifiedSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          selectedPlatform={platform}
          selectedCategory={category}
          onPlatformChange={setPlatform}
          onCategoryChange={setCategory}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <DashboardView 
            onViewChange={setCurrentView}
            onOpenBrandKit={() => setCurrentView('ai-branding')}
            onExportAll={handleExport}
          />
        )}
        
        {/* Generator */}
        {currentView === 'formats' && renderEditor()}
        
        {/* AI Tools */}
        {currentView === 'ai-scoring' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <CreativeScoring />
          </div>
        )}
        {currentView === 'ai-copywriter' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <AICopywriter />
          </div>
        )}
        {currentView === 'ai-resize' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <MagicResize />
          </div>
        )}
        {currentView === 'ai-templates' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <TemplateLibrary />
          </div>
        )}
        {currentView === 'ai-branding' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <AIBrandingKit />
          </div>
        )}
        
        {/* Video */}
        {currentView === 'video-slideshow' && (
          <div className="flex-1 overflow-y-auto mesh-gradient-static">
            <SlideshowBuilder />
          </div>
        )}
        
        {/* Assets */}
        {currentView === 'gallery' && renderLibrary()}
        
        {/* Preview & Export */}
        {currentView === 'mobile-preview' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <MobilePreview />
          </div>
        )}
        {currentView === 'bulk-edit' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <BulkEditMode />
          </div>
        )}
        {currentView === 'export' && renderLibrary()}
        
        {/* Settings */}
        {currentView === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 mesh-gradient-static">
            <SettingsModal open={true} onOpenChange={() => setCurrentView('dashboard')} />
          </div>
        )}
        
        {/* Admin */}
        {currentView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Format Editor Modal */}
      {editingFormat && (
        <FormatEditorV2
          formatKey={editingFormat.key}
          format={editingFormat.format}
          sourceImage={sourceImage}
          onClose={() => setEditingFormat(null)}
          onSave={(textLayer, renderedImage) => {
            const creative = {
              id: `${editingFormat.key}-${Date.now()}`,
              formatKey: editingFormat.key,
              platform: platform as any,
              category: category,
              format: editingFormat.format,
              baseImageUrl: sourceImage || '',
              imageUrl: renderedImage,
              textLayer,
              createdAt: new Date(),
            }
            addCreatives([creative])
          }}
        />
      )}

      {/* Tools Panel (Ctrl+K) */}
      <ToolsPanel 
        isOpen={toolsPanelOpen} 
        onClose={() => setToolsPanelOpen(false)} 
      />

      {/* Floating User Menu */}
      <div className="fixed top-4 right-4 z-30">
        <UserMenu 
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSubscription={() => setCurrentView('settings')}
        />
      </div>
      
      {/* Mobile Menu Button */}
      <MobileMenuButton isOpen={mobileMenuOpen} onToggle={toggleMobileMenu} />
      
      {/* Mobile Menu Overlay */}
      <MobileMenuOverlay isOpen={mobileMenuOpen} onToggle={toggleMobileMenu} onClose={closeMobileMenu}>
        <UnifiedSidebar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view)
            closeMobileMenu()
          }}
          selectedPlatform={platform}
          selectedCategory={category}
          onPlatformChange={(p) => {
            setPlatform(p)
            closeMobileMenu()
          }}
          onCategoryChange={setCategory}
        />
      </MobileMenuOverlay>
      
      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcuts 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
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
  brandKit?: { ctaColor?: string; headlineFont?: string; textColor?: string },
  perFormatSettings?: { fontSizeMultiplier?: number; hideHeadline?: boolean; hideSubheadline?: boolean; hideCta?: boolean; customPosition?: string }
) {
  if (!overlay.headline && !overlay.subheadline && !overlay.cta) {
    return
  }

  // Per-format overrides
  const fontSizeMultiplier = perFormatSettings?.fontSizeMultiplier || 1.0
  const hideHeadline = perFormatSettings?.hideHeadline || false
  const hideSubheadline = perFormatSettings?.hideSubheadline || false
  const hideCta = perFormatSettings?.hideCta || false
  const positionOverride = perFormatSettings?.customPosition

  const aspectRatio = width / height
  const isWide = aspectRatio > 3  // Leaderboard 728x90, Billboard 970x90
  const isSemiWide = aspectRatio > 2 && aspectRatio <= 3  // 970x250, 970x310
  const isTall = aspectRatio < 0.6  // Skyscraper 160x600, Half Page 300x600
  const isSemiTall = aspectRatio >= 0.6 && aspectRatio < 0.8  // 300x250 ish
  const isSmall = width <= 320 || height <= 100
  const isVerySmall = width <= 200 || height <= 60

  const padding = Math.max(8, Math.min(width, height) * 0.05)
  const fontFamily = brandKit?.headlineFont || 'Arial, Helvetica, sans-serif'
  const textColor = brandKit?.textColor || '#ffffff'
  const ctaColor = overlay.ctaColor || brandKit?.ctaColor || '#ff6600'

  // Dynamické velikosti fontů podle formátu
  const sizeMultipliers = {
    small: { headline: 0.14, sub: 0.10, cta: 0.09 },
    medium: { headline: 0.18, sub: 0.12, cta: 0.10 },
    large: { headline: 0.22, sub: 0.14, cta: 0.12 },
  }
  const mult = sizeMultipliers[overlay.fontSize] || sizeMultipliers.medium

  let headlineSize: number
  let subSize: number
  let ctaSize: number

  if (isVerySmall) {
    // Velmi malé: jen headline nebo CTA
    headlineSize = Math.min(height * 0.35, width * 0.08)
    subSize = 0
    ctaSize = Math.min(height * 0.25, width * 0.06)
  } else if (isWide) {
    // Široké (728x90, 970x90): velikost podle výšky
    headlineSize = height * 0.32 * (mult.headline / 0.18)
    subSize = height * 0.20 * (mult.sub / 0.12)
    ctaSize = height * 0.22 * (mult.cta / 0.10)
  } else if (isSemiWide) {
    // Pološirké (970x250): mix
    headlineSize = Math.min(height * 0.15, width * 0.035) * (mult.headline / 0.18)
    subSize = Math.min(height * 0.10, width * 0.025) * (mult.sub / 0.12)
    ctaSize = Math.min(height * 0.10, width * 0.022) * (mult.cta / 0.10)
  } else if (isTall) {
    // Vysoké (160x600, 300x600): velikost podle šířky
    headlineSize = width * 0.14 * (mult.headline / 0.18)
    subSize = width * 0.09 * (mult.sub / 0.12)
    ctaSize = width * 0.10 * (mult.cta / 0.10)
  } else if (isSmall) {
    // Malé (320x100, 320x50)
    headlineSize = Math.min(height * 0.28, width * 0.07)
    subSize = Math.min(height * 0.18, width * 0.045)
    ctaSize = Math.min(height * 0.20, width * 0.05)
  } else {
    // Normální čtvercové/obdélníkové
    const base = Math.min(width, height)
    headlineSize = base * mult.headline
    subSize = base * mult.sub
    ctaSize = base * mult.cta
  }

  // Aplikuj per-format multiplier
  headlineSize *= fontSizeMultiplier
  subSize *= fontSizeMultiplier
  ctaSize *= fontSizeMultiplier

  // Limity
  headlineSize = Math.max(10, Math.min(headlineSize, 56))
  subSize = Math.max(8, Math.min(subSize, 32))
  ctaSize = Math.max(8, Math.min(ctaSize, 24))

  // Co zobrazit (respektuj per-format hide flags)
  const showHeadline = !isVerySmall && overlay.headline && !hideHeadline
  const showSubheadline = !isSmall && !isWide && overlay.subheadline && !hideSubheadline
  const showCta = overlay.cta && ctaSize >= 8 && !hideCta

  // Word wrap helper
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    ctx.font = `bold ${fontSize}px ${fontFamily}`
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''
    
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = testLine
      }
    }
    if (line) lines.push(line)
    return lines
  }

  // Vypočítej max šířku textu
  const maxTextWidth = width - padding * 2

  // Připrav řádky
  const headlineLines = showHeadline ? wrapText(overlay.headline, maxTextWidth, headlineSize) : []
  const subLines = showSubheadline ? wrapText(overlay.subheadline!, maxTextWidth, subSize) : []

  // Vypočítej celkovou výšku bloku
  let blockHeight = 0
  if (headlineLines.length) blockHeight += headlineLines.length * headlineSize * 1.15 + 4
  if (subLines.length) blockHeight += subLines.length * subSize * 1.15 + 4
  if (showCta) blockHeight += ctaSize * 2.2

  // Pozice (s možným per-format override)
  const position = positionOverride || overlay.position || 'bottom-left'
  let x = padding
  let startY = padding
  let align: CanvasTextAlign = 'left'

  // Horizontální pozice
  if (position.includes('right')) {
    x = width - padding
    align = 'right'
  } else if (position.includes('center') || position === 'center') {
    x = width / 2
    align = 'center'
  }

  // Vertikální pozice
  if (position.includes('bottom')) {
    startY = height - padding - blockHeight
  } else if (position === 'center') {
    startY = (height - blockHeight) / 2
  }

  // Ujisti se že nezačínáme mimo canvas
  startY = Math.max(padding / 2, Math.min(startY, height - blockHeight - padding / 2))

  ctx.textAlign = align
  ctx.textBaseline = 'top'
  let currentY = startY

  // Headline
  if (headlineLines.length > 0) {
    ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = Math.max(2, headlineSize * 0.08)
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    for (const line of headlineLines) {
      ctx.fillText(line, x, currentY)
      currentY += headlineSize * 1.15
    }
    currentY += 4
  }

  // Subheadline
  if (subLines.length > 0) {
    ctx.font = `${Math.round(subSize)}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = Math.max(1, subSize * 0.06)

    for (const line of subLines) {
      ctx.fillText(line, x, currentY)
      currentY += subSize * 1.15
    }
    currentY += 4
  }

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // CTA Button
  if (showCta && overlay.cta) {
    ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
    let ctaText = overlay.cta
    let ctaTextWidth = ctx.measureText(ctaText).width
    
    // Zkrať text pokud je moc dlouhý
    const maxCtaTextWidth = maxTextWidth - ctaSize * 1.2
    if (ctaTextWidth > maxCtaTextWidth) {
      // Zmenši font
      const scaleFactor = maxCtaTextWidth / ctaTextWidth
      ctaSize = Math.max(8, ctaSize * scaleFactor)
      ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
      ctaTextWidth = ctx.measureText(ctaText).width
    }

    const ctaPaddingX = Math.max(ctaSize * 0.5, 6)
    const ctaPaddingY = Math.max(ctaSize * 0.3, 4)
    const ctaWidth = ctaTextWidth + ctaPaddingX * 2
    const ctaHeight = ctaSize + ctaPaddingY * 2
    const ctaRadius = Math.min(ctaHeight / 2.5, 6)

    // CTA pozice
    let ctaX = x
    if (align === 'center') {
      ctaX = x - ctaWidth / 2
    } else if (align === 'right') {
      ctaX = x - ctaWidth
    }

    // Clamp do banneru
    ctaX = Math.max(padding / 2, Math.min(ctaX, width - ctaWidth - padding / 2))
    const ctaY = Math.min(currentY, height - ctaHeight - padding / 2)

    // Kresli button
    ctx.fillStyle = ctaColor
    drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius)
    ctx.fill()

    // Text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ctaText, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2)
  }

  // Reset
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
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
