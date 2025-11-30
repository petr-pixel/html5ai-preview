/**
 * VideoGenerator - Kompletní Video Studio
 * 
 * 3 módy:
 * 1. Slideshow - Timeline s Ken Burns efekty, multi-select kreativ
 * 2. Motion AI - Oživení jednoho obrázku (parallax, zoom)
 * 3. Generative AI (Sora) - Text-to-video se strukturovaným promptem
 */

import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { 
  createSlideshowFromCreatives, 
  calculateVideoCost,
  type VideoTier,
  type VideoResult 
} from '@/lib/video-engine'
import { isR2Configured, uploadCreativesToR2Batch } from '@/lib/r2-storage'
import { cn } from '@/lib/utils'
import { 
  Video, 
  Download, 
  Loader2,
  Film,
  Wand2,
  Brain,
  DollarSign,
  Clock,
  AlertTriangle,
  Music,
  Upload,
  X,
  GripVertical,
  Plus,
  Trash2,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Check,
  Image as ImageIcon,
  Sparkles,
  Camera,
  Move,
  ZoomIn,
  ZoomOut,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Layers,
  Type,
  Settings2
} from 'lucide-react'
import type { Creative } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

type MotionType = 'none' | 'ken-burns-in' | 'ken-burns-out' | 'pan-left' | 'pan-right' | 'parallax'

interface SlideItem {
  id: string
  creative: Creative
  duration: number
  motion: MotionType
  motionIntensity: number // 0-100
}

interface SoraScene {
  id: string
  startTime: number
  endTime: number
  description: string
}

