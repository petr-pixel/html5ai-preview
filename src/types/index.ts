/**
 * AdCreative Studio - Typy
 * 
 * Definice typů podle oficiální dokumentace:
 * - Sklik: https://napoveda.sklik.cz/reklamy/
 * - Google Ads: https://support.google.com/google-ads/answer/13676244
 */

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type PlatformId = 'sklik' | 'google'

/**
 * Typ kategorie - určuje jaké editory zobrazit
 * - image: Standardní bannery (Smart Crop, Text Overlay)
 * - branding: Formáty se Safe Zone (bez Smart Crop)
 * - video: Video formáty (Video Editor)
 * - html5: HTML5 bannery
 */
export type CategoryType = 'image' | 'branding' | 'video' | 'html5'

/**
 * Safe Zone definice pro bannery s ochrannou zónou
 * Jednotky jsou v pixelech
 */
export interface SafeZone {
  top: number
  right: number
  bottom: number
  left: number
  // Šířka střední "content" zóny (např. u Brandingu - obsah webu)
  centerWidth?: number
  // Výška hlavní viditelné oblasti
  visibleHeight?: number
  // Popis zóny pro UI
  description?: string
}

/**
 * Formát banneru/obrázku
 */
export interface Format {
  width: number
  height: number
  name: string
  ratio?: string
  isVideo?: boolean
  // Safe zone pro formáty s ochrannou zónou (Branding, Interscroller)
  safeZone?: SafeZone
  // Minimální rozměry (pro responsive formáty)
  minWidth?: number
  minHeight?: number
  // Doporučené rozměry
  recommendedWidth?: number
  recommendedHeight?: number
  // Speciální poznámky
  notes?: string
}

/**
 * Kategorie formátů
 */
export interface Category {
  id: string
  name: string
  description: string
  icon: string
  formats: Format[]
  // TYP KATEGORIE - určuje jaké editory zobrazit
  type: CategoryType
  // Maximální velikost souboru v kB
  maxSizeKB: number
  // Povolené typy souborů
  fileTypes: string[]
  // Je to HTML5 kategorie?
  isHTML5?: boolean
  // Je to P-Max kategorie?
  isPMax?: boolean
  // Doporučené CPT (pro Branding/Interscroller)
  recommendedCPT?: { min: number; max: number }
  // Zdroj dokumentace
  docsUrl?: string
}

/**
 * Platforma (Sklik nebo Google)
 */
export interface Platform {
  id: PlatformId
  name: string
  icon: string
  color: string
  categories: Record<string, Category>
}

// ============================================================================
// CROP & LAYOUT TYPES
// ============================================================================

/**
 * Nastavení cropu pro konkrétní formát
 */
export interface CropSettings {
  x: number
  y: number
  width: number
  height: number
  // Focus point (0-1, kde 0.5 je střed)
  focusX: number
  focusY: number
}

/**
 * Zdrojový obrázek varianta (pro multi-variace)
 */
export interface SourceImageVariant {
  id: string
  imageUrl: string
  prompt: string
  createdAt: Date
  isActive: boolean
}

// ============================================================================
// CREATIVE TYPES
// ============================================================================

/**
 * Výstupní typ formátu
 */
export type OutputType = 'static' | 'html5'

/**
 * Nastavení výstupu pro konkrétní formát
 */
export interface FormatOutputSettings {
  formatKey: string
  outputType: OutputType
  html5Template?: 'static' | 'fade-in' | 'slide-up' | 'ken-burns' | 'pulse-cta'
  cropSettings?: CropSettings
}

/**
 * Per-format text override - umožňuje jemné doladění textu pro každý formát
 */
export interface PerFormatTextSettings {
  fontSizeMultiplier: number  // 0.5 - 2.0, default 1.0
  hideHeadline?: boolean
  hideSubheadline?: boolean
  hideCta?: boolean
  customPosition?: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

/**
 * Vygenerovaná kreativa
 */
export interface Creative {
  id: string
  formatKey: string
  platform: PlatformId
  category: string
  format: Format
  
