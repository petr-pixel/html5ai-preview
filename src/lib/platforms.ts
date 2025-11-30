/**
 * AdCreative Studio - Definice platforem a formátů
 * 
 * ZDROJE DOKUMENTACE:
 * ==================
 * 
 * SKLIK (Seznam.cz):
 * - Bannery: https://napoveda.sklik.cz/pravidla/bannery/
 * - Branding: https://napoveda.sklik.cz/pravidla/branding/
 * - Interscroller: https://napoveda.sklik.cz/pravidla/interscroller/
 * - Kombinovaná reklama: https://napoveda.sklik.cz/pravidla/kombinovana-reklama/
 * - HTML5: https://napoveda.sklik.cz/pravidla/html5-bannery/
 * 
 * GOOGLE ADS:
 * - P-Max: https://support.google.com/google-ads/answer/13676244
 * - Display: https://support.google.com/google-ads/answer/1722096
 * 
 * DŮLEŽITÉ LIMITY:
 * ================
 * - Sklik bannery: max 250 kB (JPEG, PNG, GIF)
 * - Sklik HTML5: max 250 kB (ZIP)
 * - Sklik Branding: max 500 kB
 * - Sklik Interscroller: max 250 kB
 * - Google Display: max 150 kB
 * - Google P-Max: max 5120 kB (5 MB)
 */

