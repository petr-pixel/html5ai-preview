import type { Format, FormatCategory, Platform } from '@/types'

// ============================================================================
// SKLIK FORMATS
// ============================================================================

export const sklikFormats: Format[] = [
  // Bannery
  { id: 'sklik-banner-300x250', name: 'Medium Rectangle', width: 300, height: 250, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200, recommended: true },
  { id: 'sklik-banner-728x90', name: 'Leaderboard', width: 728, height: 90, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200, recommended: true },
  { id: 'sklik-banner-970x310', name: 'Billboard', width: 970, height: 310, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-480x300', name: 'Skyscraper Wide', width: 480, height: 300, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-300x300', name: 'Square', width: 300, height: 300, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-300x600', name: 'Half Page', width: 300, height: 600, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-160x600', name: 'Wide Skyscraper', width: 160, height: 600, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-120x600', name: 'Skyscraper', width: 120, height: 600, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-970x90', name: 'Large Leaderboard', width: 970, height: 90, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-468x60', name: 'Banner', width: 468, height: 60, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },
  { id: 'sklik-banner-250x250', name: 'Square Small', width: 250, height: 250, type: 'image', platform: 'sklik', category: 'banner', maxSizeKB: 200 },

  // HTML5
  { id: 'sklik-html5-300x250', name: 'HTML5 Medium Rectangle', width: 300, height: 250, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250, recommended: true },
  { id: 'sklik-html5-728x90', name: 'HTML5 Leaderboard', width: 728, height: 90, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250 },
  { id: 'sklik-html5-970x310', name: 'HTML5 Billboard', width: 970, height: 310, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250 },
  { id: 'sklik-html5-480x300', name: 'HTML5 Skyscraper Wide', width: 480, height: 300, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250 },
  { id: 'sklik-html5-300x600', name: 'HTML5 Half Page', width: 300, height: 600, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250 },
  { id: 'sklik-html5-970x90', name: 'HTML5 Large Leaderboard', width: 970, height: 90, type: 'html5', platform: 'sklik', category: 'html5', maxSizeKB: 250 },

  // Kombinovaná reklama
  { id: 'sklik-combined-1200x628', name: 'Landscape 1.91:1', width: 1200, height: 628, type: 'image', platform: 'sklik', category: 'combined', maxSizeKB: 2048, recommended: true },
  { id: 'sklik-combined-1200x1200', name: 'Square 1:1', width: 1200, height: 1200, type: 'image', platform: 'sklik', category: 'combined', maxSizeKB: 2048, recommended: true },
  { id: 'sklik-combined-logo-300x300', name: 'Logo Square', width: 300, height: 300, type: 'image', platform: 'sklik', category: 'combined', maxSizeKB: 1024 },
  { id: 'sklik-combined-logo-512x128', name: 'Logo Wide', width: 512, height: 128, type: 'image', platform: 'sklik', category: 'combined', maxSizeKB: 1024 },

  // Branding
  { 
    id: 'sklik-branding-2000x1400', 
    name: 'Branding', 
    width: 2000, 
    height: 1400, 
    type: 'image', 
    platform: 'sklik', 
    category: 'branding', 
    maxSizeKB: 500,
    safeZone: { x: 317, y: 340, width: 1366, height: 720, description: 'Viditelná oblast 1366×720' }
  },

  // Interscroller
  { 
    id: 'sklik-interscroller-720x1280', 
    name: 'Interscroller', 
    width: 720, 
    height: 1280, 
    type: 'image', 
    platform: 'sklik', 
    category: 'interscroller', 
    maxSizeKB: 250,
    safeZone: { x: 10, y: 180, width: 700, height: 920, description: 'Viditelná oblast 700×920' }
  },

  // Video
  { id: 'sklik-video-16x9', name: 'Video 16:9', width: 1920, height: 1080, type: 'video', platform: 'sklik', category: 'video', maxSizeKB: 102400 },
  { id: 'sklik-video-9x16', name: 'Video 9:16', width: 1080, height: 1920, type: 'video', platform: 'sklik', category: 'video', maxSizeKB: 102400 },
  { id: 'sklik-video-1x1', name: 'Video 1:1', width: 1080, height: 1080, type: 'video', platform: 'sklik', category: 'video', maxSizeKB: 102400 },
]

// ============================================================================
// GOOGLE ADS FORMATS
// ============================================================================

export const googleFormats: Format[] = [
  // Display
  { id: 'google-display-300x250', name: 'Medium Rectangle', width: 300, height: 250, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150, recommended: true },
  { id: 'google-display-728x90', name: 'Leaderboard', width: 728, height: 90, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150, recommended: true },
  { id: 'google-display-336x280', name: 'Large Rectangle', width: 336, height: 280, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-300x600', name: 'Half Page', width: 300, height: 600, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-320x100', name: 'Large Mobile Banner', width: 320, height: 100, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-320x50', name: 'Mobile Banner', width: 320, height: 50, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-160x600', name: 'Wide Skyscraper', width: 160, height: 600, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-970x90', name: 'Large Leaderboard', width: 970, height: 90, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-970x250', name: 'Billboard', width: 970, height: 250, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-250x250', name: 'Square', width: 250, height: 250, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-200x200', name: 'Small Square', width: 200, height: 200, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-468x60', name: 'Banner', width: 468, height: 60, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },
  { id: 'google-display-120x600', name: 'Skyscraper', width: 120, height: 600, type: 'image', platform: 'google', category: 'display', maxSizeKB: 150 },

  // Performance Max
  { id: 'google-pmax-1200x1200', name: 'P-Max Square', width: 1200, height: 1200, type: 'image', platform: 'google', category: 'pmax', maxSizeKB: 5120, recommended: true },
  { id: 'google-pmax-1200x628', name: 'P-Max Landscape', width: 1200, height: 628, type: 'image', platform: 'google', category: 'pmax', maxSizeKB: 5120, recommended: true },
  { id: 'google-pmax-960x1200', name: 'P-Max Portrait', width: 960, height: 1200, type: 'image', platform: 'google', category: 'pmax', maxSizeKB: 5120 },
  { id: 'google-pmax-logo-1200x1200', name: 'P-Max Logo Square', width: 1200, height: 1200, type: 'image', platform: 'google', category: 'pmax', maxSizeKB: 5120 },
  { id: 'google-pmax-logo-1200x300', name: 'P-Max Logo Wide', width: 1200, height: 300, type: 'image', platform: 'google', category: 'pmax', maxSizeKB: 5120 },

  // Demand Gen
  { id: 'google-demandgen-1200x628', name: 'Demand Gen Landscape', width: 1200, height: 628, type: 'image', platform: 'google', category: 'demandgen', maxSizeKB: 5120, recommended: true },
  { id: 'google-demandgen-1200x1200', name: 'Demand Gen Square', width: 1200, height: 1200, type: 'image', platform: 'google', category: 'demandgen', maxSizeKB: 5120 },
  { id: 'google-demandgen-960x1200', name: 'Demand Gen Portrait', width: 960, height: 1200, type: 'image', platform: 'google', category: 'demandgen', maxSizeKB: 5120 },

  // Responsive Display
  { id: 'google-responsive-1200x628', name: 'Responsive Landscape', width: 1200, height: 628, type: 'image', platform: 'google', category: 'responsive', maxSizeKB: 5120, recommended: true },
  { id: 'google-responsive-1200x1200', name: 'Responsive Square', width: 1200, height: 1200, type: 'image', platform: 'google', category: 'responsive', maxSizeKB: 5120 },
  { id: 'google-responsive-logo-1200x1200', name: 'Responsive Logo Square', width: 1200, height: 1200, type: 'image', platform: 'google', category: 'responsive', maxSizeKB: 5120 },
  { id: 'google-responsive-logo-1200x300', name: 'Responsive Logo Wide', width: 1200, height: 300, type: 'image', platform: 'google', category: 'responsive', maxSizeKB: 5120 },

  // YouTube
  { id: 'google-youtube-16x9', name: 'YouTube 16:9', width: 1920, height: 1080, type: 'video', platform: 'google', category: 'youtube', maxSizeKB: 262144 },
  { id: 'google-youtube-9x16', name: 'YouTube Shorts', width: 1080, height: 1920, type: 'video', platform: 'google', category: 'youtube', maxSizeKB: 262144 },
  { id: 'google-youtube-1x1', name: 'YouTube Square', width: 1080, height: 1080, type: 'video', platform: 'google', category: 'youtube', maxSizeKB: 262144 },
]

// ============================================================================
// ALL FORMATS
// ============================================================================

export const allFormats: Format[] = [...sklikFormats, ...googleFormats]

// ============================================================================
// CATEGORIES
// ============================================================================

export const sklikCategories: FormatCategory[] = [
  { id: 'banner', name: 'Bannery', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'banner') },
  { id: 'html5', name: 'HTML5', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'html5') },
  { id: 'combined', name: 'Kombinovaná reklama', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'combined') },
  { id: 'branding', name: 'Branding', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'branding') },
  { id: 'interscroller', name: 'Interscroller', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'interscroller') },
  { id: 'video', name: 'Video', platform: 'sklik', formats: sklikFormats.filter(f => f.category === 'video') },
]

