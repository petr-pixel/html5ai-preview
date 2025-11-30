/**
 * VideoGenerator - Komponenta pro generování videí
 * 
 * Kompletní flow:
 * 1. Vybrat kreativy (bannery) pro slideshow
 * 2. Nastavit pořadí a délku
 * 3. Nahrát hudbu (volitelné)
 * 4. Vygenerovat video
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
import { isR2Configured, uploadCreativesToR2Batch, dataUrlToBlob } from '@/lib/r2-storage'
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
  ChevronUp,
  ChevronDown,
  Cloud
} from 'lucide-react'
import type { Creative } from '@/types'

const TIERS = [
  {
    id: 'slideshow' as VideoTier,
    name: 'Slideshow',
    description: 'Ken Burns efekt z vašich bannerů',
    icon: Film,
    badge: 'Zdarma',
    badgeColor: 'bg-green-100 text-green-700',
    features: ['Bez API klíče', 'Okamžité'],
  },
  {
    id: 'motion' as VideoTier,
    name: 'Motion AI',
    description: 'Oživení obrázku pomocí AI',
    icon: Wand2,
    badge: '~$0.05/s',
    badgeColor: 'bg-purple-100 text-purple-700',
    features: ['Stable Video Diffusion', 'Animate Diff'],
    requiresApi: 'replicate',
  },
  {
    id: 'generative' as VideoTier,
    name: 'Generative AI',
    description: 'Text-to-video pomocí Sora',
    icon: Brain,
    badge: '$0.10-0.40/s',
    badgeColor: 'bg-orange-100 text-orange-700',
    features: ['Sora 2', 'Sora 2 Pro'],
    requiresApi: 'openai',
  },
]

interface SlideItem {
  id: string
  creative: Creative
  duration: number // seconds
}

// Free music tracks z Pixabay (royalty-free, CC0)
// Tyto jsou pouze metadata - skutečné audio by se načítalo z CDN
const FREE_MUSIC_TRACKS = [
  {
    id: 'upbeat-corporate',
    name: 'Upbeat Corporate',
    genre: 'Corporate',
    mood: 'Pozitivní',
    duration: 120,
    url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_3e64f69e22.mp3', // Example URL
    attribution: 'Pixabay Music',
  },
  {
    id: 'inspiring-cinematic',
    name: 'Inspiring Cinematic',
    genre: 'Cinematic',
    mood: 'Inspirativní',
    duration: 150,
    url: 'https://cdn.pixabay.com/audio/2023/10/30/audio_1ffc7c5d6f.mp3',
    attribution: 'Pixabay Music',
  },
  {
    id: 'happy-pop',
    name: 'Happy Pop',
    genre: 'Pop',
    mood: 'Veselý',
    duration: 90,
    url: 'https://cdn.pixabay.com/audio/2023/09/05/audio_8d6e4fda28.mp3',
    attribution: 'Pixabay Music',
  },
  {
    id: 'ambient-chill',
    name: 'Ambient Chill',
    genre: 'Ambient',
    mood: 'Relaxační',
    duration: 180,
    url: 'https://cdn.pixabay.com/audio/2024/01/08/audio_ba2a6e7c49.mp3',
    attribution: 'Pixabay Music',
  },
  {
    id: 'electronic-energy',
    name: 'Electronic Energy',
    genre: 'Electronic',
    mood: 'Dynamický',
    duration: 100,
    url: 'https://cdn.pixabay.com/audio/2023/07/11/audio_6b9a1b8c9d.mp3',
    attribution: 'Pixabay Music',
  },
  {
    id: 'acoustic-morning',
    name: 'Acoustic Morning',
    genre: 'Acoustic',
    mood: 'Klidný',
    duration: 140,
    url: 'https://cdn.pixabay.com/audio/2024/03/20/audio_2b3a4c5d6e.mp3',
    attribution: 'Pixabay Music',
  },
]

type FreeTrack = typeof FREE_MUSIC_TRACKS[number]

export function VideoGenerator() {
  const { creatives, videoScenario, setVideoScenario, apiKeys, addCreatives, r2Config } = useAppStore()
  
  const [selectedTier, setSelectedTier] = useState<VideoTier>('slideshow')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Slideshow specific state
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const audioInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)
  const creativesArray = useMemo(() => Object.values(creatives) as Creative[], [creatives])
  
  // Free music state
  const [selectedFreeTrack, setSelectedFreeTrack] = useState<FreeTrack | null>(null)
  const [previewingTrack, setPreviewingTrack] = useState<FreeTrack | null>(null)

  const estimatedCost = useMemo(() => {
    return calculateVideoCost(selectedTier, videoScenario.lengthSeconds)
  }, [selectedTier, videoScenario.lengthSeconds])

  const totalDuration = useMemo(() => {
    return slides.reduce((sum, s) => sum + s.duration, 0)
  }, [slides])

  // Add creative to slides
  const addSlide = (creative: Creative) => {
    if (slides.find(s => s.creative.id === creative.id)) return
    setSlides([...slides, { 
      id: `slide-${Date.now()}`, 
      creative, 
      duration: 3 // default 3 seconds
    }])
  }

  // Remove slide
  const removeSlide = (id: string) => {
    setSlides(slides.filter(s => s.id !== id))
  }

  // Move slide up/down
  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= slides.length) return
    ;[newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]]
    setSlides(newSlides)
  }

  // Update slide duration
  const updateSlideDuration = (id: string, duration: number) => {
    setSlides(slides.map(s => s.id === id ? { ...s, duration } : s))
  }

  // Handle audio upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('audio/')) {
      alert('Prosím vyberte audio soubor (MP3, WAV, etc.)')
      return
    }
    
    setAudioFile(file)
    setAudioUrl(URL.createObjectURL(file))
    setSelectedFreeTrack(null) // Deselect free track when uploading custom
  }

  // Remove audio
  const removeAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioFile(null)
    setAudioUrl(null)
  }

  // Select free track
  const selectFreeTrack = (track: FreeTrack) => {
    setSelectedFreeTrack(track)
    setAudioUrl(track.url)
    setAudioFile(null) // Clear custom audio
    // Stop preview if playing
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
      setPreviewingTrack(null)
    }
  }

  // Toggle preview
  const togglePreview = (track: FreeTrack) => {
    if (!audioPreviewRef.current) return
    
    if (previewingTrack?.id === track.id) {
      // Stop preview
      audioPreviewRef.current.pause()
      setPreviewingTrack(null)
    } else {
      // Start preview
      audioPreviewRef.current.src = track.url
      audioPreviewRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Autoplay blocked')
      })
      setPreviewingTrack(track)
    }
  }

  // Generate video
  const handleGenerate = async () => {
    if (slides.length < 2) {
      setError('Přidejte alespoň 2 kreativy do slideshow')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      // Prepare creatives in slide order
      const orderedCreatives = slides.map(s => s.creative)
      
      // Update video scenario with total duration
      const scenario = {
        ...videoScenario,
        lengthSeconds: totalDuration,
      }

      const videoResult = await createSlideshowFromCreatives(
        orderedCreatives,
        scenario,
        undefined, // brandKit
        audioUrl || undefined,
        (p: number, msg: string) => {
          setProgress(p)
          setProgressMessage(msg)
        }
      )
      
      setResult(videoResult)
      
      // Uložit video do galerie jako Creative
      const [width, height] = videoScenario.aspectRatio === '16:9' 
        ? [1920, 1080] 
        : videoScenario.aspectRatio === '9:16'
          ? [1080, 1920]
          : [1080, 1080]
      
      let thumbnailUrl = videoResult.thumbnailUrl || slides[0]?.creative.imageUrl || ''
      let finalVideoUrl = videoResult.videoUrl
      
      // Upload do R2 pokud je nakonfigurováno
      if (isR2Configured(r2Config)) {
        setProgressMessage('Ukládám do cloudu...')
        try {
          const uploadResults = await uploadCreativesToR2Batch(
            r2Config,
            [{
              id: 'video-thumb',
              imageUrl: thumbnailUrl,
              videoUrl: finalVideoUrl,
              isVideo: true,
              platform: 'google',
              format: { width, height },
            }]
          )
          
          if (uploadResults[0]?.uploadedToR2) {
            thumbnailUrl = uploadResults[0].imageUrl
            finalVideoUrl = uploadResults[0].videoUrl || finalVideoUrl
          }
        } catch (err) {
          console.warn('R2 upload failed:', err)
        }
      }
      
      const videoCreative = {
        id: `video-${Date.now()}`,
        formatKey: `video-${videoScenario.aspectRatio.replace(':', 'x')}-${totalDuration}s`,
        platform: 'google' as const,
        category: 'video',
        format: {
          width,
          height,
          name: `Video ${videoScenario.aspectRatio} (${totalDuration}s)`,
          isVideo: true,
        },
        imageUrl: thumbnailUrl,
        videoUrl: finalVideoUrl,
        videoDuration: totalDuration,
        isVideo: true,
        createdAt: new Date(),
        sizeKB: Math.round(finalVideoUrl.length * 3 / 4 / 1024),
      }
      
      addCreatives([videoCreative])
      
    } catch (err) {
      console.error('Video generation error:', err)
      setError(err instanceof Error ? err.message : 'Nastala chyba při generování videa')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download video
  const handleDownload = () => {
    if (!result) return
    
    const a = document.createElement('a')
    a.href = result.videoUrl
    a.download = `slideshow-${videoScenario.aspectRatio.replace(':', 'x')}-${totalDuration}s.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Video Generator</h1>
          <p className="text-sm text-gray-500">
            Vytvořte video z vašich kreativ
          </p>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TIERS.map(tier => {
          const Icon = tier.icon
          const isSelected = selectedTier === tier.id
          const isAvailable = tier.id === 'slideshow' || 
            (tier.requiresApi === 'openai' && apiKeys.openai)
          
          return (
            <button
              key={tier.id}
              onClick={() => isAvailable && setSelectedTier(tier.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#1a73e8] bg-blue-50'
                  : isAvailable 
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[#1a73e8]' : 'text-gray-400'}`} />
                <span className={`text-xs px-2 py-0.5 rounded-full ${tier.badgeColor}`}>
                  {tier.badge}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">{tier.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tier.features.map(f => (
                  <span key={f} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                ))}
              </div>
              {tier.requiresApi && !apiKeys.openai && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Vyžaduje API klíč
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Creative Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-gray-400" />
            Dostupné kreativy
          </h2>
          
          {creativesArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Žádné kreativy k dispozici</p>
              <p className="text-xs mt-1">Nejprve vygenerujte bannery v editoru</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {creativesArray.map(creative => {
                const isAdded = slides.some(s => s.creative.id === creative.id)
                return (
                  <button
                    key={creative.id}
                    onClick={() => !isAdded && addSlide(creative)}
                    disabled={isAdded}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      isAdded 
                        ? 'border-green-500 opacity-50' 
                        : 'border-transparent hover:border-[#1a73e8]'
                    }`}
                  >
                    <img 
                      src={creative.imageUrl} 
                      alt={creative.format.name}
                      className="w-full h-full object-cover"
                    />
                    {isAdded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Přidáno</span>
                      </div>
                    )}
                    {!isAdded && (
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Timeline & Settings */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 text-gray-400" />
                Timeline
              </span>
              <span className="text-sm text-gray-500">{totalDuration}s celkem</span>
            </h2>

            {slides.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Přidejte kreativy kliknutím vlevo</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {slides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    
                    {/* Thumbnail */}
                    <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={slide.creative.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {slide.creative.format.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {slide.creative.format.width}×{slide.creative.format.height}
                      </p>
                    </div>
                    
                    {/* Duration */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={slide.duration}
                        onChange={(e) => updateSlideDuration(slide.id, parseInt(e.target.value) || 3)}
                        className="w-12 text-center text-sm border border-gray-200 rounded px-1 py-0.5"
                      />
                      <span className="text-xs text-gray-400">s</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === slides.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => removeSlide(slide.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-gray-400" />
              Hudba (volitelné)
            </h2>

            {/* Free Music Library */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Vyberte z knihovny (royalty-free):</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {FREE_MUSIC_TRACKS.map(track => (
                  <button
                    key={track.id}
                    onClick={() => selectFreeTrack(track)}
                    className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                      selectedFreeTrack?.id === track.id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePreview(track)
                      }}
                      className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      {previewingTrack?.id === track.id ? (
                        <span className="w-2 h-2 bg-purple-500 rounded-sm" />
                      ) : (
                        <Play className="w-3 h-3 text-purple-500 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{track.name}</p>
                      <p className="text-xs text-gray-400">{track.genre} • {track.duration}s • {track.mood}</p>
                    </div>
                    {selectedFreeTrack?.id === track.id && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Vybráno</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Zdroj: Pixabay Music (CC0 licence, bez nutnosti atribuce)
              </p>
            </div>

            <div className="text-xs text-gray-400 text-center my-2">— nebo —</div>

            {audioFile ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Music className="w-5 h-5 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{audioFile.name}</p>
                  <p className="text-xs text-gray-400">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={removeAudio} className="p-1 hover:bg-red-100 rounded text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => audioInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-[#1a73e8] hover:text-[#1a73e8] transition-colors"
              >
                <Upload className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Nahrát vlastní MP3/WAV</span>
              </button>
            )}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            
            {/* Hidden audio element for preview */}
            <audio ref={audioPreviewRef} className="hidden" onEnded={() => setPreviewingTrack(null)} />
          </div>

          {/* Aspect Ratio */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-medium text-gray-900 mb-3">Poměr stran</h2>
            <div className="flex gap-2">
              {['16:9', '1:1', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setVideoScenario({ aspectRatio: ratio as any })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    videoScenario.aspectRatio === ratio
                      ? 'bg-[#1a73e8] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <DollarSign className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className="text-lg font-semibold text-gray-900">
              {estimatedCost === 0 ? 'Zdarma' : `~$${estimatedCost.toFixed(2)}`}
            </p>
            <p className="text-xs text-gray-500">Cena</p>
          </div>
          <div>
            <Clock className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className="text-lg font-semibold text-gray-900">{totalDuration}s</p>
            <p className="text-xs text-gray-500">Délka</p>
          </div>
          <div>
            <Film className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <p className="text-lg font-semibold text-gray-900">{slides.length}</p>
            <p className="text-xs text-gray-500">Snímků</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isGenerating && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{progressMessage || 'Generuji video...'}</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Výsledné video</h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              src={result.videoUrl}
              controls
              className="w-full h-full"
            />
          </div>
          <Button onClick={handleDownload} className="w-full bg-[#1a73e8] hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Stáhnout video ({result.duration}s)
          </Button>
        </div>
      )}

      {/* Generate Button */}
      <div className="mt-6">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || slides.length < 2}
          className="w-full py-4 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generuji video...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Vygenerovat video
            </>
          )}
        </Button>
        
        {selectedTier === 'slideshow' && (
          <p className="text-xs text-center text-gray-400 mt-2">
            💡 Motion AI oživí statický obrázek pomocí AI. Ideální pro jemné animace produktů.
          </p>
        )}
      </div>
    </div>
  )
}
