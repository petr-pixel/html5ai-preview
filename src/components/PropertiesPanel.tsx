import React from 'react'
import { useAppStore } from '@/stores/app-store'
import { Settings, Image as ImageIcon, Type, Palette, Wand2, Crop, Trash2, Sliders, Check, Layers, Zap } from 'lucide-react'
import { Button, Input, Switch } from '@/components/ui'

export function PropertiesPanel() {
  const {
    activeBrandKit, brandKits,
    textOverlay, setTextOverlay,
    platform, setPlatform,
    category, setCategory,
    selectedFormats, clearSelection,
    isGenerating, setIsGenerating
  } = useAppStore()

  // Calculate selection stats
  const selectionCount = selectedFormats.length
  const hasSelection = selectionCount > 0

  const currentBrandKit = brandKits.find(kit => kit.id === activeBrandKit) || brandKits[0]

  return (
    <div className="w-full h-full bg-[#0F1115]/80 backdrop-blur-xl border-l border-white/5 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center px-4 justify-between">
        <span className="text-white font-medium text-sm">Vlastnosti</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">

        {/* Selection Context (Priority) */}
        {hasSelection && (
          <section className="space-y-3 bg-violet-500/10 p-3 rounded-xl border border-violet-500/20">
            <div className="flex items-center justify-between text-violet-300">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                <Layers className="w-3 h-3" />
                <span>Výběr ({selectionCount})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-6 px-2 text-[10px] hover:bg-violet-500/20 text-violet-300 hover:text-violet-100"
              >
                Zrušit
              </Button>
            </div>

            <div className="flex gap-2">
              <Button className="w-full btn-gradient py-2 h-auto text-xs">
                <Zap className="w-3 h-3 mr-1.5" />
                Generovat ({selectionCount})
              </Button>
            </div>
          </section>
        )}

        {/* Project Settings Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider font-semibold">
            <Sliders className="w-3 h-3" />
            <span>Projekt</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-white/70 text-xs">Platforma</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPlatform('sklik')}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${platform === 'sklik'
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                    }`}
                >
                  Sklik
                </button>
                <button
                  onClick={() => setPlatform('google')}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${platform === 'google'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                    }`}
                >
                  Google Ads
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="h-px bg-white/5" />

        {/* Brand Kit Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider font-semibold">
            <Palette className="w-3 h-3" />
            <span>Brand Kit</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              {currentBrandKit?.logoMain ? (
                <div className="w-8 h-8 rounded bg-white/10 p-1">
                  <img src={currentBrandKit.logoMain} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-gradient-to-br from-violet-500 to-cyan-500" />
              )}
              <div>
                <div className="text-white text-sm font-medium">{currentBrandKit?.name || 'Default Brand'}</div>
                <div className="text-white/40 text-xs">Aktivní kit</div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="h-6 flex-1 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/70">
                {currentBrandKit?.primaryColor}
              </div>
              <div className="h-6 flex-1 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/70">
                {currentBrandKit?.secondaryColor}
              </div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="h-px bg-white/5" />

        {/* Global Text Settings */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider font-semibold">
              <Type className="w-3 h-3" />
              <span>Text Overlay</span>
            </div>
            <Switch
              checked={textOverlay.enabled}
              onCheckedChange={(checked) => setTextOverlay({ enabled: checked })}
              className="scale-75"
            />
          </div>

          {textOverlay.enabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-white/70 text-xs">Headline</label>
                <Input
                  value={textOverlay.headline}
                  onChange={(e) => setTextOverlay({ headline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-sm focus:border-violet-500/50"
                  placeholder="Nadpis..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-white/70 text-xs">CTA</label>
                <Input
                  value={textOverlay.cta}
                  onChange={(e) => setTextOverlay({ cta: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-sm focus:border-violet-500/50"
                  placeholder="Tlačítko..."
                />
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
