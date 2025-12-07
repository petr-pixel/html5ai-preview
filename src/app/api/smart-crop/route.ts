import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, apiKey, targetWidth, targetHeight } = await request.json()

    if (!apiKey || !imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'API klíč a obrázek jsou povinné' 
      }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Jsi expert na kompozici obrázků. Analyzuj obrázek a najdi nejlepší výřez pro formát ${targetWidth}x${targetHeight}px.
          
Odpověz POUZE v tomto JSON formátu:
{
  "focusX": 0.5,
  "focusY": 0.5,
  "description": "krátký popis hlavního objektu"
}

focusX a focusY jsou hodnoty 0-1 označující střed zájmu (0.5, 0.5 = střed obrázku).`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: `Najdi optimální střed pro výřez ${targetWidth}x${targetHeight}px. Kde je hlavní objekt/tvář/produkt?`,
            },
          ],
        },
      ],
      max_tokens: 200,
    })

    const content = response.choices[0]?.message?.content?.trim() || '{}'
    
    let result
    try {
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
      result = JSON.parse(cleanJson)
    } catch {
      result = { focusX: 0.5, focusY: 0.5, description: 'Střed obrázku' }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Smart crop error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při analýze obrázku',
      // Fallback to center
      focusX: 0.5,
      focusY: 0.5,
    }, { status: 500 })
  }
}
