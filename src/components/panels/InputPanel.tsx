import { useState, useCallback } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Wand2, 
  Upload, 
  Image as ImageIcon, 
  Sparkles,
  Loader2,
  Globe,
  Search,
  ArrowRight,
  Type,
  Zap
} from 'lucide-react'

export function InputPanel() {
  const {
    apiKey,
    sourceImage,
    setSourceImage,
    sourcePrompt,
    setSourcePrompt,
    defaultText,
    setDefaultText,
    brandKit,
    setBrandKit,
    competitorUrl,
    setCompetitorUrl,
    competitorAnalysis,
    setCompetitorAnalysis,
    setActiveTab,
  } = useAppStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate image with OpenAI
  const generateImage = async () => {
    if (!apiKey) {
      setError('Nastav API klíč v nastavení')
      return
    }
    if (!sourcePrompt.trim()) {
      setError('Zadej prompt pro generování')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sourcePrompt,
          apiKey,
          size: '1536x1024',
          n: 1,
        }),
      })

      const data = await response.json()

      if (data.success && data.imageUrl) {
        setSourceImage(data.imageUrl)
      } else {
        setError(data.error || 'Chyba při generování')
      }
    } catch (err: any) {
      setError(err.message || 'Chyba připojení')
    }

    setIsGenerating(false)
  }

  // Handle file upload
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setSourceImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [setSourceImage])

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setSourceImage(event.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }, [setSourceImage])

  // Generate text with AI
  const generateText = async (type: 'headline' | 'subheadline' | 'cta') => {
    if (!apiKey) {
      setError('Nastav API klíč v nastavení')
      return
    }

    setIsGeneratingText(true)

    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sourcePrompt || 'reklamní kreativa',
          apiKey,
          type,
          brandTone: brandKit.toneOfVoice,
        }),
      })

      const data = await response.json()

      if (data.success && data.text) {
        setDefaultText({ [type]: data.text })
      }
    } catch (err) {
      console.error('Text generation error:', err)
    }

    setIsGeneratingText(false)
  }

  // Analyze competitor
  const analyzeCompetitor = async () => {
    if (!apiKey) {
      setError('Nastav API klíč v nastavení')
      return
    }
    if (!competitorUrl.trim()) {
      setError('Zadej URL konkurenta')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: competitorUrl,
          apiKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setCompetitorAnalysis(data.analysis)
      } else {
        setError(data.error || 'Chyba při analýze')
      }
    } catch (err: any) {
      setError(err.message || 'Chyba připojení')
    }

    setIsAnalyzing(false)
  }

  // Extract brand from URL
  const extractBrand = async () => {
    if (!competitorUrl.trim()) return

    try {
      const response = await fetch('/api/analyze/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: competitorUrl }),
      })

      const data = await response.json()

      if (data.success && data.brandKit) {
        setBrandKit(data.brandKit)
      }
    } catch (err) {
      console.error('Brand extraction error:', err)
    }
  }

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <div>
        <h1 className="text-2xl font-bold">Zdrojový obrázek</h1>
        <p className="text-muted-foreground">
          Vygeneruj AI obrázek nebo nahraj vlastní
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Image source */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Generování
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Nahrát
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generovat obrázek</CardTitle>
                  <CardDescription>
                    Použij GPT-Image-1 pro vytvoření unikátní kreativy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Popiš obrázek, který chceš vytvořit... např. 'Profesionální fotografie produktu na bílém pozadí, studio osvětlení'"
                    value={sourcePrompt}
                    onChange={(e) => setSourcePrompt(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    onClick={generateImage} 
                    disabled={isGenerating || !apiKey}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generuji...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Vygenerovat obrázek
                      </>
                    )}
                  </Button>
                  {!apiKey && (
                    <p className="text-xs text-destructive text-center">
                      Nastav API klíč v nastavení
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nahrát obrázek</CardTitle>
                  <CardDescription>
                    Přetáhni soubor, vlož z clipboardu (Ctrl+V), nebo vyber
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Klikni pro výběr</span> nebo přetáhni
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP (max. 10MB)
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleUpload}
                    />
                  </label>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Image Preview */}
          {sourceImage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Náhled</CardTitle>
                  <Badge variant="success">Obrázek načten</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSourceImage(null)}
                  >
                    Odebrat
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setActiveTab('formats')}
                  >
                    Pokračovat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right column - Text & Analysis */}
        <div className="space-y-6">
          {/* Text Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Texty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Headline</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => generateText('headline')}
                    disabled={isGeneratingText || !apiKey}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI
                  </Button>
                </div>
                <Input
                  value={defaultText.headline}
                  onChange={(e) => setDefaultText({ headline: e.target.value })}
                  placeholder="Hlavní nadpis..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Subheadline</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => generateText('subheadline')}
                    disabled={isGeneratingText || !apiKey}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI
                  </Button>
                </div>
                <Input
                  value={defaultText.subheadline}
                  onChange={(e) => setDefaultText({ subheadline: e.target.value })}
                  placeholder="Podnadpis..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">CTA</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => generateText('cta')}
                    disabled={isGeneratingText || !apiKey}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    AI
                  </Button>
                </div>
                <Input
                  value={defaultText.cta}
                  onChange={(e) => setDefaultText({ cta: e.target.value })}
                  placeholder="Výzva k akci..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Analýza konkurence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="https://konkurent.cz"
                />
                <Button 
                  onClick={analyzeCompetitor}
                  disabled={isAnalyzing || !apiKey}
                  size="icon"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {competitorAnalysis && (
                <div className="space-y-3 p-3 rounded-lg bg-muted">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Barvy</p>
                    <div className="flex gap-1 mt-1">
                      {competitorAnalysis.colors?.map((color: string, i: number) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  {competitorAnalysis.recommendations && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Doporučení</p>
                      <ul className="text-xs mt-1 space-y-1">
                        {competitorAnalysis.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={extractBrand}
                  >
                    Použít styl
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
