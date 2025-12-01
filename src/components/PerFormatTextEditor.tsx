/**
 * PerFormatTextEditor - Jemné doladění textu pro jednotlivé formáty
 */

import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui'
import { platforms, getFormatKey } from '@/lib/platforms'
import { cn } from '@/lib/utils'
import { 
  Type, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Eye,
  EyeOff,
  Minus,
  Plus
} from 'lucide-react'

export function PerFormatTextEditor() {
  const { 
    platform, 
    category, 
    selectedFormats,
    perFormatTextSettings,
    setPerFormatTextSettings,
    resetPerFormatTextSettings,
    textOverlay
  } = useAppStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedFormatKey, setSelectedFormatKey] = useState<string | null>(null)

  // Získej vybrané formáty
  const formatsList = useMemo(() => {
    const plat = platforms[platform]
    const cat = plat?.categories[category]
    if (!cat) return []
    
    return cat.formats
      .map(f => {
        const key = getFormatKey(platform, category, f.width, f.height)
        return { key, name: f.name, width: f.width, height: f.height }
      })
      .filter(f => selectedFormats.has(f.key))
  }, [platform, category, selectedFormats])

  // Počet upravených formátů
  const modifiedCount = useMemo(() => {
    return Object.keys(perFormatTextSettings).filter(key => {
      const settings = perFormatTextSettings[key]
      return settings && (
        settings.fontSizeMultiplier !== 1.0 ||
        settings.hideHeadline ||
        settings.hideSubheadline ||
        settings.hideCta ||
        settings.customPosition
      )
    }).length
  }, [perFormatTextSettings])

  const activeFormat = formatsList.find(f => f.key === selectedFormatKey) || formatsList[0]
  const activeSettings = selectedFormatKey ? perFormatTextSettings[selectedFormatKey] : null

  const updateSetting = (key: string, value: any) => {
    if (!selectedFormatKey) return
    setPerFormatTextSettings(selectedFormatKey, { [key]: value })
  }

  if (!textOverlay.enabled || formatsList.length === 0) {
    return null
  }

  return (
    <div className="bg-secondary rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Doladění textu per-formát</span>
          {modifiedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
              {modifiedCount} upraveno
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Format selector */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Vyberte formát</label>
            <select
              value={selectedFormatKey || ''}
              onChange={(e) => setSelectedFormatKey(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              <option value="">-- Vyberte formát --</option>
              {formatsList.map(f => {
                const settings = perFormatTextSettings[f.key]
                const hasOverride = settings && (
                  settings.fontSizeMultiplier !== 1.0 ||
                  settings.hideHeadline ||
                  settings.hideSubheadline ||
                  settings.hideCta
                )
                return (
                  <option key={f.key} value={f.key}>
                    {f.width}×{f.height} {f.name} {hasOverride ? '●' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {selectedFormatKey && activeFormat && (
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Format info */}
              <div className="text-xs text-muted-foreground">
                Úpravy pro: <strong>{activeFormat.width}×{activeFormat.height}</strong> {activeFormat.name}
              </div>

              {/* Font size multiplier */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Velikost textu</label>
                  <span className="text-xs font-medium">
                    {Math.round((activeSettings?.fontSizeMultiplier || 1.0) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSetting('fontSizeMultiplier', Math.max(0.5, (activeSettings?.fontSizeMultiplier || 1.0) - 0.1))}
                    className="p-1 h-7 w-7"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={activeSettings?.fontSizeMultiplier || 1.0}
                    onChange={(e) => updateSetting('fontSizeMultiplier', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSetting('fontSizeMultiplier', Math.min(2.0, (activeSettings?.fontSizeMultiplier || 1.0) + 0.1))}
                    className="p-1 h-7 w-7"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Visibility toggles */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Zobrazit prvky</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateSetting('hideHeadline', !activeSettings?.hideHeadline)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors',
                      activeSettings?.hideHeadline
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-green-50 border-green-200 text-green-600'
                    )}
                  >
                    {activeSettings?.hideHeadline ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    Headline
                  </button>
                  <button
                    onClick={() => updateSetting('hideSubheadline', !activeSettings?.hideSubheadline)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors',
                      activeSettings?.hideSubheadline
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-green-50 border-green-200 text-green-600'
                    )}
                  >
                    {activeSettings?.hideSubheadline ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    Subheadline
                  </button>
                  <button
                    onClick={() => updateSetting('hideCta', !activeSettings?.hideCta)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors',
                      activeSettings?.hideCta
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-green-50 border-green-200 text-green-600'
                    )}
                  >
                    {activeSettings?.hideCta ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    CTA
                  </button>
                </div>
              </div>

              {/* Custom position */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Pozice (override)</label>
                <select
                  value={activeSettings?.customPosition || ''}
                  onChange={(e) => updateSetting('customPosition', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">Použít globální</option>
                  <option value="top-left">Vlevo nahoře</option>
                  <option value="top-center">Nahoře střed</option>
                  <option value="top-right">Vpravo nahoře</option>
                  <option value="center">Střed</option>
                  <option value="bottom-left">Vlevo dole</option>
                  <option value="bottom-center">Dole střed</option>
                  <option value="bottom-right">Vpravo dole</option>
                </select>
              </div>

              {/* Reset this format */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPerFormatTextSettings(selectedFormatKey, { fontSizeMultiplier: 1.0, hideHeadline: false, hideSubheadline: false, hideCta: false, customPosition: undefined })}
                className="w-full text-muted-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset tohoto formátu
              </Button>
            </div>
          )}

          {/* Reset all */}
          {modifiedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetPerFormatTextSettings}
              className="w-full"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset všech úprav ({modifiedCount})
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