export const googleCategories: FormatCategory[] = [
  { id: 'display', name: 'Display', platform: 'google', formats: googleFormats.filter(f => f.category === 'display') },
  { id: 'pmax', name: 'Performance Max', platform: 'google', formats: googleFormats.filter(f => f.category === 'pmax') },
  { id: 'demandgen', name: 'Demand Gen', platform: 'google', formats: googleFormats.filter(f => f.category === 'demandgen') },
  { id: 'responsive', name: 'Responsive Display', platform: 'google', formats: googleFormats.filter(f => f.category === 'responsive') },
  { id: 'youtube', name: 'YouTube', platform: 'google', formats: googleFormats.filter(f => f.category === 'youtube') },
]

// ============================================================================
// HELPERS
// ============================================================================

export function getFormatById(id: string): Format | undefined {
  return allFormats.find(f => f.id === id)
}

export function getFormatsByPlatform(platform: Platform): Format[] {
  return allFormats.filter(f => f.platform === platform)
}

export function getFormatsByCategory(platform: Platform, category: string): Format[] {
  return allFormats.filter(f => f.platform === platform && f.category === category)
}

export function getRecommendedFormats(platform?: Platform): Format[] {
  const formats = platform ? getFormatsByPlatform(platform) : allFormats
  return formats.filter(f => f.recommended)
}

export function getCategoriesByPlatform(platform: Platform): FormatCategory[] {
  return platform === 'sklik' ? sklikCategories : googleCategories
}
