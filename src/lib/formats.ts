/**
 * AdCreative Studio - Format Definitions
 * 
 * Sources:
 * - Sklik Bannery: https://napoveda.sklik.cz/en/display-network/types-of-ads/banners/overview-of-supported-banner-formats/
 * - Sklik Kombinovaná: https://napoveda.sklik.cz/pravidla/kombinovana-reklama/
 * - Sklik Branding: https://napoveda.sklik.cz/pravidla/branding/
 * - Google P-Max: https://support.google.com/google-ads/answer/14530211
 * - Google Display: https://support.google.com/google-ads/answer/1722096
 */

export interface Format {
    id: string
    name: string
    width: number
    height: number
    ratio?: string
    category: string
    platform: 'sklik' | 'google'
    maxSizeKB?: number
}

export interface FormatCategory {
    id: string
    name: string
    description: string
    platform: 'sklik' | 'google'
    formats: Format[]
    docsUrl?: string
}

// ============================================================================
// SKLIK FORMATS
// ============================================================================

export const sklikFormats: FormatCategory[] = [
    {
        id: 'sklik-kombinovana',
        name: 'Kombinovaná reklama',
        description: 'Hlavní formát pro obsahovou síť',
        platform: 'sklik',
        docsUrl: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/',
        formats: [
            { id: 'sklik-1200x628', name: 'Landscape', width: 1200, height: 628, ratio: '1.91:1', category: 'kombinovana', platform: 'sklik', maxSizeKB: 200 },
            { id: 'sklik-300x300', name: 'Čtverec', width: 300, height: 300, ratio: '1:1', category: 'kombinovana', platform: 'sklik', maxSizeKB: 200 },
            { id: 'sklik-1200x1200', name: 'Čtverec HD', width: 1200, height: 1200, ratio: '1:1', category: 'kombinovana', platform: 'sklik', maxSizeKB: 200 },
        ]
    },
    {
        id: 'sklik-bannery',
        name: 'Bannery',
        description: 'Standardní bannerové formáty',
        platform: 'sklik',
        docsUrl: 'https://napoveda.sklik.cz/en/display-network/types-of-ads/banners/overview-of-supported-banner-formats/',
        formats: [
            // Leaderboard
            { id: 'sklik-728x90', name: 'Leaderboard', width: 728, height: 90, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            { id: 'sklik-970x90', name: 'Large Leaderboard', width: 970, height: 90, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            // Rectangle
            { id: 'sklik-300x250', name: 'Medium Rectangle', width: 300, height: 250, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            { id: 'sklik-336x280', name: 'Large Rectangle', width: 336, height: 280, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            // Skyscraper
            { id: 'sklik-160x600', name: 'Wide Skyscraper', width: 160, height: 600, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            { id: 'sklik-120x600', name: 'Skyscraper', width: 120, height: 600, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            { id: 'sklik-300x600', name: 'Half Page', width: 300, height: 600, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            // Square
            { id: 'sklik-250x250', name: 'Square', width: 250, height: 250, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            // Billboard
            { id: 'sklik-970x250', name: 'Billboard', width: 970, height: 250, category: 'bannery', platform: 'sklik', maxSizeKB: 200 },
            { id: 'sklik-970x310', name: 'Large Billboard', width: 970, height: 310, category: 'bannery', platform: 'sklik', maxSizeKB: 200 },
            // Mobile
            { id: 'sklik-320x50', name: 'Mobile Banner', width: 320, height: 50, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
            { id: 'sklik-320x100', name: 'Large Mobile Banner', width: 320, height: 100, category: 'bannery', platform: 'sklik', maxSizeKB: 150 },
        ]
    },
    {
        id: 'sklik-branding',
        name: 'Branding',
        description: 'Prémiové brandingové formáty',
        platform: 'sklik',
        docsUrl: 'https://napoveda.sklik.cz/pravidla/branding/',
        formats: [
            { id: 'sklik-branding-2560x1440', name: 'Branding Wallpaper', width: 2560, height: 1440, category: 'branding', platform: 'sklik', maxSizeKB: 400 },
            { id: 'sklik-branding-1920x1080', name: 'Branding HD', width: 1920, height: 1080, category: 'branding', platform: 'sklik', maxSizeKB: 400 },
        ]
    },
]

// ============================================================================
// GOOGLE ADS FORMATS
// ============================================================================

export const googleFormats: FormatCategory[] = [
    {
        id: 'google-pmax',
        name: 'Performance Max',
        description: 'Assety pro P-Max kampaně',
        platform: 'google',
        docsUrl: 'https://support.google.com/google-ads/answer/14530211',
        formats: [
            { id: 'google-1200x1200', name: 'Square (1:1)', width: 1200, height: 1200, ratio: '1:1', category: 'pmax', platform: 'google', maxSizeKB: 5120 },
            { id: 'google-1200x628', name: 'Landscape (1.91:1)', width: 1200, height: 628, ratio: '1.91:1', category: 'pmax', platform: 'google', maxSizeKB: 5120 },
            { id: 'google-960x1200', name: 'Portrait (4:5)', width: 960, height: 1200, ratio: '4:5', category: 'pmax', platform: 'google', maxSizeKB: 5120 },
        ]
    },
    {
        id: 'google-display',
        name: 'Display Network',
        description: 'Formáty pro obsahovou síť',
        platform: 'google',
        docsUrl: 'https://support.google.com/google-ads/answer/1722096',
        formats: [
            // Leaderboard
            { id: 'google-728x90', name: 'Leaderboard', width: 728, height: 90, category: 'display', platform: 'google', maxSizeKB: 150 },
            { id: 'google-970x90', name: 'Large Leaderboard', width: 970, height: 90, category: 'display', platform: 'google', maxSizeKB: 150 },
            // Rectangle
            { id: 'google-300x250', name: 'Medium Rectangle', width: 300, height: 250, category: 'display', platform: 'google', maxSizeKB: 150 },
            { id: 'google-336x280', name: 'Large Rectangle', width: 336, height: 280, category: 'display', platform: 'google', maxSizeKB: 150 },
            // Skyscraper
            { id: 'google-160x600', name: 'Wide Skyscraper', width: 160, height: 600, category: 'display', platform: 'google', maxSizeKB: 150 },
            { id: 'google-300x600', name: 'Half Page', width: 300, height: 600, category: 'display', platform: 'google', maxSizeKB: 150 },
            // Square
            { id: 'google-250x250', name: 'Square', width: 250, height: 250, category: 'display', platform: 'google', maxSizeKB: 150 },
            { id: 'google-200x200', name: 'Small Square', width: 200, height: 200, category: 'display', platform: 'google', maxSizeKB: 150 },
            // Billboard
            { id: 'google-970x250', name: 'Billboard', width: 970, height: 250, category: 'display', platform: 'google', maxSizeKB: 150 },
            // Mobile
            { id: 'google-320x50', name: 'Mobile Leaderboard', width: 320, height: 50, category: 'display', platform: 'google', maxSizeKB: 150 },
            { id: 'google-320x100', name: 'Large Mobile Banner', width: 320, height: 100, category: 'display', platform: 'google', maxSizeKB: 150 },
        ]
    },
]

// ============================================================================
// HELPERS
// ============================================================================

export function getAllFormats(platform?: 'sklik' | 'google'): Format[] {
    const all = [...sklikFormats, ...googleFormats]
    const filtered = platform ? all.filter(c => c.platform === platform) : all
    return filtered.flatMap(c => c.formats)
}

export function getFormatById(id: string): Format | undefined {
    return getAllFormats().find(f => f.id === id)
}

export function getCategories(platform?: 'sklik' | 'google'): FormatCategory[] {
    const all = [...sklikFormats, ...googleFormats]
    return platform ? all.filter(c => c.platform === platform) : all
}

// Format source URLs for documentation
export const formatSourceUrls = {
    sklik: {
        bannery: 'https://napoveda.sklik.cz/en/display-network/types-of-ads/banners/overview-of-supported-banner-formats/',
        kombinovana: 'https://napoveda.sklik.cz/pravidla/kombinovana-reklama/',
        branding: 'https://napoveda.sklik.cz/pravidla/branding/',
        interscroller: 'https://napoveda.sklik.cz/pravidla/interscroller/',
        html5: 'https://napoveda.sklik.cz/pravidla/html5-bannery/',
        video: 'https://napoveda.sklik.cz/pravidla/video-reklama/',
    },
    google: {
        pmax: 'https://support.google.com/google-ads/answer/14530211',
        display: 'https://support.google.com/google-ads/answer/1722096',
        imageAssets: 'https://support.google.com/google-ads/answer/14530211',
        apiRequirements: 'https://developers.google.com/google-ads/api/performance-max/asset-requirements',
    }
}