import type { Platform } from '@/types'

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
      // KOMBINOVANÁ REKLAMA (Responsive)
      // Zdroj: https://napoveda.sklik.cz/pravidla/kombinovana-reklama/
      // Kompatibilní s Google Ads Responsive Display
      // -----------------------------------------------------------------------
      kombinovana: {
        id: 'kombinovana',
        name: 'Kombinovaná reklama',
        description: 'Responzivní reklama pro obsahovou síť (kompatibilní s Google RDA)',
        icon: '🔄',
        formats: [
          // Ilustrační obrázky - POVINNÉ
          { 
            width: 1200, 
            height: 628, 
            name: 'Obdélník (1.91:1)', 
            ratio: '1.91:1',
            minWidth: 600,
            minHeight: 314,
            recommendedWidth: 1200,
            recommendedHeight: 628,
            notes: 'Povinný. Může být oříznut o ~7% na okrajích.'
          },
          { 
            width: 1200, 
            height: 1200, 
            name: 'Čtverec (1:1)', 
            ratio: '1:1',
            minWidth: 300,
            minHeight: 300,
            recommendedWidth: 1200,
            recommendedHeight: 1200,
            notes: 'Povinný. Hlavní grafické sdělení centrovat.'
          },
          // Loga - VOLITELNÉ
          { 
            width: 1200, 
            height: 300, 
            name: 'Logo obdélníkové (4:1)', 
            ratio: '4:1',
            minWidth: 512,
            minHeight: 128,
            notes: 'Volitelné. Bílé nebo průhledné pozadí.'
          },
          { 
            width: 1200, 
            height: 1200, 
            name: 'Logo čtvercové (1:1)', 
            ratio: '1:1',
            minWidth: 128,
            minHeight: 128,
            notes: 'Volitelné. Bílé nebo průhledné pozadí.'
          },
        ],
        maxSizeKB: 1024, // 1 MB
        fileTypes: ['JPEG', 'JPG', 'PNG', 'GIF (statický)'],
        docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/',
      },

      // -----------------------------------------------------------------------
      // STANDARDNÍ BANNERY
      // Zdroj: https://napoveda.sklik.cz/pravidla/bannery/
      // Řazeno podle počtu prokliků (sestupně)
      // -----------------------------------------------------------------------
      bannery: {
        id: 'bannery',
        name: 'Bannery',
        description: 'Statické bannery pro obsahovou síť Seznam',
        icon: '🖼️',
        formats: [
          // TOP formáty podle prokliků
          { width: 300, height: 600, name: 'Half-page', notes: '#1 v proklikovosti' },
          { width: 480, height: 300, name: 'Wide Rectangle', notes: '#2 v proklikovosti' },
          { width: 300, height: 250, name: 'Medium Rectangle', notes: '#3 v proklikovosti' },
          { width: 970, height: 310, name: 'Big Billboard', notes: '#4 v proklikovosti' },
          { width: 320, height: 100, name: 'Mobile Large', notes: '#5 v proklikovosti' },
          { width: 300, height: 300, name: 'Square', notes: '#6 v proklikovosti' },
          // Další formáty
          { width: 970, height: 210, name: 'Billboard' },
          { width: 970, height: 90, name: 'Leaderboard' },
          { width: 728, height: 90, name: 'Leaderboard Classic' },
          { width: 160, height: 600, name: 'Skyscraper' },
          { width: 120, height: 600, name: 'Skyscraper Slim' },
          // Mobilní formáty (podle prokliků)
          { width: 480, height: 480, name: 'Mobile Square Premium', notes: 'Prémiový mobilní formát' },
          { width: 320, height: 50, name: 'Mobile Banner' },
          // Nový formát 2024
          { width: 500, height: 200, name: 'Wide Banner 2024', notes: 'Nový formát 2024, není kompatibilní s Google' },
        ],
        maxSizeKB: 250,
        fileTypes: ['JPEG', 'PNG', 'GIF'],
        docsUrl: 'https://napoveda.sklik.cz/pravidla/bannery/',
      },

      // -----------------------------------------------------------------------
      // HTML5 BANNERY
      // Zdroj: https://napoveda.sklik.cz/pravidla/html5-bannery/
      // -----------------------------------------------------------------------
      html5: {
        id: 'html5',
        name: 'HTML5 Bannery',
        description: 'Animované HTML5 bannery (max 250 kB ZIP)',
        icon: '✨',
        formats: [
          // Stejné rozměry jako statické bannery
          { width: 300, height: 600, name: 'Half-page' },
          { width: 480, height: 300, name: 'Wide Rectangle' },
          { width: 300, height: 250, name: 'Medium Rectangle' },
          { width: 970, height: 310, name: 'Big Billboard' },
          { width: 320, height: 100, name: 'Mobile Large' },
          { width: 300, height: 300, name: 'Square' },
          { width: 970, height: 210, name: 'Billboard' },
          { width: 728, height: 90, name: 'Leaderboard' },
          { width: 160, height: 600, name: 'Skyscraper' },
          { width: 320, height: 50, name: 'Mobile Banner' },
        ],
        maxSizeKB: 250,
        fileTypes: ['ZIP (HTML, CSS, JS, GIF, PNG, JPG, SVG)'],
        isHTML5: true,
        docsUrl: 'https://napoveda.sklik.cz/pravidla/html5-bannery/',
      },

      // -----------------------------------------------------------------------
      // BRANDING (Desktop)
      // Zdroj: https://napoveda.sklik.cz/pravidla/branding/
      // DŮLEŽITÉ: Safe Zone - hlavní sdělení musí být v prostoru 1366×720 px nahoře
      // -----------------------------------------------------------------------
      branding: {
        id: 'branding',
        name: 'Branding',
        description: 'Prémiový wallpaper formát (CPT 150-250 Kč)',
        icon: '🏠',
        formats: [
          { 
            width: 2000, 
            height: 1400, 
            name: 'Desktop Branding',
            safeZone: {
              // Hlavní sdělení musí být v horních 720px
              top: 0,
              right: 317, // (2000 - 1366) / 2
              bottom: 680, // 1400 - 720
              left: 317,
              centerWidth: 1366, // Šířka hlavního prostoru
              visibleHeight: 720, // Výška hlavního prostoru
              description: 'Hlavní sdělení (texty, logotypy) POUZE v prostoru 1366×720 px nahoře. ' +
                          'Mimo tuto zónu smí být pouze pozadí/fotografie. ' +
                          'Min. ochranná vzdálenost 100 px od okraje.'
            },
            notes: 'JPG/PNG/GIF, max 500 kB. Text max 1/2 viditelné plochy.'
          },
        ],
        maxSizeKB: 500,
        fileTypes: ['JPG', 'PNG', 'GIF'],
        recommendedCPT: { min: 150, max: 250 },
        docsUrl: 'https://napoveda.sklik.cz/pravidla/branding/',
      },

      // -----------------------------------------------------------------------
      // INTERSCROLLER (Mobilní)
      // Zdroj: https://napoveda.sklik.cz/pravidla/interscroller/
      // DŮLEŽITÉ: Safe Zone - hlavní sdělení v prostoru 700×920 px
      // -----------------------------------------------------------------------
      interscroller: {
        id: 'interscroller',
        name: 'Interscroller',
        description: 'Největší mobilní formát (CPT od 70 Kč)',
        icon: '📱',
        formats: [
          { 
            width: 720, 
            height: 1280, 
            name: 'Mobile Interscroller',
            safeZone: {
              // Hlavní sdělení v prostoru 700×920
              top: 180, // (1280 - 920) / 2
              right: 10, // (720 - 700) / 2
              bottom: 180,
              left: 10,
              centerWidth: 700,
              visibleHeight: 920,
              description: 'Hlavní sdělení (texty, logotypy) POUZE v prostoru 700×920 px uprostřed. ' +
                          'Mimo tuto zónu smí být pouze pozadí/fotografie.'
            },
            notes: 'JPG/PNG/GIF nebo HTML5, max 250 kB'
          },
        ],
        maxSizeKB: 250,
        fileTypes: ['JPG', 'PNG', 'GIF', 'HTML5 (ZIP)'],
        recommendedCPT: { min: 70, max: 150 },
        docsUrl: 'https://napoveda.sklik.cz/pravidla/interscroller/',
      },

      // -----------------------------------------------------------------------
      // ZBOŽÍ.CZ
      // Speciální formáty pro Zboží.cz
      // -----------------------------------------------------------------------
      zbozi: {
        id: 'zbozi',
        name: 'Zboží.cz',
        description: 'Bannery pro Zboží.cz (max 100 kB)',
        icon: '🛒',
        formats: [
          { width: 970, height: 310, name: 'Desktop', notes: 'Pro desktop' },
          { width: 300, height: 300, name: 'Mobile', notes: 'Pro mobily' },
        ],
        maxSizeKB: 100,
        fileTypes: ['JPG', 'PNG', 'GIF'],
      },

      // -----------------------------------------------------------------------
      // VIDEO REKLAMA
      // Zdroj: https://napoveda.sklik.cz/reklamy/videoreklama/
      // -----------------------------------------------------------------------
      video: {
        id: 'video',
        name: 'Video reklama',
        description: 'Videospot a Bumper pro Stream.cz a partnery',
        icon: '🎬',
        formats: [
          { width: 1920, height: 1080, name: 'Landscape 16:9', ratio: '16:9', isVideo: true },
          { width: 1080, height: 1920, name: 'Vertical 9:16', ratio: '9:16', isVideo: true },
          { width: 1080, height: 1080, name: 'Square 1:1', ratio: '1:1', isVideo: true },
        ],
        maxSizeKB: 102400, // 100 MB
        fileTypes: ['MP4 (H.264, max 30 fps)'],
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
      // PERFORMANCE MAX - OBRÁZKY
      // Zdroj: https://support.google.com/google-ads/answer/13676244
      // Max 5 MB (5120 KB) per image
      // -----------------------------------------------------------------------
      pmax: {
        id: 'pmax',
        name: 'P-Max Obrázky',
        description: 'Marketingové obrázky pro Performance Max (max 5 MB)',
        icon: '🚀',
        isPMax: true,
        formats: [
          // Landscape (1.91:1) - POVINNÝ
          { 
            width: 1200, 
            height: 628, 
            name: 'Landscape', 
            ratio: '1.91:1',
            minWidth: 600,
            minHeight: 314,
            recommendedWidth: 1200,
            recommendedHeight: 628,
            notes: 'Povinný. Min 1, max 20 obrázků.'
          },
          // Square (1:1) - POVINNÝ
          { 
            width: 1200, 
            height: 1200, 
            name: 'Square', 
            ratio: '1:1',
            minWidth: 300,
            minHeight: 300,
            recommendedWidth: 1200,
            recommendedHeight: 1200,
            notes: 'Povinný. Min 1, max 20 obrázků.'
          },
          // Portrait (4:5) - VOLITELNÝ ale doporučený
          { 
            width: 960, 
            height: 1200, 
            name: 'Portrait', 
            ratio: '4:5',
            minWidth: 480,
            minHeight: 600,
            recommendedWidth: 960,
            recommendedHeight: 1200,
            notes: 'Volitelný, ale silně doporučený. Max 20 obrázků.'
          },
        ],
        maxSizeKB: 5120, // 5 MB
        fileTypes: ['JPG', 'PNG'],
        docsUrl: 'https://support.google.com/google-ads/answer/13676244',
      },

      // -----------------------------------------------------------------------
      // PERFORMANCE MAX - LOGA
      // Zdroj: https://support.google.com/google-ads/answer/13676244
      // -----------------------------------------------------------------------
      logos: {
        id: 'logos',
        name: 'P-Max Loga',
        description: 'Loga pro Performance Max (průhledné pozadí)',
        icon: '⭐',
        isPMax: true,
        formats: [
          // Square Logo (1:1) - POVINNÝ min 1
          { 
            width: 1200, 
            height: 1200, 
            name: 'Square Logo', 
            ratio: '1:1',
            minWidth: 128,
            minHeight: 128,
            recommendedWidth: 1200,
            recommendedHeight: 1200,
            notes: 'Povinný min 1. Max 5. Průhledné nebo bílé pozadí.'
          },
          // Landscape Logo (4:1) - VOLITELNÝ
          { 
            width: 1200, 
            height: 300, 
            name: 'Landscape Logo', 
            ratio: '4:1',
            minWidth: 512,
            minHeight: 128,
            recommendedWidth: 1200,
            recommendedHeight: 300,
            notes: 'Volitelný. Max 5. Průhledné nebo bílé pozadí.'
          },
        ],
        maxSizeKB: 5120,
        fileTypes: ['PNG (průhlednost)', 'JPG'],
        docsUrl: 'https://support.google.com/google-ads/answer/13676244',
      },

      // -----------------------------------------------------------------------
      // RESPONSIVE DISPLAY ADS (RDA) / DEMAND GEN
      // Kompatibilní se Sklik kombinovanou reklamou
      // -----------------------------------------------------------------------
      rda: {
        id: 'rda',
        name: 'Responsive Display',
        description: 'RDA & Demand Gen assety (max 5 MB)',
        icon: '🎯',
        formats: [
          { 
            width: 1200, 
            height: 628, 
            name: 'Landscape', 
            ratio: '1.91:1',
            minWidth: 600,
            minHeight: 314,
            notes: 'Může být oříznut o 5% na stranách'
          },
          { 
            width: 1200, 
            height: 1200, 
            name: 'Square', 
            ratio: '1:1',
            minWidth: 300,
            minHeight: 300,
          },
          { 
            width: 1200, 
            height: 1200, 
            name: 'Logo Square', 
            ratio: '1:1',
            minWidth: 128,
            minHeight: 128,
            notes: 'Logo - průhledné nebo bílé pozadí'
          },
          { 
            width: 1200, 
            height: 300, 
            name: 'Logo Landscape', 
            ratio: '4:1',
            minWidth: 512,
            minHeight: 128,
            notes: 'Logo - průhledné nebo bílé pozadí'
          },
        ],
        maxSizeKB: 5120,
        fileTypes: ['JPG', 'PNG'],
      },

      // -----------------------------------------------------------------------
      // DISPLAY BANNERY (GDN)
      // Zdroj: https://support.google.com/google-ads/answer/1722096
      // Max 150 KB per image
      // -----------------------------------------------------------------------
      display: {
        id: 'display',
        name: 'Display Bannery',
        description: 'Klasické bannery pro GDN (max 150 kB)',
        icon: '📊',
        formats: [
          // Nejúspěšnější formáty (podle Google)
          { width: 300, height: 250, name: 'Medium Rectangle', notes: 'Nejpopulárnější formát' },
          { width: 336, height: 280, name: 'Large Rectangle' },
          { width: 728, height: 90, name: 'Leaderboard' },
          { width: 300, height: 600, name: 'Half-Page' },
          { width: 320, height: 100, name: 'Large Mobile Banner' },
          // Další formáty
          { width: 970, height: 90, name: 'Large Leaderboard' },
          { width: 970, height: 250, name: 'Billboard' },
          { width: 160, height: 600, name: 'Wide Skyscraper' },
          { width: 300, height: 1050, name: 'Portrait' },
          { width: 930, height: 180, name: 'Top Banner' },
          { width: 250, height: 250, name: 'Square' },
          { width: 200, height: 200, name: 'Small Square' },
          // Mobilní
          { width: 320, height: 50, name: 'Mobile Leaderboard' },
          { width: 300, height: 50, name: 'Mobile Banner' },
          // HD varianty (2x) - Google akceptuje
          { width: 600, height: 500, name: 'Medium Rectangle HD', notes: '2x verze 300×250' },
          { width: 600, height: 1200, name: 'Half-Page HD', notes: '2x verze 300×600' },
        ],
        maxSizeKB: 150,
        fileTypes: ['JPG', 'PNG', 'GIF'],
        docsUrl: 'https://support.google.com/google-ads/answer/1722096',
      },

      // -----------------------------------------------------------------------
      // YOUTUBE / VIDEO
      // Pro P-Max a Video kampaně
      // -----------------------------------------------------------------------
      youtube: {
        id: 'youtube',
        name: 'YouTube Video',
        description: 'Video assety pro P-Max a Video kampaně',
        icon: '▶️',
        formats: [
          { 
            width: 1920, 
            height: 1080, 
            name: 'Landscape 16:9', 
            ratio: '16:9', 
            isVideo: true,
            notes: 'Min 10 sekund. Doporučeno pod 30 sekund.'
          },
          { 
            width: 1080, 
            height: 1920, 
            name: 'Vertical 9:16 (Shorts)', 
            ratio: '9:16', 
            isVideo: true,
            notes: 'Pro YouTube Shorts a mobilní placement'
          },
          { 
            width: 1080, 
            height: 1080, 
            name: 'Square 1:1', 
            ratio: '1:1', 
            isVideo: true,
            notes: 'Pro Gmail a Discovery'
          },
          { 
            width: 1280, 
            height: 720, 
            name: 'YouTube Thumbnail', 
            ratio: '16:9',
            notes: 'Náhledový obrázek pro video'
          },
        ],
        maxSizeKB: 256000000, // YouTube limit
        fileTypes: ['MP4 (H.264 + AAC)', 'MOV', 'AVI'],
      },
    },
  },
}

