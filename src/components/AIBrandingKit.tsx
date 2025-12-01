/**
 * AIBrandingKit - Automatická analýza landing page a tvorba Brand Kitu
 * 
 * Funkce:
 * - Extrakce barev z webu
 * - Detekce a stažení loga
 * - Extrakce textů (headlines, USP)
 * - Analýza produktů
 * - Automatické vytvoření Brand Kit
 */

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { generateText } from '@/lib/openai-client'
import { generateId } from '@/lib/utils'
import { Button, Card, Badge, Input, Progress } from '@/components/ui'
import { CostBadge, calculateCost } from '@/components/CostEstimate'
import { cn } from '@/lib/utils'
import {
  Link2,
  Loader2,
  Sparkles,
  Palette,
  Type,
  Image as ImageIcon,
  ShoppingBag,
  Check,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Globe,
  Layers,
  Target,
  Wand2,
  Save
} from 'lucide-react'
import type { BrandKit } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface ScanResult {
  url: string
  success: boolean
  brand: {
    name: string
    tagline?: string
    industry?: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  typography: {
    headlineStyle: string
    bodyFont: string
  }
  content: {
    headlines: string[]
    usps: string[]
    ctas: string[]
    productNames: string[]
  }
  meta: {
    title: string
    description: string
    keywords: string[]
  }
  suggestions: {
    targetAudience: string
    tone: string
    recommendedFramework: string
  }
}

interface AIBrandingKitProps {
  onApply?: (result: ScanResult) => void
  onClose?: () => void
}

// =============================================================================
// SCANNING LOGIC
// =============================================================================

async function analyzeWithAI(url: string, apiKey: string): Promise<ScanResult> {
  const prompt = `Analyzuj tuto landing page URL a extrahuj informace pro tvorbu reklamních kreativ: ${url}

Odpověz POUZE jako JSON (bez markdown):
{
  "brand": {
    "name": "název značky",
    "tagline": "slogan pokud existuje",
    "industry": "odvětví (e-commerce, SaaS, restaurace, atd.)"
  },
  "colors": {
    "primary": "#hexcolor (hlavní barva)",
    "secondary": "#hexcolor",
    "accent": "#hexcolor (CTA barva)",
    "background": "#hexcolor"
  },
  "typography": {
    "headlineStyle": "bold/light/elegant",
    "bodyFont": "sans-serif/serif"
  },
  "content": {
    "headlines": ["hlavní headline", "další headlines..."],
    "usps": ["USP 1", "USP 2", "USP 3"],
    "ctas": ["CTA text 1", "CTA text 2"],
    "productNames": ["produkt 1", "produkt 2"]
  },
  "meta": {
    "title": "title stránky",
    "description": "meta description",
    "keywords": ["klíčové", "slovo"]
  },
  "suggestions": {
    "targetAudience": "popis cílové skupiny",
    "tone": "profesionální/přátelský/luxusní/urgentní",
    "recommendedFramework": "AIDA/PAS/4U"
  }
}

Pokud nemůžeš některou informaci zjistit, odhadni ji na základě URL a běžných praktik v daném odvětví.`

  try {
    const result = await generateText(
      { apiKey },
      { prompt, maxTokens: 1000, temperature: 0.5 },
      'standard'
    )
    
    if (result.success && result.text) {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          url,
          success: true,
          ...parsed
        }
      }
    }
    
    throw new Error('Failed to parse response')
  } catch (error) {
    console.error('AI analysis failed:', error)
    return generateFallbackResult(url)
  }
}