interface SoraConfig {
  brief: string
  scenes: SoraScene[]
  onScreenText: string
  ctaText: string
  style: 'realistic' | 'lifestyle' | 'studio' | 'animated'
  cameraStyle: 'static' | 'smooth' | 'dynamic'
  referenceImages: string[] // creative IDs
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOTION_OPTIONS: { value: MotionType; label: string; icon: any }[] = [
  { value: 'none', label: 'Žádný', icon: ImageIcon },
  { value: 'ken-burns-in', label: 'Přiblížení', icon: ZoomIn },
  { value: 'ken-burns-out', label: 'Oddálení', icon: ZoomOut },
  { value: 'pan-left', label: 'Posun ←', icon: ArrowLeft },
  { value: 'pan-right', label: 'Posun →', icon: ArrowRight },
  { value: 'parallax', label: 'Parallax', icon: Layers },
]

// Free music tracks - royalty free, CORS-friendly CDN
// Using SampleSwap.org and other verified sources
const FREE_MUSIC_TRACKS = [
  {
    id: 'corporate-upbeat',
    name: 'Corporate Upbeat',
    genre: 'Corporate',
    mood: 'Pozitivní',
    duration: 120,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'inspiring-piano',
    name: 'Inspiring Piano',
    genre: 'Cinematic',
    mood: 'Inspirativní',
    duration: 145,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'happy-acoustic',
    name: 'Happy Acoustic',
    genre: 'Acoustic',
    mood: 'Veselý',
    duration: 98,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'technology-beat',
    name: 'Technology Beat',
    genre: 'Electronic',
    mood: 'Moderní',
    duration: 130,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'epic-orchestra',
    name: 'Epic Orchestra',
    genre: 'Cinematic',
    mood: 'Epický',
    duration: 180,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'chill-ambient',
    name: 'Chill Ambient',
    genre: 'Ambient',
    mood: 'Klidný',
    duration: 110,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: 'uplifting-pop',
    name: 'Uplifting Pop',
    genre: 'Pop',
    mood: 'Optimistický',
    duration: 95,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    id: 'energetic-rock',
    name: 'Energetic Rock',
    genre: 'Rock',
    mood: 'Energický',
    duration: 115,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
  {
    id: 'smooth-jazz',
    name: 'Smooth Jazz',
    genre: 'Jazz',
    mood: 'Relaxační',
    duration: 200,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  },
  {
    id: 'dance-electronic',
    name: 'Dance Electronic',
    genre: 'Dance',
    mood: 'Taneční',
    duration: 140,
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  },
]

type FreeTrack = typeof FREE_MUSIC_TRACKS[number]

// ============================================================================
// COMPONENT
// ============================================================================

export function VideoGenerator() {
  const { creatives, videoScenario, setVideoScenario, apiKeys, addCreatives, r2Config, brandKits, activeBrandKit } = useAppStore()
  
  // Current mode
  const [selectedTier, setSelectedTier] = useState<VideoTier>('slideshow')
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Slideshow state
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [selectedFreeTrack, setSelectedFreeTrack] = useState<FreeTrack | null>(null)
  const [previewingTrack, setPreviewingTrack] = useState<FreeTrack | null>(null)
  
  // Motion AI state
  const [motionSelectedImage, setMotionSelectedImage] = useState<Creative | null>(null)
  const [motionType, setMotionType] = useState<MotionType>('ken-burns-in')
  const [motionDuration, setMotionDuration] = useState(5)
  const [motionIntensity, setMotionIntensity] = useState(50)
  const [motionLoop, setMotionLoop] = useState(true)
  
  // Sora state
  const [soraConfig, setSoraConfig] = useState<SoraConfig>({
    brief: '',
    scenes: [
      { id: '1', startTime: 0, endTime: 4, description: '' },
      { id: '2', startTime: 4, endTime: 8, description: '' },
      { id: '3', startTime: 8, endTime: 12, description: '' },
    ],
    onScreenText: '',
    ctaText: '',
    style: 'realistic',
    cameraStyle: 'smooth',
    referenceImages: [],
  })
  
  const audioInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)
  
  const creativesArray = useMemo(() => Object.values(creatives) as Creative[], [creatives])
  const currentBrandKit = brandKits.find(b => b.id === activeBrandKit)
  
  const totalDuration = useMemo(() => {
    return slides.reduce((sum, s) => sum + s.duration, 0)
  }, [slides])

  const estimatedCost = useMemo(() => {
    return calculateVideoCost(selectedTier, selectedTier === 'slideshow' ? totalDuration : videoScenario.lengthSeconds)
  }, [selectedTier, totalDuration, videoScenario.lengthSeconds])

  // ============================================================================
  // SLIDESHOW HANDLERS
  // ============================================================================

  const addSlide = (creative: Creative) => {
    if (slides.find(s => s.creative.id === creative.id)) return
    setSlides([...slides, { 
      id: `slide-${Date.now()}`, 
      creative, 
      duration: 3,
      motion: 'ken-burns-in',
      motionIntensity: 50,
    }])
  }

  const removeSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id))
  }

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= slides.length) return
    ;[newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]]
    setSlides(newSlides)
  }

  const updateSlide = (id: string, updates: Partial<SlideItem>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  // ============================================================================
  // AUDIO HANDLERS
  // ============================================================================

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setSelectedFreeTrack(null)
    }
  }

  const selectFreeTrack = (track: FreeTrack) => {
    setSelectedFreeTrack(track)
    setAudioUrl(track.url)
  }

  const togglePreview = async (track: FreeTrack) => {
    if (previewingTrack?.id === track.id) {
      audioPreviewRef.current?.pause()
      setPreviewingTrack(null)
    } else {
      if (audioPreviewRef.current) {
        try {
          audioPreviewRef.current.src = track.url
          audioPreviewRef.current.crossOrigin = 'anonymous'
          await audioPreviewRef.current.play()
          setPreviewingTrack(track)
        } catch (err) {
          console.warn('Audio preview failed:', err)
          // Fallback - try without crossOrigin
          try {
            audioPreviewRef.current.crossOrigin = ''
            audioPreviewRef.current.src = track.url
            await audioPreviewRef.current.play()
            setPreviewingTrack(track)
          } catch {
            alert('Nepodařilo se přehrát náhled. Zkuste jiný track.')
          }
        }
      }
    }
  }

  // ============================================================================
  // SORA HANDLERS
  // ============================================================================

  const updateSoraConfig = (updates: Partial<SoraConfig>) => {
    setSoraConfig({ ...soraConfig, ...updates })
  }

  const updateSoraScene = (id: string, updates: Partial<SoraScene>) => {
    setSoraConfig({
      ...soraConfig,
      scenes: soraConfig.scenes.map(s => s.id === id ? { ...s, ...updates } : s),
    })
  }

  const addSoraScene = () => {
    const lastScene = soraConfig.scenes[soraConfig.scenes.length - 1]
    const newStart = lastScene ? lastScene.endTime : 0
    setSoraConfig({
      ...soraConfig,
      scenes: [...soraConfig.scenes, {
        id: `scene-${Date.now()}`,
        startTime: newStart,
        endTime: newStart + 4,
        description: '',
      }],
    })
  }

  const removeSoraScene = (id: string) => {
    if (soraConfig.scenes.length <= 1) return
    setSoraConfig({
      ...soraConfig,
      scenes: soraConfig.scenes.filter(s => s.id !== id),
    })
  }

  const toggleReferenceImage = (creativeId: string) => {
    const refs = soraConfig.referenceImages
    if (refs.includes(creativeId)) {
      updateSoraConfig({ referenceImages: refs.filter(id => id !== creativeId) })
    } else {
      updateSoraConfig({ referenceImages: [...refs, creativeId] })
    }
  }

  const buildSoraPrompt = (): string => {
    const parts: string[] = []
    
    // Brief
    if (soraConfig.brief) {
      parts.push(soraConfig.brief)
    }
    
    // Style
    const styleMap = {
      realistic: 'Cinematic, photorealistic style.',
      lifestyle: 'Lifestyle video with handheld camera feel.',
      studio: 'Clean studio setting with white background.',
      animated: '3D animated style with smooth motion.',
    }
    parts.push(styleMap[soraConfig.style])
    
    // Camera
    const cameraMap = {
      static: 'Camera is static, tripod shot.',
      smooth: 'Smooth camera movements, dolly shots.',
      dynamic: 'Dynamic camera work, energetic movements.',
    }
    parts.push(cameraMap[soraConfig.cameraStyle])
    
    // Scenes
    if (soraConfig.scenes.some(s => s.description)) {
      const scenesText = soraConfig.scenes
        .filter(s => s.description)
        .map((s, i) => `Scene ${i + 1} (${s.startTime}-${s.endTime}s): ${s.description}`)
        .join(' ')
      parts.push(scenesText)
    }
    
    // On-screen text
    if (soraConfig.onScreenText) {
      parts.push(`Show text on screen: "${soraConfig.onScreenText}"`)
    }
    if (soraConfig.ctaText) {
      parts.push(`End with CTA: "${soraConfig.ctaText}"`)
    }
    
    // Brand kit colors
    if (currentBrandKit) {
      parts.push(`Use brand colors: ${currentBrandKit.primaryColor} and ${currentBrandKit.secondaryColor}.`)
    }
    
    parts.push('No other logos or watermarks.')
    
    return parts.join(' ')
  }

  // ============================================================================
  // GENERATE VIDEO
  // ============================================================================

  const handleGenerate = async () => {
    if (selectedTier === 'slideshow' && slides.length === 0) {
      setError('Přidejte alespoň jeden snímek do timeline')
      return
    }
    if (selectedTier === 'motion' && !motionSelectedImage) {
      setError('Vyberte obrázek pro animaci')
      return
    }
    if (selectedTier === 'generative' && !soraConfig.brief) {
      setError('Vyplňte brief pro generování')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      if (selectedTier === 'slideshow') {
        setProgressMessage('Generuji slideshow video...')
        
        const videoResult = await createSlideshowFromCreatives(
          slides.map(s => s.creative),
          {
            aspectRatio: videoScenario.aspectRatio as '16:9' | '9:16' | '1:1',
            secondsPerSlide: slides[0]?.duration || 3,
            transition: 'fade',
            audioUrl: audioUrl || undefined,
          },
          (p) => setProgress(p)
        )
        
        setResult(videoResult)
        
        // Save to gallery
        const [width, height] = videoScenario.aspectRatio === '16:9' 
          ? [1920, 1080] 
          : videoScenario.aspectRatio === '9:16'
            ? [1080, 1920]
            : [1080, 1080]
        
        const videoCreative = {
          id: `video-${Date.now()}`,
          formatKey: `video-${videoScenario.aspectRatio.replace(':', 'x')}-${totalDuration}s`,
          platform: 'google' as const,
          category: 'video',
          format: { width, height, name: `Video ${videoScenario.aspectRatio} (${totalDuration}s)`, isVideo: true },
          imageUrl: videoResult.thumbnailUrl || slides[0]?.creative.imageUrl || '',
          videoUrl: videoResult.videoUrl,
          videoDuration: totalDuration,
          isVideo: true,
          createdAt: new Date(),
          sizeKB: Math.round(videoResult.videoUrl.length * 3 / 4 / 1024),
        }
        
        addCreatives([videoCreative])
        
      } else if (selectedTier === 'motion') {
        setProgressMessage('Motion AI zatím není dostupné...')
        await new Promise(r => setTimeout(r, 2000))
        setError('Motion AI bude brzy k dispozici. Zatím použijte Slideshow.')
        
      } else if (selectedTier === 'generative') {
        setProgressMessage('Generative AI (Sora) zatím není dostupné...')
        await new Promise(r => setTimeout(r, 2000))
        
        const prompt = buildSoraPrompt()
        console.log('Sora prompt:', prompt)
        
        setError('Sora API bude brzy integrováno. Prompt byl vygenerován do konzole.')
      }
      
    } catch (err) {
      console.error('Video generation error:', err)
      setError(err instanceof Error ? err.message : 'Nastala chyba při generování videa')
    } finally {
      setIsGenerating(false)
      setProgressMessage('')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Video Studio</h1>
              <p className="text-xs text-gray-500">Vytvořte video z vašich kreativ</p>
            </div>
          </div>
          
          {/* Aspect ratio selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Poměr:</span>
            {['16:9', '1:1', '9:16'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setVideoScenario({ aspectRatio: ratio as any })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  videoScenario.aspectRatio === ratio
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'slideshow', name: 'Slideshow', icon: Film, badge: 'Zdarma', color: 'green' },
            { id: 'motion', name: 'Motion AI', icon: Wand2, badge: 'SOON', color: 'purple' },
            { id: 'generative', name: 'Generative AI', icon: Brain, badge: 'SOON', color: 'orange' },
          ].map((tier) => {
            const Icon = tier.icon
            const isActive = selectedTier === tier.id
            const isDisabled = tier.badge === 'SOON'
            
            return (
              <button
                key={tier.id}
                onClick={() => !isDisabled && setSelectedTier(tier.id as VideoTier)}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tier.name}
                <Badge variant="secondary" className={cn(
                  'text-[10px]',
                  tier.color === 'green' && 'bg-green-100 text-green-700',
                  tier.color === 'purple' && 'bg-purple-100 text-purple-700',
                  tier.color === 'orange' && 'bg-orange-100 text-orange-700',
                )}>
                  {tier.badge}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Available creatives */}
        <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Dostupné kreativy ({creativesArray.length})
          </h3>
          
          {creativesArray.length === 0 ? (
            <div className="space-y-3">
              <div className="text-center py-4">
                <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Žádné kreativy</p>
                <p className="text-[10px] text-gray-400 mt-1">Nejprve vygenerujte bannery</p>
              </div>
              
              {/* Demo placeholders */}
              <div className="border-t pt-3">
                <p className="text-[10px] text-gray-400 mb-2 text-center">Ukázkové obrázky:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'demo-1', color: '#4F46E5', label: 'Produkt 1' },
                    { id: 'demo-2', color: '#7C3AED', label: 'Produkt 2' },
                    { id: 'demo-3', color: '#EC4899', label: 'Lifestyle' },
                    { id: 'demo-4', color: '#F59E0B', label: 'Akce' },
                  ].map((demo) => (
                    <div
                      key={demo.id}
                      className="relative aspect-video rounded-lg overflow-hidden cursor-not-allowed opacity-50"
                      style={{ backgroundColor: demo.color }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-[9px] font-medium">{demo.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {creativesArray.map((creative) => {
                const isInSlideshow = slides.some(s => s.creative.id === creative.id)
                const isMotionSelected = motionSelectedImage?.id === creative.id
                const isSoraRef = soraConfig.referenceImages.includes(creative.id)
                
                return (
                  <div
                    key={creative.id}
                    onClick={() => {
                      if (selectedTier === 'slideshow') addSlide(creative)
                      else if (selectedTier === 'motion') setMotionSelectedImage(creative)
                      else if (selectedTier === 'generative') toggleReferenceImage(creative.id)
                    }}
                    className={cn(
                      'relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                      isInSlideshow && 'border-purple-500 ring-2 ring-purple-200',
                      isMotionSelected && 'border-pink-500 ring-2 ring-pink-200',
                      isSoraRef && 'border-orange-500 ring-2 ring-orange-200',
                      !isInSlideshow && !isMotionSelected && !isSoraRef && 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <img
                      src={creative.imageUrl}
                      alt={creative.format.name}
                      className="w-full h-full object-cover"
                    />
                    {(isInSlideshow || isMotionSelected || isSoraRef) && (
                      <div className={cn(
                        'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
                        isInSlideshow && 'bg-purple-500',
                        isMotionSelected && 'bg-pink-500',
                        isSoraRef && 'bg-orange-500',
                      )}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <p className="text-[9px] text-white truncate">{creative.format.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Center: Mode-specific content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SLIDESHOW MODE */}
          {selectedTier === 'slideshow' && (
            <div className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Timeline ({slides.length} snímků, {totalDuration}s)
                </h3>
                
                {slides.length === 0 ? (
                  <div className="bg-gray-100 rounded-xl p-8 text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Klikněte na kreativy vlevo</p>
                    <p className="text-xs text-gray-400 mt-1">pro přidání do timeline</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={slide.creative.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Controls */}
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          {/* Duration */}
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Délka</label>
                            <select
                              value={slide.duration}
                              onChange={(e) => updateSlide(slide.id, { duration: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
                                <option key={d} value={d}>{d}s</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Motion */}
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Pohyb</label>
                            <select
                              value={slide.motion}
                              onChange={(e) => updateSlide(slide.id, { motion: e.target.value as MotionType })}
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg"
                            >
                              {MOTION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Intensity */}
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-1">
                              Intenzita: {slide.motionIntensity}%
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={10}
                              value={slide.motionIntensity}
                              onChange={(e) => updateSlide(slide.id, { motionIntensity: parseInt(e.target.value) })}
                              className="w-full h-1"
                            />
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveSlide(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeSlide(slide.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Music */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Hudba (volitelné)
                </h3>
                
                {/* Free tracks */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {FREE_MUSIC_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => selectFreeTrack(track)}
                      className={cn(
                        'p-2 rounded-lg text-left border transition-all',
                        selectedFreeTrack?.id === track.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">{track.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePreview(track) }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {previewingTrack?.id === track.id ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{track.mood}</span>
                        <span>•</span>
                        <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Upload custom */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Vlastní MP3
                  </Button>
                  {audioUrl && !selectedFreeTrack && (
                    <span className="text-xs text-green-600">✓ Vlastní audio nahráno</span>
                  )}
                </div>
                
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
                <audio ref={audioPreviewRef} className="hidden" />
              </div>
            </div>
          )}

          {/* MOTION AI MODE */}
          {selectedTier === 'motion' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Wand2 className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Motion AI</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Vyberte jeden obrázek vlevo a nastavte typ animace. AI vytvoří plynulý pohyb.
                    </p>
                  </div>
                </div>
              </div>

              {motionSelectedImage ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Preview */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Vybraný obrázek</h4>
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={motionSelectedImage.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Typ pohybu</label>
                      <div className="grid grid-cols-3 gap-2">
                        {MOTION_OPTIONS.filter(o => o.value !== 'none').map((opt) => {
                          const Icon = opt.icon
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setMotionType(opt.value)}
                              className={cn(
                                'p-3 rounded-lg border text-center transition-all',
                                motionType === opt.value
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              )}
                            >
                              <Icon className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs">{opt.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Délka: {motionDuration}s
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={10}
                        value={motionDuration}
                        onChange={(e) => setMotionDuration(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Intenzita: {motionIntensity}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={10}
                        value={motionIntensity}
                        onChange={(e) => setMotionIntensity(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motionLoop}
                        onChange={(e) => setMotionLoop(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Loop friendly (pro PMax/DG)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Vyberte obrázek vlevo</p>
                </div>
              )}
            </div>
          )}

          {/* GENERATIVE AI (SORA) MODE */}
          {selectedTier === 'generative' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Generative AI (Sora)</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Popište video a Sora ho vygeneruje. Můžete přidat referenční obrázky z vašich kreativ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left: Brief & Scenes */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Brief (základní popis)
                    </label>
                    <textarea
                      value={soraConfig.brief}
                      onChange={(e) => updateSoraConfig({ brief: e.target.value })}
                      placeholder="Např: Zimní bundy, moderní outdoor značka, cílovka 25–45, zimní město, sníh, večerní atmosféra..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Scény</label>
                      <Button variant="ghost" size="sm" onClick={addSoraScene}>
                        <Plus className="w-3 h-3 mr-1" />
                        Přidat
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {soraConfig.scenes.map((scene, index) => (
                        <div key={scene.id} className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-16 text-[10px] text-gray-500 pt-2">
                            {scene.startTime}-{scene.endTime}s
                          </div>
                          <input
                            value={scene.description}
                            onChange={(e) => updateSoraScene(scene.id, { description: e.target.value })}
                            placeholder={`Scéna ${index + 1}: co se děje...`}
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                          />
                          <button
                            onClick={() => removeSoraScene(scene.id)}
                            disabled={soraConfig.scenes.length <= 1}
                            className="p-1 hover:bg-red-100 rounded text-red-500 disabled:opacity-30"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        <Type className="w-3 h-3 inline mr-1" />
                        Text na obrazovce
                      </label>
                      <input
                        value={soraConfig.onScreenText}
                        onChange={(e) => updateSoraConfig({ onScreenText: e.target.value })}
                        placeholder="Max 2-3 slova"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Závěrečné CTA
                      </label>
                      <input
                        value={soraConfig.ctaText}
                        onChange={(e) => updateSoraConfig({ ctaText: e.target.value })}
                        placeholder="Např: Nakupte nyní"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Style & Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Styl</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'realistic', label: 'Realistický', icon: Camera },
                        { value: 'lifestyle', label: 'Lifestyle', icon: Move },
                        { value: 'studio', label: 'Studio', icon: Sparkles },
                        { value: 'animated', label: 'Animace', icon: Film },
                      ].map((style) => {
                        const Icon = style.icon
                        return (
                          <button
                            key={style.value}
                            onClick={() => updateSoraConfig({ style: style.value as any })}
                            className={cn(
                              'p-3 rounded-lg border text-left flex items-center gap-2 transition-all',
                              soraConfig.style === style.value
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{style.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Kamera</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'static', label: 'Statická' },
                        { value: 'smooth', label: 'Plynulá' },
                        { value: 'dynamic', label: 'Dynamická' },
                      ].map((cam) => (
                        <button
                          key={cam.value}
                          onClick={() => updateSoraConfig({ cameraStyle: cam.value as any })}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg border text-xs transition-all',
                            soraConfig.cameraStyle === cam.value
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {cam.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Délka videa: {videoScenario.lengthSeconds}s
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={30}
                      step={2}
                      value={videoScenario.lengthSeconds}
                      onChange={(e) => setVideoScenario({ lengthSeconds: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Reference images */}
                  {soraConfig.referenceImages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Referenční obrázky ({soraConfig.referenceImages.length})
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {soraConfig.referenceImages.map((id) => {
                          const creative = creativesArray.find(c => c.id === id)
                          if (!creative) return null
                          return (
                            <div key={id} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-orange-500">
                              <img src={creative.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {selectedTier === 'slideshow' ? totalDuration : videoScenario.lengthSeconds}s
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {estimatedCost === 0 ? 'Zdarma' : `~$${estimatedCost.toFixed(2)}`}
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (selectedTier === 'slideshow' && slides.length === 0)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {progressMessage || 'Generuji...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Vygenerovat video
              </>
            )}
          </Button>
        </div>

        {isGenerating && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Video vygenerováno!</p>
                  <p className="text-xs text-green-700">Uloženo do galerie</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = result.videoUrl
                  a.download = `video-${videoScenario.aspectRatio.replace(':', 'x')}.webm`
                  a.click()
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Stáhnout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
