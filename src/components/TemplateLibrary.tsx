/**
 * TemplateLibrary - Knihovna šablon podle odvětví
 * 
 * Funkce:
 * - Předpřipravené šablony pro různá odvětví
 * - Barevné palety, texty, layouty
 * - Import do Brand Kitu
 * - Customizace před použitím
 */

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { generateId } from '@/lib/utils'
import { Button, Card, Badge, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  LayoutTemplate,
  Search,
  ShoppingBag,
  Utensils,
  Home,
  Car,
  Plane,
  Heart,
  Briefcase,
  Smartphone,
  Palette,
  Check,
  ChevronRight,
  Star,
  Sparkles,
  Download,
  Eye,
  X
} from 'lucide-react'
import type { BrandKit, TextOverlay } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface Template {
  id: string
  name: string
  description: string
  industry: string
  icon: React.ElementType
  thumbnail?: string
  colors: {
    primary: string
    secondary: string
    accent: string
    textLight: string
    textDark: string
  }
  headlines: string[]
  subheadlines: string[]
  ctas: string[]
  tags: string[]
  popularity: number // 1-5
  isNew?: boolean
  isPremium?: boolean
}

interface TemplateLibraryProps {
  onApply?: (template: Template) => void
  onClose?: () => void
}

// =============================================================================
// TEMPLATE DATA
// =============================================================================

