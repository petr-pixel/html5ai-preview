import { useState } from 'react'
import { useAppStore } from '@/stores/app-store'
import { Button, Card, Progress, Spinner, Badge } from '@/components/ui'
import { cn, generateId } from '@/lib/utils'
import { generateImageVariants, PRICING, getImageModel } from '@/lib/openai-client'
import { Images, Plus, Check, Trash2 } from 'lucide-react'
import type { SourceImageVariant } from '@/types'

export function SourceVariantsPanel() {
  const {
    prompt,
    sourceFormat,
    sourceVariants,
    activeSourceVariant,
    imageModelTier,
    apiKeys,
    setSourceVariants,
    setActiveSourceVariant,
    setSourceImage,
  } = useAppStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [variantCount, setVariantCount] = useState(3)

  // Velikost podle formátu
  const getSize = () => {
    switch (sourceFormat) {
      case 'landscape':
        return '1536x1024' as const
      case 'portrait':
        return '1024x1536' as const
      default:
        return '1024x1024' as const
    }
  }

  // Odhad ceny
  const { quality } = getImageModel(imageModelTier)
  const costPerImage = PRICING.images[getSize()][quality]
  const totalCost = costPerImage * variantCount

  // Generovat varianty
  const handleGenerateVariants = async () => {
    if (!prompt.trim()) {
      alert('Nejprve zadejte prompt')
      return
    }
    if (!apiKeys.openai) {
      alert('Nejprve nastavte OpenAI API klíč')
      return
    }

    setIsGenerating(true)
    setProgress(10)

    try {
      const result = await generateImageVariants(
        { apiKey: apiKeys.openai },
        `Professional advertising image: ${prompt}. Style: clean, commercial, high quality, room for text overlay.`,
        variantCount,
        getSize(),
        quality
      )

      setProgress(80)

      if (result.success && result.images.length > 0) {
        const newVariants: SourceImageVariant[] = result.images.map((imageUrl, i) => ({
          id: generateId(),
          imageUrl,
          prompt,
          createdAt: new Date(),
          isActive: i === 0,
        }))

        // Přidat k existujícím nebo nahradit
        setSourceVariants([...sourceVariants, ...newVariants])
        
        // Aktivovat první novou variantu
        if (newVariants.length > 0) {
          setActiveSourceVariant(newVariants[0].id)
          setSourceImage(newVariants[0].imageUrl)
        }
      } else {
        throw new Error(result.error || 'Generování selhalo')
      }

      setProgress(100)
    } catch (error: any) {
      alert(`Chyba: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Smazat variantu
  const handleDeleteVariant = (id: string) => {
    const newVariants = sourceVariants.filter((v) => v.id !== id)
    setSourceVariants(newVariants)
    
    // Pokud byla aktivní, aktivovat první zbývající
    if (activeSourceVariant === id && newVariants.length > 0) {
      setActiveSourceVariant(newVariants[0].id)
      setSourceImage(newVariants[0].imageUrl)
    } else if (newVariants.length === 0) {
      setActiveSourceVariant(null)
      setSourceImage(null)
    }
  }

  // Smazat všechny
  const handleClearAll = () => {
    if (confirm('Smazat všechny varianty?')) {
      setSourceVariants([])
      setActiveSourceVariant(null)
      setSourceImage(null)
    }
  }

  if (sourceVariants.length === 0 && !isGenerating) {
    return null
  }

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Varianty obrázků</span>
          <Badge variant="secondary">{sourceVariants.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={variantCount}
            onChange={(e) => setVariantCount(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded-lg border border-border bg-background"
            disabled={isGenerating}
          >
            <option value={1}>+1</option>
            <option value={3}>+3</option>
            <option value={5}>+5</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateVariants}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? <Spinner size={14} /> : <Plus className="w-3 h-3" />}
            <span className="text-xs">${totalCost.toFixed(2)}</span>
          </Button>
          {sourceVariants.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleClearAll}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="mb-4">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-1">
            Generuji {variantCount} variant...
          </p>
        </div>
      )}

      {/* Grid variant */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {sourceVariants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => {
              setActiveSourceVariant(variant.id)
              setSourceImage(variant.imageUrl)
            }}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group',
              activeSourceVariant === variant.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-muted-foreground/30'
            )}
          >
            <img
              src={variant.imageUrl}
              alt={`Varianta`}
              className="w-full h-full object-cover"
            />
            
            {/* Active indicator */}
            {activeSourceVariant === variant.id && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Delete button on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteVariant(variant.id)
              }}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full items-center justify-center hidden group-hover:flex hover:bg-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {/* Add more button */}
        <button
          onClick={handleGenerateVariants}
          disabled={isGenerating || !prompt.trim()}
          className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Spinner size={16} />
          ) : (
            <>
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Přidat</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        Klikněte na variantu pro aktivaci. Aktivní varianta se použije pro generování bannerů.
      </p>
    </Card>
  )
}
