/**
 * OpenAI API Client
 */

const OPENAI_API_URL = 'https://api.openai.com/v1'

export interface OpenAIConfig {
    apiKey: string
}

export interface GenerateImageOptions {
    prompt: string
    size?: '1024x1024' | '1792x1024' | '1024x1792'
    quality?: 'low' | 'medium' | 'high'
    n?: number
}

export interface GenerateImageResult {
    url: string
    revisedPrompt?: string
}

/**
 * Test if API key is valid
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const response = await fetch(`${OPENAI_API_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        })

        if (response.ok) {
            return { valid: true }
        }

        const error = await response.json()
        return {
            valid: false,
            error: error.error?.message || `HTTP ${response.status}`
        }
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : 'Network error'
        }
    }
}

/**
 * Generate image using gpt-image-1
 */
export async function generateImage(
    config: OpenAIConfig,
    options: GenerateImageOptions
): Promise<GenerateImageResult> {
    const qualityMap = {
        low: 'low',
        medium: 'medium',
        high: 'high'
    }

    const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: options.prompt,
            size: options.size || '1024x1024',
            quality: qualityMap[options.quality || 'medium'],
            n: options.n || 1,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
    }
}

/**
 * Generate text using GPT-4o-mini
 */
export async function generateText(
    config: OpenAIConfig,
    prompt: string,
    systemPrompt?: string
): Promise<string> {
    const messages = []

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 500,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
}

/**
 * Enhance prompt for better ad creative generation
 */
export async function enhancePrompt(
    config: OpenAIConfig,
    userPrompt: string,
    platform: 'sklik' | 'google'
): Promise<string> {
    const systemPrompt = `Jsi expert na reklamní kreativy pro ${platform === 'sklik' ? 'Sklik (Seznam.cz)' : 'Google Ads'}.
Vylepši uživatelský prompt pro generování obrázku tak, aby:
1. Byl vhodný pro reklamní banner
2. Měl čistý, profesionální vzhled
3. Nechal prostor pro text overlay
4. Používal vhodné barvy a kompozici

Vrať POUZE vylepšený prompt, nic jiného.`

    return generateText(config, userPrompt, systemPrompt)
}
