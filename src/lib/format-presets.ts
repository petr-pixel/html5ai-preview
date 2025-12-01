/**
 * AdCreative Studio - Format Presets & Validator
 * 
 * Kompletní definice formátů pro Google Ads a Sklik
 * včetně všech pravidel, limitů a validace.
 * 
 * ZDROJE (AKTUALIZOVÁNO 2025):
 * 
 * SKLIK:
 * - Bannery: https://napoveda.sklik.cz/pravidla/bannery/
 * - Přehled formátů: https://napoveda.sklik.cz/reklamy/bannery/prehled-podporovanych-formatu-bannerove-reklamy/
 * - HTML5: https://napoveda.sklik.cz/pravidla/html5-bannery/
 * - Branding: https://napoveda.sklik.cz/pravidla/branding/
 * - Kombinovaná: https://napoveda.sklik.cz/pravidla/kombinovana-reklama/
 * 
 * GOOGLE ADS:
 * - Display specs: https://support.google.com/google-ads/answer/1722096
 * - All formats: https://support.google.com/google-ads/answer/13676244
 * - PMax: https://developers.google.com/google-ads/api/performance-max/asset-requirements
 * - Demand Gen: https://support.google.com/google-ads/answer/13547298
 * 
 * LAST UPDATED: 2025-05-30
 */

// ============================================================================
// TYPES
// ============================================================================

export type PlatformType = 'google' | 'sklik'
export type FormatType = 'image' | 'html5' | 'branding' | 'video'

export interface SafeZone {
  x: number      // X offset od levého okraje
  y: number      // Y offset od horního okraje
  width: number  // Šířka safe zone
  height: number // Výška safe zone
  description: string
}

export interface FormatPreset {
  id: string
  platform: PlatformType
  type: FormatType
  width: number
  height: number
  name: string
  category: string  // display, pmax, demandgen, bannery, kombinovana, branding
  
  // Limity
  maxFileSizeKB: number
  allowedFileTypes: string[]
  
  // HTML5 specifické
  maxFilesInZip?: number
  maxFolderDepth?: number
  bannedFunctions?: string[]        // Pro Sklik: window.open, mraid.open, Enabler.exit
  whitelistedCDN?: string[]
  requiresClickTag?: boolean        // Pro Google: musí mít clickTag
  requiresAdSizeMeta?: boolean      // Pro Google: <meta name="ad.size">
  
  // Branding specifické
  safeZone?: SafeZone
  backgroundZoneRules?: string      // Pravidla pro pozadí mimo safe zone
  requiresOpaqueBackground?: boolean
  
  // Extra pravidla
  noTransparency?: boolean          // Sklik bannery nesmí být průhledné
  noVideoTag?: boolean              // Sklik HTML5 nesmí mít <video>
  
  // Doporučené/povinné
  isRequired?: boolean              // Je tento formát povinný?
  isRecommended?: boolean           // Je doporučený?
  minWidth?: number                 // Minimální rozměry
  minHeight?: number
  
  // Metadata
  docsUrl?: string                  // URL na dokumentaci
  notes?: string                    // Poznámky
}

export interface ValidationError {
  type: 'error' | 'warning'
  code: string
  message: string
  details?: string
  autoFixable?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  fileSize?: number
  dimensions?: { width: number; height: number }
}

// ============================================================================
// WHITELISTED CDN (z dokumentace)
// ============================================================================

// Google Ads whitelisted CDN
const GOOGLE_WHITELISTED_CDN = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  's0.2mdn.net',           // Google DoubleClick CDN (CreateJS, GSAP, jQuery)
  'cdnjs.cloudflare.com',
  'ajax.googleapis.com',
  'code.createjs.com',
]

// Sklik whitelisted CDN (z https://napoveda.sklik.cz/pravidla/html5-bannery/)
const SKLIK_WHITELISTED_CDN = [
  'fonts.googleapis.com',
  'code.jquery.com',
  's0.2mdn.net/ads/studio/',
  's1.adform.net',
  'cdn.jsdelivr.net/npm/lottie-web',
  'ajax.googleapis.com/ajax/libs/jquery/',
  'code.createjs.com/createjs',
  'cdnjs.cloudflare.com/ajax/libs/bodymovin/',
  'cdnjs.cloudflare.com/ajax/libs/gsap/',
  'animate.adobe.com/runtime/6.0.0/edge.6.0.0.min.js',
  'cdn.viomba.com/tp.js',
]

