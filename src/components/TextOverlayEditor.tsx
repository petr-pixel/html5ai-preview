import { useAppStore } from '@/stores/app-store'
import { Button, Input, Switch } from '@/components/ui'
import { Type, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextOverlayEditorProps {
  onGenerateAI: (field: 'headline' | 'subheadline') => Promise<void>
  onApplyToImage: () => void
  isGenerating: boolean
}

export function TextOverlayEditor({ onGenerateAI, onApplyToImage, isGenerating }: TextOverlayEditorProps) {
  const { textOverlay, setTextOverlay, textModelTier, setTextModelTier } = useAppStore()

  const positions = [
    { value: 'top-left', label: 'Vlevo nahoře' },
    { value: 'top-center', label: 'Střed nahoře' },
    { value: 'top-right', label: 'Vpravo nahoře' },
    { value: 'center', label: 'Střed' },
    { value: 'bottom-left', label: 'Vlevo dole' },
    { value: 'bottom-center', label: 'Střed dole' },
    { value: 'bottom-right', label: 'Vpravo dole' },
  ] as const

  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Text overlay</span>
        </div>
        <Switch
          checked={textOverlay.enabled}
          onCheckedChange={(checked) => setTextOverlay({ enabled: checked })}
        />
      </div>

      {textOverlay.enabled && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Model pro text</p>
            <div className="inline-flex items-center rounded-full border border-border bg-background/60 p-1">
              {(['cheap', 'standard', 'best'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTextModelTier(tier)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all',
                    textModelTier === tier
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span>
                    {tier === 'cheap' ? '💸' : tier === 'standard' ? '⚡' : '👑'}
                  </span>
                  <span>
                    {tier === 'cheap'
                      ? 'Levný'
                      : tier === 'standard'
                      ? 'Standard'
                      : 'Nejlepší'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Odhad ceny za dotaz: 💸 ~0,0005 $ • ⚡ ~0,001–0,002 $ • 👑 ~0,005 $+
          </p>

          {/* Headline */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Headline</label>
            <div className="flex gap-2">
              <Input
                value={textOverlay.headline}
                onChange={(e) => setTextOverlay({ headline: e.target.value })}
                placeholder="Zimní výprodej -50%"
                className="flex-1"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => onGenerateAI('headline')}
                disabled={isGenerating}
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Subheadline */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Subheadline</label>
            <div className="flex gap-2">
              <Input
                value={textOverlay.subheadline}
                onChange={(e) => setTextOverlay({ subheadline: e.target.value })}
                placeholder="Pouze do konce týdne"
                className="flex-1"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => onGenerateAI('subheadline')}
                disabled={isGenerating}
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">CTA tlačítko</label>
              <Input
                value={textOverlay.cta}
                onChange={(e) => setTextOverlay({ cta: e.target.value })}
                placeholder="Zjistit více"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Barva CTA</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textOverlay.ctaColor}
                  onChange={(e) => setTextOverlay({ ctaColor: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Pozice textu</label>
            <select
              value={textOverlay.position}
              onChange={(e) => setTextOverlay({ position: e.target.value as typeof textOverlay.position })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Apply Button */}
          <div className="pt-2 border-t border-border">
            <Button
              onClick={onApplyToImage}
              disabled={isGenerating || (!textOverlay.headline && !textOverlay.subheadline && !textOverlay.cta)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Přidat text na obrázek
            </Button>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              Text se přidá na zdrojový obrázek
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