  // === NOVÝ SYSTÉM: Oddělené vrstvy ===
  baseImageUrl: string           // Obrázek BEZ textu
  textLayer?: TextLayer          // Textová vrstva (editovatelná per-formát)
  
  // === Legacy (pro zpětnou kompatibilitu) ===
  imageUrl: string               // Finální renderovaný obrázek (s textem)
  
  createdAt: Date
  variant?: 'A' | 'B' | 'C'
  sourceVariantId?: string
  // Skutečná velikost v kB
  sizeKB?: number
  // Je HTML5?
  isHTML5?: boolean
  html5Content?: string
  // Je Video?
  isVideo?: boolean
  videoUrl?: string
  videoDuration?: number // v sekundách
  // Prošla validací?
  isValid?: boolean
  validationErrors?: string[]
  // Je to zdrojový AI obrázek?
  isSource?: boolean
  prompt?: string
}

// ============================================================================
// TEXT OVERLAY & BRANDING
// ============================================================================

export interface TextOverlay {
  enabled: boolean
  headline: string
  subheadline: string
  cta: string
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  ctaColor: string
  fontSize: 'small' | 'medium' | 'large'
}

// ============================================================================
// TEXT LAYER SYSTEM (nový systém pro per-formát editaci)
// ============================================================================

/**
 * Pozice a styl jednoho textového prvku
 * Všechny pozice jsou v % (0-100) relativně k rozměrům formátu
 */
export interface TextElement {
  text: string
  visible: boolean
  x: number           // % od levého okraje
  y: number           // % od horního okraje
  fontSize: number    // px
  fontWeight: 'normal' | 'bold'
  color: string
  textAlign: 'left' | 'center' | 'right'
  maxWidth: number    // % šířky formátu
  shadow: boolean
}

export interface CTAElement extends TextElement {
  backgroundColor: string
  paddingX: number    // px
  paddingY: number    // px
  borderRadius: number // px
}

export interface LogoElement {
  visible: boolean
  x: number           // % od levého okraje
  y: number           // % od horního okraje
  width: number       // % šířky formátu
  opacity: number     // 0-1
  variant: 'main' | 'light' | 'dark' | 'auto'
}

/**
 * Kompletní textová vrstva pro jeden formát
 * Oddělená od obrázku = lze editovat nezávisle
 */
export interface TextLayer {
  headline: TextElement
  subheadline: TextElement
  cta: CTAElement
  logo: LogoElement
}

/**
 * Default pozice podle aspect ratio formátu
 */
export type LayoutPreset = 'auto' | 'bottom-left' | 'bottom-center' | 'center' | 'top-left' | 'left-stack' | 'right-stack'

export interface Watermark {
  enabled: boolean
  image: string | null
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number
  size: number
}

export interface QRCode {
  enabled: boolean
  url: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: number
  margin: number
}

// ============================================================================
// BRAND KIT
// ============================================================================

export interface BrandKit {
  id: string
  name: string
  
  // ===== LOGA =====
  logoMain?: string           // Hlavní logo (PNG s průhledností)
  logoLight?: string          // Světlá verze (pro tmavé pozadí)
  logoDark?: string           // Tmavá verze (pro světlé pozadí)
  // Deprecated - pro zpětnou kompatibilitu
  logoSquare?: string
  logoHorizontal?: string
  
  // ===== BARVY =====
  primaryColor: string        // Hlavní barva (CTA, akcenty)
  secondaryColor: string      // Sekundární (pozadí textů, rámečky)
  textLight: string           // Text na tmavém pozadí (#FFFFFF)
  textDark: string            // Text na světlém pozadí (#1A1A1A)
  // Deprecated
  ctaColor?: string
  textColor?: string
  backgroundColor?: string
  
