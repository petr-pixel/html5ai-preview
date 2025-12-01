import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { Card, Button, Input, Textarea, Tabs, TabsList, TabsTrigger, Progress, Spinner } from '@/components/ui'
import { Film, Wand2, DollarSign, Play, Download, AlertCircle } from 'lucide-react'
import { generateVideo, checkVideoStatus, buildVideoPrompt, PRICING } from '@/lib/openai-client'
import type { VideoGenerationResult } from '@/lib/openai-client'

export const VideoScenarioEditor = () => {
  const { 
    videoScenario, 
    setVideoScenario, 
    sourceImage, 
    videoModelTier, 
    setVideoModelTier,
    apiKeys,
    prompt 
  } = useAppStore()
  
  const [mode, setMode] = useState<'full' | 'quick'>('full')
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null)
  const [progress, setProgress] = useState(0)

  const handleChange =
    (field: keyof typeof videoScenario) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        field === 'lengthSeconds'
          ? Number(e.target.value)
          : (e.target.value as any)
      setVideoScenario({ [field]: value } as any)
    }

  // Výpočet ceny
  const getVideoModel = () => videoModelTier === 'best' ? 'sora-2-pro' : 'sora-2'
  const estimatedCost = PRICING.video[getVideoModel()] * videoScenario.lengthSeconds

  // Generování videa přes Sora API
  const handleGenerateVideo = async () => {
    if (!apiKeys.openai) {
      alert('Nejprve nastavte OpenAI API klíč v nastavení')
      return
    }

    setIsGenerating(true)
    setProgress(10)
    setVideoResult(null)

    try {
      const videoPrompt = buildVideoPrompt(videoScenario, prompt)
      
      const result = await generateVideo(
        { apiKey: apiKeys.openai },
        {
          prompt: videoPrompt,
          aspectRatio: videoScenario.aspectRatio,
          duration: videoScenario.lengthSeconds,
          model: getVideoModel(),
          firstFrameImage: mode === 'quick' && sourceImage ? sourceImage : undefined,
        }
      )

      setProgress(30)

      if (result.success && result.jobId) {
        // Poll for status
        let attempts = 0
        const maxAttempts = 60 // 5 minut max
        
        const pollStatus = async () => {
          const status = await checkVideoStatus({ apiKey: apiKeys.openai }, result.jobId!)
          
          if (status.status === 'completed') {
            setVideoResult(status)
            setProgress(100)
            setIsGenerating(false)
          } else if (status.status === 'failed') {
            setVideoResult(status)
            setIsGenerating(false)
          } else if (attempts < maxAttempts) {
            attempts++
            setProgress(30 + (attempts / maxAttempts) * 60)
            setTimeout(pollStatus, 5000) // Check every 5 seconds
          } else {
            setVideoResult({ 
              success: false, 
              status: 'failed', 
              error: 'Timeout - generování trvá příliš dlouho' 
            })
            setIsGenerating(false)
          }
        }

        pollStatus()
      } else {
        setVideoResult(result)
        setIsGenerating(false)
      }
    } catch (error: any) {
      setVideoResult({ 
        success: false, 
        status: 'failed', 
        error: error.message 
      })
      setIsGenerating(false)
    }
  }

  // Kopírovat prompt do schránky (fallback)
  const handleCopyPrompt = () => {
    const videoPrompt = buildVideoPrompt(videoScenario, prompt)
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(videoPrompt)
      alert('Video prompt zkopírován do schránky!')
    } else {
      console.log('Video prompt:', videoPrompt)
      alert('Prompt v konzoli (F12)')
    }
  }

  return (
    <Card className="p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">Video generátor</h3>
            <p className="text-xs text-muted-foreground">
              Sora 2 API – text-to-video & image-to-video
            </p>
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'full' | 'quick')}>
          <TabsList className="grid grid-cols-2 h-9">
            <TabsTrigger value="full" className="text-xs">
              Plný scénář
            </TabsTrigger>
            <TabsTrigger value="quick" className="text-xs flex items-center gap-1">
              <Wand2 className="w-3 h-3" />
              Z obrázku
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Model Tier Selection - Sora 2 vs Sora 2 Pro */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">Model & Cena</span>
          </div>
          <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
            {(['cheap', 'standard', 'best'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setVideoModelTier(tier)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  videoModelTier === tier
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {tier === 'cheap' || tier === 'standard' ? 'Sora 2' : 'Sora 2 Pro'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Model:</span>{' '}
            <span className="font-medium">{getVideoModel()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cena/sec:</span>{' '}
            <span className="font-medium text-emerald-500">${PRICING.video[getVideoModel()].toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Délka:</span>{' '}
            <span className="font-medium">{videoScenario.lengthSeconds}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">Odhad celkem:</span>{' '}
            <span className="font-bold text-emerald-500">${estimatedCost.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Sora 2: $0.10/s (rychlejší, nižší cena) • Sora 2 Pro: $0.40/s (vyšší kvalita, cinematický look)
        </p>
      </div>

      {/* Full Scenario Mode */}
      {mode === 'full' && (
        <div className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Typ kampaně
              </label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.campaignType}
                onChange={handleChange('campaignType')}
              >
                <option value="pmax">Google P-Max</option>
                <option value="demand_gen">Demand Gen / Shorts</option>
                <option value="youtube_bumper">YouTube Bumper (6s)</option>
                <option value="youtube_instream">YouTube In-stream</option>
                <option value="sklik_outstream">Sklik Outstream</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Délka
              </label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.lengthSeconds}
                onChange={handleChange('lengthSeconds')}
              >
                <option value={6}>6 s (bumper)</option>
                <option value={10}>10 s</option>
                <option value={15}>15 s</option>
                <option value={20}>20 s</option>
                <option value={30}>30 s</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Poměr stran
              </label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.aspectRatio}
                onChange={handleChange('aspectRatio')}
              >
                <option value="16:9">16:9 (landscape)</option>
                <option value="1:1">1:1 (square)</option>
                <option value="9:16">9:16 (vertical/Shorts)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Styl
              </label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.style}
                onChange={handleChange('style')}
              >
                <option value="realistic">Realistický</option>
                <option value="motion_graphics">Motion graphics</option>
                <option value="ugc">UGC / mobil</option>
                <option value="illustration">Ilustrace</option>
              </select>
            </div>
          </div>

          {/* Language & Subtitles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Jazyk
              </label>
              <Input
                value={videoScenario.language}
                onChange={handleChange('language')}
                placeholder="cs, en, de..."
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="subtitles"
                type="checkbox"
                className="rounded border-border"
                checked={videoScenario.subtitles}
                onChange={(e) => setVideoScenario({ subtitles: e.target.checked })}
              />
              <label htmlFor="subtitles" className="text-xs text-muted-foreground">
                Generovat titulky
              </label>
            </div>
          </div>

          {/* Video Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Hook (0–2s) <span className="text-orange-500">*zastaví scroll</span>
              </label>
              <Textarea
                rows={2}
                value={videoScenario.hook}
                onChange={handleChange('hook')}
                placeholder="Překvapivý záběr, otázka, problém..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Body</label>
              <Textarea
                rows={2}
                value={videoScenario.body}
                onChange={handleChange('body')}
                placeholder="Produkt v akci, hlavní benefit..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Proof</label>
              <Textarea
                rows={2}
                value={videoScenario.proof}
                onChange={handleChange('proof')}
                placeholder="Hodnocení, detail, důkaz kvality..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">CTA (konec)</label>
              <Textarea
                rows={2}
                value={videoScenario.cta}
                onChange={handleChange('cta')}
                placeholder="Logo, URL, tlačítko, jasná výzva..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Voiceover text</label>
            <Textarea
              rows={2}
              value={videoScenario.voiceoverText}
              onChange={handleChange('voiceoverText')}
              placeholder="Text pro AI dabing (volitelné)..."
            />
          </div>
        </div>
      )}

      {/* Quick Mode */}
      {mode === 'quick' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-sky-500">Quick video z obrázku</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vezme aktuální obrázek a vytvoří krátké video s Ken Burns efektem, 
                  jemným pohybem kamery a text overlay. Ideální pro bumpery a rychlé P-Max doplnění.
                </p>
              </div>
            </div>
          </div>

          {!sourceImage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">
                Nejprve vygenerujte nebo nahrajte obrázek v sekci nahoře
              </span>
            </div>
          )}

          {sourceImage && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Délka</label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.lengthSeconds}
                onChange={handleChange('lengthSeconds')}
              >
                <option value={6}>6 s</option>
                <option value={10}>10 s</option>
                <option value={15}>15 s</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Poměr</label>
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={videoScenario.aspectRatio}
                onChange={handleChange('aspectRatio')}
              >
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Efekt</label>
              <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="ken_burns">Ken Burns</option>
                <option value="zoom_in">Zoom In</option>
                <option value="pan">Pan</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Result */}
      {isGenerating && (
        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Spinner size={16} />
            <span className="text-sm">Generuji video přes Sora 2...</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">
            Generování může trvat 1-5 minut v závislosti na délce a složitosti.
          </p>
        </div>
      )}

      {videoResult && videoResult.success && videoResult.status === 'completed' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500">Video připraveno!</span>
          </div>
          {videoResult.videoUrl && (
            <video 
              src={videoResult.videoUrl} 
              controls 
              className="w-full rounded-lg"
            />
          )}
          <div className="flex gap-2">
            {videoResult.videoUrl && (
              <a
                href={videoResult.videoUrl}
                download={`video_${videoScenario.aspectRatio.replace(':', 'x')}_${videoScenario.lengthSeconds}s.mp4`}
                className="flex-1"
              >
                <Button variant="primary" className="w-full">
                  <Download className="w-4 h-4" />
                  Stáhnout MP4
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {videoResult && !videoResult.success && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">Chyba</span>
          </div>
          <p className="text-xs text-red-400 mt-1">{videoResult.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
        <Button 
          onClick={handleGenerateVideo}
          disabled={isGenerating || (mode === 'quick' && !sourceImage)}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Spinner size={16} />
              Generuji...
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              Generovat video (${estimatedCost.toFixed(2)})
            </>
          )}
        </Button>
        <Button variant="secondary" onClick={handleCopyPrompt}>
          Kopírovat prompt
        </Button>
      </div>
    </Card>
  )
}
