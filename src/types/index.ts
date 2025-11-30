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
 * Vygenerovaná kreativa
 */
export interface Creative {
  id: string
  formatKey: string
  platform: PlatformId
  category: string
  format: Format
  imageUrl: string
  createdAt: Date
  variant?: 'A' | 'B' | 'C'
  sourceVariantId?: string
  // Skutečná velikost v kB
  sizeKB?: number
  // Je HTML5?
  isHTML5?: boolean
  html5Content?: string
  // Prošla validací?
  isValid?: boolean
  validationErrors?: string[]
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
  // Loga
  logoSquare?: string      // 1:1
  logoHorizontal?: string  // 4:1
  // Barvy
  primaryColor: string
  secondaryColor: string
  ctaColor: string
  textColor: string
  backgroundColor: string
  // Fonty
  headlineFont?: string
  bodyFont?: string
  // Metadata
  createdAt: Date
  isDefault: boolean
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
  setPrompt: (prompt: string) => void
  setSourceFormat: (format: 'landscape' | 'square' | 'portrait') => void
  setSourceImage: (image: string | null) => void
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
  clearCreatives: () => void
  
  // Text Overlay
  textOverlay: TextOverlay
  setTextOverlay: (overlay: Partial<TextOverlay>) => void
  
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
