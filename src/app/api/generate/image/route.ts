import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey, size = '1024x1024', n = 1 } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API klíč není zadán' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt je povinný' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n,
      size: size as '1024x1024' | '1536x1024' | '1024x1536',
    })

    const images = response.data.map(img => img.url || img.b64_json)

    return NextResponse.json({
      success: true,
      images,
      imageUrl: images[0],
    })
  } catch (error: any) {
    console.error('Generate image error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při generování obrázku',
    }, { status: 500 })
  }
}