const TEMPLATES: Template[] = [
  // E-COMMERCE
  {
    id: 'ecommerce-sale',
    name: 'Slevová akce',
    description: 'Ideální pro výprodeje a slevy',
    industry: 'E-commerce',
    icon: ShoppingBag,
    colors: {
      primary: '#ef4444',
      secondary: '#fbbf24',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Sleva až {X}% na vše',
      'Výprodej sezóny!',
      'Black Friday akce',
      'Jen dnes: -{X}%',
      'Flash Sale',
    ],
    subheadlines: [
      'Pouze do vyprodání zásob',
      'Platí do {DATE}',
      'Nepromeškejte jedinečnou příležitost',
      'Doprava zdarma nad {AMOUNT} Kč',
    ],
    ctas: ['Nakoupit', 'Zobrazit akci', 'Využít slevu', 'Koupit nyní'],
    tags: ['výprodej', 'sleva', 'e-shop', 'akce'],
    popularity: 5,
  },
  {
    id: 'ecommerce-new-product',
    name: 'Novinka v nabídce',
    description: 'Představení nového produktu',
    industry: 'E-commerce',
    icon: ShoppingBag,
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Novinka: {PRODUCT}',
      'Právě dorazilo!',
      'Exkluzivně u nás',
      'Představujeme {PRODUCT}',
    ],
    subheadlines: [
      'Buďte první, kdo to má',
      'Limitovaná edice',
      'Předobjednávky spuštěny',
    ],
    ctas: ['Prohlédnout', 'Předobjednat', 'Zjistit více'],
    tags: ['novinka', 'produkt', 'launch'],
    popularity: 4,
    isNew: true,
  },
  {
    id: 'ecommerce-free-shipping',
    name: 'Doprava zdarma',
    description: 'Akce na dopravu',
    industry: 'E-commerce',
    icon: ShoppingBag,
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Doprava ZDARMA',
      'Neplaťte za dopravu',
      'Free shipping na vše',
    ],
    subheadlines: [
      'Na všechny objednávky',
      'Při nákupu nad {AMOUNT} Kč',
      'Do konce týdne',
    ],
    ctas: ['Nakoupit', 'Zobrazit produkty'],
    tags: ['doprava', 'shipping', 'zdarma'],
    popularity: 4,
  },

  // FOOD & RESTAURANT
  {
    id: 'food-restaurant',
    name: 'Restaurace',
    description: 'Pro restaurace a kavárny',
    industry: 'Food & Restaurant',
    icon: Utensils,
    colors: {
      primary: '#dc2626',
      secondary: '#f97316',
      accent: '#fef3c7',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Ochutnejte {DISH}',
      'Denní menu od {PRICE} Kč',
      'Rezervujte stůl',
      'Nové menu je tu!',
    ],
    subheadlines: [
      'Čerstvé ingredience každý den',
      'Rodinná atmosféra',
      'Otevřeno denně',
    ],
    ctas: ['Rezervovat', 'Zobrazit menu', 'Objednat'],
    tags: ['restaurace', 'jídlo', 'menu'],
    popularity: 4,
  },
  {
    id: 'food-delivery',
    name: 'Rozvoz jídla',
    description: 'Pro delivery služby',
    industry: 'Food & Restaurant',
    icon: Utensils,
    colors: {
      primary: '#f97316',
      secondary: '#84cc16',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Jídlo až k vám domů',
      'Rozvoz do 30 minut',
      'Objednejte online',
    ],
    subheadlines: [
      'První objednávka se slevou {X}%',
      'Rozvoz zdarma',
      'Otevřeno do {TIME}',
    ],
    ctas: ['Objednat', 'Zobrazit menu', 'Stáhnout appku'],
    tags: ['delivery', 'rozvoz', 'jídlo'],
    popularity: 5,
  },

  // REAL ESTATE
  {
    id: 'realestate-sale',
    name: 'Prodej nemovitosti',
    description: 'Pro realitní kanceláře',
    industry: 'Real Estate',
    icon: Home,
    colors: {
      primary: '#1e40af',
      secondary: '#0ea5e9',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Byt {ROOMS}+kk, {LOCATION}',
      'Novostavba {LOCATION}',
      'Rodinný dům na prodej',
      'Investiční příležitost',
    ],
    subheadlines: [
      'Od {PRICE} Kč',
      '{SIZE} m² • {LOCATION}',
      'Ihned k nastěhování',
    ],
    ctas: ['Prohlídka', 'Více info', 'Kontaktovat'],
    tags: ['reality', 'byt', 'dům', 'prodej'],
    popularity: 4,
  },

  // AUTOMOTIVE
  {
    id: 'auto-sale',
    name: 'Prodej aut',
    description: 'Pro autobazary a dealery',
    industry: 'Automotive',
    icon: Car,
    colors: {
      primary: '#1f2937',
      secondary: '#ef4444',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      '{BRAND} {MODEL} skladem',
      'Akční ceny vozů',
      'Nové {BRAND} od {PRICE} Kč',
    ],
    subheadlines: [
      'Financování na splátky',
      'Prověřená ojetina',
      'Záruka {X} měsíců',
    ],
    ctas: ['Prohlédnout', 'Zkušební jízda', 'Konfigurovat'],
    tags: ['auto', 'ojetina', 'dealer'],
    popularity: 3,
  },
  {
    id: 'auto-service',
    name: 'Autoservis',
    description: 'Pro servisy a pneuservisy',
    industry: 'Automotive',
    icon: Car,
    colors: {
      primary: '#0891b2',
      secondary: '#fbbf24',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Servis za {X} Kč',
      'Přezutí pneumatik',
      'STK + emise',
    ],
    subheadlines: [
      'Bez objednání',
      'Express servis',
      'Originální díly',
    ],
    ctas: ['Objednat', 'Ceník', 'Rezervovat'],
    tags: ['servis', 'STK', 'pneumatiky'],
    popularity: 3,
  },

  // TRAVEL
  {
    id: 'travel-vacation',
    name: 'Dovolená',
    description: 'Pro cestovní kanceláře',
    industry: 'Travel',
    icon: Plane,
    colors: {
      primary: '#0ea5e9',
      secondary: '#f97316',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      '{DESTINATION} od {PRICE} Kč',
      'Last minute {DESTINATION}',
      'Letní dovolená 2025',
      'All inclusive {DESTINATION}',
    ],
    subheadlines: [
      '{DAYS} dní / {NIGHTS} nocí',
      'Včetně letů a transferů',
      'Sleva pro děti',
    ],
    ctas: ['Rezervovat', 'Zobrazit', 'Kalkulace'],
    tags: ['dovolená', 'cestování', 'zájezd'],
    popularity: 5,
    isNew: true,
  },

  // HEALTH & BEAUTY
  {
    id: 'beauty-salon',
    name: 'Kosmetický salon',
    description: 'Pro salony a wellness',
    industry: 'Health & Beauty',
    icon: Heart,
    colors: {
      primary: '#ec4899',
      secondary: '#a855f7',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Relaxace pro tělo i duši',
      'Nová já za {X} minut',
      'Beauty balíček',
    ],
    subheadlines: [
      'První návštěva se slevou',
      'Prémiová péče',
      'Online rezervace',
    ],
    ctas: ['Rezervovat', 'Ceník', 'Dárkový poukaz'],
    tags: ['kosmetika', 'wellness', 'masáže'],
    popularity: 4,
  },

  // B2B / SAAS
  {
    id: 'saas-trial',
    name: 'SaaS Trial',
    description: 'Pro software a appky',
    industry: 'Technology',
    icon: Smartphone,
    colors: {
      primary: '#6366f1',
      secondary: '#06b6d4',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Vyzkoušejte {PRODUCT} zdarma',
      'Automatizujte {TASK}',
      '{X}x rychlejší s {PRODUCT}',
    ],
    subheadlines: [
      '{DAYS} dní zdarma',
      'Bez kreditní karty',
      'Setup za 5 minut',
    ],
    ctas: ['Vyzkoušet', 'Demo', 'Začít zdarma'],
    tags: ['software', 'SaaS', 'trial', 'B2B'],
    popularity: 4,
  },
  {
    id: 'b2b-webinar',
    name: 'Webinář',
    description: 'Pro B2B eventy',
    industry: 'Technology',
    icon: Briefcase,
    colors: {
      primary: '#0f766e',
      secondary: '#0284c7',
      accent: '#ffffff',
      textLight: '#ffffff',
      textDark: '#1a1a1a',
    },
    headlines: [
      'Webinář: {TOPIC}',
      'Naučte se {SKILL}',
      'Expert insights',
    ],
    subheadlines: [
      '{DATE} v {TIME}',
      'Registrace zdarma',
      'Q&A session included',
    ],
    ctas: ['Registrovat', 'Přihlásit se', 'Rezervovat místo'],
    tags: ['webinář', 'B2B', 'vzdělávání'],
    popularity: 3,
  },
]

