'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Input, Textarea, Badge } from '@/components/ui'
import { 
  Film, 
  Play, 
  Wand2, 
  Loader2, 
  Download,
  Clock,
  Maximize,
  DollarSign
} from 'lucide-react'

export function VideoPanel() {
  const {
    apiKey,
    sourceImage,
    videoSettings,
    setVideoSettings,
    defaultText,
  } = useAppStore()

  const [generating, setGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const generateAIPrompt = async () => {
    if (!apiKey) {
      alert('Zadej API klíč v Nastavení')
      return
    }

    setGenerating(true)
    try {
      const context = `Produkt/služba: ${defaultText.headline || 'reklamní kreativa'}. CTA: ${defaultText.cta || 'Zjistit více'}`
      
      const res = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: context, 
          apiKey, 
          type: 'video' 
        }),
      })
      const data = await res.json()
      
      if (data.success && data.text) {
        setVideoSettings({ prompt: data.text })
      }
    } catch (err) {
      console.error('Error generating prompt:', err)
    }
    setGenerating(false)
  }

  const generateSlideshow = async () => {
    if (!sourceImage) {
      alert('Nejdřív nahraj nebo vygeneruj zdrojový obrázek')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Dynamický import slideshowu
      const { generateSlideshow: createSlideshow } = await import('@/lib/slideshow')
      
      const blob = await createSlideshow({
        images: [sourceImage],
        duration: videoSettings.duration,
        aspectRatio: videoSettings.aspectRatio,
        kenBurns: videoSettings.kenBurns,
        text: {
          headline: defaultText.headline,
          cta: defaultText.cta,
        },
      })

      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
    } catch (err: any) {
      setError(err.message || 'Chyba při generování slideshow')
    }
    setGenerating(false)
  }

  const generateSora = async () => {
    if (!apiKey) {
      alert('Zadej API klíč v Nastavení')
      return
    }

    if (!videoSettings.prompt) {
      alert('Zadej prompt pro video')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoSettings.prompt,
          apiKey,
          duration: videoSettings.duration,
          aspectRatio: videoSettings.aspectRatio,
        }),
      })

      const data = await res.json()

      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl)
      } else if (data.notAvailable) {
        setError('Sora API není momentálně dostupná. Použijte Slideshow.')
      } else {
        setError(data.error || 'Chyba při generování')
      }
    } catch (err: any) {
      setError(err.message || 'Chyba připojení')
    }
    setGenerating(false)
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `video-${videoSettings.aspectRatio.replace(':', 'x')}-${videoSettings.duration}s.mp4`
    a.click()
  }

  const estimatedCost = videoSettings.tier === 'sora' 
    ? (videoSettings.duration * 0.1).toFixed(2) 
    : '0.00'

  return (
    <Card>
      <h3 className="font-medium mb-4 flex items-center gap-2">
        <Film className="w-5 h-5 text-gray-400" />
        Video reklama
      </h3>

      <div className="space-y-4">
        {/* Tier Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Typ generování</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVideoSettings({ tier: 'slideshow' })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                videoSettings.tier === 'slideshow'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Slideshow</div>
              <div className="text-sm text-gray-500">Ken Burns efekt</div>
              <Badge variant="success" className="mt-2">Zdarma</Badge>
            </button>

            <button
              onClick={() => setVideoSettings({ tier: 'sora' })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                videoSettings.tier === 'sora'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">Sora AI</div>
              <div className="text-sm text-gray-500">Text-to-video</div>
              <Badge variant="warning" className="mt-2">$0.10/s</Badge>
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Délka
            </label>
            <div className="flex gap-2">
              {[6, 15, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setVideoSettings({ duration: d as 6 | 15 | 30 })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    videoSettings.duration === d
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              Poměr stran
            </label>
            <div className="flex gap-2">
              {(['16:9', '9:16', '1:1'] as const).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setVideoSettings({ aspectRatio: ar })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    videoSettings.aspectRatio === ar
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ken Burns toggle for slideshow */}
        {videoSettings.tier === 'slideshow' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={videoSettings.kenBurns}
              onChange={(e) => setVideoSettings({ kenBurns: e.target.checked })}
              className="rounded"
            />
            Ken Burns efekt (zoom a pan)
          </label>
        )}

        {/* Prompt for Sora */}
        {videoSettings.tier === 'sora' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Video prompt</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={generateAIPrompt}
                loading={generating}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                AI návrh
              </Button>
            </div>
            <Textarea
              value={videoSettings.prompt}
              onChange={(e) => setVideoSettings({ prompt: e.target.value })}
              placeholder="Popiš scénu, pohyb kamery, atmosféru..."
              rows={3}
            />
          </div>
        )}

        {/* Cost Estimate */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            Odhadovaná cena
          </div>
          <div className="font-medium">
            ${estimatedCost}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={videoSettings.tier === 'slideshow' ? generateSlideshow : generateSora}
          loading={generating}
          className="w-full"
          disabled={videoSettings.tier === 'sora' && !videoSettings.prompt}
        >
          <Play className="w-4 h-4 mr-2" />
          {generating ? 'Generuji...' : 'Generovat video'}
        </Button>

        {/* Preview */}
        {videoUrl && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full rounded-lg"
              style={{
                aspectRatio: videoSettings.aspectRatio.replace(':', '/'),
                maxHeight: '300px',
                objectFit: 'contain',
                backgroundColor: '#000',
              }}
            />
            <Button variant="secondary" onClick={downloadVideo} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Stáhnout video
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
