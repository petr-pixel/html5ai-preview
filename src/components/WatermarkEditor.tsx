import React, { useRef } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Switch } from '@/components/ui'
import { Image, Upload, Trash2, Wand2 } from 'lucide-react'

interface WatermarkEditorProps {
  onApplyToImage?: () => void
  isGenerating?: boolean
}

export function WatermarkEditor({ onApplyToImage, isGenerating }: WatermarkEditorProps = {}) {
  const { watermark, setWatermark } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const positions = [
    { value: 'top-left', label: 'Vlevo nahoře' },
    { value: 'top-right', label: 'Vpravo nahoře' },
    { value: 'bottom-left', label: 'Vlevo dole' },
    { value: 'bottom-right', label: 'Vpravo dole' },
    { value: 'center', label: 'Střed' },
  ] as const

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setWatermark({ image: ev.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Vodoznak / Logo</span>
        </div>
        <Switch
          checked={watermark.enabled}
          onCheckedChange={(checked) => setWatermark({ enabled: checked })}
        />
      </div>

      {watermark.enabled && (
        <div className="space-y-4 animate-fade-in">
          {/* Upload */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Logo / Vodoznak</label>
            {watermark.image ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-background rounded-lg overflow-hidden border border-border flex items-center justify-center">
                  <img src={watermark.image} alt="Watermark" className="max-w-full max-h-full object-contain" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWatermark({ image: null })}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Odebrat
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Nahrát logo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Pozice</label>
            <select
              value={watermark.position}
              onChange={(e) => setWatermark({ position: e.target.value as typeof watermark.position })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Opacity & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Průhlednost: {Math.round(watermark.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={watermark.opacity}
                onChange={(e) => setWatermark({ opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Velikost: {watermark.size}%
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={watermark.size}
                onChange={(e) => setWatermark({ size: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Apply Button */}
          {onApplyToImage && (
            <div className="pt-2 border-t border-border">
              <Button
                onClick={onApplyToImage}
                disabled={isGenerating || !watermark.image}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Přidat logo na obrázek
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Logo se přidá na zdrojový obrázek
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