  // ===== TEXTOVÉ ŠABLONY =====
  headlineTemplates: string[]  // ["Objevte {produkt}", "Sleva {sleva}%", ...]
  ctaTemplates: string[]       // ["Koupit nyní", "Zjistit více", ...]
  tagline?: string             // Firemní slogan
  
  // ===== PRAVIDLA LOGA =====
  logoRules: {
    autoApply: boolean         // Automaticky přidávat na kreativy
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    size: number               // % šířky kreativy (5-30)
    padding: number            // Padding od okraje v px
    opacity: number            // 0-100
    autoSelectVariant: boolean // Automaticky vybrat light/dark podle pozadí
  }
  
  // ===== FONTY =====
  headlineFont?: string
  bodyFont?: string
  
  // ===== METADATA =====
  createdAt: Date
  updatedAt?: Date
  isDefault: boolean
  
  // Deprecated
  defaultCTA?: Record<string, string>
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  // Defaultní texty pro různé jazyky
  headlines: Record<string, string[]>      // { cs: ["Sleva %X%", "Akce %X%"], sk: [...] }
  subheadlines: Record<string, string[]>   // { cs: ["Platí do %DATE%"], sk: [...] }
  ctas: Record<string, string[]>           // { cs: ["Nakoupit", "Zobrazit"], sk: [...] }
  // Proměnné které se doplňují
  variables: string[]                       // ["X", "DATE", "PRODUCT"]
  // Doporučené formáty
  recommendedFormats: {
    google: string[]   // ["banners", "pmax"]
    sklik: string[]    // ["banners", "kombinovana"]
  }
  // Default landing page pattern
  defaultUrlPattern?: string  // "/sale/" nebo "/akce/"
  // Kategorie šablony
  category: 'sale' | 'new_collection' | 'brand' | 'seasonal' | 'custom'
}

// ============================================================================
// VIDEO SCENARIO
// ============================================================================

export interface VideoScenario {
  campaignType: 'pmax' | 'youtube_bumper' | 'youtube_instream' | 'sklik_outstream' | 'demand_gen'
  lengthSeconds: 6 | 10 | 15 | 20 | 30
  aspectRatio: '16:9' | '1:1' | '9:16'
  language: string
  style: 'realistic' | 'motion_graphics' | 'ugc' | 'illustration'
  hook: string
  body: string
  proof: string
  cta: string
  voiceoverText: string
  subtitles: boolean
  fromImage: boolean
}

// ============================================================================
// A/B TESTING
// ============================================================================

export interface ABVariant {
  id: 'A' | 'B' | 'C'
  headline: string
  subheadline: string
  cta: string
  ctaColor: string
}

// ============================================================================
// HISTORY
// ============================================================================

export interface HistoryItem {
  id: string
  prompt: string
  sourceImage: string
  sourceVariants?: SourceImageVariant[]
  creatives: Creative[]
  textOverlay: TextOverlay
  watermark: Watermark
  qrCode: QRCode
  createdAt: Date
  platform: PlatformId
}

// ============================================================================
// API & SETTINGS
// ============================================================================

export interface ApiKeys {
  openai: string
}

export type ModelTier = 'cheap' | 'standard' | 'best'

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'size_exceeded' | 'dimension_mismatch' | 'safe_zone_violation' | 'missing_text' | 'invalid_format'
  formatKey: string
  message: string
  details?: string
}

export interface ValidationWarning {
  type: 'size_near_limit' | 'low_quality' | 'text_truncated'
  formatKey: string
  message: string
  details?: string
}

// ============================================================================
// STORE STATE
// ============================================================================

export interface AppState {
  // Platform & Category
  platform: PlatformId
  category: string
  setPlatform: (platform: PlatformId) => void
  setCategory: (category: string) => void
  
