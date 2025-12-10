import { useState } from 'react'
import { Key, Save } from 'lucide-react'

export function SettingsView() {
    const [apiKey, setApiKey] = useState('')
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        localStorage.setItem('openai-api-key', apiKey)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-bold">Nastavení</h1>

            <div className="glass-card p-6 space-y-6">
                {/* API Key */}
                <div>
                    <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                        <Key className="w-4 h-4" />
                        OpenAI API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
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

                {/* Save Button */}
                <button onClick={handleSave} className="btn-accent flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saved ? 'Uloženo!' : 'Uložit nastavení'}
                </button>
            </div>
        </div>
    )
}
