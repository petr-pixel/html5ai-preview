'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Input, Modal } from '@/components/ui'
import { Settings, Key, Palette } from 'lucide-react'

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { apiKey, setApiKey, brandKit, setBrandKit } = useAppStore()
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [brandUrl, setBrandUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const saveApiKey = () => {
    setApiKey(tempApiKey)
    setSettingsOpen(false)
  }

  const extractBrand = async () => {
    if (!brandUrl) return
    setLoading(true)
    try {
      const res = await fetch('/api/brand-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brandUrl }),
      })
      const data = await res.json()
      if (data.success && data.brandKit) {
        setBrandKit(data.brandKit)
      } else {
        alert(data.error || 'Chyba při extrakci')
      }
    } catch (err) {
      alert('Chyba připojení')
    }
    setLoading(false)
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AdCreative Studio</h1>
              <p className="text-xs text-gray-500">Sklik & Google Ads</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {brandKit.logo && (
              <img src={brandKit.logo} alt="Logo" className="h-8 w-8 object-contain rounded" />
            )}
            
            <div className="flex items-center gap-1">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: brandKit.primaryColor }}
              />
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow -ml-2"
                style={{ backgroundColor: brandKit.secondaryColor }}
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Nastavení
            </Button>
          </div>
        </div>
      </header>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Nastavení"
        size="lg"
      >
        <div className="space-y-6">
          {/* API Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium">OpenAI API klíč</h3>
            </div>
            <Input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500">
              Získej na <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary-600 hover:underline">platform.openai.com</a>
            </p>
          </div>

          {/* Brand Kit */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium">Brand Kit z webu</h3>
            </div>
            <div className="flex gap-2">
              <Input
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                placeholder="https://vasefirma.cz"
                className="flex-1"
              />
              <Button onClick={extractBrand} loading={loading} variant="secondary">
                Načíst
              </Button>
            </div>
            
            {brandKit.sourceUrl && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Načteno z: {brandKit.sourceUrl}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Primární:</span>
                    <input
                      type="color"
                      value={brandKit.primaryColor}
                      onChange={(e) => setBrandKit({ primaryColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sekundární:</span>
                    <input
                      type="color"
                      value={brandKit.secondaryColor}
                      onChange={(e) => setBrandKit({ secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Accent:</span>
                    <input
                      type="color"
                      value={brandKit.accentColor}
                      onChange={(e) => setBrandKit({ accentColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={saveApiKey}>
              Uložit
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
