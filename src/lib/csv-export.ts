/**
 * CSV Export Generator
 * Generuje CSV soubory pro import do Sklik a Google Ads Editor
 */

import type { Format, TextOverlay, BrandKit } from '@/types'
import { getPlatformFromFormatId } from './formats'

interface ExportedCreative {
  format: Format
  filename: string
  text: TextOverlay
}

/**
 * Generuje CSV pro Sklik import
 * Formát: Responzivní reklama
 */
export function generateSklikCSV(
  creatives: ExportedCreative[],
  brandKit: BrandKit,
  campaignName: string = 'AdCreative Studio Export'
): string {
  const sklikCreatives = creatives.filter(c => getPlatformFromFormatId(c.format.id) === 'sklik')
  
  if (sklikCreatives.length === 0) {
    return ''
  }

  // Sklik CSV header for kombinovaná reklama
  const headers = [
    'Kampaň',
    'Sestava',
    'Titulek 1',
    'Titulek 2',
    'Titulek 3',
    'Popisek 1',
    'Popisek 2',
    'Obrázek 1.91:1',
    'Obrázek 1:1',
    'Logo 4:1',
    'Logo 1:1',
    'Cílová URL',
    'Zobrazovaná URL',
  ]

  // Group by text (assume same text = same ad)
  const text = sklikCreatives[0]?.text || { headline: '', subheadline: '', cta: '' }
  
  // Find images by aspect ratio
  const landscape = sklikCreatives.find(c => c.format.width / c.format.height > 1.5)?.filename || ''
  const square = sklikCreatives.find(c => Math.abs(c.format.width / c.format.height - 1) < 0.1)?.filename || ''
  const logoWide = sklikCreatives.find(c => c.format.id.includes('logo') && c.format.width / c.format.height > 3)?.filename || ''
  const logoSquare = sklikCreatives.find(c => c.format.id.includes('logo') && Math.abs(c.format.width / c.format.height - 1) < 0.1)?.filename || ''

  const rows = [
    headers.join(';'),
    [
      campaignName,
      'Sestava 1',
      text.headline || '',
      text.subheadline || '',
      '', // Titulek 3
      brandKit.description || '',
      '', // Popisek 2
      landscape,
      square,
      logoWide,
      logoSquare,
      '', // Cílová URL - user fills
      '', // Zobrazovaná URL
    ].map(escapeCSV).join(';'),
  ]

  return rows.join('\n')
}

/**
 * Generuje CSV pro Google Ads Editor
 * Formát: Responsive Display Ad
 */
export function generateGoogleAdsCSV(
  creatives: ExportedCreative[],
  brandKit: BrandKit,
  campaignName: string = 'AdCreative Studio Export'
): string {
  const googleCreatives = creatives.filter(c => getPlatformFromFormatId(c.format.id) === 'google')
  
  if (googleCreatives.length === 0) {
    return ''
  }

  // Google Ads Editor CSV header for Responsive Display Ads
  const headers = [
    'Campaign',
    'Ad Group',
    'Headlines',
    'Long headline',
    'Descriptions',
    'Business name',
    'Marketing images',
    'Square marketing images',
    'Logos',
    'Square logos',
    'Final URL',
    'Call to action text',
  ]

  const text = googleCreatives[0]?.text || { headline: '', subheadline: '', cta: '' }

  // Find images
  const landscapeImages = googleCreatives
    .filter(c => c.format.type === 'image' && c.format.width / c.format.height > 1.5)
    .map(c => c.filename)
    .slice(0, 15) // Max 15 images

  const squareImages = googleCreatives
    .filter(c => c.format.type === 'image' && Math.abs(c.format.width / c.format.height - 1) < 0.1)
    .map(c => c.filename)
    .slice(0, 15)

  const logos = googleCreatives
    .filter(c => c.format.id.includes('logo') && c.format.width / c.format.height > 2)
    .map(c => c.filename)
    .slice(0, 5)

  const squareLogos = googleCreatives
    .filter(c => c.format.id.includes('logo') && Math.abs(c.format.width / c.format.height - 1) < 0.1)
    .map(c => c.filename)
    .slice(0, 5)

  const rows = [
    headers.join(','),
    [
      campaignName,
      'Ad Group 1',
      text.headline || '',
      text.subheadline || text.headline || '',
      brandKit.description || '',
      brandKit.tagline || campaignName,
      landscapeImages.join(';') || '',
      squareImages.join(';') || '',
      logos.join(';') || '',
      squareLogos.join(';') || '',
      '', // Final URL - user fills
      text.cta || 'Learn more',
    ].map(escapeCSV).join(','),
  ]

  return rows.join('\n')
}

/**
 * Generuje souhrnný CSV s přehledem všech kreativ
 */
export function generateSummaryCSV(
  creatives: ExportedCreative[]
): string {
  const headers = [
    'Platform',
    'Category',
    'Format Name',
    'Width',
    'Height',
    'Type',
    'Filename',
    'Headline',
    'CTA',
  ]

  const rows = [
    headers.join(','),
    ...creatives.map(c => [
      getPlatformFromFormatId(c.format.id),
      c.format.id.split('-')[1] || '',
      c.format.name,
      c.format.width,
      c.format.height,
      c.format.type,
      c.filename,
      c.text.headline || '',
      c.text.cta || '',
    ].map(escapeCSV).join(',')),
  ]

  return rows.join('\n')
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generate all CSV files
 */
export function generateAllCSVs(
  creatives: ExportedCreative[],
  brandKit: BrandKit,
  campaignName?: string
): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = []

  const sklikCSV = generateSklikCSV(creatives, brandKit, campaignName)
  if (sklikCSV) {
    files.push({ filename: 'sklik-import.csv', content: sklikCSV })
  }

  const googleCSV = generateGoogleAdsCSV(creatives, brandKit, campaignName)
  if (googleCSV) {
    files.push({ filename: 'google-ads-import.csv', content: googleCSV })
  }

  const summaryCSV = generateSummaryCSV(creatives)
  files.push({ filename: 'summary.csv', content: summaryCSV })

  return files
}
