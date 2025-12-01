import { useAppStore } from '@/stores/app-store'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { FlaskConical } from 'lucide-react'

export function ABTestingEditor() {
  const { abVariants, activeVariant, setABVariants, setActiveVariant, textOverlay, setTextOverlay } = useAppStore()

  const applyVariant = (variantId: 'A' | 'B' | 'C') => {
    const variant = abVariants.find(v => v.id === variantId)
    if (variant) {
      setTextOverlay({
        headline: variant.headline,
        subheadline: variant.subheadline,
        cta: variant.cta,
        ctaColor: variant.ctaColor,
      })
      setActiveVariant(variantId)
    }
  }

  const updateVariant = (variantId: 'A' | 'B' | 'C', field: string, value: string) => {
    const newVariants = abVariants.map(v =>
      v.id === variantId ? { ...v, [field]: value } : v
    )
    setABVariants(newVariants)
  }

  const syncCurrentToVariant = (variantId: 'A' | 'B' | 'C') => {
    const newVariants = abVariants.map(v =>
      v.id === variantId
        ? {
            ...v,
            headline: textOverlay.headline,
            subheadline: textOverlay.subheadline,
            cta: textOverlay.cta,
            ctaColor: textOverlay.ctaColor,
          }
        : v
    )
    setABVariants(newVariants)
    setActiveVariant(variantId)
  }

  return (
    <div className="bg-secondary rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">A/B Testování</span>
      </div>

      {/* Variant Tabs */}
      <div className="flex gap-2 mb-4">
        {abVariants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => applyVariant(variant.id)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              activeVariant === variant.id
                ? 'bg-primary text-white'
                : 'bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            Varianta {variant.id}
          </button>
        ))}
      </div>

      {/* Active Variant Editor */}
      {abVariants.map((variant) => (
        activeVariant === variant.id && (
          <div key={variant.id} className="space-y-3 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Headline</label>
              <Input
                value={variant.headline}
                onChange={(e) => updateVariant(variant.id, 'headline', e.target.value)}
                placeholder="Headline pro variantu"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Subheadline</label>
              <Input
                value={variant.subheadline}
                onChange={(e) => updateVariant(variant.id, 'subheadline', e.target.value)}
                placeholder="Subheadline pro variantu"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">CTA</label>
                <Input
                  value={variant.cta}
                  onChange={(e) => updateVariant(variant.id, 'cta', e.target.value)}
                  placeholder="CTA text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Barva</label>
                <input
                  type="color"
                  value={variant.ctaColor}
                  onChange={(e) => updateVariant(variant.id, 'ctaColor', e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => applyVariant(variant.id)}
                className="flex-1"
              >
                Použít na náhled
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => syncCurrentToVariant(variant.id)}
                className="flex-1"
              >
                Uložit aktuální
              </Button>
            </div>
          </div>
        )
      ))}

      <p className="text-xs text-muted-foreground mt-4">
        Vytvořte různé varianty textů pro A/B testování. Při generování se vytvoří kreativy pro každou variantu.
      </p>
    </div>
  )
}