// ============================================================================
// BANNED FUNCTIONS (Sklik)
// ============================================================================

const SKLIK_BANNED_FUNCTIONS = [
  'window.open',
  'Enabler.exit',
  'mraid.open',
]

// ============================================================================
// FORMAT PRESETS - GOOGLE ADS
// Zdroj: https://support.google.com/google-ads/answer/1722096
// ============================================================================

export const GOOGLE_DISPLAY_IMAGE_PRESETS: FormatPreset[] = [
  // Square and rectangle
  { id: 'google-display-200x200', platform: 'google', type: 'image', category: 'display', width: 200, height: 200, name: 'Small Square', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-240x400', platform: 'google', type: 'image', category: 'display', width: 240, height: 400, name: 'Vertical Rectangle', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-250x250', platform: 'google', type: 'image', category: 'display', width: 250, height: 250, name: 'Square', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-250x360', platform: 'google', type: 'image', category: 'display', width: 250, height: 360, name: 'Triple Widescreen', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-300x250', platform: 'google', type: 'image', category: 'display', width: 300, height: 250, name: 'Inline Rectangle', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-336x280', platform: 'google', type: 'image', category: 'display', width: 336, height: 280, name: 'Large Rectangle', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-580x400', platform: 'google', type: 'image', category: 'display', width: 580, height: 400, name: 'Netboard', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  
  // Skyscraper
  { id: 'google-display-120x600', platform: 'google', type: 'image', category: 'display', width: 120, height: 600, name: 'Skyscraper', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-160x600', platform: 'google', type: 'image', category: 'display', width: 160, height: 600, name: 'Wide Skyscraper', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-300x600', platform: 'google', type: 'image', category: 'display', width: 300, height: 600, name: 'Half-Page Ad', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-300x1050', platform: 'google', type: 'image', category: 'display', width: 300, height: 1050, name: 'Portrait', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  
  // Leaderboard
  { id: 'google-display-468x60', platform: 'google', type: 'image', category: 'display', width: 468, height: 60, name: 'Banner', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-728x90', platform: 'google', type: 'image', category: 'display', width: 728, height: 90, name: 'Leaderboard', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-930x180', platform: 'google', type: 'image', category: 'display', width: 930, height: 180, name: 'Top Banner', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-970x90', platform: 'google', type: 'image', category: 'display', width: 970, height: 90, name: 'Large Leaderboard', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-970x250', platform: 'google', type: 'image', category: 'display', width: 970, height: 250, name: 'Billboard', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-980x120', platform: 'google', type: 'image', category: 'display', width: 980, height: 120, name: 'Panorama', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  
  // Mobile
  { id: 'google-display-300x50', platform: 'google', type: 'image', category: 'display', width: 300, height: 50, name: 'Mobile Banner', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-320x50', platform: 'google', type: 'image', category: 'display', width: 320, height: 50, name: 'Mobile Banner', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-display-320x100', platform: 'google', type: 'image', category: 'display', width: 320, height: 100, name: 'Large Mobile Banner', maxFileSizeKB: 150, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
]

export const GOOGLE_HTML5_PRESETS: FormatPreset[] = [
  // HTML5 Display - max 600 kB ZIP (stejné rozměry jako image)
  { id: 'google-html5-300x250', platform: 'google', type: 'html5', category: 'display', width: 300, height: 250, name: 'Inline Rectangle', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-336x280', platform: 'google', type: 'html5', category: 'display', width: 336, height: 280, name: 'Large Rectangle', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-728x90', platform: 'google', type: 'html5', category: 'display', width: 728, height: 90, name: 'Leaderboard', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-970x250', platform: 'google', type: 'html5', category: 'display', width: 970, height: 250, name: 'Billboard', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-160x600', platform: 'google', type: 'html5', category: 'display', width: 160, height: 600, name: 'Wide Skyscraper', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-300x600', platform: 'google', type: 'html5', category: 'display', width: 300, height: 600, name: 'Half-Page Ad', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
  { id: 'google-html5-320x100', platform: 'google', type: 'html5', category: 'display', width: 320, height: 100, name: 'Large Mobile Banner', maxFileSizeKB: 600, allowedFileTypes: ['html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg'], maxFilesInZip: 40, requiresClickTag: true, requiresAdSizeMeta: true, whitelistedCDN: GOOGLE_WHITELISTED_CDN, docsUrl: 'https://support.google.com/google-ads/answer/1722096' },
]

// Performance Max - zdroj: https://support.google.com/google-ads/answer/13676244
export const GOOGLE_PMAX_PRESETS: FormatPreset[] = [
  { id: 'google-pmax-1200x628', platform: 'google', type: 'image', category: 'pmax', width: 1200, height: 628, name: 'Landscape 1.91:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 600, minHeight: 314, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 4+ obrázků' },
  { id: 'google-pmax-1200x1200', platform: 'google', type: 'image', category: 'pmax', width: 1200, height: 1200, name: 'Square 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 300, minHeight: 300, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 4+ obrázků' },
  { id: 'google-pmax-960x1200', platform: 'google', type: 'image', category: 'pmax', width: 960, height: 1200, name: 'Portrait 4:5', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 480, minHeight: 600, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 2+ obrázků' },
  // Logo
  { id: 'google-pmax-logo-1200x1200', platform: 'google', type: 'image', category: 'pmax', width: 1200, height: 1200, name: 'Square Logo 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 128, minHeight: 128, isRequired: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Logo, doporučeno s průhledným pozadím' },
  { id: 'google-pmax-logo-1200x300', platform: 'google', type: 'image', category: 'pmax', width: 1200, height: 300, name: 'Horizontal Logo 4:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 512, minHeight: 128, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Logo horizontální' },
]

// Demand Gen - zdroj: https://support.google.com/google-ads/answer/13676244
export const GOOGLE_DEMANDGEN_PRESETS: FormatPreset[] = [
  { id: 'google-demandgen-1200x628', platform: 'google', type: 'image', category: 'demandgen', width: 1200, height: 628, name: 'Landscape 1.91:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 600, minHeight: 314, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 3+ obrázků' },
  { id: 'google-demandgen-1200x1200', platform: 'google', type: 'image', category: 'demandgen', width: 1200, height: 1200, name: 'Square 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 300, minHeight: 300, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 3+ obrázků' },
  { id: 'google-demandgen-960x1200', platform: 'google', type: 'image', category: 'demandgen', width: 960, height: 1200, name: 'Portrait 4:5', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 480, minHeight: 600, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 3+ obrázků' },
  // Logo
  { id: 'google-demandgen-logo-1200x1200', platform: 'google', type: 'image', category: 'demandgen', width: 1200, height: 1200, name: 'Logo 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 144, minHeight: 144, isRequired: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244' },
]

// Responsive Display Ads
export const GOOGLE_RESPONSIVE_PRESETS: FormatPreset[] = [
  { id: 'google-responsive-1200x628', platform: 'google', type: 'image', category: 'responsive', width: 1200, height: 628, name: 'Landscape 1.91:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 600, minHeight: 314, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 5+ obrázků' },
  { id: 'google-responsive-1200x1200', platform: 'google', type: 'image', category: 'responsive', width: 1200, height: 1200, name: 'Square 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 300, minHeight: 300, isRequired: true, isRecommended: true, docsUrl: 'https://support.google.com/google-ads/answer/13676244', notes: 'Doporučeno 5+ obrázků' },
  // Logo
  { id: 'google-responsive-logo-1200x1200', platform: 'google', type: 'image', category: 'responsive', width: 1200, height: 1200, name: 'Square Logo 1:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 128, minHeight: 128, docsUrl: 'https://support.google.com/google-ads/answer/13676244' },
  { id: 'google-responsive-logo-1200x300', platform: 'google', type: 'image', category: 'responsive', width: 1200, height: 300, name: 'Horizontal Logo 4:1', maxFileSizeKB: 5120, allowedFileTypes: ['jpg', 'jpeg', 'png'], minWidth: 512, minHeight: 128, docsUrl: 'https://support.google.com/google-ads/answer/13676244' },
]

// ============================================================================
// FORMAT PRESETS - SKLIK
// Zdroje: https://napoveda.sklik.cz/pravidla/bannery/
//         https://napoveda.sklik.cz/pravidla/html5-bannery/
// ============================================================================

export const SKLIK_BANNER_PRESETS: FormatPreset[] = [
  // Bannery - max 250 kB, nesmí být průhledné
  // Zdroj: https://napoveda.sklik.cz/pravidla/bannery/
  { id: 'sklik-banner-300x250', platform: 'sklik', type: 'image', category: 'bannery', width: 300, height: 250, name: 'Medium Rectangle', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-300x300', platform: 'sklik', type: 'image', category: 'bannery', width: 300, height: 300, name: 'Square', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-300x600', platform: 'sklik', type: 'image', category: 'bannery', width: 300, height: 600, name: 'Half Page', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-480x300', platform: 'sklik', type: 'image', category: 'bannery', width: 480, height: 300, name: 'Wide Rectangle', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-728x90', platform: 'sklik', type: 'image', category: 'bannery', width: 728, height: 90, name: 'Leaderboard', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-970x310', platform: 'sklik', type: 'image', category: 'bannery', width: 970, height: 310, name: 'Billboard', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-970x210', platform: 'sklik', type: 'image', category: 'bannery', width: 970, height: 210, name: 'Billboard Small', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-160x600', platform: 'sklik', type: 'image', category: 'bannery', width: 160, height: 600, name: 'Wide Skyscraper', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-320x100', platform: 'sklik', type: 'image', category: 'bannery', width: 320, height: 100, name: 'Mobile Banner', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-320x50', platform: 'sklik', type: 'image', category: 'bannery', width: 320, height: 50, name: 'Mobile Leaderboard', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
  { id: 'sklik-banner-480x120', platform: 'sklik', type: 'image', category: 'bannery', width: 480, height: 120, name: 'Wide Banner', maxFileSizeKB: 250, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], noTransparency: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/' },
]

// Sklik HTML5 - zdroj: https://napoveda.sklik.cz/pravidla/html5-bannery/
export const SKLIK_HTML5_PRESETS: FormatPreset[] = [
  { id: 'sklik-html5-300x250', platform: 'sklik', type: 'html5', category: 'html5', width: 300, height: 250, name: 'Medium Rectangle', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/', notes: 'Nesmí být interaktivní (kalkulačky, karusely, formuláře)' },
  { id: 'sklik-html5-300x300', platform: 'sklik', type: 'html5', category: 'html5', width: 300, height: 300, name: 'Square', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/' },
  { id: 'sklik-html5-300x600', platform: 'sklik', type: 'html5', category: 'html5', width: 300, height: 600, name: 'Half Page', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/' },
  { id: 'sklik-html5-480x300', platform: 'sklik', type: 'html5', category: 'html5', width: 480, height: 300, name: 'Wide Rectangle', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/' },
  { id: 'sklik-html5-728x90', platform: 'sklik', type: 'html5', category: 'html5', width: 728, height: 90, name: 'Leaderboard', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/' },
  { id: 'sklik-html5-970x310', platform: 'sklik', type: 'html5', category: 'html5', width: 970, height: 310, name: 'Billboard', maxFileSizeKB: 250, allowedFileTypes: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'], maxFilesInZip: 40, maxFolderDepth: 2, bannedFunctions: SKLIK_BANNED_FUNCTIONS, whitelistedCDN: SKLIK_WHITELISTED_CDN, noVideoTag: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/' },
]

// Sklik Kombinovaná - zdroj: https://napoveda.sklik.cz/pravidla/kombinovana-reklama/
export const SKLIK_KOMBINOVANA_PRESETS: FormatPreset[] = [
  { id: 'sklik-kombi-1200x628', platform: 'sklik', type: 'image', category: 'kombinovana', width: 1200, height: 628, name: 'Obdélník 1.91:1', maxFileSizeKB: 1024, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], minWidth: 600, minHeight: 314, isRequired: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/', notes: 'Bez uměle vloženého textu, bez loga eshopu' },
  { id: 'sklik-kombi-1200x1200', platform: 'sklik', type: 'image', category: 'kombinovana', width: 1200, height: 1200, name: 'Čtverec 1:1', maxFileSizeKB: 1024, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], minWidth: 300, minHeight: 300, isRequired: true, isRecommended: true, docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/', notes: 'Bez uměle vloženého textu, bez loga eshopu' },
  // Logo
  { id: 'sklik-kombi-logo-1200x300', platform: 'sklik', type: 'image', category: 'kombinovana', width: 1200, height: 300, name: 'Logo obdélníkové 4:1', maxFileSizeKB: 1024, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], minWidth: 512, minHeight: 128, docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/', notes: 'Bílé nebo průhledné pozadí' },
  { id: 'sklik-kombi-logo-1200x1200', platform: 'sklik', type: 'image', category: 'kombinovana', width: 1200, height: 1200, name: 'Logo čtvercové 1:1', maxFileSizeKB: 1024, allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'], minWidth: 128, minHeight: 128, docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/', notes: 'Bílé nebo průhledné pozadí' },
]

// Sklik Branding - zdroj: https://napoveda.sklik.cz/pravidla/branding/
export const SKLIK_BRANDING_PRESETS: FormatPreset[] = [
  { 
    id: 'sklik-branding-2000x1400', 
    platform: 'sklik', 
    type: 'branding', 
    category: 'branding',
    width: 2000, 
    height: 1400, 
    name: 'Desktop Branding', 
    maxFileSizeKB: 500, 
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif'],
    noTransparency: true,
    requiresOpaqueBackground: true,
    isRequired: true,
    safeZone: {
      x: (2000 - 1366) / 2,  // 317
      y: 0,
      width: 1366,
      height: 720,
      description: 'Hlavní sdělení musí být v horní části 1366×720px. Mimo tuto zónu nesmí být texty ani loga.'
    },
    backgroundZoneRules: 'Mimo safe zone nesmí být texty ani logotypy – pouze fotografie jako pozadí. Pokud vyplňujete barvou, dodržte min. 100px ochrannou vzdálenost od okraje stránky.',
    docsUrl: 'https://napoveda.sklik.cz/pravidla/branding/',
    notes: 'Text v obrázku max na 1/2 viditelné plochy. Kontrola: https://nastroje.szno.cz/cs/kontrola-viditelnych-oblasti/105/'
  },
]

// ============================================================================
// ALL PRESETS
// ============================================================================

export const ALL_PRESETS: FormatPreset[] = [
  ...GOOGLE_DISPLAY_IMAGE_PRESETS,
  ...GOOGLE_HTML5_PRESETS,
  ...GOOGLE_PMAX_PRESETS,
  ...GOOGLE_DEMANDGEN_PRESETS,
  ...GOOGLE_RESPONSIVE_PRESETS,
  ...SKLIK_BANNER_PRESETS,
  ...SKLIK_HTML5_PRESETS,
  ...SKLIK_KOMBINOVANA_PRESETS,
  ...SKLIK_BRANDING_PRESETS,
]

// ============================================================================
// PRESET METADATA - pro UI "Aktualizovat formáty"
// ============================================================================

export const PRESET_SOURCES = {
  sklik: {
    bannery: 'https://napoveda.sklik.cz/pravidla/bannery/',
    html5: 'https://napoveda.sklik.cz/pravidla/html5-bannery/',
    branding: 'https://napoveda.sklik.cz/pravidla/branding/',
    kombinovana: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/',
    formaty: 'https://napoveda.sklik.cz/reklamy/bannery/prehled-podporovanych-formatu-bannerove-reklamy/',
  },
  google: {
    display: 'https://support.google.com/google-ads/answer/1722096',
    specs: 'https://support.google.com/google-ads/answer/13676244',
    pmax: 'https://developers.google.com/google-ads/api/performance-max/asset-requirements',
    demandgen: 'https://support.google.com/google-ads/answer/13547298',
  },
  lastUpdated: '2025-05-30',
}

// ============================================================================
// PRESET HELPERS
// ============================================================================

export function getPresetById(id: string): FormatPreset | undefined {
  return ALL_PRESETS.find(p => p.id === id)
}

export function getPresetsByPlatform(platform: PlatformType): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.platform === platform)
}

export function getPresetsByType(type: FormatType): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.type === type)
}

export function getPresetsByCategory(category: string): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.category === category)
}

export function getPresetsByPlatformAndType(platform: PlatformType, type: FormatType): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.platform === platform && p.type === type)
}

export function getPresetsByPlatformAndCategory(platform: PlatformType, category: string): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.platform === platform && p.category === category)
}

export function getPresetByDimensions(platform: PlatformType, type: FormatType, width: number, height: number): FormatPreset | undefined {
  return ALL_PRESETS.find(p => 
    p.platform === platform && 
    p.type === type && 
    p.width === width && 
    p.height === height
  )
}

export function getRecommendedPresets(platform: PlatformType): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.platform === platform && p.isRecommended)
}

export function getRequiredPresets(platform: PlatformType, category: string): FormatPreset[] {
  return ALL_PRESETS.filter(p => p.platform === platform && p.category === category && p.isRequired)
}

// ============================================================================
// VALIDATOR
// ============================================================================

/**
 * Validuje statický obrázek (PNG/JPG/GIF)
 */
export function validateImageFile(
  file: { data: Blob | ArrayBuffer; width: number; height: number; type: string },
  preset: FormatPreset
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  const fileSize = file.data instanceof Blob ? file.data.size : file.data.byteLength
  const fileSizeKB = Math.round(fileSize / 1024)
  
  // 1. Kontrola rozměrů
  if (file.width !== preset.width || file.height !== preset.height) {
    errors.push({
      type: 'error',
      code: 'DIMENSION_MISMATCH',
      message: `Nesprávné rozměry: ${file.width}×${file.height}, očekáváno ${preset.width}×${preset.height}`,
      autoFixable: true
    })
  }
  
  // 2. Kontrola typu souboru
  const extension = file.type.split('/')[1]?.toLowerCase() || ''
  const normalizedExt = extension === 'jpeg' ? 'jpg' : extension
  if (!preset.allowedFileTypes.some(t => t.toLowerCase() === normalizedExt || t.toLowerCase() === extension)) {
    errors.push({
      type: 'error',
      code: 'INVALID_FILE_TYPE',
      message: `Nepovolený typ souboru: ${extension}. Povolené: ${preset.allowedFileTypes.join(', ')}`,
    })
  }
  
  // 3. Kontrola velikosti
  if (fileSizeKB > preset.maxFileSizeKB) {
    errors.push({
      type: 'error',
      code: 'FILE_TOO_LARGE',
      message: `Soubor je příliš velký: ${fileSizeKB} kB > ${preset.maxFileSizeKB} kB`,
      autoFixable: true
    })
  } else if (fileSizeKB > preset.maxFileSizeKB * 0.9) {
    warnings.push({
      type: 'warning',
      code: 'FILE_NEAR_LIMIT',
      message: `Soubor je blízko limitu: ${fileSizeKB} kB / ${preset.maxFileSizeKB} kB (${Math.round(fileSizeKB / preset.maxFileSizeKB * 100)}%)`,
    })
  }
  
  // 4. Kontrola průhlednosti (pro Sklik bannery)
  // Poznámka: Skutečná kontrola průhlednosti vyžaduje analýzu pixel dat
  // Zde jen označíme jako warning pro manuální kontrolu
  if (preset.noTransparency && file.type === 'image/png') {
    warnings.push({
      type: 'warning',
      code: 'POSSIBLE_TRANSPARENCY',
      message: 'PNG soubor může obsahovat průhlednost. Sklik bannery nesmí být průhledné.',
      details: 'Zkontrolujte, že obrázek nemá průhledné pozadí.'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileSize: fileSizeKB,
    dimensions: { width: file.width, height: file.height }
  }
}

/**
 * Validuje HTML5 ZIP soubor
 */
export async function validateHTML5Zip(
  zipContents: { name: string; content: string | ArrayBuffer }[],
  totalSizeBytes: number,
  preset: FormatPreset
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  const totalSizeKB = Math.round(totalSizeBytes / 1024)
  
  // 1. Kontrola velikosti ZIP
  if (totalSizeKB > preset.maxFileSizeKB) {
    errors.push({
      type: 'error',
      code: 'ZIP_TOO_LARGE',
      message: `ZIP je příliš velký: ${totalSizeKB} kB > ${preset.maxFileSizeKB} kB`,
    })
  }
  
  // 2. Kontrola počtu souborů
  if (preset.maxFilesInZip && zipContents.length > preset.maxFilesInZip) {
    errors.push({
      type: 'error',
      code: 'TOO_MANY_FILES',
      message: `Příliš mnoho souborů v ZIP: ${zipContents.length} > ${preset.maxFilesInZip}`,
    })
  }
  
  // 3. Kontrola úrovně složek (Sklik max 2)
  if (preset.maxFolderDepth) {
    for (const file of zipContents) {
      const depth = file.name.split('/').length - 1
      if (depth > preset.maxFolderDepth) {
        errors.push({
          type: 'error',
          code: 'FOLDER_TOO_DEEP',
          message: `Složka je příliš zanořená: ${file.name} (${depth} úrovní > ${preset.maxFolderDepth})`,
        })
        break
      }
    }
  }
  
  // 4. Najdi HTML soubor
  const htmlFiles = zipContents.filter(f => 
    f.name.endsWith('.html') || f.name.endsWith('.htm')
  )
  
  if (htmlFiles.length === 0) {
    errors.push({
      type: 'error',
      code: 'NO_HTML_FILE',
      message: 'ZIP neobsahuje žádný HTML soubor',
    })
  } else if (htmlFiles.length > 1) {
    warnings.push({
      type: 'warning',
      code: 'MULTIPLE_HTML_FILES',
      message: `ZIP obsahuje ${htmlFiles.length} HTML souborů. Měl by obsahovat pouze jeden (index.html).`,
    })
  }
  
  // 5. Kontrola HTML obsahu
  const indexHtml = htmlFiles.find(f => f.name.endsWith('index.html')) || htmlFiles[0]
  if (indexHtml && typeof indexHtml.content === 'string') {
    const htmlContent = indexHtml.content
    
    // 5a. <!DOCTYPE html>
    if (!htmlContent.toLowerCase().includes('<!doctype html>')) {
      errors.push({
        type: 'error',
        code: 'MISSING_DOCTYPE',
        message: 'HTML soubor neobsahuje <!DOCTYPE html>',
      })
    }
    
    // 5b. <meta name="ad.size"> (Google)
    if (preset.requiresAdSizeMeta) {
      const adSizeRegex = /<meta\s+name=["']ad\.size["']\s+content=["']width=(\d+),\s*height=(\d+)["']/i
      const match = htmlContent.match(adSizeRegex)
      
      if (!match) {
        errors.push({
          type: 'error',
          code: 'MISSING_AD_SIZE_META',
          message: `Chybí <meta name="ad.size" content="width=${preset.width},height=${preset.height}">`,
        })
      } else {
        const metaWidth = parseInt(match[1])
        const metaHeight = parseInt(match[2])
        if (metaWidth !== preset.width || metaHeight !== preset.height) {
          errors.push({
            type: 'error',
            code: 'WRONG_AD_SIZE_META',
            message: `Nesprávné rozměry v ad.size meta: ${metaWidth}×${metaHeight}, očekáváno ${preset.width}×${preset.height}`,
          })
        }
      }
    }
    
    // 5c. clickTag (Google)
    if (preset.requiresClickTag) {
      if (!htmlContent.includes('clickTag')) {
        errors.push({
          type: 'error',
          code: 'MISSING_CLICKTAG',
          message: 'HTML neobsahuje proměnnou clickTag',
        })
      }
    }
    
    // 5d. Zakázané funkce (Sklik)
    if (preset.bannedFunctions) {
      for (const func of preset.bannedFunctions) {
        if (htmlContent.includes(func)) {
          errors.push({
            type: 'error',
            code: 'BANNED_FUNCTION',
            message: `HTML obsahuje zakázanou funkci: ${func}`,
          })
        }
      }
    }
    
    // 5e. Video tag (Sklik)
    if (preset.noVideoTag && /<video/i.test(htmlContent)) {
      errors.push({
        type: 'error',
        code: 'VIDEO_TAG_NOT_ALLOWED',
        message: 'HTML nesmí obsahovat <video> tag',
      })
    }
    
    // 5f. Externí zdroje
    if (preset.whitelistedCDN) {
      // Najdi všechny externí URL (src, href)
      const urlRegex = /(?:src|href)=["'](https?:\/\/[^"']+)["']/gi
      let match
      while ((match = urlRegex.exec(htmlContent)) !== null) {
        const url = match[1]
        const domain = new URL(url).hostname
        
        const isWhitelisted = preset.whitelistedCDN.some(cdn => 
          domain === cdn || domain.endsWith('.' + cdn)
        )
        
        if (!isWhitelisted) {
          errors.push({
            type: 'error',
            code: 'EXTERNAL_RESOURCE_NOT_WHITELISTED',
            message: `Externí zdroj není na whitelistu: ${domain}`,
            details: `URL: ${url}`
          })
        }
      }
    }
  }
  
  // 6. Kontrola JS souborů pro zakázané funkce
  if (preset.bannedFunctions) {
    const jsFiles = zipContents.filter(f => f.name.endsWith('.js'))
    for (const jsFile of jsFiles) {
      if (typeof jsFile.content === 'string') {
        for (const func of preset.bannedFunctions) {
          if (jsFile.content.includes(func)) {
            errors.push({
              type: 'error',
              code: 'BANNED_FUNCTION_IN_JS',
              message: `JS soubor ${jsFile.name} obsahuje zakázanou funkci: ${func}`,
            })
          }
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileSize: totalSizeKB,
  }
}

/**
 * Validuje Branding obrázek
 */
export function validateBrandingImage(
  file: { data: Blob | ArrayBuffer; width: number; height: number; type: string },
  preset: FormatPreset,
  textLayers?: { x: number; y: number; width: number; height: number }[]
): ValidationResult {
  // Nejdřív základní validace jako u image
  const result = validateImageFile(file, preset)
  
  // Přidej Branding-specifické kontroly
  if (preset.safeZone && textLayers) {
    for (const layer of textLayers) {
      const isInSafeZone = 
        layer.x >= preset.safeZone.x &&
        layer.y >= preset.safeZone.y &&
        layer.x + layer.width <= preset.safeZone.x + preset.safeZone.width &&
        layer.y + layer.height <= preset.safeZone.y + preset.safeZone.height
      
      if (!isInSafeZone) {
        result.errors.push({
          type: 'error',
          code: 'TEXT_OUTSIDE_SAFE_ZONE',
          message: 'Text nebo logo je mimo safe zone',
          details: `Textová vrstva na pozici [${layer.x}, ${layer.y}] je mimo povolenou oblast ${preset.safeZone.width}×${preset.safeZone.height}`,
        })
      }
    }
  }
  
  result.isValid = result.errors.length === 0
  return result
}

// ============================================================================
// HTML5 SKELETON GENERATORS
// ============================================================================

/**
 * Generuje HTML5 skeleton pro Google Ads
 */
export function generateGoogleHTML5Skeleton(
  preset: FormatPreset,
  bodyContent: string,
  cssContent: string = '',
  jsContent: string = ''
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="ad.size" content="width=${preset.width},height=${preset.height}">
  <script>
    var clickTag = "https://www.example.com";
  </script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: ${preset.width}px;
      height: ${preset.height}px;
      overflow: hidden;
    }
    #tap-area {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: pointer;
      z-index: 9999;
    }
    ${cssContent}
  </style>
</head>
<body>
  <div id="tap-area"></div>
  ${bodyContent}
  <script>
    document.getElementById('tap-area').addEventListener('click', function() {
      window.open(window.clickTag, '_blank');
    });
    ${jsContent}
  </script>
</body>
</html>`
}

/**
 * Generuje HTML5 skeleton pro Sklik
 * POZOR: Žádný click handler - Sklik to řeší sám
 */
export function generateSklikHTML5Skeleton(
  preset: FormatPreset,
  bodyContent: string,
  cssContent: string = '',
  jsContent: string = ''
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${preset.width},height=${preset.height}">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: ${preset.width}px;
      height: ${preset.height}px;
      overflow: hidden;
    }
    ${cssContent}
  </style>
</head>
<body>
  ${bodyContent}
  ${jsContent ? `<script>${jsContent}</script>` : ''}
</body>
</html>`
}

// ============================================================================
// QUICK VALIDATION HELPERS
// ============================================================================

/**
 * Rychlá kontrola, zda obrázek splňuje limit velikosti
 */
export function checkSizeLimit(sizeBytes: number, preset: FormatPreset): boolean {
  return sizeBytes / 1024 <= preset.maxFileSizeKB
}

/**
 * Vypočítá, o kolik procent je soubor větší/menší než limit
 */
export function getSizePercentage(sizeBytes: number, preset: FormatPreset): number {
  return Math.round((sizeBytes / 1024 / preset.maxFileSizeKB) * 100)
}

/**
 * Vrátí doporučenou JPEG kvalitu pro dosažení cílové velikosti
 */
export function estimateJpegQuality(
  currentSizeBytes: number, 
  targetSizeKB: number,
  currentQuality: number = 92
): number {
  const currentSizeKB = currentSizeBytes / 1024
  if (currentSizeKB <= targetSizeKB) return currentQuality
  
  // Hrubý odhad: kvalita je přibližně lineární k velikosti
  const ratio = targetSizeKB / currentSizeKB
  const newQuality = Math.max(30, Math.min(95, Math.round(currentQuality * ratio * 0.9)))
  return newQuality
}
