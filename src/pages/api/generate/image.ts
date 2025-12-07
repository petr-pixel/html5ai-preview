import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { prompt, apiKey, size = '1024x1024', n = 1 } = req.body

  if (!prompt || !apiKey) {
    return res.status(400).json({ success: false, error: 'Missing prompt or API key' })
  }

  try {
    const openai = new OpenAI({ apiKey })

    // Map size to valid OpenAI sizes
    let validSize: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
    if (size === '1536x1024' || size === '1792x1024') {
      validSize = '1792x1024'
    } else if (size === '1024x1536' || size === '1024x1792') {
      validSize = '1024x1792'
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1, // DALL-E 3 only supports n=1
      size: validSize,
      quality: 'hd',
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      return res.status(500).json({ success: false, error: 'No image generated' })
    }

    return res.status(200).json({ 
      success: true, 
      imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt 
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate image' 
    })
  }
}