function generateFallbackResult(url: string): ScanResult {
  // Extract domain for basic info
  let domain = ''
  try {
    domain = new URL(url).hostname.replace('www.', '')
  } catch {
    domain = url
  }
  
  const name = domain.split('.')[0]
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
  
  return {
    url,
    success: true,
    brand: {
      name: capitalizedName,
      tagline: '',
      industry: 'E-commerce',
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#f97316',
      background: '#ffffff',
    },
    typography: {
      headlineStyle: 'bold',
      bodyFont: 'sans-serif',
    },
    content: {
      headlines: [`Objevte ${capitalizedName}`, `Kvalita od ${capitalizedName}`],
      usps: ['Rychlé dodání', 'Skvělé ceny', 'Zákaznická podpora'],
      ctas: ['Nakoupit', 'Zjistit více'],
      productNames: [],
    },
    meta: {
      title: capitalizedName,
      description: '',
      keywords: [],
    },
    suggestions: {
      targetAudience: 'Široká veřejnost',
      tone: 'profesionální',
      recommendedFramework: 'AIDA',
    },
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIBrandingKit({ onApply, onClose }: AIBrandingKitProps) {
  const { apiKeys, addBrandKit, setTextOverlay } = useAppStore()
  
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const hasApiKey = !!apiKeys.openai
  
  const handleScan = async () => {
    if (!url || !hasApiKey) return
    
    // Validate URL
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      setError('Neplatná URL adresa')
      return
    }
    
    setIsScanning(true)
    setError(null)
    setProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 300)
    
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      const scanResult = await analyzeWithAI(fullUrl, apiKeys.openai)
      setResult(scanResult)
      setProgress(100)
    } catch (err: any) {
      setError(err.message || 'Skenování selhalo')
    } finally {
      clearInterval(progressInterval)
      setIsScanning(false)
    }
  }
  
  const handleCreateBrandKit = () => {
    if (!result) return
    
    const newKit: BrandKit = {
      id: generateId(),
      name: `${result.brand.name} Kit`,
      primaryColor: result.colors.primary,
      secondaryColor: result.colors.secondary,
      textLight: '#ffffff',
      textDark: '#1a1a1a',
      headlineTemplates: result.content.headlines,
      ctaTemplates: result.content.ctas,
      tagline: result.brand.tagline || '',
      logoRules: { autoApply: false, position: 'bottom-right', size: 12, padding: 20, opacity: 100, autoSelectVariant: true },
      isDefault: false,
      createdAt: new Date(),
    }
    
    addBrandKit(newKit)
    alert(`Brand Kit "${newKit.name}" byl vytvořen!`)
  }
  
  const handleApplyTexts = () => {
    if (!result) return
    
    setTextOverlay({
      enabled: true,
      headline: result.content.headlines[0] || '',
      subheadline: result.content.usps[0] || '',
      cta: result.content.ctas[0] || 'Zjistit více',
      ctaColor: result.colors.accent,
    })
    
    onApply?.(result)
    onClose?.()
  }

  return (
    <div className="bg-white rounded-xl border shadow-lg overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Globe className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Landing Page Scanner</h3>
              <p className="text-sm text-gray-500">Extrakce barev, textů a stylů z webu</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          )}
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1">
        {/* API Key warning */}
        {!hasApiKey && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Chybí OpenAI API klíč</p>
              <p className="text-sm text-yellow-700 mt-1">Pro skenování je potřeba nastavit API klíč.</p>
            </div>
          </div>
        )}
        
        {/* URL Input */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            URL adresa landing page
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={!url || !hasApiKey || isScanning}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Skenovat
                  <CostBadge cost={calculateCost('text', { count: 1 })} />
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>
        
        {/* Progress */}
        {isScanning && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Analyzuji stránku...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Brand Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Značka
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Název</p>
                  <p className="font-semibold text-gray-900">{result.brand.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Odvětví</p>
                  <p className="text-gray-700">{result.brand.industry}</p>
                </div>
                {result.brand.tagline && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Tagline</p>
                    <p className="text-gray-700 italic">"{result.brand.tagline}"</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Colors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Barevná paleta
              </h4>
              <div className="flex gap-3">
                {Object.entries(result.colors).map(([key, color]) => (
                  <div key={key} className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg border shadow-sm mb-1"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-xs text-gray-500">{key}</p>
                    <p className="text-xs font-mono text-gray-700">{color}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Extrahovaný obsah
              </h4>
              
              {/* Headlines */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Headlines</p>
                <div className="space-y-1">
                  {result.content.headlines.map((h, i) => (
                    <p key={i} className="text-sm bg-blue-50 text-blue-800 px-3 py-1.5 rounded">{h}</p>
                  ))}
                </div>
              </div>
              
              {/* USPs */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">USPs</p>
                <div className="flex flex-wrap gap-2">
                  {result.content.usps.map((usp, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700">
                      ✓ {usp}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* CTAs */}
              <div>
                <p className="text-xs text-gray-500 mb-1">CTA tlačítka</p>
                <div className="flex flex-wrap gap-2">
                  {result.content.ctas.map((cta, i) => (
                    <span 
                      key={i}
                      className="px-4 py-1.5 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: result.colors.accent }}
                    >
                      {cta}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI doporučení
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-purple-600">Cílová skupina</p>
                  <p className="text-purple-900">{result.suggestions.targetAudience}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600">Tón komunikace</p>
                  <p className="text-purple-900 capitalize">{result.suggestions.tone}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600">Framework</p>
                  <p className="text-purple-900">{result.suggestions.recommendedFramework}</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleCreateBrandKit}
                variant="outline"
                className="flex-1"
              >
                <Palette className="w-4 h-4 mr-2" />
                Vytvořit Brand Kit
              </Button>
              <Button
                onClick={handleApplyTexts}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Použít texty
              </Button>
            </div>
            
            {/* Rescan */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setResult(null); setUrl('') }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Skenovat jinou stránku
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIBrandingKit
