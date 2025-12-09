export function buildEnhancedPrompt(userPrompt: string, format: 'landscape' | 'square' | 'portrait'): string {
    // GPT-4o works better with natural language prompts, less keyword stuffing

    // Detekce typu obsahu z promptu
    const isProduct = /produkt|product|zboží|goods|item|věc/i.test(userPrompt)
    const isLifestyle = /lifestyle|život|living|people|lidé|osoba|člověk/i.test(userPrompt)
    const isFood = /jídlo|food|restaur|café|kafe|drink|pití|pizza|burger/i.test(userPrompt)
    const isTech = /tech|software|app|digital|mobil|phone|computer|laptop/i.test(userPrompt)
    const isNature = /příroda|nature|outdoor|hory|mountain|moře|sea|les|forest|lyž/i.test(userPrompt)
    const isFashion = /móda|fashion|oblečení|clothes|style|styl/i.test(userPrompt)

    // Kompozice podle formátu
    const compositionHint = format === 'landscape'
        ? "Use wide cinematic framing with space on the sides for text overlay."
        : format === 'portrait'
            ? "Use vertical composition with the main subject centered, leaving space at top or bottom for text."
            : "Use balanced square composition with the subject centered."

    // Styl podle typu obsahu
    let styleHint = ""

    if (isNature || userPrompt.toLowerCase().includes('lyž')) {
        styleHint = "Capture the scene like a professional outdoor/adventure photographer. Natural lighting, vivid colors, dynamic composition that conveys energy and excitement."
    } else if (isProduct) {
        styleHint = "Professional product photography with clean background, perfect studio lighting, and hero angle that showcases the product beautifully."
    } else if (isFood) {
        styleHint = "Appetizing food photography with natural lighting, shallow depth of field, and fresh vibrant colors that make the food look delicious."
    } else if (isTech) {
        styleHint = "Modern tech aesthetic with clean lines, cool tones, and sleek minimalist presentation."
    } else if (isFashion) {
        styleHint = "High-end fashion editorial style with dramatic lighting and sophisticated color palette."
    } else if (isLifestyle) {
        styleHint = "Authentic lifestyle photography capturing a genuine moment with warm, inviting atmosphere."
    } else {
        styleHint = "Professional advertising photography with perfect lighting, compelling composition, and premium quality suitable for a major brand campaign."
    }

    // Sestavení promptu pro GPT-4o - přirozený jazyk
    return `${userPrompt}

${styleHint}

${compositionHint}

Technical requirements: Photorealistic, sharp focus, professional color grading. No text, watermarks, or logos in the image. The image should look like it was shot by a top advertising photographer.`
}
