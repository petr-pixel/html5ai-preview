import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL je povinná' }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract logo
    let logo: string | null = null
    const logoSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'meta[property="og:image"]',
      'img[class*="logo"]',
      'img[id*="logo"]',
      'img[alt*="logo"]',
    ]

    for (const selector of logoSelectors) {
      const el = $(selector).first()
      let src = el.attr('href') || el.attr('content') || el.attr('src')
      if (src) {
        // Make absolute URL
        if (src.startsWith('//')) {
          src = 'https:' + src
        } else if (src.startsWith('/')) {
          const urlObj = new URL(url)
          src = urlObj.origin + src
        } else if (!src.startsWith('http')) {
          const urlObj = new URL(url)
          src = urlObj.origin + '/' + src
        }
        logo = src
        break
      }
    }

    // Extract colors from CSS
    const colors: string[] = []
    const styleText = $('style').text() + (await fetchExternalCSS($, url))
    const colorRegex = /#[0-9a-fA-F]{3,6}\b|rgb\([^)]+\)|rgba\([^)]+\)/g
    const foundColors = styleText.match(colorRegex) || []
    
    // Get unique colors, prefer hex
    const uniqueColors = Array.from(new Set(foundColors))
      .filter(c => !c.includes('fff') && !c.includes('000') && !c.includes('FFF'))
      .slice(0, 10)
    colors.push(...uniqueColors)

    // Extract theme color
    const themeColor = $('meta[name="theme-color"]').attr('content')
    if (themeColor) colors.unshift(themeColor)

    // Extract texts
    const title = $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || ''
    const h1 = $('h1').first().text().trim()
    const tagline = $('meta[property="og:title"]').attr('content') || h1 || title

    // Extract font
    let fontFamily = 'Inter, sans-serif'
    const fontMatch = styleText.match(/font-family:\s*['"]?([^;'"]+)/i)
    if (fontMatch) {
      fontFamily = fontMatch[1].trim()
    }

    return NextResponse.json({
      success: true,
      brandKit: {
        logo,
        primaryColor: colors[0] || '#2563eb',
        secondaryColor: colors[1] || '#1e40af',
        accentColor: colors[2] || '#f59e0b',
        fontFamily,
        tagline: tagline.slice(0, 100),
        description: description.slice(0, 200),
        sourceUrl: url,
      },
    })
  } catch (error: any) {
    console.error('Brand extract error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při extrakci brandu',
    }, { status: 500 })
  }
}

async function fetchExternalCSS($: cheerio.CheerioAPI, baseUrl: string): Promise<string> {
  let css = ''
  const links = $('link[rel="stylesheet"]').toArray().slice(0, 3) // Max 3 stylesheets
  
  for (const link of links) {
    let href = $(link).attr('href')
    if (href) {
      if (href.startsWith('//')) href = 'https:' + href
      else if (href.startsWith('/')) href = new URL(baseUrl).origin + href
      
      try {
        const res = await fetch(href, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) css += await res.text()
      } catch {
        // Skip failed CSS
      }
    }
  }
  return css
}
