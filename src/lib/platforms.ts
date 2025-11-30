/**
 * AdCreative Studio - Definice platforem a formátů (2025)
 * 
 * ZDROJE:
 * - Sklik: https://napoveda.sklik.cz/pravidla/
 * - Google Ads: https://support.google.com/google-ads/answer/1722096
 * 
 * TYPY KATEGORIÍ:
 * - image: Standardní bannery (Smart Crop, Text Overlay)
 * - branding: Formáty se Safe Zone (bez Smart Crop, zobrazit overlay)
 * - video: Video formáty
 * - html5: HTML5 bannery
 */

import type { Platform, CategoryType } from '@/types'

export const platforms: Record<string, Platform> = {
  // ===========================================================================
  // SKLIK (Seznam.cz)
  // ===========================================================================
  sklik: {
    id: 'sklik',
    name: 'Sklik',
    icon: '🇨🇿',
    color: '#f97316',
    categories: {
      // -----------------------------------------------------------------------
      // KOMBINOVANÁ REKLAMA
      // Max: 2048 kB
      // -----------------------------------------------------------------------
      kombinovana: {
        id: 'kombinovana',
        name: 'Kombinovaná reklama',
        description: 'Responzivní reklama pro obsahovou síť. Max 2 MB.',
        icon: '🔄',
        type: 'image' as CategoryType,
        maxSizeKB: 2048,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { width: 1200, height: 628, name: 'Landscape', ratio: '1.91:1' },
          { width: 1200, height: 1200, name: 'Square', ratio: '1:1' },
          { width: 1200, height: 300, name: 'Logo', ratio: '4:1' },
        ],
      },

      // -----------------------------------------------------------------------
      // BANNERY - KRITICKÉ: Max 150 kB!
      // -----------------------------------------------------------------------
      bannery: {
        id: 'bannery',
        name: 'Bannery',
        description: '⚠️ STRIKTNĚ max 150 kB!',
        icon: '🖼️',
        type: 'image' as CategoryType,
        maxSizeKB: 150,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { width: 970, height: 310, name: 'Billboard 970×310' },
          { width: 970, height: 210, name: 'Billboard 970×210' },
          { width: 728, height: 90, name: 'Leaderboard' },
          { width: 300, height: 250, name: 'Medium Rectangle' },
          { width: 300, height: 600, name: 'Half Page' },
          { width: 160, height: 600, name: 'Wide Skyscraper' },
          { width: 480, height: 300, name: 'Wide Rectangle' },
          { width: 320, height: 100, name: 'Mobile Banner' },
          { width: 320, height: 50, name: 'Mobile Leaderboard' },
          { width: 300, height: 300, name: 'Square' },
        ],
      },

      // -----------------------------------------------------------------------
      // BRANDING (Desktop) - Safe Zone!
      // Rozměr: 2000 × 1400 px, Max: 500 kB
      // Středový pruh 1068px je MRTVÁ ZÓNA (překryt webem)
      // -----------------------------------------------------------------------
      branding: {
        id: 'branding',
        name: 'Branding',
        description: 'Desktop tapeta. Střed 1068px je mrtvá zóna!',
        icon: '🏠',
        type: 'branding' as CategoryType,
        maxSizeKB: 500,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { 
            width: 2000, 
            height: 1400, 
            name: 'Desktop Branding',
            safeZone: {
              top: 0,
              bottom: 0,
              left: 466,  // (2000 - 1068) / 2
              right: 466,
              centerWidth: 1068,
              visibleHeight: 1400,
              description: 'Středový pruh 1068px je překryt obsahem webu - MRTVÁ ZÓNA. Kreativa musí být na stranách.'
            }
          },
        ],
      },

      // -----------------------------------------------------------------------
      // INTERSCROLLER (Mobil) - Safe Zone!
      // Rozměr: 720 × 1280 px
      // -----------------------------------------------------------------------
      interscroller: {
        id: 'interscroller',
        name: 'Interscroller',
        description: 'Mobilní formát. Viditelná oblast 920px uprostřed.',
        icon: '📱',
        type: 'branding' as CategoryType,
        maxSizeKB: 250,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { 
            width: 720, 
            height: 1280, 
            name: 'Interscroller',
            safeZone: {
              top: 180,   // (1280 - 920) / 2
              bottom: 180,
              left: 10,   // (720 - 700) / 2
              right: 10,
              centerWidth: 700,
              visibleHeight: 920,
              description: 'Viditelná oblast je 700×920px uprostřed. Okraje mohou být oříznuty.'
            }
          },
        ],
      },

      // -----------------------------------------------------------------------
      // VIDEO
      // -----------------------------------------------------------------------
      video: {
        id: 'video',
        name: 'Video reklama',
        description: 'Video pro Stream.cz a obsahovou síť',
        icon: '🎬',
        type: 'video' as CategoryType,
        maxSizeKB: 102400,
        fileTypes: ['MP4'],
        formats: [
          { width: 1920, height: 1080, name: '16:9 Full HD', isVideo: true },
          { width: 1080, height: 1080, name: '1:1 Square', isVideo: true },
          { width: 1080, height: 1920, name: '9:16 Vertical', isVideo: true },
        ],
      },
    },
  },

  // ===========================================================================
  // GOOGLE ADS
  // ===========================================================================
  google: {
    id: 'google',
    name: 'Google Ads',
    icon: '🌐',
    color: '#4285f4',
    categories: {
      // -----------------------------------------------------------------------
      // PERFORMANCE MAX - až 5 MB!
      // -----------------------------------------------------------------------
      pmax: {
        id: 'pmax',
        name: 'Performance Max',
        description: 'P-Max assety. Max 5 MB!',
        icon: '🚀',
        type: 'image' as CategoryType,
        isPMax: true,
        maxSizeKB: 5120,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { width: 1200, height: 628, name: 'Landscape', ratio: '1.91:1' },
          { width: 1200, height: 1200, name: 'Square', ratio: '1:1' },
          { width: 960, height: 1200, name: 'Portrait', ratio: '4:5', notes: 'DŮLEŽITÝ pro mobilní zobrazení!' },
        ],
      },

      // -----------------------------------------------------------------------
      // DISPLAY ADS (GDN) - max 150 kB!
      // -----------------------------------------------------------------------
      display: {
        id: 'display',
        name: 'Display Ads',
        description: '⚠️ STRIKTNĚ max 150 kB!',
        icon: '📊',
        type: 'image' as CategoryType,
        maxSizeKB: 150,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { width: 300, height: 250, name: 'Medium Rectangle' },
          { width: 336, height: 280, name: 'Large Rectangle' },
          { width: 728, height: 90, name: 'Leaderboard' },
          { width: 300, height: 600, name: 'Half Page' },
          { width: 320, height: 100, name: 'Large Mobile Banner' },
          { width: 160, height: 600, name: 'Wide Skyscraper' },
          { width: 970, height: 90, name: 'Large Leaderboard' },
          { width: 970, height: 250, name: 'Billboard' },
          { width: 970, height: 310, name: 'Billboard Large' },
          { width: 300, height: 300, name: 'Square' },
        ],
      },

      // -----------------------------------------------------------------------
      // YOUTUBE VIDEO
      // -----------------------------------------------------------------------
      youtube: {
        id: 'youtube',
        name: 'YouTube Video',
        description: 'Video reklamy pro YouTube',
        icon: '▶️',
        type: 'video' as CategoryType,
        maxSizeKB: 256000,
        fileTypes: ['MP4'],
        formats: [
          { width: 1920, height: 1080, name: 'Landscape 16:9', isVideo: true, ratio: '16:9' },
          { width: 1080, height: 1920, name: 'Shorts 9:16', isVideo: true, ratio: '9:16' },
          { width: 1080, height: 1080, name: 'Square 1:1', isVideo: true, ratio: '1:1' },
        ],
      },

      // -----------------------------------------------------------------------
      // DEMAND GEN
      // -----------------------------------------------------------------------
      demandgen: {
        id: 'demandgen',
        name: 'Demand Gen',
        description: 'Gmail, Discover, YouTube. Max 5 MB.',
        icon: '📧',
        type: 'image' as CategoryType,
        maxSizeKB: 5120,
        fileTypes: ['JPG', 'PNG'],
        formats: [
          { width: 1200, height: 628, name: 'Landscape', ratio: '1.91:1' },
          { width: 1200, height: 1200, name: 'Square', ratio: '1:1' },
          { width: 960, height: 1200, name: 'Portrait', ratio: '4:5' },
        ],
      },
    },
  },
}

