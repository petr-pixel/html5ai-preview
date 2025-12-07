import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey, duration = 5, aspectRatio = '16:9' } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API klíč není zadán' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt je povinný' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    // Map aspect ratio to Sora format
    const sizeMap: Record<string, string> = {
      '16:9': '1920x1080',
      '9:16': '1080x1920',
      '1:1': '1080x1080',
    }

    const response = await openai.videos.generate({
      model: 'sora',
      prompt,
      duration,
      aspect_ratio: aspectRatio,
    } as any) // Type assertion because Sora API might not be in types yet

    return NextResponse.json({
      success: true,
      videoUrl: (response as any).url || (response as any).data?.[0]?.url,
      videoId: (response as any).id,
    })
  } catch (error: any) {
    console.error('Generate video error:', error)
    
    // Check if it's a "not available" error
    if (error.message?.includes('not available') || error.status === 404) {
      return NextResponse.json({
        success: false,
        error: 'Sora API není momentálně dostupná. Použijte Slideshow.',
        notAvailable: true,
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Chyba při generování videa',
    }, { status: 500 })
  }
}
