import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ success: false, error: 'Missing URL' })
  }

  try {
    // Fetch webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract favicon
    let favicon = ''
    const faviconEl = $('link[rel="icon"], link[rel="shortcut icon"]').first()
    if (faviconEl.length) {
      favicon = faviconEl.attr('href') || ''
      if (favicon && !favicon.startsWith('http')) {
        const urlObj = new URL(url)
        favicon = favicon.startsWith('/') 
          ? `${urlObj.origin}${favicon}`
          : `${urlObj.origin}/${favicon}`
      }
    }

    // Extract logo
    let logo = ''
    const logoEl = $('img[class*="logo"], img[alt*="logo"], img[id*="logo"]').first()
    if (logoEl.length) {
      logo = logoEl.attr('src') || ''
      if (logo && !logo.startsWith('http')) {
        const urlObj = new URL(url)
        logo = logo.startsWith('/') 
          ? `${urlObj.origin}${logo}`
          : `${urlObj.origin}/${logo}`
      }
    }

    // Extract colors from CSS
    const colorRegex = /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g
    const colorMatches = html.match(colorRegex) || []
    
    // Count color frequency
    const colorCounts: Record<string, number> = {}
    colorMatches.forEach(color => {
      const normalized = color.toLowerCase()
      // Skip common non-brand colors
      if (['#fff', '#ffffff', '#000', '#000000', '#333', '#666', '#999', '#ccc', '#eee'].includes(normalized)) {
        return
      }
      colorCounts[normalized] = (colorCounts[normalized] || 0) + 1
    })

    // Sort by frequency
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)
      .slice(0, 6)

    // Extract name from title
    const title = $('title').text().trim()
    const siteName = $('meta[property="og:site_name"]').attr('content') || 
                     title.split(/[-|–—]/)[0].trim() ||
                     new URL(url).hostname.replace('www.', '')

    // Build brand kit
    const brandKit = {
      id: 'extracted',
      name: siteName,
      logo: logo || undefined,
      favicon: favicon || undefined,
      primaryColor: sortedColors[0] || '#2563eb',
      secondaryColor: sortedColors[1] || '#1e40af',
      accentColor: sortedColors[2] || '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
      },
      description: $('meta[name="description"]').attr('content') || '',
    }

    return res.status(200).json({ 
      success: true, 
      brandKit,
      allColors: sortedColors
    })

  } catch (error: any) {
    console.error('Brand extraction error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to extract brand' 
    })
  }
}
