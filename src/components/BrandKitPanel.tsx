import { useState } from 'react'
import {
    Palette, Upload, Save, Trash2, Plus, Sparkles,
    Type, Image, Check
} from 'lucide-react'
import { useStore } from '@/stores/app-store'

interface BrandKit {
    id: string
    name: string
    primaryColor: string
    secondaryColor: string
    ctaColor: string
    textColor: string
    logoUrl: string | null
    headlineFont: string
    bodyFont: string
}

const defaultFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins',
    'Lato', 'Oswald', 'Raleway', 'Playfair Display', 'Source Sans Pro'
]

export function BrandKitPanel() {
    const { textOverlay, setTextOverlay } = useStore()

    const [brandKit, setBrandKit] = useState<BrandKit>({
        id: '1',
        name: 'Můj Brand Kit',
        primaryColor: '#f97316',
        secondaryColor: '#3b82f6',
        ctaColor: '#f97316',
        textColor: '#ffffff',
        logoUrl: null,
        headlineFont: 'Inter',
        bodyFont: 'Inter'
    })

    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            setBrandKit({ ...brandKit, logoUrl: reader.result as string })
        }
        reader.readAsDataURL(file)
    }

    const applyBrandKit = () => {
        setTextOverlay({
            ctaColor: brandKit.ctaColor,
        })
    }

    const analyzeWebsite = async () => {
        setIsAnalyzing(true)
        // Simulate AI analysis
        setTimeout(() => {
            setBrandKit({
                ...brandKit,
                primaryColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                secondaryColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
            })
            setIsAnalyzing(false)
        }, 2000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Palette className="w-6 h-6 text-accent" />
                    Brand Kit
                </h2>
                <button onClick={applyBrandKit} className="btn-accent flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" />
                    Použít
                </button>
            </div>

            {/* AI Analysis */}
            <div className="glass-card p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    AI Analýza
                </h3>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="https://vase-stranka.cz"
                        className="input flex-1 text-sm"
                    />
                    <button
                        onClick={analyzeWebsite}
                        disabled={isAnalyzing}
                        className="glass-button px-4 text-sm"
                    >
                        {isAnalyzing ? 'Analyzuji...' : 'Analyzovat'}
                    </button>
                </div>
                <p className="text-xs text-white/40">
                    AI extrahuje barvy, fonty a logo z vaší webové stránky
                </p>
            </div>

            {/* Logo */}
            <div className="glass-card p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Logo
                </h3>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {brandKit.logoUrl ? (
                            <img src={brandKit.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <Upload className="w-6 h-6 text-white/40" />
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="glass-button inline-flex items-center gap-2 text-sm cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Nahrát logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {brandKit.logoUrl && (
                            <button
                                onClick={() => setBrandKit({ ...brandKit, logoUrl: null })}
                                className="ml-2 text-red-400 text-sm hover:underline"
                            >
                                Odebrat
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Colors */}
            <div className="glass-card p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Barvy
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Primární</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={brandKit.primaryColor}
                                onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={brandKit.primaryColor}
                                onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                                className="input text-sm flex-1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Sekundární</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={brandKit.secondaryColor}
                                onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={brandKit.secondaryColor}
                                onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                                className="input text-sm flex-1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-white/60 mb-1">CTA Tlačítko</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={brandKit.ctaColor}
                                onChange={(e) => setBrandKit({ ...brandKit, ctaColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={brandKit.ctaColor}
                                onChange={(e) => setBrandKit({ ...brandKit, ctaColor: e.target.value })}
                                className="input text-sm flex-1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Text</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={brandKit.textColor}
                                onChange={(e) => setBrandKit({ ...brandKit, textColor: e.target.value })}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={brandKit.textColor}
                                onChange={(e) => setBrandKit({ ...brandKit, textColor: e.target.value })}
                                className="input text-sm flex-1"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fonts */}
            <div className="glass-card p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Fonty
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Headline Font</label>
                        <select
                            value={brandKit.headlineFont}
                            onChange={(e) => setBrandKit({ ...brandKit, headlineFont: e.target.value })}
                            className="input text-sm"
                        >
                            {defaultFonts.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Body Font</label>
                        <select
                            value={brandKit.bodyFont}
                            onChange={(e) => setBrandKit({ ...brandKit, bodyFont: e.target.value })}
                            className="input text-sm"
                        >
                            {defaultFonts.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="glass-card p-4">
                <h3 className="font-medium mb-3">Náhled</h3>
                <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: brandKit.secondaryColor + '20' }}
                >
                    <h4
                        className="text-xl font-bold mb-2"
                        style={{ color: brandKit.textColor, fontFamily: brandKit.headlineFont }}
                    >
                        Ukázkový Headline
                    </h4>
                    <p
                        className="text-sm mb-3"
                        style={{ color: brandKit.textColor + 'cc', fontFamily: brandKit.bodyFont }}
                    >
                        Toto je ukázkový podtitulek pro váš brand.
                    </p>
                    <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: brandKit.ctaColor }}
                    >
                        CTA Tlačítko
                    </button>
                </div>
            </div>
        </div>
    )
}
