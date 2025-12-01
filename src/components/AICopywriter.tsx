/**
 * AICopywriter - Generování reklamních textů pomocí AI
 * 
 * Funkce:
 * - Generování headlines, subheadlines, CTA
 * - Copywriting frameworky (AIDA, PAS, 4U, BAB)
 * - Analýza URL/landing page pro kontext
 * - Multi-jazyková podpora
 * - Tone of voice nastavení
 */

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { generateText } from '@/lib/openai-client'
import { Button, Card, Badge, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ChevronDown,
  Globe,
  MessageSquare,
  Target,
  Zap,
  Heart,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Link2,
  Type,
  Hash
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

type CopyFramework = 'aida' | 'pas' | '4u' | 'bab' | 'fomo' | 'social'
type ToneOfVoice = 'professional' | 'friendly' | 'urgent' | 'luxury' | 'playful' | 'trustworthy'
type Language = 'cs' | 'sk' | 'en' | 'de'

interface GeneratedCopy {
  headline: string
  subheadline: string
  cta: string
  framework: CopyFramework
}

interface AICopywriterProps {
  onApply?: (headline: string, subheadline: string, cta: string) => void
  onClose?: () => void
  initialContext?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FRAMEWORKS: Record<CopyFramework, { name: string; description: string; icon: React.ElementType }> = {
  aida: { name: 'AIDA', description: 'Attention, Interest, Desire, Action', icon: Target },
  pas: { name: 'PAS', description: 'Problem, Agitate, Solution', icon: AlertTriangle },
  '4u': { name: '4U', description: 'Useful, Urgent, Unique, Ultra-specific', icon: Zap },
  bab: { name: 'BAB', description: 'Before, After, Bridge', icon: ArrowRight },
  fomo: { name: 'FOMO', description: 'Fear of Missing Out', icon: Heart },
  social: { name: 'Social Proof', description: 'Důvěryhodnost a reference', icon: MessageSquare },
}

const TONES: Record<ToneOfVoice, { name: string; emoji: string }> = {
  professional: { name: 'Profesionální', emoji: '👔' },
  friendly: { name: 'Přátelský', emoji: '😊' },
  urgent: { name: 'Urgentní', emoji: '⚡' },
  luxury: { name: 'Luxusní', emoji: '✨' },
  playful: { name: 'Hravý', emoji: '🎉' },
  trustworthy: { name: 'Důvěryhodný', emoji: '🤝' },
}

const LANGUAGES: Record<Language, { name: string; flag: string }> = {
  cs: { name: 'Čeština', flag: '🇨🇿' },
  sk: { name: 'Slovenština', flag: '🇸🇰' },
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

function buildCopyPrompt(
  context: string,
  framework: CopyFramework,
  tone: ToneOfVoice,
  language: Language,
  productInfo?: string
): string {
  const frameworkInstructions: Record<CopyFramework, string> = {
    aida: `Použij AIDA framework:
- Attention: Upoutej pozornost šokující statistikou nebo otázkou
- Interest: Vyvolej zájem konkrétním benefitem
- Desire: Vytvoř touhu emočním příběhem
- Action: Jasná výzva k akci`,
    pas: `Použij PAS framework:
- Problem: Pojmenuj bolestivý problém cílové skupiny
- Agitate: Zesil frustraci z problému
- Solution: Představ produkt jako řešení`,
    '4u': `Použij 4U framework - každý text musí být:
- Useful: Jasně užitečný pro čtenáře
- Urgent: Vytvářející pocit naléhavosti
- Unique: Odlišující se od konkurence
- Ultra-specific: Konkrétní čísla a fakta`,
    bab: `Použij BAB framework:
- Before: Popiš současnou bolestivou situaci
- After: Nakresli vizi po vyřešení
- Bridge: Ukaž produkt jako most mezi nimi`,
    fomo: `Použij FOMO (Fear of Missing Out):
- Limitovaná dostupnost
- Exkluzivita
- Sociální důkaz ("Už 5000+ zákazníků...")
- Časově omezená nabídka`,
    social: `Použij Social Proof:
- Reference zákazníků
- Statistiky prodejů
- Certifikace a ocenění
- "Nejprodávanější", "Doporučuje X%"`,
  }

  const toneInstructions: Record<ToneOfVoice, string> = {
    professional: 'Formální, expertní tón. Používej odborné výrazy kde je to vhodné.',
    friendly: 'Neformální, přátelský tón. Mluv jako kamarád, ne jako firma.',
    urgent: 'Naléhavý tón. Používej slova jako "teď", "ihned", "nenechte si ujít".',
    luxury: 'Prémiový, elegantní tón. Zdůrazňuj exkluzivitu a kvalitu.',
    playful: 'Hravý, vtipný tón. Používej slovní hříčky a humor.',
    trustworthy: 'Důvěryhodný, upřímný tón. Zdůrazňuj záruky a bezpečnost.',
  }

  return `Jsi expertní copywriter pro online reklamy. Vytvoř reklamní texty v jazyce: ${LANGUAGES[language].name}.

KONTEXT PRODUKTU/SLUŽBY:
${context || 'Obecný e-commerce produkt'}
${productInfo ? `\nDODANÉ INFO:\n${productInfo}` : ''}

FRAMEWORK:
${frameworkInstructions[framework]}

TÓN KOMUNIKACE:
${toneInstructions[tone]}

PRAVIDLA:
1. Headline: Max 50 znaků, silný hook, čísla fungují dobře
2. Subheadline: Max 90 znaků, rozviň headline, přidej benefit
3. CTA: Max 20 znaků, akční sloveso, jasná výzva

Odpověz POUZE jako JSON (bez markdown):
{
  "variants": [
    {"headline": "...", "subheadline": "...", "cta": "..."},
    {"headline": "...", "subheadline": "...", "cta": "..."},
    {"headline": "...", "subheadline": "...", "cta": "..."},
    {"headline": "...", "subheadline": "...", "cta": "..."},
    {"headline": "...", "subheadline": "...", "cta": "..."}
  ]
}`
}

// =============================================================================
// URL ANALYZER
// =============================================================================

async function analyzeURL(url: string, apiKey: string): Promise<string> {
  // In production, this would fetch the URL and extract content
  // For now, we'll use AI to imagine what might be on the page
  
  const prompt = `Představ si, že jsi navštívil tuto URL: ${url}

Na základě URL odhadni:
1. Jaký typ produktu/služby se nabízí
2. Jaká je cílová skupina
3. Jaké jsou pravděpodobné benefity
4. Jaký je tón komunikace webu

Odpověz stručně v 2-3 větách.`

  try {
    const result = await generateText(
      { apiKey },
      { prompt, maxTokens: 200, temperature: 0.7 },
      'standard'
    )
    return result.success ? result.text : ''
  } catch {
    return ''
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AICopywriter({ onApply, onClose, initialContext }: AICopywriterProps) {
  const { apiKeys, setTextOverlay, textOverlay } = useAppStore()
  
  // State
  const [context, setContext] = useState(initialContext || '')
  const [url, setUrl] = useState('')
  const [framework, setFramework] = useState<CopyFramework>('aida')
  const [tone, setTone] = useState<ToneOfVoice>('professional')
  const [language, setLanguage] = useState<Language>('cs')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false)
  const [variants, setVariants] = useState<GeneratedCopy[]>([])
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showFrameworks, setShowFrameworks] = useState(false)
  
  const hasApiKey = !!apiKeys.openai
  
  // Analyze URL
  const handleAnalyzeUrl = async () => {
    if (!url || !hasApiKey) return
    setIsAnalyzingUrl(true)
    const analysis = await analyzeURL(url, apiKeys.openai)
    if (analysis) {
      setContext(prev => prev ? `${prev}\n\nZ URL ${url}:\n${analysis}` : `Z URL ${url}:\n${analysis}`)
    }
    setIsAnalyzingUrl(false)
  }
  
  // Generate copy
  const handleGenerate = async () => {
    if (!hasApiKey || !context.trim()) return
    
    setIsGenerating(true)
    setVariants([])
    setSelectedVariant(null)
    
    try {
      const prompt = buildCopyPrompt(context, framework, tone, language)
      
      const result = await generateText(
        { apiKey: apiKeys.openai },
        { prompt, maxTokens: 800, temperature: 0.8 },
        'standard'
      )
      
      if (result.success && result.text) {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.variants && Array.isArray(parsed.variants)) {
            setVariants(parsed.variants.map((v: any) => ({
              ...v,
              framework
            })))
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
    }
    
    setIsGenerating(false)
  }
  
  // Apply variant
  const handleApply = (variant: GeneratedCopy) => {
    if (onApply) {
      onApply(variant.headline, variant.subheadline, variant.cta)
    } else {
      setTextOverlay({
        enabled: true,
        headline: variant.headline,
        subheadline: variant.subheadline,
        cta: variant.cta,
      })
    }
    onClose?.()
  }
  
  // Copy to clipboard
  const handleCopy = (variant: GeneratedCopy, index: number) => {
    const text = `Headline: ${variant.headline}\nSubheadline: ${variant.subheadline}\nCTA: ${variant.cta}`
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border shadow-lg overflow-hidden max-w-2xl w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wand2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Copywriter</h3>
              <p className="text-sm text-gray-500">Generování reklamních textů</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-5">
        {/* API Key warning */}
        {!hasApiKey && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Chybí OpenAI API klíč</p>
              <p className="text-sm text-yellow-700 mt-1">Pro generování textů je potřeba nastavit API klíč v nastavení.</p>
            </div>
          </div>
        )}
        
        {/* URL Input */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            URL landing page (volitelné)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleAnalyzeUrl}
              disabled={!url || !hasApiKey || isAnalyzingUrl}
            >
              {isAnalyzingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Context */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Kontext produktu/služby
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Popište váš produkt, cílovou skupinu, klíčové benefity, akce..."
            className="w-full px-4 py-3 border rounded-lg text-sm min-h-[100px] resize-none"
          />
        </div>
        
        {/* Options row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Framework */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Framework</label>
            <div className="relative">
              <button
                onClick={() => setShowFrameworks(!showFrameworks)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between hover:bg-gray-50"
              >
                <span>{FRAMEWORKS[framework].name}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFrameworks && "rotate-180")} />
              </button>
              {showFrameworks && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 py-1">
                  {Object.entries(FRAMEWORKS).map(([key, { name, description, icon: Icon }]) => (
                    <button
                      key={key}
                      onClick={() => { setFramework(key as CopyFramework); setShowFrameworks(false) }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2",
                        framework === key && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-gray-500">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Tone */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tón</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ToneOfVoice)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {Object.entries(TONES).map(([key, { name, emoji }]) => (
                <option key={key} value={key}>{emoji} {name}</option>
              ))}
            </select>
          </div>
          
          {/* Language */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Jazyk</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {Object.entries(LANGUAGES).map(([key, { name, flag }]) => (
                <option key={key} value={key}>{flag} {name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!hasApiKey || !context.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generuji varianty...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Vygenerovat 5 variant</>
          )}
        </Button>
        
        {/* Results */}
        {variants.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Vygenerované varianty
            </h4>
            
            {variants.map((variant, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all",
                  selectedVariant === index 
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                    : "hover:border-gray-300"
                )}
                onClick={() => setSelectedVariant(index)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Type className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Headline</span>
                      </div>
                      <p className="font-semibold text-gray-900">{variant.headline}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Subheadline</span>
                    </div>
                    <p className="text-sm text-gray-600">{variant.subheadline}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: textOverlay.ctaColor || '#f97316' }}
                      >
                        {variant.cta}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(variant, index) }}
                      >
                        {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleApply(variant) }}
                      >
                        Použít
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Regenerate */}
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
              Vygenerovat nové varianty
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AICopywriter