  // Source
  prompt: string
  sourceFormat: 'landscape' | 'square' | 'portrait'
  sourceImage: string | null
  sourceVariants: SourceImageVariant[]
  activeSourceVariant: string | null
  cropMode: 'smart' | 'fit'
  formatOffsets: Record<string, { x: number; y: number }>  // Per-format posun obrázku v procentech (-50 až 50)
  setPrompt: (prompt: string) => void
  setSourceFormat: (format: 'landscape' | 'square' | 'portrait') => void
  setSourceImage: (image: string | null) => void
  setCropMode: (mode: 'smart' | 'fit') => void
  setFormatOffset: (formatKey: string, offset: { x: number; y: number }) => void
  resetFormatOffsets: () => void
  setSourceVariants: (variants: SourceImageVariant[]) => void
  addSourceVariant: (variant: SourceImageVariant) => void
  setActiveSourceVariant: (id: string | null) => void
  
  // Format output settings (per-format crop, HTML5 toggle)
  formatOutputSettings: Record<string, FormatOutputSettings>
  setFormatOutputSettings: (key: string, settings: Partial<FormatOutputSettings>) => void
  
  // Selection
  selectedFormats: Set<string>
  toggleFormat: (key: string) => void
  selectAllFormats: (keys: string[]) => void
  clearSelection: () => void
  
  // Creatives
  creatives: Record<string, Creative>
  addCreatives: (creatives: Creative[]) => void
  deleteCreative: (id: string) => void
  deleteCreatives: (ids: string[]) => void
  clearCreatives: () => void
  setCreatives: (creatives: Record<string, Creative>) => void
  
  // Text Overlay
  textOverlay: TextOverlay
  setTextOverlay: (overlay: Partial<TextOverlay>) => void
  
  // Per-format text settings
  perFormatTextSettings: Record<string, PerFormatTextSettings>
  setPerFormatTextSettings: (formatKey: string, settings: Partial<PerFormatTextSettings>) => void
  resetPerFormatTextSettings: () => void
  
  // Outpainted images per format
  outpaintedImages: Record<string, string>
  setOutpaintedImage: (formatKey: string, imageUrl: string) => void
  clearOutpaintedImage: (formatKey: string) => void
  clearAllOutpaintedImages: () => void
  
  // Watermark
  watermark: Watermark
  setWatermark: (watermark: Partial<Watermark>) => void
  
  // QR Code
  qrCode: QRCode
  setQRCode: (qrCode: Partial<QRCode>) => void
  
  // Video Scenario
  videoScenario: VideoScenario
  setVideoScenario: (scenario: Partial<VideoScenario>) => void
  
  // A/B Testing
  abVariants: ABVariant[]
  activeVariant: 'A' | 'B' | 'C'
  setABVariants: (variants: ABVariant[]) => void
  setActiveVariant: (variant: 'A' | 'B' | 'C') => void
  
  // Brand Kit
  brandKits: BrandKit[]
  activeBrandKit: string | null
  setBrandKits: (kits: BrandKit[]) => void
  addBrandKit: (kit: BrandKit) => void
  setActiveBrandKit: (id: string | null) => void
  
  // History
  history: HistoryItem[]
  addToHistory: (item: HistoryItem) => void
  clearHistory: () => void
  loadFromHistory: (item: HistoryItem) => void
  
  // Model tiers
  textModelTier: ModelTier
  imageModelTier: ModelTier
  videoModelTier: ModelTier
  setTextModelTier: (tier: ModelTier) => void
  setImageModelTier: (tier: ModelTier) => void
  setVideoModelTier: (tier: ModelTier) => void
  
  // API Keys
  apiKeys: ApiKeys
  setApiKeys: (keys: Partial<ApiKeys>) => void
  
  // UI State
  isGenerating: boolean
  progress: number
  activeView: 'create' | 'preview' | 'video' | 'history' | 'gallery'
  setIsGenerating: (isGenerating: boolean) => void
  setProgress: (progress: number) => void
  setActiveView: (view: 'create' | 'preview' | 'video' | 'history' | 'gallery') => void
}
