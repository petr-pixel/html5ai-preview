/**
 * VideoGenerator - Komponenta pro generování videí
 * 
 * Podporuje 3 tiery:
 * - Tier 1: Slideshow (zdarma, klientské)
 * - Tier 2: Motion AI (Replicate)
 * - Tier 3: Generative AI (Sora/Runway)
 */

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { 
  createSlideshowFromCreatives, 
  calculateVideoCost,
  createVideoThumbnail,
  type VideoTier,
  type VideoResult 
} from '@/lib/video-engine'
import { 
  Video, 
  Sparkles, 
  Download, 
  Loader2,
  Film,
  Wand2,
  Brain,
  DollarSign,
  Clock,
  AlertTriangle
} from 'lucide-react'

const TIERS = [
  {
    id: 'slideshow' as VideoTier,
    name: 'Slideshow',
    description: 'Ken Burns efekt z vašich bannerů',
    icon: Film,
    badge: 'Zdarma',
    badgeColor: 'bg-green-100 text-green-700',
    features: ['Bez API klíče', 'Okamžité', 'Ken Burns', 'Fade transitions'],
  },
  {
    id: 'motion' as VideoTier,
    name: 'Motion AI',
    description: 'Oživení obrázku pomocí AI',
    icon: Wand2,
    badge: '~$0.05/s',
    badgeColor: 'bg-blue-100 text-blue-700',
    features: ['Stable Video Diffusion', 'Animate Diff', 'Subtilní pohyb'],
    requiresApi: 'replicate',
  },
  {
    id: 'generative' as VideoTier,
    name: 'Generative AI',
    description: 'Text-to-video pomocí Sora',
    icon: Brain,
    badge: '$0.10-0.40/s',
    badgeColor: 'bg-purple-100 text-purple-700',
    features: ['Sora 2', 'Sora 2 Pro', 'Plná kreativní kontrola'],
    requiresApi: 'openai',
  },
]

export function VideoGenerator() {
  const { 
    creatives, 
    videoScenario, 
    apiKeys, 
    brandKits, 
    activeBrandKit 
  } = useAppStore()
  
  const [selectedTier, setSelectedTier] = useState<VideoTier>('slideshow')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const creativesArray = useMemo(() => Object.values(creatives), [creatives])
  const activeBrandKitData = brandKits.find(k => k.id === activeBrandKit)

  const estimatedCost = useMemo(() => {
    return calculateVideoCost(selectedTier, videoScenario.lengthSeconds)
  }, [selectedTier, videoScenario.lengthSeconds])

  const canGenerate = useMemo(() => {
    if (selectedTier === 'slideshow') {
      return creativesArray.length >= 2
    }
    if (selectedTier === 'motion') {
      return creativesArray.length >= 1 // Potřebuje alespoň 1 obrázek + API klíč
    }
    if (selectedTier === 'generative') {
      return apiKeys.openai && videoScenario.hook // Potřebuje API klíč + scénář
    }
    return false
  }, [selectedTier, creativesArray.length, apiKeys.openai, videoScenario.hook])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      if (selectedTier === 'slideshow') {
        const videoResult = await createSlideshowFromCreatives(
          creativesArray,
          videoScenario,
          activeBrandKitData,
          undefined, // audioUrl - zatím nepodporujeme
          (p: number, msg: string) => {
            setProgress(p)
            setProgressMessage(msg)
          }
        )
        
        // Vytvoř thumbnail
        const thumbnail = await createVideoThumbnail(videoResult.videoUrl)
        videoResult.thumbnailUrl = thumbnail
        
        setResult(videoResult)
      } else if (selectedTier === 'motion') {
        throw new Error('Motion AI vyžaduje Replicate API klíč. Přejděte do Settings a nastavte ho.')
      } else if (selectedTier === 'generative') {
        // Pro generative AI přesměruj na VideoScenarioEditor
        throw new Error('Pro generativní video použijte sekci "Video reklama" s kompletním scénářem.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba při generování videa')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    const a = document.createElement('a')
    a.href = result.videoUrl
    a.download = `video-${videoScenario.aspectRatio}-${result.duration}s.webm`
    a.click()
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Video Generator</h2>
          <p className="text-sm text-muted-foreground">
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
            (tier.requiresApi === 'replicate') ||
            (tier.requiresApi === 'openai' && apiKeys.openai)
          
          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              disabled={!isAvailable && tier.id !== 'slideshow'}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-border hover:border-purple-300'
              } ${!isAvailable && tier.id !== 'slideshow' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-muted-foreground'}`} />
                <Badge className={tier.badgeColor}>{tier.badge}</Badge>
              </div>
              <h3 className="font-medium">{tier.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tier.features.slice(0, 2).map(f => (
                  <span key={f} className="text-xs bg-muted px-1.5 py-0.5 rounded">{f}</span>
                ))}
              </div>
              {tier.requiresApi && !apiKeys.openai && tier.requiresApi === 'openai' && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Vyžaduje API klíč
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Info panel */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <DollarSign className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">
              {estimatedCost === 0 ? 'Zdarma' : `~$${estimatedCost.toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground">Cena</p>
          </div>
          <div>
            <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{videoScenario.lengthSeconds}s</p>
            <p className="text-xs text-muted-foreground">Délka</p>
          </div>
          <div>
            <Film className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{creativesArray.length}</p>
            <p className="text-xs text-muted-foreground">Kreativ</p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      {selectedTier === 'slideshow' && creativesArray.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            Pro slideshow potřebujete alespoň 2 kreativy. Aktuálně máte {creativesArray.length}.
          </p>
        </div>
      )}

      {/* Progress */}
      {isGenerating && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{progressMessage}</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-6">
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              src={result.videoUrl}
              poster={result.thumbnailUrl}
              controls
              className="w-full h-full"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {result.duration}s • {result.tier} • {result.cost === 0 ? 'Zdarma' : `$${result.cost?.toFixed(2)}`}
            </div>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Stáhnout
            </Button>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !canGenerate}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generuji...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Vygenerovat video
          </>
        )}
      </Button>

      {/* Tier-specific notes */}
      <div className="mt-4 text-xs text-muted-foreground">
        {selectedTier === 'slideshow' && (
          <p>💡 Slideshow vytvoří video s Ken Burns efektem a plynulými přechody mezi vašimi kreativami.</p>
        )}
        {selectedTier === 'motion' && (
          <p>💡 Motion AI oživí statický obrázek pomocí AI. Ideální pro jemné animace produktů.</p>
        )}
        {selectedTier === 'generative' && (
          <p>💡 Pro plnohodnotné generativní video použijte sekci "Video reklama" s kompletním scénářem.</p>
        )}
      </div>
    </Card>
  )
}
