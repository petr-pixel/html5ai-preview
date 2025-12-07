import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { prompt, apiKey, type, brandTone, language = 'cs' } = req.body

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Missing API key' })
  }

  try {
    const openai = new OpenAI({ apiKey })

    let systemPrompt = ''
    let maxLength = 30

    switch (type) {
      case 'headline':
        systemPrompt = `Jsi expert na reklamní copywriting. Vytvoř krátký, výstižný headline pro reklamu.
Pravidla:
- Max 30 znaků
- Jazyk: ${language === 'cs' ? 'čeština' : 'angličtina'}
- ${brandTone ? `Tón: ${brandTone}` : 'Profesionální ale přátelský tón'}
- Odpověz POUZE textem headline, nic jiného`
        maxLength = 30
        break

      case 'subheadline':
        systemPrompt = `Jsi expert na reklamní copywriting. Vytvoř podnadpis pro reklamu.
Pravidla:
- Max 60 znaků
- Jazyk: ${language === 'cs' ? 'čeština' : 'angličtina'}
- ${brandTone ? `Tón: ${brandTone}` : 'Profesionální ale přátelský tón'}
- Doplňuje hlavní headline
- Odpověz POUZE textem, nic jiného`
        maxLength = 60
        break

      case 'cta':
        systemPrompt = `Jsi expert na reklamní copywriting. Vytvoř výzvu k akci (CTA) pro reklamu.
Pravidla:
- Max 20 znaků
- Jazyk: ${language === 'cs' ? 'čeština' : 'angličtina'}
- Akční sloveso na začátku
- Urgentní, motivující
- Odpověz POUZE textem CTA, nic jiného`
        maxLength = 20
        break

      default:
        systemPrompt = `Vytvoř reklamní text v ${language === 'cs' ? 'češtině' : 'angličtině'}.`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt || 'Obecná reklamní kreativa' },
      ],
      max_tokens: 50,
      temperature: 0.8,
    })

    const text = response.choices[0]?.message?.content?.trim() || ''

    return res.status(200).json({ 
      success: true, 
      text: text.slice(0, maxLength + 10), // Allow slight overflow
      type,
    })

  } catch (error: any) {
    console.error('Text generation error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate text' 
    })
  }
}
