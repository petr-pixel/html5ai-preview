import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import * as cheerio from 'cheerio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { url, apiKey } = req.body

  if (!url || !apiKey) {
    return res.status(400).json({ success: false, error: 'Missing URL or API key' })
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

    // Extract basic info
    const title = $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || ''
    
    // Extract colors from inline styles and stylesheets
    const colorMatches = html.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || []
    const uniqueColors = Array.from(new Set(colorMatches)).slice(0, 10)

    // Extract text content
    const headlines: string[] = []
    $('h1, h2, h3').each((i, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 100) {
        headlines.push(text)
      }
    })

    // Extract CTAs
    const ctas: string[] = []
    $('button, a.btn, a.button, [class*="cta"], [class*="btn"]').each((i, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 50) {
        ctas.push(text)
      }
    })

    // Use GPT for analysis
    const openai = new OpenAI({ apiKey })

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jsi expert na analýzu konkurence a reklamní strategie.
Analyzuj informace o webu konkurenta a poskytni doporučení.

Odpověz POUZE v JSON formátu:
{
  "strengths": ["silná stránka 1", "silná stránka 2"],
  "weaknesses": ["slabá stránka 1", "slabá stránka 2"],
  "recommendations": ["doporučení 1", "doporučení 2", "doporučení 3"],
  "overallScore": 1-100,
  "toneOfVoice": "popis tónu komunikace",
  "targetAudience": "popis cílové skupiny"
}`
        },
        {
          role: 'user',
          content: `Analyzuj konkurenta:
URL: ${url}
Titulek: ${title}
Popis: ${description}
Headlines: ${headlines.slice(0, 5).join(', ')}
CTAs: ${ctas.slice(0, 5).join(', ')}
Barvy: ${uniqueColors.slice(0, 5).join(', ')}`
        }
      ],
      max_tokens: 1000,
    })

    const analysisContent = analysisResponse.choices[0]?.message?.content || ''
    
    let analysis = {
      url,
      title,
      description,
      colors: uniqueColors.slice(0, 6),
      headlines: headlines.slice(0, 5),
      ctas: ctas.slice(0, 5),
      strengths: [],
      weaknesses: [],
      recommendations: [],
      overallScore: 70,
      toneOfVoice: '',
      targetAudience: ''
    }

    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysis = { ...analysis, ...parsed }
      }
    } catch (parseError) {
      console.error('Analysis parse error:', parseError)
    }

    return res.status(200).json({ 
      success: true, 
      analysis 
    })

  } catch (error: any) {
    console.error('Competitor analysis error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to analyze competitor' 
    })
  }
}
