import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey, type = 'headline' } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API klíč není zadán' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    const systemPrompts: Record<string, string> = {
      headline: 'Jsi copywriter pro reklamy. Vytvoř krátký, úderný headline (max 30 znaků). Odpověz POUZE textem headline, nic jiného.',
      subheadline: 'Jsi copywriter pro reklamy. Vytvoř podtitulek pro reklamu (max 50 znaků). Odpověz POUZE textem, nic jiného.',
      cta: 'Jsi copywriter pro reklamy. Vytvoř CTA tlačítko (max 15 znaků, např. "Koupit nyní", "Zjistit více"). Odpověz POUZE textem CTA, nic jiného.',
      video: 'Jsi kreativní ředitel. Na základě popisu vytvoř prompt pro AI generování videa. Popiš scénu, pohyb kamery, atmosféru. Max 200 znaků. Odpověz POUZE promptem.',
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompts[type] || systemPrompts.headline },
        { role: 'user', content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    })

    const text = response.choices[0]?.message?.content?.trim() || ''

    return NextResponse.json({
      success: true,
      text,
    })
  } catch (error: any) {
    console.error('Generate text error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při generování textu',
    }, { status: 500 })
  }
}
