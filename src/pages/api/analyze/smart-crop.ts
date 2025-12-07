import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { imageUrl, apiKey, targetWidth, targetHeight } = req.body

  if (!imageUrl || !apiKey) {
    return res.status(400).json({ success: false, error: 'Missing imageUrl or API key' })
  }

  try {
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Jsi expert na kompozici obrázků a smart cropping pro reklamní účely.
Analyzuj obrázek a urči optimální fokusní bod pro oříznutí do formátu ${targetWidth}x${targetHeight}.

Odpověz POUZE v tomto JSON formátu, nic jiného:
{
  "focusX": 0.0-1.0,
  "focusY": 0.0-1.0,
  "confidence": 0.0-1.0,
  "objects": [
    {"type": "typ objektu", "importance": "high/medium/low"}
  ],
  "recommendation": "krátké doporučení"
}

focusX a focusY jsou hodnoty 0-1 kde 0.5 je střed.
Preferuj obličeje, produkty, loga nebo hlavní předměty.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: `Analyzuj tento obrázek a najdi optimální fokusní bod pro oříznutí do formátu ${targetWidth}x${targetHeight}.`
            }
          ]
        }
      ],
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Parse JSON from response
    let result = {
      focusX: 0.5,
      focusY: 0.5,
      confidence: 0.7,
      objects: [],
      recommendation: ''
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        result = {
          focusX: Math.max(0, Math.min(1, parsed.focusX || 0.5)),
          focusY: Math.max(0, Math.min(1, parsed.focusY || 0.5)),
          confidence: parsed.confidence || 0.7,
          objects: parsed.objects || [],
          recommendation: parsed.recommendation || ''
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
    }

    return res.status(200).json({ 
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Smart crop error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to analyze image' 
    })
  }
}