// ===========================================================================
// HELPER FUNKCE
// ===========================================================================

export function getFormatKey(platform: string, category: string, index: number): string {
  return `${platform}-${category}-${index}`
}

export function parseFormatKey(key: string): { platform: string; category: string; index: number } {
  const parts = key.split('-')
  const index = parseInt(parts.pop() || '0', 10)
  const category = parts.pop() || ''
  const platform = parts.join('-')
  return { platform, category, index }
}

export function getFormatByKey(key: string) {
  const { platform, category, index } = parseFormatKey(key)
  return platforms[platform]?.categories[category]?.formats[index]
}

export function getCategoryByKey(platform: string, category: string) {
  return platforms[platform]?.categories[category]
}

export function getCategoryType(platform: string, category: string): CategoryType | undefined {
  return platforms[platform]?.categories[category]?.type
}

export function isVideoCategory(platform: string, category: string): boolean {
  return getCategoryType(platform, category) === 'video'
}

export function isBrandingCategory(platform: string, category: string): boolean {
  return getCategoryType(platform, category) === 'branding'
}

export function getMaxSizeKB(platform: string, category: string): number {
  return platforms[platform]?.categories[category]?.maxSizeKB || 150
}

export function requiresCompression(platform: string, category: string): boolean {
  const maxSize = getMaxSizeKB(platform, category)
  return maxSize <= 150
}
