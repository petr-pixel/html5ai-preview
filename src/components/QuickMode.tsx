/**
 * QuickMode - Rychlé generování celého balíčku kreativ
 * 
 * Flow:
 * 1. Vyber brand
 * 2. Vyber/vytvoř šablonu kampaně
 * 3. Zadej URL a krátký brief
 * 4. Vyber jazyky a kanály
 * 5. Klikni Generate → dostaneš kompletní bundle
 */

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Progress, Badge } from '@/components/ui'
import { generateId, cn, loadImage } from '@/lib/utils'
import { platforms } from '@/lib/platforms'
import { 
  Rocket, 
  Globe, 
  Zap,
  Package,
  FileText,
  Video,
  Download,
  Loader2,
  Check,
  ChevronRight,
  Sparkles,
  Building2,
  Target,
  Languages
} from 'lucide-react'
import type { 
  QuickModeConfig, 
  SupportedLanguage, 
  CampaignTemplate,
  Creative 
} from '@/types'

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const DEFAULT_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'sale',
    name: 'Slevová akce',
    description: 'Sleva X% na vybrané produkty',
    headlines: {
      cs: ['Sleva %X%% na %PRODUCT%', '%PRODUCT% se slevou %X%%', 'Akce: %X%% dolů'],
      sk: ['Zľava %X%% na %PRODUCT%', '%PRODUCT% so zľavou %X%%', 'Akcia: %X%% dole'],
      de: ['%X%% Rabatt auf %PRODUCT%', '%PRODUCT% mit %X%% Rabatt'],
      en: ['%X%% off %PRODUCT%', 'Save %X%% on %PRODUCT%'],
    },
    subheadlines: {
      cs: ['Platí do %DATE%', 'Pouze do vyprodání zásob', 'Limitovaná nabídka'],
      sk: ['Platí do %DATE%', 'Len do vypredania zásob', 'Limitovaná ponuka'],
      de: ['Gültig bis %DATE%', 'Nur solange der Vorrat reicht'],
      en: ['Valid until %DATE%', 'While supplies last'],
    },
    ctas: {
      cs: ['Nakoupit', 'Zobrazit akci', 'Využít slevu'],
      sk: ['Nakúpiť', 'Zobraziť akciu', 'Využiť zľavu'],
      de: ['Jetzt kaufen', 'Angebot ansehen'],
      en: ['Shop now', 'View offer'],
    },
    variables: ['X', 'DATE', 'PRODUCT'],
    recommendedFormats: {
      google: ['banners', 'pmax'],
      sklik: ['banners', 'kombinovana'],
    },
    defaultUrlPattern: '/akce/',
    category: 'sale',
  },
  {
    id: 'new_collection',
    name: 'Nová kolekce',
    description: 'Představení nové kolekce/produktů',
    headlines: {
      cs: ['Nová kolekce %PRODUCT%', 'Právě dorazilo: %PRODUCT%', 'Novinka: %PRODUCT%'],
      sk: ['Nová kolekcia %PRODUCT%', 'Práve dorazilo: %PRODUCT%', 'Novinka: %PRODUCT%'],
      de: ['Neue %PRODUCT% Kollektion', 'Neu eingetroffen: %PRODUCT%'],
      en: ['New %PRODUCT% Collection', 'Just arrived: %PRODUCT%'],
    },
    subheadlines: {
      cs: ['Objevte novinky', 'Buďte první', 'Exkluzivně online'],
      sk: ['Objavte novinky', 'Buďte prvý', 'Exkluzívne online'],
      de: ['Entdecken Sie Neuheiten', 'Seien Sie der Erste'],
      en: ['Discover new arrivals', 'Be the first'],
    },
    ctas: {
      cs: ['Prozkoumat', 'Zobrazit kolekci', 'Objevit'],
      sk: ['Preskúmať', 'Zobraziť kolekciu', 'Objaviť'],
      de: ['Entdecken', 'Kollektion ansehen'],
      en: ['Explore', 'View collection'],
    },
    variables: ['PRODUCT'],
    recommendedFormats: {
      google: ['banners', 'pmax', 'youtube'],
      sklik: ['banners', 'branding'],
    },
    defaultUrlPattern: '/novinky/',
    category: 'new_collection',
  },
  {
    id: 'black_friday',
    name: 'Black Friday',
    description: 'Black Friday / Cyber Monday akce',
    headlines: {
      cs: ['Black Friday %X%% OFF', 'Černý pátek: až %X%% sleva', 'BF akce: %X%% dolů'],
      sk: ['Black Friday %X%% OFF', 'Čierny piatok: až %X%% zľava'],
      de: ['Black Friday %X%% OFF', 'Bis zu %X%% Rabatt'],
      en: ['Black Friday %X%% OFF', 'Up to %X%% off'],
    },
    subheadlines: {
      cs: ['Jen %DATE%', 'Největší slevy roku', '24 hodin mega slev'],
      sk: ['Len %DATE%', 'Najväčšie zľavy roka'],
      de: ['Nur am %DATE%', 'Die größten Rabatte des Jahres'],
      en: ['Only %DATE%', 'Biggest sale of the year'],
    },
    ctas: {
      cs: ['Nakoupit teď', 'Black Friday slevy', 'Nečekat'],
      sk: ['Nakúpiť teraz', 'Black Friday zľavy'],
      de: ['Jetzt kaufen', 'Black Friday Deals'],
      en: ['Shop now', 'Get deals'],
    },
    variables: ['X', 'DATE'],
    recommendedFormats: {
      google: ['banners', 'pmax', 'demandgen'],
      sklik: ['banners', 'kombinovana', 'html5'],
    },
    defaultUrlPattern: '/black-friday/',
    category: 'seasonal',
  },
]

