import { useState } from 'react'
import { Wand2, Upload, Sparkles, ChevronRight } from 'lucide-react'

interface GeneratorViewProps {
    onGenerate: () => void
}

export function GeneratorView({ onGenerate }: GeneratorViewProps) {
    const [prompt, setPrompt] = useState('')
    const [platform, setPlatform] = useState<'sklik' | 'google'>('sklik')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        setIsGenerating(true)
        // Simulate generation
        setTimeout(() => {
            setIsGenerating(false)
            onGenerate()
        }, 2000)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Hero */}
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold mb-3">Vytvořte reklamní kreativy</h1>
                <p className="text-white/60 text-lg">
                    Zadejte prompt nebo nahrajte obrázek → AI vygeneruje všechny formáty
                </p>
            </div>

            {/* Input Card */}
            <div className="glass-card p-6 space-y-6">
                {/* Prompt */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Popis kreativy</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Např: Moderní e-shop s elektronikou, slevy až 50%, černý pátek, dynamické pozadí..."
                        className="input min-h-[120px] resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <button className="text-sm text-accent hover:text-accent-hover flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            Vylepšit prompt s AI
                        </button>
                    </div>
                </div>

                {/* Upload */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Nebo nahrajte obrázek</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-white/20 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 mx-auto text-white/40 mb-3" />
                        <p className="text-white/60">Přetáhněte obrázek sem nebo klikněte pro výběr</p>
                        <p className="text-xs text-white/40 mt-1">PNG, JPG, WebP do 10MB</p>
                    </div>
                </div>

                {/* Platform */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Platforma</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPlatform('sklik')}
                            className={`flex-1 p-4 rounded-xl border transition-all ${platform === 'sklik'
                                    ? 'border-accent bg-accent/10 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/20'
                                }`}
                        >
                            <div className="font-medium">🇨🇿 Sklik</div>
                            <div className="text-xs mt-1 text-white/40">Seznam.cz</div>
                        </button>
                        <button
                            onClick={() => setPlatform('google')}
                            className={`flex-1 p-4 rounded-xl border transition-all ${platform === 'google'
                                    ? 'border-accent bg-accent/10 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/20'
                                }`}
                        >
                            <div className="font-medium">🌐 Google Ads</div>
                            <div className="text-xs mt-1 text-white/40">Display & P-Max</div>
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="btn-accent w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generuji...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            Generovat kreativy
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