const INDUSTRIES = [
  { id: 'all', name: 'Vše', icon: LayoutTemplate },
  { id: 'E-commerce', name: 'E-commerce', icon: ShoppingBag },
  { id: 'Food & Restaurant', name: 'Restaurace', icon: Utensils },
  { id: 'Real Estate', name: 'Reality', icon: Home },
  { id: 'Automotive', name: 'Automotive', icon: Car },
  { id: 'Travel', name: 'Cestování', icon: Plane },
  { id: 'Health & Beauty', name: 'Krása', icon: Heart },
  { id: 'Technology', name: 'Tech', icon: Smartphone },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TemplateLibrary({ onApply, onClose }: TemplateLibraryProps) {
  const { setTextOverlay, addBrandKit, setBrandKits, brandKits } = useAppStore()

  const [search, setSearch] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))

      const matchesIndustry = selectedIndustry === 'all' || t.industry === selectedIndustry

      return matchesSearch && matchesIndustry
    }).sort((a, b) => b.popularity - a.popularity)
  }, [search, selectedIndustry])

  // Apply template
  const handleApply = (template: Template) => {
    // Apply text overlay
    setTextOverlay({
      enabled: true,
      headline: template.headlines[0].replace(/{[^}]+}/g, '___'),
      subheadline: template.subheadlines[0].replace(/{[^}]+}/g, '___'),
      cta: template.ctas[0],
      ctaColor: template.colors.primary,
    })

    onApply?.(template)
    onClose?.()
  }

  // Create brand kit from template
  const handleCreateBrandKit = (template: Template) => {
    const newKit = {
      id: generateId(),
      name: `${template.name} Kit`,
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      textLight: template.colors.textLight,
      textDark: template.colors.textDark,
      headlineTemplates: template.headlines,
      ctaTemplates: template.ctas,
      logoRules: { autoApply: false, position: 'bottom-right', size: 12, padding: 20, opacity: 100, autoSelectVariant: true },
      isDefault: false,
      createdAt: new Date(),
    }

    addBrandKit(newKit)
    alert(`Brand Kit "${newKit.name}" byl vytvořen!`)
  }

  return (
    <div className="bg-[#0F1115]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Knihovna šablon</h3>
              <p className="text-sm text-white/50">{TEMPLATES.length} profesionálních šablon</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10">×</Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat šablony..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Industry tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {INDUSTRIES.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedIndustry(id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                selectedIndustry === id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
              )}
            >
              <Icon className="w-4 h-4" />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedTemplate ? (
          // Template Detail
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTemplate(null)}
              className="mb-4 text-white/50 hover:text-white hover:bg-white/10"
            >
              ← Zpět na seznam
            </Button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <div
                className="aspect-video rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: selectedTemplate.colors.secondary }}
              >
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTemplate.colors.primary} 0%, ${selectedTemplate.colors.secondary} 100%)`
                  }}
                />
                <div className="relative z-10 text-center p-8">
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: selectedTemplate.colors.textLight }}
                  >
                    {selectedTemplate.headlines[0].replace(/{[^}]+}/g, '___')}
                  </h2>
                  <p
                    className="text-sm mb-4 opacity-90"
                    style={{ color: selectedTemplate.colors.textLight }}
                  >
                    {selectedTemplate.subheadlines[0].replace(/{[^}]+}/g, '___')}
                  </p>
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: selectedTemplate.colors.primary,
                      color: selectedTemplate.colors.textLight
                    }}
                  >
                    {selectedTemplate.ctas[0]}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <selectedTemplate.icon className="w-5 h-5 text-white/40" />
                  <span className="text-sm text-white/50">{selectedTemplate.industry}</span>
                  {selectedTemplate.isNew && <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-0">Novinka</Badge>}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{selectedTemplate.name}</h3>
                <p className="text-white/60 mb-4">{selectedTemplate.description}</p>

                {/* Colors */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white/70 mb-2">Barvy</h4>
                  <div className="flex gap-2">
                    {Object.entries(selectedTemplate.colors).slice(0, 3).map(([key, color]) => (
                      <div key={key} className="text-center">
                        <div
                          className="w-10 h-10 rounded-lg border border-white/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-white/40 mt-1 block">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Headlines */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white/70 mb-2">Headlines</h4>
                  <div className="space-y-1">
                    {selectedTemplate.headlines.map((h, i) => (
                      <p key={i} className="text-sm text-white/60">• {h}</p>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white/70 mb-2">CTA varianty</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.ctas.map((cta, i) => (
                      <Badge key={i} variant="outline" className="border-white/10 text-white/60">{cta}</Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApply(selectedTemplate)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/25"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Použít šablonu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateBrandKit(selectedTemplate)}
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Vytvořit Brand Kit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Template Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-white/10 bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 transition-all cursor-pointer group"
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Preview */}
                <div
                  className="aspect-video relative"
                  style={{
                    background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="text-center">
                      <p
                        className="font-bold text-lg drop-shadow-md"
                        style={{ color: template.colors.textLight }}
                      >
                        {template.headlines[0].replace(/{[^}]+}/g, '...')}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {template.isNew && (
                      <Badge className="bg-emerald-500 text-white border-0 shadow-sm">Nové</Badge>
                    )}
                    {template.isPremium && (
                      <Badge className="bg-amber-500 text-white border-0 shadow-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button variant="secondary" size="sm" className="bg-white text-black hover:bg-white/90">
                      <Eye className="w-4 h-4 mr-2" />
                      Zobrazit
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <template.icon className="w-4 h-4 text-white/40" />
                      <span className="text-xs text-white/50">{template.industry}</span>
                    </div>
                    <div className="flex">
                      {[...Array(template.popularity)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <h4 className="font-semibold text-white">{template.name}</h4>
                  <p className="text-sm text-white/50 line-clamp-1">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && !selectedTemplate && (
          <div className="text-center py-12">
            <LayoutTemplate className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Žádné šablony neodpovídají vašemu hledání</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplateLibrary
