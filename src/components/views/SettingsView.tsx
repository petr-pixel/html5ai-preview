import { useState, useEffect } from 'react'
import { Key, Save, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { testApiKey } from '@/lib/openai'
import { formatSourceUrls } from '@/lib/formats'
import { useStore } from '@/stores/app-store'

export function SettingsView() {
    const { apiKey, setApiKey } = useStore()
    const [localKey, setLocalKey] = useState(apiKey)
    const [saved, setSaved] = useState(false)
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null)

    useEffect(() => {
        setLocalKey(apiKey)
    }, [apiKey])

    const handleSave = () => {
        setApiKey(localKey)
        setSaved(true)
        setTestResult(null)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleTest = async () => {
        if (!localKey) return
        setTesting(true)
        setTestResult(null)
        const result = await testApiKey(localKey)
        setTestResult(result)
        setTesting(false)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold">Nastavení</h1>

            {/* API Key Section */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    OpenAI API
                </h2>

                <div>
                    <label className="block text-sm text-white/60 mb-2">API Key</label>
                    <input
                        type="password"
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        placeholder="sk-..."
                        className="input"
                    />
                    <p className="text-xs text-white/40 mt-2">
                        Získejte API klíč na{' '}
                        <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                        >
                            platform.openai.com
                        </a>
                    </p>
                </div>

                {/* Test Result */}
                {testResult && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.valid
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                        {testResult.valid ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                <span>API klíč je platný!</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-5 h-5" />
                                <span>Chyba: {testResult.error}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleTest}
                        disabled={!localKey || testing}
                        className="glass-button flex items-center gap-2 disabled:opacity-50"
                    >
                        {testing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Otestovat
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-accent flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Uloženo!' : 'Uložit'}
                    </button>
                </div>
            </div>

            {/* Format Sources Section */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-accent" />
                    Zdroje formátů
                </h2>
                <p className="text-sm text-white/60">
                    Rozměry bannerů jsou definovány podle oficiální dokumentace platforem.
                </p>

                {/* Sklik Sources */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-white/80">🇨🇿 Sklik (Seznam.cz)</h3>
                    <div className="grid gap-2">
                        {Object.entries(formatSourceUrls.sklik).map(([key, url]) => (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                            >
                                <span className="capitalize">{key.replace(/-/g, ' ')}</span>
                                <ExternalLink className="w-4 h-4 text-white/40" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Google Sources */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-white/80">🌐 Google Ads</h3>
                    <div className="grid gap-2">
                        {Object.entries(formatSourceUrls.google).map(([key, url]) => (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                            >
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <ExternalLink className="w-4 h-4 text-white/40" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Update Note */}
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm">
                    <p className="text-white/80">
                        💡 Formáty se mohou měnit. Pokud najdete nesrovnalost, aktualizujte{' '}
                        <code className="text-accent">src/lib/formats.ts</code>
                    </p>
                </div>
            </div>
        </div>
    )
}
