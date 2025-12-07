'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Input, Textarea, Card } from '@/components/ui'
import { Upload, Wand2, Search, Loader2, Image, Sparkles } from 'lucide-react'

export function InputPanel() {
  const {
    apiKey,
    sourceImage,
    setSourceImage,
    sourcePrompt,
    setSourcePrompt,
    setActiveTab,
    isGenerating,
    setIsGenerating,
    defaultText,
    setDefaultText,
  } = useAppStore()

  const [competitorUrl, setCompetitorUrl] = useState('')
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSourceImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateImage = async () => {
    if (!apiKey) {
      alert('Zadej API klíč v Nastavení')
      return
    }
    if (!sourcePrompt.trim()) {
      alert('Zadej prompt')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sourcePrompt,
          apiKey,
          size: '1024x1024',
        }),
      })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        setSourceImage(data.imageUrl)
      } else {
        alert(data.error || 'Chyba při generování')
      }
    } catch (err) {
      alert('Chyba připojení')
    }
    setIsGenerating(false)
  }

  const analyzeCompetitor = async () => {
    if (!apiKey) {
      alert('Zadej API klíč v Nastavení')
      return
    }
    if (!competitorUrl.trim()) {
      alert('Zadej URL konkurence')
      return
    }

    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: competitorUrl,
          apiKey,
        }),
      })
      const data = await res.json()
      if (data.success && data.analysis) {
        setCompetitorAnalysis(data.analysis)
      } else {
        alert(data.error || 'Chyba při analýze')
      }
    } catch (err) {
      alert('Chyba připojení')
    }
    setAnalyzing(false)
  }

  const applyCompetitorStyle = () => {
    if (!competitorAnalysis) return
    // Apply CTA from competitor
    if (competitorAnalysis.cta) {
      setDefaultText({ cta: competitorAnalysis.cta })
    }
  }

  const generateTexts = async () => {
    if (!apiKey) {
      alert('Zadej API klíč v Nastavení')
      return
    }

    const context = sourcePrompt || 'reklamní kreativa'
    
    setIsGenerating(true)
    try {
      const [headlineRes, ctaRes] = await Promise.all([
        fetch('/api/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: context, apiKey, type: 'headline' }),
        }),
        fetch('/api/generate/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: context, apiKey, type: 'cta' }),
        }),
      ])

      const [headline, cta] = await Promise.all([headlineRes.json(), ctaRes.json()])

      if (headline.success) setDefaultText({ headline: headline.text })
      if (cta.success) setDefaultText({ cta: cta.text })
    } catch (err) {
      alert('Chyba při generování textů')
    }
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Source Image */}
      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-gray-400" />
          Zdrojový obrázek
        </h3>

        <div className="space-y-4">
          {/* Prompt */}
          <Textarea
            label="Prompt pro AI generování"
            value={sourcePrompt}
            onChange={(e) => setSourcePrompt(e.target.value)}
            placeholder="Například: Moderní kancelář s lidmi pracujícími na počítačích, profesionální atmosféra"
            rows={3}
          />

          <div className="flex gap-2">
            <Button
              onClick={generateImage}
              loading={isGenerating}
              disabled={!sourcePrompt.trim()}
              className="flex-1"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generovat
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Nahrát
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {sourceImage && (
            <div className="relative">
              <img
                src={sourceImage}
                alt="Source"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setSourceImage(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Texts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-400" />
            Texty
          </h3>
          <Button variant="ghost" size="sm" onClick={generateTexts} loading={isGenerating}>
            <Wand2 className="w-4 h-4 mr-1" />
            AI
          </Button>
        </div>

        <div className="space-y-3">
          <Input
            label="Headline"
            value={defaultText.headline}
            onChange={(e) => setDefaultText({ headline: e.target.value })}
            placeholder="Hlavní titulek"
          />
          <Input
            label="Subheadline"
            value={defaultText.subheadline}
            onChange={(e) => setDefaultText({ subheadline: e.target.value })}
            placeholder="Podtitulek (volitelné)"
          />
          <Input
            label="CTA"
            value={defaultText.cta}
            onChange={(e) => setDefaultText({ cta: e.target.value })}
            placeholder="Koupit nyní"
          />
        </div>
      </Card>

      {/* Competitor Analysis */}
      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          Analýza konkurence
        </h3>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://konkurent.cz"
              className="flex-1"
            />
            <Button
              onClick={analyzeCompetitor}
              loading={analyzing}
              variant="secondary"
            >
              Analyzovat
            </Button>
          </div>

          {competitorAnalysis && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{competitorAnalysis.title}</h4>
                <Button size="sm" variant="ghost" onClick={applyCompetitorStyle}>
                  Použít styl
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Styl:</span>
                  <p className="font-medium">{competitorAnalysis.style}</p>
                </div>
                <div>
                  <span className="text-gray-500">CTA:</span>
                  <p className="font-medium">{competitorAnalysis.cta}</p>
                </div>
              </div>

              {competitorAnalysis.colors && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Barvy:</span>
                  {competitorAnalysis.colors.map((color: string, i: number) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {competitorAnalysis.recommendations && (
                <div>
                  <span className="text-sm text-gray-500">Doporučení:</span>
                  <ul className="mt-1 space-y-1">
                    {competitorAnalysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Continue Button */}
      {sourceImage && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setActiveTab('formats')}
        >
          Pokračovat k formátům
        </Button>
      )}
    </div>
  )
}