// ============================================================================
// HELPER FUNKCE
// ============================================================================

/**
 * Vytvoří unikátní klíč pro formát
 */
export const getFormatKey = (platform: string, category: string, index: number): string => 
  `${platform}-${category}-${index}`

/**
 * Parsuje klíč formátu zpět na komponenty
 */
export const parseFormatKey = (key: string): { platform: string; category: string; index: number } => {
  const [platform, category, index] = key.split('-')
  return { platform, category, index: parseInt(index) }
}

/**
 * Získá kategorii podle klíče
 */
export const getCategoryByKey = (key: string): { platform: Platform; category: typeof platforms.sklik.categories.bannery } | null => {
  const { platform, category } = parseFormatKey(key)
  const platformData = platforms[platform]
  if (!platformData) return null
  const categoryData = platformData.categories[category]
  if (!categoryData) return null
  return { platform: platformData, category: categoryData }
}

/**
 * Kontroluje, zda formát má safe zone
 */
export const hasSafeZone = (format: typeof platforms.sklik.categories.branding.formats[0]): boolean => {
  return !!format.safeZone
}

/**
 * Vrátí všechny formáty s safe zone
 */
export const getFormatsWithSafeZones = (): Array<{ platform: string; category: string; format: typeof platforms.sklik.categories.branding.formats[0] }> => {
  const result: Array<{ platform: string; category: string; format: typeof platforms.sklik.categories.branding.formats[0] }> = []
  
  for (const [platformId, platform] of Object.entries(platforms)) {
    for (const [categoryId, category] of Object.entries(platform.categories)) {
      for (const format of category.formats) {
        if (format.safeZone) {
          result.push({ platform: platformId, category: categoryId, format })
        }
      }
    }
  }
  
  return result
}

/**
 * Vrátí kompatibilní formáty mezi Sklik a Google
 * (kombinovaná reklama <-> responsive display)
 */
export const getCompatibleFormats = (): { sklik: string[]; google: string[] } => {
  return {
    sklik: ['kombinovana'],
    google: ['rda', 'pmax'],
  }
}

/**
 * Kontroluje, zda velikost souboru vyhovuje limitu
 */
export const checkSizeLimit = (sizeKB: number, maxSizeKB: number): { passed: boolean; percentage: number; overBy: number } => {
  const percentage = (sizeKB / maxSizeKB) * 100
  return {
    passed: sizeKB <= maxSizeKB,
    percentage,
    overBy: Math.max(0, sizeKB - maxSizeKB),
  }
}
