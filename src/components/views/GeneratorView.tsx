import { useState } from 'react'
import { Wand2, Upload, Sparkles, ChevronRight, ChevronDown, Check, Loader2 } from 'lucide-react'
import { useStore } from '@/stores/app-store'
import { getCategories, getAllFormats, type Format } from '@/lib/formats'
import { enhancePrompt, generateImage } from '@/lib/openai'

interface GeneratorViewProps {
    onGenerate: () => void
}

export function GeneratorView({ onGenerate }: GeneratorViewProps) {
    const {
        prompt, setPrompt,
        platform, setPlatform,
        selectedFormats, toggleFormat, selectAllFormats, clearFormats,
        apiKey,
        isGenerating, setIsGenerating,
        setSourceImage,
        setCurrentView
    } = useStore()

    const [enhancing, setEnhancing] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    const categories = getCategories(platform)
    const allFormatIds = getAllFormats(platform).map(f => f.id)

    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || !apiKey) return
        setEnhancing(true)
        try {
            const enhanced = await enhancePrompt({ apiKey }, prompt, platform)
            setPrompt(enhanced)
        } catch (error) {
            console.error('Enhance failed:', error)
        }
        setEnhancing(false)
    }

    const handleGenerate = async () => {
        if (!prompt.trim() || !apiKey || selectedFormats.size === 0) return

        setIsGenerating(true)
        try {
            const result = await generateImage(
                { apiKey },
                { prompt, size: '1024x1024', quality: 'medium' }
            )
            setSourceImage(result.url)
            setCurrentView('editor')
            onGenerate()
        } catch (error) {
            console.error('Generation failed:', error)
            alert(error instanceof Error ? error.message : 'Generation failed')
        }
        setIsGenerating(false)
    }

    const handleSelectAll = () => {
        if (selectedFormats.size === allFormatIds.length) {
            clearFormats()
        } else {
            selectAllFormats(allFormatIds)
        }
    }

    const toggleCategory = (categoryId: string) => {
        const newSet = new Set(expandedCategories)
        if (newSet.has(categoryId)) {
            newSet.delete(categoryId)
        } else {
            newSet.add(categoryId)
        }
        setExpandedCategories(newSet)
    }

    const allSelected = selectedFormats.size === allFormatIds.length && allFormatIds.length > 0

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Hero */}
            <div className="text-center py-6">
                <h1 className="text-3xl font-bold mb-2">Vytvořte reklamní kreativy</h1>
                <p className="text-white/60">
                    Zadejte prompt → vyberte formáty → AI vygeneruje všechny kreativy
                </p>
            </div>

            {/* Main Card */}
            <div className="glass-card p-6 space-y-6">
                {/* API Key Warning */}
                {!apiKey && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                        ⚠️ Nejdříve nastavte OpenAI API klíč v <button onClick={() => setCurrentView('settings')} className="underline">Nastavení</button>
                    </div>
                )}

                {/* Prompt */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Popis kreativy</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Např: Moderní e-shop s elektronikou, slevy až 50%, dynamické pozadí s gradientem..."
                        className="input min-h-[100px] resize-none"
                    />
                    <button
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim() || !apiKey || enhancing}
                        className="mt-2 text-sm text-accent hover:text-accent-hover flex items-center gap-1 disabled:opacity-50"
                    >
                        {enhancing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        Vylepšit prompt s AI
                    </button>
                </div>

                {/* Upload Alternative */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Nebo nahrajte vlastní obrázek</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-white/40 mb-2" />
                        <p className="text-white/60 text-sm">Přetáhněte sem nebo klikněte</p>
                    </div>
                </div>

                {/* Platform Toggle */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Platforma</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setPlatform('sklik'); clearFormats() }}
                            className={`flex-1 p-3 rounded-xl border transition-all ${platform === 'sklik'
                                    ? 'border-accent bg-accent/10 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/20'
                                }`}
                        >
                            <span className="font-medium">🇨🇿 Sklik</span>
                        </button>
                        <button
                            onClick={() => { setPlatform('google'); clearFormats() }}
                            className={`flex-1 p-3 rounded-xl border transition-all ${platform === 'google'
                                    ? 'border-accent bg-accent/10 text-white'
                                    : 'border-white/10 text-white/60 hover:border-white/20'
                                }`}
                        >
                            <span className="font-medium">🌐 Google Ads</span>
                        </button>
                    </div>
                </div>

                {/* Format Selection */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-white/60">Formáty ({selectedFormats.size} vybráno)</label>
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-accent hover:text-accent-hover"
                        >
                            {allSelected ? 'Zrušit vše' : 'Vybrat vše'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {categories.map((category) => (
                            <div key={category.id} className="border border-white/10 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedCategories.has(category.id) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        <span className="font-medium">{category.name}</span>
                                        <span className="text-xs text-white/40">
                                            ({category.formats.filter(f => selectedFormats.has(f.id)).length}/{category.formats.length})
                                        </span>
                                    </div>
                                </button>

                                {expandedCategories.has(category.id) && (
                                    <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {category.formats.map((format) => (
                                            <button
                                                key={format.id}
                                                onClick={() => toggleFormat(format.id)}
                                                className={`p-2 rounded-lg border text-left text-sm transition-all ${selectedFormats.has(format.id)
                                                        ? 'border-accent bg-accent/10'
                                                        : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{format.name}</span>
                                                    {selectedFormats.has(format.id) && (
                                                        <Check className="w-4 h-4 text-accent" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-white/40">
                                                    {format.width}×{format.height}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || !apiKey || selectedFormats.size === 0 || isGenerating}
                    className="btn-accent w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generuji...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            Generovat {selectedFormats.size} kreativ
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
