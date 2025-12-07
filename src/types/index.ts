// ============================================================================
// PLATFORM & FORMAT TYPES
// ============================================================================

export type PlatformId = 'sklik' | 'google'
export type FormatType = 'image' | 'html5' | 'video'
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '1.91:1' | '4:1'

export interface SafeZone {
  x: number
  y: number
  width: number
  height: number
  description: string
}

export interface Format {
  id: string
  width: number
  height: number
  name: string
  type: FormatType
  maxSizeKB: number
  safeZone?: SafeZone
  isRecommended?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  formats: Format[]
}

export interface Platform {
  id: PlatformId
  name: string
  icon: string
  categories: Record<string, Category>
}

// ============================================================================
// CREATIVE TYPES
// ============================================================================

export interface TextOverlay {
  headline: string
  subheadline: string
  cta: string
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  showHeadline: boolean
  showSubheadline: boolean
  showCta: boolean
}

export interface FormatSettings {
  formatId: string
  cropX: number
  cropY: number
  cropScale: number
  textOverlay: TextOverlay
  logoVisible: boolean
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  logoScale: number
}

export interface Creative {
  id: string
  formatId: string
  platform: PlatformId
  imageUrl: string
  settings: FormatSettings
  validated: boolean
  errors: string[]
  warnings: string[]
  fileSizeKB: number
}

// ============================================================================
// BRAND KIT
// ============================================================================

export interface BrandKit {
  logo: string | null
  logoDark: string | null
  logoLight: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  tagline: string
  description: string
  sourceUrl: string | null
}

// ============================================================================
// VIDEO
// ============================================================================

export interface VideoSettings {
  duration: 6 | 15 | 30
  aspectRatio: '16:9' | '9:16' | '1:1'
  tier: 'slideshow' | 'sora'
  prompt: string
  kenBurns: boolean
}

// ============================================================================
// HTML5 TEMPLATE
// ============================================================================

export type Html5Template = 'fade-in' | 'slide-up' | 'pulse-cta' | 'zoom-in' | 'bounce'

export interface Html5Settings {
  template: Html5Template
  animationDuration: number
  loop: boolean
}

// ============================================================================
// APP STATE
// ============================================================================

export interface AppState {
  // API
  apiKey: string
  setApiKey: (key: string) => void
  
  // Source
  sourceImage: string | null
  setSourceImage: (url: string | null) => void
  sourcePrompt: string
  setSourcePrompt: (prompt: string) => void
  
  // Platform & Formats
  activePlatform: PlatformId | 'all'
  setActivePlatform: (platform: PlatformId | 'all') => void
  selectedFormats: Set<string>
  toggleFormat: (formatId: string) => void
  selectRecommended: () => void
  clearSelection: () => void
  
  // Brand Kit
  brandKit: BrandKit
  setBrandKit: (kit: Partial<BrandKit>) => void
  
  // Text (global default)
  defaultText: TextOverlay
  setDefaultText: (text: Partial<TextOverlay>) => void
  
  // Per-format settings
  formatSettings: Record<string, FormatSettings>
  setFormatSettings: (formatId: string, settings: Partial<FormatSettings>) => void
  
  // Creatives
  creatives: Creative[]
  addCreative: (creative: Creative) => void
  updateCreative: (id: string, updates: Partial<Creative>) => void
  clearCreatives: () => void
  
  // Video
  videoSettings: VideoSettings
  setVideoSettings: (settings: Partial<VideoSettings>) => void
  
  // HTML5
  html5Settings: Html5Settings
  setHtml5Settings: (settings: Partial<Html5Settings>) => void
  
  // UI State
  isGenerating: boolean
  setIsGenerating: (val: boolean) => void
  progress: number
  setProgress: (val: number) => void
  activeTab: 'input' | 'formats' | 'editor' | 'export'
  setActiveTab: (tab: 'input' | 'formats' | 'editor' | 'export') => void
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface GenerateImageResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

export interface BrandExtractResponse {
  success: boolean
  brandKit?: Partial<BrandKit>
  error?: string
}

export interface AnalyzeResponse {
  success: boolean
  analysis?: {
    style: string
    colors: string[]
    fonts: string
    cta: string
    recommendations: string[]
  }
  error?: string
}
