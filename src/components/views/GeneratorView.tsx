import { useState, useCallback } from 'react'
import { Wand2, Upload, Sparkles, ChevronRight, ChevronDown, Check, Loader2, X, AlertCircle } from 'lucide-react'
import { useStore } from '@/stores/app-store'
import { getCategories, getAllFormats } from '@/lib/formats'
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
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const categories = getCategories(platform)
    const allFormatIds = getAllFormats(platform).map(f => f.id)

    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || !apiKey) return
        setEnhancing(true)
        setError(null)
        try {
            const enhanced = await enhancePrompt({ apiKey }, prompt, platform)
            setPrompt(enhanced)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Vylepšení promptu selhalo')
        }
        setEnhancing(false)
    }

    const handleGenerate = async () => {
        if (selectedFormats.length === 0) {
            setError('Vyberte alespoň jeden formát')
            return
        }

        // If we have uploaded image, use that directly
        if (uploadedImage) {
            setSourceImage(uploadedImage)
            setCurrentView('editor')
            onGenerate()
            return
        }

        if (!prompt.trim()) {
            setError('Zadejte prompt nebo nahrajte obrázek')
            return
        }

        if (!apiKey) {
            setError('Nejdříve nastavte OpenAI API klíč v Nastavení')
            return
        }

        setIsGenerating(true)
        setError(null)
        try {
            const result = await generateImage(
                { apiKey },
                { prompt, size: '1024x1024', quality: 'medium' }
            )
            setSourceImage(result.url)
            setCurrentView('editor')
            onGenerate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generování selhalo')
        }
        setIsGenerating(false)
    }

    const handleSelectAll = () => {
        if (selectedFormats.length === allFormatIds.length) {
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

    // File upload handlers
    const handleFileUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Nahrajte prosím obrázek (PNG, JPG, WebP)')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Obrázek je příliš velký (max 10MB)')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setUploadedImage(reader.result as string)
            setError(null)
        }
        reader.readAsDataURL(file)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileUpload(file)
    }, [handleFileUpload])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileUpload(file)
    }

    const removeUploadedImage = () => {
        setUploadedImage(null)
    }

    const allSelected = selectedFormats.length === allFormatIds.length && allFormatIds.length > 0

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Hero */}
            <div className="text-center py-6">
                <h1 className="text-3xl font-bold mb-2">Vytvořte reklamní kreativy</h1>
                <p className="text-white/60">
                    Zadejte prompt → vyberte formáty → AI vygeneruje všechny kreativy
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="hover:text-red-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Main Card */}
            <div className="glass-card p-6 space-y-6">
                {/* API Key Warning */}
                {!apiKey && !uploadedImage && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                        ⚠️ Pro generování AI obrázků nastavte OpenAI API klíč v{' '}
                        <button onClick={() => setCurrentView('settings')} className="underline">Nastavení</button>
                        . Nebo nahrajte vlastní obrázek.
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
                        disabled={!!uploadedImage}
                    />
                    <button
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim() || !apiKey || enhancing || !!uploadedImage}
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

                {/* Upload */}
                <div>
                    <label className="block text-sm text-white/60 mb-2">Nebo nahrajte vlastní obrázek</label>
                    {uploadedImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10">
                            <img src={uploadedImage} alt="Nahraný obrázek" className="w-full max-h-60 object-contain bg-black/50" />
                            <button
                                onClick={removeUploadedImage}
                                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-sm text-white/80 text-center">
                                ✅ Obrázek nahrán - vyberte formáty a klikněte Generovat
                            </div>
                        </div>
                    ) : (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragging
                                    ? 'border-accent bg-accent/5'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-accent' : 'text-white/40'}`} />
                                <p className={`text-sm ${isDragging ? 'text-accent' : 'text-white/60'}`}>
                                    {isDragging ? 'Pusťte pro nahrání' : 'Přetáhněte sem nebo klikněte'}
                                </p>
                                <p className="text-xs text-white/40 mt-1">PNG, JPG, WebP do 10MB</p>
                            </label>
                        </div>
                    )}
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
                        <label className="text-sm text-white/60">Formáty ({selectedFormats.length} vybráno)</label>
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-accent hover:text-accent-hover"
                        >
                            {allSelected ? 'Zrušit vše' : 'Vybrat vše'}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
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
                                            ({category.formats.filter(f => selectedFormats.includes(f.id)).length}/{category.formats.length})
                                        </span>
                                    </div>
                                </button>

                                {expandedCategories.has(category.id) && (
                                    <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {category.formats.map((format) => (
                                            <button
                                                key={format.id}
                                                onClick={() => toggleFormat(format.id)}
                                                className={`p-2 rounded-lg border text-left text-sm transition-all ${selectedFormats.includes(format.id)
                                                        ? 'border-accent bg-accent/10'
                                                        : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{format.name}</span>
                                                    {selectedFormats.includes(format.id) && (
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
                    disabled={selectedFormats.length === 0 || isGenerating || (!prompt.trim() && !uploadedImage)}
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
                            {uploadedImage ? 'Použít obrázek' : `Generovat ${selectedFormats.length} kreativ`}
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
