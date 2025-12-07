import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url, apiKey } = await request.json()

    if (!url || !apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL a API klíč jsou povinné' 
      }, { status: 400 })
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

    // Extract key information
    const title = $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || ''
    const h1 = $('h1').first().text().trim()
    const h2s = $('h2').map((_: number, el: any) => $(el).text().trim()).get().slice(0, 5)
    const buttons = $('button, a.btn, .button, [class*="cta"]')
      .map((_: number, el: any) => $(el).text().trim())
      .get()
      .filter((t: string) => t.length > 0 && t.length < 30)
      .slice(0, 5)

    // Get OG image for visual analysis
    const ogImage = $('meta[property="og:image"]').attr('content')

    // Prepare content for analysis
    const pageContent = `
      Title: ${title}
      H1: ${h1}
      Description: ${description}
      Headings: ${h2s.join(', ')}
      CTAs/Buttons: ${buttons.join(', ')}
      Has OG Image: ${ogImage ? 'Yes' : 'No'}
    `

    // Analyze with GPT-4o
    const openai = new OpenAI({ apiKey })

    const analysisPrompt = `Analyzuj tuto webovou stránku konkurence a poskytni doporučení pro tvorbu reklamních kreativ.

Stránka: ${url}
${pageContent}

Odpověz v tomto JSON formátu:
{
  "style": "popis vizuálního stylu (minimalistický, bold, corporate, moderní...)",
  "colors": ["hlavní barva hex", "sekundární barva hex", "accent barva hex"],
  "fonts": "doporučený typ fontu",
  "cta": "nejúčinnější CTA z jejich stránky",
  "strengths": ["silná stránka 1", "silná stránka 2"],
  "weaknesses": ["slabina 1", "slabina 2"],
  "recommendations": [
    "konkrétní doporučení pro vaše kreativy 1",
    "konkrétní doporučení pro vaše kreativy 2",
    "konkrétní doporučení pro vaše kreativy 3"
  ]
}

Odpověz POUZE validním JSON, nic jiného.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Jsi expert na digitální marketing a analýzu konkurence. Odpovídej pouze validním JSON.' },
        { role: 'user', content: analysisPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const analysisText = completion.choices[0]?.message?.content?.trim() || '{}'
    
    // Parse JSON response
    let analysis
    try {
      // Remove potential markdown code blocks
      const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim()
      analysis = JSON.parse(cleanJson)
    } catch {
      analysis = {
        style: 'Nepodařilo se analyzovat',
        colors: ['#2563eb', '#1e40af', '#f59e0b'],
        fonts: 'Sans-serif',
        cta: buttons[0] || 'Zjistit více',
        recommendations: ['Zkuste analýzu znovu'],
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        url,
        title,
        ...analysis,
      },
    })
  } catch (error: any) {
    console.error('Analyze error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při analýze konkurence',
    }, { status: 500 })
  }
}
