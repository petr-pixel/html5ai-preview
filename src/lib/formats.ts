/**
 * AdCreative Studio - Format Definitions
 * 
 * Zdroje:
 * - Sklik: https://napoveda.sklik.cz/pravidla/bannery/
 * - Google: https://support.google.com/google-ads/answer/1722096
 */

import type { Platform, PlatformId, Category, Format } from '@/types'

// ============================================================================
// SKLIK FORMÁTY
// ============================================================================

const sklikBannery: Category = {
  id: 'bannery',
  name: 'Bannery',
  icon: '🖼️',
  formats: [
    { id: 'sklik-banner-300x250', width: 300, height: 250, name: 'Medium Rectangle', type: 'image', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-banner-300x600', width: 300, height: 600, name: 'Half Page', type: 'image', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-banner-728x90', width: 728, height: 90, name: 'Leaderboard', type: 'image', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-banner-970x310', width: 970, height: 310, name: 'Billboard', type: 'image', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-banner-970x210', width: 970, height: 210, name: 'Billboard Small', type: 'image', maxSizeKB: 250 },
    { id: 'sklik-banner-480x300', width: 480, height: 300, name: 'Wide Rectangle', type: 'image', maxSizeKB: 250 },
    { id: 'sklik-banner-320x100', width: 320, height: 100, name: 'Mobile Banner', type: 'image', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-banner-320x50', width: 320, height: 50, name: 'Mobile Leaderboard', type: 'image', maxSizeKB: 250 },
    { id: 'sklik-banner-160x600', width: 160, height: 600, name: 'Wide Skyscraper', type: 'image', maxSizeKB: 250 },
    { id: 'sklik-banner-300x300', width: 300, height: 300, name: 'Square', type: 'image', maxSizeKB: 250 },
    { id: 'sklik-banner-480x120', width: 480, height: 120, name: 'Wide Banner', type: 'image', maxSizeKB: 250 },
  ]
}

const sklikHtml5: Category = {
  id: 'html5',
  name: 'HTML5 Bannery',
  icon: '✨',
  formats: [
    { id: 'sklik-html5-300x250', width: 300, height: 250, name: 'Medium Rectangle', type: 'html5', maxSizeKB: 250, isRecommended: true },
    { id: 'sklik-html5-300x600', width: 300, height: 600, name: 'Half Page', type: 'html5', maxSizeKB: 250 },
    { id: 'sklik-html5-728x90', width: 728, height: 90, name: 'Leaderboard', type: 'html5', maxSizeKB: 250 },
    { id: 'sklik-html5-970x310', width: 970, height: 310, name: 'Billboard', type: 'html5', maxSizeKB: 250 },
    { id: 'sklik-html5-320x100', width: 320, height: 100, name: 'Mobile Banner', type: 'html5', maxSizeKB: 250 },
    { id: 'sklik-html5-300x300', width: 300, height: 300, name: 'Square', type: 'html5', maxSizeKB: 250 },
  ]
}

const sklikKombinovana: Category = {
  id: 'kombinovana',
  name: 'Kombinovaná reklama',
  icon: '📱',
  formats: [
    { id: 'sklik-kombi-1200x628', width: 1200, height: 628, name: 'Landscape 1.91:1', type: 'image', maxSizeKB: 2048, isRecommended: true },
    { id: 'sklik-kombi-1200x1200', width: 1200, height: 1200, name: 'Square 1:1', type: 'image', maxSizeKB: 2048, isRecommended: true },
    { id: 'sklik-kombi-1200x300', width: 1200, height: 300, name: 'Logo 4:1', type: 'image', maxSizeKB: 2048 },
    { id: 'sklik-kombi-300x300', width: 300, height: 300, name: 'Logo Square', type: 'image', maxSizeKB: 2048 },
  ]
}

const sklikBranding: Category = {
  id: 'branding',
  name: 'Branding',
  icon: '🏠',
  formats: [
    { 
      id: 'sklik-branding-2000x1400', 
      width: 2000, 
      height: 1400, 
      name: 'Desktop Branding', 
      type: 'image', 
      maxSizeKB: 500,
      isRecommended: true,
      safeZone: {
        x: 317,
        y: 0,
        width: 1366,
        height: 720,
        description: 'Hlavní obsah musí být v horní části 1366×720px'
      }
    },
  ]
}

const sklikInterscroller: Category = {
  id: 'interscroller',
  name: 'Interscroller',
  icon: '📜',
  formats: [
    { 
      id: 'sklik-interscroller-720x1280', 
      width: 720, 
      height: 1280, 
      name: 'Mobile Interscroller', 
      type: 'image', 
      maxSizeKB: 250,
      isRecommended: true,
      safeZone: {
        x: 10,
        y: 180,
        width: 700,
        height: 920,
        description: 'Viditelná oblast 700×920px'
      }
    },
  ]
}

const sklikVideo: Category = {
  id: 'video',
  name: 'Video reklama',
  icon: '🎬',
  formats: [
    { id: 'sklik-video-16x9', width: 1920, height: 1080, name: 'Landscape 16:9', type: 'video', maxSizeKB: 102400, isRecommended: true },
    { id: 'sklik-video-9x16', width: 1080, height: 1920, name: 'Portrait 9:16', type: 'video', maxSizeKB: 102400 },
    { id: 'sklik-video-1x1', width: 1080, height: 1080, name: 'Square 1:1', type: 'video', maxSizeKB: 102400 },
  ]
}

// ============================================================================
// GOOGLE ADS FORMÁTY
// ============================================================================

const googleDisplay: Category = {
  id: 'display',
  name: 'Display Bannery',
  icon: '🖼️',
  formats: [
    { id: 'google-display-300x250', width: 300, height: 250, name: 'Medium Rectangle', type: 'image', maxSizeKB: 150, isRecommended: true },
    { id: 'google-display-336x280', width: 336, height: 280, name: 'Large Rectangle', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-728x90', width: 728, height: 90, name: 'Leaderboard', type: 'image', maxSizeKB: 150, isRecommended: true },
    { id: 'google-display-300x600', width: 300, height: 600, name: 'Half Page', type: 'image', maxSizeKB: 150, isRecommended: true },
    { id: 'google-display-320x100', width: 320, height: 100, name: 'Large Mobile', type: 'image', maxSizeKB: 150, isRecommended: true },
    { id: 'google-display-320x50', width: 320, height: 50, name: 'Mobile Leaderboard', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-160x600', width: 160, height: 600, name: 'Wide Skyscraper', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-970x90', width: 970, height: 90, name: 'Large Leaderboard', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-970x250', width: 970, height: 250, name: 'Billboard', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-250x250', width: 250, height: 250, name: 'Square', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-200x200', width: 200, height: 200, name: 'Small Square', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-468x60', width: 468, height: 60, name: 'Banner', type: 'image', maxSizeKB: 150 },
    { id: 'google-display-120x600', width: 120, height: 600, name: 'Skyscraper', type: 'image', maxSizeKB: 150 },
  ]
}

const googlePmax: Category = {
  id: 'pmax',
  name: 'Performance Max',
  icon: '🚀',
  formats: [
    { id: 'google-pmax-1200x1200', width: 1200, height: 1200, name: 'Square 1:1', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-pmax-1200x628', width: 1200, height: 628, name: 'Landscape 1.91:1', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-pmax-960x1200', width: 960, height: 1200, name: 'Portrait 4:5', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-pmax-logo-1200x1200', width: 1200, height: 1200, name: 'Logo Square', type: 'image', maxSizeKB: 5120 },
    { id: 'google-pmax-logo-1200x300', width: 1200, height: 300, name: 'Logo Landscape 4:1', type: 'image', maxSizeKB: 5120 },
  ]
}

const googleDemandGen: Category = {
  id: 'demandgen',
  name: 'Demand Gen',
  icon: '📈',
  formats: [
    { id: 'google-demandgen-1200x628', width: 1200, height: 628, name: 'Landscape', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-demandgen-1200x1200', width: 1200, height: 1200, name: 'Square', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-demandgen-960x1200', width: 960, height: 1200, name: 'Portrait', type: 'image', maxSizeKB: 5120 },
  ]
}

const googleResponsive: Category = {
  id: 'responsive',
  name: 'Responsive Display',
  icon: '📐',
  formats: [
    { id: 'google-responsive-1200x628', width: 1200, height: 628, name: 'Landscape', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-responsive-1200x1200', width: 1200, height: 1200, name: 'Square', type: 'image', maxSizeKB: 5120, isRecommended: true },
    { id: 'google-responsive-logo-1200x1200', width: 1200, height: 1200, name: 'Logo Square', type: 'image', maxSizeKB: 5120 },
    { id: 'google-responsive-logo-1200x300', width: 1200, height: 300, name: 'Logo Landscape', type: 'image', maxSizeKB: 5120 },
  ]
}

const googleVideo: Category = {
  id: 'video',
  name: 'YouTube Video',
  icon: '🎬',
  formats: [
    { id: 'google-video-1920x1080', width: 1920, height: 1080, name: 'Landscape 16:9', type: 'video', maxSizeKB: 262144, isRecommended: true },
    { id: 'google-video-1080x1920', width: 1080, height: 1920, name: 'Portrait 9:16', type: 'video', maxSizeKB: 262144 },
    { id: 'google-video-1080x1080', width: 1080, height: 1080, name: 'Square 1:1', type: 'video', maxSizeKB: 262144 },
  ]
}

// ============================================================================
// PLATFORMS
// ============================================================================

export const platforms: Record<PlatformId, Platform> = {
  sklik: {
    id: 'sklik',
    name: 'Sklik',
    icon: '🟠',
    categories: {
      bannery: sklikBannery,
      html5: sklikHtml5,
      kombinovana: sklikKombinovana,
      branding: sklikBranding,
      interscroller: sklikInterscroller,
      video: sklikVideo,
    }
  },
  google: {
    id: 'google',
    name: 'Google Ads',
    icon: '🔵',
    categories: {
      display: googleDisplay,
      pmax: googlePmax,
      demandgen: googleDemandGen,
      responsive: googleResponsive,
      video: googleVideo,
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

export function getAllFormats(): Format[] {
  const formats: Format[] = []
  for (const platform of Object.values(platforms)) {
    for (const category of Object.values(platform.categories)) {
      formats.push(...category.formats)
    }
  }
  return formats
}

export function getFormatById(id: string): Format | undefined {
  return getAllFormats().find(f => f.id === id)
}

export function getRecommendedFormats(platformId?: PlatformId): Format[] {
  const formats: Format[] = []
  const platformsToCheck = platformId ? [platforms[platformId]] : Object.values(platforms)
  
  for (const platform of platformsToCheck) {
    for (const category of Object.values(platform.categories)) {
      formats.push(...category.formats.filter(f => f.isRecommended))
    }
  }
  return formats
}

export function getPlatformFromFormatId(formatId: string): PlatformId {
  return formatId.startsWith('google-') ? 'google' : 'sklik'
}

export function getCategoryFromFormatId(formatId: string): string {
  const parts = formatId.split('-')
  return parts[1] || ''
}

// ============================================================================
// DOCUMENTATION SOURCES
// ============================================================================

export const DOC_SOURCES = {
  sklik: {
    bannery: 'https://napoveda.sklik.cz/pravidla/bannery/',
    html5: 'https://napoveda.sklik.cz/pravidla/html5-bannery/',
    kombinovana: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/',
    branding: 'https://napoveda.sklik.cz/pravidla/branding/',
    interscroller: 'https://napoveda.sklik.cz/pravidla/interscroller/',
    video: 'https://napoveda.sklik.cz/pravidla/videoreklama/',
  },
  google: {
    display: 'https://support.google.com/google-ads/answer/1722096',
    pmax: 'https://support.google.com/google-ads/answer/13676244',
    demandgen: 'https://support.google.com/google-ads/answer/13547298',
  },
  lastUpdated: '2024-12-06',
}