// ============================================================================
// LANGUAGE CONFIG
// ============================================================================

const LANGUAGES: { code: SupportedLanguage; name: string; flag: string }[] = [
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'si', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickMode() {
  const { 
    brandKits, 
    activeBrandKit, 
    setActiveBrandKit,
    apiKeys,
    setSourceImage,
    addCreatives,
  } = useAppStore()

  // Config state
  const [config, setConfig] = useState<QuickModeConfig>({
    brandKitId: activeBrandKit,
    templateId: 'sale',
    campaignName: '',
    landingUrl: '',
    briefDescription: '',
    variables: {},
    languages: ['cs'],
    channels: {
      googleDisplay: true,
      googlePMax: false,
      googleYouTube: false,
      googleDemandGen: false,
      sklikBannery: true,
      sklikKombinovana: false,
      sklikHTML5: false,
    },
    generateRSATexts: true,
    generateVideo: false,
    videoLength: 15,
  })

  // UI state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [generatedBundle, setGeneratedBundle] = useState<any>(null)

  // Current template
  const currentTemplate = useMemo(() => 
    DEFAULT_TEMPLATES.find(t => t.id === config.templateId),
    [config.templateId]
  )

  // Current brand kit
  const currentBrandKit = useMemo(() =>
    brandKits.find(b => b.id === config.brandKitId),
    [brandKits, config.brandKitId]
  )

  // Estimated outputs
  const estimatedOutputs = useMemo(() => {
    let bannerCount = 0
    let channels: string[] = []

    if (config.channels.googleDisplay) {
      bannerCount += 8 // Standardní Google Display sada
      channels.push('Google Display')
    }
    if (config.channels.googlePMax) {
      bannerCount += 6 // PMax formáty
      channels.push('Google PMax')
    }
    if (config.channels.sklikBannery) {
      bannerCount += 10 // Sklik bannery
      channels.push('Sklik Bannery')
    }
    if (config.channels.sklikKombinovana) {
      bannerCount += 3 // Kombinovaná reklama
      channels.push('Sklik Kombinovaná')
    }

    const totalBanners = bannerCount * config.languages.length

    return {
      banners: totalBanners,
      languages: config.languages.length,
      channels: channels.length,
      channelNames: channels,
      videos: config.generateVideo ? config.languages.length * 2 : 0, // 16:9 + 9:16
      rsaTexts: config.generateRSATexts ? config.languages.length : 0,
    }
  }, [config])

  // Update config
  const updateConfig = (partial: Partial<QuickModeConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }))
  }

  // Toggle language
  const toggleLanguage = (lang: SupportedLanguage) => {
    setConfig(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  // Toggle channel
  const toggleChannel = (channel: keyof QuickModeConfig['channels']) => {
    setConfig(prev => ({
      ...prev,
      channels: { ...prev.channels, [channel]: !prev.channels[channel] }
    }))
  }

  // Generate bundle
  const handleGenerate = async () => {
    if (!apiKeys.openai) {
      alert('Nejprve nastavte OpenAI API klíč v Settings')
      return
    }
    if (!config.briefDescription.trim()) {
      alert('Zadejte popis kampaně')
      return
    }
    if (config.languages.length === 0) {
      alert('Vyberte alespoň jeden jazyk')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setProgressMessage('Připravuji generování...')

    try {
      const allCreatives: Creative[] = []
      let totalSteps = 0
      let currentStep = 0

      // Spočítej celkový počet kroků
      const activeChannels = Object.entries(config.channels).filter(([_, v]) => v)
      totalSteps = 1 + (activeChannels.length * config.languages.length) // 1 pro obrázek + bannery

      // =====================================================================
      // KROK 1: Vygenerovat zdrojový obrázek přes GPT-4o
      // =====================================================================
      setProgressMessage('Generuji zdrojový obrázek přes GPT-4o...')
      
      // Sestav prompt z šablony a briefu
      const imagePrompt = buildImagePrompt(config, currentTemplate, currentBrandKit)
      
      const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: imagePrompt,
          size: '1536x1024', // Landscape pro většinu bannerů
          quality: 'high',
          n: 1,
        }),
      })

      if (!imageRes.ok) {
        const err = await imageRes.json()
        throw new Error(err.error?.message || 'Chyba generování obrázku')
      }

      const imageData = await imageRes.json()
      const sourceImageB64 = imageData?.data?.[0]?.b64_json
      if (!sourceImageB64) {
        throw new Error('Nepodařilo se vygenerovat obrázek')
      }
      
      const sourceImageUrl = `data:image/png;base64,${sourceImageB64}`
      setSourceImage(sourceImageUrl)
      
      currentStep++
      setProgress(Math.round((currentStep / totalSteps) * 100))

      // Load source image for canvas operations
      const img = await loadImage(sourceImageUrl)

      // =====================================================================
      // KROK 2: Pro každý jazyk a kanál vygenerovat bannery
      // =====================================================================
      
      for (const lang of config.languages) {
        // Získej texty pro tento jazyk
        const texts = getTextsForLanguage(lang, config, currentTemplate)

        // Google Display
        if (config.channels.googleDisplay) {
          setProgressMessage(`Generuji Google Display bannery (${lang.toUpperCase()})...`)
          
          const googleFormats = [
            { width: 300, height: 250, name: 'Medium Rectangle' },
            { width: 336, height: 280, name: 'Large Rectangle' },
            { width: 728, height: 90, name: 'Leaderboard' },
            { width: 300, height: 600, name: 'Half Page' },
            { width: 320, height: 100, name: 'Large Mobile' },
            { width: 970, height: 250, name: 'Billboard' },
            { width: 160, height: 600, name: 'Wide Skyscraper' },
            { width: 300, height: 50, name: 'Mobile Banner' },
          ]

          for (const fmt of googleFormats) {
            const creative = await generateBannerCreative(
              img, fmt, texts, currentBrandKit, 'google', `display-${lang}`
            )
            allCreatives.push(creative)
          }

          currentStep++
          setProgress(Math.round((currentStep / totalSteps) * 100))
        }

        // Google PMax
        if (config.channels.googlePMax) {
          setProgressMessage(`Generuji PMax bannery (${lang.toUpperCase()})...`)
          
          const pmaxFormats = [
            { width: 1200, height: 628, name: 'Landscape' },
            { width: 1200, height: 1200, name: 'Square' },
            { width: 960, height: 1200, name: 'Portrait' },
            { width: 600, height: 314, name: 'Small Landscape' },
            { width: 314, height: 314, name: 'Small Square' },
            { width: 314, height: 393, name: 'Small Portrait' },
          ]

          for (const fmt of pmaxFormats) {
            const creative = await generateBannerCreative(
              img, fmt, texts, currentBrandKit, 'google', `pmax-${lang}`
            )
            allCreatives.push(creative)
          }

          currentStep++
          setProgress(Math.round((currentStep / totalSteps) * 100))
        }

        // Sklik Bannery
        if (config.channels.sklikBannery) {
          setProgressMessage(`Generuji Sklik bannery (${lang.toUpperCase()})...`)
          
          const sklikFormats = [
            { width: 300, height: 300, name: 'Square' },
            { width: 300, height: 250, name: 'Medium Rectangle' },
            { width: 480, height: 300, name: 'Wide Rectangle' },
            { width: 300, height: 600, name: 'Half Page' },
            { width: 970, height: 310, name: 'Billboard' },
            { width: 970, height: 210, name: 'Billboard Small' },
            { width: 320, height: 100, name: 'Mobile Banner' },
            { width: 728, height: 90, name: 'Leaderboard' },
            { width: 480, height: 120, name: 'Wide Banner' },
            { width: 320, height: 50, name: 'Mobile Small' },
          ]

          for (const fmt of sklikFormats) {
            const creative = await generateBannerCreative(
              img, fmt, texts, currentBrandKit, 'sklik', `bannery-${lang}`
            )
            allCreatives.push(creative)
          }

          currentStep++
          setProgress(Math.round((currentStep / totalSteps) * 100))
        }

        // Sklik Kombinovaná
        if (config.channels.sklikKombinovana) {
          setProgressMessage(`Generuji Sklik Kombinovaná (${lang.toUpperCase()})...`)
          
          const kombiFormats = [
            { width: 1200, height: 628, name: 'Landscape 1200x628' },
            { width: 1200, height: 1200, name: 'Square 1200x1200' },
            { width: 1200, height: 300, name: 'Logo 1200x300' },
          ]

          for (const fmt of kombiFormats) {
            const creative = await generateBannerCreative(
              img, fmt, texts, currentBrandKit, 'sklik', `kombinovana-${lang}`
            )
            allCreatives.push(creative)
          }

          currentStep++
          setProgress(Math.round((currentStep / totalSteps) * 100))
        }
      }

      // =====================================================================
      // KROK 3: Uložit kreativy a připravit výstup
      // =====================================================================
      setProgressMessage('Ukládám kreativy...')
      addCreatives(allCreatives)

      setProgress(100)
      setProgressMessage('Hotovo!')
      
      setGeneratedBundle({
        timestamp: new Date(),
        languages: config.languages,
        bannerCount: allCreatives.length,
        creatives: allCreatives,
      })

    } catch (err: any) {
      console.error('Quick Mode generation error:', err)
      alert(`Chyba: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper: Build image prompt from config
  function buildImagePrompt(
    cfg: QuickModeConfig, 
    template: CampaignTemplate | undefined,
    brandKit: any
  ): string {
    let prompt = cfg.briefDescription

    // Přidej kontext z šablony
    if (template) {
      prompt += `. Campaign type: ${template.name}.`
    }

    // Přidej brand kontext
    if (brandKit) {
      prompt += ` Brand: ${brandKit.name}.`
    }

    // Přidej technické požadavky
    prompt += `

Professional advertising photography. Clean composition with space for text overlay.
Photorealistic, sharp focus, professional color grading.
No text, watermarks, or logos in the image.
Suitable for banner ads and display advertising.`

    return prompt
  }

  // Helper: Get texts for specific language
  function getTextsForLanguage(
    lang: SupportedLanguage,
    cfg: QuickModeConfig,
    template: CampaignTemplate | undefined
  ): { headline: string; subheadline: string; cta: string } {
    if (!template) {
      return { headline: '', subheadline: '', cta: '' }
    }

    // Získej texty pro jazyk (nebo fallback na EN/CS)
    const headlines = template.headlines[lang] || template.headlines['en'] || template.headlines['cs'] || []
    const subheadlines = template.subheadlines[lang] || template.subheadlines['en'] || template.subheadlines['cs'] || []
    const ctas = template.ctas[lang] || template.ctas['en'] || template.ctas['cs'] || []

    // Vyber první variantu a nahraď proměnné
    let headline = headlines[0] || ''
    let subheadline = subheadlines[0] || ''
    let cta = ctas[0] || ''

    // Nahraď proměnné
    for (const [key, value] of Object.entries(cfg.variables)) {
      const regex = new RegExp(`%${key}%`, 'g')
      headline = headline.replace(regex, value)
      subheadline = subheadline.replace(regex, value)
      cta = cta.replace(regex, value)
    }

    return { headline, subheadline, cta }
  }

  // Helper: Generate single banner creative
  async function generateBannerCreative(
    sourceImg: HTMLImageElement,
    format: { width: number; height: number; name: string },
    texts: { headline: string; subheadline: string; cta: string },
    brandKit: any,
    platform: 'google' | 'sklik',
    category: string
  ): Promise<Creative> {
    const canvas = document.createElement('canvas')
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')!

    // High quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Smart crop calculation
    const srcRatio = sourceImg.width / sourceImg.height
    const tgtRatio = format.width / format.height
    let cropX = 0, cropY = 0, cropW = sourceImg.width, cropH = sourceImg.height

    if (srcRatio > tgtRatio) {
      cropW = sourceImg.height * tgtRatio
      cropX = (sourceImg.width - cropW) / 2
    } else {
      cropH = sourceImg.width / tgtRatio
      cropY = (sourceImg.height - cropH) / 2
    }

    // Draw image
    ctx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, format.width, format.height)

    // Draw text overlay
    if (texts.headline || texts.subheadline || texts.cta) {
      drawQuickModeTextOverlay(ctx, format.width, format.height, texts, brandKit)
    }

    const imageUrl = canvas.toDataURL('image/png')

    return {
      id: generateId(),
      formatKey: `${platform}-${category}-${format.width}x${format.height}`,
      platform: platform,
      category: category,
      format: format as any,
      imageUrl,
      createdAt: new Date(),
      sizeKB: Math.round((imageUrl.length * 3) / 4 / 1024),
    }
  }

  // Helper: Draw text overlay for Quick Mode
  function drawQuickModeTextOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    texts: { headline: string; subheadline: string; cta: string },
    brandKit: any
  ) {
    const aspectRatio = width / height
    const isWide = aspectRatio > 2.5
    const isTall = aspectRatio < 0.5

    const padding = Math.min(width, height) * 0.06
    const ctaColor = brandKit?.ctaColor || '#ff6600'
    const textColor = '#ffffff'
    const fontFamily = 'Arial, Helvetica, sans-serif'

    // Font sizing
    let baseSize = isWide ? height * 0.7 : isTall ? width * 0.6 : Math.min(width, height)
    const headlineSize = Math.max(12, Math.min(baseSize * 0.2, 48))
    const subSize = Math.max(10, Math.min(baseSize * 0.12, 32))
    const ctaSize = Math.max(9, Math.min(baseSize * 0.1, 24))

    // Position - bottom left
    let y = height - padding
    const x = padding

    // Draw CTA first (from bottom)
    if (texts.cta) {
      ctx.font = `bold ${Math.round(ctaSize)}px ${fontFamily}`
      const ctaTextWidth = ctx.measureText(texts.cta).width
      const ctaPadX = ctaSize * 0.8
      const ctaPadY = ctaSize * 0.4
      const ctaW = ctaTextWidth + ctaPadX * 2
      const ctaH = ctaSize + ctaPadY * 2

      y -= ctaH
      
      // Button background
      ctx.fillStyle = ctaColor
      ctx.beginPath()
      ctx.roundRect(x, y, ctaW, ctaH, ctaH / 2)
      ctx.fill()

      // Button text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(texts.cta, x + ctaW / 2, y + ctaH / 2)

      y -= padding * 0.5
    }

    // Draw subheadline
    if (texts.subheadline && !isWide) {
      ctx.font = `${Math.round(subSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      y -= subSize * 0.3
      ctx.fillText(texts.subheadline, x, y)
      y -= subSize * 1.2
    }

    // Draw headline
    if (texts.headline) {
      ctx.font = `bold ${Math.round(headlineSize)}px ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      y -= headlineSize * 0.2
      ctx.fillText(texts.headline, x, y)
    }

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Brand
              </label>
              <div className="grid grid-cols-2 gap-3">
                {brandKits.length === 0 ? (
                  <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Žádné brand kity</p>
                    <p className="text-xs text-gray-400 mt-1">Vytvořte brand kit v sekci Brand Kit</p>
                  </div>
                ) : (
                  brandKits.map(kit => (
                    <button
                      key={kit.id}
                      onClick={() => updateConfig({ brandKitId: kit.id })}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        config.brandKitId === kit.id
                          ? 'border-[#1a73e8] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg"
                          style={{ backgroundColor: kit.primaryColor }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{kit.name}</div>
                          <div className="text-xs text-gray-500">
                            {kit.isDefault && '⭐ Výchozí'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Šablona kampaně
              </label>
              <div className="grid grid-cols-1 gap-3">
                {DEFAULT_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => updateConfig({ templateId: template.id, variables: {} })}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      config.templateId === template.id
                        ? 'border-[#1a73e8] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                      {config.templateId === template.id && (
                        <Check className="w-5 h-5 text-[#1a73e8]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Název kampaně
              </label>
              <input
                type="text"
                value={config.campaignName}
                onChange={e => updateConfig({ campaignName: e.target.value })}
                placeholder="např. Zimni_vyprodej_2025"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Landing URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landing page URL
              </label>
              <input
                type="url"
                value={config.landingUrl}
                onChange={e => updateConfig({ landingUrl: e.target.value })}
                placeholder="https://example.com/akce/"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Brief Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popis kampaně pro AI
                <span className="text-gray-400 font-normal ml-2">
                  (co chcete komunikovat)
                </span>
              </label>
              <textarea
                value={config.briefDescription}
                onChange={e => updateConfig({ briefDescription: e.target.value })}
                placeholder="Zimní bundy se slevou 20%, důraz na teplo a kvalitu materiálů, cílíme na aktivní lidi co chodí do přírody..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Template Variables */}
            {currentTemplate && currentTemplate.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proměnné šablony
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {currentTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-xs text-gray-500 mb-1">
                        %{variable}%
                      </label>
                      <input
                        type="text"
                        value={config.variables[variable] || ''}
                        onChange={e => updateConfig({
                          variables: { ...config.variables, [variable]: e.target.value }
                        })}
                        placeholder={
                          variable === 'X' ? '20' :
                          variable === 'DATE' ? '31.12.' :
                          variable === 'PRODUCT' ? 'bundy' :
                          variable
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages className="w-4 h-4 inline mr-2" />
                Jazyky
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={cn(
                      'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                      config.languages.includes(lang.code)
                        ? 'border-[#1a73e8] bg-blue-50 text-[#1a73e8]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Kanály
              </label>
              
              {/* Google */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Google Ads</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'googleDisplay', label: 'Display Network', desc: '8 formátů' },
                    { key: 'googlePMax', label: 'Performance Max', desc: '6 formátů' },
                    { key: 'googleYouTube', label: 'YouTube', desc: 'Video 16:9' },
                    { key: 'googleDemandGen', label: 'Demand Gen', desc: 'Video + bannery' },
                  ].map(ch => (
                    <button
                      key={ch.key}
                      onClick={() => toggleChannel(ch.key as keyof QuickModeConfig['channels'])}
                      className={cn(
                        'p-3 rounded-lg border-2 text-left transition-all',
                        config.channels[ch.key as keyof QuickModeConfig['channels']]
                          ? 'border-[#4285f4] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="text-sm font-medium">{ch.label}</div>
                      <div className="text-xs text-gray-500">{ch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sklik */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Sklik</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'sklikBannery', label: 'Bannery', desc: '10 formátů' },
                    { key: 'sklikKombinovana', label: 'Kombinovaná', desc: '3 formáty' },
                    { key: 'sklikHTML5', label: 'HTML5', desc: 'Animované' },
                  ].map(ch => (
                    <button
                      key={ch.key}
                      onClick={() => toggleChannel(ch.key as keyof QuickModeConfig['channels'])}
                      className={cn(
                        'p-3 rounded-lg border-2 text-left transition-all',
                        config.channels[ch.key as keyof QuickModeConfig['channels']]
                          ? 'border-[#c41e3a] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="text-sm font-medium">{ch.label}</div>
                      <div className="text-xs text-gray-500">{ch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extra options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.generateRSATexts}
                  onChange={e => updateConfig({ generateRSATexts: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
                <span className="text-sm">Generovat RSA texty</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.generateVideo}
                  onChange={e => updateConfig({ generateVideo: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                />
                <span className="text-sm">Generovat video</span>
              </label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">Shrnutí</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Brand</div>
                  <div className="font-medium">{currentBrandKit?.name || 'Nevybráno'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Šablona</div>
                  <div className="font-medium">{currentTemplate?.name}</div>
                </div>
                <div>
                  <div className="text-gray-500">Kampaň</div>
                  <div className="font-medium">{config.campaignName || 'Nepojmenováno'}</div>
                </div>
                <div>
                  <div className="text-gray-500">URL</div>
                  <div className="font-medium truncate">{config.landingUrl || '-'}</div>
                </div>
              </div>

              <div className="border-t border-gray-200 my-4" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Jazyky</div>
                  <div className="font-medium">
                    {config.languages.map(l => LANGUAGES.find(x => x.code === l)?.flag).join(' ')}
                    {' '}({config.languages.length})
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Kanály</div>
                  <div className="font-medium">{estimatedOutputs.channelNames.length}</div>
                </div>
              </div>
            </div>

            {/* Estimated outputs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Package className="w-6 h-6 mx-auto text-[#1a73e8] mb-2" />
                <div className="text-2xl font-bold text-gray-900">{estimatedOutputs.banners}</div>
                <div className="text-xs text-gray-500">Bannerů</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <FileText className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {config.generateRSATexts ? estimatedOutputs.languages * 19 : 0}
                </div>
                <div className="text-xs text-gray-500">RSA textů</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <Video className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{estimatedOutputs.videos}</div>
                <div className="text-xs text-gray-500">Videí</div>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{progressMessage}</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Result */}
            {generatedBundle && !isGenerating && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-green-800">Bundle vygenerován!</div>
                    <div className="text-sm text-green-600">
                      {generatedBundle.bannerCount} bannerů v {generatedBundle.languages.length} jazycích
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Stáhnout vše (ZIP)
                  </Button>
                  <Button variant="outline">
                    Zobrazit v Galerii
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quick Mode</h1>
          <p className="text-sm text-gray-500">
            Jedno zadání → kompletní balíček kreativ
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as 1 | 2 | 3 | 4)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              step === s
                ? 'bg-[#1a73e8] text-white'
                : step > s
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {step > s ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                {s}
              </span>
            )}
            <span className="text-sm font-medium">
              {s === 1 && 'Brand'}
              {s === 2 && 'Kampaň'}
              {s === 3 && 'Kanály'}
              {s === 4 && 'Generovat'}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1) as any)}
          disabled={step === 1}
        >
          Zpět
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={() => setStep(Math.min(4, step + 1) as any)}
            className="bg-[#1a73e8] hover:bg-blue-700 text-white"
          >
            Pokračovat
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generuji...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Vygenerovat bundle
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
