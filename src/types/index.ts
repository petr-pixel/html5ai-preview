// ============================================================================
// FORMATS
// ============================================================================

export type Platform = 'sklik' | 'google'

export type FormatType = 'image' | 'html5' | 'video'

export interface SafeZone {
  x: number
  y: number
  width: number
  height: number
  description: string
}

export interface Format {
  id: string
  name: string
  width: number
  height: number
  type: FormatType
  platform: Platform
  category: string
  maxSizeKB: number
  safeZone?: SafeZone
  recommended?: boolean
}

export interface FormatCategory {
  id: string
  name: string
  platform: Platform
  formats: Format[]
}

// ============================================================================
// BRAND KIT
// ============================================================================

export interface BrandKit {
  id: string
  name: string
  logo?: string
  favicon?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fonts: {
    heading: string
    body: string
  }
  toneOfVoice?: string
  tagline?: string
  description?: string
}

// ============================================================================
// TEXT OVERLAY
// ============================================================================

export type TextPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'center' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

export interface TextOverlay {
  headline: string
  subheadline: string
  cta: string
  showHeadline: boolean
  showSubheadline: boolean
  showCta: boolean
  position: TextPosition
  fontFamily: string
  headlineSize: number
  headlineColor: string
  headlineBackground: string
  ctaColor: string
  ctaBackground: string
}

// ============================================================================
// CREATIVE SETTINGS
// ============================================================================

export interface CreativeSettings {
  cropX: number
  cropY: number
  cropScale: number
  logoVisible: boolean
  logoPosition: TextPosition
  logoScale: number
  textOverlay?: Partial<TextOverlay>
  filters?: {
    brightness: number
    contrast: number
    saturation: number
  }
}

// ============================================================================
// HTML5 SETTINGS
// ============================================================================

export type Html5Template = 
  | 'fade-in' 
  | 'slide-up' 
  | 'slide-left' 
  | 'zoom-in' 
  | 'bounce' 
  | 'pulse-cta'

export interface Html5Settings {
  template: Html5Template
  animationDuration: number
  loop: boolean
  clickTagUrl: string
}

// ============================================================================
// VIDEO SETTINGS
// ============================================================================

export type VideoTier = 'slideshow' | 'sora'
export type VideoAspectRatio = '16:9' | '9:16' | '1:1'
export type VideoDuration = 5 | 10 | 15 | 20

export interface VideoSettings {
  tier: VideoTier
  aspectRatio: VideoAspectRatio
  duration: VideoDuration
  prompt: string
  kenBurns: boolean
  transitions: boolean
  musicTrack?: string
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Creative {
  id: string
  formatId: string
  imageUrl?: string
  videoUrl?: string
  html5Files?: Record<string, string>
  settings: CreativeSettings
  textOverlay: TextOverlay
  generated: boolean
  validated: boolean
  validationErrors: string[]
  fileSize?: number
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  sourceImage?: string
  sourcePrompt?: string
  brandKit: BrandKit
  defaultText: TextOverlay
  selectedFormats: string[]
  creatives: Record<string, Creative>
  html5Settings: Html5Settings
  videoSettings: VideoSettings
}

// ============================================================================
// AI ANALYSIS
// ============================================================================

export interface CompetitorAnalysis {
  url: string
  screenshot?: string
  colors: string[]
  fonts: string[]
  ctas: string[]
  headlines: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  overallScore: number
}

export interface QualityScore {
  overall: number
  composition: number
  colorHarmony: number
  textReadability: number
  ctaVisibility: number
  brandConsistency: number
  recommendations: string[]
}

export interface SmartCropResult {
  focusX: number
  focusY: number
  confidence: number
  detectedObjects: Array<{
    type: string
    x: number
    y: number
    width: number
    height: number
  }>
}

// ============================================================================
// EXPORT
// ============================================================================

export interface ExportOptions {
  includeImages: boolean
  includeHtml5: boolean
  includeVideos: boolean
  includeCSV: boolean
  csvPlatform: Platform | 'both'
  optimizeFileSize: boolean
  folderStructure: 'platform' | 'format' | 'flat'
}

export interface ValidationResult {
  formatId: string
  valid: boolean
  errors: string[]
  warnings: string[]
  fileSize: number
  suggestions: string[]
}
